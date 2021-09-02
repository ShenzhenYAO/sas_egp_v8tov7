/* To create a project xml from the prototype 
    The prototypes are saved at data/in/prototype/egpv7
    components of a typical v7 project.xml are saved as individual xml files (all of utf16le encoding)

    based on localbackend\app\23_create_xml_from_prototype_3.js
    adding the following:
    add shortcut to a file
1) in ProjectCollection.ExternalFileList, add a ExternalFile component, 
    with children nodes of .Element, and .ExternalFile,  
    in .ExternalFile.DNA, need to insert (again, as html) file location data
2) in ProjectCollection.Elements, add an Element component (Type="SAS.EG.ProjectElements.ShortCutToFile")
    with children nodes of .Element, .SHORTCUT (to indicate the ExternalFile ID defined in step 1), and .ShortCutToFile
3) in  ProjectCollection.External_Objects.ProjectTreeView, add a EGTreeNode under the parent PFD's EGTreeNode   
4) in ProjectCollection.External_Objects.ProcessFlowView.Graphics, add a TaskGraphic (TaskGraphic.Element refers to the ShortCutToFile ID defined in step 2)

to do:
    add notes
    read from an existing egp v8 and rebuild into a v7 egp with tasks, links, and shortcut to files
*/

// load custom modules
const mymodules = require('../../localbackend/app/mytools/mymodules');

// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

// https://www.npmjs.com/package/adm-zip
const AdmZip = require('adm-zip');
const { config } = require('process');
const { Console } = require('console');

