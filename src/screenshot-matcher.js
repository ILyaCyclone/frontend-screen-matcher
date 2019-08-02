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

function compare(goldenFilePath, testFilePath, diffFilePath, ignores) {
    console.log(`compare ${goldenFilePath} ${testFilePath} ignoring ${ignores}`);

    looksSame(goldenFilePath, testFilePath, { stopOnFirstFail: false, shouldCluster: true, clustersSize: 0 }
        , (error, { equal, diffBounds, diffClusters }) => {
            if (error != null) {
                logger.error("error during image comparison for " + testFilePath + ": " + error);
            }
            if (equal) {
                logger.info(testFilePath + " matches");
                return;
            }

            let matches = true;
            const nonIgnoredDiffClusters = [];
            for (let diffCluster of diffClusters) {
                // console.log("diffCluster: " + JSON.stringify(diffCluster));
                if (!isDiffClusterIgnored(diffCluster, ignores)) {
                    logger.info("===> " + testFilePath + " does not match in cluster: " + JSON.stringify(diffCluster));
                    nonIgnoredDiffClusters.push(diffCluster);
                    matches = false;
                    break;
                }
            }
            if (matches) {
                logger.info(testFilePath + " matches (with ignored areas)");
                return;
            } else {
                logger.info("===> " + testFilePath + " does not match");

                const looksSameDiffOptions = {
                    reference: goldenFilePath,
                    current: testFilePath,
                    // diff: diffFilePath,
                    highlightColor: 'red',
                    ignoreAntialiasing: false,
                }

                if (ignores == null) {
                    // save diff image to file directly
                    looksSameDiffOptions.diff = diffFilePath;
                    looksSame.createDiff(looksSameDiffOptions, err => {
                        if (err) {
                            logger.error("error creating diff image: " + err);
                        }
                    });
                } else {
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
                                    if (err) {
                                        logger.error("Could not write decorated image: " + err + ". Writing undecorated image instead,");
                                        fs.writeFile(diffFilePath, diffImageBuffer
                                            , err2 => { if (err2) logger.error("Could not write undecorated image: " + err2); }
                                        );
                                    }
                                });
                        }
                    }
                    );
                }

            }


        });
}


function isDiffClusterIgnored(diffCluster, ignores) {
    const tolerance = 3;
    if (ignores == null) return false;
    for (let ignoredObject of ignores) {
        for (let ignoredCoordinates of ignoredObject.coordinates) {
            if (withinRectangle(diffCluster, ignoredCoordinates, tolerance)) {
                return true;
            }
        }
    }
    return false;
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