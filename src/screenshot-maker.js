const puppeteer = require('puppeteer');
const path = require("path");
const fs = require("fs");
const config = require('./config');
const resolutions = config.resolutions;

async function makeScreenshot(size, url, directory) {
    directory = "golden";
    var savePath = config.directories[directory].path;
    var pageSize;
    if (isNaN(size))    {
        pageSize = resolutions[size].width;
    } else {
        pageSize = size;
    }

    var fileName = url.toString().replace(/[\/\:]/g, '').concat('-screenshot-', pageSize, '.png');
    let browser, page;
    checkForDirectory(savePath);
    browser = await puppeteer.launch({args: ["--proxy-server='direct://'", '--proxy-bypass-list=*']});
    page = await browser.newPage();
    page.setViewport({width: pageSize, height: 600});
    await page.goto(url);
    await page.screenshot({path: savePath.concat(path.sep, fileName), fullPage: true});
    browser.close()
    return fileName;
}

function checkForDirectory(directory) {

    if (!fs.existsSync(directory)) fs.mkdirSync(directory);

}

module.exports.makeScreenshot = makeScreenshot;