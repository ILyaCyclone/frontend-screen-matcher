const fs = require("fs");
var drawing = require('pngjs-draw'); // https://github.com/aloisdeniel/node-pngjs-draw
var PNG = drawing(require('pngjs').PNG);

const tools = require("./tools");

/**
 * 
 * @param {*} imageBuffer 
 * @param {*} coordinates {top, left, bottom, right} 
 * @param {*} color [r, g, b, a]
 * @param {*} borderThickness number of pixels
 */
async function drawRect(imageBuffer, coordinates, color, borderThickness) {
    return await new Promise((resolve, reject) => {
        const pngOptions = {};
        new PNG(pngOptions).parse(imageBuffer, (error, png) => {
            if (error) {
                reject("Could not parse image: " + error);
            }
            const rectX = coordinates.left;
            const rectY = coordinates.top;
            const rectWidth = coordinates.right - coordinates.left + 1;
            const rectHeight = coordinates.bottom - coordinates.top + 1;

            for (let i = 0; i < borderThickness; i++) {
                png.drawRect(rectX + i, rectY + i, rectWidth - (i * 2), rectHeight - (i * 2), png.colors.new(...color));
            }

            const decoratedImageBuffer = PNG.sync.write(png, pngOptions);
            resolve(decoratedImageBuffer);
        });
    });
}


async function markIgnoredAreas(imageBuffer, ignores) {
    if (tools.isNotEmptyArray(ignores)) {
        // {filterType: 4}
        return await new Promise((resolve, reject) => {
            const pngOptions = {};
            new PNG(pngOptions).parse(imageBuffer, (error, png) => {
                if (error) {
                    reject("Could not parse image: " + error);
                }
                for (let ignoredObject of ignores) {
                    for (let ignoredCoordinates of ignoredObject.coordinates) {
                        const rectX = ignoredCoordinates.left;
                        const rectY = ignoredCoordinates.top;
                        const rectWidth = ignoredCoordinates.right - ignoredCoordinates.left + 1;
                        const rectHeight = ignoredCoordinates.bottom - ignoredCoordinates.top + 1;

                        // png.fillRect(rectX, rectY, rectWidth, rectHeight, png.colors.green(100));
                        const borderThickness = 3;
                        for (let i = 0; i < borderThickness; i++) {
                            png.drawRect(rectX + i, rectY + i, rectWidth - (i * 2), rectHeight - (i * 2), png.colors.green(255));
                        }
                    }
                }

                const decoratedImageBuffer = PNG.sync.write(png, pngOptions);
                resolve(decoratedImageBuffer);
            });
        });
    } else {
        return imageBuffer;
    }
}

module.exports.drawRect = drawRect;
module.exports.markIgnoredAreas = markIgnoredAreas;
