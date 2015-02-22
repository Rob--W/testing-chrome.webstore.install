/**
 * (c) 2015 Rob Wu <rob@robwu.nl> (https://robwu.nl)
 * MIT license - https://github.com/Rob--W/testing-chrome.webstore.install
 **/
/* globals chrome, console */
'use strict';

var extensions_to_disable = [
    'fjghafacfnaofjohgbnnckmliohilmlg'
];

// Extensions should not be "installed" until we enable them.
chrome.management.onInstalled.addListener(function(extension) {
    var i = extensions_to_disable.indexOf(extension.id);
    if (i >= 0) {
        // Disable only once.
        extensions_to_disable.splice(i, 1);
        chrome.management.setEnabled(extension.id, false);
    }
});

extensions_to_disable.forEach(function(id) {
    chrome.management.setEnabled(id, false, function() {
        if (!chrome.runtime.lastError) {
            // Disable only once.
            var i = extensions_to_disable.indexOf(id);
            if (i >= 0) {
                extensions_to_disable.splice(i, 1);
            }
        }
    });
});

chrome.runtime.onConnect.addListener(function(port) {
    // The only creator of the port is the content script.
    // It passes the extension ID as name.
    var webstore_item_id = port.name;
    function onFailure(error) {
        port.postMessage(error);
        port.disconnect();
    }
    chrome.management.get(webstore_item_id, function(extension) {
        if (chrome.runtime.lastError || !extension) {
            onFailure('No extension found with ID ' + webstore_item_id);
            return;
        }
        if (extension.enabled) {
            onFailure('Extension ' + webstore_item_id + ' is already enabled. Cannot simulate an "installation".');
            return;
        }
        // Simulate download & install
        port.postMessage('downloading');
        port.postMessage('installing');
        // Note: This is the ID of ./helper/app/
        chrome.runtime.sendMessage('ohmmkhmmmpcnpikjeljgnaoabkaalbgc', {
            type: 'enableAndReload',
            extension_id: webstore_item_id
        }, function(reply) {
            if (chrome.runtime.lastError || typeof reply !== 'string') {
                console.warn('Helper app unavailable. Falling back to management API.');
                // NOTE: At the moment, this will succeed. In the future, this might fail when
                // setEnabled requires a user gesture (https://code.google.com/p/chromium/issues/detail?id=178319).
                chrome.management.setEnabled(webstore_item_id, true, function() {
                    onCompleted(chrome.runtime.lastError && chrome.runtime.lastError.message);
                });
            } else {
                onCompleted(reply);
            }
        });
    });

    function onCompleted(error) {
        if (error) {
            onFailure('Unexpected error at enabling ' + webstore_item_id + ': ' + error);
        } else {
            port.postMessage('completed');
            port.disconnect();
        }
    }
});
