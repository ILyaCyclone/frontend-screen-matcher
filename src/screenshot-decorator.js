var drawing = require('pngjs-draw'); // https://github.com/aloisdeniel/node-pngjs-draw
var PNG = drawing(require('pngjs').PNG);

function markIgnoredAreas(imageBuffer, ignores) {
    // {filterType: 4}
    const pngOptions = {};
    new PNG(pngOptions).parse(imageBuffer, (error, png) => {
        if (error) {
            logger.error("Could not parse image: " + error);
        }
        for (let ignoredObject of ignores) {
            for (let ignoredCoordinates of ignoredObject.coordinates) {
                const rectX = ignoredCoordinates.left;
                const rectY = ignoredCoordinates.top;
                const rectWidth = ignoredCoordinates.right - ignoredCoordinates.left + 1;
                const rectHeight = ignoredCoordinates.bottom - ignoredCoordinates.top + 1;
                console.log("drawing rect: " + JSON.stringify(ignoredCoordinates));
                console.log(`rectWidth: ${rectWidth} rectHeight: ${rectHeight}`)
                png.fillRect(rectX, rectY, rectWidth, rectHeight, png.colors.green(100));
                png.drawRect(rectX, rectY, rectWidth, rectHeight, png.colors.green(255));
                // const lineThickness = 3;
                // for (let i = 0; i < lineThickness; i++) {
                //     this.drawRect(rectX+i, rectY+i, rectWidth-(i==0?0:(i+1)), rectHeight-(i==0?0:(i+1)), this.colors.green(255))
                // }
            }
        }

        // png.pack().pipe(fs.createWriteStream('blue.out.png'));
        // png.pack().pipe(fs.createWriteStream(resultFilePath));
        return PNG.sync.write(png, pngOptions);
    });
} 

module.exports.markIgnoredAreas = markIgnoredAreas;
