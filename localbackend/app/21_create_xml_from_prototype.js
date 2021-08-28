/* To create a project xml from the prototype 
    The prototypes are saved at data/in/prototype/egpv7
    components of a typical v7 project.xml are saved as individual xml files
*/

// load custom modules
const mymodules = require('../../localbackend/app/mytools/mymodules');

// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

// https://www.npmjs.com/package/adm-zip
const AdmZip = require('adm-zip');

const __gitzipfile = "data/in/prototype/__git.zip";

(async () => {

    // 1. make a project collection scala
    let config_project = await config_projectcollection()

    // 2. prepare the doms_obj and the cleaned source xml string from the prototype
    let { doms_obj, thesrcxmlstr_cleaned } = await f01_makeBasicProjectScala(config_project)
    // console.log(thesrcxmlstr_cleaned)

    // 3. add a process flow (PFD)
    // config the pfd element
    let config_pfd = await config_pfd_function(config_project)
    doms_obj = await make_append_pfd_component(doms_obj, config_pfd)

    let targetxmlstr = await cleanup_targetxml(doms_obj, thesrcxmlstr_cleaned)
    // console.log(targetxmlstr)
    targetxmlstr = '<?xml version="1.0" encoding="utf-16"?>\n' + targetxmlstr
    let thetargetxmlfile = 'data/out/test/' + config_project.Element.Label + '.xml'
    await mymodules.saveLocalTxtFile(targetxmlstr, thetargetxmlfile, 'utf16le');

    // save the zip as an egp file
    const newZip = new AdmZip()
    // using Buffer to impor the xml with utf16 encoding
    newZip.addFile('project.xml', Buffer.from(targetxmlstr, "utf16le"))

    // writeZip the newZip instead of the original (theZip)
    await newZip.writeZip("data/out/test/" + config_project.Element.Label + ".egp")

    async function notrun() {

        // console.log(jquery_dom_obj_v7.prop("outerHTML"))
        // save the xmlstr into a text file as ../data/out/
        let converted_v7_xmlstr = jquery_dom_obj_v7.prop("outerHTML")

        // merge the tagname_dicts
        let Tagnames_dict = { ...additional_v7tag_dict, ...originalTagnames_dict }

        let additional_v7attr_dict = { "usesubcontainers": "UseSubcontainers" }
        let Attrnames_dict = { ...additional_v7attr_dict, ...originalAttrNames_dict }
        // console.log(Tagnames_dict)
        // console.log(Attrnames_dict)

    }//function notrun(){
})()

// get an array of file names from a folder
async function getfilenames_from_a_folder(thefolder) {
    let fs = require('fs');
    // get all files within the src folder
    let newpromise = new Promise(
        // then new promise is to define a resolved value
        (resolve) => {
            fs.readdir(thefolder, (err, files) => {
                resolve(files)
            });
        }//resolve
    ) // new promise1;
    // create thestage
    const resolved = await newpromise.then(d => {
        // console.log(d)
        return d
    });
    return resolved
} // async function getfiles_from_a_folder

