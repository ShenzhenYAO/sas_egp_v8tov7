/*convert the modified json back to xml */
const mymodules = require('../../localbackend/app/mytools/mymodules');
const thejsonfile = 'data/out/03_test_modified_for_v7.json';
(async () => {
    // read the json file
    let thejsonstr = await mymodules.readtxt(thejsonfile)
    // console.log(thejsonstr)
    let theJSON = JSON.parse(thejsonstr)

    let xmlstr = covert_json_to_xmlstr(theJSON)
    // console.log(xmlstr)

    // add the header 
    xmlstr = '<?xml version="1.0" encoding="utf-16"?>\n' + xmlstr
    
    // save the xmlstr into a text file as ../data/out/
    let thetargetfile = "data/out/04_test_project_modified_for_v7.xml";
    await mymodules.saveLocalTxtFile(xmlstr, thetargetfile, 'utf16le');
})()


// recursively convert json to xmlstr
function covert_json_to_xmlstr(jsonobj) {
    let theXMLstr =""
    jsonobj.forEach(d=>{
        // make tags

        // like "<ProjectCollection"
        let startTagStart = "<" + d.tagName 
        // get the attrs
        let attrsStr = ""
        if (d.attrs && d.attrs.length>0){
            d.attrs.forEach(e=>{
                attrsStr =  attrsStr + " "+ Object.keys(e)[0] + '="' + e[Object.keys(e)[0]] + '"'
            })
        } //if (d.attrs && d.attrs.length>0)
        let startTagEnd = ">"

        let startTag = startTagStart + attrsStr + startTagEnd
        // suppose d.TopTextContent is "    \n        program \n 1 \n        "
        // remove the leading and trailing whitespace
        let cleaned_TopTextContent=trimSpacesLineBreakers(d.TopTextContent)
        let TopTextContent = cleaned_TopTextContent
        let childrenNodeXmlStr=""
        if (d.children && d.children.length > 0){
            childrenNodeXmlStr = covert_json_to_xmlstr(d.children)
        }
        let endTag = "</" + d.tagName +">\n"
        theXMLstr = theXMLstr + startTag + TopTextContent + childrenNodeXmlStr + endTag
    })
    return theXMLstr
} //function covert_json_to_xmlstr(jsonobj)

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