/** To read the v8 xml and convert to a v7 xml file */

// load custom modules
const mymodules = require('../../localbackend/app/mytools/mymodules');

// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

// const thesrcxml = 'data/try/v8_2pfd_3p_3log_2data_2datashortcut_2link_1rpt_1xls_1sas_1note_1copytask.xml';
const thesrcxml = 'data/in/do_not_git/sample0_v8.xml';
const thetargetxml = 'data/out/test/sample0_v8_to_v7.xml';
(async () => {

    // read the xml into a dom object
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxml, encoding);
    // console.log(thesrcxmlstr.substr(0, 100))
    thebodyxmlstr = thesrcxmlstr.split('encoding="utf-16"?>')[1]
    let thesrcxmlstr_cleaned = cleanxmlstr(thebodyxmlstr)
    // console.log(thesrcxmlstr_cleaned.substr(0, 500))

    // *** convert the cleaned xml str to a DOM (like <PROJECTCOLLECTION>...</PROJECTCOLLECTION>)
    let jquery_dom_obj_v8 = $(thesrcxmlstr_cleaned)
    // console.log(jquery_dom_obj_v8.prop('outerHTML').substr(0, 200))

    /*** make a list of tagNames (in lowercase), and a list of attribute names
        jquery normalize tagNames (to upper case) and attribute names (to lower case).
        Most xml interpreters is not case sensitve to tagnamess and attribute names
        However, this is not the case for SAS EG!
        The following is to map the tagnames and attribute names (original case form vs normalized case form)
        so that later (after the v7 xml convertion is done), the normalized names are restored to original case form
    */
    let TagAttrNames_obj= getTagAttrNames(jquery_dom_obj_v8)
    // console.log(TagAttrNames_obj)

    function getTagAttrNames(doms) {
        let tagNames_arr = ["containerelement", "containertype"], attrNames_arr = ["usesubcontainers"] //ContainerElement, UseSubcontainers is unique in v7
        for (let i = 0; i < doms.length; i++) {
            let thedom = doms[i]
            let theTagName = thedom.tagName
            if (!tagNames_arr.includes(theTagName)) { tagNames_arr.push(theTagName) }
            let attrs = thedom.attributes
            // console.log(attrs)
            if (attrs) {
                for (let j = 0; j < attrs.length; j++) {
                    let theAttrName = attrs[j].nodeName
                    // console.log(theAttrName)
                    if (!attrNames_arr.includes(theAttrName)) { attrNames_arr.push(theAttrName) }
                } //for (let j = 0; j < attrs.length; j++)
            } //if (attrs)

            // recursion for children nodes
            if (thedom.children && thedom.children.length > 0) {
                let tmp = getTagAttrNames(thedom.children)
                if (tmp && tmp.tagnames && tmp.tagnames.length > 0) {
                    tmp.tagnames.forEach(d => {
                        if (!tagNames_arr.includes(d)) { tagNames_arr.push(d) }
                    })
                }
                if (tmp && tmp.attrnames && tmp.attrnames.length > 0) {
                    tmp.attrnames.forEach(d => {
                        if (!attrNames_arr.includes(d)) { attrNames_arr.push(d) }
                    })
                }
            }
        } //for (let i = 1; i< doms_obj.length
        return { tagnames: tagNames_arr, attrnames: attrNames_arr }
    }//


    // the jsdom_obj is like jQuery { '0': HTMLUnknownElement {}, length: 1 }
    // let thesrcxmldom_v8 = jquery_dom_obj_v8[0]
    /* thexmldom_v8 is like HTMLUnknownElement:
        {
            tagName: "PROJECTCOLLECTION",
            attributes:[
                {nodeName: "egversion", nodeValue:"8.1"},
                {nodeName: "type", nodeValue:"SAS.EG.ProjectElements.ElementManager"},
            ],
            children: [...]
        }
        however, the thexmldom_v8 is not a plain json object
    */
    // console.log(thexmldom_v8.tagName, thexmldom_v8.attributes[0].nodeName, thexmldom_v8.attributes[0].nodeValue)
    // console.log(Object.keys(thexmldom_v8))

    // // The following is to get all the keys of srcxmldom_v8_obj and save into a json file, which is helpful in understanding the various properties of the obj
    // let srcxmldom_v8_obj = []
    // $.each(thesrcxmldom_v8, function(key, value){
    //     srcxmldom_v8_obj.push({key:key, value:value})
    // })

    // // let thejsonstr = JSON.stringify(srcxmldom_v8_obj)
    // let thejsonfile ="./data/out/12_test_projectxml2json_v8.json";
    // await mymodules.saveJSON(srcxmldom_v8_obj, thejsonfile)

    // get the attribute 'EGVersion'
    // let attr_egversion = jquery_dom_obj_v8.attr('EGVersion')
    // console.log(attr_egversion)

    // *** create an empty dom obj for v7
    let jquery_dom_obj_v7 = $('<ProjectCollection></ProjectCollection>')
    // console.log(jquery_dom_obj_v7.prop("outerHTML"))

    // *** add attributes egversion, and type
    jquery_dom_obj_v7.attr("EGVersion", "7.1")
    jquery_dom_obj_v7.attr("Type", "SAS.EG.ProjectElements.ProjectCollection")
    // console.log(jquery_dom_obj_v7.prop("outerHTML"))

    // *** clone the project element from v8 obj and append it to v7obj
    // make a clone of the project element dom (among the children nodes, the first with the tag of 'element') from the src dom obj and append as the child node to the target dom
    // note: do not use the project element dom with obj_v8. otherwise the project element dom will be removed from obj_v8 after appending to obj_v7!
    let projectElement_dom_v8_clone = jquery_dom_obj_v8.find("eLEMent").clone()[0] // .find() returns the all dom with the requested tagname

    // append the projectElement_dom_v8_clone to obj_v7
    jquery_dom_obj_v7.append(projectElement_dom_v8_clone)
    // console.log(jquery_dom_obj_v8.prop('outerHTML').substr(0, 200))
    // console.log(jquery_dom_obj_v7.prop("outerHTML"))

    // *** Change the label of the project element of obj v7 to v7_converted_from_v8_2pfd_3p_3log_2data_2datashortcut_2link_1rpt_1xls_1sas_1note_1copytask 
    // note: this time, use the label element within the obj v7, instead a clone. 
    // that way, once the projectLabel_dom_v7 changes, the whole jquery_dom_obj_v7 changes
    let projectLabel_dom_v7 = jquery_dom_obj_v7.find("element").find("label")
    // console.log(projectLabel_dom_v7.prop("outerHTML"))
    projectLabel_dom_v7.text("v8_to_v7")
    // // console.log(projectLabel_dom_v7.text())
    // console.log(jquery_dom_obj_v7.prop("outerHTML"))
    // console.log(jquery_dom_obj_v8.prop('outerHTML').substr(0, 200))

    // now that the label of the project element of the v7 obj has been changed.
    // Note that the project element of the v8 obj is not affected

    // *** the following is to clone some components from v8 obj and append them to v7 obj. These components are the same or similar for both versions
    // It follows the same process as did above for appending a colone of the project element component

    // note, the case (lower, upper, whatever) of the tagnames is ignored as jquery normalize the tag names to upper case 
    // [jquery also normalize the attribute names (to lower case) ]. 
    let tags_to_clone_arr = [
        "whatever", // the first one is ignored as no such tags can be found from the source obj
        "aPplicationOverrides",
        "metadatainfo",
        "UseRelativePaths",
        "SubmitToGrid",
        "QueueSubmitsForServer",
        "ActionOnError",
        "DataList",
        "ExternalFileList",
        "InformationMap_List",
        "DecisionManager",
        "Elements",
        "GitSourceControl",
        "Containers",
        "ExploreDataList",
        "Parameters",
        "ProjectLog"
    ]
    tags_to_clone_arr.forEach(d => {
        append_cloned_components_of_the_first_dom_found_by_tagname(jquery_dom_obj_v8, jquery_dom_obj_v7, d)
    })


    /*** For ProjectCollection.Elements.Element components (programs, logs, links, shortcuts, etc)
        some are with a tag ProjectCollection.Elements.Element.SubmitableElement.GraphDeviceOverride
        the textContent of such tags is "Default" in v8, and need to be changed to "Png" for v7
        All tags with the name GraphDeviceOverride should be changed; therefore the following is to search
        for an array of all GraphDeviceOverride tags
    */
    let GraphDeviceOverrideTags_doms_obj = jquery_dom_obj_v7.find('GraphDeviceOverride')
    //    console.log($(GraphDeviceOverrideTags_arr[2]).text())
    // the GraphDeviceOverrideTags_doms_obj is a jquery object and does not support .forEach({})
    for (let i = 0; i < GraphDeviceOverrideTags_doms_obj.length; i++) {
        // Note, the GraphDeviceOverride_elm is an xhtml element, not a jquery object
        let GraphDeviceOverride_elm = GraphDeviceOverrideTags_doms_obj[i]
        $(GraphDeviceOverride_elm).text("Png")
        // same as: 
        // GraphDeviceOverride_elm.textContent = "Png"
        // Note: the values are in .textContent, not in textContent!

    } //for (let i = 0; i<GraphDeviceOverrideTags_doms_obj.length;i++ )

    // *** for ProjectCollection.Elements.Element components, 
    // get the value in attr "Type", as well as textContent of .Element.ID and .Element.Label
    // push the type, id and label to an array
    // the PFDComponentTypes_arr is for making EGTreeNodes for PFDs (see __f00 .xml of v7 obj)...
    // PFDIDs_arr to be used to identify EGTreeNodes
    // the TaskComponents_arr is for making ...
    // the NonTaskComponents_arr is for making ... 
    let ComponentTypes_arr = [], Components_arr = [], PFDComponentTypes_arr = [], PFDIDs_arr = [], TaskComponents_arr = [], NonTaskComponents_arr = []
    let project_components_doms_obj = jquery_dom_obj_v7.find('Elements').children()
    // console.log(project_components_doms_obj)

    // console.log(jquery_dom_obj_v7.prop("outerHTML"))   
    for (let i = 0; i < project_components_doms_obj.length; i++) {
        let theComponent_elm = project_components_doms_obj[i]
        let theType_str = $(theComponent_elm).attr("type")
        // note: multiple doms may be found; therefore always select the first among the doms that are found
        let theLabel_elm = $(theComponent_elm).find('Element').find('label')[0]
        let theLabel_str = $(theLabel_elm).text()
        let theID_elm = $(theComponent_elm).find('Element').find('id')[0]
        let theID_str = theID_elm.textContent
        let theContainerID_elm = $(theComponent_elm).find('Element').find('Container')[0]
        let theContainerID_str = theContainerID_elm.textContent
        // console.log (theType_str, theLabel_str, theLabel_str)

        // push the distinct types into an array
        if (!ComponentTypes_arr.includes(theType_str)) { ComponentTypes_arr.push(theType_str) }

        // push individual components into the array Components_arr
        Components_arr.push({ type: theType_str, label: theLabel_str, id: theID_str, container: theContainerID_str })

        // push the task components into the array TaskComponents_arr
        if (theType_str === "SAS.EG.ProjectElements.CodeTask") {
            TaskComponents_arr.push({ type: theType_str, label: theLabel_str, id: theID_str, container: theContainerID_str })
        } else if (
            // in v8, thetype is theType_str === "SAS.EG.ProjectElements.ProcessFlowContainer", in v7, ".PFD"
            theType_str === "SAS.EG.ProjectElements.ProcessFlowContainer" ||
            theType_str === "SAS.EG.ProjectElements.PFD"
        ) {
            // *** for the PFDComponentTypes, chang the type to SAS.EG.ProjectElements.PFD 
            $(theComponent_elm).attr("type", "SAS.EG.ProjectElements.PFD")
            PFDIDs_arr.push(theID_str)
            PFDComponentTypes_arr.push({ type: "SAS.EG.ProjectElements.PFD", label: theLabel_str, id: theID_str, container: theContainerID_str })
            // *** also append the ContainerElement tag as the second child of the PFD Element
            // make a clone of the exsting children nodes (i.e., the element and the pfd tags)
            let PFDElementChildren_clone = $(theComponent_elm.children).clone()
            // empty children nodes of the PFD element
            $(theComponent_elm).empty()
            // hard code to append the existing children back, and insert the containerelement (unique in v7) as the second child
            //1. append the child <element>
            $(theComponent_elm).append($(PFDElementChildren_clone[0]))
            //2. append the newly added containerelement
            let ContainerElement_dom_obj = $("<ContainerElement><ContainerType>ProcessFlow</ContainerType></ContainerElement>")
            $(theComponent_elm).append(ContainerElement_dom_obj)
            //3. append the existing child <pfd>
            $(theComponent_elm).append($(PFDElementChildren_clone[1]))
        
        } else if ( //*** the nonTask components do not includes Log , last submitted code, shortcut to data, link, and odsresult
            theType_str !== "SAS.EG.ProjectElements.Log" &&
            theType_str !== "SAS.EG.ProjectElements.Code" &&
            theType_str !== "SAS.EG.ProjectElements.ShortCutToData" &&
            theType_str !== "SAS.EG.ProjectElements.Link" &&
            theType_str !== "SAS.EG.ProjectElements.ODSResult"
        ) {
            NonTaskComponents_arr.push({ type: theType_str, label: theLabel_str, id: theID_str, container: theContainerID_str })
        }
    } //for (let i = 0; i< project_components_doms_obj.length;i++ ) 

    // console.log(ComponentTypes_arr)
    // console.log(PFDComponentTypes_arr)
    // console.log(TaskComponents_arr.length)
    // console.log(NonTaskComponents_arr.length)

    // *** create an Empty External_Objects and append to the v7 obj
    let External_Objects_dom_obj = $("<External_Objects></External_Objects>")

    // *** append the External_Objects_dom_obj to the v7 obj
    jquery_dom_obj_v7.append(External_Objects_dom_obj)

    // *** within External_Objects_dom_obj, add a tag ProjectTreeView
    let ProjectTreeView_dom_obj = $("<ProjectTreeView></ProjectTreeView>")
    ProjectTreeView_dom_obj.attr("EGVersion", "7.1")
    ProjectTreeView_dom_obj.attr("UseSubcontainers", "True")
    External_Objects_dom_obj.append(ProjectTreeView_dom_obj)
    // wired, this time, the xml of ProjectTreeView_dom_obj was not removed after appending
    // console.log(ProjectTreeView_dom_obj.parent().prop("outerHTML"))

    // *** within External_Objects_dom_obj, add a tag ProcessFlowView
    let ProcessFlowView_dom_obj = $("<ProcessFlowView><Zoom>1</Zoom><Grid>True</Grid><Layout>False</Layout></ProcessFlowView>")
    External_Objects_dom_obj.append(ProcessFlowView_dom_obj)
    // console.log(ProcessFlowView_dom_obj.prop("outerHTML"))

    // *** within External_Objects_dom_obj, add a tag MainFrom
    let MainFrom_dom_obj = $("<MainFrom><ActiveData></ActiveData></MainFrom>")
    External_Objects_dom_obj.append(MainFrom_dom_obj)
    // console.log(MainFrom_dom_obj.prop("outerHTML"))

    // *** Prepare a list of EGTreeNode elements (for PFDs) and append to ProjectTreeView_dom_obj
    /* Each EGTreeNode is with the following 4 tags:
        1) <NodeType>NODETYPE_ELEMENT</NodeType> (fixed value)
        2) set the innerText of the tag ElementID as the ID property from the element of the new array
        (e.g., <ElementID>PFD-GirXDnE4Mj4CHrI5</ElementID>)
        3) set the innerText of the tag Label as the Label property from the elment of the new array
        (e.g., <Label>pfd1</Label>)

        I'll save the following, and simply make it <Expanded>True</Expanded>. This is gonna save a lot of calculation.
        4) Search for the element in the  
            v8 file's ProjectCollection.External_Objects.OpenProjectView.TreeItem 
            whereby the property ID matches the ID property from the element 
            of the new array. 
            For such a TreeItem Element, get the attribute IsExpanded, change from lower case
            to proper case (e.g., 'true' to 'True'), and set as textContent of the tag Expanded.
        (e.g., <Expanded>True</Expanded>) 
     */

    PFDComponentTypes_arr.forEach(d => {
        let theID = d.id, theLabel = d.label
        // make xml str for the EGTreeNode PFD element 
        let EGTreeNode_PFD_xmlstr = `
            <EGTreeNode>
                <NodeType>NODETYPE_ELEMENT</NodeType>
                <ElementID>${theID}</ElementID>
                <Label>${theLabel}</Label>
                <Expanded>True</Expanded>
            </EGTreeNode>
                `
        let EGTreeNode_PFD_dom_obj = $(EGTreeNode_PFD_xmlstr)
        // *** append the PFD dom into ProjectTreeView_dom_obj
        ProjectTreeView_dom_obj.append(EGTreeNode_PFD_dom_obj)

    }) // PFDComponentTypes_arr.forEach

    // *** make a dict to identify the PFD according to their PFDID
    // because for the following, the nontask and task EGTreeNode elements should be appended to the corresponding PDF EGTreeNode
    let PFDEGTreeNodes_doms_dict = {}

    let PFDEGTreeNodes_doms_obj = ProjectTreeView_dom_obj.find('EGTreeNode')
    // the finding above may contain EGTreeNode elements that are not for PFD
    // therefore the following loop is used to select those for PFD and save into the dict
    for (let i = 0; i < PFDEGTreeNodes_doms_obj.length; i++) {
        // get the ID of the EGTreeNode
        let thePFDID = $(PFDEGTreeNodes_doms_obj[i]).find('ElementID')[0].textContent
        // The following is to check and match the pfd EGTreeNode elements
        if (PFDIDs_arr.includes(thePFDID)) {
            PFDEGTreeNodes_doms_dict[thePFDID] = $(PFDEGTreeNodes_doms_obj[i])
        } // if (PFDIDs_arr.includes(thePFDID))
    } //EGTreeNodes_doms_obj  

    //*** loop and make nonTaskEGTreeNode elements and append into nonTaskEGTreeNodeContainer_dom_obj*/
    for (let i = 0; i < NonTaskComponents_arr.length; i++) {
        let d = NonTaskComponents_arr[i],
            theNonTaskID = d.id, theNonTaskLabel = d.label, thePFDContainer_dom_obj = PFDEGTreeNodes_doms_dict[d.container]
        // // append the nonTaskEGTreeNodeContainer_dom_obj into the PFDContainer (only append for once)
        // if (i === 0) {            
        //     nonTaskEGTreeNodeContainer_objs_dict[d.container] = $('<EGTreeNode></EGTreeNode>')
        //     thePFDContainer_dom_obj.append(nonTaskEGTreeNodeContainer_objs_dict[d.container])
        //  } // if (i===0)

        // make xml str for the EGTreeNode nonTask element (see __f00a)
        /**
         1) <NodeType>NODETYPE_ELEMENT</NodeType> (fixed value)
            2) set the innerText of the tag ElementID as the ID property from the element of the new array
            (e.g., <ElementID>ShortCutToFile-frOMCUhUHcJWJKeO</ElementID>)
            3) set the innerText of the tag Label as the Label property from the elment of the new array
            (e.g., <Label>pfd1</Label>)
            4) <Expanded>True</Expanded> (fixed)
         */
        let EGTreeNode_nonTask_xmlstr = `
            <EGTreeNode>
                <NodeType>NODETYPE_ELEMENT</NodeType>
                <ElementID>${theNonTaskID}</ElementID>
                <Label>${theNonTaskLabel}</Label>
                <Expanded>False</Expanded>
            </EGTreeNode>
                `
        let EGTreeNode_nonTask_obj = $(EGTreeNode_nonTask_xmlstr)
        // *** append the nonTask dom into ProjectTreeView_dom_obj
        thePFDContainer_dom_obj.append(EGTreeNode_nonTask_obj)

    } // for (let i = 0; i < NonTaskComponents_arr.length; i++)

    // *** append the taskEGTreeNode elements
    // need to create the dict so that a TaskEGTreeNodeContainer_obj is dedicated for a PFD (PFDID as the key for the nonTaskEGTreeNodeContainer_obj)
    // that way, the dedicated PFDEGTreeNodes_doms_obj can be used to append nonTask EGTreeNode elements to the corresponding PFD without messing up
    let TaskEGTreeNodeContainer_objs_dict = {}
    //*** loop and make TaskEGTreeNode elements and append into TaskEGTreeNodeContainer_dom_obj*/
    for (let i = 0; i < TaskComponents_arr.length; i++) {
        let d = TaskComponents_arr[i],
            theTaskID = d.id, theTaskLabel = d.label, thePFDContainer_dom_obj = PFDEGTreeNodes_doms_dict[d.container]
        // append the TaskEGTreeNodeContainer_dom_obj into the PFDContainer (only append once)
        if (i === 0) {
            TaskEGTreeNodeContainer_objs_dict[d.container] = $('<EGTreeNode><NodeType>NODETYPE_PROGRAMFOLDER</NodeType><Expanded>True</Expanded><Label>Programs</Label></EGTreeNode>')
            thePFDContainer_dom_obj.append(TaskEGTreeNodeContainer_objs_dict[d.container])
        } // if (i===0)

        // *** make xml str for the EGTreeNode nonTask element (see __f00b)
        /***
         1) <NodeType>NODETYPE_ELEMENT</NodeType> (fixed value)
            2) set the innerText of the tag ElementID as the ID property from the element of the new array
            (e.g., <ElementID>ShortCutToFile-frOMCUhUHcJWJKeO</ElementID>)
            3) set the innerText of the tag Label as the Label property from the elment of the new array
            (e.g., <Label>pfd1</Label>)
            4) <Expanded>False</Expanded> (fixed)
         */
        let EGTreeNode_Task_xmlstr = `
            <EGTreeNode>
                <NodeType>NODETYPE_ELEMENT</NodeType>
                <ElementID>${theTaskID}</ElementID>
                <Label>${theTaskLabel}</Label>
                <Expanded>False</Expanded>
            </EGTreeNode>
                `
        let EGTreeNode_Task_obj = $(EGTreeNode_Task_xmlstr)
        // *** append the nonTask dom into ProjectTreeView_dom_obj
        TaskEGTreeNodeContainer_objs_dict[d.container].append(EGTreeNode_Task_obj)

    } // for (let i = 0; i < NonTaskComponents_arr.length; i++)

    // *** in the .ProcessFlowView, add a Graphics element
    let Graphics_dom_obj = $('<Graphics></Graphics>')
    //*** append Graphics_dom_obj to ProcessFlowView_dom_obj */
    ProcessFlowView_dom_obj.append(Graphics_dom_obj)

    // from the v8 obj, get TaskGraphic elements and append into Graphics_dom_obj (see __f01)
    let TaskGraphic_doms_obj_v8 = jquery_dom_obj_v8.find("TaskGraphic")
    let TaskGraphic_doms_obj_v8_clone = TaskGraphic_doms_obj_v8.clone()
    Graphics_dom_obj.append(TaskGraphic_doms_obj_v8_clone)

    // from the v8 obj, get NoteGraphic elements and append into Graphics_dom_obj (see __f02)
    let NoteGraphic_doms_obj_v8 = jquery_dom_obj_v8.find("NoteGraphic")
    let NoteGraphic_doms_obj_v8_clone = NoteGraphic_doms_obj_v8.clone()
    Graphics_dom_obj.append(NoteGraphic_doms_obj_v8_clone)

    // *** create an element Containers
    let Containers_dom_obj = $('<Containers></Containers>')
    //  within Containers, add Properties, each for a PFD
    PFDComponentTypes_arr.forEach(d => {
        let theID = d.id
        // make xml str for the EGTreeNode PFD element 
        let Properties_PFD_xmlstr = `
            <Properties>
                <ID>${theID}</ID>
                <BackgroundColor>Default</BackgroundColor>
                <Align>AlignTop</Align>
            </Properties>
                `
        let Properties_PFD_dom_obj = $(Properties_PFD_xmlstr)
        // *** append the Properties_PFD_dom_obj into Containers_dom_obj
        Containers_dom_obj.append(Properties_PFD_dom_obj)

    }) // PFDComponentTypes_arr.forEach
    // *** after ProjectCollection.External_Objects.ProcessFlowView.Graphics
    // append the Containers_dom_obj
    ProcessFlowView_dom_obj.append(Containers_dom_obj)
    

    // console.log(jquery_dom_obj_v7.prop("outerHTML"))
    // save the xmlstr into a text file as ../data/out/
    let converted_v7_xmlstr = jquery_dom_obj_v7.prop("outerHTML")
    // change  <Table123> back to <table>
    converted_v7_xmlstr = converted_v7_xmlstr.replace(/\<table123\>/g, "<table>")
    converted_v7_xmlstr = converted_v7_xmlstr.replace(/\<\/table123\>/g, "</table>")
    converted_v7_xmlstr = '<?xml version="1.0" encoding="utf-16"?>\n' + converted_v7_xmlstr
    await mymodules.saveLocalTxtFile(converted_v7_xmlstr, thetargetxml, 'utf16le');
})()