// configuration for the pfd components
async function config_pfd_function(config_project) {
    let config_pfd = {}
    // config the elemment tags (properties of the pfd)
    config_pfd.element = {}
    config_pfd.element.Label = 'PFD1'
    config_pfd.element.Type = 'CONTAINER'
    config_pfd.element.Container = config_project.Element.ID
    config_pfd.element.ID = 'PFD-' + mymodules.generateUUID()
    config_pfd.element.CreatedOn = config_project.Element.CreatedOn
    config_pfd.element.ModifiedOn = config_project.Element.ModifiedOn
    config_pfd.element.ModifiedBy = config_project.Element.ModifiedBy
    config_pfd.element.ModifiedByEGID = config_project.Element.ModifiedByEGID
    //config the egtreenode tags
    config_pfd.egtreenode = {}
    config_pfd.egtreenode.NodeType = 'NODETYPE_ELEMENT'
    config_pfd.egtreenode.ElementID = config_pfd.element.ID
    config_pfd.egtreenode.Label = config_pfd.element.Label
    //config the properties tags
    config_pfd.properties = {}
    config_pfd.properties.ID = config_pfd.element.ID
    return config_pfd
};//async function config_pdf
// make and appennd components for pfd
/* add a process flow (PFD)
1) within ProjectCollection.Elements,add:
    <Element Type="SAS.EG.ProjectElements.PFD">
        <Element>...</Element>
        <ContainerElement>...</ContainerElement>
        <PFD />
    </Element>
2) within ProjectCollection.External_Objects.ProjectTreeView, add:
        <EGTreeNode>...</EGTreeNode>
3) within ProjectCollection.External_Objects.ProcessFlowView.Containers, add:
        <Properties>...</Properties>
*/
async function make_append_pfd_component(doms_obj, config_pfd) {
    // console.log(config_pfd.element)
    // make the PFD component to append to ProjectCollection.Elements
    let component_pfd_dom_obj = await make_pfd_component(config_pfd.element)
    // console.log('line125', component_pfd_dom_obj.prop('outerHTML'))
    // append the PFD to ProjectCollection.Elements
    $(doms_obj.find('Elements')[0]).append(component_pfd_dom_obj)

    // make the egtreenode component to append to ProjectCollection.External_Objects.ProjectTreeView
    let component_pfd_egtreenode_dom_obj = await make_EGTreeNode(config_pfd.egtreenode)
    // append the treenode to ProjectCollection.External_Objects.ProjectTreeView
    $(doms_obj.find('External_Objects').find('ProjectTreeView')[0]).append(component_pfd_egtreenode_dom_obj)

    // make the properties component to append to ProjectCollection.External_Objects.ProcessFlowView.Containers 
    let component_pfd_properties_dom_obj = await make_processflowview_properties(config_pfd.properties)
    // append it to ProjectCollection.External_Objects.ProcessFlowView.Containers
    $(doms_obj.find('External_Objects').find('ProcessFlowView').find('Containers')[0]).append(component_pfd_properties_dom_obj)
    return doms_obj
}; //function make_append_pfd_component

// make properties tag for ProjectCollection.External_Objects.ProcessFlowView.Containers
async function make_processflowview_properties(config) {

    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___c03_pfd_properties_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line147', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)

    let dom_obj = $(thesrcxmlstr_cleaned)
    if (config.ID) { $(dom_obj.find('ID')[0]).text(config.ID) }
    if (config.BackgroundColor) { $(dom_obj.find('BackgroundColor')[0]).text(config.BackgroundColor) }
    if (config.Align) { $(dom_obj.find('Align')[0]).text(config.Align) }
    return dom_obj
} // function make_processflowview_properties


// make a EGTreeNode
async function make_EGTreeNode(config) {

    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___c02_pfd_egtreenode_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line147',thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)

    let dom_obj = $(thesrcxmlstr_cleaned)
    if (config.NodeType) { $(dom_obj.find('NodeType')[0]).text(config.NodeType) }
    if (config.ElementID) { $(dom_obj.find('ElementID')[0]).text(config.ElementID) }
    if (config.Expanded) { $(dom_obj.find('Expanded')[0]).text(config.Expanded) }
    if (config.Label) { $(dom_obj.find('Label')[0]).text(config.Label) }
    return dom_obj
} // function make_EGTreeNode()

