/**
 * (c) 2015 Rob Wu <rob@robwu.nl> (https://robwu.nl)
 * MIT license - https://github.com/Rob--W/testing-chrome.webstore.install
 **/
/* globals chrome, console */
'use strict';
// developerPrivate is "documented" at chrome/common/extensions/api/developer_private.idl
if (chrome.developerPrivate) {
    chrome.runtime.onMessageExternal.addListener(onMessageExternal);
} else {
    console.error('chrome.developerPrivate not available!');
}
function onMessageExternal(message, sender, sendResponse) {
    var extension_id = message.extension_id;
    if (message.type == 'enableAndReload') {
        chrome.developerPrivate.enable(extension_id, true, function() {
            if (chrome.runtime.lastError) {
                sendResponse('developerPrivate.enable error: ' + chrome.runtime.lastError.message);
                return;
            }
            chrome.developerPrivate.reload(extension_id, function() {
                if (chrome.runtime.lastError) {
                    sendResponse('developerPrivate.reload error: ' + chrome.runtime.lastError.message);
                } else {
                    sendResponse('');
                }
            });
        });
        return true;
    }
}
