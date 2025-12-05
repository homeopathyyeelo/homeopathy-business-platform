// Simple cookie extraction using Chrome DevTools Protocol
const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractFromOpenBrowser() {
    try {
        console.log('🔍 Looking for existing Chrome sessions...');

        // Connect to existing browser if possible
        const browser = await puppeteer.connect({
            browserURL: 'http://localhost:9222',
        }).catch(() => null);

        if (!browser) {
            console.log('⚠️  No debug browser found. Opening new one...');
            return await extractWithNewBrowser();
        }

        const pages = await browser.pages();
        const gmbPage = pages.find(p => p.url().includes('google.com'));

        if (!gmbPage) {
            console.log('⚠️  No Google page found. Opening business.google.com...');
            const newPage = await browser.newPage();
            await newPage.goto('https://business.google.com');
            await new Promise(r => setTimeout(r, 5000));
        }

        console.log('🍪 Extracting cookies...');
        const cookies = await (gmbPage || pages[0]).cookies();

        fs.writeFileSync('./cookies.json', JSON.stringify(cookies, null, 2));
        console.log(`✅ Saved ${cookies.length} cookies to cookies.json`);

        await browser.disconnect();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n📝 MANUAL METHOD: Open business.google.com in Chrome, then run:');
        console.log('   document.cookie.split(";").map(c=>c.trim()).join("\\n")');
    }
}

async function extractWithNewBrowser() {
    console.log('🚀 Opening new browser...');
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://business.google.com');

    console.log('\n⏸️  Please login manually in the browser that just opened.');
    console.log('   Press Enter here when done...\n');

    // Wait for user input
    await new Promise(resolve => {
        process.stdin.once('data', resolve);
    });

    const cookies = await page.cookies();
    fs.writeFileSync('./cookies.json', JSON.stringify(cookies, null, 2));
    console.log(`✅ Saved ${cookies.length} cookies`);

    await browser.close();
}

extractFromOpenBrowser();
