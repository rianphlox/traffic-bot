const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

// User agents (iPhone + Windows)
const mobileUserAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1', // iPhone X
    'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1', // iPhone XR
    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Mobile/15E148 Safari/604.1', // iPhone 11
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1', // iPhone 13
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1', // iPhone (generic)
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/114.0.5735.99 Mobile/15E148 Safari/604.1', // iPhone Chrome
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36', // Android
    'Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.5481.154 Mobile Safari/537.36', // Samsung
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', // Windows Chrome
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.82', // Windows Edge
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0', // Windows Firefox
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 OPR/100.0.0.0' // Windows Opera
];

// Device viewports (aligned with user agents)
const deviceViewports = [
    { width: 375, height: 812, deviceScaleFactor: 3, isMobile: true }, // iPhone X
    { width: 414, height: 896, deviceScaleFactor: 2, isMobile: true }, // iPhone XR
    { width: 414, height: 896, deviceScaleFactor: 3, isMobile: true }, // iPhone 11
    { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true }, // iPhone 13
    { width: 375, height: 812, deviceScaleFactor: 3, isMobile: true }, // iPhone (generic)
    { width: 414, height: 896, deviceScaleFactor: 3, isMobile: true }, // iPhone Chrome
    { width: 360, height: 800, deviceScaleFactor: 3, isMobile: true }, // Android
    { width: 412, height: 915, deviceScaleFactor: 3.5, isMobile: true }, // Samsung
    { width: 1366, height: 768, deviceScaleFactor: 1, isMobile: false }, // Windows Chrome
    { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false }, // Windows Edge
    { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false }, // Windows Firefox
    { width: 1280, height: 720, deviceScaleFactor: 1, isMobile: false } // Windows Opera
];

// Referrers
const referrers = [
    'https://www.google.com/',
    'https://www.facebook.com/',
    'https://twitter.com/',
    'https://www.instagram.com/',
    ''
];

const url = 'https://www.profitableratecpm.com/t5nmfzbf?key=aa2bbf13f4d075c4f1b0e4927b3d8dde';

// Logging setup
const logDir = path.join(__dirname, 'logs');
const logFile = path.join(logDir, `browser-${Date.now()}.log`);

async function ensureLogDir() {
    try {
        await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
        await logToFile(`Failed to create log directory: ${error.message}`, 'ERROR');
    }
}

async function logToFile(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    try {
        await fs.appendFile(logFile, logMessage);
    } catch (error) {
        console.error(`Failed to write to log file: ${error.message}`);
    }
}

// Shuffle array
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Random delay
const randomDelay = (min, max) => {
    return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
};

// Simulate random scrolling throughout session
async function simulateRandomScrolling(page, index, sessionDuration) {
    try {
        const startTime = Date.now();
        while (Date.now() - startTime < sessionDuration) {
            const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
            const maxScroll = Math.min(scrollHeight, 3000);
            const targetY = Math.floor(Math.random() * maxScroll); // Random scroll position
            await page.evaluate((y) => window.scrollTo(0, y), targetY);
            await logToFile(`[Browser ${index + 1}] Scrolled to position ${targetY}`, 'INFO');
            await randomDelay(1000, 3000); // Pause 1-3s between scrolls
        }
    } catch (error) {
        await logToFile(`[Browser ${index + 1}] Scrolling error: ${error.message}`, 'ERROR');
    }
}

// Simulate mouse movements
async function simulateMouseMovements(page, index) {
    try {
        const viewport = await page.viewport();
        const width = viewport.width;
        const height = viewport.height;

        const points = Array.from({ length: Math.floor(Math.random() * 3) + 3 }, () => ({
            x: Math.floor(Math.random() * width * 0.8) + width * 0.1,
            y: Math.floor(Math.random() * height * 0.8) + height * 0.1,
        }));

        for (const point of points) {
            await page.mouse.move(point.x, point.y, { steps: 10 });
            await randomDelay(200, 600);
            await logToFile(`[Browser ${index + 1}] Mouse moved to (${point.x}, ${point.y})`, 'INFO');
        }
    } catch (error) {
        await logToFile(`[Browser ${index + 1}] Mouse movement error: ${error.message}`, 'ERROR');
    }
}

// Retry navigation
async function navigateWithRetry(page, url, index, retries = 3, delay = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await page.goto(url, { 
                waitUntil: 'networkidle2', 
                timeout: 90000 
            });
            const finalUrl = page.url();
            await logToFile(`[Browser ${index + 1}] [Attempt ${attempt}] Navigated to final URL: ${finalUrl}`, 'INFO');
            return { response, finalUrl };
        } catch (error) {
            if (attempt === retries) {
                await logToFile(`[Browser ${index + 1}] Navigation failed after ${retries} attempts: ${error.message}`, 'ERROR');
                throw error;
            }
            await logToFile(`[Browser ${index + 1}] [Attempt ${attempt}/${retries}] Navigation failed: ${error.message}. Retrying in ${delay}ms`, 'WARN');
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}

