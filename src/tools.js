const fs = require('fs');

function getArray(variable) {

    var array = [];
    if (typeof variable == "object") {

        var bufArray = Array.from(Object.entries(variable));

        for (i in bufArray) {
            array.push(bufArray[i][0]);
        }
    } else {
        array = variable.split(",");
    }

    return array;
}

function checkForDirectory(directory, numberOfResolutions) {

    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

}

function exist(fileName) {

    if (fs.existsSync(fileName))
        return true;
    else
        return false;

}

function isUndefinedOrNull(object) {
    if (object === undefined || object === null) {
        return true;
    } else {
        return false;
    }
}

module.exports.getArray = getArray;
module.exports.checkForDirectory = checkForDirectory;
module.exports.exist = exist;
module.exports.isUndefinedOrNull = isUndefinedOrNull;
