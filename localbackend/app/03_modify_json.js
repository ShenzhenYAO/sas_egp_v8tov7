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
    let attrName = "EGVersion"
    let theAttr = theJSON[0].attrs.filter(d => (Object.keys(d)[0] === attrName))[0]
    // change its name
    theAttr[attrName] = '7.1'
    // console.log(theJSON[0].attrs)

    /*2. rename ProjectCollection.Elements.Element[0].attr(“Type”) from “SAS.EG.ProjectElements.ProcessFlowContainer” 
        to “SAS.EG.ProjectElements.PFD” (This is to make SAS EG 7.1 recognize the tasks in the tree view panel 
        on the left) 
    */
    let parentnode = theJSON[0], tagName = "Elements"
    let theElementsObj = getFirstChildNodeByTagName(parentnode, tagName)
    // console.log(theElementsObj)
    attrName = 'Type';
    theAttr = theElementsObj.children[0].attrs.filter(d => (Object.keys(d)[0] === attrName))[0]
    // change its name
    if (theAttr[attrName] === 'SAS.EG.ProjectElements.ProcessFlowContainer') {
        theAttr[attrName] = 'SAS.EG.ProjectElements.PFD'
    }
    // console.log(theElementsObj.children[0].attrs)


    /*2b. For all tasks, i.e., ProjectCollection.Elements.Element with .attr(“Type”) of 
        “SAS.EG.ProjectElements.CodeTask”, change .SubmitableElement.GraphDeviceOverride.text 
        (or .innerHTML) from “Default” to “Png”. 
        (This is to make task icons visible in the main area)
    */
    // 2b1. within the theElementsObj, get all elements with tagName of 'Element'
    tagName = 'Element'
    let theElementNodes = getAllChildrenNodesByTagName(theElementsObj, tagName)
    //console.log(theElementNodes.length)
    //2b2. For each element node in theElementNodes, keep those with the attr Type = SAS.EG.ProjectElements.CodeTask
    attrName = 'Type';
    let theTaskElementNodes = []
    theElementNodes.forEach(d => {
        // get the attr 'type
        theAttr = d.attrs.filter(x => (Object.keys(x)[0] === attrName))[0]
        // console.log(theAttr)
        if (theAttr[attrName] === 'SAS.EG.ProjectElements.CodeTask') {
            theAttr[attrName] = 'SAS.EG.ProjectElements.PFD'
            theTaskElementNodes.push(d)
        }
    })//theElementNodes.forEach(d=>{
    // console.log(theTaskElementNodes.length)

    //2b3. For each node in theTaskElementNodes, 
    //find its first childNode with a tagname of SubmitableElement (thechildnode)
    // then find the first grandchildnode of 'thechildnode' with a tagname of GraphDeviceOverride ('thegrandchildnode')
    // change the text of the thegrandchildnode from 'Default' to 'Png'
    theTaskElementNodes.forEach(d => {
        tagName = 'SubmitableElement'
        let theChildNode_tag_SubmitableElement = getFirstChildNodeByTagName(d, tagName)
        // console.log(theChildNode_tag_SubmitableElement.tagName)
        if (theChildNode_tag_SubmitableElement && theChildNode_tag_SubmitableElement.children && theChildNode_tag_SubmitableElement.children.length > 0) {
            // console.log(theChildNode_tag_SubmitableElement.tagName)
            theChildNode_tag_SubmitableElement.children.forEach(e => {
                // console.log(e.tagName)
                tagName = 'GraphDeviceOverride'.toUpperCase()
                if (e.tagName === tagName) {
                    // console.log(e['TopTextContent'])
                    if (e['TopTextContent'].toUpperCase() === 'DEFAULT') {
                        e['TopTextContent'] = 'Png'
                    }
                }
            }) // theChildNode_tag_SubmitableElement.children.forEach
        }// if
    }) //theTaskElementNodes.forEach(d=>{

    /*3.1 Within ProjectCollection.External_Objects, insert a part at the beginning with the following contents: 
     (This is to enable the tree view in the left panel) 
     */
    tagName='External_Objects'.toUpperCase()
    let firstChildNode_External_Objects = getFirstChildNodeByTagName(theJSON[0], tagName)
    console.log(firstChildNode_External_Objects.tagName)

})()



// within a parentnode, get all children nodes with a specified tagName
function getAllChildrenNodesByTagName(parentnode, tagName) {
    let targetNodes = []
    if (parentnode.children && parentnode.children.length > 0) {
        for (let i = 0; i < parentnode.children.length; i++) {
            let thenode = parentnode.children[i]
            if (thenode.tagName === tagName) {
                targetNodes.push(thenode)
            }
        }
    } // if
    return targetNodes
} //getAllChildrenNodesByTagName

// within a parentnode, get the first node with a specified tagName
function getFirstChildNodeByTagName(parentnode, tagName) {
    let thenode
    if (parentnode.children && parentnode.children.length > 0) {
        for (let i = 0; i < parentnode.children.length; i++) {
            thenode = parentnode.children[i]
            if (thenode.tagName === tagName) {
                return thenode
            }
        }
    } // if
    return thenode
} //getFirstChildNodeByTagName

