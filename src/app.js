const yargs = require('yargs');
const screenshotMaker = require('./screenshot-maker');
const Mocha = require('mocha');
const mocha = new Mocha({
    ui: 'bdd',
    reporter: 'list'}).addFile('./src/screen-matcher');
const looksSame = require("./looks-same-image-matcher");

const config = require('./config');
const addresses = config.addresses;
const resolutions = config.resolutions;
const directories = config.directories;

yargs
    .usage('Usage: $0 <command> [options]')
    .command(['screenshot [size] [url] [dir] [fn]', 's', 'sc'], 'make a screenshot', (yargs) => {
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
            .option('fn')
    }, (argv) => {
        screenshotMaker.makeScreenshots(argv.size, argv.url, argv.dir, argv.fn);
    }).command(['test [size] [fn]','t'], 'start a test', (yargs) => {
    yargs
        .positional('size', {
            describe: 'size of screen',
            default: resolutions,
            type: "string"
        })
        .option('fn', {
            describe: 'file name argument',
            default: addresses
        })
    }, (argv) => {
        looksSame.match(argv.size, argv.fn);
    })
    .argv
