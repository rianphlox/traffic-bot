const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// Realistic mobile user agents
const mobileUserAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/114.0.5735.99 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.5481.154 Mobile Safari/537.36'
];

// Device viewport configurations
const deviceViewports = [
    { width: 375, height: 812, deviceScaleFactor: 3, isMobile: true },
    { width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true },
    { width: 414, height: 896, deviceScaleFactor: 3, isMobile: true },
    { width: 360, height: 800, deviceScaleFactor: 3, isMobile: true },
    { width: 412, height: 915, deviceScaleFactor: 3.5, isMobile: true }
];

const url = 'https://www.profitableratecpm.com/t5nmfzbf?key=aa2bbf13f4d075c4f1b0e4927b3d8dde';

// Function to shuffle array for randomization
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Retry navigation with exponential backoff
async function navigateWithRetry(page, url, retries = 3, delay = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await page.goto(url, { 
                waitUntil: 'networkidle2', 
                timeout: 90000 
            });
            const finalUrl = page.url();
            console.log(`[Attempt ${attempt}] Navigated to final URL: ${finalUrl}`);
            return { response, finalUrl };
        } catch (error) {
            if (attempt === retries) {
                throw new Error(`Navigation failed after ${retries} attempts: ${error.message}`);
            }
            console.warn(`[Attempt ${attempt}/${retries}] Navigation failed: ${error.message}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}

async function createStealthBrowser(userAgent, viewport, index) {
    let browser = null;
    let page = null;
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                `--window-size=${viewport.width},${viewport.height}`,
                `--window-position=${100 + index * 50},${100 + index * 50}`, // Stagger window positions
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-zygote',
                '--disable-background-networking',
                '--disable-extensions'
            ],
            ignoreDefaultArgs: ['--enable-automation'],
            defaultViewport: null
        });

        page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', request => {
            console.log(`[Browser ${index + 1}] Request: ${request.url()}`);
            request.continue();
        });
        page.on('requestfailed', request => {
            console.error(`[Browser ${index + 1}] Request failed: ${request.url()} - ${request.failure().errorText}`);
        });
        page.on('response', response => {
            if (response.status() >= 300 && response.status() <= 399) {
                console.log(`[Browser ${index + 1}] Redirect: ${response.url()} -> ${response.headers()['location'] || 'unknown'}`);
            }
        });

        await page.setViewport({
            ...viewport,
            width: viewport.width + Math.floor(Math.random() * 10),
            height: viewport.height + Math.floor(Math.random() * 10)
        });
        await page.setUserAgent(userAgent);

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'plugins', {
                get: () => Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
                    name: `Plugin${i}`,
                    filename: `plugin${i}.so`,
                    description: `Description for plugin ${i}`
                })),
                configurable: true
            });

            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en', Math.random() > 0.5 ? 'en-GB' : 'en-CA'],
                configurable: true
            });

            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
                configurable: true
            });

            Object.defineProperty(navigator, 'platform', {
                get: () => Math.random() > 0.5 ? 'iPhone' : 'Linux armv81',
                configurable: true
            });

            window.chrome = {
                runtime: {},
                webstore: {},
                app: {}
            };

            const getParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(parameter) {
                if (parameter === 37445) return 'Google Inc.';
                if (parameter === 37446) return 'ANGLE (Software Adapter)';
                return getParameter.apply(this, arguments);
            };
        });

        await page.evaluateOnNewDocument(() => {
            const getRandomTime = () => Math.floor(Math.random() * 100) + 50;
            performance.timing = {
                ...performance.timing,
                navigationStart: Date.now() - getRandomTime(),
                fetchStart: Date.now() - getRandomTime()
            };
        });

        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        });

        const { finalUrl } = await navigateWithRetry(page, url);
        console.log(`[Browser ${index + 1}] Successfully loaded final URL: ${finalUrl}`);

        console.log(`[Browser ${index + 1}] Opened with UA: ${userAgent.substring(0, 50)}...`);
        return { browser, page };
    } catch (error) {
        console.error(`[Browser ${index + 1}] Error: ${error.message}`);
        if (browser) {
            console.log(`[Browser ${index + 1}] Browser left open for debugging. Close manually or use Ctrl+C.`);
        }
        throw error;
    }
}

(async () => {
    const browsers = [];
    const shuffledUserAgents = shuffleArray([...mobileUserAgents]);
    const shuffledViewports = shuffleArray([...deviceViewports]);

    try {
        const browserPromises = [];
        for (let i = 0; i < 5; i++) {
            browserPromises.push(createStealthBrowser(
                shuffledUserAgents[i],
                shuffledViewports[i],
                i
            ));
            if (i < 4) await new Promise(resolve => setTimeout(resolve, 3000));
        }

        const results = await Promise.allSettled(browserPromises);
        browsers.push(...results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value));

        console.log(`✅ Successfully opened ${browsers.length} stealth browsers!`);

        const cleanup = async () => {
            console.log('Cleaning up browsers...');
            await Promise.all(browsers.map(({ browser }) => browser.close()));
            process.exit(0);
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        process.on('uncaughtException', async (err) => {
            console.error('Uncaught Exception:', err);
            console.log('Browsers left open for debugging. Close manually or use Ctrl+C.');
        });

        await new Promise(() => {});
    } catch (error) {
        console.error('Fatal error:', error);
        console.log('Browsers left open for debugging. Close manually or use Ctrl+C.');
        await new Promise(() => {});
    }
})();