// as the function name says....
function append_cloned_components_of_the_first_dom_found_by_tagname(srcobj, targetobj, theTag) {
    let theClone = srcobj.find(theTag).clone()[0]
    // if theClone is null (no such tag is found), the function simply skip without stopping, and nothing will be appended to the targetobj.
    // however, I'll need to have a default component even if it cannot be found from the source obj
    // ...
    targetobj.append(theClone)
    // Note that nothing need to be returned, as the change will be made in v7 obj (remember that targetobj is just a nickname!)
} //function append_cloned_components_of_the_first_dom_found_bytagname

// clean up the xmlstr
function cleanxmlstr(thexmlstr) {

    // the xmlstr is messed up with strange chars like &amp;lt; &lt;, etc
    // 1. The following is to change &amp;lt to <, &gt to > ...
    let thesrcxmlstr_ampersand_code_normalized = normalize_ampersand_code(thexmlstr)

    // jsdom does not handle the tag <Table>A</Table> well
    // In that case, it alters the html to '<Table></Table>A' !
    //1. The following is to rename the tag <Table> to <Table123> to work around
    let thesrcxmlstr_rename_table_table123 = rename_tag_named_table(thesrcxmlstr_ampersand_code_normalized)

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
     2. the following is to convert  <Parameters /> to <Parameters></Parameters>
     */
    let thesrcxmlstr_selfclosing_converted = convertSelfClosingHTML_to_OldSchoolHTML(thesrcxmlstr_rename_table_table123)
    // console.log(thesrcxmlstr_normalized_2)

    //3. remove the comments (code within <!--  and -->)
    let thesrcxmlstr_removecomments = removecomments(thesrcxmlstr_selfclosing_converted)
    // console.log(thesrcxmlstr_removecomments)

    return thesrcxmlstr_removecomments
} //


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