import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

// No stealth plugin - using cookie-based auth instead

interface PublishResult {
    success: boolean;
    url?: string;
    error?: string;
}

@Injectable()
export class BrowserService implements OnModuleInit {
    private readonly logger = new Logger(BrowserService.name);
    private browser: any;
    private cookies: any[] = [];
    private readonly cookiesPath = path.join(__dirname, '../../cookies.json');

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        await this.initBrowser();
        await this.loadCookies();
    }

    private async initBrowser() {
        this.logger.log('🚀 Initializing browser...');
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
            ],
        });
        this.logger.log('✅ Browser initialized');
    }

    private async loadCookies() {
        try {
            if (fs.existsSync(this.cookiesPath)) {
                this.cookies = JSON.parse(fs.readFileSync(this.cookiesPath, 'utf-8'));
                this.logger.log(`✅ Loaded ${this.cookies.length} cookies`);
            } else {
                this.logger.warn('⚠️  No cookies file found. Manual login required.');
            }
        } catch (error) {
            this.logger.error(`Failed to load cookies: ${error.message}`);
        }
    }

    async saveCookies(cookies: any[]) {
        fs.writeFileSync(this.cookiesPath, JSON.stringify(cookies, null, 2));
        this.cookies = cookies;
        this.logger.log(`✅ Saved ${cookies.length} cookies`);
    }

    async publishToGMB(data: { title: string; content: string }): Promise<PublishResult> {
        const page = await this.browser.newPage();

        try {
            // Load saved cookies
            if (this.cookies.length > 0) {
                await page.setCookie(...this.cookies);
                this.logger.log('✅ Cookies loaded');
            }

            await page.goto('https://business.google.com', {
                waitUntil: 'networkidle2',
                timeout: 30000,
            });

            await page.waitForTimeout(3000);

            // Check if logged in
            const loggedIn = await page.evaluate(() => {
                return document.URL.includes('business.google.com/dashboard') ||
                    document.querySelector('[data-location-id]') !== null;
            });

            if (!loggedIn) {
                // Save screenshot for manual login
                await page.screenshot({ path: '/tmp/gmb-login-needed.png', fullPage: true });
                throw new Error('Not logged in. Please login manually and save cookies.');
            }

            this.logger.log('✅ Logged in via cookies');

            // Navigate to posts
            await page.goto('https://business.google.com/posts', {
                waitUntil: 'networkidle2',
            });

            await page.waitForTimeout(2000);

            // Create post
            const fullContent = data.title ? `${data.title}\n\n${data.content}` : data.content;

            // Try multiple selectors for create button
            const createBtn = await page.waitForSelector(
                'button[aria-label*="Create"], button:has-text("Create post")',
                { timeout: 5000 }
            );
            await createBtn.click();
            await page.waitForTimeout(2000);

            // Fill content
            const contentField = await page.waitForSelector(
                'textarea, div[contenteditable="true"]',
                { timeout: 5000 }
            );
            await contentField.type(fullContent, { delay: 50 });
            await page.waitForTimeout(1000);

            // Publish
            const publishBtn = await page.waitForSelector(
                'button[aria-label*="Publish"], button:has-text("Publish")',
                { Timeout: 5000 }
            );
            await publishBtn.click();
            await page.waitForTimeout(5000);

            this.logger.log('✅ Post published successfully');

            await page.close();

            return {
                success: true,
                url: 'https://business.google.com',
            };

        } catch (error: any) {
            this.logger.error(`❌ Publish failed: ${error.message}`);
            await page.screenshot({ path: `/tmp/gmb-error-${Date.now()}.png` });
            await page.close();

            return {
                success: false,
                error: error.message,
            };
        }
    }

    async onModuleDestroy() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}
