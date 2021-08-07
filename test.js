// load custom modules
const mymodules = require('./localbackend/app/mytools/mymodules');
// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
let $ = require("jquery")(window);

(async () => {

    let thestr = `
    <TaG1  Type='Whatever'>
        <TAg2 EGVision="who cAres">What the heck is that
            <TAg4 aTtr3="ATTRs3 of TAg4" aTTr4="ATTRs4 of TAg4"  />
        </TAg2>
        <tAg3 />
    </TaG1>
    `

/* by default, jsdom change tagnames to uppercase, attr names to lowercase. 
    the tagnames in uppercase is ok for SAS to read (as long as the tag /tag are consistently in uppercase)
    however, SAS does not recognize attr names if the case form is changed (e.g., from EGVision to egvision)
    the following is to test how to keep the original case form of tagnames and attr names 

    Here are the ideas:
    the tagname (TAG1) in the original tag is like '<TaG1 ', so we can match '<' + tagname.toUpperCase()+ ' '
        to the original str to find the tagname in original case form
    (note, do not try to match the trailing tag like </tAg3>. in the given case, such trailing tag does not exist)
*/

    let thexmldom = $(thestr)
    console.log(thexmldom[0].innerHTML)

    // let rootuuid = mymodules.generateUUID()
    // let theJSON = mymodules.DOM2JSON(thexmldom, rootuuid)    
    // console.log(theJSON[0])
    
})()

