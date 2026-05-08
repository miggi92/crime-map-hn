import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Wait a bit just in case the server needs a moment to fully be interactive
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Take screenshot
  await page.screenshot({ path: 'public/screenshot.png', fullPage: true });

  await browser.close();
  console.log("Screenshot saved to public/screenshot.png");
})();