(async () => {

    // 0.save the zip as an egp file (must be defined before adding task components. When adding tasks, the SAS code need to be added into the zip)
    const newZip = new AdmZip()

    // 1. make a project collection scala
    let config_project = await config_projectcollection()

    // 2. prepare the doms_obj and the cleaned source xml string from the prototype
    let { doms_obj, thesrcxmlstr_cleaned } = await f01_makeBasicProjectScala(config_project)
    // console.log(thesrcxmlstr_cleaned)

    // 3. add process flow (PFD)
    let pdf_arr = [{ 'Label': 'PFD1' }, { 'Label': 'PFD2' }], pfd_input = [], config_pfd = []
    for (let i = 0; i < pdf_arr.length; i++) {
        // config the pfd element
        pfd_input[i] = {}
        pfd_input[i].Label = pdf_arr[i].Label
        // console.log('line38', pfd_input[i].Label)
        config_pfd[i] = await config_pfd_function(config_project, pfd_input[i])
        // console.log('line40', config_pfd[i])
        doms_obj = await make_append_pfd_component(doms_obj, config_pfd[i])
    } // for(let i=0;i<pdf_arr.length;i++)

    // 4. add EGTreeNode for wrapping all programs/tasks for ProjectTreeView.
    let config_programs = []
    for (let i = 0; i < pdf_arr.length; i++) {
        // The EGTreeNode is to be added to ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode(of a specific PFD)
        // 4a. Configuration of the EGTreeNode    
        config_programs[i] = await config_programs_function(config_pfd[i])
        // 4b. make and append the EGTreeNode that is to be appended to ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode(of a specific PFD)
        doms_obj = await make_append_egtreenode_programs(doms_obj, config_programs[i], config_pfd[i])
    } // for(let i=0;i<pdf_arr.length;i++)

    // 5. add tasks and shortcut to external sas files
    let task_input_arr = [
        {
            Element: { Label: 'PFD1_p1' }, config_pfd: config_pfd[0],
            code: `/*PFD1 p1*/
data a; b=1; run;`
        },
        {
            Element: { Label: 'PFD1_p2' }, config_pfd: config_pfd[0],
            code: `/*PFD1 p2*/
data c; set a; d=2; run;`
        },
        {
            tasktype: 'shortcut',
            Element: { Label: 'shortcut to sas.sas' },
            config_pfd: config_pfd[1],
            Embedded: 'False',
            DNA: { FullPath: String.raw`C:\Users\Z70\Desktop\sas.sas` } // note: not a good practice to use single backlash, at least it should be wrapped by String.raw``
        },
    ]
    let config_task = []
    for (let i = 0; i < task_input_arr.length; i++) {
        // 5.1 configuration for the task_component (indicate the parent PFD, and the task in task_input_arr)
        config_task[i] = await config_task_function(task_input_arr[i].config_pfd, task_input_arr[i])
        // console.log('line44', config_task)
        // 5.2 add task components
        doms_obj = await make_append_task_component(doms_obj, config_task[i], newZip)
    } // for(let i=0;i<task_input_arr.length;i++)

    // 6. add links
    let link_input_arr = [
        { Label: 'p1 to p2', LinkFrom: config_task[0], LinkTo: config_task[1] }
    ]
    for (let i = 0; i < link_input_arr.length; i++) {
        // 6.1 configuration for link_component
        let config_link = await config_link_function(link_input_arr[i])
        // console.log('line90', config_link)        

        // 6.2 make and append link_component
        doms_obj = await make_append_link_component(doms_obj, config_link)

    } // for(let i=0;i<link_input_arr.length;i++)

    // 7. add shortcuts to external files
    /* 
    1) in ProjectCollection.ExternalFileList, add a ExternalFile component, 
    with children nodes of .Element, and .ExternalFile,  
    in .ExternalFile.DNA, need to insert (again, as html) file location data
    2) in ProjectCollection.Elements, add an Element component (Type="SAS.EG.ProjectElements.ShortCutToFile")
        with children nodes of .Element, .SHORTCUT (to indicate the ExternalFile ID defined in step 1), and .ShortCutToFile
    3) in  ProjectCollection.External_Objects.ProjectTreeView, add a EGTreeNode under the parent PFD's EGTreeNode   
    4) in ProjectCollection.External_Objects.ProcessFlowView.Graphics, add a TaskGraphic (TaskGraphic.Element refers to the ShortCutToFile ID defined in step 2)
    */
    // 7.1 shortcuttofile_input
    let shortcuttofile_input_arr = [
        {
            config_pfd: config_pfd[1],
            Element: { Label: 'shortcut to thexls.xlsx' },
            DNA: { FullPath: String.raw`C:\Users\Z70\Desktop\thexls.xlsx` }
        }
    ] // shortcuttofile_input_arr

    let config_shortcuttofile = []
    for (let i = 0; i < shortcuttofile_input_arr.length; i++) {
        // 6.1 configuration for shortcuttofile_component
        config_shortcuttofile[i] = await config_shortcuttofile_function(shortcuttofile_input_arr[i])
        // console.log('line133', config_shortcuttofile)

        // 6.2 make and append shortcuttofile_component
        doms_obj = await make_append_shortcuttofile_component(doms_obj, config_shortcuttofile[i])
        // make and append shortcuttofile_component
        async function make_append_shortcuttofile_component(doms_obj, config_shortcuttofile) {
            // 1. make and append the externalfile components (in ProjectCollection.ExternalFileList, add a ExternalFile component, with children nodes of .Element, and .ExternalFile, )
            doms_obj = make_append_shortcuttofile_externalfile_component(doms_obj, config_shortcuttofile)
            // make and append the externalfile components
            async function make_append_shortcuttofile_externalfile_component(doms_obj, config_shortcuttofile) {
                // 1. make shortcuttofile_externalfile_component
                let shortcuttofile_externalfile_component = await make_shortcuttofile_externalfile_component(doms_obj, config_shortcuttofile)
                //make shortcuttofile_externalfile_component
                async function make_shortcuttofile_externalfile_component() {
                    // load the prototype xml for the target component
                    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___h01_shortcuttofile_externalfile_v7.xml'
                    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
                    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
                    // console.log('line104', thesrcxmlstr)

                    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
                    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
                    let component_dom_obj = $(thesrcxmlstr_cleaned)

                    // config the ProjectCollection.ExternalFileList.ExternalFile(of this externalfile).Element
                    let externalfile_element_dom_obj = $(component_dom_obj.find('Element')[0])
                    // console.log('line160', externalfile_element_dom_obj.prop('outerHTML') )
                    // console.log('line161', config_shortcuttofile.ExternalFile ); return
                    if (config_shortcuttofile.ExternalFile.Element.Label) { $(externalfile_element_dom_obj.find('Label')[0]).text(config_shortcuttofile.ExternalFile.Element.Label) }
                    if (config_shortcuttofile.ExternalFile.Element.Container) { $(externalfile_element_dom_obj.find('Container')[0]).text(config_shortcuttofile.ExternalFile.Element.Container) }
                    if (config_shortcuttofile.ExternalFile.Element.ID) { $(externalfile_element_dom_obj.find('ID')[0]).text(config_shortcuttofile.ExternalFile.Element.ID) }
                    if (config_shortcuttofile.ExternalFile.Element.CreatedOn) { $(externalfile_element_dom_obj.find('CreatedOn')[0]).text(config_shortcuttofile.ExternalFile.Element.CreatedOn) }
                    if (config_shortcuttofile.ExternalFile.Element.ModifiedOn) { $(externalfile_element_dom_obj.find('ModifiedOn')[0]).text(config_shortcuttofile.ExternalFile.Element.ModifiedOn) }
                    if (config_shortcuttofile.ExternalFile.Element.ModifiedBy) { $(externalfile_element_dom_obj.find('ModifiedBy')[0]).text(config_shortcuttofile.ExternalFile.Element.ModifiedBy) }
                    if (config_shortcuttofile.ExternalFile.Element.ModifiedByEGID) { $(externalfile_element_dom_obj.find('ModifiedByEGID')[0]).text(config_shortcuttofile.ExternalFile.Element.ModifiedByEGID) }
                    if (config_shortcuttofile.ExternalFile.Element.InputIDs) { $(externalfile_element_dom_obj.find('InputIDs')[0]).text(config_shortcuttofile.ExternalFile.Element.InputIDs) }
                    // could config more... 

                    // config the ProjectCollection.Elements.Element(of the link).ExternalFile.ExternalFile
                    let externalfile_externalfile_dom_obj = $(component_dom_obj.find('ExternalFile')[0])
                    if (config_shortcuttofile.ExternalFile.ExternalFile.ShortCutList.ShortCutID) { $(externalfile_externalfile_dom_obj.find('ShortCutList').find('ShortCutID')[0]).text(config_shortcuttofile.ExternalFile.ExternalFile.ShortCutList.ShortCutID) }
                    if (config_shortcuttofile.ExternalFile.ExternalFile.FileTypeType) { $(externalfile_externalfile_dom_obj.find('FileTypeType')[0]).text(config_shortcuttofile.ExternalFile.ExternalFile.FileTypeType) }
                    // ProjectCollection.Elements.Element(of the link).ExternalFile.ExternalFile.DNA
                    let shortcuttofile_externalfile_externalfile_dna_dna_doms_obj = await make_dna(config_shortcuttofile.ExternalFile.ExternalFile.DNA)
                    
                    // 2. Note: unlike other components, the DNA part should be inserted as HTML (not textcontent) to ProjectCollection.Elements.Element(of the task).CodeTask.DNA
                    // Make DNA HTML
                    let dna_outerHTMLstr = make_dna_html(shortcuttofile_externalfile_externalfile_dna_dna_doms_obj)

                    // 3. insert dna_outerHTMLstr as html to ProjectCollection.ExternalFileList.ExternalFile(of this externalfile).DNA
                    // Note: the differece between html() and text() is that for html, '&lt;' is kept as it was; while
                    // for text(), '&lt;' is converted to '&amp;lt;', which cannot be recognized correctly by SAS EG
                    $(component_dom_obj.find('ExternalFile').find('DNA')[0]).html(dna_outerHTMLstr)

                    // could config more...                   

                    // console.log('line129', component_dom_obj.prop('outerHTML'))
                    return component_dom_obj
                };//async function make_shortcuttofile_externalfile_component

                // 2. append the component to ProjectCollection.ExternalFileList
                $(doms_obj.find('ExternalFileList')[0]).append(shortcuttofile_externalfile_component)

                return doms_obj
            };//async function make_append_shortcuttofile_externalfile_component

            // 2. make and append the element components
            // make and append the element components
            async function make_append_shortcuttofile_element_component(doms_obj, config_shortcuttofile) { };//async function make_append_shortcuttofile_element_component

            // 1. make and append the egtreenode components
            // make and append the egtreenode components
            async function make_append_shortcuttofile_egtreenode_component(doms_obj, config_shortcuttofile) { };//async function make_append_shortcuttofile_egtreenode_component

            // 1. make and append the taskgraphic components
            // make and append the taskgraphic components
            async function make_append_shortcuttofile_taskgraphic_component(doms_obj, config_shortcuttofile) { };//async function make_append_shortcuttofile_taskgraphic_component

            return doms_obj

        }; //async function make_append_shortcuttofile_component(doms_obj, config_shortcuttofile)
    } // for(let i=0;i<shortcuttofile_input_arr.length;i++)


    // 8. add notes
    let targetxmlstr_cleaned = await cleanup_targetxml(doms_obj, thesrcxmlstr_cleaned)
    // remove lines only containing spaces and line breakers
    let targetxmlstr = remove_spaces_linebreakers(targetxmlstr_cleaned)
    // console.log(targetxmlstr)
    targetxmlstr = '<?xml version="1.0" encoding="utf-16"?>\n' + targetxmlstr
    let thetargetxmlfile = 'data/out/test/' + config_project.Element.Label + '.xml'
    await mymodules.saveLocalTxtFile(targetxmlstr, thetargetxmlfile, 'utf16le');

    // using Buffer to import the xml with utf16 encoding
    newZip.addFile('project.xml', Buffer.from(targetxmlstr, "utf16le"))
    // writeZip the newZip instead of the original (theZip)
    await newZip.writeZip("data/out/test/" + config_project.Element.Label + ".egp")

})()

