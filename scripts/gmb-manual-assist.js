const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { Client } = require('pg');

// Database configuration
const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/yeelo_homeopathy?sslmode=disable',
};

async function getFailedPost() {
    const client = new Client(dbConfig);
    try {
        await client.connect();
        // Fetch the most recent failed post, or draft if no failed post exists
        const res = await client.query(`
      SELECT content, topic 
      FROM gmb_posts 
      WHERE status IN ('FAILED', 'DRAFT') 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

        if (res.rows.length > 0) {
            return res.rows[0].content;
        }
        return null;
    } catch (err) {
        console.error('❌ Database error:', err.message);
        return null;
    } finally {
        await client.end();
    }
}

(async () => {
    console.log('🚀 Starting GMB Automation Assistant...');

    let postContent = process.env.POST_CONTENT;

    if (postContent) {
        console.log('📝 Using content provided via environment variable.');
    } else {
        // 1. Fetch content from DB
        console.log('📊 Fetching latest failed/draft post from database...');
        postContent = await getFailedPost();
    }

    if (!postContent) {
        console.error('❌ No content found (env var or database).');
        process.exit(1);
    }

    console.log('✅ Found post content to publish!');
    console.log('-----------------------------------');
    console.log(postContent.substring(0, 100) + '...');
    console.log('-----------------------------------');

    let browser;
    let context;
    let page;

    // 2. Try to connect to existing Chrome (Port 9222)
    try {
        console.log('🔌 Attempting to connect to existing Chrome (port 9222)...');
        browser = await chromium.connectOverCDP('http://localhost:9222');
        context = browser.contexts()[0];
        console.log('✅ Connected to existing Chrome session!');
    } catch (error) {
        console.log('⚠️  Could not connect to existing Chrome. Launching new persistent session...');

        // 3. Fallback: Launch new persistent session
        const userDataDir = path.join(__dirname, '../.chrome-session');
        if (!fs.existsSync(userDataDir)) {
            fs.mkdirSync(userDataDir, { recursive: true });
        }

        try {
            context = await chromium.launchPersistentContext(userDataDir, {
                headless: false,
                channel: 'chrome',
                viewport: null,
                args: [
                    '--start-maximized',
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-infobars',
                    '--ignore-certificate-errors'
                ],
                ignoreDefaultArgs: ['--enable-automation'],
                permissions: ['clipboard-read', 'clipboard-write'] // Grant permissions
            });
            console.log('✅ Launched new persistent Chrome session.');
        } catch (launchError) {
            console.error('❌ Failed to launch Chrome:', launchError.message);
            process.exit(1);
        }
    }

    // Grant permissions if connected to existing session
    try {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    } catch (e) { }

    // 4. Navigate to GMB
    const pages = context.pages();
    page = pages.find(p => p.url().includes('business.google.com'));

    if (page) {
        console.log('✅ Found existing GMB tab.');
        await page.bringToFront();
    } else {
        console.log('🌐 Opening new GMB tab...');
        page = await context.newPage();
        await page.goto('https://business.google.com/');
    }

    // COPY TO CLIPBOARD (Browser Context)
    try {
        console.log('📋 Copying content to browser clipboard...');
        await page.evaluate((text) => {
            return navigator.clipboard.writeText(text);
        }, postContent);
        console.log('✅ Content copied to clipboard! You can paste with Ctrl+V.');
    } catch (clipErr) {
        console.log('⚠️  Browser clipboard copy failed:', clipErr.message);
        // Fallback: Try to use a focused element if writeText failed due to focus
        try {
            await page.evaluate((text) => {
                const input = document.createElement('textarea');
                input.value = text;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
            }, postContent);
            console.log('✅ Content copied via execCommand fallback.');
        } catch (e) {
            console.log('⚠️  Fallback clipboard copy also failed.');
        }
    }

    console.log('👀 Waiting for GMB dashboard...');

    try {
        // Check if we are on the login page
        if (page.url().includes('accounts.google.com') || page.url().includes('signin')) {
            console.log('⚠️  Detected Login Page. Please log in to your Google Account in the browser window.');
            console.log('⏳ Waiting 3 minutes for you to log in...');
            await page.waitForSelector('div[role="main"]', { timeout: 180000 }); // Wait 3 mins for login
        }

        // Check if we are on the Locations list page
        if (page.url().includes('business.google.com/locations')) {
            console.log('📍 Detected Locations list. Looking for "Yeelo Homeopathy"...');
            try {
                // Try to find the business name and click it
                // Selectors might vary, so we try text match
                const businessSelector = 'text="Yeelo Homeopathy"';
                await page.waitForSelector(businessSelector, { timeout: 10000 });
                await page.click(businessSelector);
                console.log('✅ Clicked "Yeelo Homeopathy".');
                await page.waitForTimeout(5000); // Wait for navigation
            } catch (e) {
                console.log('⚠️  Could not find "Yeelo Homeopathy" in list. Please click it manually.');
            }
        }

        // Wait for main content area (default 60s)
        await page.waitForSelector('div[role="main"]', { timeout: 60000 });
        console.log('✅ Dashboard detected.');

    } catch (e) {
        console.log('⚠️  Timed out waiting for dashboard. Please navigate manually if needed.');
        // If we are in auto mode, we should probably fail here if we can't find the dashboard
        if (process.argv.includes('--auto')) {
            console.log('❌ Could not reach GMB Dashboard. Are you logged in?');
            // We don't exit here, we let the button search fail and throw the error below
        }
    }

    const isAuto = process.argv.includes('--auto');

    if (!isAuto) {
        console.log('\n🤖 Ready to Automate!');
        console.log('   Press ENTER to start the posting sequence...');
        await new Promise(resolve => process.stdin.once('data', resolve));
    } else {
        console.log('⚡ Auto mode: Starting sequence in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    try {
        console.log('🖱️  Looking for "Add update" button...');

        // Try multiple selectors
        const buttonSelectors = [
            'div[aria-label="Add update"]',
            'div[aria-label="Create post"]',
            'span:has-text("Add update")',
            'span:has-text("Create post")',
            'button:has-text("Add update")',
            'button:has-text("Create post")'
        ];

        let clicked = false;
        for (const selector of buttonSelectors) {
            try {
                if (await page.isVisible(selector)) {
                    await page.click(selector);
                    console.log(`✅ Clicked button: ${selector}`);
                    clicked = true;
                    break;
                }
            } catch (e) { }
        }

        if (!clicked) {
            console.log('⚠️  Could not find "Add update" button automatically.');
            if (!isAuto) {
                console.log('👉 Please CLICK the "Add update" button yourself, then press ENTER here...');
                await new Promise(resolve => process.stdin.once('data', resolve));
            } else {
                throw new Error('Could not find Add Update button in auto mode');
            }
        }

        // Wait for dialog
        console.log('⏳ Waiting for post dialog...');
        await page.waitForTimeout(3000);

        // Find text area
        console.log('📝 Finding text area...');

        // Try to find the dialog container first
        const dialogSelector = 'div[role="dialog"], div[role="alertdialog"]';
        let dialog = null;
        try {
            dialog = await page.$(dialogSelector);
        } catch (e) { }

        // Selectors based on the screenshot and GMB structure
        // The screenshot shows a standard Material Design text area with "Description" label
        const textAreaSelectors = [
            'textarea[aria-label="Description"]', // Most likely
            'div[aria-label="Description"][role="textbox"]', // Contenteditable alternative
            'textarea[name="description"]',
            'textarea', // Generic fallback inside dialog
            'div[contenteditable="true"]'
        ];

        let textAreaFound = false;

        for (const selector of textAreaSelectors) {
            try {
                // Search inside dialog if possible
                const element = dialog ? await dialog.$(selector) : await page.$(selector);

                if (element && await element.isVisible()) {
                    console.log(`✅ Found text area with selector: ${selector}`);
                    await element.click();
                    await element.focus();
                    textAreaFound = true;

                    console.log('⌨️  Injecting content via DOM...');

                    // Direct DOM manipulation as requested
                    await page.evaluate(({ sel, text }) => {
                        // Find the element again inside the browser context
                        // We search inside the dialog if it exists, or globally
                        let el = document.querySelector(sel);

                        // If we have a dialog open, try to find the element inside it to be safe
                        const dialog = document.querySelector('div[role="dialog"], div[role="alertdialog"]');
                        if (dialog) {
                            const innerEl = dialog.querySelector(sel);
                            if (innerEl) el = innerEl;
                        }

                        if (el) {
                            el.focus();
                            // Handle both textarea and contenteditable
                            if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                                el.value = text;
                            } else {
                                el.innerText = text;
                            }

                            // Dispatch events to ensure Angular/React/Framework picks it up
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                            el.dispatchEvent(new Event('blur', { bubbles: true })); // Sometimes needed
                        }
                    }, { sel: selector, text: postContent });

                    console.log('✅ Content injected.');
                    break;
                }
            } catch (e) {
                console.log(`⚠️ Error with selector ${selector}: ${e.message}`);
            }
        }

        if (!textAreaFound) {
            console.log('⚠️  Could not find text area by selector. Trying click-to-focus fallback...');
            // Fallback: Click the center of the dialog (if found)
            if (dialog) {
                const box = await dialog.boundingBox();
                if (box) {
                    // Click slightly offset from top-left of dialog where description usually is?
                    // Center is safer.
                    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                    console.log('�️ Clicked center of dialog. Trying keyboard type...');
                    await page.keyboard.type(postContent);
                }
            }
        }

        console.log('✅ Content step finished.');

        // NEW: Handle "Call now" button selection
        console.log('📞 Setting up "Call now" button...');
        try {
            // Click "+ Button" or "Add a button" or "None" (which opens dropdown)
            const addBtnSelectors = [
                'div[role="button"]:has-text("Button")',
                'div[aria-label="Add a button"]',
                'div:has-text("Add a button")'
            ];

            for (const sel of addBtnSelectors) {
                if (await page.isVisible(sel)) {
                    await page.click(sel);
                    console.log(`✅ Clicked button selector: ${sel}`);
                    await page.waitForTimeout(1000);

                    // Click "Call now" option
                    const callNowSelector = 'div[role="menuitem"]:has-text("Call now"), li:has-text("Call now")';
                    if (await page.isVisible(callNowSelector)) {
                        await page.click(callNowSelector);
                        console.log('✅ Selected "Call now".');
                    }
                    break;
                }
            }
        } catch (btnError) {
            console.log('⚠️  Failed to set "Call now" button:', btnError.message);
        }

        console.log('\n✨ Automation Complete!');

        if (isAuto) {
            console.log('🖱️  Attempting to click Post...');
            await page.waitForTimeout(2000);

            const postButtonSelectors = [
                'div[role="button"]:has-text("Post")',
                'button:has-text("Post")',
                'span:has-text("Post")',
                'div[role="button"]:has-text("Publish")',
                'button:has-text("Publish")'
            ];

            let postClicked = false;
            for (const selector of postButtonSelectors) {
                try {
                    // Find visible enabled post button
                    // Search inside dialog if possible
                    const btn = dialog ? await dialog.$(selector) : await page.$(selector);

                    if (btn && await btn.isVisible()) {
                        // Check if disabled
                        const isDisabled = await btn.getAttribute('disabled') !== null || await btn.getAttribute('aria-disabled') === 'true';

                        if (!isDisabled) {
                            await btn.click();
                            console.log(`✅ Clicked Post button: ${selector}`);
                            postClicked = true;
                            break;
                        } else {
                            console.log(`⚠️ Found button ${selector} but it is disabled.`);
                        }
                    }
                } catch (e) { }
            }

            if (postClicked) {
                console.log('✅ Posted successfully!');
                console.log('⏳ Closing browser in 5 seconds...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                // Only close if successful
                // await browser.close(); // Don't close for now to let user verify
            } else {
                console.log('⚠️  Post button not clicked. Keeping browser open.');
            }

        } else {
            console.log('✅ Manual mode finished. Browser stays open.');
            // if (browser) await browser.disconnect();
            // else await context.close();
        }

    } catch (error) {
        console.error('❌ Automation error:', error);
        if (isAuto) process.exit(1);
    }
    console.log('👋 Done.');
})();
