// load custom modules
const mymodules = require('./localbackend/app/mytools/mymodules');
// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

const srcfolder = 'data/in/prototype/__xml/egpv8/';

(async () => { 
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/__egtask_example.xml'
    let encoding = "utf-8"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    console.log(thesrcxmlstr)
})()