// configuration for shortcut to external file
async function config_shortcuttofile_function(shorcuttofile_input) {
    let config_shorcuttofile = {}

    //1. config for ProjectCollection.ExternalFileList.ExternalFile
    config_shorcuttofile.ExternalFile = {}
    // 1a. config for ExternalFile.Element
    config_shorcuttofile.ExternalFile.Element = {}
    config_shorcuttofile.ExternalFile.Element.Label = shorcuttofile_input.Element.Label
    config_shorcuttofile.ExternalFile.Element.ID = 'ExternalFile-' + make_rand_string_by_length(16)
    config_shorcuttofile.ExternalFile.Element.CreatedOn = shorcuttofile_input.config_pfd.Element.CreatedOn
    config_shorcuttofile.ExternalFile.ModifiedOn = shorcuttofile_input.config_pfd.Element.ModifiedOn
    config_shorcuttofile.ExternalFile.Element.ModifiedBy = shorcuttofile_input.config_pfd.Element.ModifiedBy
    config_shorcuttofile.ExternalFile.Element.ModifiedByEGID = shorcuttofile_input.config_pfd.Element.ModifiedByEGID
    // 1b. config for ExternalFile.ExternalFile
    config_shorcuttofile.ExternalFile.ExternalFile = {}
    config_shorcuttofile.ExternalFile.ExternalFile.ShortCutList = {}
    config_shorcuttofile.ExternalFile.ExternalFile.ShortCutList.ShortCutID = 'ShortCutToFile-' + make_rand_string_by_length(16)
    config_shorcuttofile.ExternalFile.ExternalFile.FileTypeType = 'Excel' // the tag name has two Type which is obviously an mistake when developping the xml structure

    // 1b1. config for DNA
    let fullpath = shorcuttofile_input.DNA.FullPath
    fullpath = JSON.stringify(fullpath) // to ensure that the single backlash are replaced by \\
    // the stringify adds additional quotes around the path, the string is now like '"C:\\..."'
    // the following is to strip these additional quotes
    if (fullpath.substr(0, 1) === '"') { fullpath = fullpath.substring(1) }
    if (fullpath.substr(fullpath.length - 1, 1) === '"') { fullpath = fullpath.substr(0, fullpath.length - 1) }
    // console.log('line159', fullpath)
    let startpos = fullpath.lastIndexOf('\\')
    let filename = fullpath.substr(startpos + 1)
    config_shorcuttofile.ExternalFile.DNA = {}
    config_shorcuttofile.ExternalFile.ExternalFile.DNA = {}
    config_shorcuttofile.ExternalFile.ExternalFile.DNA.DNA = {}
    config_shorcuttofile.ExternalFile.ExternalFile.DNA.DNA.Name = filename
    config_shorcuttofile.ExternalFile.ExternalFile.DNA.DNA.FullPath = fullpath

    // 2. config for ProjectCollection.Elements.Element(for the shortcuttofile component, not for the ExternalFile component)
    config_shorcuttofile.ShortCutToFile = {}
    config_shorcuttofile.ShortCutToFile.Element = {}
    // 2a. config for ProjectCollection.Elements.Element(for this shortcuttofileToFile).Element
    config_shorcuttofile.ShortCutToFile.Element.Label = shorcuttofile_input.Element.Label
    config_shorcuttofile.ShortCutToFile.Element.ID = config_shorcuttofile.ExternalFile.ExternalFile.ShortCutList.ShortCutID // already created in step 1
    config_shorcuttofile.ShortCutToFile.Element.CreatedOn = shorcuttofile_input.config_pfd.Element.CreatedOn
    config_shorcuttofile.ShortCutToFile.Element.ModifiedOn = shorcuttofile_input.config_pfd.Element.ModifiedOn
    config_shorcuttofile.ShortCutToFile.Element.ModifiedBy = shorcuttofile_input.config_pfd.Element.ModifiedBy
    config_shorcuttofile.ShortCutToFile.Element.ModifiedByEGID = shorcuttofile_input.config_pfd.Element.ModifiedByEGID
    // 2b. config the parent ExternalFile ID for ProjectCollection.Elements.Element(for this shortcuttofileToFile).SHORTCUT
    config_shorcuttofile.ShortCutToFile.SHORTCUT = {}
    config_shorcuttofile.ShortCutToFile.SHORTCUT.Parent = config_shorcuttofile.ExternalFile.Element.ID

    // 3. config for ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode(of the parent PFD).EGTreeNode
    config_shorcuttofile.EGTreeNode = {}
    config_shorcuttofile.EGTreeNode.NodeType = 'NODETYPE_ELEMENT'
    config_shorcuttofile.EGTreeNode.ElementID = config_shorcuttofile.ShortCutToFile.Element.ID
    config_shorcuttofile.EGTreeNode.Expanded = 'True'
    config_shorcuttofile.EGTreeNode.Label = config_shorcuttofile.ShortCutToFile.Element.Label

    // 4. config for ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic
    config_shorcuttofile.TaskGraphic = {}
    config_shorcuttofile.TaskGraphic.ID = mymodules.generateUUID()
    config_shorcuttofile.TaskGraphic.Label = config_shorcuttofile.ShortCutToFile.Element.Label
    config_shorcuttofile.TaskGraphic.Element = config_shorcuttofile.ShortCutToFile.Element.ID

    return config_shorcuttofile
};// async function config_shortcuttofile_function(config_shorcuttofile)

// make and append <Element Type="SAS.EG.ProjectElements.Link"> to ProjectCollection.Elements
async function make_append_link_component(doms_obj, config_link) {
    // 1. make the link component
    let link_element_doms_obj = await make_link_component(config_link)
    // console.log('line98', link_element_doms_obj.prop('outerHTML'))            

    // 2. append the link component to ProjectCollection.Elements
    $(doms_obj.find('Elements')[0]).append(link_element_doms_obj)

    return doms_obj
}; //async function make_append_link_component

