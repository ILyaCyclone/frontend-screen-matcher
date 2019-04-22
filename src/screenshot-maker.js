const puppeteer = require('puppeteer');
const path = require("path");
const fs = require("fs");
const config = require('./config');
const resolutions = config.resolutions;
const addresses = config.addresses;

async function makeScreenshots(size, url, directory) {

    var sizeArray = getSizeArray(size);
    var urlArray = getUrlArray(url);

    for (i in sizeArray) {
        for (j in urlArray)  {

            var resolution, path;

            if (isNaN(sizeArray[i]))    {
                resolution = resolutions[sizeArray[i]].width;
            } else {
                resolution = parseInt(sizeArray[i], 10);
            }

            if (urlArray[j].startsWith("http"))    {
                path = urlArray[j];
            } else {
                path = addresses[urlArray[j]].address;
            }

            makeScreenshot(resolution, path, directory);
        }
    }

}

function getSizeArray (variable) {

    var sizeArray = [];
    if (typeof variable == "object") {

        var bufArray = Array.from(Object.entries(variable));

        for (i in bufArray) {
            sizeArray.push(bufArray[i][0]);
        }
    } else {
        sizeArray = variable.split(",");
    }

    return sizeArray;
}

function getUrlArray (variable) {

    var urlArray = [];
    if (typeof variable == "object") {

        var bufArray = Array.from(new Map(Object.entries(variable)));

        for (i in bufArray) {
            urlArray.push(bufArray[i][0])
        }

    } else {
        urlArray = variable.split(",");
    }

    return urlArray;
}

async function makeScreenshot(size, url, directory) {

    var savePath = config.directories[directory].path;

    var fileName = url.toString().replace(/[\/\:]/g, '').concat('-screenshot-', size, '.png');
    let browser, page;
    checkForDirectory(savePath);
    browser = await puppeteer.launch({args: ["--proxy-server='direct://'", '--proxy-bypass-list=*']});
    page = await browser.newPage();
    page.setViewport({width: size, height: 600});
    await page.goto(url);
    await page.screenshot({path: savePath.concat(path.sep, fileName), fullPage: true});
    browser.close()
    return fileName;
}

function checkForDirectory(directory) {

    if (!fs.existsSync(directory)) fs.mkdirSync(directory);

}

module.exports.makeScreenshots = makeScreenshots;