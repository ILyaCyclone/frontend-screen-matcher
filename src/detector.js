const puppeteer = require('puppeteer');
const expect = require('chai').expect;
const pixelmatch = require('pixelmatch');
const fs = require('fs');
const PNG = require('pngjs').PNG;
var path = require("path");

const localhost = 'http://127.0.0.1:7001';

const testDir = 'C:\\Users\\romanov\\Desktop\\puppeteer\\pages';
const goldenDir = 'C:\\Users\\romanov\\Desktop\\puppeteer\\goldenDir';
const resultsDir = 'C:\\Users\\romanov\\Desktop\\puppeteer\\results';
describe('checking for changes', function() {
    let browser, page;

    // This is ran when the suite starts up.
    before(async function() {
        // Create the test directory if needed. This and the goldenDir
        // variables are global somewhere.
        checkForDirectory(testDir);
        checkForDirectory(goldenDir);
        checkForDirectory(resultsDir);
    });

    // This is ran before every test. It's where you start a clean browser.
    beforeEach(async function() {
        browser = await puppeteer.launch();
        page = await browser.newPage();
    });
    // This is ran after every test; clean up after your browser.
    afterEach(() => browser.close());


    // Wide screen tests!
    describe('wide screen', function() {
        beforeEach(async function() {
            return page.setViewport({width: 800, height: 600});
        });
        it('/view1', async function() {
            return takeAndCompareScreenshot(page, 'view1.html', 'wide');
        });
        // And your other routes, 404, etc.
    });

    // Narrow screen tests are the same, but with a different viewport.
    describe('narrow screen', function() {
        beforeEach(async function() {
            return page.setViewport({width: 375, height: 667});
        });
        it('/view1', async function() {
            return takeAndCompareScreenshot(page, 'view1.html', 'narrow');
        });
        // And your other routes, 404, etc.
    });
});

// - page is a reference to the Puppeteer page.
// - route is the path you're loading, which I'm using to name the file.
// - filePrefix is either "wide" or "narrow", since I'm automatically testing both.
async function takeAndCompareScreenshot(page, route, filePrefix) {
    // If you didn't specify a file, use the name of the route.
    let fileName = filePrefix + path.sep + (route ? route : 'index');


    // Start the browser, go to that page, and take a screenshot.
    await page.goto('http://miit.ru', {

        timeout: 3000000
    });
    await page.screenshot({path: goldenDir.concat(path.sep, fileName, '.png')});

    // Test to see if it's right.
    return compareScreenshots(fileName);
}

function compareScreenshots(fileName) {
    return new Promise((resolve, reject) => {
        const img1 = fs.createReadStream(testDir.concat(path.sep, fileName, '.png')).pipe(new PNG()).on('parsed', doneReading);
    const img2 = fs.createReadStream(goldenDir.concat(path.sep, fileName, '.png')).pipe(new PNG()).on('parsed', doneReading);

    let filesRead = 0;
    function doneReading() {
        // Wait until both files are read.
        if (++filesRead < 2) return;

        // The files should be the same size.
        expect(img1.width, 'image widths are the same').equal(img2.width);
        expect(img1.height, 'image heights are the same').equal(img2.height);

        // Do the visual diff.
        const diff = new PNG({width: img1.width, height: img2.height});
        const numDiffPixels = pixelmatch(
            img1.data, img2.data, diff.data, img1.width, img1.height,
            {threshold: 0.1, includeAA: true});

        diff.pack().pipe(fs.createWriteStream(resultsDir.concat(path.sep, fileName, '.png')));
        // The files should look the same.
        expect(numDiffPixels, 'number of different pixels').equal(0);
        resolve();
    }
});
}

function checkForDirectory(directory) {

    if (!fs.existsSync(directory)) fs.mkdirSync(directory);

    if (!fs.existsSync(directory.concat(path.sep, 'wide'))) fs.mkdirSync(directory.concat(path.sep, 'wide'));
    if (!fs.existsSync(directory.concat(path.sep, 'narrow'))) fs.mkdirSync(directory.concat(path.sep, 'narrow'));

}