// make link component
async function make_link_component(config_link) {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___f01_link_element_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line104', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
    let component_dom_obj = $(thesrcxmlstr_cleaned)

    // config the ProjectCollection.Elements.Element(of the link).Element
    let link_element_dom_obj = $(component_dom_obj.find('Element')[0])
    if (config_link.Element.Label) { $(link_element_dom_obj.find('Label')[0]).text(config_link.Element.Label) }
    if (config_link.Element.Container) { $(link_element_dom_obj.find('Container')[0]).text(config_link.Element.Container) }
    if (config_link.Element.ID) { $(link_element_dom_obj.find('ID')[0]).text(config_link.Element.ID) }
    if (config_link.Element.CreatedOn) { $(link_element_dom_obj.find('CreatedOn')[0]).text(config_link.Element.CreatedOn) }
    if (config_link.Element.ModifiedOn) { $(link_element_dom_obj.find('ModifiedOn')[0]).text(config_link.Element.ModifiedOn) }
    if (config_link.Element.ModifiedBy) { $(link_element_dom_obj.find('ModifiedBy')[0]).text(config_link.Element.ModifiedBy) }
    if (config_link.Element.ModifiedByEGID) { $(link_element_dom_obj.find('ModifiedByEGID')[0]).text(config_link.Element.ModifiedByEGID) }
    if (config_link.Element.InputIDs) { $(link_element_dom_obj.find('InputIDs')[0]).text(config_link.Element.InputIDs) }
    // could config more... 

    // // config the ProjectCollection.Elements.Element(of the link).Log
    let link_log_dom_obj = $(component_dom_obj.find('Log')[0])
    if (config_link.Log.Parent) { $(link_log_dom_obj.find('Parent')[0]).text(config_link.Log.Parent) }
    if (config_link.Log.LinkFrom) { $(link_log_dom_obj.find('LinkFrom')[0]).text(config_link.Log.LinkFrom) }
    if (config_link.Log.LinkTo) { $(link_log_dom_obj.find('LinkTo')[0]).text(config_link.Log.LinkTo) }

    // console.log('line129', component_dom_obj.prop('outerHTML'))
    return component_dom_obj

}; //async function make_link_component

// configuration of link
async function config_link_function(link_input) {
    // console.log('line91', link_input.LinkFrom)

    let config_link = {}

    //1a. configuration for the element properties for the  link's Element component (the properties of the link)
    config_link.Element = {}
    config_link.Element.Label = link_input.Label//'p1 to p2'
    config_link.Element.Type = 'LINK'
    config_link.Element.Container = link_input.LinkFrom.Element.Container
    config_link.Element.ID = 'Link-' + make_rand_string_by_length(16)
    config_link.Element.CreatedOn = link_input.LinkFrom.Element.CreatedOn
    config_link.Element.ModifiedOn = link_input.LinkFrom.Element.ModifiedOn
    config_link.Element.ModifiedBy = link_input.LinkFrom.Element.ModifiedBy
    config_link.Element.ModifiedByEGID = link_input.LinkFrom.Element.ModifiedByEGID
    config_link.Element.InputIDs = link_input.LinkFrom.Element.ID

    //1b. configuration for the Log components of ProjectCollection.Elements.Element(PFD).Element(element of the curreant link)
    config_link.Log = {}
    config_link.Log.Parent = link_input.LinkFrom.Element.ID
    config_link.Log.LinkFrom = link_input.LinkFrom.Element.ID
    config_link.Log.LinkTo = link_input.LinkTo.Element.ID

    return config_link
}; //async function config_link_function(link_input)

// make and append task related components
async function make_append_task_component(doms_obj, config_task, newZip) {
    // 1. within a PFD component's PFD tag (ProjectCollection.Elements.Element(PFD).PFD), add a process component with the taskID
    doms_obj = await make_append_task_process_component(doms_obj, config_task)

    // 2. within ProjectCollection.Elements, add a element tag for task (in which multiple tags are encompassed)
    doms_obj = await make_append_task_element_component(doms_obj, config_task)

    // 3. within ProjectColletion.External_Objects.ProjectTreeView.EGTreeNode(for PFD1).EGTreeNode(for wrapping all programs/tasks), add a EGTreeNode component
    doms_obj = await make_append_task_egtreenode_component(doms_obj, config_task)

    // 4. within ProjectColletion.External_Objects.ProcessFlowView.Graphics, add a TaskGraphic component
    doms_obj = await make_append_task_taskgraphic_component(doms_obj, config_task)

    // 5. add the program text and insert into the egp zip (only do it when the config_task.code is not null, e.g., the task is not a shortcut to an exteranl sas program)
    if (config_task.code && config_task.code !== '') {
        let task_sascodestr = config_task.code
        // Note: the sas code file (code.sas) is of utf-8 encoding. Also, the task xml (EGTask-<...id...>.xml) is also of utf-8. These are different from the project.xml (project.xml is of utf16le encoding)
        newZip.addFile(config_task.Element.ID + '\\code.sas', Buffer.from(task_sascodestr, "utf-8"))
    } // config_task.code
    return doms_obj

};//async function make_append_task_element_component

// within ProjectCollection.Elements, add a element tag for task (in which multiple tags are encompassed)
async function make_append_task_element_component(doms_obj, config_task) {
    // 1. make the Element component and append to ProjectCollection.Elements (Type = "SAS.EG.ProjectElements.CodeTask")
    let task_element_dom_obj = await make_task_element_component(config_task)

    // 2. append task_element_component
    $(doms_obj.find('Elements')[0]).append(task_element_dom_obj)

    return doms_obj
}; // async function make_append_task_element_component

// make task_dna (to indicate the location of the shortcut to an external SAS program )
async function make_dna(config) {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___z03_dna_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line104', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
    let component_dom_obj = $(thesrcxmlstr_cleaned)

    // configuration of the DNA component
    if (config.DNA) {
        if (config.DNA.Name) { $(component_dom_obj.find('Name')[0]).text(config.DNA.Name) }
        if (config.DNA.FullPath) { $(component_dom_obj.find('FullPath')[0]).text(config.DNA.FullPath) }
    } //if (config_task.CodeTask.DNA.DNA

    // console.log('line276', component_dom_obj.prop('outerHTML'))
    return component_dom_obj
}; // async function make_dna



