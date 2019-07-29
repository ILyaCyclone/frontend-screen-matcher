const looksSame = require('looks-same');
const devices = require('puppeteer/DeviceDescriptors');

const path = require("path");
const fs = require("fs");



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
    for([addressKey, address] of Object.entries(addressesConfig)) {
        const metadata = readMetadata(addressKey);
        
        for([resolutionKey, resolution] of Object.entries(resolutionsConfig)) {
            const goldenFilePath = goldenDirPath.concat(path.sep, `${addressKey}_${resolutionKey}`, '.png');
            const testFilePath =   testDirPath.concat(path.sep, `${addressKey}_${resolutionKey}`, '.png');
            const resultFilePath = resultDirPath.concat(path.sep, `${addressKey}_${resolutionKey}`, '.png');


            const ignores = metadata != null ? metadata.ignores[resolutionKey] : null;

            compare(goldenFilePath, testFilePath, resultFilePath, ignores);
        }
    }
}

function compare(goldenFilePath, testFilePath, resultFilePath, ignores) {
    console.log(`compare ${goldenFilePath} ${testFilePath} ignoring ${ignores}`);

    looksSame(goldenFilePath, testFilePath, {stopOnFirstFail: false}, function(error, {equal, diffBounds, diffClusters}) {
        logger.debug("looksSame callback "+goldenFilePath);
        if(error != null) {
            logger.error(error);
        }
        if(equal) {
            logger.info(testFilePath+" matches");
        } else {
            let matches = true; 
            for(let diffCluster of diffClusters) {
                console.log("diffCluster: "+JSON.stringify(diffCluster));
                if(!isDiffClusterIgnored(diffCluster, ignores)) {
                    logger.info("===> "+testFilePath+" does not match");
                    matches = false;
                    break;
                }
            }
            if(!matches) {
                looksSame.createDiff({
                    reference: goldenFilePath,
                    current: testFilePath,
                    diff: resultFilePath,
                    highlightColor: 'red',
                    ignoreAntialiasing: false,
                }, error => logger.error(error)
                );
            }
        }

});
}


function isDiffClusterIgnored(diffCluster, ignores) {
    if(ignores == null) return false;
    for(let ignoredObject of ignores) {
        for(let ignoredCoordinates of ignoredObject.coordinates) {
            if(withinRectangle(diffCluster, ignoredCoordinates)) {
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
    if(fs.existsSync(metadataFilePath)) {
        const metadataFile = fs.readFileSync(metadataFilePath);
        const metadata = JSON.parse(metadataFile);
        return metadata;
    } else {
        return null;
    }
}



function getResolutionWidth(resolution) {
    if(resolution.width != null) {
        return parseInt(resolution.width);
    } else {
        if(resolution.device != null) {
            return devices[resolution.device].viewport.width;
        }
    }
    throw new Error("width unknown for resolution: "+JSON.stringify(resolution));
}

module.exports.match = match;