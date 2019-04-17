const yargs = require('yargs');
const screenshotMaker = require('./screenshot-maker');
const Mocha = require('mocha');
const mocha = new Mocha({
    ui: 'bdd',
    reporter: 'list'}).addFile('./src/screen-matcher');

const addresses = require('./config').addresses;
const resolutions = require('./config').resolutions;

yargs
    .usage('Usage: $0 <command> [options]')
    .command(['screenshot [size] [url]', 's', 'sc'], 'make a screenshot', (yargs) => {
        yargs
            .positional('size', {
                describe: 'size of screen',
                default: resolutions
            })
            .option('url', {
            alias: 'u',
            default: addresses,
            type: 'string'
        })
    }, (argv) => {
        makeScreenshot(argv.size, argv.url);
    }).command(['test','t'], 'start a test', (argv) => {
        mocha.run();
    })
    .argv

function makeScreenshot(resolutions, pageUrls) {

    if (typeof resolutions == "string") {
        if (typeof pageUrls == "string") {
            screenshotMaker.makeScreenshot(resolutions, pageUrls);
        } else {
            var pagesMap = new Map(Object.entries(pageUrls));
            pagesMap.forEach(pages => {
                screenshotMaker.makeScreenshot(resolutions, pages.address);
            });
        }
    } else {
        if (typeof pageUrls == "string") {
            screenshotMaker.makeScreenshot(resolutions, pageUrls);
        } else {
            var resolutionsMap = new Map(Object.entries(resolutions));
            resolutionsMap.forEach(resolution => {
                var pagesMap = new Map(Object.entries(pageUrls));
                pagesMap.forEach(pages => {
                    screenshotMaker.makeScreenshot(resolution.width, pages.address);
                });
            });
        }
    }
}