// make the Element component and append to ProjectCollection.Elements (Type = "SAS.EG.ProjectElements.CodeTask")
async function make_task_element_component(config_task) {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___e03_task_element_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line61', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
    let component_dom_obj = $(thesrcxmlstr_cleaned)

    // config the ProjectCollection.Elements.Element(of the task).Element
    let task_element_dom_obj = $(component_dom_obj.find('Element')[0])
    if (config_task.Element.Label) { $(task_element_dom_obj.find('Label')[0]).text(config_task.Element.Label) }
    if (config_task.Element.Container) { $(task_element_dom_obj.find('Container')[0]).text(config_task.Element.Container) }
    if (config_task.Element.ID) { $(task_element_dom_obj.find('ID')[0]).text(config_task.Element.ID) }
    if (config_task.Element.CreatedOn) { $(task_element_dom_obj.find('CreatedOn')[0]).text(config_task.Element.CreatedOn) }
    if (config_task.Element.ModifiedOn) { $(task_element_dom_obj.find('ModifiedOn')[0]).text(config_task.Element.ModifiedOn) }
    if (config_task.Element.ModifiedBy) { $(task_element_dom_obj.find('ModifiedBy')[0]).text(config_task.Element.ModifiedBy) }
    if (config_task.Element.ModifiedByEGID) { $(task_element_dom_obj.find('ModifiedByEGID')[0]).text(config_task.Element.ModifiedByEGID) }
    // could config more... 

    // // config the ProjectCollection.Elements.Element(of the task).SubmitableElement
    // let task_submitableelement_dom_obj = $(component_dom_obj.find('SubmitableElement')[0])
    // // could cofig more, e.g., HtmlStyleUrlOverride, SasReportStyleUrlOverride (location of the SAS Home)

    // // config the ProjectCollection.Elements.Element(of the task).CodeTask
    // if the task type is shortcut, make DNA components, and insert as textcontent to ProjectCollection.Elements.Element(of the task).CodeTask.DNA
    // console.log('line253', config_task.tasktype)
    if (config_task.tasktype && config_task.tasktype === 'shortcut') {
        // console.log('line255',config_task.CodeTask.DNA.DNA)
        // 1. make task_dna component
        let task_element_codetask_dna_dna_doms_obj = await make_dna(config_task.CodeTask.DNA)

        // 2. Note: unlike other components, the DNA part should be inserted as HTML (not textcontent) to ProjectCollection.Elements.Element(of the task).CodeTask.DNA
        // Make DNA HTML
        let dna_outerHTMLstr = make_dna_html(task_element_codetask_dna_dna_doms_obj)

        // 3. insert dna_outerHTMLstr as html to ProjectCollection.Elements.Element(of the task).CodeTask.DNA
        // Note: the differece between html() and text() is that for html, '&lt;' is kept as it was; while
        // for text(), '&lt;' is converted to '&amp;lt;', which cannot be recognized correctly by SAS EG
        $(component_dom_obj.find('CodeTask').find('DNA')[0]).html(dna_outerHTMLstr)

        // 4. also, change ProjectCollection.Elements.Element(of the task).CodeTask.Embedded's text to 'False'
        // that tiny change controls whether the task is a shortcut or with sas code Embedded within the egp file
        $(component_dom_obj.find('CodeTask').find('Embedded')[0]).text(config_task.CodeTask.Embedded)

    } // if (config_task.type && config_task.type === 'shortcut')

    return component_dom_obj

};//async function make_task_element_component

// make DNA HTML
//Note: unlike other components, the DNA part should be inserted as HTML (not textcontent) to ProjectCollection.Elements.Element(of the task).CodeTask.DNA
function make_dna_html(dna_dom_obj) {
    // Not appended as DOM objects. Ha! for this confusion, we should award a medal to the genius who made it that way! 
    // 2.1 get the outerHTML of task_element_codetask_dna_dna_doms_obj
    let dna_outerHTMLstr = dna_dom_obj.prop('outerHTML')
    // console.log('line307',dns_outerHTML)
    // 2.2 lots of work around here
    // 2.2.1, use back the original tag names (e.g., use back DNA instead of dna)
    let dna_tags_dict = { 'dna': 'DNA', 'type': 'Type', 'name': 'Name', 'version': 'Version', 'assembly': 'Assembly', 'factory': 'Factory', 'fullpath': 'FullPath' }
    Object.keys(dna_tags_dict).forEach(key => {
        let originaltag = dna_tags_dict[key]
        dna_outerHTMLstr = dna_outerHTMLstr.replace('<' + key + '>', '&lt;' + originaltag + '&gt;')
        dna_outerHTMLstr = dna_outerHTMLstr.replace('</' + key + '>', '&lt;/' + originaltag + '&gt;')
        dna_outerHTMLstr = dna_outerHTMLstr.replace('<' + key + ' />', '&lt;' + originaltag + ' /&gt;')
    })
    // console.log('line316', dna_outerHTMLstr)
    return dna_outerHTMLstr
}; // function make_dna_html

// to generate a random string of 16 chars (note, it is not a GUID!)
//https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function make_rand_string_by_length(strlength) {
    let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return Array(strlength).join().split(',').map(function () { return chars.charAt(Math.floor(Math.random() * chars.length)); }).join('');
}; //function make_rand_string_by_length(strlength)

//within ProjectColletion.External_Objects.ProcessFlowView.Graphics, add a TaskGraphic component
async function make_append_task_taskgraphic_component(doms_obj, config_task) {
    // 1a. make task_taskgraphic
    let task_taskgraphic_dom_obj = await make_task_taskgraphic_component(config_task)
    // console.log('line68', task_taskgraphic_dom_obj.prop('outerHTML'))

    // 1b. append task_taskgraphic components
    // The ProjectColletion.External_Objects.ProcessFlowView.Graphics is not specific by PFD
    // As such, there is no need to loop and find the specific PFD for the task_taskgraphic
    let the_graphic_dom_obj = $(doms_obj.find('External_Objects').find('ProcessFlowView').find('Graphics')[0])
    the_graphic_dom_obj.append(task_taskgraphic_dom_obj)

    return doms_obj
}; // async function make_append_task_taskgraphic_component 

//make task_taskgraphic
async function make_task_taskgraphic_component(config_task) {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___z04_taskgraphic_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line57', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
    let component_dom_obj = $(thesrcxmlstr_cleaned)

    if (config_task.TaskGraphic.ID) { $(component_dom_obj.find('ID')[0]).text(config_task.TaskGraphic.ID) }
    if (config_task.TaskGraphic.Label) { $(component_dom_obj.find('Label')[0]).text(config_task.TaskGraphic.Label) }
    if (config_task.TaskGraphic.Element) { $(component_dom_obj.find('Element')[0]).text(config_task.TaskGraphic.Element) }
    // could config more... 

    return component_dom_obj

};//async function make_task_process_component

