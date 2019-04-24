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

module.exports.getArray = getArray;
module.exports.checkForDirectory = checkForDirectory;
