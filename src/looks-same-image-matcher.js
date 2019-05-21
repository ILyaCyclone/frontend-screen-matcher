var looksSame = require('looks-same');

const path = require("path");

const config = require('./config.js');
const resolutions = config.resolutions;
const addresses= config.addresses;
const directories = config.directories;

const tools = require('./tools.js');

const testDirAlias = "test";
const goldenDirAlias = "golden";
const resultDirAlias = "result";

const testDirPath = directories[testDirAlias].path;
const goldenDirPath = directories[goldenDirAlias].path;
const resultDirPath = directories[resultDirAlias].path;

function match(size, inputFileName) {

    var sizeArray = tools.getArray(size);
    var fileNameArray = tools.getArray(inputFileName);
    var sizeBounds;

    sizeLoop:
        for (i in sizeArray) {

            fileNameLoop:
                for (j in fileNameArray)  {

                    var screenResolution, fileName;

                    if (isNaN(sizeArray[i]))    {
                        var resolutionBuffer = resolutions[sizeArray[i]];

                        if (tools.isUndefinedOrNull(resolutionBuffer)) {
                            console.log("Resolution \"" + sizeArray[i] + "\" is not found");
                            continue sizeLoop;
                        }
                        screenResolution = resolutionBuffer.width;

                    } else {
                        screenResolution = parseInt(sizeArray[i], 10);
                    }

                    var addressInfix = fileNameArray[j];
                    var sizeInfix = sizeArray[i];

                    if (!tools.isUndefinedOrNull(addresses[addressInfix])) {

                        var bounds = addresses[addressInfix].bounds;
                        if (!tools.isUndefinedOrNull(bounds))
                            sizeBounds = bounds[sizeInfix];
                    }

                    fileName = fileNameArray[j] + "-" + screenResolution + ".png";

                    compare(fileName, sizeBounds);
                }
        }
}

function compare(fileName, bounds) {

    var fileFullGoldenPath = goldenDirPath.concat(path.sep, fileName);
    var fileFullTestPath = testDirPath.concat(path.sep, fileName);

    if (!tools.exist(fileFullGoldenPath)) {
        console.log("file \"" + fileFullGoldenPath + "\" is not found");
        return;
    }

    if (!tools.exist(fileFullTestPath)) {
        console.log("file \"" + fileFullTestPath + "\" is not found");
        return;
    }

    looksSame(fileFullGoldenPath, fileFullTestPath, function(error, {equal, diffBounds}) {

        var sameBounds;
        if (tools.isUndefinedOrNull(bounds)) {
            sameBounds = true;
        } else {
            sameBounds = checkDiffBounds(bounds, diffBounds);
        }

        if (equal) {
            console.log("√ " + fileName);
        } else {

            if (sameBounds) {
                console.log("√ " + fileName);
            } else {
                console.log("✖ " + fileName);

                tools.checkForDirectory(resultDirPath);
                var fileFullResultsPath = resultDirPath.concat(path.sep, fileName);

                makeDiffImage(fileFullGoldenPath, fileFullTestPath, fileFullResultsPath)
            }

        }
    });
}

function makeDiffImage(pathToGoldenImg, pathToTestImg, pathToResultImg) {

    looksSame.createDiff({
        reference: pathToGoldenImg,
        current: pathToTestImg,
        diff: pathToResultImg,
        highlightColor: 'red',
        ignoreAntialiasing: false,
    }, function(error) {

    });

}

function checkDiffBounds(defaultBounds, diffBounds) {

    if ((diffBounds.top >= defaultBounds.top) && (diffBounds.bottom <= defaultBounds.bottom) && (diffBounds.left >= defaultBounds.left) && (diffBounds.right <= defaultBounds.right))
        return true;
    else
        return false;

}

module.exports.match = match;