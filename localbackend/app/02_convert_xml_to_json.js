/*Read the xml file as a dom and convert it to a json file */

// load custom modules
const mymodules = require('../../localbackend/app/mytools/mymodules');

// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

// specify the source xml file
// const thesrcxml = 'data/out/text.xml';
const thesrcxml = 'data/out/test_project.xml';
// read the source file into a string

(async () => {
    let encoding = "utf16le";
    thesrcxmlstr = await mymodules.readtxt(thesrcxml, encoding);
    // console.log(thesrcxmlstr.substring(1, 100))

    // the first line of the project.xml is '<?xml version="1.0" encoding="utf-16"?>' 
    // the following is to get the string after '?>'. That string is the whole body text wrapped within the tag "ProjectCollection"
    let xmlbodytext = thesrcxmlstr.split('?>') [1]
    // console.log(xmlbodytext)

    // Next, convert xmlbodytext into a json file
    let thexmldom = $(xmlbodytext)
    let rootuuid = mymodules.generateUUID()
    let theJSON = mymodules.DOM2JSON(thexmldom, rootuuid)

     // save it to a json file. Its all blank, the stringify failed, why?
     // it turn out that I pushed arrays tmp=[] instead of objects tmp={}, which is the source of the problem!
    let thejsonfile ="./data/out/test_projectxml2json.json";
    await mymodules.saveJSON(theJSON, thejsonfile)

})()