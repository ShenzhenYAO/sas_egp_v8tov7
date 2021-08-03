/* Modify contents of the json which was converted from xml (of SAS EG v8). The modified json contains
contents that are compatible to SAS EG v7*/

// load custom modules
const mymodules = require('../../localbackend/app/mytools/mymodules');
const thejsonfile = 'data/out/test_projectxml2json.json';
(async () => {
    let thejsonstr = await mymodules.readtxt(thejsonfile)
    // console.log(thejsonstr)
    let theJSON = JSON.parse(thejsonstr)
    // console.log(theJSON[0].children[2])

    // make changes
    //1. rename ProjectCollection.attr(“EGVersion”) to “7.1” (This is to make the egp file recognizable by SAS EG 7.1)
    let attrName = "egversion"
    let theAttr = theJSON[0].attrs.filter(d => (Object.keys(d)[0] === attrName))[0]
    // change its name
    theAttr[attrName] = '7.1'
    // console.log(theJSON[0].attrs)

    /*2. rename ProjectCollection.Elements.Element[0].attr(“Type”) from “SAS.EG.ProjectElements.ProcessFlowContainer” 
        to “SAS.EG.ProjectElements.PFD” (This is to make SAS EG 7.1 recognize the tasks in the tree view panel 
        on the left) 
    */ 
    let parentnode = theJSON[0], tagName = "ELEMENTS"
    let theElementsObj =  getNodeByTagName (parentnode, tagName)
    // console.log(theElementsObj)

    attrName = 'type';
    theAttr = theElementsObj.children[0].attrs.filter(d => (Object.keys(d)[0] === attrName))[0]
    // change its name
    if (theAttr[attrName] === 'SAS.EG.ProjectElements.ProcessFlowContainer') {
        theAttr[attrName] = 'SAS.EG.ProjectElements.PFD'
    }    
    // console.log(theElementsObj.children[0].attrs)

    /*3. */

})()


function getNodeByTagName (parentnode){
    let targetNode
    if (parentnode.children && parentnode.children.length>0){
        for (let i=0; i< parentnode.children.length;i++){
            let thenode = parentnode.children[i]
            if (thenode.tagName === tagName){
                return thenode
            } 
        }
    } // if
    return thenode
} //getNodeByTagName

