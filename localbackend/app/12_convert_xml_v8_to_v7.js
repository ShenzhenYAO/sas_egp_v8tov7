/** To read the v8 xml and convert to a v7 xml file */

// load custom modules
const mymodules = require('../../localbackend/app/mytools/mymodules');

// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

const thesrcxml = 'data/try/v8_2pfd_3p_3log_2data_2datashortcut_2link_1rpt_1xls_1sas_1note_1copytask.xml';
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
    projectLabel_dom_v7.text("v7_converted_from_v8_2pfd_3p_3log_2data_2datashortcut_2link_1rpt_1xls_1sas_1note_1copytask")
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
        // Note: the values are in .textContent, not in innerText!
    } //for (let i = 0; i<GraphDeviceOverrideTags_doms_obj.length;i++ )

    // *** for ProjectCollection.Elements.Element components, 
    // get the value in attr "Type", as well as textContent of .Element.ID and .Element.Label
    // push the type, id and label to an array
    // the PFDComponentTypes_arr is for making ...
    // the TaskComponents_arr is for making ...
    // the NonTaskComponents_arr is for making ... 
    let ComponentTypes_arr = [], Components_arr = [], PFDComponentTypes_arr = [], TaskComponents_arr = [], NonTaskComponents_arr = []
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
        // console.log (theType_str, theLabel_str, theLabel_str)

        // push the distinct types into an array
        if (!ComponentTypes_arr.includes(theType_str)) { ComponentTypes_arr.push(theType_str) }

        // push individual components into the array Components_arr
        Components_arr.push({ type: theType_str, label: theLabel_str, id: theID_str })

        // push the task components into the array TaskComponents_arr
        if (theType_str === "SAS.EG.ProjectElements.CodeTask") {
            TaskComponents_arr.push({ type: theType_str, label: theLabel_str, id: theID_str })
        } else if (
            // in v8, thetype is theType_str === "SAS.EG.ProjectElements.ProcessFlowContainer", in v7, ".PFD"
            theType_str === "SAS.EG.ProjectElements.ProcessFlowContainer" ||
            theType_str === "SAS.EG.ProjectElements.PFD"
        ) {
            // *** for the PFDComponentTypes, chang the type to SAS.EG.ProjectElements.PFD 
            $(theComponent_elm).attr("type", "SAS.EG.ProjectElements.PFD")
            PFDComponentTypes_arr.push({ type: "SAS.EG.ProjectElements.PFD", label: theLabel_str, id: theID_str })
        } else {
            NonTaskComponents_arr.push({ type: theType_str, label: theLabel_str, id: theID_str })
        }
    } //for (let i = 0; i< project_components_doms_obj.length;i++ ) 

    // console.log(ComponentTypes_arr)
    // console.log(PFDComponentTypes_arr)
    // console.log(TaskComponents_arr.length)
    // console.log(NonTaskComponents_arr.length)








    // console.log(jquery_dom_obj_v7.prop("outerHTML"))

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