const yargs = require('yargs');
const screenshotMaker = require('./screenshot-maker');
const Mocha = require('mocha');
const mocha = new Mocha({
    ui: 'bdd',
    reporter: 'list'}).addFile('./src/screen-matcher');
const imageMatcher = require("./image-matcher");

const config = require('./config');
const addresses = config.addresses;
const resolutions = config.resolutions;

yargs
    .usage('Usage: $0 <command> [options]')
    .command(['screenshot [size] [url] [dir]', 's', 'sc'], 'make a screenshot', (yargs) => {
        yargs
            .positional('size', {
                describe: 'size of screen',
                default: resolutions,
                type: "string"
            })
            .option('url', {
            alias: 'u',
            default: addresses
        })
            .option('dir', {
            alias: 'd',
            default: "test"
        })
    }, (argv) => {
        screenshotMaker.makeScreenshots(argv.size, argv.url, argv.dir);
    }).command(['test [size] [url]','t'], 'start a test', (yargs) => {
    yargs
        .positional('size', {
            describe: 'size of screen',
            default: resolutions,
            type: "string"
        })
        .option('url', {
            alias: 'u',
            default: addresses
        })
    }, (argv) => {
        imageMatcher.match(argv.size, argv.url);
    })
    .argv
