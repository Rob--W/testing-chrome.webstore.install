/**
 * (c) 2015 Rob Wu <rob@robwu.nl> (https://robwu.nl)
 * MIT license - https://github.com/Rob--W/testing-chrome.webstore.install
 **/
/* globals chrome, CustomEvent, document, top, window */
'use strict';
var s = document.createElement('script');
s.textContent = '(' + function() {
    // Constants from chrome/renderer/extensions/webstore_bindings.cc
    var kWebstoreLinkRelation = 'chrome-webstore-item';
    var kNotInTopFrameError = 'Chrome Web Store installations can only be started by the top frame.';
    var kNoWebstoreItemLinkFoundError = 'No Chrome Web Store item link found.';
    var kInvalidWebstoreItemUrlError = 'Invalid Chrome Web Store item URL.';

    function getWebstoreItemId(preferred_store_link_url) {
        if (window !== top)
            throw new Error(kNotInTopFrameError);

        // chrome.webstore.install SHOULD be in response to a user gesture,
        // but for the purpose of testing, we do not check whether the action
        // was initiated by a user.
        
        if (!document || !document.head)
            throw new Error(kNoWebstoreItemLinkFoundError);

        var webstore_base_url = 'https://chrome.google.com/webstore/detail/';
        var children = document.head.children;
        for (var i = 0; i < children.length; ++i) {
            var elem = children[i];
            if (elem.nodeName.toUpperCase() !== 'LINK' || !elem.hasAttribute('href'))
                continue;
            if (elem.rel.toLowerCase() !== kWebstoreLinkRelation)
                continue;
            if (preferred_store_link_url && elem.href !== preferred_store_link_url)
                continue;
            if (elem.href.lastIndexOf(webstore_base_url, 0) !== 0)
                throw new Error(kInvalidWebstoreItemUrlError);
            var candidate_webstore_item_id = elem.href.slice(webstore_base_url.length);
            if (!/^[a-p]{32}$/.test(candidate_webstore_item_id))
                throw new Error(kInvalidWebstoreItemUrlError);
            return candidate_webstore_item_id;
        }
        throw new Error(kNoWebstoreItemLinkFoundError);
    }

    var _pendingInstall = false;
    chrome.webstore.install = function(url, onSuccess, onFailure) {
        // chrome/renderer/resources/extensions/webstore_custom_bindings.js
        if (_pendingInstall)
            throw new Error('A Chrome Web Store installation is already pending.');
        if (url !== undefined && typeof(url) !== 'string')
            throw new Error('The Chrome Web Store item link URL parameter must be a string.');
        if (onSuccess !== undefined && typeof onSuccess !== 'function')
            throw new Error('The success callback parameter must be a function.');
        if (onFailure !== undefined && typeof onFailure !== 'function')
            throw new Error('The failure callback parameter must be a function.');

        var webstore_item_id = getWebstoreItemId(url);
        var hasInstallListener = chrome.webstore.onInstallStageChanged.hasListeners();
        var hasProgressListener = chrome.webstore.onDownloadProgress.hasListeners();
        _pendingInstall = true;
        document.dispatchEvent(new CustomEvent('chrome.webstore.install-for-testing', {
            detail: {
                webstore_item_id: webstore_item_id,
                hasInstallListener: hasInstallListener,
                hasProgressListener: hasProgressListener
            }
        }));
        // Bind a one-time callback. Only one chrome.webstore.install can happen at the same time,
        // so using a constant event name is ok.
        document.addEventListener('chrome.webstore.install-callback-for-testing', function callback(event) {
            document.removeEventListener('chrome.webstore.install-callback-for-testing', callback);
            _pendingInstall = false;
            if (!event.detail) {
                if (onSuccess) onSuccess();
            } else if (event.detail) {
                if (onFailure) onFailure(event.detail, 'otherError');
            }
        });
    };

    // Forward events from content script to page
    document.addEventListener('chrome.webstore.onInstallStageChanged-for-testing', function(event) {
        chrome.webstore.onInstallStageChanged.dispatch(event.detail);
    });
    document.addEventListener('chrome.webstore.onDownloadProgress-for-testing', function(event) {
        chrome.webstore.onInstallStageChanged.dispatch(event.detail);
    });
} + ')();';
document.documentElement.appendChild(s);
s.remove();

document.addEventListener('chrome.webstore.install-for-testing', function(event) {
    var webstore_item_id = event.detail.webstore_item_id;
    var hasInstallListener = event.detail.hasInstallListener;
    var hasProgressListener = event.detail.hasProgressListener;

    var _pendingInstall = true;

    var port = chrome.runtime.connect({
        name: webstore_item_id
    });
    port.onMessage.addListener(function(state) {
        if (!_pendingInstall) return;
        // We assume that the extension is already installed.
        // Trigger a fake downloading event just in case
        if (state === 'downloading') {
            if (hasInstallListener)
                document.dispatchEvent(new CustomEvent('chrome.webstore.onInstallStageChanged-for-testing', {detail: 'downloading'}));
            if (hasProgressListener)
                document.dispatchEvent(new CustomEvent('chrome.webstore.onDownloadProgress-for-testing', {detail: 0}));
        } else if (state === 'installing') {
            if (hasInstallListener)
                document.dispatchEvent(new CustomEvent('chrome.webstore.onInstallStageChanged-for-testing', {detail: 'installing'}));
            if (hasProgressListener)
                document.dispatchEvent(new CustomEvent('chrome.webstore.onDownloadProgress-for-testing', {detail: 0.5}));
        } else if (state === 'completed') {
            _pendingInstall = false;
            if (hasProgressListener)
                document.dispatchEvent(new CustomEvent('chrome.webstore.onDownloadProgress-for-testing', {detail: 1}));
            document.dispatchEvent(new CustomEvent('chrome.webstore.install-callback-for-testing'));
        } else {
            _pendingInstall = false;
            // All other states are errors.
            // NOTE: These are custom errors used for debugging. The real webstore
            // API generates different error strings.
            // Errors are not expected, because we expect the installation to succeed.
            document.dispatchEvent(new CustomEvent('chrome.webstore.install-callback-for-testing', {
                detail: state || 'Unspecified error'
            }));
        }
    });
    port.onDisconnect.addListener(function() {
        if (!_pendingInstall) return;
        _pendingInstall = false;
        document.dispatchEvent(new CustomEvent('chrome.webstore.install-callback-for-testing', {
            detail: 'Port unexpectedly disconnected'
        }));
    });
});
