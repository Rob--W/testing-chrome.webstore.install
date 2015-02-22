#!/usr/bin/env python
# This script has been tested with Python 2.7 and 3.4

# Using Selenium + ChromeDriver,
# see https://sites.google.com/a/chromium.org/chromedriver/getting-started
# and http://selenium-python.readthedocs.org/en/latest/installation.html

import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Make sure that the current directory is the root of the repo, so that
# --load-extension will succeed.
os.chdir(os.path.join(os.path.dirname(__file__)))

options = webdriver.ChromeOptions()
# Load helper extensions.
options.add_argument('load-extension=helper,helper-app,test-extension')
# Alternatively, you can zip or package every extension and use
# Note: For packaging into a .crx file, you need the private key (key.pem).
# options.add_extension('helper.zip')
# options.add_extension('helper-app.zip')
# options.add_extension('test-extension.zip')

# If you want to know what would happen without the helper extensions, use:
# options.add_argument('load-extension=test-extension')
# (spoiler: The test will fail)


# Note: chromedriver must be available within your PATH.
# If it is not available, use
# driver = webdriver.Chrome(executable_path="/path/to/chromedriver", options)
driver = webdriver.Chrome(chrome_options=options)

print('Visiting page with inline installation button')
# Visit the page with inline installation
driver.get('https://robwu.nl/s/chrome.webstore.install-demo.html')

text_after_install = 'The extension has been installed.'

try:
    # Wait until button is visible
    # http://selenium-python.readthedocs.org/en/latest/waits.html
    button = WebDriverWait(driver, 3).until(
        EC.visibility_of_element_located((By.ID, 'install-extension')))
    assert button.text != text_after_install, \
        'The extension should be disabled before running the test'
    print('Triggering inline install.')
    button.click()

    print('Waiting until completion of installation.')
    # Check whether the extension is installed, by verifying that the
    # button's text equals |text_after_install|.
    locator = (By.ID, 'install-extension')
    button = WebDriverWait(driver, 10).until(
        lambda driver: button.text == text_after_install)
    print('Button found, test passed!')
finally:
    driver.quit()
