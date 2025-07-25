const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

// User agents (4 mobile + 4 PC laptops)
const userAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1', // iPhone X
    'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1', // iPhone XR
    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Mobile/15E148 Safari/604.1', // iPhone 11
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1', // iPhone 13
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', // Samsung laptop (Chrome)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.82', // Acer laptop (Edge)
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0', // Xiaomi laptop (Firefox)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 OPR/100.0.0.0' // HP laptop (Opera)
];

// Device viewports (aligned with user agents)
const deviceViewports = [
    { width: 375, height: 812, deviceScaleFactor: 3, isMobile: true }, // iPhone X
    { width: 414, height: 896, deviceScaleFactor: 2, isMobile: true }, // iPhone XR
    { width: 414, height: 896, deviceScaleFactor: 3, isMobile: true }, // iPhone 11
    { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true }, // iPhone 13
    { width: 1366, height: 768, deviceScaleFactor: 1, isMobile: false }, // Samsung laptop
    { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false }, // Acer laptop
    { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false }, // Xiaomi laptop
    { width: 1280, height: 720, deviceScaleFactor: 1, isMobile: false } // HP laptop
];

// Common referrers
const referrers = [
    'https://www.google.com/',
    'https://www.facebook.com/',
    'https://twitter.com/',
    'https://www.instagram.com/',
    ''
];

// Proxies (8 unique proxies)
const proxies = [
    'http://79731769-zone-custom-region-US-state-newyork-sessid-4OYzilrv-sessTime-2:TSFJOTEy@aus.360s5.com:3600',
    'http://79731769-zone-custom-region-US-state-newyork-sessid-sOIVNHqK-sessTime-2:TSFJOTEy@aus.360s5.com:3600',
    'http://79731769-zone-custom-region-US-state-newyork-sessid-Lww2myEJ-sessTime-2:TSFJOTEy@aus.360s5.com:3600',
    'http://79731769-zone-custom-region-US-state-newyork-sessid-YOAM6dma-sessTime-2:TSFJOTEy@aus.360s5.com:3600',
    'http://79731769-zone-custom-region-US-state-newyork-sessid-owYCe5VG-sessTime-2:TSFJOTEy@aus.360s5.com:3600',
    'http://79731769-zone-custom-region-US-state-newyork-sessid-87TFYhrX-sessTime-2:TSFJOTEy@aus.360s5.com:3600',
    'http://79731769-zone-custom-region-US-state-newyork-sessid-C3hMVazD-sessTime-2:TSFJOTEy@aus.360s5.com:3600',
    'http://79731769-zone-custom-region-US-state-newyork-sessid-iQOjKRXw-sessTime-2:TSFJOTEy@aus.360s5.com:3600'
];

const url = 'https://www.profitableratecpm.com/t5nmfzbf?key=aa2bbf13f4d075c4f1b0e4927b3d8dde';

// Setup logging to file
const logDir = path.join(__dirname, 'logs');
const logFile = path.join(logDir, `browser-${Date.now()}.log`);