// make a pfd component (to be appended to ProjectCollection.Elements)
async function make_pfd_component(config) {
    // console.log('line 162', config)
    // make the pfd element (properties of the pfd)
    let element_PFD1_dom_obj = await define_element(config)
    // console.log('line165', element_PFD1_dom_obj.prop('outerHTML'))
    // make the container element of the pfd, this part is fixed for any PFD obj

    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___c01_pfd_containers_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line171', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)

    let container_PFD1_dom_obj = $(thesrcxmlstr_cleaned)
    // make the default PFD element (the empty PFD element)
    let pfd_PFD1_dom_obj = $('<PFD></PFD>')
    // assemble the PFD component to be added to ProjectCollection.Elements
    let component_pfd_dom_obj = $('<Element Type="SAS.EG.ProjectElements.PFD"></Element>')
    component_pfd_dom_obj.append(element_PFD1_dom_obj)
    component_pfd_dom_obj.append(container_PFD1_dom_obj)
    component_pfd_dom_obj.append(pfd_PFD1_dom_obj)

    return component_pfd_dom_obj
}; // function make_pfd_component()
/* define properties of a component.
    properties of a compenent are defined in the tag 'Element'. 
    The properties are standardized for most components
*/
async function define_element(config) {
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___b_element_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line 195', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)

    // make the obj
    let theElement_dom_obj = $(thesrcxmlstr_cleaned)
    // set element attributes
    if (config.attrs && config.attrs.length > 0) {
        config.attrs.forEach(d => {
            theElement_dom_obj.attr(d.name, d.value)
        })//config.attrs.forEach
    } //if (config.attrs && config.attrs.length > 0)
    // set properties
    if (config.Label) { $(theElement_dom_obj.find('label')[0]).text(config.Lable) }
    if (config.Type) { $(theElement_dom_obj.find('Type')[0]).text(config.Type) }
    if (config.Container) { $(theElement_dom_obj.find('Container')[0]).text(config.Container) }
    if (config.ID) { $(theElement_dom_obj.find('ID')[0]).text(config.ID) }
    if (config.CreatedOn) { $(theElement_dom_obj.find('CreatedOn')[0]).text(config.CreatedOn) }
    if (config.ModifiedOn) { $(theElement_dom_obj.find('ModifiedOn')[0]).text(config.ModifiedOn) }
    if (config.ModifiedBy) { $(theElement_dom_obj.find('ModifiedBy')[0]).text(config.ModifiedBy) }
    if (config.ModifiedByEGID) { $(theElement_dom_obj.find('ModifiedByEGID')[0]).text(config.ModifiedByEGID) }
    if (config.ModifiedByEGVer) { $(theElement_dom_obj.find('ModifiedByEGVer')[0]).text(config.ModifiedByEGVer) }
    if (config.HasSerializationError) { $(theElement_dom_obj.find('HasSerializationError')[0]).text(config.HasSerializationError) }
    if (config.InputIDs) { $(theElement_dom_obj.find('InputIDs')[0]).text(config.InputIDs) }
    if (config.ModifiedBy) { $(theElement_dom_obj.find('ModifiedBy')[0]).text(config.ModifiedBy) }

    return theElement_dom_obj
}; //define_element

// config the project collection
async function config_projectcollection() {
    let config = {}
    config.Element = {}
    config.Element.Label = "__test"
    config.Element.ID = 'ProjectCollection-' + mymodules.generateUUID()
    // set init time (for the fields like createon, modifiedon,etc)
    // the time serial here is different from the SAS time serial
    // the later is the difference between the date and 1960-01-01
    // the former is the difference between the date and 0001-01-01
    const timenow = new Date()
    config.Element.CreatedOn = await getTimeSerial(timenow)
    config.Element.ModifiedOn = config.Element.CreatedOn
    // console.log('config.Element.CreatedOn', config.Element.CreatedOn)
    // console.log('config.Element.ModifiedOn', config.Element.ModifiedOn)
    config.Element.ModifiedBy = 'Me'
    config.Element.ModifiedByEGID = 'Me'
    return config
}; // function config_projectcollection

