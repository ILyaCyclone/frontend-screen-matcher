const path = require("path");
const fs = require("fs");
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

const tools = require('./tools.js');
const config = require('./config');
const resolutions = config.resolutions;
const addresses = config.addresses;


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



async function makeScreenshots(resolutionsConfig, addressesConfig, directory, fn, shouldClearFolder) {
    if (shouldClearFolder === "true") {
        tools.clearFolder(directory);
        logger.debug(`cleared folder ${directory}`);
    }

    const makeScreenshotsStartMillis = new Date().getTime();
    const neededPageCount = Object.keys(addressesConfig).length;
    const neededScreenshotCount = neededPageCount * Object.keys(resolutionsConfig).length;
    let finishedPageCount = 0;
    let madeScreenshotCount = 0;

    logger.info(`Started making ${neededScreenshotCount} screenshots on ${neededPageCount} pages (3-5 seconds each screen)...`);
    await Promise.all(
        Object.entries(addressesConfig).map(async ([addressKey, address]) =>
            pLimit(() =>
                new Promise(async (resolve, reject) => {
                    const url = address.address;

                    const browser = await puppeteer.launch({ args: ["--proxy-server='direct://'", '--proxy-bypass-list=*'] });
                    try {
                        const page = await createPage(browser, address);
                        const hasWaits = address.waits != null;

                        await page.goto(url);

                        const ignoredObject = new Object();
                        for ([resolutionKey, resolution] of Object.entries(resolutionsConfig)) {
                            const filename = `${addressKey}_${resolutionKey}`;
                            const savePath = config.directories[directory].path;

                            logger.debug(`making screenshot for ${url} of ${resolutionKey}...`);

                            await emulateDevice(browser, page, resolution);

                            if (hasWaits) {
                                // possible optimization: call pageWaits only during first page resoltion walkthrough
                                // but for stability leave it here, shouldn't take any noticable time on subsecuent resolutions
                                await pageWaits(page, address.waits);
                            }

                            await page.screenshot({ path: savePath.concat(path.sep, filename, '.png'), fullPage: true });
                            madeScreenshotCount++;

                            const ignoredElements = await getIgnoredElements(page, address);
                            if (ignoredElements != null && ignoredElements.length > 0) {
                                ignoredObject[resolutionKey] = ignoredElements;
                            }

                            logger.debug(`finish screenshot for ${url} of ${resolutionKey}`);
                        }

                        savePageMeta(directory, addressKey, ignoredObject);

                        finishedPageCount++;
                        logger.info(`finished ${url} (${finishedPageCount}/${neededPageCount})`)
                        resolve();
                    } catch (e) {
                        const msg = `failed making screenshot for ${url}: ${e}`;
                        // logger.error(msg);
                        reject(msg);
                    } finally {
                        browser.close()
                            .catch(rejectReason => logger.error("failed to close browser: " + rejectReason));
                    }
                })
            )
        )
    )
        .catch(rejected => {
            logger.error(rejected);
        })
        ;

    const makeScreenshotsEndMillis = new Date().getTime();
    const makeScreenshotsElapsedMillis = makeScreenshotsEndMillis - makeScreenshotsStartMillis;
    logger.info(`Finished making ${madeScreenshotCount} screenshots in ${(makeScreenshotsElapsedMillis / 1000).toFixed(1)} seconds.`);
}


async function createPage(browser, addressObject) {
    const page = await browser.newPage();
    //page.setDefaultTimeout(15 * 1000);
    //await page.setCacheEnabled(false);
    // await setPageWaits(page, addressObject.waits);
    return page;
}


// function setPageWaits(page, waits) {
//     if (waits) {
//         for (wait of waits) {
//             if (wait.type === "css") {
//                 // works across navigations
//                 console.log("wait for " + wait.selector);
//                 page.waitForSelector(wait.selector) // wait.options could be added as second parameter
//                     .catch(e => logger.error(`failed to wait for ${wait.selector}: ${e}`));
//             }
//         }
//     }
// }


async function pageWaits(page, waits) {
    if (waits) {
        for (wait of waits) {
            switch (wait.type) {
                case "css":
                    await page.waitForSelector(wait.selector) // wait.options could be added as second parameter
                        .catch(e => logger.error(`failed to wait for ${wait.selector}: ${e}`));
                    break;
                default:
                    logger.error("Unsupported wait type: " + wait.type);
            }
        }
    }
}


async function emulateDevice(browser, page, resolution) {
    if (resolution.device != null) {
        await page.emulate(devices[resolution.device]);
    } else {
        await page.emulate({ "viewport": { width: resolution.width, height: 600 }, "userAgent": await browser.userAgent() });
        //await page.setViewport({ width: width, height: 600 });
    }
}


async function getIgnoredElements(page, address) {
    if (address.ignores) {
        const ignoredElements = new Array();
        for (const ignore of address.ignores) {
            switch (ignore.type) {
                case "css":
                    const elements = await page.$$(ignore.selector);
                    if (elements.length > 0) {
                        const coordinates = await Promise.all(elements.map(async element => await getElementCoordinates(element)));
                        const ignoredElement = {
                            "selector": ignore.selector,
                            "description": ignore.description,
                            coordinates
                        };
                        ignoredElements.push(ignoredElement);
                    }
                    break;
                default:
                    logger.error("Unsupported ignored type: " + ignore.type);
            }
        }
        return ignoredElements;
    }
    return null;
}

/**
 * @return {top, left, bottom, right} coordinates of ElementHandle
 */
async function getElementCoordinates(element) {
    const rect = await element.boundingBox(); // {x, y, width, height}
    //console.log(JSON.stringify(await element.boxModel()));
    return {
        "top": Math.floor(rect.y), "left": Math.floor(rect.x)
        , "bottom": Math.ceil(rect.y + rect.height), "right": Math.ceil(rect.x + rect.width)
    };
}




function savePageMeta(directory, addressKey, ignoredObject) {
    if (Object.keys(ignoredObject).length > 0) {
        const pageMetaFileName = config.directories[directory].path.concat(path.sep, addressKey, '.json');
        const pageMetaObject = { "ignores": ignoredObject };
        const pageMetaFileContent = JSON.stringify(pageMetaObject, null, 2); // prettify
        fs.writeFileSync(pageMetaFileName, pageMetaFileContent);
    }
}






async function makeScreenshots_original(size, url, directory, fn) {

    var sizeArray = tools.getArray(size);
    var urlArray = tools.getArray(url);


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

            if (numOfScreenshots % 5 == 0) {
                await makeScreenshot(screenResolution, address, directory, fileName);
            } else {
                makeScreenshot(screenResolution, address, directory, fileName);
            }
            numOfScreenshots++;
        }
    }

    if (numOfScreenshots > 0) {
        console.log("Creating " + numOfScreenshots + " screenshot(s) in " + directory + " directory");
    }
}

async function makeScreenshot(size, url, directory, fileName) {

    var savePath = config.directories[directory].path;

    let browser, page;
    tools.checkForDirectory(savePath);
    browser = await puppeteer.launch({ args: ["--proxy-server='direct://'", '--proxy-bypass-list=*'] });
    page = await browser.newPage();
    page.setViewport({ width: size, height: 600 });
    await page.goto(url, { waitUntil: 'load', timeout: 0 });
    await page.screenshot({ path: savePath.concat(path.sep, fileName, '.png'), fullPage: true });
    browser.close();
}

module.exports.makeScreenshots = makeScreenshots;