// within ProjectColletion.External_Objects.ProjectTreeView.EGTreeNode(for PFD1).EGTreeNode(for wrapping all programs/tasks), add a EGTreeNode component
async function make_append_task_egtreenode_component(doms_obj, config_task) {
    // 1a. make task_egtreenode_component
    let task_egtreenode_dom_obj = await make_egtreenode(config_task.EGTreeNode)
    // console.log('line69', task_egtreenode_dom_obj.prop('outerHTML'))
    // 1b. append task_egtreenode_component
    // find all PFD EGTreeNode under Elements ProjectColletion.External_Objects.ProjectTreeView
    let egtreenode_pfd_doms_obj = $(doms_obj.find('External_Objects').find('ProjectTreeView').find('EGTreeNode'))
    // loop for each of such EGTreeNode elements, and identify the one with the same PFD ID as in config_task.Element.Container
    let break_i_loop = 0
    for (let i = 0; i < egtreenode_pfd_doms_obj.length; i++) {
        let the_egtreenode_pfd_dom_obj = $(egtreenode_pfd_doms_obj[i])
        // get the textcontent of .ElementID tag of the_egtreenode_pfd_dom_obj
        let the_egtreenode_pfd_elementid_dom_obj = $(the_egtreenode_pfd_dom_obj.find('ElementID')[0])
        let the_pfd_id = the_egtreenode_pfd_elementid_dom_obj.text()
        // compare the_pfd_id with the pfd id in config_task.Element.Container (config_task.Element.Container)
        if (the_pfd_id && the_pfd_id === config_task.Element.Container) {
            // identify the EGTreeNode for programs under the identified PFD EGTreeNode
            let egtreenode_program_egtreenode_pfd_doms_obj = $(the_egtreenode_pfd_dom_obj.find('EGTreeNode'))
            // console.log('line84', egtreenode_program_egtreenode_pfd_doms_obj.prop('outerHTML'))
            // loop for each of such EGTreeNode elements, and identify the program EGTreeNode, i.e. the one with NoteType.text() = 'NODETYPE_PROGRAMFOLDER' and Label.text()='Programs'
            for (let j = 0; j < egtreenode_program_egtreenode_pfd_doms_obj.length; j++) {
                let the_egtreenode_program_dom_obj = $(egtreenode_program_egtreenode_pfd_doms_obj[j])
                // console.log('line88', the_egtreenode_program_dom_obj)
                let nodetype_the_egtreenode_dom_obj = $(the_egtreenode_program_dom_obj.find('NodeType')[0])
                let nodetypetext_the_egtreenode_dom_obj = nodetype_the_egtreenode_dom_obj.text()
                let label_the_egtreenode_dom_obj = $(the_egtreenode_program_dom_obj.find('Label')[0])
                let labeltext_the_egtreenode_dom_obj = label_the_egtreenode_dom_obj.text()
                if (nodetypetext_the_egtreenode_dom_obj === 'NODETYPE_PROGRAMFOLDER' && labeltext_the_egtreenode_dom_obj === 'Programs') {
                    // append the task_egtreenode_dom_obj to the current the_egtreenode_dom_obj
                    the_egtreenode_program_dom_obj.append(task_egtreenode_dom_obj)
                    break_i_loop = 1
                    break
                } //if (nodetypetext_the_egtreenode_dom_obj === '' && labeltext_the_egtreenode_dom_obj === '')
            }//  for (let j = 0; j < the_egtreenode_program_egtreenode_pfd_doms_obj.length; j++)
            if (break_i_loop === 1) { break }
        } // if (the_pfd_id && the_pfd_id === config_pfd.Element.ID )
    } // for (let i=0; i < egtreenode_pfd_doms_obj.length; i++)
    return doms_obj
}; // async function make_append_task_egtreenode_component  

//within a PFD component's PFD tag (ProjectCollection.Elements.Element(PFD).PFD), add a process component with the taskID
async function make_append_task_process_component(doms_obj, config_task) {
    // console.log('line150', doms_obj)
    // 1a. make task_process            
    let task_process_doms_obj = await make_task_process_component(config_task)
    // console.log('line54', task_process_doms_obj.prop('outerHTML'))

    // 1b. append task_process to the corresponding PFD
    // find all PFD Elements under Elements
    let element_pfd_doms_obj = $(doms_obj.find('Elements').find('Element'))
    // loop for each of such Element elements, and identify the one with the same PFD ID as in config_task.Element.Container
    for (let i = 0; i < element_pfd_doms_obj.length; i++) {
        let the_element_pfd_dom_obj = $(element_pfd_doms_obj[i])
        // get the textcontent of .ElementID tag of the_egtreenode_pfd_dom_obj
        let the_element_pfd_element_id_dom_obj = $(the_element_pfd_dom_obj.find('Element').find('ID')[0])
        let the_pfd_id = the_element_pfd_element_id_dom_obj.text()
        // compare the_pfd_id with the pfd id in config_task.Element.Container (config_task.Element.Container)
        if (the_pfd_id && the_pfd_id === config_task.Element.Container) {
            // append the task_process_doms_obj to the specified PFD's PFD tag
            $(the_element_pfd_dom_obj.find('PFD')[0]).append(task_process_doms_obj)
            break
        } // if (the_pfd_id && the_pfd_id === config_pfd.Element.ID )
    } // for (let i=0; i < egtreenode_pfd_doms_obj.length; i++)
    // console.log('line171', doms_obj)
    return doms_obj
}; // async function make_append_task_process_component 

// make process components for a task
async function make_task_process_component(config_task) {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___e01_task_process_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line57', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
    let component_dom_obj = $(thesrcxmlstr_cleaned)

    if (config_task.Process.Element.ID) { $(component_dom_obj.find('Element').find('ID')[0]).text(config_task.Process.Element.ID) }
    // could config more... 

    return component_dom_obj
};//async function make_task_process_component 

// remove lines only containing spaces and line breakers
function remove_spaces_linebreakers(text) {
    let result = ''
    // read the str into lines
    let lines = text.split('\n')
    // for each line, replace the white spaces with nothing and then concat
    lines.forEach(d => {
        let theline_removing_whitespaces = d.replace(/\s/g, '')
        // console.log(theline_removing_whitespaces)
        if (theline_removing_whitespaces.length > 0) {
            // it is tricky here, for lines not only with white spaces, use the original string in d. That way, a string like 'PFD1 p1' won't be converted to 'PFD1p1'
            result = result + d + '\n'
        } // if (theline_removing_whitespaces.length >0)    
    }) //lines.forEach
    // console.log(result)
    return result
};//remove_spaces_linebreakers

// configuration of the EGTreeNode for programs. The EGTreeNode is to be added to ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode(of a specific PFD)
async function config_programs_function(config_pfd) {
    // for the progerams_EGTreeNode, the config_pfd input is not used (no need to set PFD ID there)
    // however, the input is kept to be consistent with configuaration functions of other components
    let config_programs = {}
    config_programs.NodeType = 'NODETYPE_PROGRAMFOLDER'
    config_programs.ElementID = ''
    config_programs.Expanded = 'True'
    config_programs.Label = 'Programs'
    return config_programs
};//config_egtreenode_programs_function

