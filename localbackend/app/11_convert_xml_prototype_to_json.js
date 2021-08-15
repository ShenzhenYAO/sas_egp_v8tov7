/*Read a prototype xml file as a dom and convert it to a json file 
Note! These prototype xml files are encoded by utf-8
    However, remmeber that eventually the project.xml file for SAS must be in utf16le encoding
*/

// load custom modules
const mymodules = require('../../localbackend/app/mytools/mymodules');

// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

// specify the source xml file
// define the name (same for the src xml and the target json)
const thefilename =  '__01a_datalist_data_v8';
// const thesrcxml = 'data/out/text.xml';
const thesrcxml = 'data/in/prototype/__xml/egpv8/'+thefilename+'.xml';
// path of the target json file
const thejsonfile = 'data/in/prototype/__json/egpv8/'+thefilename+'.json';

(async () => {
    // let encoding = "utf16le";
    let encoding = "utf-8";
    let thesrcxmlstr = await mymodules.readtxt(thesrcxml, encoding);
    // console.log(thesrcxmlstr.substring(1, 100))

    let thesrcxmlstr_normalized_1 = normalize_ampersand_code(thesrcxmlstr)

    // jsdom does not handle the tag <Table>A</Table> well
    // In that case, it alters the html to '<Table></Table>A' !
    // The following is to rename the tag <Table> to <Table123> to work around
    let thesrcxmlstr_rename_table_table123 = rename_tag_named_table(thesrcxmlstr_normalized_1)

    // the xhtml self-colsing tags like <Parameters /> must be converted to <Parameters></Parameters>
    // because the JSDOM does not read <Parameters /> well, it'll mess up the nested structure!
    /**
      e.g., the structure is like
     <Parameters />
     <ExecutionTimeSpan>-P10675199DT2H48M5.4775808S</ExecutionTimeSpan>

     JSDOM wrongly treat it as 
     <Parameters>
        <ExecutionTimeSpan>-P10675199DT2H48M5.4775808S</ExecutionTimeSpan>
     </Parameters>
     the following is to convert  <Parameters /> to <Parameters></Parameters>
     */
    let thesrcxmlstr_normalized_2 = convertSelfClosingHTML_to_OldSchoolHTML(thesrcxmlstr_rename_table_table123)
    // console.log(thesrcxmlstr_normalized_2)

    // remove the comments (code within <!--  and -->)
    let thesrcxmlstr_removecomments = removecomments(thesrcxmlstr_normalized_2)
    // console.log(thesrcxmlstr_removecomments)

    // Next, convert xmlbodytext into a json file
    let thexmldom = $(thesrcxmlstr_removecomments)
    // let rootuuid = mymodules.generateUUID()
    let theJSON = mymodules.DOM2JSON(thexmldom)
    // to recover the tagnames and attr names in the original text
    // the JSDOM normalizes the html of the DOM. Thus, the tagnames and attr names
    // after runing the funciton DOM2JSON, the innerHTML of the node is normalized, the tagNames are in uppercases, and the attr names in lowercases
    // As the innerHTML of a DOM object (DOM.innerHTML) created by JSDOM is already normalized, there is no way to recover the original case form of tagnames and attr names from DOM.innerHTML
    // the following is to recover the original case form of tagNames and attr names using the original xmlstr
    // note: it only recovers the .tagName and attr names in .attrs:[...] of elements theJSON (coverted by DOM2JSON). It cannot recover the .innerHTML property of the elements in theJSON
    let theJSON_originalCaseForm = mymodules.getOriginalCase_of_TagAttrNames(thesrcxmlstr_removecomments, theJSON)

    //In step 01, the tagName 'Table' was changed to 'Table123' to work around for jsdom error
    //Now, recover the tagName to 'Table'
    let theJSON_originalCaseForm_Tag_Table123_renamed = renameTagName_Table123_to_Table(theJSON_originalCaseForm)

    // // recursively remove leading and trailing white spaces and line breakers
    let theJSON_trimSpaceLinkBreaker = trimTopTextContentWhiteSpaceOfJSON(theJSON_originalCaseForm_Tag_Table123_renamed)

    // save it to a json file. Its all blank, the stringify failed, why?
    // console.log(theJSON_originalCaseForm_Tag_Table123_renamed)
    await mymodules.saveJSON(theJSON_trimSpaceLinkBreaker, thejsonfile)

})()

