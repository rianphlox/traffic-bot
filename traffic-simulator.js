const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

// User agents (20 Windows devices)
const userAgents = [
    ...Array(20).fill().map((_, i) => {
        const windowsModels = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', // Chrome on Windows 10
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36', // Chrome on Windows 10
            'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', // Chrome on Windows 11
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36', // Chrome on Windows 10
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/110.0', // Firefox on Windows 10
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Edge/120.0.0.0 Safari/537.36', // Edge on Windows 10
            'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Edge/121.0.0.0 Safari/537.36', // Edge on Windows 11
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36', // Chrome on Windows 10
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:108.0) Gecko/20100101 Firefox/109.0', // Firefox on Windows 10
            'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Edge/119.0.0.0 Safari/537.36' // Edge on Windows 11
        ];
        return windowsModels[i % 10];
    })
];

// Device viewports (aligned with user agents)
const deviceViewports = [
    ...Array(20).fill().map((_, i) => {
        const viewports = [
            { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false }, // Full HD
            { width: 1366, height: 768, deviceScaleFactor: 1, isMobile: false }, // Common laptop
            { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false }, // Common desktop
            { width: 1600, height: 900, deviceScaleFactor: 1, isMobile: false }, // HD+
            { width: 1280, height: 720, deviceScaleFactor: 1, isMobile: false }, // HD
            { width: 1680, height: 1050, deviceScaleFactor: 1, isMobile: false }, // WSXGA+
            { width: 1920, height: 1200, deviceScaleFactor: 1, isMobile: false }, // WUXGA
            { width: 1366, height: 768, deviceScaleFactor: 1, isMobile: false }, // Common laptop
            { width: 1536, height: 864, deviceScaleFactor: 1, isMobile: false }, // Common desktop
            { width: 2560, height: 1440, deviceScaleFactor: 1, isMobile: false } // QHD
        ];
        return viewports[i % 10];
    })
];

// Common referrers
const referrers = [
    'https://www.google.com/',
    'https://www.facebook.com/',
    'https://twitter.com/',
    'https://www.instagram.com/',
    ''
];