async function createStealthBrowser(userAgent, viewport, index, proxy = null) {
    let browser = null;
    let page = null;
    try {
        const launchOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-zygote',
                '--disable-background-networking',
                '--disable-extensions',
                '--disable-gpu',
                '--no-first-run'
            ],
            ignoreDefaultArgs: ['--enable-automation'],
            defaultViewport: null
        };

        if (proxy) {
            launchOptions.args.push(`--proxy-server=${proxy}`);
        }

        browser = await puppeteer.launch(launchOptions);
        page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', async request => {
            await logToFile(`[Browser ${index + 1}] Request: ${request.url()}`, 'INFO');
            request.continue();
        });
        page.on('requestfailed', async request => {
            await logToFile(`[Browser ${index + 1}] Request failed: ${request.url()} - ${request.failure().errorText}`, 'ERROR');
        });
        page.on('response', async response => {
            if (response.status() >= 300 && response.status() <= 399) {
                await logToFile(`[Browser ${index + 1}] Redirect: ${response.url()} -> ${response.headers()['location'] || 'unknown'}`, 'INFO');
            }
        });

        await page.setViewport({
            ...viewport,
            width: viewport.width + Math.floor(Math.random() * 10),
            height: viewport.height + Math.floor(Math.random() * 10)
        });
        await page.setUserAgent(userAgent);

        const referrer = referrers[Math.floor(Math.random() * referrers.length)];
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            ...(referrer && { Referer: referrer })
        });

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
                get: () => userAgent.includes('Windows') ? 'Win32' : 'iPhone',
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

        const { finalUrl } = await navigateWithRetry(page, url, index);
        await logToFile(`[Browser ${index + 1}] Successfully loaded final URL: ${finalUrl}`, 'INFO');

        const sessionDuration = Math.floor(Math.random() * (240000 - 120000)) + 120000; // 120-240s
        await logToFile(`[Browser ${index + 1}] Session duration: ${sessionDuration / 1000}s`, 'INFO');

        // Run scrolling and mouse movements concurrently
        const scrollingPromise = simulateRandomScrolling(page, index, sessionDuration);
        const mousePromise = simulateMouseMovements(page, index);
        await Promise.all([scrollingPromise, mousePromise]);

        // Wait for remaining session time
        const elapsed = Date.now() - (await page.evaluate(() => performance.timing.navigationStart));
        const remaining = sessionDuration - elapsed;
        if (remaining > 0) await randomDelay(remaining, remaining);

        await logToFile(`[Browser ${index + 1}] Opened with UA: ${userAgent.substring(0, 50)}... Referrer: ${referrer || 'None'}`, 'INFO');
        await browser.close();
        await logToFile(`[Browser ${index + 1}] Closed after session`, 'INFO');
        return null; // Return null since browser is closed
    } catch (error) {
        await logToFile(`[Browser ${index + 1}] Error: ${error.message}`, 'ERROR');
        if (browser) await browser.close();
        return null;
    }
}

async function runBatch(userAgents, viewports, batchSize, startIndex, proxies = []) {
    const batchPromises = [];
    const shuffledIndices = shuffleArray([...Array(batchSize).keys()].map(i => startIndex + i));
    for (const i of shuffledIndices) {
        const proxy = proxies[i % proxies.length] || null;
        batchPromises.push(createStealthBrowser(
            userAgents[i % userAgents.length],
            viewports[i % viewports.length],
            i,
            proxy
        ));
    }

    await Promise.all(batchPromises);
    await logToFile(`Batch ${startIndex + 1}-${startIndex + batchSize} completed`, 'INFO');
}

(async () => {
    await ensureLogDir();
    const shuffledUserAgents = shuffleArray([...mobileUserAgents]);
    const shuffledViewports = shuffleArray([...deviceViewports]);
    const totalBrowsers = 8000; // Target for 24 hours
    const batchSize = 12; // 12 browsers per batch (increased for Windows UAs)
    const batchesPerHour = Math.ceil(8000 / 24); // ~334 batches/hour
    const batchInterval = Math.floor((60 * 60 * 1000) / batchesPerHour); // ~10.8s per batch
    const proxies = []; // Add residential proxies here

    try {
        for (let i = 0; i < totalBrowsers; i += batchSize) {
            await runBatch(shuffledUserAgents, shuffledViewports, Math.min(batchSize, totalBrowsers - i), i, proxies);
            if (i + batchSize < totalBrowsers) {
                await new Promise(resolve => setTimeout(resolve, batchInterval));
            }
        }

        await logToFile(`Successfully completed ${totalBrowsers} browser instances!`, 'INFO');
        console.log(`✅ Successfully completed ${totalBrowsers} browser instances!`);
    } catch (error) {
        await logToFile(`Fatal error: ${error.message}`, 'ERROR');
        console.error('Fatal error:', error);
    }
})();