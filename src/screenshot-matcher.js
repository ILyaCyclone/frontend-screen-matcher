const looksSame = require('looks-same');
const devices = require('puppeteer/DeviceDescriptors');

const path = require("path");
const fs = require("fs");

const decorator = require('./screenshot-decorator');
const tools = require('./tools.js');
const config = require('./config');
const resolutionsConfig = config.resolutions;
const addressesConfig = config.addresses;
const directories = config.directories;


const winston = require("winston");
const logger = winston.createLogger({
    level: 'debug', // 'debug' 'info'
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


const testDirAlias = "test";
const goldenDirAlias = "golden";
const resultDirAlias = "result";

const testDirPath = directories[testDirAlias].path;
const goldenDirPath = directories[goldenDirAlias].path;
const resultDirPath = directories[resultDirAlias].path;


async function match(resolutionKey, addressKey) {
    for ([addressKey, address] of Object.entries(addressesConfig)) {
        const metadata = readMetadata(addressKey);

        for ([resolutionKey, resolution] of Object.entries(resolutionsConfig)) {
            const goldenFilePath = goldenDirPath.concat(path.sep, `${addressKey}_${resolutionKey}`, '.png');
            const testFilePath = testDirPath.concat(path.sep, `${addressKey}_${resolutionKey}`, '.png');
            const resultFilePath = resultDirPath.concat(path.sep, `${addressKey}_${resolutionKey}`, '.png');


            const ignores = metadata != null ? metadata.ignores[resolutionKey] : null;

            compare(goldenFilePath, testFilePath, resultFilePath, ignores);
        }
    }
}

function compare(goldenFilePath, testFilePath, resultFilePath, ignores) {
    console.log(`compare ${goldenFilePath} ${testFilePath} ignoring ${ignores}`);

    looksSame(goldenFilePath, testFilePath, { stopOnFirstFail: false }, function (error, { equal, diffBounds, diffClusters }) {
        if (error != null) {
            logger.error("error during image comparison for "+testFilePath+": " + error);
        }
        if (equal) {
            logger.info(testFilePath + " matches");
            return;
        }

        let matches = true;
        for (let diffCluster of diffClusters) {
            // console.log("diffCluster: " + JSON.stringify(diffCluster));
            if (!isDiffClusterIgnored(diffCluster, ignores)) {
                logger.info("===> " + testFilePath + " does not match in cluster: "+JSON.stringify(diffCluster));
                matches = false;
                break;
            }
        }
        if(matches) {
            logger.info(testFilePath + " matches (with ignored areas)");
            return;
        } else {
            logger.info("===> " + testFilePath + " does not match");

            const looksSameDiffOptions = {
                reference: goldenFilePath,
                current: testFilePath,
                // diff: resultFilePath,
                highlightColor: 'red',
                ignoreAntialiasing: false,
            }

            if (ignores == null) {
                // save diff to file directly
                looksSameDiffOptions.diff = resultFilePath;
                looksSame.createDiff(looksSameDiffOptions, err => {
                    if (error != null) {
                        logger.error("error creating diff image: " + error);
                    }
                });
            } else {
                // save diff to buffwe
                looksSame.createDiff(looksSameDiffOptions, (error, diffImageBuffer) => {
                    if (error != null) {
                        logger.error("error creating diff buffer: " + error);
                    } else {
                        const decoratedImageBuffer = decorator.markIgnoredAreas(diffImageBuffer, ignores);
                        fs.writeFileSync('blue.out.png', decoratedImageBuffer);
                        // fs.writeFileSync(resultFilePath, decoratedImageBuffer);
                    }
                }
                );
            }

        }


    });
}


function isDiffClusterIgnored(diffCluster, ignores) {
    if (ignores == null) return false;
    for (let ignoredObject of ignores) {
        for (let ignoredCoordinates of ignoredObject.coordinates) {
            if (withinRectangle(diffCluster, ignoredCoordinates)) {
                return true;
            }
        }
    }
    return false;
}

function withinRectangle(innerRectangle, outerRectangle) {
    return innerRectangle.top >= outerRectangle.top
        && innerRectangle.left >= outerRectangle.left
        && innerRectangle.bottom <= outerRectangle.bottom
        && innerRectangle.right <= outerRectangle.right;
}


function readMetadata(addressKey) {
    const metadataFilePath = goldenDirPath.concat(path.sep, addressKey, '.json');
    if (fs.existsSync(metadataFilePath)) {
        const metadataFile = fs.readFileSync(metadataFilePath);
        const metadata = JSON.parse(metadataFile);
        return metadata;
    } else {
        return null;
    }
}




function drawRectangle(png, coordinates) {

    drawHorizintalLine(png, coordinates.left, coordinates.top, coordinates.right - coordinates.left);
    drawHorizintalLine(png, coordinates.left, coordinates.bottom, coordinates.right - coordinates.left);
    drawVerticalLine(png, coordinates.left, coordinates.top, coordinates.bottom - coordinates.top);
    drawVerticalLine(png, coordinates.right, coordinates.top, coordinates.bottom - coordinates.top);
}

function drawHorizintalLine(png, startX, startY, length) {
    for (var x = startX; x < length; x++) {
        var idx = (png.width * startY + x) << 2;

        png.data[idx] = 0; // R
        png.data[idx + 1] = 255; // G
        png.data[idx + 2] = 0; // B
        png.data[idx + 3] = 255; // alpha
    }
    for (var x = startX; x < length; x++) {
        var idx = (png.width * (startY + 1) + x) << 2;

        png.data[idx] = 0; // R
        png.data[idx + 1] = 255; // G
        png.data[idx + 2] = 0; // B
        png.data[idx + 3] = 255; // alpha
    }
}
function drawVerticalLine(png, startX, startY, length) {
    for (var y = startY; y < length; y++) {
        var idx = (png.width * y + startX) << 2;

        png.data[idx] = 0; // R
        png.data[idx + 1] = 255; // G
        png.data[idx + 2] = 0; // B
        png.data[idx + 3] = 255; // alpha
    }
    for (var y = startY; y < length; y++) {
        var idx = (png.width * y + (startX + 1)) << 2;

        png.data[idx] = 0; // R
        png.data[idx + 1] = 255; // G
        png.data[idx + 2] = 0; // B
        png.data[idx + 3] = 255; // alpha
    }
}


function getResolutionWidth(resolution) {
    if (resolution.width != null) {
        return parseInt(resolution.width);
    } else {
        if (resolution.device != null) {
            return devices[resolution.device].viewport.width;
        }
    }
    throw new Error("width unknown for resolution: " + JSON.stringify(resolution));
}

module.exports.match = match;