const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

        await page.goto('http://localhost:8080', { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('Page loaded successfully');
        await browser.close();
    } catch (e) {
        console.error('PUPPETEER EXCEPTION:', e.message);
        process.exit(1);
    }
})();