// // recursively remove leading and trailing white spaces and line breakers
function trimTopTextContentWhiteSpaceOfJSON(srcJSON){
    if (srcJSON && srcJSON.length > 0) {
        srcJSON.forEach(d=>{
            d.TopTextContent=trimSpacesLineBreakers(d.TopTextContent)
            if (d.children && d.children.length>0){
                d.children = trimTopTextContentWhiteSpaceOfJSON(d.children) 
            }
        }) // srcJSON.forEach
    } // if (srcJSON && srcJSON.length > 0)
    return srcJSON
} // function trimTopTextContentWhiteSpaceOfJSON

// recursively remove leading and trailing white spaces and line breakers
function trimSpacesLineBreakers (thestr){
    // remove the leading and trailing whitespace 
    thestr = thestr.trim()
    // remove the leading and trailing line breakers
    thestr = thestr.trim("\n")
    // if the first/ast char is " " or "\n", do recursion
    if (thestr.substr(0,1) ==="\n" || thestr.substr(0,1) ===" "
        || thestr.substr(thestr.length-1,1) ==="\n" || thestr.substr(thestr.length-1,1) ===" "
        ){
        thestr = trimSpacesLineBreakers (thestr)
    }
    return thestr
} //function trimSpacesLineBreakers

// rename the tag <table123> back to <table>
function renameTagName_Table123_to_Table(thejsonobj) {
    thejsonobj.forEach(d => {
        if (d.tagName === "Table123") {
            d.tagName = "Table"
        }
        if (d.children && d.children.length > 0) {
            d.children = renameTagName_Table123_to_Table(d.children)
        }
    })
    return thejsonobj
} // function renameTagName_Table123_to_Table (theJSON_originalCaseForm)

// change &amp;lt to <,  &gt to > ...
function normalize_ampersand_code(thestr) {
    /* quite annoying! need to change &amp;lt to < &gt to > */
    thestr = thestr.replace(/&amp;lt;/g, '<')
    thestr = thestr.replace(/&amp;gt;/g, '>')
    thestr = thestr.replace(/&lt;/g, '<')
    thestr = thestr.replace(/&gt;/g, '>')
    thestr = thestr.replace(/&amp;/g, '_')// cannot have &amp; or & in xml
    return thestr
} //function normalize_ampersand_code

// jsdom does not handle the tag <Table>A</Table> well
// In that case, it alters the html to '<Table></Table>A' !
// The following is to rename the tag <Table> to <Table123> to work around
function rename_tag_named_table(thestr) {
    thestr = thestr.replace(/\<Table\>/g, '<Table123>')
    thestr = thestr.replace(/\<\/Table\>/g, '</Table123>')
    return thestr
} // function rename_tag_named_table

// convert <Parameters /> to <Parameters></Parameters>
function convertSelfClosingHTML_to_OldSchoolHTML(str) {
    let matched_arr = str.match(/\<(.*) \/\>/)
    // console.log(matched_arr)
    if (matched_arr && matched_arr.length > 0) {
        let seg1 = matched_arr[1].split('<')
        let theLastMatchedStr = seg1[seg1.length - 1]
        // console.log(theLastMatchedStr)    
        // replace <Others /> with <Others></<Others />
        let xhtmlstr = "<" + theLastMatchedStr + " />"
        let htmlstr = "<" + theLastMatchedStr + ">" + "</" + theLastMatchedStr + ">"
        str = str.replace(xhtmlstr, htmlstr)
        let matched_arr2 = str.match(/\<(.*) \/\>/)
        if (matched_arr && matched_arr.length > 0) {
            str = convertSelfClosingHTML_to_OldSchoolHTML(str)
        }
    }
    return str
} // function convertSelfClosingHTML_to_OldSchoolHTML(str...

// remmove comments
function removecomments(thestr) {
    // find anything between <!-- and -->
    let matched_arr = thestr.match(/\<!--(.*)--\>/)
    // console.log(matched_arr[0], thestr)
    if (matched_arr && matched_arr.length > 0) {
        thestr = thestr.replace(matched_arr[0], "")
        thestr = removecomments(thestr)
    }
    return thestr
} // function convertSelfClosingHTML_to_OldSchoolHTML(str...