// clean up the target xml (e.g., convert standardized tag names and attribute names to original case form, etc)
async function cleanup_targetxml(doms_obj, thesrcxmlstr_cleaned) {
    // 1. get the modified xmlstr
    let modified_xmlstr = doms_obj.prop('outerHTML')
    // the program does not work well in identifying the tag names if there are two tags in a line
    // the following is to force line breaking between two tags. 
    // the forced line breakers are with special marks ('___123456___')
    // that way, after identifying the tag names, the target xml will be recovered to the original layout by removing these marked line breakers
    modified_xmlstr=modified_xmlstr.replace(/\>/g, '>\n___123456___\n')

    // 2. make dictionaries to map out original tagnames and attributenames
    // read all files in the prototype folder
    // get all file names in 
    let thefolder_prototypexmls = 'data/in/prototype/__xml/egpv7'
    let filenames_prototypexmlfiles = await getfilenames_from_a_folder(thefolder_prototypexmls)
    // console.log('line274', filenames_prototypexmlfiles)
    // loop for each file in the prototypexml file folder, concat the xml strings in the file
    let str_all_prototype_xmlfiles='<Table>\n</Table>\n<PFD>\n</PFD>\n'
    for (let i=0;i<filenames_prototypexmlfiles.length;i++){
        let d = filenames_prototypexmlfiles[i]
        if (d.substr(0, 3) === '___' && d !=='___sample.xml') {
            let thesrcxmlfile = thefolder_prototypexmls + '/' + d
            let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
            let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
            thesrcxmlstr=thesrcxmlstr.replace(/\>/g, '>\n')
            // console.log('line282', thesrcxmlstr)
            // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
            let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
            // console.log('line285',thesrcxmlstr_cleaned )
            str_all_prototype_xmlfiles=str_all_prototype_xmlfiles+thesrcxmlstr_cleaned
            // console.log('line287', str_all_prototype_xmlfiles)
        } // if (d.substr(0, 3) === '___')
    } //filenames_prototypexmlfiles.forEach(d
    // console.log('line291', str_all_prototype_xmlfiles )

    // 2. make a dictionary to map out the standardized and original tagnames
    let originalTagnames_dict_crude = getOriginalTagNames_dict_crude(str_all_prototype_xmlfiles)
    // console.log('line294',originalTagnames_dict_crude)
    // 3. make a dictionary to map out the standardized and original attribute names
    let originalAttrNames_dict_crude = getOriginalAttrNames_dict_crude(str_all_prototype_xmlfiles)
    // console.log(originalAttrNames_dict_crude)

    // 4. replacce the standardized tagnames (all in uppercase) to original names
    Object.keys(originalTagnames_dict_crude).forEach(d => {
        let theoriginal = originalTagnames_dict_crude[d]
        let regEx_normalized1 = new RegExp('\<' + d.toLowerCase() + '\x20', 'g')
        let regEx_normalized2 = new RegExp('\<' + d.toLowerCase() + '\>', 'g')
        let regEx_normalized3 = new RegExp('\<\/' + d.toLowerCase() + '>', 'g')
        modified_xmlstr = modified_xmlstr.replace(regEx_normalized1, '<' + theoriginal + ' ')
        modified_xmlstr = modified_xmlstr.replace(regEx_normalized2, '<' + theoriginal + '>')
        modified_xmlstr = modified_xmlstr.replace(regEx_normalized3, '</' + theoriginal + '>')
    })

    // 5. replacce the standardized attribute names (all in lowercase) to original names
    Object.keys(originalAttrNames_dict_crude).forEach(d => {
        let theoriginal = originalAttrNames_dict_crude[d]
        let regEx_normalized1 = new RegExp(d.toLowerCase() + '=', 'g')
        modified_xmlstr = modified_xmlstr.replace(regEx_normalized1, theoriginal + '=')
    })

    // 6. remove the '\n___123456___\n'
    modified_xmlstr=modified_xmlstr.replace(/\n___123456___\n/g, '')

    return modified_xmlstr
}; //async function cleanup_targetxml()


