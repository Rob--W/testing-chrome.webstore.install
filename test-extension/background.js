/**
 * (c) 2015 Rob Wu <rob@robwu.nl> (https://robwu.nl)
 * MIT license - https://github.com/Rob--W/testing-chrome.webstore.install
 **/
/* globals chrome */
'use strict';

// This example extension does nothing besides opening a landing page on start-up
chrome.runtime.onInstalled.addListener(function() {
    chrome.tabs.create({
        url: 'https://robwu.nl/s/chrome.webstore.install-demo.html?installed'
    });
});
