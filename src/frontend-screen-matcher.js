const yargs = require('yargs');
const screenshotMaker = require('./screenshot-maker');
const Mocha = require('mocha');
const mocha = new Mocha({
    ui: 'bdd',
    reporter: 'list'}).addFile('./src/screen-matcher');

const config = require('./config');
const addresses = config.addresses;
const resolutions = config.resolutions;

yargs
    .usage('Usage: $0 <command> [options]')
    .command(['screenshot [size] [url] [path]', 's', 'sc'], 'make a screenshot', (yargs) => {
        yargs
            .positional('size', {
                describe: 'size of screen',
                default: resolutions
            })
            .option('url', {
            alias: 'u',
            default: addresses
        })
            .option('path', {
            alias: 'p',
            default: "test"
        })
    }, (argv) => {
        screenshotMaker.makeScreenshots(argv.size, argv.url, argv.path);
    }).command(['test','t'], 'start a test', (argv) => {
        mocha.run();
    })
    .argv

function makeScreenshot(resolutions, pageUrls, directory) {

    if (typeof resolutions == "string") {
        if (typeof pageUrls == "string") {
            screenshotMaker.makeScreenshot(resolutions, pageUrls, directory);
        } else {
            var pagesMap = new Map(Object.entries(pageUrls));
            pagesMap.forEach(pages => {
                screenshotMaker.makeScreenshot(resolutions, pages.address, directory);
            });
        }
    } else {
        if (typeof pageUrls == "string") {
            var resolutionsMap = new Map(Object.entries(resolutions));
            resolutionsMap.forEach(resolution => {
                screenshotMaker.makeScreenshot(resolution.width, pageUrls, directory);
            });
        } else {
            var resolutionsMap = new Map(Object.entries(resolutions));
            resolutionsMap.forEach(resolution => {
                var pagesMap = new Map(Object.entries(pageUrls));
                pagesMap.forEach(pages => {
                    screenshotMaker.makeScreenshot(resolution.width, pages.address, directory);
                });
            });
        }
    }
}