// make the basic xml code for project.xml
async function f01_makeBasicProjectScala(config) {

    // 1. read the xml code from the prototype scala of project collection
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___a_projectcollection_v7.xml'
    // read the xml into a dom object
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log(thesrcxmlstr.substr(0, 100))

    // 2.remove the head '<?xml version="1.0" encoding="utf-16"?>'
    thebodyxmlstr = thesrcxmlstr.split('encoding="utf-16"?>')[1]

    // 3.cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thebodyxmlstr)
    // console.log(thesrcxmlstr_cleaned.substr(0, 500))

    // 4. convert the cleaned xml str to a DOM (like <PROJECTCOLLECTION>...</PROJECTCOLLECTION>)
    let doms_obj = $(thesrcxmlstr_cleaned)

    // 5.configuration of the textcontent of the tags within the tag ProjectCollectio.Element
    let projectElement = $(doms_obj.find('Element')[0])
    // config the project properties
    $(projectElement.find("Label")[0]).text(config.Element.Label)
    $(projectElement.find("ID")[0]).text(config.Element.ID)
    $(projectElement.find("CreatedOn")[0]).text(config.Element.CreatedOn)
    $(projectElement.find("ModifiedOn")[0]).text(config.Element.ModifiedOn)
    $(projectElement.find("ModifiedBy")[0]).text(config.Element.ModifiedBy)
    $(projectElement.find("ModifiedByEGID")[0]).text(config.Element.ModifiedByEGID)

    // 6. configuration of the other tags within ProjectCollection
    $(doms_obj.find('DataList')[0]).text('')
    $(doms_obj.find('ExternalFileList')[0]).text('')
    $(doms_obj.find('Elements')[0]).empty()
    $(doms_obj.find('GitSourceControl')[0]).remove()

    $(doms_obj.find('Containers')[0]).text('')
    $(doms_obj.find('ProjectLog')[0]).text('')
    $(doms_obj.find('External_Objects').find('ProjectTreeView')[0]).text('')

    $(doms_obj.find('External_Objects').find('ProcessFlowView').find('Zoom')[0]).text('1')
    $(doms_obj.find('External_Objects').find('ProcessFlowView').find('Grid')[0]).text('True')
    $(doms_obj.find('External_Objects').find('ProcessFlowView').find('Layout')[0]).text('False')
    $(doms_obj.find('External_Objects').find('ProcessFlowView').find('Graphics')[0]).text('')
    $(doms_obj.find('External_Objects').find('ProcessFlowView').find('Containers')[0]).text('')

    $(doms_obj.find('External_Objects').find('MainForm').find('ActiveData')[0]).text('')

    return { "doms_obj": doms_obj, "thesrcxmlstr_cleaned": thesrcxmlstr_cleaned }
};//async function f01_makeBasicProjectScala

// set init time (for the fields like createon, modifiedon,etc)
// the time serial here is different from the SAS time serial
// the later is the difference between the date and 1960-01-01
// the former is the difference between the date and 0001-01-01
async function getTimeSerial(targetdatetime) {
    let date0 = new Date('0001-01-01')
    // the time serial here is very strange. It is longer than milliseconds and microseconds, but shorter than nanoseconds
    // the following is a work around by multiplying the original number by 10000
    // note that the default integer in javascript cannot be as precise as to 18 digits
    // to get that precision, the function BigInt must be applied
    // Get bigint number is with an end of 'n', use toString() to convert the number to a string
    let timeSerial = BigInt((targetdatetime - date0) * 10000).toString()
    return timeSerial
};//function getTimeSerial


/*

 convert amp sign code like '&lt;' to normal html code like '<'
   let str =`
   <DNA>&lt;DNA&gt;
   &lt;Type&gt;LocalFile&lt;/Type&gt;
   &lt;Name&gt;sas.sas&lt;/Name&gt;
   &lt;Version&gt;1&lt;/Version&gt;
   &lt;Assembly /&gt;
   &lt;Factory /&gt;
   &lt;FullPath&gt;C:\Users\Z70\Desktop\sas.sas&lt;/FullPath&gt;
 &lt;/DNA&gt;</DNA>
   `
   */
// 
function htmlDecode(input) {
    var e = $('<textarea>')[0];
    e.innerHTML = input;
    // handle case of empty input
    return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
};