// Read proxies from proxy.txt
const proxyFilePath = path.join(__dirname, 'proxy.txt');
let proxies = [];
try {
    const proxyData = require('fs').readFileSync(proxyFilePath, 'utf8');
    proxies = proxyData.split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => {
            const [host, port, username, password] = line.split(':');
            return `http://${username}:${password}@${host}:${port}`;
        });
    if (proxies.length < 1) {
        throw new Error(`Insufficient proxies in proxy.txt: found ${proxies.length}, need at least 1`);
    }
    console.log(`Loaded ${proxies.length} proxies from proxy.txt`);
} catch (error) {
    console.error(`Failed to read proxy.txt: ${error.message}`);
    process.exit(1);
}

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
            // Check if page is scrollable
            const { scrollHeight, viewportHeight } = await page.evaluate(() => ({
                scrollHeight: document.body.scrollHeight,
                viewportHeight: window.innerHeight
            }));
            
            if (scrollHeight <= viewportHeight) {
                await logToFile(`[Browser ${index + 1}] Page is not scrollable (scrollHeight: ${scrollHeight}, viewportHeight: ${viewportHeight})`, 'INFO');
                await randomDelay(1000, 3000);
                continue;
            }

            // Random scroll direction and distance
            const direction = Math.random() > 0.5 ? 1 : -1; // 1 for down, -1 for up
            const distance = Math.floor(Math.random() * 300) + 100; // 100-400 pixels
            const scrollAmount = direction * distance;

            await page.evaluate((amount) => {
                window.scrollBy({ top: amount, behavior: 'smooth' });
            }, scrollAmount);

            const currentPosition = await page.evaluate(() => window.scrollY);
            await logToFile(`[Browser ${index + 1}] Scrolled ${scrollAmount > 0 ? 'down' : 'up'} by ${Math.abs(scrollAmount)} pixels to position ${currentPosition}`, 'INFO');
            
            await randomDelay(1000, 3000); // Scroll every 1-3s
        }
    } catch (error) {
        await logToFile(`[Browser ${index + 1}] Scrolling error: ${error.message}`, 'ERROR');
        console.error(`[Browser ${index + 1}] Scrolling error: ${error.message}`);
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
            // Log IP address for verification
            try {
                const ipResponse = await page.evaluate(() => fetch('http://api.ipify.org').then(res => res.text()));
                await logToFile(`[Browser ${index + 1}] External IP: ${ipResponse}`, 'INFO');
            } catch (ipError) {
                await logToFile(`[Browser ${index + 1}] Failed to fetch IP: ${ipError.message}`, 'WARN');
            }
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
                `--proxy-server=${proxyHost}` // Use proxy host (e.g., ade.360s5.com:3600)
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
                    filename: `plugin${i}.dll`,
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
                get: () => 'Win32',
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

        const sessionDuration = Math.floor(Math.random() * (180000 - 40000)) + 40000; // 40-180s
        await logToFile(`[Browser ${index + 1}] Session duration: ${sessionDuration / 1000}s`, 'INFO');

        // Run scrolling
        await simulateRandomScrolling(page, index, sessionDuration);

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

async function runBatch(userAgents, viewports, proxy, startIndex, batchSize) {
    if (!proxy) {
        await logToFile(`No proxy available for batch starting at ${startIndex}`, 'ERROR');
        throw new Error(`No proxy available for batch starting at ${startIndex}`);
    }

    const browserPromises = [];
    const shuffledIndices = shuffleArray([...Array(batchSize).keys()].map(i => i + startIndex));
    const shuffledUserAgents = shuffleArray([...userAgents.slice(startIndex, startIndex + batchSize)]);
    const shuffledViewports = shuffleArray([...viewports.slice(startIndex, startIndex + batchSize)]);

    for (let i = 0; i < batchSize; i++) {
        const index = shuffledIndices[i];
        browserPromises.push(createStealthBrowser(
            shuffledUserAgents[i],
            shuffledViewports[i],
            index,
            proxy // Use same proxy for all browsers in batch
        ));
    }

    const results = await Promise.allSettled(browserPromises);
    const successful = results.filter(result => result.status === 'fulfilled').length;
    await logToFile(`Batch ${Math.floor(startIndex / batchSize) + 1} completed: ${successful}/${batchSize} browsers successful`, 'INFO');
    console.log(`Batch ${Math.floor(startIndex / batchSize) + 1} completed: ${successful}/${batchSize} browsers successful`);
}

async function runAllBatches(userAgents, viewports, proxies, totalBrowsers = 20, batchSize = 10, proxyIndex = 0) {
    const proxy = proxies[proxyIndex % proxies.length]; // Use one proxy for all browsers in this set
    await logToFile(`Starting set with proxy ${proxy} (proxy index: ${proxyIndex})`, 'INFO');
    
    for (let startIndex = 0; startIndex < totalBrowsers; startIndex += batchSize) {
        await runBatch(userAgents, viewports, proxy, startIndex, Math.min(batchSize, totalBrowsers - startIndex));
        if (startIndex + batchSize < totalBrowsers) {
            await logToFile(`Waiting 3 seconds before next batch`, 'INFO');
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3s delay between batches
        }
    }
}

(async () => {
    await ensureLogDir();
    try {
        // Run one set of 20 browsers with the first proxy
        await runAllBatches(userAgents, deviceViewports, proxies, 20, 10, 0);
        await logToFile(`Successfully completed all batches (20 browsers) with proxy ${proxies[0]}!`, 'INFO');
        console.log(`✅ Successfully completed all batches (20 browsers)!`);

        // Uncomment the following block to run multiple sets (e.g., for 8000 browsers)
        /*
        const totalBrowsers = 8000; // Total browsers to run
        const browsersPerSet = 20; // 2 batches of 10
        for (let i = 0; i < totalBrowsers; i += browsersPerSet) {
            const proxyIndex = Math.floor(i / browsersPerSet) % proxies.length;
            await runAllBatches(userAgents, deviceViewports, proxies, browsersPerSet, 10, proxyIndex);
            if (i + browsersPerSet < totalBrowsers) {
                await logToFile(`Waiting 211 seconds before next set of 20 browsers`, 'INFO');
                await new Promise(resolve => setTimeout(resolve, 211000)); // ~211s between sets
            }
        }
        await logToFile(`Successfully completed all sets (${totalBrowsers} browsers)!`, 'INFO');
        console.log(`✅ Successfully completed all sets (${totalBrowsers} browsers)!`);
        */
    } catch (error) {
        await logToFile(`Fatal error: ${error.message}`, 'ERROR');
        console.error('Fatal error:', error);
    }
})();