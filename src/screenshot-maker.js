const puppeteer = require('puppeteer');
const path = require("path");
const fs = require("fs");
const config = require('./config');
const resolutions = config.resolutions;
const addresses = config.addresses;

const tools = require('./tools.js');

async function makeScreenshots(size, url, directory) {

    var sizeArray = tools.getArray(size);
    var urlArray = tools.getArray(url);

    var numOfScreenshots = 0;

    sizeLoop:
    for (i in sizeArray) {

        addressLoop:
        for (j in urlArray)  {

            var resolution, address;

            if (isNaN(sizeArray[i]))    {
                var resolutionBuffer = resolutions[sizeArray[i]];

                if (resolutionBuffer === undefined || resolutionBuffer === null) {
                    console.log("Resolution \"" + sizeArray[i] + "\" is not found");
                    continue sizeLoop;
                }
                resolution = resolutionBuffer.width;
            } else {
                resolution = parseInt(sizeArray[i], 10);
            }

            if (urlArray[j].startsWith("http"))    {
                address = urlArray[j];
            } else {

                var pathBuffer = addresses[urlArray[j]];

                if (pathBuffer === undefined || pathBuffer === null) {
                    console.log("Address \"" + urlArray[j] + "\" is not found");
                    continue addressLoop;
                }
                address = pathBuffer.address;
            }

            makeScreenshot(resolution, address, directory);
            numOfScreenshots++;
        }
    }

    if (numOfScreenshots > 0) {
        console.log("Creating " + numOfScreenshots + " screenshot(s) in " + directory + " directory");
    }
}

async function makeScreenshot(size, url, directory) {

    var savePath = config.directories[directory].path;

    var fileName = url.toString().replace(/[\/\:]/g, '').concat('-screenshot-', size, '.png');
    let browser, page;
    tools.checkForDirectory(savePath);
    browser = await puppeteer.launch({args: ["--proxy-server='direct://'", '--proxy-bypass-list=*']});
    page = await browser.newPage();
    page.setViewport({width: size, height: 600});
    await page.goto(url);
    await page.screenshot({path: savePath.concat(path.sep, fileName), fullPage: true});
    browser.close();
    return fileName;
}

module.exports.makeScreenshots = makeScreenshots;