// get a dict of attribute names in original case form like {"egversion":"EGversion"} (key is the normalized attribute name)
// it is called _crude as it included strings in submitted code like "a in the submitted code a=1;"
function getOriginalAttrNames_dict_crude(thexhmlstr) {
    let orignalAttrnames_dict = {}
    // get strings between ' ' and '='
    // the matchAll returns all instances match a regexpress pattern, note: must use /g to indicate for repeating search
    // the '...' in [... blabla] is to join the found instances into an array
    // e.g., find all matched instances and join them into the array matched_arr1
    // the regular express fails to identify strings betwen a white space and something
    // for example: <ProjectCollection EGVersion="8.1" Type="...">
    // the expected matched strs are EGVersion=, and Type=
    // however, the match returns ProjectCollection EGVersion="8.1" Type= (two attributes are messed up in a single match result)
    // let matched_arr1 = [...thexhmlstr.matchAll(/\<(.*)=/g)]
    // To avoid it, thexhmlstr is splitted into segments by ' '
    let thexhmlstr_segs = thexhmlstr.split(' ')
    // that way, the EGVersion="8.1" Type= are splitted into separate segments
    // next, split each segment by = (if there is a = in the str) and select the first element of the split (e.g., for 'EGVersion="8.1"', the first element of the split is 'EGVersion')

    thexhmlstr_segs.forEach(d => {
        if (d.includes('=')) {
            let theAttrName = d.split('=')[0]
            if (!Object.keys(orignalAttrnames_dict).includes(theAttrName.toLowerCase())) {
                orignalAttrnames_dict[theAttrName.toLowerCase()] = theAttrName
            }
        }
    }) // thexhmlstr_segs.forEach

    return orignalAttrnames_dict
} // function getOriginalTagNames(thexhmlstr)
;
// get a list of tagnames in original case form
// it is _crude as it contains tag like strings in submitted code (e.g., '<note!>' in submitted code '/*<note!> the dat set need to be sorted first!*/)
function getOriginalTagNames_dict_crude(thexhmlstr) {

    let orignalTagnames_dict = {}
    // get strings between '</' and '>', or between '<' and '/>'
    // the matchAll returns all instances match a regexpress pattern, note: must use /g to indicate for repeating search
    // the '...' in [... blabla] is to join the found instances into an array
    // e.g., find all matched instances and join them into the array matched_arr1
    let matched_arr1 = [...thexhmlstr.matchAll(/\<\/(.*)\>/g)]
    // console.log("line503", matched_arr1[0])
    let matched_arr2 = [...thexhmlstr.matchAll(/\<(.*) \/\>/g)]
    // console.log("matched_arr1", matched_arr1.length)
    // console.log("matched_arr2", matched_arr2)
    /** each element of the array is like the following, in which the second element is the text of the origianl tagname
        ['<Tag6 />','Tag6', ...]
    */
    // the following is to push such a second element into the final arr with distinct tagNames
    matched_arr1.forEach(d => {
        // console.log(d[1])
        let theTag = d[1]
        if (!Object.keys(orignalTagnames_dict).includes(theTag.toUpperCase())) {
            orignalTagnames_dict[theTag.toUpperCase()] = theTag
        }
    })
    matched_arr2.forEach(d => {
        let theTag = d[1]
        if (!Object.keys(orignalTagnames_dict).includes(theTag.toUpperCase())) {
            orignalTagnames_dict[theTag.toUpperCase()] = theTag
        }
    })
    return orignalTagnames_dict
}; // function getOriginalTagNames(thexhmlstr)
// get the tag and attribute names and save into an obj {tagnames[], attrnames[]}
function getTagAttrNames(doms) {
    let tagNames_arr = [], attrNames_arr = []
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

// as the function name says....
function append_cloned_components_of_the_first_dom_found_by_tagname(srcobj, targetobj, theTag) {
    let theClone = srcobj.find(theTag).clone()[0]
    // if theClone is null (no such tag is found), the function simply skip without stopping, and nothing will be appended to the targetobj.
    // however, I'll need to have a default component even if it cannot be found from the source obj
    // ...
    targetobj.append(theClone)
    // Note that nothing need to be returned, as the change will be made in v7 obj (remember that targetobj is just a nickname!)
}; //function append_cloned_components_of_the_first_dom_found_bytagname

// clean up the xmlstr
function cleanxmlstr(thexmlstr) {

    // to cleanup the nonprintable chars
    // let thexmlstr_remove_nonprintable = thexmlstr.replace(/[^\x20-\x7E\s\S]+/g, "")
    let thexmlstr_remove_nonprintable = thexmlstr

    // the xmlstr is messed up with strange chars like &amp;lt; &lt;, etc
    // 1. The following is to change &amp;lt to <, &gt to > ...
    let thesrcxmlstr_ampersand_code_normalized = normalize_ampersand_code(thexmlstr_remove_nonprintable)

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
}; //


// change &amp;lt to <,  &gt to > ...
function normalize_ampersand_code(thestr) {
    /* quite annoying! need to change escape &amp;lt to __sasdeeplyscrewedamplt__ 
        For unknown reason, SAS EG creates these escape chars in project.xml
        these chars may cause error during conversion (v8 to v7)  if not replaced.
        When the converted v7 xmlstr is ready, restore these escape chars. 
    */
    thestr = thestr.replace(/&amp;lt;/g, '__sasdeeplyscrewedamplt__')
    thestr = thestr.replace(/&amp;gt;/g, '__sasdeeplyscrewedampgt__')
    thestr = thestr.replace(/&lt;/g, '__sasdeeplyscrewedlt__')
    thestr = thestr.replace(/&gt;/g, '__sasdeeplyscrewedgt__')
    thestr = thestr.replace(/&amp;/g, '_')// cannot have &amp; or & in xml
    return thestr
}; //function normalize_ampersand_code

// jsdom does not handle the tag <Table>A</Table> well
// In that case, it alters the html to '<Table></Table>A' !
// The following is to rename the tag <Table> to <Table123> to work around
function rename_tag_named_table(thestr) {
    thestr = thestr.replace(/\<Table\>/g, '<Table123>')
    thestr = thestr.replace(/\<\/Table\>/g, '</Table123>')
    return thestr
}; // function rename_tag_named_table

// convert <Parameters /> to <Parameters></Parameters>
function convertSelfClosingHTML_to_OldSchoolHTML(str) {
    let matched_arr = str.match(/\<(.*) \/\>/)
    // console.log(matched_arr)
    if (matched_arr && matched_arr.length > 0) {
        let seg1 = matched_arr[1].split('<')
        // sometimes the lastmatchedstr is like GitSourceControl GUID="x2K5fW8CFtZy3Ke7"
        // in that case, the part after the first whitespace (GUID="x2K5fW8CFtZy3Ke7") should be excluded 
        let theLastMatchedStr = seg1[seg1.length - 1]
        // console.log(theLastMatchedStr)
        let theLastMatchedStr_tagName = theLastMatchedStr.split(' ')[0]
        // console.log(theLastMatchedStr_tagName)
        // replace <Others /> with <Others></<Others />
        let xhtmlstr = "<" + theLastMatchedStr + " />"
        let htmlstr = "<" + theLastMatchedStr + ">" + "</" + theLastMatchedStr_tagName + ">"
        str = str.replace(xhtmlstr, htmlstr)
        let matched_arr2 = str.match(/\<(.*) \/\>/)
        if (matched_arr && matched_arr.length > 0) {
            str = convertSelfClosingHTML_to_OldSchoolHTML(str)
        }
    }
    return str
}; // function convertSelfClosingHTML_to_OldSchoolHTML(str...

// remmove comments
function removecomments(thestr) {
    let result = ''
    // split str by '<!--'
    let segments = thestr.split('<!--')
    for (let i = 0; i < segments.length; i++) {
        if (segments[i].includes('-->')) {
            let theSeg = segments[i].split('-->')[1]
            result = result + theSeg
        } else {
            result = result + segments[i]
        }
    }
    return result
}; //function removecomments

function removecomments_regex(thestr) {
    // find anything between <!-- and -->
    let matched_arr = thestr.match(/\<!--(.*)--\>/)
    // console.log(matched_arr[0], thestr)
    if (matched_arr && matched_arr.length > 0) {
        thestr = thestr.replace(matched_arr[0], "")
        thestr = removecomments(thestr)
    }
    return thestr
}; // function convertSelfClosingHTML_to_OldSchoolHTML(str...
