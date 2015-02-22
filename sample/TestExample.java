import java.io.File;
import java.lang.AssertionError;
import java.io.IOException;
import org.openqa.selenium.By;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;


/**
Get ChromeDriver: https://sites.google.com/a/chromium.org/chromedriver/getting-started
Get Selenium    : wget http://selenium-release.storage.googleapis.com/2.44/selenium-server-standalone-2.44.0.jar -O selenium-server-standalone.jar

Start the server:
java -jar selenium-server-standalone.jar

Compile this file:
javac -cp selenium-server-standalone.jar test_example.java

Run this file:
java -cp .:selenium-server-standalone.jar TestExample

If ChromeDriver is not in your PATH, or if you are using Windows, see http://stackoverflow.com/a/17014883.

 */
class TestExample {
    private WebDriver driver;

    TestExample() {
    }

    public void run() {
        File root = getRepoRoot();
        if (root == null) {
            System.err.println("Cannot find sample/ directory. Please run the code from the root of the repository.");
            return;
        }
        String load_extension_arg;
        try {
            // Load the helper extension, app and sample extension.
            String helper_ext = new File(root, "helper").getCanonicalPath();
            String helper_app = new File(root, "helper-app").getCanonicalPath();
            String sample_ext = new File(root, "sample/sample_extension").getCanonicalPath();
            load_extension_arg = String.format("load-extension=%s,%s,%s", helper_ext, helper_app, sample_ext);
            System.out.println(load_extension_arg);
        } catch (IOException e) {
            System.err.println("One of the required directories did not exist: " + e.getMessage());
            return;
        }

        ChromeOptions options = new ChromeOptions();
        options.addArguments(load_extension_arg);

        driver = (WebDriver)new ChromeDriver(options);
        try {
            runTest();
        } finally {
            driver.quit();
        }

    }

    private void runTest() {
        driver.get("https://robwu.nl/s/chrome.webstore.install-demo.html");

        String text_after_install = "The extension has been installed.";

        // Wait until button is visible
        WebElement button = (new WebDriverWait(driver, 3)).until(
                ExpectedConditions.visibilityOfElementLocated(By.id("install-extension")));
        if (button.getText().equals(text_after_install)) {
            throw new AssertionError("The extension should be disabled before running the test");
        }
        System.out.println("Triggering inline install.");
        button.click();

        System.out.println("Waiting until completion of installation.");

        // Check whether the extension is installed, by verifying that the
        // button's text equals |text_after_install|.
        new WebDriverWait(driver, 10).until(
                ExpectedConditions.textToBePresentInElement(button, text_after_install));

        System.out.println("Button found, test passed!");

    }

    private File getRepoRoot() {
        // Get the parent directory of sample = root of repository.
        String SAMPLE_DIR_NAME = "sample";
        File dir = new File(".");
        try {
            dir = dir.getCanonicalFile();
        } catch (IOException e) {
        }
        if (dir.getName().equals(SAMPLE_DIR_NAME)) {
            return dir.getParentFile();
        }
        if (new File(dir, "sample").isDirectory()) {
            return dir;
        }
        return null;
    }

    public static void main(String[] args) {
        new TestExample().run();
    }
}
