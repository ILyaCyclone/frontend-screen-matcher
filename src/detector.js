const puppeteer = require('puppeteer');
const expect = require('chai').expect;
const pixelmatch = require('pixelmatch');
const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require("path");

const localhost = 'http://127.0.0.1:7001';

const testDir = 'C:\\Users\\romanov\\Desktop\\puppeteer\\pages';
const goldenDir = 'C:\\Users\\romanov\\Desktop\\puppeteer\\goldenDir';
const resultsDir = 'C:\\Users\\romanov\\Desktop\\puppeteer\\results';

// const resolutions = [[1440, 2000], [1200, 2000], [860, 2000], [640, 2000], [420, 2000]];

const resolutions = {
    "xs": {
        infix: "xs",
        description : "mobile 1 column",
        width:575
    },
    "sm": {
        infix: "sm",
        description: "mobile 2 column",
        width: 576
    }
};

for(const infix in resolutions) {

}

// print process.argv
process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
});

describe('checking for changes', function () {
    let browser, page;

    // This is ran when the suite starts up.
    before(async function () {
        // Create the test directory if needed. This and the goldenDir
        // variables are global somewhere.
        checkForDirectory(testDir, resolutions.length);
        checkForDirectory(goldenDir, resolutions.length);
        checkForDirectory(resultsDir, resolutions.length);
    });

    // This is ran before every test. It's where you start a clean browser.
    beforeEach(async function () {
        browser = await puppeteer.launch();
        page = await browser.newPage();
    });
    // This is ran after every test; clean up after your browser.
    afterEach(() => browser.close());

    for (let i = 0; i < resolutions.length; i++) {
        describe('test of resolution '.concat(resolutions[i][0], 'x', resolutions[i][1]), function () {
            beforeEach(async function () {
                return page.setViewport({width: resolutions[i][0], height: resolutions[i][1]});
                // return page.setViewport({width: resolutions[i][0]});
            });
            it('/view1', async function () {
                return takeAndCompareScreenshot(page, 'view1.html', 'resolution' + i);
            });
            // And your other routes, 404, etc.
        });
    }
});

// - page is a reference to the Puppeteer page.
// - route is the path you're loading, which I'm using to name the file.
// - filePrefix is either "wide" or "narrow", since I'm automatically testing both.
async function takeAndCompareScreenshot(page, route, filePrefix) {
    // If you didn't specify a file, use the name of the route.
    let fileName = filePrefix + path.sep + (route ? route : 'index');


    // Start the browser, go to that page, and take a screenshot.
    await page.goto('https://rut-miit.ru', {

        timeout: 3000000
    });
    await page.screenshot({path: testDir.concat(path.sep, fileName, '.png'), fullPage: true});

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

function checkForDirectory(directory, numberOfResolutions) {

    if (!fs.existsSync(directory)) fs.mkdirSync(directory);

    for (let i = 0; i < numberOfResolutions; i++) {
        if (!fs.existsSync(directory.concat(path.sep, 'resolution', i))) fs.mkdirSync(directory.concat(path.sep, 'resolution', i));
    }

}