async function ensureLogDir() {
    try {
        await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
        await logToFile(`Failed to create log directory: ${error.message}`, 'ERROR');
        console.error(`Failed to create log directory: ${error.message}`);
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
            const targetY = Math.floor(Math.random() * maxScroll);
            await page.evaluate((y) => window.scrollTo(0, y), targetY);
            await logToFile(`[Browser ${index + 1}] Scrolled to position ${targetY}`, 'INFO');
            await randomDelay(1000, 3000); // Scroll every 1-3s
        }
    } catch (error) {
        await logToFile(`[Browser ${index + 1}] Scrolling error: ${error.message}`, 'ERROR');
        console.error(`[Browser ${index + 1}] Scrolling error: ${error.message}`);
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
        console.error(`[Browser ${index + 1}] Mouse movement error: ${error.message}`);
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
                throw new Error(`Navigation failed after ${retries} attempts: ${error.message}`);
            }
            await logToFile(`[Browser ${index + 1}] [Attempt ${attempt}/${retries}] Navigation failed: ${error.message}. Retrying in ${delay}ms`, 'WARN');
            console.warn(`[Browser ${index + 1}] [Attempt ${attempt}/${retries}] Navigation failed: ${error.message}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}

async function createStealthBrowser(userAgent, viewport, index, proxy) {
    let browser = null;
    let page = null;
    try {
        if (!proxy) {
            await logToFile(`[Browser ${index + 1}] No proxy provided`, 'ERROR');
            throw new Error('No proxy provided');
        }

        const proxyParts = proxy.split('@');
        if (proxyParts.length !== 2) {
            await logToFile(`[Browser ${index + 1}] Invalid proxy format: ${proxy}`, 'ERROR');
            throw new Error(`Invalid proxy format: ${proxy}`);
        }
        const [proxyAuth, proxyHost] = proxyParts;
        // Extract username and password by finding the last colon before @
        const lastColonIndex = proxyAuth.lastIndexOf(':');
        if (lastColonIndex === -1) {
            await logToFile(`[Browser ${index + 1}] Invalid proxy auth format: ${proxyAuth}`, 'ERROR');
            throw new Error(`Invalid proxy auth format: ${proxyAuth}`);
        }
        const proxyUser = proxyAuth.slice(7, lastColonIndex); // Skip 'http://'
        const proxyPass = proxyAuth.slice(lastColonIndex + 1);

        const launchOptions = {
            headless: false, // Non-headless as requested
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                `--window-size=${viewport.width},${viewport.height}`,
                `--window-position=${100 + index * 50},${100 + index * 50}`,
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-zygote',
                '--disable-background-networking',
                '--disable-extensions',
                `--proxy-server=${proxyHost}` // Use proxy host (aus.360s5.com:3600)
            ],
            ignoreDefaultArgs: ['--enable-automation'],
            defaultViewport: null
        };

        browser = await puppeteer.launch(launchOptions);
        page = await browser.newPage();

        // Proxy authentication
        await page.authenticate({ username: proxyUser, password: proxyPass });
        await logToFile(`[Browser ${index + 1}] Using proxy: ${proxy}`, 'INFO');

        await page.setRequestInterception(true);
        page.on('request', async request => {
            await logToFile(`[Browser ${index + 1}] Request: ${request.url()}`, 'INFO');
            request.continue();
        });
        page.on('requestfailed', async request => {
            await logToFile(`[Browser ${index + 1}] Request failed: ${request.url()} - ${request.failure().errorText}`, 'ERROR');
            console.error(`[Browser ${index + 1}] Request failed: ${request.url()} - ${request.failure().errorText}`);
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
                get: () => userAgent.includes('iPhone') ? 'iPhone' : 'Win32',
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
        console.log(`[Browser ${index + 1}] Successfully loaded final URL: ${finalUrl}`);

        const sessionDuration = Math.floor(Math.random() * (180000 - 60000)) + 60000; // 60-180s
        await logToFile(`[Browser ${index + 1}] Session duration: ${sessionDuration / 1000}s`, 'INFO');

        // Run scrolling and mouse movements concurrently
        const scrollingPromise = simulateRandomScrolling(page, index, sessionDuration);
        const mousePromise = simulateMouseMovements(page, index);
        await Promise.all([scrollingPromise, mousePromise]);

        // Ensure full session duration is respected
        const elapsed = Date.now() - (await page.evaluate(() => performance.timing.navigationStart));
        const remaining = sessionDuration - elapsed;
        if (remaining > 0) {
            await randomDelay(remaining, remaining);
            await logToFile(`[Browser ${index + 1}] Waited additional ${remaining / 1000}s to complete session`, 'INFO');
        }

        await logToFile(`[Browser ${index + 1}] Opened with UA: ${userAgent.substring(0, 50)}... Referrer: ${referrer || 'None'} Proxy: ${proxy}`, 'INFO');
        console.log(`[Browser ${index + 1}] Opened with UA: ${userAgent.substring(0, 50)}... Referrer: ${referrer || 'None'} Proxy: ${proxy}`);

        // Close browser
        await browser.close();
        await logToFile(`[Browser ${index + 1}] Closed after session`, 'INFO');
        console.log(`[Browser ${index + 1}] Closed after session`);
        return null;
    } catch (error) {
        await logToFile(`[Browser ${index + 1}] Error: ${error.message}`, 'ERROR');
        console.error(`[Browser ${index + 1}] Error: ${error.message}`);
        if (browser) {
            await browser.close();
            await logToFile(`[Browser ${index + 1}] Closed due to error`, 'INFO');
            console.log(`[Browser ${index + 1}] Closed due to error`);
        }
        throw error;
    }
}

async function runBatch(userAgents, viewports, proxies, batchSize) {
    if (proxies.length < batchSize) {
        await logToFile(`Not enough proxies (${proxies.length}) for batch size ${batchSize}`, 'ERROR');
        throw new Error(`Not enough proxies (${proxies.length}) for batch size ${batchSize}`);
    }

    const browserPromises = [];
    const shuffledIndices = shuffleArray([...Array(batchSize).keys()]); // Randomize browser order
    const shuffledUserAgents = shuffleArray([...userAgents]);
    const shuffledViewports = shuffleArray([...viewports]);
    const shuffledProxies = shuffleArray([...proxies]);

    for (let i = 0; i < batchSize; i++) {
        const index = shuffledIndices[i];
        const proxy = shuffledProxies[i]; // Ensure unique proxy per browser
        browserPromises.push(createStealthBrowser(
            shuffledUserAgents[i % shuffledUserAgents.length],
            shuffledViewports[i % shuffledViewports.length],
            index,
            proxy
        ));
        if (i < batchSize - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3s delay between launches
        }
    }

    const results = await Promise.allSettled(browserPromises);
    const successful = results.filter(result => result.status === 'fulfilled').length;
    await logToFile(`Batch completed: ${successful}/${batchSize} browsers successful`, 'INFO');
    console.log(`Batch completed: ${successful}/${batchSize} browsers successful`);
}

(async () => {
    await ensureLogDir();
    try {
        await runBatch(userAgents, deviceViewports, proxies, 8);
        await logToFile(`Successfully completed batch of 8 browsers!`, 'INFO');
        console.log(`✅ Successfully completed batch of 8 browsers!`);
    } catch (error) {
        await logToFile(`Fatal error: ${error.message}`, 'ERROR');
        console.error('Fatal error:', error);
    }
})();