// make and append the EGTreeNode that is to be appended to ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode(of a specific PFD)
async function make_append_egtreenode_programs(doms_obj, config_program_egtreenode, config_pfd) {
    // console.log('line221', config_pfd)
    //1. make the EGTreeNode component
    let component_egtreenode_programs_dom_obj = await make_egtreenode(config_program_egtreenode)
    // console.log('line224', component_egtreenode_programs_dom_obj.prop('outerHTML'))

    //2. append the EGTreeNode to ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode(of a specific PFD)
    // find all EGTreeNode Elements under ProjectTreeView
    let egtreenode_pfd_doms_obj = $(doms_obj.find('External_Objects').find('EGTreeNode'))
    // loop for each of such EGTreeNode elements, and identify the one with the same PFD ID as the PFD ID specified in config_pfd
    for (let i = 0; i < egtreenode_pfd_doms_obj.length; i++) {
        let the_egtreenode_pfd_dom_obj = $(egtreenode_pfd_doms_obj[i])
        // get the textcontent of .ElementID tag of the_egtreenode_pfd_dom_obj
        let the_pfd_elementid_dom_obj = $(the_egtreenode_pfd_dom_obj.find('ElementID')[0])
        let the_pfd_id = the_pfd_elementid_dom_obj.text()
        // compare the_pfd_id with the pfd id in config_pfd (config_pfd.Element.ID)
        if (the_pfd_id && the_pfd_id === config_pfd.Element.ID) {
            // append the programs EGTreeNode to the specified PFD's EGTreeNode
            the_egtreenode_pfd_dom_obj.append(component_egtreenode_programs_dom_obj)
            break
        } // if (the_pfd_id && the_pfd_id === config_pfd.Element.ID )
    } // for (let i=0; i < egtreenode_pfd_doms_obj.length; i++)
    // console.log('line65',egtreenode_pfd_doms_obj )
    return doms_obj
};//async function make_append_egtreenode_programs

// make the EGTreeNode component to be appended to a specific PFD's EGTreeNode in ProjectCollection.External_Objects.ProjectTreeView
async function make_egtreenode_programs_component() {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___z02_egtreenode_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line52', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
    let component_egtreenode_programs_dom_obj = $(thesrcxmlstr_cleaned)

    return component_egtreenode_programs_dom_obj

};//async function make_egtreenode_programs(config_pfd)

// configuration of the task components
async function config_task_function(config_pfd, task_input) {
    let config_task = {}

    //1a. configuration for the element properties for the code task's Element component (the properties of the task)
    config_task.Element = {}
    config_task.Element.Label = task_input.Element.Label//'PFD1_p1'
    config_task.Element.Type = 'TASK'
    config_task.Element.Container = config_pfd.Element.ID
    config_task.Element.ID = 'CodeTask-' + make_rand_string_by_length(16)
    config_task.Element.CreatedOn = config_pfd.Element.CreatedOn
    config_task.Element.ModifiedOn = config_pfd.Element.ModifiedOn
    config_task.Element.ModifiedBy = config_pfd.Element.ModifiedBy
    config_task.Element.ModifiedByEGID = config_pfd.Element.ModifiedByEGID

    //1b. configuration for the SubmitableElement components that are to be added to ProjectCollection.Elements.Element(PFD).Element(element of the curreant task)
    // there is nothing to change from the default config

    //1c. configuration for the CodeTask components that are to be added to ProjectCollection.Elements.Element(PFD).Element(element of the curreant task)
    // For task as shortcut to external sas files, additional <DNA> components should be appended to ProjectCollection.Elements.Element(PFD).Element(element of the curreant task).CodeTask.DNA
    if (task_input.tasktype && task_input.tasktype === 'shortcut' && task_input.DNA && task_input.DNA.FullPath) {
        config_task.tasktype = task_input.tasktype
        config_task.CodeTask = {}
        config_task.CodeTask.DNA = {}
        config_task.CodeTask.DNA.DNA = {}
        // from the fullpath, get the filename (the part after the last \)
        // console.log('line487', task_input.DNA.FullPath)
        let fullpath = task_input.DNA.FullPath
        fullpath = JSON.stringify(fullpath) // to ensure that the single backlash are replaced by \\
        // the stringify adds additional quotes around the path, the string is now like '"C:\\..."'
        // the following is to strip these additional quotes
        if (fullpath.substr(0, 1) === '"') { fullpath = fullpath.substring(1) }
        if (fullpath.substr(fullpath.length - 1, 1) === '"') { fullpath = fullpath.substr(0, fullpath.length - 1) }
        // console.log('line489', fullpath)
        let startpos = fullpath.lastIndexOf('\\')
        let filename = fullpath.substr(startpos + 1)
        // console.log('line492', filename)
        config_task.CodeTask.DNA.DNA.Name = filename
        config_task.CodeTask.DNA.DNA.FullPath = fullpath
        // console.log('line495', config_task.CodeTask.DNA.DNA.FullPath)

        // also, set config_task.CodeTask.Embedded to False. That tiny change controls whether the task is
        // a shortcut, or with SAS code embedded in the current EGP
        config_task.CodeTask.Embedded = task_input.Embedded

    } // if (task_input.tasktype==='shortcut') 

    //2. configuration for the process components that are to be added to ProjectCollection.Elements.Element(PFD).Element(element of the current task)
    config_task.Process = {}
    config_task.Process.Element = {}
    config_task.Process.Element.ID = config_task.Element.ID

    //3. configuration for the EGTreeNode components that are to be added to ProjectCollection.External_Objects.EGTreeNode(of the task's parent PFD).EGTreeNode(for wrapping all programs/tasks)
    config_task.EGTreeNode = {}
    config_task.EGTreeNode.NodeType = 'NODETYPE_ELEMENT'
    config_task.EGTreeNode.ElementID = config_task.Element.ID
    config_task.EGTreeNode.Label = config_task.Element.Label

    //4. for the TaskGraphic components that are to be added to ProjectColletion.External_Objects.ProcessFlowView.Graphics
    config_task.TaskGraphic = {}
    // the TaskGraphic ID is different from the PFD or CodeTask ID (16-bit random strings. A 16-bit string is not a true 32-bit GUID), (it is a true 32 bit GUID)
    config_task.TaskGraphic.ID = mymodules.generateUUID()
    config_task.TaskGraphic.Label = config_task.Element.Label
    config_task.TaskGraphic.Element = config_task.Element.ID

    // 5. SAS code of the task (if the task code is specified, i.e., the task is not shortcut to an external sas file)
    if (task_input.code) {
        config_task.code = task_input.code
    } //if (task_input.code)   

    return config_task
}; //async function config_task_function

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
}; // async function getfiles_from_a_folder

