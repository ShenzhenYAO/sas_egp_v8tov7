// load custom modules
const mymodules = require('./localbackend/app/mytools/mymodules');
// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

const srcfolder = 'data/in/prototype/__xml/egpv8/';

(async () => {
    
    let wrong = await mymodules.readtxt("F:\\Personal\\Virtual_Server\\PHPWeb\\sas_make_docx_xlsx\\data\\out\\document.xml")
    let correct = await mymodules.readtxt("F:\\Personal\\Virtual_Server\\PHPWeb\\sas_make_docx_xlsx\\data\\out\\fileFromZip.xml")

    console.log(wrong.length, correct.length)

})()



