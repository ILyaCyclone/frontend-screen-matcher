const puppeteer = require('puppeteer');
const path = require("path");
const fs = require("fs");
const config = require('./config');
const resolutions = config.resolutions;
const addresses = config.addresses;
const rimraf = require("rimraf");


const winston = require("winston");
const logger = winston.createLogger({
    level: 'info', // 'debug' 'info'
    // transports: [
    //   new winston.transports.Console()
    //  new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // //   new winston.transports.File({ filename: 'combined.log' })
    // ]
});
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

const concurrency = 5;
const pLimit = require('p-limit')(concurrency);




const tools = require('./tools.js');

async function makeScreenshots(resolutionsConfig, addressesConfig, directory, fn, shouldClearFolder) {
    if (shouldClearFolder === "true") {
        clearFolder(directory);
    }

    const makeScreenshotsStartMillis = new Date().getTime();
    const neededPageCount = Object.keys(addressesConfig).length;
    const neededScreenshotCount = neededPageCount * Object.keys(resolutionsConfig).length;
    let finishedPageCount = 0;
    let madeScreenshotCount = 0;

    logger.info(`Started making ${neededScreenshotCount} screenshots on ${neededPageCount} pages...`);

    const browser = await puppeteer.launch({ args: ["--proxy-server='direct://'", '--proxy-bypass-list=*'] });
    try {
        await Promise.all(
            Object.entries(addressesConfig).map(async ([addressKey, address]) =>
                pLimit(() =>
                    new Promise(async (resolve, reject) => {
                        try {
                            const page = await createPage(browser, address);
                            const url = address.address;

                            await page.goto(url, { waitUntil: 'load' });

                            for ([resolutionKey, resolution] of Object.entries(resolutionsConfig)) {
                                const width = resolution.width;
                                const filename = `${addressKey}_${width}`;
                                const savePath = config.directories[directory].path;

                                logger.debug(`making screenshot for ${url} of width ${width}...`);

                                await page.setViewport({ width: width, height: 600 });

                                await page.screenshot({ path: savePath.concat(path.sep, filename, '.png'), fullPage: true });
                                madeScreenshotCount++;

                                logger.debug(`finish screenshot for ${url} of width ${width}`);
                            }

                            finishedPageCount++;
                            logger.info(`finished ${url} (${finishedPageCount}/${neededPageCount})`)
                            resolve();
                        } catch (e) {
                            const msg = `failed making screenshot for ${url}: ${e}`;
                            //logger.error(msg);
                            reject(msg);
                        }
                    })
                )
            )
        )
            .catch(rejected => {
                logger.error(rejected);
            });

    } finally {
        browser.close();
    }

    const makeScreenshotsEndMillis = new Date().getTime();
    const makeScreenshotsElapsedMillis = makeScreenshotsEndMillis - makeScreenshotsStartMillis;
    logger.info(`Finished making ${madeScreenshotCount} screenshots in ${(makeScreenshotsElapsedMillis / 1000).toFixed(1)} seconds.`);
}


function clearFolder(directory) {
    rimraf.sync(`screenshots/${directory}/*`);
    logger.debug(`cleared folder ${directory}`);
}


async function createPage(browser, addressObject) {
    const page = await browser.newPage();
    //page.setDefaultTimeout(15 * 1000);
    //await page.setCacheEnabled(false);
    await setPageWaits(page, addressObject.waits);
    return page;
}


function setPageWaits(page, waits) {
    if (waits) {
        for (wait of waits) {
            if (wait.type === "css") {
                // works across navigations
                page.waitForSelector(wait.selector) // wait.options could be added as second parameter
                    .catch(e => logger.error(`failed to wait for ${wait.selector}: ${e}`));
            }
        }
    }
}