// configuration for the pfd components
async function config_pfd_function(config_project, pfd_input) {
    let config_pfd = {}
    // config the elemment tags (properties of the pfd)
    config_pfd.Element = {}
    config_pfd.Element.Label = pfd_input.Label // 'PFD1'
    config_pfd.Element.Type = 'CONTAINER'
    config_pfd.Element.Container = config_project.Element.ID
    config_pfd.Element.ID = 'PFD-' + make_rand_string_by_length(16)
    config_pfd.Element.CreatedOn = config_project.Element.CreatedOn
    config_pfd.Element.ModifiedOn = config_project.Element.ModifiedOn
    config_pfd.Element.ModifiedBy = config_project.Element.ModifiedBy
    config_pfd.Element.ModifiedByEGID = config_project.Element.ModifiedByEGID
    //config the egtreenode tags
    config_pfd.EGTreeNode = {}
    config_pfd.EGTreeNode.NodeType = 'NODETYPE_ELEMENT'
    config_pfd.EGTreeNode.ElementID = config_pfd.Element.ID
    config_pfd.EGTreeNode.Expanded = 'True'
    config_pfd.EGTreeNode.Label = config_pfd.Element.Label
    //config the properties tags
    config_pfd.Properties = {}
    config_pfd.Properties.ID = config_pfd.Element.ID
    return config_pfd
};//async function config_pdf_function

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
    // console.log('line461', config_pfd.Element)

    // make the PFD component to append to ProjectCollection.Elements
    let component_pfd_dom_obj = await make_pfd_component(config_pfd.Element)
    // console.log('line465', component_pfd_dom_obj.prop('outerHTML'))
    // append the PFD to ProjectCollection.Elements
    $(doms_obj.find('Elements')[0]).append(component_pfd_dom_obj)

    // add the PFD's ID into ProjectCollection.Containers.ID
    $(doms_obj.find('Containers')[0]).append('<ID>' + config_pfd.Element.ID + '</ID>')
    // console.log('line477', config_pfd)
    // Note: $(doms_obj.find('Containers').find('ID')[0]).text(config_pfd.Element.ID) is wrong, as it always write the PFD ID into the first ID tag

    // make the egtreenode component to append to ProjectCollection.External_Objects.ProjectTreeView
    let component_pfd_egtreenode_dom_obj = await make_egtreenode(config_pfd.EGTreeNode)
    // append the treenode to ProjectCollection.External_Objects.ProjectTreeView
    $(doms_obj.find('External_Objects').find('ProjectTreeView')[0]).append(component_pfd_egtreenode_dom_obj)

    // make the properties component to append to ProjectCollection.External_Objects.ProcessFlowView.Containers 
    let component_pfd_properties_dom_obj = await make_processflowview_properties(config_pfd.Properties)

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

    let component_dom_obj = $(thesrcxmlstr_cleaned)
    if (config.ID) { $(component_dom_obj.find('ID')[0]).text(config.ID) }
    if (config.BackgroundColor) { $(component_dom_obj.find('BackgroundColor')[0]).text(config.BackgroundColor) }
    if (config.Align) { $(component_dom_obj.find('Align')[0]).text(config.Align) }
    return component_dom_obj
}; // function make_processflowview_properties


// make a EGTreeNode
async function make_egtreenode(config) {

    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___z02_egtreenode_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line147',thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)

    let component_dom_obj = $(thesrcxmlstr_cleaned)
    if (config.NodeType) { $(component_dom_obj.find('NodeType')[0]).text(config.NodeType) }
    if (config.ElementID) { $(component_dom_obj.find('ElementID')[0]).text(config.ElementID) }
    if (config.Expanded) { $(component_dom_obj.find('Expanded')[0]).text(config.Expanded) }
    if (config.Label) { $(component_dom_obj.find('Label')[0]).text(config.Label) }
    return component_dom_obj
}; // function make_egtreenode()

// make a pfd component (to be appended to ProjectCollection.Elements)
async function make_pfd_component(config) {
    // console.log('line 527', config)
    // make the pfd element (properties of the pfd)
    let element_pfd_dom_obj = await define_element(config)
    // console.log('line530', element_pfd_dom_obj.prop('outerHTML'))
    // make the container element of the pfd, this part is fixed for any PFD obj

    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___c01_pfd_containers_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line171', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)

    let container_pfd_dom_obj = $(thesrcxmlstr_cleaned)
    // make the default PFD element (the empty PFD element)
    let pfd_pfd_dom_obj = $('<PFD></PFD>')
    // assemble the PFD component to be added to ProjectCollection.Elements
    let component_pfd_dom_obj = $('<Element Type="SAS.EG.ProjectElements.PFD"></Element>')
    component_pfd_dom_obj.append(element_pfd_dom_obj)
    component_pfd_dom_obj.append(container_pfd_dom_obj)
    component_pfd_dom_obj.append(pfd_pfd_dom_obj)

    return component_pfd_dom_obj
}; // function make_pfd_component()
/* define properties of a component.
    properties of a compenent are defined in the tag 'Element'. 
    The properties are standardized for most components
*/
async function define_element(config) {
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___z01_element_v7.xml'
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
    if (config.Label) { $(theElement_dom_obj.find('Label')[0]).text(config.Label) }
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
    config.Element.ID = 'ProjectCollection-' + make_rand_string_by_length(16)
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
    modified_xmlstr = modified_xmlstr.replace(/\>/g, '>\n___123456___\n')

    // 2. make dictionaries to map out original tagnames and attributenames
    // read all files in the prototype folder
    // get all file names in 
    let thefolder_prototypexmls = 'data/in/prototype/__xml/egpv7'
    let filenames_prototypexmlfiles = await getfilenames_from_a_folder(thefolder_prototypexmls)
    // console.log('line274', filenames_prototypexmlfiles)
    // loop for each file in the prototypexml file folder, concat the xml strings in the file
    let str_all_prototype_xmlfiles = '<Table>\n</Table>\n<PFD>\n</PFD>\n'
    for (let i = 0; i < filenames_prototypexmlfiles.length; i++) {
        let d = filenames_prototypexmlfiles[i]
        if (d.substr(0, 3) === '___' && d !== '___sample.xml') {
            let thesrcxmlfile = thefolder_prototypexmls + '/' + d
            let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
            let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
            thesrcxmlstr = thesrcxmlstr.replace(/\>/g, '>\n')
            // console.log('line282', thesrcxmlstr)
            // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
            let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
            // console.log('line285',thesrcxmlstr_cleaned )
            str_all_prototype_xmlfiles = str_all_prototype_xmlfiles + thesrcxmlstr_cleaned
            // console.log('line287', str_all_prototype_xmlfiles)
        } // if (d.substr(0, 3) === '___')
    } //filenames_prototypexmlfiles.forEach(d
    // console.log('line291', str_all_prototype_xmlfiles )

    // 2. make a dictionary to map out the standardized and original tagnames
    let originalTagnames_dict_crude = getOriginalTagNames_dict_crude(str_all_prototype_xmlfiles)
    // console.log('line748',originalTagnames_dict_crude)
    // Note: there is a bug that the SAS EGP project.xml contains tags <Log> (in <Element Type="SAS.EG.ProjectElements.Link">)
    // and <log> (in <JobRecipe>)
    // the dictionary must have a unique map, i.e., the standard tag LOG must be mapped to one of the original
    // the work around is to change the <log> tag to <Log> (in data\in\prototype\__xml\egpv7\___e03_task_element_v7.xml)

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
    modified_xmlstr = modified_xmlstr.replace(/\n___123456___\n/g, '')

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
}; // function getOriginalTagNames(thexhmlstr)

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
};// function getTagAttrNames(doms)

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
