#!/usr/bin/env node

var path = require('path'),
    pkg = require( path.join(__dirname, 'package.json') );

var scan = require('./scan');


// Parse command line options

var program = require('commander');

program
    .version(pkg.version)
    .option('-d, --directory <directory>', 'Port on which to listen to (defaults to ~/projects)', parseInt)
    .parse(process.argv);

var port = program.port || 3000;


// Scan the directory in which the script was called. It will
// add the 'files/' prefix to all files and folders, so that
// download links point to our /files route

var tree = scan('.', 'files');

console.log(tree);
