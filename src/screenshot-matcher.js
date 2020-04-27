const path = require("path");
const fs = require("fs");
const util = require('util');

const looksSame = util.promisify(require('looks-same'))
const devices = require('puppeteer/DeviceDescriptors');

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


// const concurrency = 5;
// const pLimit = require('p-limit')(concurrency);



const testDirAlias = "test";
const goldenDirAlias = "golden";
const resultDirAlias = "result";

const testDirPath = directories[testDirAlias].path;
const goldenDirPath = directories[goldenDirAlias].path;
const resultDirPath = directories[resultDirAlias].path;


async function match(/*resolutionKey, addressKey*/) {


    for ([addressKey, address] of Object.entries(addressesConfig)) {
        await matchAddress(addressKey, address, resolutionsConfig);
    }
}


async function matchAddress(addressKey, address, resolutions) {
    const metadata = readMetadata(addressKey);

    for ([resolutionKey, resolution] of Object.entries(resolutions)) {
        const goldenFilePath = goldenDirPath.concat(path.sep, `${addressKey}_${resolutionKey}`, '.png');
        const testFilePath = testDirPath.concat(path.sep, `${addressKey}_${resolutionKey}`, '.png');
        const resultFilePath = resultDirPath.concat(path.sep, `${addressKey}_${resolutionKey}`, '.png');


        const ignores = metadata != null ? metadata.ignores[resolutionKey] : null;

        await compare(goldenFilePath, testFilePath, resultFilePath, ignores);
    }
}

async function compare(goldenFilePath, testFilePath, diffFilePath, ignores) {

    const looksSameOptions = {
        stopOnFirstFail: false,
        shouldCluster: true,
        clustersSize: 10,
        ignoreAntialiasing: true,
        antialiasingTolerance: 10 // 0..10
    }

    // {equal, diffBounds, diffClusters}
    const looksSameResult = await looksSame(goldenFilePath, testFilePath, looksSameOptions);
    const equal = looksSameResult.equal;
    const diffClusters = looksSameResult.diffClusters;

    if (equal) {
        // console.log(testFilePath + " matches");
        return true;
    }

    // console.log(testFilePath + " is not equal")

    const nonIgnoredDiffClusters = diffClusters.filter(diffCluster => !isDiffClusterIgnored(diffCluster, ignores));

    const matches = nonIgnoredDiffClusters.length == 0;

    if (matches) {
        console.log(testFilePath + " matches (with ignored areas)");
        return true;
    } else {
        console.log("===> " + testFilePath + " does not match in clusters: "+JSON.stringify(nonIgnoredDiffClusters))    


        const looksSameDiffOptions = {
            ...looksSameOptions,
            reference: goldenFilePath,
            current: testFilePath,
            // diff: diffFilePath,
            highlightColor: 'red'
        }

        // if (!tools.isNotEmptyArray(ignores)) {
        //     // save diff image to file directly
        //     looksSameDiffOptions.diff = diffFilePath;
        //     looksSame.createDiff(looksSameDiffOptions, err => {
        //         if (err) logger.error("error creating diff image: " + err);
        //     });
        // } else {
            // save diff image to buffer
            looksSame.createDiff(looksSameDiffOptions, async (error, diffImageBuffer) => {
                if (error) {
                    logger.error("error creating diff buffer: " + error);
                } else {
                    let decoratedImageBuffer = diffImageBuffer;
                    for (let cluster of nonIgnoredDiffClusters) {
                        decoratedImageBuffer = await decorator.drawRect(decoratedImageBuffer, cluster, [255, 0, 0], 3);
                    }
                    decoratedImageBuffer = await decorator.markIgnoredAreas(decoratedImageBuffer, ignores);

                    fs.writeFile(diffFilePath, decoratedImageBuffer
                        , err => {
                            if (err) logger.error("Could not write decorated image: " + err);
                        });
                }
            });
        // }
        return false;
    }
}


function isDiffClusterIgnored(diffCluster, ignores) {
    const tolerance = 3;
    if (!tools.isNotEmptyArray(ignores)) return false;
    for (let ignoredObject of ignores) {
        for (let ignoredCoordinates of ignoredObject.coordinates) {
            if (withinRectangle(diffCluster, ignoredCoordinates, tolerance)) {
                return true;
            }
        }
    }
    return false;

    // return ignores.map(ignoredObject => ignoredObject.coordinates)
    //     .some(ignoredCoordinates => withinRectangle(diffCluster, ignoredCoordinates, tolerance));
}

function withinRectangle(innerRectangle, outerRectangle, tolerance) {
    return innerRectangle.top >= outerRectangle.top - tolerance
        && innerRectangle.left >= outerRectangle.left - tolerance
        && innerRectangle.bottom <= outerRectangle.bottom + tolerance
        && innerRectangle.right <= outerRectangle.right + tolerance;
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