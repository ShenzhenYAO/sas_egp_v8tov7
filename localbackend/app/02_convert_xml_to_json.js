/*Read the xml file as a dom and convert it to a json file */

// load custom modules
const mymodules = require('../../localbackend/app/mytools/mymodules');

// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

// specify the source xml file
// const thesrcxml = 'data/out/text.xml';
const thesrcxml = 'data/out/01_test_project_v8_extracted_from_egp.xml';
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
    // let rootuuid = mymodules.generateUUID()
    let theJSON = mymodules.DOM2JSON(thexmldom, rootuuid)
    // to recover the tagnames and attr names in the original text
    // the JSDOM normalizes the html of the DOM. Thus, the tagnames and attr names
    // after runing the funciton DOM2JSON, the innerHTML of the node is normalized, the tagNames are in uppercases, and the attr names in lowercases
    // As the innerHTML of a DOM object (DOM.innerHTML) created by JSDOM is already normalized, there is no way to recover the original case form of tagnames and attr names from DOM.innerHTML
    // the following is to recover the original case form of tagNames and attr names using the original xmlstr
    // note: it only recovers the .tagName and attr names in .attrs:[...] of elements theJSON (coverted by DOM2JSON). It cannot recover the .innerHTML property of the elements in theJSON
    let theJSON_originalCaseForm = mymodules.getOriginalCase_of_TagAttrNames(xmlbodytext, theJSON)

    //In step 01, the tagName 'Table' was changed to 'Table123' to work around for jsdom error
    //Now, recover the tagName to 'Table'
    let theJSON_originalCaseForm_Tag_Table123_renamed =renameTagName_Table123_to_Table(theJSON_originalCaseForm)
    function renameTagName_Table123_to_Table (thejsonobj){
        thejsonobj.forEach(d=>{
            if (d.tagName === "Table123"){
                d.tagName = "Table"
            }
            if (d.children && d.children.length >0){
                d.children = renameTagName_Table123_to_Table(d.children)
            }
        })
        return thejsonobj
    } // function renameTagName_Table123_to_Table (theJSON_originalCaseForm)

     // save it to a json file. Its all blank, the stringify failed, why?
     // it turn out that I pushed arrays tmp=[] instead of objects tmp={}, which is the source of the problem!
    let thejsonfile ="./data/out/02_test_projectxml2json_v8.json";
    await mymodules.saveJSON(theJSON_originalCaseForm_Tag_Table123_renamed, thejsonfile)
    // await mymodules.saveJSON(theJSON_originalCaseForm, thejsonfile)

})()