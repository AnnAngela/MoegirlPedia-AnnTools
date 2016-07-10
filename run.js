"use strict";
console.debug = console.log;
function end() {
    console.log('');//让exit独立出来
    process.exit();
}
Object.assign(String.prototype, {
    windowsfy() {
        return this.replace(/\r*\n/g, '\r\n');
    },
});
console.debug('MoegirlPedia-QuickSaveDraft Run');
const fs = require('fs'),
    babelCore = require('babel-core'),
    flag = {
        flag: "w+",
    };
fs.readFile('./es2015.js', 'utf-8', function (e, data) {
    if (e) return console.error('Error: file can not be opened: ./es2015.js');
    fs.writeFile('./es5.js', `/* eslint-disable */\r\n${babelCore.transform(data, {
        presets: ['es2015'],
    }).code.windowsfy()}`, flag, function (e) {
        if (e) console.error('Error: file can not be writed: ./es5.js');
        console.debug('Done');
        end();
    });
});