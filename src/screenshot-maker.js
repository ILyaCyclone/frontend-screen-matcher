const puppeteer = require('puppeteer');
const path = require("path");
const fs = require("fs");
const config = require('./config');
const resolutions = config.resolutions;
const addresses = config.addresses;

const tools = require('./tools.js');

async function makeScreenshots(size, url, directory, fn) {

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
        for (j in urlArray)  {

            var screenResolution, address;

            if (isNaN(sizeArray[i]))    {
                var resolutionBuffer = resolutions[sizeArray[i]];

                if (tools.isUndefinedOrNull(resolutionBuffer)) {
                    console.log("Resolution \"" + sizeArray[i] + "\" is not found");
                    continue sizeLoop;
                }
                screenResolution = resolutionBuffer.width;
            } else {
                screenResolution = parseInt(sizeArray[i], 10);
            }

            if (urlArray[j].startsWith("http"))    {
                address = urlArray[j];

                if(numberOfUnknownUrls >= numberOfFileNames) {
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

            makeScreenshot(screenResolution, address, directory, fileName);
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
    browser = await puppeteer.launch({args: ["--proxy-server='direct://'", '--proxy-bypass-list=*']});
    page = await browser.newPage();
    page.setViewport({width: size, height: 600});
    await page.goto(url, {waitUntil: 'load', timeout: 0});
    await page.screenshot({path: savePath.concat(path.sep, fileName, '.png'), fullPage: true});
    browser.close();
}

module.exports.makeScreenshots = makeScreenshots;