async function makeScreenshots_orig(size, url, directory, fn) {
    const promiseScreenshots = new Array();

    const sizeArray = tools.getArray(size);
    const urlArray = tools.getArray(url);



    var fileNameArray;

    var numberOfFileNames;
    if (!tools.isUndefinedOrNull(fn)) {
        fileNameArray = tools.getArray(fn);
        numberOfFileNames = fileNameArray.length;

    } else {
        numberOfFileNames = 0;
    }

    var numOfScreenshots = 0;
    var numberOfUnknownUrls;

    var fileName;

    sizeLoop:
    for (i in sizeArray) {

        numberOfUnknownUrls = 0;

        addressLoop:
        for (j in urlArray) {

            var screenResolution, address;

            if (isNaN(sizeArray[i])) {
                var resolutionBuffer = resolutions[sizeArray[i]];

                if (tools.isUndefinedOrNull(resolutionBuffer)) {
                    console.log("Resolution \"" + sizeArray[i] + "\" is not found");
                    continue sizeLoop;
                }
                screenResolution = resolutionBuffer.width;
            } else {
                screenResolution = parseInt(sizeArray[i], 10);
            }

            if (urlArray[j].startsWith("http")) {
                address = urlArray[j];

                if (numberOfUnknownUrls >= numberOfFileNames) {
                    console.log("please, set fileName (--fn) argument for url " + address + ". Screenshot won't be created for this url");
                    continue addressLoop;
                }

                fileName = fileNameArray[numberOfUnknownUrls++] + "-" + screenResolution;
            } else {

                var pathBuffer = addresses[urlArray[j]];

                if (tools.isUndefinedOrNull(pathBuffer)) {
                    console.log("Address \"" + urlArray[j] + "\" is not found");
                    continue addressLoop;
                }
                address = pathBuffer.address;
                fileName = urlArray[j] + "-" + screenResolution;
            }

            // if (numOfScreenshots % 5 == 0) {
            //     await makeScreenshot(screenResolution, address, directory, fileName);
            // } else {
            //     makeScreenshot(screenResolution, address, directory, fileName);
            // }
            // numOfScreenshots++;

            promiseScreenshots.push(
                pLimit(() => makeScreenshot(screenResolution, address, directory, fileName))
            );
        }
    }

    const result = await Promise.all(promiseScreenshots);
    // console.log(result);
    console.llg("makeScreenshotEnters: " + makeScreenshotEnters);

    // if (numOfScreenshots > 0) {
    //     console.log("Creating " + numOfScreenshots + " screenshot(s) in " + directory + " directory");
    // }
}

async function makeScreenshot(size, url, directory, fileName) {
    //makeScreenshotEnters++;
    // console.log(`making screenshot for ${url} of size ${size}...`);
    logger.debug(`making screenshot for ${url} of size ${size}...`);

    const savePath = config.directories[directory].path;


    return puppeteer.launch({ args: ["--proxy-server='direct://'", '--proxy-bypass-list=*'] })
        .then(async browser => {
            await browser.newPage()
                .then(async page => {
                    page.on("error", e => logger.error(e));
                    await page.setViewport({ width: size, height: 600 }).catch(rejectReason => logger.error(rejectReason));
                    await page.goto(url, { waitUntil: 'load', timeout: 0 }).catch(rejectReason => logger.error(rejectReason));
                    await page.screenshot({ path: savePath.concat(path.sep, fileName, '.png'), fullPage: true })
                        .then(() => logger.debug(`finish screenshot for ${url} of size ${size}.`))
                        .catch(rejectReason => logger.error(rejectReason));
                })
                .catch(e => logger.error(e));
            await browser.close();
        });


}

async function makeScreenshotAwaiting(size, url, directory, fileName) {
    logger.debug(`making screenshot for ${url} of size ${size}`);

    const savePath = config.directories[directory].path;

    tools.checkForDirectory(savePath);
    const browser = await puppeteer.launch({ args: ["--proxy-server='direct://'", '--proxy-bypass-list=*'] });
    const page = await browser.newPage();
    await page.setViewport({ width: size, height: 600 });
    await page.goto(url, { waitUntil: 'load', timeout: 0 });
    await page.screenshot({ path: savePath.concat(path.sep, fileName, '.png'), fullPage: true });
    await browser.close();

    logger.debug(`finish screenshot for ${url} of size ${size}`);
}

module.exports.makeScreenshots = makeScreenshots;