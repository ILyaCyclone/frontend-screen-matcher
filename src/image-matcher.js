const pixelmatch = require('pixelmatch');
const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require("path");

const config = require('./config.js');
const resolutions = config.resolutions;
const addresses= config.addresses;
const directories = config.directories;

const tools = require('./tools.js');

function match(size, url) {

    var sizeArray = tools.getArray(size);
    var urlArray = tools.getArray(url);
    var fileName;

    sizeLoop:
    for (i in sizeArray) {

        addressLoop:
        for (j in urlArray)  {

            var resolution, addressLoop;

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

            fileName = address.toString().replace(/[\/\:]/g, '').concat('-screenshot-', resolution, '.png');

            compare(fileName);
        }
    }
}

function compare(fileName) {

    var fileFullTestPath = directories['test'].path.concat(path.sep, fileName);
    var fileFullGoldenPath = directories['golden'].path.concat(path.sep, fileName);
    var fileFullResultsPath = directories['result'].path.concat(path.sep, fileName);

    if (missingInTest = !fs.existsSync(fileFullTestPath) || !fs.existsSync(fileFullGoldenPath)) {
        var missingDir;
        if (missingInTest) {
            missingDir = "golden";
        } else {
            missingDir = "test";
        }
        console.log("Can't find " + fileName + " file in " + missingDir + " directory. Please make sure the file was created");
        return;
    }

    const img1 = fs.createReadStream(fileFullTestPath).pipe(new PNG()).on('parsed', doneReading);
    const img2 = fs.createReadStream(fileFullGoldenPath).pipe(new PNG()).on('parsed', doneReading);

    let filesRead = 0;

    function doneReading() {

        if (++filesRead < 2) return;

        const diff = new PNG({width: img1.width, height: img2.height});
        const numDiffPixels = pixelmatch(
            img1.data, img2.data, diff.data, img1.width, img1.height,
            {threshold: 0, includeAA: true});

        tools.checkForDirectory(directories['result'].path);

        diff.pack().pipe(fs.createWriteStream(fileFullResultsPath));

        if (numDiffPixels > 0) {
            console.log("✖ " + fileName + ". Number of different pixels is " + numDiffPixels);
        } else {
            console.log("√ " + fileName);
        }

    }
}

module.exports.match = match;