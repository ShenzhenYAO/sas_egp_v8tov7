/* Modify contents of the json which was converted from xml (of SAS EG v8). The modified json contains
contents that are compatible to SAS EG v7*/

// load custom modules
const mymodules = require('../../localbackend/app/mytools/mymodules');
const thejsonfile = 'data/out/02_test_projectxml2json_v8.json';
(async () => {
    let thejsonstr = await mymodules.readtxt(thejsonfile)
    // console.log(thejsonstr)
    let theJSON = JSON.parse(thejsonstr)
    // console.log(theJSON[0].children[2])

    // get the ProjectCollection node (which is theJSON[0])
    let theProjectCollectionNode = theJSON[0]

    // make changes
    //1. rename ProjectCollection.attr("EGVersion") to "7.1" (This is to make the egp file recognizable by SAS EG 7.1)
    let attrName = "EGVersion"
    let theAttr = theProjectCollectionNode.attrs.filter(d => (Object.keys(d)[0] === attrName))[0]
    // change its name
    theAttr[attrName] = '7.1'
    // console.log(theJSON[0].attrs)

    /*2. rename ProjectCollection.Elements.Element[0].attr("Type") from "SAS.EG.ProjectElements.ProcessFlowContainer" 
        to "SAS.EG.ProjectElements.PFD" (This is to make SAS EG 7.1 recognize the tasks in the tree view panel 
        on the left) 
    */
    let parentnode = theProjectCollectionNode, tagName = "Elements"
    let theElementsNode = getFirstChildNodeByTagName(parentnode, tagName)
    // console.log(theElementsNode)
    attrName = 'Type';
    theAttr = theElementsNode.children[0].attrs.filter(d => (Object.keys(d)[0] === attrName))[0]
    // change its name
    if (theAttr[attrName] === 'SAS.EG.ProjectElements.ProcessFlowContainer') {
        theAttr[attrName] = 'SAS.EG.ProjectElements.PFD'
    }
    // console.log(theElementsNode.children[0].attrs)


    /*2b. For all tasks, i.e., ProjectCollection.Elements.Element with .attr("Type") of 
        "SAS.EG.ProjectElements.CodeTask", change .SubmitableElement.GraphDeviceOverride.text 
        (or .innerHTML) from "Default" to "Png". 
        (This is to make task icons visible in the main area)
    */
    // 2b1. within the theElementsNode, get all elements with tagName of 'Element'
    tagName = 'Element'
    let theElementNodes = getAllChildrenNodesByTagName(theElementsNode, tagName)
    //console.log(theElementNodes.length)
    //2b2. For each element node in theElementNodes, keep those with the attr Type = SAS.EG.ProjectElements.CodeTask
    attrName = 'Type';
    let theTaskElementNodes = []
    theElementNodes.forEach(d => {
        // get the attr 'type'
        // console.log(d.attrs)
        theAttr = d.attrs.filter(x => (Object.keys(x)[0] === attrName))[0]
        // console.log(theAttr)
        if (theAttr[attrName] === 'SAS.EG.ProjectElements.CodeTask') {
            theTaskElementNodes.push(d)
        }
    })//theElementNodes.forEach(d=>{
    // console.log(theTaskElementNodes.length)

    //2b3. For each node in theTaskElementNodes, 
    //find its first childNode with a tagname of SubmitableElement (thechildnode)
    // then find the first grandchildnode of 'thechildnode' with a tagname of GraphDeviceOverride ('thegrandchildnode')
    // change the text of the thegrandchildnode from 'Default' to 'Png'
    theTaskElementNodes.forEach(d => {
        let tagName = 'SubmitableElement'
        let theChildNode_tag_SubmitableElementNode = getFirstChildNodeByTagName(d, tagName)
        // console.log(theChildNode_tag_SubmitableElementNode.tagName)
        // in theChildNode_tag_SubmitableElementNode, find the Element with the tagName "GraphDeviceOverride"
        let theGraphDeviceOverrideNode_of_theChildNode_tag_SubmitableElementNode = getFirstChildNodeByTagName(theChildNode_tag_SubmitableElementNode, "GraphDeviceOverride")
        if (theGraphDeviceOverrideNode_of_theChildNode_tag_SubmitableElementNode.TopTextContent === 'Default') {
            theGraphDeviceOverrideNode_of_theChildNode_tag_SubmitableElementNode.TopTextContent = 'Png'
        }
    }) //theTaskElementNodes.forEach(d=>{

    /*3.1a-b Within ProjectCollection.External_Objects, insert a part at the beginning with the following contents: 
     (This is to enable the tree view in the left panel) 
     */
    tagName = 'External_Objects'
    // get the firstnode within theProjectCollectionNode
    let theExternal_ObjectsNode = getFirstChildNodeByTagName(theProjectCollectionNode, tagName)
    // console.log(theExternal_ObjectsNode.tagName)

    // within theExternal_ObjectsNode, insert a node as the first child. The inserted node is like
    /*  {
        "siblingid": 0,
        "tagName": "ProjectTreeView",
        "attrs": [
            { "EGVersion":"7.1"},
            { "UseSubcontainers": "True"} // note: not sure if case form matters (True or true). Anyway, it is 'True' in v7 project.xml files
        ],
        "uuid": "<autocreated>",
        "parentuuid": <the uuid of theExternal_ObjectsNode >,
        "TopTextContent": "",
        "children": []
        }
    */
    let childnode = {}
    childnode.tagName = "ProjectTreeView"
    childnode.attrs = [{ "EGVersion": "7.1" }, { "UseSubcontainers": "True" }]
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = theExternal_ObjectsNode.uuid
    childnode.TopTextContent = ""
    childnode.innerHTML = ""
    childnode.children = []
    let theProjectTreeViewNode = addChildNode(theExternal_ObjectsNode, childnode, "first")
    // console.log(theProjectTreeViewNode)
    // console.log(theExternal_ObjectsNode.children[theExternal_ObjectsNode.children.length-1])

    // 3.1 c Within ProjectTreeViewNode, add a container tageName=EGTreeNode
    childnode = {}
    childnode.tagName = "EGTreeNode"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = theProjectTreeViewNode.uuid
    childnode.TopTextContent = ""
    childnode.innerHTML = ""
    childnode.children = []
    let theEGTreeNode = addChildNode(theProjectTreeViewNode, childnode, "first")
    // console.log(theEGTreeNode)

    /* 3.1d1 Within .ProjectTreeView.EGTreeNode, add the following:
        .NodeType.text = "NODETYPE_ELEMENT"
    */
    childnode = {}
    childnode.tagName = "NodeType"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = theEGTreeNode.uuid
    childnode.TopTextContent = "NODETYPE_ELEMENT"
    childnode.innerHTML = ""
    childnode.children = []
    addChildNode(theEGTreeNode, childnode, "first")

    /* 3.1d2 Within .ProjectTreeView.EGTreeNode, add the following:
        .ElementID.text = "ProcessFlowContainer-FOavG6ypkQ7cUnal", which was from 
        ProjectCollection.Elements.Element.Attr("Type", "SAS.EG.ProjectElements.ProcessFlowContainer").Element[0].ID.Text()
        of the v8 xml
        however, in previous steps, the type "SAS.EG.ProjectElements.ProcessFlowContainer" has been renamed as SAS.EG.ProjectElements.PFD
        thus, the following is to search for an Element with type of "SAS.EG.ProjectElements.PFD"
        */
    childnode = {}
    childnode.tagName = "ElementID"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = theEGTreeNode.uuid

    // ************ start getting the process flow id
    // theElementNodes contains all nodes with tagname of 'Element' within ProjectCollection.Elements
    // in theElementNodes, find the node with tagname of 'Element' and attr of Type = 'SAS.EG.ProjectElements.PFD'
    let theElementTypeOfSASEGPPDCNode
    for (let i = 0; i < theElementNodes.length; i++) {
        let theElementNode = theElementNodes[i]
        // get the attr 'type'
        let theAttr = theElementNode.attrs.filter(x => (Object.keys(x)[0] === 'Type'))[0]
        if (theAttr && theAttr.Type === 'SAS.EG.ProjectElements.PFD') {
            theElementTypeOfSASEGPPDCNode = theElementNode
            break
        }
    }// for each node with tagname of 'Element' in ProjectCollection.Elements 
    // console.log(theElementTypeOfSASEGPPDCNode)

    // in children nodes of theElementTypeOfSASEGPPDCNode, find the first child with tagname of Element
    let theFirstELementNode_of_theElementTypeOfSASEGPPDCNode = getFirstChildNodeByTagName(theElementTypeOfSASEGPPDCNode, 'Element')
    // in theFirstELementNode_of_theElementTypeOfSASEGPPDCNode, find the first child with tagname = 'ID'
    let theFirstIDNode_of_theFirstELementNode_of_theElementTypeOfSASEGPPDCNode = getFirstChildNodeByTagName(theFirstELementNode_of_theElementTypeOfSASEGPPDCNode, 'ID')
    // console.log(theFirstIDNode_of_theFirstELementNode_of_theElementTypeOfSASEGPPDCNode)
    let theProjectProcessFlowID = theFirstIDNode_of_theFirstELementNode_of_theElementTypeOfSASEGPPDCNode.TopTextContent
    // ************ end getting the process flow id

    childnode.TopTextContent = theProjectProcessFlowID
    childnode.innerHTML = ""
    childnode.children = []
    addChildNode(theEGTreeNode, childnode)

    /* 3.1d3 Within .ProjectTreeView.EGTreeNode, add the following:
            .Expanded.text = "True"
        */
    childnode = {}
    childnode.tagName = "Expanded"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = theEGTreeNode.uuid
    childnode.TopTextContent = "True"
    childnode.innerHTML = ""
    childnode.children = []
    addChildNode(theEGTreeNode, childnode)

    /* 3.1d4 Within .ProjectTreeView.EGTreeNode, add the following:
    .Label.text="Process Flow"    
    */
    childnode = {}
    childnode.tagName = "Label"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = theEGTreeNode.uuid
    childnode.TopTextContent = "Process Flow"
    childnode.innerHTML = ""
    childnode.children = []
    addChildNode(theEGTreeNode, childnode)

    // 3.1e Within .ProjectTreeView.EGTreeNode, add a container .EGTreeNode
    childnode = {}
    childnode.tagName = "EGTreeNode"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = theEGTreeNode.uuid
    childnode.TopTextContent = ""
    childnode.innerHTML = ""
    childnode.children = []
    let theEGTreeNode_of_theEGTreeNode = addChildNode(theEGTreeNode, childnode)

    /*3.1f1 Within .ProjectTreeView.EGTreeNode.EGTreeNode, add:
        .NodeType.text = "NODETYPE_PROGRAMFOLDER"
     */
    childnode = {}
    childnode.tagName = "NodeType"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = theEGTreeNode_of_theEGTreeNode.uuid
    childnode.TopTextContent = "NODETYPE_PROGRAMFOLDER"
    childnode.innerHTML = ""
    childnode.children = []
    addChildNode(theEGTreeNode_of_theEGTreeNode, childnode)

    /*3.1f2 Within .ProjectTreeView.EGTreeNode.EGTreeNode, add:
    .Expanded.text = "True"    
     */
    childnode = {}
    childnode.tagName = "Expanded"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = theEGTreeNode_of_theEGTreeNode.uuid
    childnode.TopTextContent = "True"
    childnode.innerHTML = ""
    childnode.children = []
    addChildNode(theEGTreeNode_of_theEGTreeNode, childnode)


    /*3.1f3 Within .ProjectTreeView.EGTreeNode.EGTreeNode, add:
        .Label.text="Programs"
         */
    childnode = {}
    childnode.tagName = "Label"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = theEGTreeNode_of_theEGTreeNode.uuid
    childnode.TopTextContent = "Programs"
    childnode.innerHTML = ""
    childnode.children = []
    addChildNode(theEGTreeNode_of_theEGTreeNode, childnode)

    /* 3.1g Within .ProjectTreeView.EGTreeNode.EGTreeNode, add containers .EGTreeNode, each for a task
       3.1h Within these .ProjectTreeView.EGTreeNode.EGTreeNode.EGTreeNode, add:
        .NodeType.text = "NODETYPE_ELEMENT"
        .ElementID.text = "CodeTask-fZbshWji7axVxlCT", i.e., the ID of the task
        .Expanded.text = "False"
        .Label.text="Program", i.e., the label of the program (corresponding to the labels in the ProjectCollection.Elements.Element with .attr("Type")=" SAS.EG.ProjectElements.CodeTask" .Element.Label.text()
    */
    // console.log(theTaskElementNodes)
    /****all tasks are in the obj theTaskElementNodes */
    if (theTaskElementNodes && theTaskElementNodes.length > 0) {
        // loop for each task
        theTaskElementNodes.forEach(d => {
            // console.log(d)

            //*** start getting each task's Label (d.Element.Label.textContent), and ElementID (d.Element.ID.textContent), and 
            // get the Element tag of Task
            let theTaskElementNode = getFirstChildNodeByTagName(d, 'Element')
            // get the Element.Label tag
            let theTaskElementLabelNode = getFirstChildNodeByTagName(theTaskElementNode, 'Label')
            // get the Label text
            let theTaskElementLabelTextContent = theTaskElementLabelNode.TopTextContent
            // get the Element.ID tag
            let theTaskElementIDNode = getFirstChildNodeByTagName(theTaskElementNode, 'ID')
            // get the ID text
            let theTaskElementIDNodeTextContent = theTaskElementIDNode.TopTextContent
            // console.log(theTaskElementLabelTextContent, theTaskElementIDNodeTextContent)
            // ******** end getting task label and id

            // add .EGTreeNode
            let childnode = {}
            childnode.tagName = "EGTreeNode"
            childnode.attrs = []
            childnode.uuid = mymodules.generateUUID()
            childnode.parentuuid = theEGTreeNode_of_theEGTreeNode.uuid
            childnode.TopTextContent = ""
            childnode.innerHTML = ""
            childnode.children = []
            let theEGTreeNode_of_theEGTreeNode_of_theEGTreeNode = addChildNode(theEGTreeNode_of_theEGTreeNode, childnode)

            /*3.1h1 Within these .ProjectTreeView.EGTreeNode.EGTreeNode.EGTreeNode, add:
            .NodeType.text = "NODETYPE_ELEMENT"
            */
            childnode = {}
            childnode.tagName = "NodeType"
            childnode.attrs = []
            childnode.uuid = mymodules.generateUUID()
            childnode.parentuuid = theEGTreeNode_of_theEGTreeNode_of_theEGTreeNode.uuid
            childnode.TopTextContent = "NODETYPE_ELEMENT"
            childnode.innerHTML = ""
            childnode.children = []
            addChildNode(theEGTreeNode_of_theEGTreeNode_of_theEGTreeNode, childnode)

            /*3.1h2 Within these .ProjectTreeView.EGTreeNode.EGTreeNode.EGTreeNode, add:
            .ElementID.text = "CodeTask-fZbshWji7axVxlCT", i.e., the ID of the task
            .Expanded.text = "False"
            .Label.text="Program", i.e., the label of the program (corresponding to the labels in the ProjectCollection.Elements.Element with .attr("Type")=" SAS.EG.ProjectElements.CodeTask" .Element.Label.text()
             */
            childnode = {}
            childnode.tagName = "ElementID"
            childnode.attrs = []
            childnode.uuid = mymodules.generateUUID()
            childnode.parentuuid = theEGTreeNode_of_theEGTreeNode_of_theEGTreeNode.uuid
            childnode.TopTextContent = theTaskElementIDNodeTextContent
            childnode.innerHTML = ""
            childnode.children = []
            addChildNode(theEGTreeNode_of_theEGTreeNode_of_theEGTreeNode, childnode)


            /*3.1h3 Within these .ProjectTreeView.EGTreeNode.EGTreeNode.EGTreeNode, add:
            .Expanded.text = "False"
            .Label.text="Program", i.e., the label of the program (corresponding to the labels in the ProjectCollection.Elements.Element with .attr("Type")=" SAS.EG.ProjectElements.CodeTask" .Element.Label.text()
             */
            childnode = {}
            childnode.tagName = "Expanded"
            childnode.attrs = []
            childnode.uuid = mymodules.generateUUID()
            childnode.parentuuid = theEGTreeNode_of_theEGTreeNode_of_theEGTreeNode.uuid
            childnode.TopTextContent = "False"
            childnode.innerHTML = ""
            childnode.children = []
            addChildNode(theEGTreeNode_of_theEGTreeNode_of_theEGTreeNode, childnode)

            /*3.1h4 Within these .ProjectTreeView.EGTreeNode.EGTreeNode.EGTreeNode, add:
            .Label.text="Program", i.e., the label of the program (corresponding to the labels in the ProjectCollection.Elements.Element with .attr("Type")=" SAS.EG.ProjectElements.CodeTask" .Element.Label.text()
             */
            childnode = {}
            childnode.tagName = "Label"
            childnode.attrs = []
            childnode.uuid = mymodules.generateUUID()
            childnode.parentuuid = theEGTreeNode_of_theEGTreeNode_of_theEGTreeNode.uuid
            childnode.TopTextContent = theTaskElementLabelTextContent
            childnode.innerHTML = ""
            childnode.children = []
            addChildNode(theEGTreeNode_of_theEGTreeNode_of_theEGTreeNode, childnode)

            // console.log(theEGTreeNode_of_theEGTreeNode_of_theEGTreeNode)

        })
    } // if (theTaskElementNodes && theTaskElementNodes.length > 0)

    // console.log(theEGTreeNode_of_theEGTreeNode.children[theEGTreeNode_of_theEGTreeNode.children.length - 1])

    /*
        3.2 Within ProjectCollection.External_Objects, create a new container 
        .ProcessFlowView. (This is also to make task icons visible in the main area)
    */
    childnode = {}
    childnode.tagName = "ProcessFlowView"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = theExternal_ObjectsNode.uuid
    childnode.TopTextContent = ""
    childnode.innerHTML = ""
    childnode.children = []
    let theProcessFlowViewNode = addChildNode(theExternal_ObjectsNode, childnode)

    /* 3.2a copy the contents within .ProcessFlowControlManager.ProcessFlowControlState to .ProcessFlowView */
    let theProcessFlowControlManagerNode = getFirstChildNodeByTagName(theExternal_ObjectsNode, "ProcessFlowControlManager")
    let theProcessFlowControlStateNode_of_theProcessFlowControlManagerNode = getFirstChildNodeByTagName(theProcessFlowControlManagerNode, "ProcessFlowControlState")
    theProcessFlowViewNode.children = theProcessFlowControlStateNode_of_theProcessFlowControlManagerNode.children
    // change the children's parentuuid to theProcessFlowViewNode.uuid
    theProcessFlowViewNode.children.forEach(d => {
        d.parentuuid = theProcessFlowViewNode.uuid
    })
    // console.log(theProcessFlowViewNode.children[0])

    /* 3.2b delete the containers .ProcessFlowControlManager, and anything within it 
        indeed, push the theExternal_ObjectsNode.children to theExternal_ObjectsNode.__children 
        if the child's tagName is not "ProcessFlowControlManager",
        next, overwrite .children with .__children
        finally, delete .__children
    */
    theExternal_ObjectsNode.children.forEach(d => {
        theExternal_ObjectsNode.__children = []
        if (d.tagName !== 'ProcessFlowControlManager') {
            theExternal_ObjectsNode.__children.push(d)
        }
    })
    theExternal_ObjectsNode.children = theExternal_ObjectsNode.__children
    delete theExternal_ObjectsNode.__children

    /* 3.2c Within ProjectCollection.External_Objects.ProcessFlowView, 
        rename the tag name of the element .GraphicObjects to .Graphics
    */
    let theGraphicObjectsNode = getFirstChildNodeByTagName(theProcessFlowViewNode, "GraphicObjects")
    theGraphicObjectsNode.tagName = "Graphics"
    // console.log(theGraphicObjectsNode)

    /* 3.2d Within ProjectCollection.External_Objects.ProcessFlowView, add a container "Containers"
    */
    childnode = {}
    childnode.tagName = "Containers"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = theProcessFlowViewNode.uuid
    childnode.TopTextContent = ""
    childnode.innerHTML = ""
    childnode.children = []
    let theContainersNode_of_theProcessFlowViewNode = addChildNode(theProcessFlowViewNode, childnode)

    /* 3.2e Within ProjectCollection.External_Objects.ProcessFlowView. Containers, Add a tag .Properties */
    childnode = {}
    childnode.tagName = "Properties"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = theContainersNode_of_theProcessFlowViewNode.uuid
    childnode.TopTextContent = ""
    childnode.innerHTML = ""
    childnode.children = []
    let thePropertiesNode_of_theContainersNode_of_theProcessFlowViewNode = addChildNode(theContainersNode_of_theProcessFlowViewNode, childnode)
    // console.log(thePropertiesNode_of_theContainersNode_of_theProcessFlowViewNode)

    /* 3.2f1 Within ProjectCollection.External_Objects.ProcessFlowView. Containers.Properties, add the following:
     .ID.Text = "ProcessFlowContainer-FOavG6ypkQ7cUnal", i.e., the process flow ID in ProjectCollection.Elements. Element.Attr("Type", "SAS.EG.ProjectElements.PFD").Element[0].ID.Text()
    */
    childnode = {}
    childnode.tagName = "ID"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = thePropertiesNode_of_theContainersNode_of_theProcessFlowViewNode.uuid
    childnode.TopTextContent = theProjectProcessFlowID
    childnode.innerHTML = ""
    childnode.children = []
    addChildNode(thePropertiesNode_of_theContainersNode_of_theProcessFlowViewNode, childnode)

    /* 3.2f2 Within ProjectCollection.External_Objects.ProcessFlowView. Containers.Properties, add the following:
        .BackgroundColor.Text="Default"
    */
    childnode = {}
    childnode.tagName = "BackgroundColor"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = thePropertiesNode_of_theContainersNode_of_theProcessFlowViewNode.uuid
    childnode.TopTextContent = "Default"
    childnode.innerHTML = ""
    childnode.children = []
    addChildNode(thePropertiesNode_of_theContainersNode_of_theProcessFlowViewNode, childnode)


    /* 3.2f3 Within ProjectCollection.External_Objects.ProcessFlowView. Containers.Properties, add the following:
    .Align = "AlignTop" 
    */
    childnode = {}
    childnode.tagName = "Align"
    childnode.attrs = []
    childnode.uuid = mymodules.generateUUID()
    childnode.parentuuid = thePropertiesNode_of_theContainersNode_of_theProcessFlowViewNode.uuid
    childnode.TopTextContent = "AlignTop"
    childnode.innerHTML = ""
    childnode.children = []
    addChildNode(thePropertiesNode_of_theContainersNode_of_theProcessFlowViewNode, childnode)

    // save the modified JSON!
    let themodifiedjsonfile = "./data/out/03_test_modified_for_v7.json";
    await mymodules.saveJSON(theJSON, themodifiedjsonfile)

})()



// add a child node (insertPosition can be "first" or "last")
function addChildNode(parentnode, childnode, insertPosition) {
    if (!insertPosition) { insertPosition = "last" }

    // insert as the first node
    if (insertPosition === "first") {
        childnode.siblingid = 0
        // insert childnode as the first child of parentnode
        parentnode.__children = [childnode]
        // push the existing childnode.children into .__children
        if (parentnode.children && parentnode.children.length > 0) {
            parentnode.children.forEach(d => {
                d.siblingid = d.siblingid + 1
                parentnode.__children.push(d)
            })
        }
        // save .__children as .children and delete .__children
        parentnode.children = parentnode.__children
        delete parentnode.__children
    } // if insert as first

    // insert as last
    if (insertPosition === "last") {
        childnode.siblingid = parentnode.children.length
        parentnode.children.push(childnode)
    } //if insert as last
    return childnode
}


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

