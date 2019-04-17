const expect = require('chai').expect;
const pixelmatch = require('pixelmatch');
const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require("path");

const resolutions = require('./config.js').resolutions;
const addresses= require('./config.js').addresses;
const directories = require('./config.js').directories;

describe('checking for changes', function () {
    var size;

    before('checking for directories', function() {
        for (var item in directories) {
            checkForDirectory(directories[item].path);
        }
    });

    for (var pageSize in resolutions) {
        for (var page in addresses) {

            size = resolutions[pageSize].width;
            var fileName = addresses[page].address.toString().replace(/[\/\:]/g, '').concat('-screenshot-', size, '.png');

            prepareToCompare(fileName);

        }
    }
});

function prepareToCompare(fileName) {
    it(fileName, function () {
        return compareScreenshots(fileName);
    });
}

function checkForDirectory(directory, numberOfResolutions) {

    if (!fs.existsSync(directory)) fs.mkdirSync(directory);

}

function compareScreenshots(fileName) {
    return new Promise((resolve, reject) => {
        const img1 = fs.createReadStream(directories['test'].path.concat(path.sep, fileName)).pipe(new PNG()).on('parsed', doneReading);
        const img2 = fs.createReadStream(directories['golden'].path.concat(path.sep, fileName)).pipe(new PNG()).on('parsed', doneReading);

        let filesRead = 0;

        function doneReading() {
            // Wait until both files are read.
            if (++filesRead < 2) return;

            // The files should be the same size.
            expect(img1.width, 'image widths are the same').equal(img2.width);
            // expect(img1.height, 'image heights are the same').equal(img2.height);

            // Do the visual diff.
            const diff = new PNG({width: img1.width, height: img2.height});
            const numDiffPixels = pixelmatch(
                img1.data, img2.data, diff.data, img1.width, img1.height,
                {threshold: 0.1, includeAA: true});

            diff.pack().pipe(fs.createWriteStream(directories['result'].path.concat(path.sep, fileName)));
            // The files should look the same.
            expect(numDiffPixels, 'number of different pixels').equal(0);
            resolve();
        }
    });
}