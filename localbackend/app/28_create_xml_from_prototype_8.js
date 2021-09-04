/* To create a project xml from the prototype 
    The prototypes are saved at data/in/prototype/egpv7
    components of a typical v7 project.xml are saved as individual xml files (all of utf16le encoding)

    based on localbackend\app\27_create_xml_from_prototype_7.js
    Modify the shortcuttofile input structure (making it consistent with other components: change to: .Element is for ShortCut while .ExternalFile is for ExternalFile)

    2. add order list
    3. add report 
    4. add shortcuttodata
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
// const { Console } = require('console');

const thev8EGP = "data/in/sample_a_v8.egp";
const targetzip_v7 = new AdmZip()
// make a zip instance of the thesrc v8 egp file
const thesrczip_v8 = new AdmZip(thev8EGP)

// get xml script and v8_doms_obj from a src egp
async function get_xml_from_v8_egp(thesrczip_v8) {

    //*** read the v8 egp data */
    // based on 01 extract_projectxml_from_egp.js, and 12_convert_xml_v8_to_v7.js

    // 2. read the script of project.xml from thesrczip
    let thesrcxmlfile_v8 = 'project.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr_v8 = await thesrczip_v8.readAsText(thesrcxmlfile_v8, encoding); // 'utf-16' type is called 'utf16le'
    // 3. remove the head line '<encoding="utf-16"?>', and clean the srcxml ()
    let thebodyxmlstr_v8 = thesrcxmlstr_v8.split('encoding="utf-16"?>')[1]
    let thesrcxmlstr_v8_cleaned = cleanxmlstr(thebodyxmlstr_v8)
    // 4. make a doms_obj for the cleaned src xml
    let v8_doms_obj = $(thesrcxmlstr_v8_cleaned)
    // console.log('line47', v8_doms_obj)
    return { 'doms_obj_v8': v8_doms_obj, 'theoriginsrcxmlstr_v8': thesrcxmlstr_v8 }
}; //async function get_xml_from_v8_egp

// get settings for the Project from the v8 egp file
async function get_project_config_from_src_v8_egp(v8_doms_obj) {
    let project_element_dom_obj = $(v8_doms_obj.find("Element")[0])
    let config_project = {}
    config_project.Element = {}
    // define the tags of project settings in the v8 egp file
    let tags_str = 'Label,ID,CreatedOn,ModifiedOn, ModifiedBy, ModifiedByEGID'
    let tags_arr = tags_str.split(',').map(tagname => tagname.trim()) // make an array of tag names
    tags_arr.forEach(tagname => { config_project.Element[tagname] = $(project_element_dom_obj.find(tagname)[0]).text() })
    // console.log('line74', config_project)
    return config_project
};//async function get_project_config_from_src_v8_egp

// get settings from the Project from the v8 doms_obj
async function get_element_doms_obj_by_type(doms_obj, type_attr) {
    // a1. identify the PFD elements in ProjectCollection.Elements
    let elements_doms_obj = $(doms_obj.find('Elements').find('Element'))
    // console.log('line85', elements_doms_obj)
    let elements_of_the_type_doms_obj = []
    for (let i = 0; i < elements_doms_obj.length; i++) {
        if ($(elements_doms_obj[i]).attr('Type') === type_attr) {
            elements_of_the_type_doms_obj.push(elements_doms_obj[i])
        } // if 
    } //for (let i =0; i<elements_doms_obj.length;i++)
    // console.log('line92', $(pfd_elements_doms_obj[0]).find('Element').find('Label').text())
    return elements_of_the_type_doms_obj
};//async function get_element_doms_obj_by_type(doms_obj, type_attr)

// use the element id (i.e., a task id) to find the correponding TaskGraphic in doms_obj_v8
function get_task_or_note_graphic_dom_by_id_v8(doms_obj, elementid, task_or_note_graphic) {
    // unlike EG v7, in EG v8, the TaskGraphic tags are placed separately according to the parent PFD
    // however, the following find all TaskGraphic tags regardless of under which PFD
    let the_doms = $(doms_obj.find('External_Objects').find('ProcessFlowControlManager').find('ProcessFlowControlState').find('GraphicObjects').find(task_or_note_graphic))
    for (let i = 0; i < the_doms.length; i++) {
        let the_dom_obj = $(the_doms[i])
        // console.log('190:', $(the_dom_obj.find('Element')[0]).text())
        if ($(the_dom_obj.find('Element')[0]).text() === elementid) { return $(the_dom_obj) }
    } //for (let i =0; i < the_doms.length; i++)
}; //function get_task_or_note_graphic_dom_by_id

// converting PFDs from v8 egp to v7
async function convert_pfd_v8_to_v7(doms_obj_v8, config_project_v8, doms_obj_v7) {
    // 3a. get settings from the Project from the v8 doms_obj
    let type_attr_pfd = 'SAS.EG.ProjectElements.ProcessFlowContainer'
    let pfd_elements_doms_obj_v8 = await get_element_doms_obj_by_type(doms_obj_v8, type_attr_pfd)
    let pfd_input_arr = []
    pfd_elements_doms_obj_v8.forEach(d => {
        // get the Label and ID from each pfd Element.Element
        let label = $($(d).find("Element").find("Label")[0]).text()
        let id = $($(d).find("Element").find("ID")[0]).text()
        pfd_input_arr.push({ Label: label, ID: id })
    })
    // 3b. get configuration of a pfd element
    let pfd_input = [], config_pfd = []
    for (let i = 0; i < pfd_input_arr.length; i++) {
        // config the pfd element
        pfd_input[i] = {}
        pfd_input[i].Label = pfd_input_arr[i].Label
        pfd_input[i].ID = pfd_input_arr[i].ID
        // console.log('line38', pfd_input[i].Label)
        config_pfd[i] = await config_pfd_function(config_project_v8, pfd_input[i])
        // console.log('line40', config_pfd[i])
        doms_obj_v7 = await make_append_pfd_component(doms_obj_v7, config_pfd[i])
    } // for(let i=0;i<pfd_input_arr.length;i++)

    return { config_pfd: config_pfd, result_doms_obj_add_PFD: doms_obj_v7 }
};//async function convert_pfd_v8_to_v7

// Add EGTreeNode for wrapping all programs/tasks for ProjectTreeView.
async function add_egtreenode_program_v8_to_v7(doms_obj_v7, config_pfd) {
    let config_programs = []
    for (let i = 0; i < config_pfd.length; i++) {
        // The EGTreeNode is to be added to ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode(of a specific PFD)
        // 4a. Configuration of the EGTreeNode    
        config_programs[i] = await config_programs_function(config_pfd[i])
        // 4b. make and append the EGTreeNode that is to be appended to ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode(of a specific PFD)
        doms_obj = await make_append_egtreenode_programs(doms_obj_v7, config_programs[i], config_pfd[i])
    } // for(let i=0;i<pfd_input_arr.length;i++)

    return { config_programs: config_programs, result_doms_obj_add_EGTreeNode_program: doms_obj }
}; //async function add_egtreenode_program_v8_to_v7

// converting CodeTask components and files from v8 to v7
async function convert_task_v8_to_v7(doms_obj_v8, config_pfd, doms_obj_v7) {
    // from doms_obj_v8, find Elements.Element components with Type="SAS.EG.ProjectElements.CodeTask"
    let type_attr_task = 'SAS.EG.ProjectElements.CodeTask'
    let task_elements_doms_obj_v8 = await get_element_doms_obj_by_type(doms_obj_v8, type_attr_task)
    let task_input_arr = []
    // console.log('line134', task_elements_doms_obj_v8)

    // loop for each task_element found from the v8 egp
    for (let i = 0; i < task_elements_doms_obj_v8.length; i++) {
        let d = task_elements_doms_obj_v8[i]
        // get the Label and ID from each pfd Element.Element
        let task_config = {}, task_config_element = {}, config_parent_pfd, code, Embedded, DNA = {}, TaskGraphic = {}
        // get the task Element's Element.Label and .ID
        task_config_element.Label = $($(d).find("Element").find("Label")[0]).text()
        task_config_element.ID = $($(d).find("Element").find("ID")[0]).text()

        // get the parent PFD of the task element
        let the_parent_pfdid = $($(d).find("Element").find("Container")[0]).text()
        // according to the parent pfd id, find the configuration of that pfd
        config_pfd.forEach(d => {
            if (d.Element.ID === the_parent_pfdid) { config_parent_pfd = d }
        }) // config_pfd.forEach(d=>{...}

        // get the .CodeTask.Embedded's textconent (to indicate whether the task is embedded or a shortcut to an external .sas program)
        Embedded = $($(d).find("CodeTask").find("Embedded")[0]).text()
        // if Embedded = 'False', get the element's .DNA.FullPath's textcontent
        if (Embedded && Embedded === 'False') {
            // unlike manual input of DNA's fullpath, here the html within a DNA is directly copied and saved to input.DNA.html
            // later, DNA.html will be directly input (in make_task_element_component()) into the DNA component (as html()) in the doms_obj_v7
            DNA.html = $($(d).find("CodeTask").find("DNA")[0]).html() // DNA.html is with ampersand symbols
            // console.log('line164', DNA.html)
        } // if (Embedded && Embedded === 'False')
        else {// else copy the embedded sas code file (code.sas) from the v8 epg's code.sas in the folder named by the task's ID
            // Note: this is different from manually config code for embedded tasks.
            // When manually configured, the sas code string is input to task_input_arr[i].code 
            //  later in make_append_task_component(), the code is saved as a code.sas file
            // When not manually configured (get config from a src v8 egp), the sas code of the original v8 egp is directly imported and saved as a code.sas in the target v7 egp
            // read code text from the srcv8zip
            let codefile = task_config_element.ID + '/code.sas' // Note: use /, not \, not \\!
            let task_sascodestr = await thesrczip_v8.readAsText(codefile, "utf-8");
            // console.log('line191', task_sascodestr)
            // add as a file into targetzip_v7
            // addFile to zip can use \\ or / but not \
            targetzip_v7.addFile(task_config_element.ID + '/code.sas', Buffer.from(task_sascodestr, "utf-8"))
        }// else copy the sas code from the v8 epg's folder named by the task's ID

        // get the TaskGraphic.PosX, PosY setting (these set the position of the task icon in the PFD view)
        // use the task id (task_config_element.ID), find the correponding TaskGraphic in doms_obj_v8
        let the_taskgraphic_dom_obj = get_task_or_note_graphic_dom_by_id_v8(doms_obj_v8, task_config_element.ID, 'TaskGraphic')
        // console.log('line182', the_taskgraphic_dom_obj.prop('outerHTML'))
        TaskGraphic.ID = $(the_taskgraphic_dom_obj.find('ID')[0]).text()
        TaskGraphic.PosX = $(the_taskgraphic_dom_obj.find('PosX')[0]).text()
        TaskGraphic.PosY = $(the_taskgraphic_dom_obj.find('PosY')[0]).text()

        task_config = {
            Element: task_config_element,
            config_pfd: config_parent_pfd,
            Embedded: Embedded,
            DNA: DNA,
            TaskGraphic: TaskGraphic
        }
        task_input_arr.push(task_config)
    } //for (let i = 0; i < task_elements_doms_obj_v8.length; i++)
    // console.log('line204', task_input_arr)

    // loop for each item in task_input_arr and make task elements into the target egp's xml
    let config_task = []
    for (let i = 0; i < task_input_arr.length; i++) {
        // 5.1 configuration for the task_component (indicate the parent PFD, and the task in task_input_arr)
        config_task[i] = await config_task_function(task_input_arr[i].config_pfd, task_input_arr[i])
        // console.log('line44', config_task)
        // 5.2 add task components
        doms_obj_v7 = await make_append_task_component(doms_obj_v7, config_task[i])
    } // for(let i=0;i<task_input_arr.length;i++)

    return { config_task: config_task, result_doms_obj_add_task: doms_obj_v7 }
};//async function convert_task_v8_to_v7

// converting ShortCutToFile components and files from v8 to v7
async function convert_shortcuttofile_v8_to_v7(doms_obj_v8, config_pfd, doms_obj_v7) {

    let shortcuttofile_input_arr = []
    let config_shortcuttofile = []

    // from doms_obj_v8, find Elements.Element components with Type="SAS.EG.ProjectElements.ShortCutToFile"
    let type_attr_shortcuttofile = 'SAS.EG.ProjectElements.ShortCutToFile'
    let shortcuttofile_elements_doms_obj_v8 = await get_element_doms_obj_by_type(doms_obj_v8, type_attr_shortcuttofile)
    // console.log('251:', shortcuttofile_elements_doms_obj_v8)

    // loop for each shortcuttofile element found from the v8 egp
    for (let i = 0; i < shortcuttofile_elements_doms_obj_v8.length; i++) {

        let d = shortcuttofile_elements_doms_obj_v8[i]
        // get the Label and ID from each pfd Element.Element
        let shortcuttofile_config = {}, shortcuttofile_config_element = {}, config_parent_pfd, Element = {}, ExternalFile = {}, DNA = {}, TaskGraphic = {}
        // get the shortcuttofile Element's Element.Label and .ID
        shortcuttofile_config_element.Label = $($(d).find("Element").find("Label")[0]).text()
        shortcuttofile_config_element.ID = $($(d).find("Element").find("ID")[0]).text()

        // get the parent PFD of the shortcuttofile element
        let the_parent_pfdid = $($(d).find("Element").find("Container")[0]).text()
        // according to the parent pfd id, find the configuration of that pfd
        config_pfd.forEach(d => {
            if (d.Element.ID === the_parent_pfdid) { config_parent_pfd = d }
        }) // config_pfd.forEach(d=>{...}

        // Identify the ExternalFile component of which the ShortCutID = shortcuttofile_config_element.ID
        let ExternalFile_doms_obj = $(doms_obj_v8.find('ExternalFileList > ExternalFile')) // find ExternalFileList's direct children with tag of ExternalFile
        // console.log('274:', ExternalFile_doms)
        // loop to identify the ExternalFile of which the .ExternalFile.ShortCutList.ShortCutID = shortcuttofile_config_element.ID
        let the_externalfile_dom_obj
        for (j = 0; j < ExternalFile_doms_obj.length; j++) {
            let ShortCutID = $($(ExternalFile_doms_obj[i]).find('ExternalFile > ShortCutList > ShortCutID')[0]).text()
            // console.log('278:', ShortCutID, shortcuttofile_config_element.ID)
            if (ShortCutID === shortcuttofile_config_element.ID) {
                the_externalfile_dom_obj = $(ExternalFile_doms_obj[j])
                // console.log ('282:', the_externalfile_dom_obj)
                break
            }
        } // for (j=0;j<ExternalFile_doms_obj.length;j++)
        // get the externalfile settings
        // ExternalFile's Label and ID. Note: the shortcuttofile_input_arr is different from task_input_arr.
        // It's .Element is for .ExternalFile, not for Elements.Element of the ShortCutToFile 
        Element.Label = $(the_externalfile_dom_obj.find('Element > Label')[0]).text()
        Element.ID = $(the_externalfile_dom_obj.find('Element > ID')[0]).text()
        // console.log('290', Element)
        ExternalFile.FileTypeType = $(the_externalfile_dom_obj.find('ExternalFile > FileTypeType')[0]).text()
        ExternalFile.ShortCutList = {}
        ExternalFile.ShortCutList.ShortCutID = shortcuttofile_config_element.ID
        // console.log('290', ExternalFile)

        DNA.html = $(the_externalfile_dom_obj.find('ExternalFile > DNA')[0]).html()

        // get the TaskGraphic.PosX, PosY setting (these set the position of the shortcuttofile icon in the PFD view)
        // use the shortcuttofile id (shortcuttofile_config_element.ID), find the correponding TaskGraphic in doms_obj_v8
        let the_taskgraphic_dom_obj = get_task_or_note_graphic_dom_by_id_v8(doms_obj_v8, shortcuttofile_config_element.ID, 'TaskGraphic')
        // console.log('line182', the_taskgraphic_dom_obj.prop('outerHTML'))
        TaskGraphic.ID = $(the_taskgraphic_dom_obj.find('ID')[0]).text()
        TaskGraphic.PosX = $(the_taskgraphic_dom_obj.find('PosX')[0]).text()
        TaskGraphic.PosY = $(the_taskgraphic_dom_obj.find('PosY')[0]).text()

        shortcuttofile_config = {
            Element: Element,
            config_pfd: config_parent_pfd,
            TaskGraphic: TaskGraphic,
            ExternalFile: ExternalFile,
            DNA: DNA
        }
        shortcuttofile_input_arr.push(shortcuttofile_config)
    } //for (let i = 0; i < shortcuttofile_elements_doms_obj_v8.length; i++)
    // console.log('316:', shortcuttofile_input_arr)

    // loop for each item in shortcuttofile_input_arr and make shortcuttofile elements into the target egp's xml

    for (let i = 0; i < shortcuttofile_input_arr.length; i++) {
        // 5.1 configuration for the shortcuttofile_component (indicate the parent PFD, and the shortcuttofile in shortcuttofile_input_arr)
        config_shortcuttofile[i] = await config_shortcuttofile_function(shortcuttofile_input_arr[i])
        // console.log('323:', config_shortcuttofile)
        // 5.2 add shortcuttofile components
        doms_obj_v7 = await make_append_shortcuttofile_component(doms_obj_v7, config_shortcuttofile[i])
    } // for(let i=0;i<shortcuttofile_input_arr.length;i++)

    return { config_shortcuttofile: config_shortcuttofile, result_doms_obj_add_shortcuttofile: doms_obj_v7 }
};//async function convert_shortcuttofile_v8_to_v7

// converting note components and files from v8 to v7
async function convert_note_v8_to_v7(doms_obj_v8, config_pfd, doms_obj_v7) {

    let note_input_arr = []
    let config_note = []

    // from doms_obj_v8, find Elements.Element components with Type="SAS.EG.ProjectElements.Note"
    let type_attr_note = 'SAS.EG.ProjectElements.Note'
    let note_elements_doms_obj_v8 = await get_element_doms_obj_by_type(doms_obj_v8, type_attr_note)
    // console.log('251:', note_elements_doms_obj_v8)

    // loop for each note element found from the v8 egp
    for (let i = 0; i < note_elements_doms_obj_v8.length; i++) {
        let note_config = {}, config_parent_pfd, Element = {}, TextElement = {}, Note = {}, NoteGraphic = {}
        let d = note_elements_doms_obj_v8[i]

        //1. get the configuration of the parent PFD of the note element
        let the_parent_pfdid = $($(d).find("Element").find("Container")[0]).text()
        // according to the parent pfd id, find the configuration of that pfd
        config_pfd.forEach(d => {
            if (d.Element.ID === the_parent_pfdid) { config_parent_pfd = d }
        }) // config_pfd.forEach(d=>{...}

        //2.get the note Element's Element.Label and .ID
        Element.Label = $($(d).find("Element").find("Label")[0]).text()
        Element.ID = $($(d).find("Element").find("ID")[0]).text()

        //3. Element (of the note).TextElement.Text
        TextElement.Text = $($(d).find("TextElement > Text")[0]).html()

        //4. Element (of the note).Note.Collapse
        Note.Collapsed = $($(d).find("Note > Collapsed")[0]).text()

        //5. External_Object.ProcessFlowView.Graphics.NoteGraphic
        // get the NoteGraphic.PosX, PosY setting (these set the position of the note icon in the PFD view)
        // use the note id (note_config_element.ID), find the correponding NoteGraphic in doms_obj_v8
        let the_notegraphic_dom_obj = get_task_or_note_graphic_dom_by_id_v8(doms_obj_v8, Element.ID, 'NoteGraphic')
        NoteGraphic.ID = $(the_notegraphic_dom_obj.find('ID')[0]).text() // use ID instead of .Id although the original tag is Id
        NoteGraphic.PosX = $(the_notegraphic_dom_obj.find('PosX')[0]).text()
        NoteGraphic.PosY = $(the_notegraphic_dom_obj.find('PosY')[0]).text()
        NoteGraphic.Collapsed = $(the_notegraphic_dom_obj.find('Collapsed')[0]).text()
        NoteGraphic.WidthExpanded = $(the_notegraphic_dom_obj.find('WidthExpanded')[0]).text()
        NoteGraphic.HeightExpanded = $(the_notegraphic_dom_obj.find('HeightExpanded')[0]).text()

        note_config = {
            config_pfd: config_parent_pfd,
            Element: Element,
            TextElement: TextElement,
            Note: Note,
            NoteGraphic: NoteGraphic
        }
        note_input_arr.push(note_config)
    } //for (let i = 0; i < note_elements_doms_obj_v8.length; i++)
    // console.log('316:', note_input_arr)

    // loop for each item in note_input_arr and make note elements into the target egp's xml

    for (let i = 0; i < note_input_arr.length; i++) {
        // configuration for the note_component (indicate the parent PFD, and the note in note_input_arr)
        config_note[i] = await config_note_function(note_input_arr[i])
        // console.log('397:', config_note)
        // add note components
        doms_obj_v7 = await make_append_note_component(doms_obj_v7, config_note[i])
    } // for(let i=0;i<note_input_arr.length;i++)

    return { config_note: config_note, result_doms_obj_add_note: doms_obj_v7 }
};//async function convert_note_v8_to_v7

// converting EGTask components and files from v8 to v7
async function convert_egtask_v8_to_v7(doms_obj_v8, config_pfd, doms_obj_v7) {
    // from doms_obj_v8, find Elements.Element components with Type="SAS.EG.ProjectElements.EGTask"
    let type_attr_egtask = 'SAS.EG.ProjectElements.EGTask'
    let egtask_elements_doms_obj_v8 = await get_element_doms_obj_by_type(doms_obj_v8, type_attr_egtask)
    let egtask_input_arr = [], config_egtask = []
    // console.log('line134', egtask_elements_doms_obj_v8)

    // loop for each egtask_element found from the v8 egp
    for (let i = 0; i < egtask_elements_doms_obj_v8.length; i++) {
        let d = egtask_elements_doms_obj_v8[i]
        // get the Label and ID from each pfd Element.Element
        let egtask_config = {}, Element = {}, config_parent_pfd, TaskGraphic = {}
        // get the egtask Element's Element.Label and .ID
        Element.Label = $($(d).find("Element").find("Label")[0]).text()
        Element.ID = $($(d).find("Element").find("ID")[0]).text()

        // get the parent PFD of the egtask element
        let the_parent_pfdid = $($(d).find("Element").find("Container")[0]).text()
        // according to the parent pfd id, find the configuration of that pfd
        config_pfd.forEach(d => {
            if (d.Element.ID === the_parent_pfdid) { config_parent_pfd = d }
        }) // config_pfd.forEach(d=>{...}

        // When not manually configured (get config from a src v8 egp), the sas code of the original v8 egp is directly imported and saved as a code.sas in the target v7 egp
        // read code text from the srcv8zip
        let egtask_xmlfile = Element.ID + '/' + Element.ID + '.xml' // Note: use /, not \, not \\!
        let egtask_xmlstr = await thesrczip_v8.readAsText(egtask_xmlfile, "utf-8");
        // console.log('line191', egtask_sascodestr)
        // add as a file into targetzip_v7
        // addFile to zip can use \\ or / but not \
        targetzip_v7.addFile(egtask_xmlfile, Buffer.from(egtask_xmlstr, "utf-8"))

        // get the TaskGraphic.PosX, PosY setting (these set the position of the egtask icon in the PFD view)
        // use the egtask id (Element.ID), find the correponding TaskGraphic in doms_obj_v8
        let the_egtaskgraphic_dom_obj = get_task_or_note_graphic_dom_by_id_v8(doms_obj_v8, Element.ID, 'TaskGraphic')
        // console.log('line182', the_egtaskgraphic_dom_obj.prop('outerHTML'))
        TaskGraphic.ID = $(the_egtaskgraphic_dom_obj.find('ID')[0]).text()
        TaskGraphic.PosX = $(the_egtaskgraphic_dom_obj.find('PosX')[0]).text()
        TaskGraphic.PosY = $(the_egtaskgraphic_dom_obj.find('PosY')[0]).text()

        egtask_config = {
            Element: Element,
            config_pfd: config_parent_pfd,
            TaskGraphic: TaskGraphic
        }
        egtask_input_arr.push(egtask_config)
    } //for (let i = 0; i < egtask_elements_doms_obj_v8.length; i++)
    // console.log('line456', egtask_input_arr)

    // loop for each item in egtask_input_arr and make egtask elements into the target egp's xml
    for (let i = 0; i < egtask_input_arr.length; i++) {
        // 1 configuration for the egtask_component (indicate the parent PFD, and the egtask in egtask_input_arr)
        config_egtask[i] = await config_egtask_function(egtask_input_arr[i].config_pfd, egtask_input_arr[i])
        // console.log('462', config_egtask)
        // 2 add egtask components
        doms_obj_v7 = await make_append_egtask_component(doms_obj_v7, config_egtask[i])
    } // for(let i=0;i<egtask_input_arr.length;i++)

    return { config_egtask: config_egtask, result_doms_obj_add_egtask: doms_obj_v7 }
};//async function convert_egtask_v8_to_v7

// converting Link components and files from v8 to v7
async function convert_link_v8_to_v7(doms_obj_v8, doms_obj_v7) {
    // from doms_obj_v8, find Elements.Element components with Type="SAS.EG.ProjectElements.link"
    let type_attr_link = 'SAS.EG.ProjectElements.Link'
    let link_elements_doms_obj_v8 = await get_element_doms_obj_by_type(doms_obj_v8, type_attr_link)
    let link_input_arr = [], config_link = []
    // console.log('line134', link_elements_doms_obj_v8)

    // loop for each link_element found from the v8 egp
    for (let i = 0; i < link_elements_doms_obj_v8.length; i++) {
        let d = link_elements_doms_obj_v8[i]
        // get the Label and ID from each pfd Element.Element
        let Link = {}
        // get the link Element's Element.Label and .ID
        Link.Label = $($(d).find("Element").find("Label")[0]).text()
        Link.ID = $($(d).find("Element").find("ID")[0]).text()
        let taskid_LinkFrom = $($(d).find("Log > LinkFrom")[0]).text()
        let taskid_LinkTo = $($(d).find("Log > LinkTo")[0]).text()
        Link.LinkFrom_config = {}
        Link.LinkFrom_config.Element = {}
        Link.LinkTo_config = {}
        Link.LinkTo_config.Element = {}
        // from doms_obj_v7 get all Elements.Element.Element (which contains Label, ID, Container, etc)
        let elements_doms_obj = $(doms_obj_v7.find('Elements > Element > Element'))
        // console.log('495', elements_doms_obj)
        for (let j = 1; j < elements_doms_obj.length; j++) {
            let theElement_dom_obj = $(elements_doms_obj[j])
            // when the element matches the link from id, get it's properties
            if ($(theElement_dom_obj.find('ID')[0]).text() === taskid_LinkFrom) {
                Link.LinkFrom_config.Element.ID = $(theElement_dom_obj.find('ID')[0]).text()
                Link.LinkFrom_config.Element.Label = $(theElement_dom_obj.find('Label')[0]).text()
                Link.LinkFrom_config.Element.Container = $(theElement_dom_obj.find('Container')[0]).text()
                Link.LinkFrom_config.Element.CreatedOn = $(theElement_dom_obj.find('CreatedOn')[0]).text()
                Link.LinkFrom_config.Element.ModifiedOn = $(theElement_dom_obj.find('ModifiedOn')[0]).text()
                Link.LinkFrom_config.Element.ModifiedBy = $(theElement_dom_obj.find('ModifiedBy')[0]).text()
                Link.LinkFrom_config.Element.ModifiedByEGID = $(theElement_dom_obj.find('ModifiedByEGID')[0]).text()
            } // if ($(theElement_dom_obj.find('ID')[0]).text() === taskid_LinkFrom){
            // when the element matches the link to id, get it's properties
            if ($(theElement_dom_obj.find('ID')[0]).text() === taskid_LinkTo) {
                Link.LinkTo_config.Element.ID = $(theElement_dom_obj.find('ID')[0]).text()
                Link.LinkTo_config.Element.Label = $(theElement_dom_obj.find('Label')[0]).text()
                Link.LinkTo_config.Element.Container = $(theElement_dom_obj.find('Container')[0]).text()
                Link.LinkTo_config.Element.CreatedOn = $(theElement_dom_obj.find('CreatedOn')[0]).text()
                Link.LinkTo_config.Element.ModifiedOn = $(theElement_dom_obj.find('ModifiedOn')[0]).text()
                Link.LinkTo_config.Element.ModifiedBy = $(theElement_dom_obj.find('ModifiedBy')[0]).text()
                Link.LinkTo_config.Element.ModifiedByEGID = $(theElement_dom_obj.find('ModifiedByEGID')[0]).text()
            } // if ($(theElement_dom_obj.find('ID')[0]).text() === taskid_LinkTo){
        }//for (let j=1; j<elements_doms_obj.length; j++)

        link_input_arr.push(Link)

    } //for (let i = 0; i < link_elements_doms_obj_v8.length; i++)
    // console.log('496', link_input_arr)

    // loop for each item in link_input_arr and make link elements into the target egp's xml
    for (let i = 0; i < link_input_arr.length; i++) {
        // 1 configuration for the link_component (indicate the parent PFD, and the link in link_input_arr)
        config_link[i] = await config_link_function(link_input_arr[i])
        // console.log('533', config_link)
        // // 2 add link components
        doms_obj_v7 = await make_append_link_component(doms_obj_v7, config_link[i])
    } // for(let i=0;i<link_input_arr.length;i++)

    return { config_link: config_link, result_doms_obj_add_link: doms_obj_v7 }
};//async function convert_link_v8_to_v7

(async () => {

    // 1. get xml script and v8_doms_obj from a src egp
    let { doms_obj_v8, theoriginsrcxmlstr_v8 } = await get_xml_from_v8_egp(thesrczip_v8)
    // console.log('line33', thesrcxmlstr_v8.substr(0, 100), v8_doms_obj.prop('outerHTML'))

    // save the thesrcxmlstr_v8 as a local file (for viewing the contents during coding)
    let thetargetv8xmlfile = 'data/out/__testv8.xml'
    await mymodules.saveLocalTxtFile(theoriginsrcxmlstr_v8, thetargetv8xmlfile, 'utf16le');

    // 2. from the source v8 egp file, get settings for the Project from the v8 egp file
    let config_project_v8 = await get_project_config_from_src_v8_egp(doms_obj_v8)
    // change the project label to '__testv7' (this is for testing only)
    config_project_v8.Element.Label = '__testv7'
    // initiate a v7 doms obj, and apply project configuations from the source v8 file
    let { doms_obj_v7, thesrcxmlstr_v7 } = await init_v7_doms_obj(config_project_v8)
    // console.log ('line76', doms_obj_v7.find('Element').prop('outerHTML') )

    // 3 converting PFDs from v8 egp to v7
    let { config_pfd, result_doms_obj_add_PFD } = await convert_pfd_v8_to_v7(doms_obj_v8, config_project_v8, doms_obj_v7)
    doms_obj_v7 = result_doms_obj_add_PFD

    // 4. add EGTreeNode for wrapping all programs/tasks for ProjectTreeView.
    let { config_programs, result_doms_obj_add_EGTreeNode_program } = await add_egtreenode_program_v8_to_v7(doms_obj_v7, config_pfd)
    doms_obj_v7 = result_doms_obj_add_EGTreeNode_program

    // 5. converting CodeTask components and files from v8 to v7
    let { config_task, result_doms_obj_add_task } = await convert_task_v8_to_v7(doms_obj_v8, config_pfd, doms_obj_v7)
    doms_obj_v7 = result_doms_obj_add_task

    // 6 shortcuts to external files
    let { config_shortcuttofile, result_doms_obj_add_shortcuttofile } = await convert_shortcuttofile_v8_to_v7(doms_obj_v8, config_pfd, doms_obj_v7)
    doms_obj_v7 = result_doms_obj_add_shortcuttofile

    // 7 converting note components and files from v8 to v7
    let { config_note, result_doms_obj_add_note } = await convert_note_v8_to_v7(doms_obj_v8, config_pfd, doms_obj_v7)
    doms_obj_v7 = result_doms_obj_add_note

    // 8 // converting CodeTask components and files from v8 to v7
    let { config_egtask, result_doms_obj_add_egtask } = await convert_egtask_v8_to_v7(doms_obj_v8, config_pfd, doms_obj_v7)
    doms_obj_v7 = result_doms_obj_add_egtask

    // 9 links between componets (e.g., betwen CodeTasks, or a Codetask and a note)
    let { config_link, result_doms_obj_add_link } = await convert_link_v8_to_v7(doms_obj_v8, doms_obj_v7)
    doms_obj_v7 = result_doms_obj_add_link

    // write_to_v7_egp(doms_obj_v7, thesrcxmlstr_v7, config_project_v8)

    //**** part 2, make the v7 egp */
    await make_v7_egp()

})()

// cleanup the target xlm and write to the target v7 egp
async function write_to_v7_egp(doms_obj_v7, thesrcxmlstr_v7, config_project) {

    let targetxmlstr_cleaned = await cleanup_targetxml(doms_obj_v7, thesrcxmlstr_v7)
    // remove lines only containing spaces and line breakers
    let targetxmlstr = remove_spaces_linebreakers(targetxmlstr_cleaned)
    // console.log(targetxmlstr)
    targetxmlstr = '<?xml version="1.0" encoding="utf-16"?>\n' + targetxmlstr
    let thetargetxmlfile = 'data/out/' + config_project.Element.Label + '.xml'
    await mymodules.saveLocalTxtFile(targetxmlstr, thetargetxmlfile, 'utf16le');

    // using Buffer to import the xml with utf16 encoding
    targetzip_v7.addFile('project.xml', Buffer.from(targetxmlstr, "utf16le"))
    // writeZip the targetzip_v7 instead of the original (theZip)
    await targetzip_v7.writeZip("data/out/" + config_project.Element.Label + ".egp")

};//async function write_to_v7_egp

//make the v7 egp
async function make_v7_egp() {
    // 0.save the zip as an egp file (must be defined before adding task components. When adding tasks, the SAS code need to be added into the zip)

    // 1. make a project collection scala
    let config_project = await config_projectcollection()

    // 2. prepare the doms_obj and the cleaned source xml string from the prototype
    let { doms_obj_v7, thesrcxmlstr_v7 } = await init_v7_doms_obj(config_project)
    // console.log(thesrcxmlstr_cleaned)
    let doms_obj = doms_obj_v7, thesrcxmlstr_cleaned = thesrcxmlstr_v7
    // 3. add process flow (PFD)
    // let pfd_input_arr = [{ 'Label': 'PFD1' }], pfd_input = [], config_pfd = []
    let pfd_input_arr = [{ Label: 'PFD1', ID: 'PFD-' + make_rand_string_by_length(16) },
    { Label: 'PFD2', ID: 'PFD-' + make_rand_string_by_length(16) }
    ]
    let pfd_input = [], config_pfd = []
    for (let i = 0; i < pfd_input_arr.length; i++) {
        // config the pfd element
        pfd_input[i] = {}
        pfd_input[i].Label = pfd_input_arr[i].Label
        pfd_input[i].ID = pfd_input_arr[i].ID
        // console.log('line38', pfd_input[i].Label)
        config_pfd[i] = await config_pfd_function(config_project, pfd_input[i])
        // console.log('line40', config_pfd[i])
        doms_obj = await make_append_pfd_component(doms_obj, config_pfd[i])
    } // for(let i=0;i<pfd_input_arr.length;i++)

    // 4. add EGTreeNode for wrapping all programs/tasks for ProjectTreeView.
    let config_programs = []
    for (let i = 0; i < pfd_input_arr.length; i++) {
        // The EGTreeNode is to be added to ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode(of a specific PFD)
        // 4a. Configuration of the EGTreeNode    
        config_programs[i] = await config_programs_function(config_pfd[i])
        // 4b. make and append the EGTreeNode that is to be appended to ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode(of a specific PFD)
        doms_obj = await make_append_egtreenode_programs(doms_obj, config_programs[i], config_pfd[i])
    } // for(let i=0;i<pfd_input_arr.length;i++)

    // 5. add tasks / shortcut to external sas files
    let task_input_arr = [
        {
            Element: {
                Label: 'PFD1_p1',
                ID: 'CodeTask-' + make_rand_string_by_length(16)
            },
            config_pfd: config_pfd[0],
            TaskGraphic: { ID: mymodules.generateUUID() },
            code: `/*PFD1 p1*/
data a; b=1; run;`
        },
        {
            Element: {
                Label: 'PFD1_p2',
                ID: 'CodeTask-' + make_rand_string_by_length(16)
            },
            config_pfd: config_pfd[0],
            TaskGraphic: { ID: mymodules.generateUUID() },
            code: `/*PFD1 p2*/
data c; set a; d=2; run;`
        },
        {
            Element: {
                Label: 'shortcut to sas.sas',
                ID: 'CodeTask-' + make_rand_string_by_length(16)
            },
            config_pfd: config_pfd[1],
            TaskGraphic: { ID: mymodules.generateUUID() },
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
        doms_obj = await make_append_task_component(doms_obj, config_task[i], targetzip_v7)
    } // for(let i=0;i<task_input_arr.length;i++)


    // 6. add shortcuts to external files
    // 6.1 shortcuttofile_input
    let shortcuttofile_input_arr = [
        {
            config_pfd: config_pfd[0],
            Element: { Label: 'shortcut to thexls.xlsx', ID: 'ExternalFile-' + make_rand_string_by_length(16) },
            ExternalFile: { FileTypeType: 'Excel', ShortCutList: { ShortCutID: 'ShortCutToFile-' + make_rand_string_by_length(16) } },
            TaskGraphic: { ID: mymodules.generateUUID() },
            DNA: { FullPath: String.raw`C:\Users\Z70\Desktop\thexls.xlsx` }
        },
        {
            config_pfd: config_pfd[1],
            Element: { Label: 'shortcut to Thai Green Curry _ RecipeTin Eats', ID: 'ExternalFile-' + make_rand_string_by_length(16) },
            ExternalFile: { FileTypeType: 'PDF', ShortCutList: { ShortCutID: 'ShortCutToFile-' + make_rand_string_by_length(16) } },
            TaskGraphic: { ID: mymodules.generateUUID() },
            DNA: { FullPath: String.raw`C:\Users\Z70\Desktop\Thai Green Curry _ RecipeTin Eats.pdf` }
        }
    ] // shortcuttofile_input_arr

    let config_shortcuttofile = []
    for (let i = 0; i < shortcuttofile_input_arr.length; i++) {
        // 1 configuration for shortcuttofile_component
        config_shortcuttofile[i] = await config_shortcuttofile_function(shortcuttofile_input_arr[i])
        // console.log('line133', config_shortcuttofile)

        // 2 make and append shortcuttofile_component
        doms_obj = await make_append_shortcuttofile_component(doms_obj, config_shortcuttofile[i])

    } // for(let i=0;i<shortcuttofile_input_arr.length;i++)

    // 7. add notes
    let note_input_arr = [
        {
            config_pfd: config_pfd[0],
            'Element': {
                'Label': 'Note1',
                'ID': 'Note-' + make_rand_string_by_length(16)
            },
            'TextElement': {
                'Text': String.raw` This is a note with <tag>, ampersand sign &, line breaker \n and /*comments*/
like data f; set g; run;`},
            'Note': { 'Collapsed': 'True' },
            'NoteGraphic': { 'ID': mymodules.generateUUID() } // use ID instead of .Id although the original tag is Id. Although the origina Tag Id is later changed to ID, it does not affect SAS recognizing it.
        },
    ]
    let config_note = []
    for (let i = 0; i < note_input_arr.length; i++) {
        // 1 configuration for note_component
        config_note[i] = await config_note_function(note_input_arr[i])
        // console.log('line140', config_note)
        // 2 make and append note_component
        doms_obj = await make_append_note_component(doms_obj, config_note[i])
    } // for(let i=0;i<shortcuttofile_input_arr.length;i++)

    // 8. add EG task 
    // Note: the Task_CLSID is not unique for each EGTask. A CLSID is a legitimate code to indicate a program (e.g., SAS, or VSCode, etc.) It is to tell the operation system (e.g., WINDOWS) that the program is not a malware
    // Such CLSID looks like a 32 bit GUID, but it has specific rules, and cannot be generated by mymodules.generateUUID(), or the alternative function 'uuid4()' (attached at the end of this program)
    let egtask_input_arr = [
        {
            Element: { Label: 'egtask1', ID: 'EGTask-' + make_rand_string_by_length(16) },
            // EGTask: { Task_CLSID: '660ed464-dab4-48ad-a1d9-452148b2cffe' },
            config_pfd: config_pfd[0],
            TaskGraphic: { ID: mymodules.generateUUID() },
            xmlstr: String.raw`<Settings version="7.1" source="&amp;RemoteTargetPath./statindins.sas7bdat" destination="&amp;localDataPath" resolveMacro="true" overwrite="true" fixCRLF="true" direction="DOWN" />`
        },
        {
            Element: { Label: 'egtask2', ID: 'EGTask-' + make_rand_string_by_length(16) },
            config_pfd: config_pfd[0],
            TaskGraphic: { ID: mymodules.generateUUID() },
            xmlstr: String.raw`<Settings version="7.1" source="&amp;RemoteTargetPath./statindins.sas7bdat" destination="&amp;localDataPath" resolveMacro="true" overwrite="true" fixCRLF="true" direction="DOWN" />`
        }
    ]
    let config_egtask = []
    for (let i = 0; i < egtask_input_arr.length; i++) {
        // 1 configuration for the task_component (indicate the parent PFD, and the task in task_input_arr)
        config_egtask[i] = await config_egtask_function(egtask_input_arr[i].config_pfd, egtask_input_arr[i])
        // console.log('line181', config_egtask[i])
        // 2 add task components
        doms_obj = await make_append_egtask_component(doms_obj, config_egtask[i], targetzip_v7)
    } // for(let i=0;i<task_input_arr.length;i++)

    // 9. add links
    let link_input_arr = [
        {
            Label: 'p1 to p2', ID: 'Link-' + make_rand_string_by_length(16),
            LinkFrom_config: config_task[0], LinkTo_config: config_task[1] // for manual setting, the link to and from component are defined by Link_config, for converting from v8, the link to and from component are defined by Link_IDs
        }
    ]
    for (let i = 0; i < link_input_arr.length; i++) {
        // 6.1 configuration for link_component
        let config_link = await config_link_function(link_input_arr[i])
        // console.log('line90', config_link)        

        // 6.2 make and append link_component
        doms_obj = await make_append_link_component(doms_obj, config_link)

    } // for(let i=0;i<link_input_arr.length;i++)

    let targetxmlstr_cleaned = await cleanup_targetxml(doms_obj, thesrcxmlstr_cleaned)
    // remove lines only containing spaces and line breakers
    let targetxmlstr = remove_spaces_linebreakers(targetxmlstr_cleaned)
    // console.log(targetxmlstr)
    targetxmlstr = '<?xml version="1.0" encoding="utf-16"?>\n' + targetxmlstr
    let thetargetxmlfile = 'data/out/' + config_project.Element.Label + '.xml'
    await mymodules.saveLocalTxtFile(targetxmlstr, thetargetxmlfile, 'utf16le');

    // using Buffer to import the xml with utf16 encoding
    targetzip_v7.addFile('project.xml', Buffer.from(targetxmlstr, "utf16le"))
    // writeZip the targetzip_v7 instead of the original (theZip)
    await targetzip_v7.writeZip("data/out/" + config_project.Element.Label + ".egp")
}; // async function make_v7_egp

// make and append egtask related components
async function make_append_egtask_component(doms_obj, config_egtask, targetzip_v7) {
    // // 1. within a PFD component's PFD tag (ProjectCollection.Elements.Element(PFD).PFD), add a process component with the egtaskID
    doms_obj = await make_append_egtask_process_component(doms_obj, config_egtask)

    // 2. within ProjectCollection.Elements, add a element tag for egtask (in which multiple tags are encompassed)
    doms_obj = await make_append_egtask_element_component(doms_obj, config_egtask)

    // // 3. within ProjectColletion.External_Objects.ProjectTreeView.EGTreeNode(for PFD1).EGTreeNode(for wrapping all programs/egtasks), add a EGTreeNode component
    doms_obj = await make_append_egtask_egtreenode_component(doms_obj, config_egtask)

    // // 4. within ProjectColletion.External_Objects.ProcessFlowView.Graphics, add a egtaskGraphic component
    doms_obj = await make_append_egtask_taskgraphic_component(doms_obj, config_egtask)
    // console.log('line215', config_egtask)
    // 5. add the program text and insert into the egp zip (only do it when the config_egtask.xmlstr is not null, e.g., the egtask is manually input instead of input from a v8 egp file
    if (config_egtask.xmlstr && config_egtask.xmlstr !== '') {
        // console.log('line218', config_egtask.xmlstr)
        let egtask_xmlstr = config_egtask.xmlstr
        // Note: the sas code file (code.sas) is of utf-8 encoding. Also, the egtask xml (EGegtask-<...id...>.xml) is also of utf-8. These are different from the project.xml (project.xml is of utf16le encoding)
        targetzip_v7.addFile(config_egtask.Element.ID + '\\' + config_egtask.Element.ID + '.xml', Buffer.from(egtask_xmlstr, "utf-8"))
    } // config_egtask.code

    return doms_obj

};//async function make_append_egtask_element_component

// configuration of the EGtask components
async function config_egtask_function(config_pfd, egtask_input) {
    let config_egtask = {}

    //1a. configuration for the element properties for the code task's Element component (the properties of the task)
    config_egtask.Element = {}
    config_egtask.Element.Label = egtask_input.Element.Label//'egtask1'
    config_egtask.Element.Type = 'TASK'
    // console.log('line811',config_pfd)
    config_egtask.Element.Container = config_pfd.Element.ID
    config_egtask.Element.ID = egtask_input.Element.ID
    config_egtask.Element.CreatedOn = config_pfd.Element.CreatedOn
    config_egtask.Element.ModifiedOn = config_pfd.Element.ModifiedOn
    config_egtask.Element.ModifiedBy = config_pfd.Element.ModifiedBy
    config_egtask.Element.ModifiedByEGID = config_pfd.Element.ModifiedByEGID

    //1b. configuration for the SubmitableElement components that are to be added to ProjectCollection.Elements.Element(PFD).Element(element of the curreant task)
    // there is nothing to change from the default config

    //1c. configuration for the EGTask components that are to be added to ProjectCollection.Elements.Element(PFD).Element(element of the curreant EGtask)
    config_egtask.Element.EGTask = {}
    if (egtask_input.EGTask && egtask_input.EGTask.Task_CLSID) { config_egtask.Element.EGTask.Task_CLSID = egtask_input.EGTask.Task_CLSID }

    //2. configuration for the process components that are to be added to ProjectCollection.Elements.Element(PFD).Element(element of the current EGtask)
    config_egtask.Process = {}
    config_egtask.Process.Element = {}
    config_egtask.Process.Element.ID = config_egtask.Element.ID

    //3. configuration for the EGTreeNode components that are to be added to ProjectCollection.External_Objects.EGTreeNode(of the task's parent PFD).EGTreeNode(for wrapping all programs/tasks)
    config_egtask.EGTreeNode = {}
    config_egtask.EGTreeNode.NodeType = 'NODETYPE_ELEMENT'
    config_egtask.EGTreeNode.ElementID = config_egtask.Element.ID
    config_egtask.EGTreeNode.Label = config_egtask.Element.Label

    //4. for the TaskGraphic components that are to be added to ProjectColletion.External_Objects.ProcessFlowView.Graphics
    config_egtask.TaskGraphic = {}
    // the TaskGraphic ID is different from the PFD or CodeTask ID (16-bit random strings. A 16-bit string is not a true 32-bit GUID), (it is a true 32 bit GUID)
    config_egtask.TaskGraphic.ID = egtask_input.TaskGraphic.ID
    config_egtask.TaskGraphic.Label = config_egtask.Element.Label
    config_egtask.TaskGraphic.Element = config_egtask.Element.ID
    if (egtask_input.TaskGraphic.PosX) { config_egtask.TaskGraphic.PosX = egtask_input.TaskGraphic.PosX }
    if (egtask_input.TaskGraphic.PosY) { config_egtask.TaskGraphic.PosY = egtask_input.TaskGraphic.PosY }

    // 5. SAS xml of the EGTask 
    if (egtask_input.xmlstr) { // .xmlstr is for manual input. When converting from a v8 egp, .xmlstr does not have value and this part is skipped. 
        config_egtask.xmlstr = egtask_input.xmlstr
    } //if (egtask_input.code)   

    return config_egtask
}; //async function config_egtask_function

//within ProjectColletion.External_Objects.ProcessFlowView.Graphics, add a TaskGraphic component
async function make_append_egtask_taskgraphic_component(doms_obj, config_egtask) {
    // 1a. make egtask_taskgraphic
    let egtask_taskgraphic_dom_obj = await make_taskgraphic_component(config_egtask.TaskGraphic)
    // console.log('line68', egtask_taskgraphic_dom_obj.prop('outerHTML'))

    // 1b. append task_taskgraphic components
    // The ProjectColletion.External_Objects.ProcessFlowView.Graphics is not specific by PFD
    // As such, there is no need to loop and find the specific PFD for the task_taskgraphic
    let the_graphic_dom_obj = $(doms_obj.find('External_Objects').find('ProcessFlowView').find('Graphics')[0])
    the_graphic_dom_obj.append(egtask_taskgraphic_dom_obj)

    return doms_obj
}; // async function make_append_task_taskgraphic_component 

// within ProjectColletion.External_Objects.ProjectTreeView.EGTreeNode(for PFD1), add a EGTreeNode component for the current EGTask
async function make_append_egtask_egtreenode_component(doms_obj, config_egtask) {
    // 1a. make egtask_egtreenode_component
    let egtask_egtreenode_dom_obj = await make_egtreenode(config_egtask.EGTreeNode)
    // console.log('line69', egtask_egtreenode_dom_obj.prop('outerHTML'))
    // 1b. append egtask_egtreenode_component
    // find all PFD EGTreeNode under Elements ProjectColletion.External_Objects.ProjectTreeView
    let the_egtreenode_pfd_dom_obj = get_egtreenode_of_pfd_by_pfdid(doms_obj, config_egtask.Element.Container)
    // console.log('line173', the_egtreenode_pfd_dom_obj.prop('outerHTML') )
    the_egtreenode_pfd_dom_obj.append(egtask_egtreenode_dom_obj)

    return doms_obj
}; // async function make_append_egtask_egtreenode_component 

// within ProjectCollection.Elements, add a element tag for egtask (in which multiple tags are encompassed)
async function make_append_egtask_element_component(doms_obj, config_egtask) {
    // 1. make the Element component and append to ProjectCollection.Elements (Type = "SAS.EG.ProjectElements.EGTask")
    let egtask_element_dom_obj = await make_egtask_element_component(config_egtask)
    // 2. append egtask_element_component
    $(doms_obj.find('Elements')[0]).append(egtask_element_dom_obj)
    return doms_obj
}; // async function make_append_egtask_element_component

// make the Element component and append to ProjectCollection.Elements (Type = "SAS.EG.ProjectElements.EGTask")
async function make_egtask_element_component(config_egtask) {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___k01_egtask_element_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line61', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
    let component_dom_obj = $(thesrcxmlstr_cleaned)

    // config the ProjectCollection.Elements.Element(of the egtask).Element
    let egtask_element_dom_obj = $(component_dom_obj.find('Element')[0])
    if (config_egtask.Element.Label) { $(egtask_element_dom_obj.find('Label')[0]).text(config_egtask.Element.Label) }
    if (config_egtask.Element.Container) { $(egtask_element_dom_obj.find('Container')[0]).text(config_egtask.Element.Container) }
    if (config_egtask.Element.ID) { $(egtask_element_dom_obj.find('ID')[0]).text(config_egtask.Element.ID) }
    if (config_egtask.Element.CreatedOn) { $(egtask_element_dom_obj.find('CreatedOn')[0]).text(config_egtask.Element.CreatedOn) }
    if (config_egtask.Element.ModifiedOn) { $(egtask_element_dom_obj.find('ModifiedOn')[0]).text(config_egtask.Element.ModifiedOn) }
    if (config_egtask.Element.ModifiedBy) { $(egtask_element_dom_obj.find('ModifiedBy')[0]).text(config_egtask.Element.ModifiedBy) }
    if (config_egtask.Element.ModifiedByEGID) { $(egtask_element_dom_obj.find('ModifiedByEGID')[0]).text(config_egtask.Element.ModifiedByEGID) }
    // could config more... 

    // // config the ProjectCollection.Elements.Element(of the egtask).SubmitableElement
    // let egtask_submitableelement_dom_obj = $(component_dom_obj.find('SubmitableElement')[0])
    // // could cofig more, e.g., HtmlStyleUrlOverride, SasReportStyleUrlOverride (location of the SAS Home)

    // configuration for the EGTask components that are to be added to ProjectCollection.Elements.Element(PFD).Element(element of the curreant EGtask)
    if (config_egtask.Element.EGTask.Task_CLSID) { $(component_dom_obj.find('EGTask').find('Task_CLSID')[0]).text(config_egtask.Element.EGTask.Task_CLSID) }

    return component_dom_obj

};//async function make_egtask_element_component

//within a PFD component's PFD tag (ProjectCollection.Elements.Element(PFD).PFD), add a process component with the egtaskID
async function make_append_egtask_process_component(doms_obj, config_egtask) {
    // console.log('line150', doms_obj)
    // 1a. make egtask_process            
    let egtask_process_doms_obj = await make_egtask_process_component(config_egtask)
    // console.log('line54', egtask_process_doms_obj.prop('outerHTML'))

    // 1b. append egtask_process to the corresponding PFD
    // find all PFD Elements under Elements
    let element_pfd_dom_obj = get_element_of_pfd_by_pfdid(doms_obj, config_egtask.Element.Container)
    $(element_pfd_dom_obj.find('PFD')[0]).append(egtask_process_doms_obj)

    return doms_obj
}; // async function make_append_egtask_process_component

// make process components for a task
async function make_egtask_process_component(config_egtask) {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___z05_process_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line57', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
    let component_dom_obj = $(thesrcxmlstr_cleaned)

    if (config_egtask.Process.Element.ID) { $(component_dom_obj.find('Element').find('ID')[0]).text(config_egtask.Process.Element.ID) }
    // could config more... 

    return component_dom_obj
};//async function make_task_process_component 

// convert str like ' <tag> & ' to '
// Note: the str must be in raw form (wrapped by String.raw``)
function convert_string_to_ampersand_symbols(str) {
    // must use tags like <textarea>, <div> not work
    let tmpstr = '<textarea>' + str + '</textarea>'
    let emp_dom_obj = $(tmpstr)
    let result = emp_dom_obj.html()
    // console.log(result)
    return (result)
}; // function convert_string_to_ampersand_symbols(str)

// make and append note_component
async function make_append_note_component(doms_obj, config_note) {
    // 1. make and append the element components
    doms_obj = await make_append_note_element_component(doms_obj, config_note)
    // 2. make and append the egtreenode components
    doms_obj = await make_append_note_egtreenode_component(doms_obj, config_note)
    // 3. make and append the notegraphic components
    doms_obj = await make_append_note_nodegraphic_component(doms_obj, config_note)
    return doms_obj
};//async function make_append_note_component(doms_obj, config_note)

// make and append the notegraphic components
async function make_append_note_nodegraphic_component(doms_obj, config_note) {
    // 1. make note_notegraphic
    let note_notegraphic_dom_obj = await make_notegraphic_component(config_note.NoteGraphic)
    // console.log('line168', note_notegraphic_dom_obj.prop('outerHTML'))

    // 2. append the NoteGraphic to ProjectColletion.External_Objects.ProcessFlowView.Graphics
    // Note: ProjectColletion.External_Objects.ProcessFlowView.Graphics is not specific by PFD
    let the_graphic_dom_obj = $(doms_obj.find('External_Objects').find('ProcessFlowView').find('Graphics')[0])
    the_graphic_dom_obj.append(note_notegraphic_dom_obj)

    return doms_obj
}; //async function make_append_note_nodegraphic_component(doms_obj, config_note)
// make note_notegraphic
async function make_notegraphic_component(config) {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___j02_note_notegraphic_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line177', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
    let component_dom_obj = $(thesrcxmlstr_cleaned)

    if (config.ID) { $(component_dom_obj.find('ID')[0]).text(config.ID) } // use ID instead of .Id although the original tag is Id
    if (config.Label) { $(component_dom_obj.find('Label')[0]).text(config.Label) }
    if (config.Element) { $(component_dom_obj.find('Element')[0]).text(config.Element) }
    if (config.Collapsed) { $(component_dom_obj.find('Collapsed')[0]).text(config.Collapsed) }

    if (config.PosX) { $(component_dom_obj.find('PosX')[0]).text(config.PosX) }
    if (config.PosY) { $(component_dom_obj.find('PosY')[0]).text(config.PosY) }
    if (config.WidthExpanded) { $(component_dom_obj.find('WidthExpanded')[0]).text(config.WidthExpanded) }
    if (config.HeightExpanded) { $(component_dom_obj.find('HeightExpanded')[0]).text(config.HeightExpanded) }
    // could config more... 

    return component_dom_obj
}//async function make_notegraphic_component(config_note.NoteGraphic)

// configuration for shortcut to external file
async function config_note_function(note_input) {
    let config_note = {}

    // 1. config for ProjectCollection.Elements.Element(for the note component)
    config_note.Element = {}
    config_note.Element.Element = {}
    // 1a. config for ProjectCollection.Elements.Element(for this noteToFile).Element
    config_note.Element.Element.Label = note_input.Element.Label
    config_note.Element.Element.ID = note_input.Element.ID
    config_note.Element.Element.Container = note_input.config_pfd.Element.ID
    config_note.Element.Element.CreatedOn = note_input.config_pfd.Element.CreatedOn
    config_note.Element.Element.ModifiedOn = note_input.config_pfd.Element.ModifiedOn
    config_note.Element.Element.ModifiedBy = note_input.config_pfd.Element.ModifiedBy
    config_note.Element.Element.ModifiedByEGID = note_input.config_pfd.Element.ModifiedByEGID
    // 1b. config for ProjectCollection.Elements.Element(for this noteToFile).Element.TextElement
    config_note.Element.TextElement = {}
    config_note.Element.TextElement.Text = note_input.TextElement.Text
    // 1c. config for ProjectCollection.Elements.Element(for this noteToFile).Element.Note
    config_note.Element.Note = {}
    config_note.Element.Note.Parent = config_note.Element.Element.Container
    config_note.Element.Note.Collapsed = note_input.Note.Collapsed ? note_input.Note.Collapsed : 'False'
    // and more...

    // 2. config for ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode(of the parent PFD).EGTreeNode
    config_note.EGTreeNode = {}
    config_note.EGTreeNode.NodeType = 'NODETYPE_ELEMENT'
    config_note.EGTreeNode.ElementID = config_note.Element.Element.ID
    config_note.EGTreeNode.Expanded = 'False'
    config_note.EGTreeNode.Label = config_note.Element.Element.Label

    // 3. config for ProjectCollection.External_Objects.ProcessFlowView.Graphics.NoteGraphic
    config_note.NoteGraphic = {}
    config_note.NoteGraphic.ID = note_input.NoteGraphic.ID //use ID instead of .Id although the original tag is Id. The tag name <Id> is different from the <ID> tag in other components. SAS EG really need to be more standardized in naming the tags! Although for this one SAS can recognize it even changed from Id to ID
    config_note.NoteGraphic.Label = config_note.Element.Element.Label
    config_note.NoteGraphic.Element = config_note.Element.Element.ID
    config_note.NoteGraphic.Collapsed = note_input.Note.Collapsed ? note_input.Note.Collapsed.toLowerCase() : 'false' // keep consistent with the Collpased setting in Note component (but in lower case here)
    if (note_input.NoteGraphic.PosX) { config_note.NoteGraphic.PosX = note_input.NoteGraphic.PosX }
    if (note_input.NoteGraphic.PosY) { config_note.NoteGraphic.PosY = note_input.NoteGraphic.PosY }
    if (note_input.NoteGraphic.WidthExpanded) { config_note.NoteGraphic.WidthExpanded = note_input.NoteGraphic.WidthExpanded }
    if (note_input.NoteGraphic.HeightExpanded) { config_note.NoteGraphic.HeightExpanded = note_input.NoteGraphic.HeightExpanded }

    return config_note
};// async function config_note_function(config_note)

// make and append the egtreenode components
async function make_append_note_egtreenode_component(doms_obj, config_note) {
    // 1. make note egtreenode 
    // 1. make shortcuttofile_egtreenode_component
    let note_egtreenode_component = await make_egtreenode(config_note.EGTreeNode)
    // 2. append the component to ProjectCollection.External_Objectives.EGTreeNode(of the parent PFD)
    // 2.1 find the parent PFD
    let the_egtreenode_pfd_dom_obj = get_egtreenode_of_pfd_by_pfdid(doms_obj, config_note.Element.Element.Container)
    // console.log('line173', the_egtreenode_pfd_dom_obj.prop('outerHTML') )
    the_egtreenode_pfd_dom_obj.append(note_egtreenode_component)
    return doms_obj
}; //async function make_append_note_egtreenode_component(doms_obj, config_note)

// make and append the element components
async function make_append_note_element_component(doms_obj, config_note) {
    // 1. make note element
    let note_element_component = await make_note_element_component(config_note)

    // 2. append note element to ProjectCollection.Elements
    $(doms_obj.find('Elements')[0]).append(note_element_component)
    return doms_obj
}; //async function make_append_note_element_component(doms_obj, config_note)

// make note's Element component 
async function make_note_element_component(config_note) {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___j01_note_element_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line104', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
    let component_dom_obj = $(thesrcxmlstr_cleaned)

    // config the ProjectCollection.Elements.Element(of this note).Element
    let element_element_dom_obj = $(component_dom_obj.find('Element')[0])
    // console.log('line160', element_element_dom_obj.prop('outerHTML') )
    // console.log('line161', config_note.ExternalFile ); return
    if (config_note.Element.Element.Label) { $(element_element_dom_obj.find('Label')[0]).text(config_note.Element.Element.Label) }
    if (config_note.Element.Element.Container) { $(element_element_dom_obj.find('Container')[0]).text(config_note.Element.Element.Container) }
    if (config_note.Element.Element.ID) { $(element_element_dom_obj.find('ID')[0]).text(config_note.Element.Element.ID) }
    if (config_note.Element.Element.CreatedOn) { $(element_element_dom_obj.find('CreatedOn')[0]).text(config_note.Element.Element.CreatedOn) }
    if (config_note.Element.Element.ModifiedOn) { $(element_element_dom_obj.find('ModifiedOn')[0]).text(config_note.Element.Element.ModifiedOn) }
    if (config_note.Element.Element.ModifiedBy) { $(element_element_dom_obj.find('ModifiedBy')[0]).text(config_note.Element.Element.ModifiedBy) }
    if (config_note.Element.Element.ModifiedByEGID) { $(element_element_dom_obj.find('ModifiedByEGID')[0]).text(config_note.Element.Element.ModifiedByEGID) }
    if (config_note.Element.Element.InputIDs) { $(element_element_dom_obj.find('InputIDs')[0]).text(config_note.Element.Element.InputIDs) }
    // could config more... 

    // config the ProjectCollection.Elements.Element(of the note).TextElement.Text
    let element_textelement_dom_obj = $(component_dom_obj.find('TextElement')[0])
    if (config_note.Element.TextElement.Text) {
        let note_text = config_note.Element.TextElement.Text
        // let note_text_convert_to_ampersandsymbols = convert_string_to_ampersand_symbols(note_text)
        // $(element_textelement_dom_obj.find('Text')[0]).text(note_text_convert_to_ampersandsymbols) 
        $(element_textelement_dom_obj.find('Text')[0]).text(note_text) // note_text contains ampersand_symbols, use text() to convert symbols (e.g., &lt;&gt; to <>)
    } // if (config_note.Element.TextElement.Text) { 
    // could config more...                   

    // config the ProjectCollection.Elements.Element(of the note).Note.Parent
    let element_note_dom_obj = $(component_dom_obj.find('Note')[0])
    if (config_note.Element.Note.Parent) { $(element_note_dom_obj.find('Parent')[0]).text(config_note.Element.Note.Parent) }
    if (config_note.Element.Note.Collapsed) { $(element_note_dom_obj.find('Collapsed')[0]).text(config_note.Element.Note.Collapsed) }

    return component_dom_obj

}; //async function make_note_element_component

// make and append shortcuttofile_component
/* 
1) in ProjectCollection.ExternalFileList, add a ExternalFile component, 
with children nodes of .Element, and .ExternalFile,  
in .ExternalFile.DNA, need to insert (again, as html) file location data
2) in ProjectCollection.Elements, add an Element component (Type="SAS.EG.ProjectElements.ShortCutToFile")
    with children nodes of .Element, .SHORTCUT (to indicate the ExternalFile ID defined in step 1), and .ShortCutToFile
3) in  ProjectCollection.External_Objects.ProjectTreeView, add a EGTreeNode under the parent PFD's EGTreeNode   
4) in ProjectCollection.External_Objects.ProcessFlowView.Graphics, add a TaskGraphic (TaskGraphic.Element refers to the ShortCutToFile ID defined in step 2)
*/
async function make_append_shortcuttofile_component(doms_obj, config_shortcuttofile) {
    // 1. make and append the externalfile components (in ProjectCollection.ExternalFileList, add a ExternalFile component, with children nodes of .Element, and .ExternalFile, )
    doms_obj = await make_append_shortcuttofile_externalfile_component(doms_obj, config_shortcuttofile)
    // 2. make and append the element components
    doms_obj = await make_append_shortcuttofile_element_component(doms_obj, config_shortcuttofile)
    // 3. make and append the egtreenode components
    doms_obj = await make_append_shortcuttofile_egtreenode_component(doms_obj, config_shortcuttofile)
    // 4. make and append the taskgraphic components
    doms_obj = await make_append_shortcuttofile_taskgraphic_component(doms_obj, config_shortcuttofile)
    return doms_obj
}; //async function make_append_shortcuttofile_component(doms_obj, config_shortcuttofile)

// configuration for shortcut to external file
async function config_shortcuttofile_function(shortcuttofile_input) {
    let config_shortcuttofile = {}

    //1. config for ProjectCollection.ExternalFileList.ExternalFile
    config_shortcuttofile.ExternalFile = {}
    // 1a. config for ExternalFile.Element
    config_shortcuttofile.ExternalFile.Element = {}
    config_shortcuttofile.ExternalFile.Element.Label = shortcuttofile_input.Element.Label
    config_shortcuttofile.ExternalFile.Element.ID = shortcuttofile_input.Element.ID
    config_shortcuttofile.ExternalFile.Element.CreatedOn = shortcuttofile_input.config_pfd.Element.CreatedOn
    config_shortcuttofile.ExternalFile.Element.ModifiedOn = shortcuttofile_input.config_pfd.Element.ModifiedOn
    config_shortcuttofile.ExternalFile.Element.ModifiedBy = shortcuttofile_input.config_pfd.Element.ModifiedBy
    config_shortcuttofile.ExternalFile.Element.ModifiedByEGID = shortcuttofile_input.config_pfd.Element.ModifiedByEGID
    // 1b. config for ExternalFile.ExternalFile
    config_shortcuttofile.ExternalFile.ExternalFile = {}
    config_shortcuttofile.ExternalFile.ExternalFile.ShortCutList = {}
    config_shortcuttofile.ExternalFile.ExternalFile.ShortCutList.ShortCutID = shortcuttofile_input.ExternalFile.ShortCutList.ShortCutID
    config_shortcuttofile.ExternalFile.ExternalFile.FileTypeType = shortcuttofile_input.ExternalFile.FileTypeType // the tag name has two Type which is obviously a mistake when developping the xml structure

    // 1b1. config for DNA
    config_shortcuttofile.ExternalFile.ExternalFile.DNA = {}
    if (shortcuttofile_input.DNA && shortcuttofile_input.DNA.html) { // use DNA.html if it exists (converting from v8)
        config_shortcuttofile.ExternalFile.ExternalFile.DNA.html = shortcuttofile_input.DNA.html
    } else if (shortcuttofile_input.DNA && shortcuttofile_input.DNA.FullPath) { // this is when externalfile components are manually imported
        let fullpath = shortcuttofile_input.DNA.FullPath
        fullpath = JSON.stringify(fullpath) // to ensure that the single backlash are replaced by \\
        // the stringify adds additional quotes around the path, the string is now like '"C:\\..."'
        // the following is to strip these additional quotes
        if (fullpath.substr(0, 1) === '"') { fullpath = fullpath.substring(1) }
        if (fullpath.substr(fullpath.length - 1, 1) === '"') { fullpath = fullpath.substr(0, fullpath.length - 1) }
        // console.log('line159', fullpath)
        let startpos = fullpath.lastIndexOf('\\')
        let filename = fullpath.substr(startpos + 1)
        config_shortcuttofile.ExternalFile.ExternalFile.DNA.DNA = {}
        config_shortcuttofile.ExternalFile.ExternalFile.DNA.DNA.Name = filename
        config_shortcuttofile.ExternalFile.ExternalFile.DNA.DNA.FullPath = fullpath
    }// if (shortcuttofile_input.DNA && shortcuttofile_input.DNA.FullPath)

    // 2. config for ProjectCollection.Elements.Element(for the shortcuttofile component, not for the ExternalFile component)
    config_shortcuttofile.Element = {}
    config_shortcuttofile.Element.Element = {}
    // 2a. config for ProjectCollection.Elements.Element(for this shortcuttofileToFile).Element
    config_shortcuttofile.Element.Element.Label = shortcuttofile_input.Element.Label
    config_shortcuttofile.Element.Element.ID = config_shortcuttofile.ExternalFile.ExternalFile.ShortCutList.ShortCutID // already created in step 1
    config_shortcuttofile.Element.Element.Container = shortcuttofile_input.config_pfd.Element.ID
    config_shortcuttofile.Element.Element.CreatedOn = shortcuttofile_input.config_pfd.Element.CreatedOn
    config_shortcuttofile.Element.Element.ModifiedOn = shortcuttofile_input.config_pfd.Element.ModifiedOn
    config_shortcuttofile.Element.Element.ModifiedBy = shortcuttofile_input.config_pfd.Element.ModifiedBy
    config_shortcuttofile.Element.Element.ModifiedByEGID = shortcuttofile_input.config_pfd.Element.ModifiedByEGID
    // 2b. config the parent ExternalFile ID for ProjectCollection.Elements.Element(for this shortcuttofileToFile).SHORTCUT
    config_shortcuttofile.Element.Element.SHORTCUT = {}
    config_shortcuttofile.Element.Element.SHORTCUT.Parent = config_shortcuttofile.ExternalFile.Element.ID

    // 3. config for ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode(of the parent PFD).EGTreeNode
    config_shortcuttofile.EGTreeNode = {}
    config_shortcuttofile.EGTreeNode.NodeType = 'NODETYPE_ELEMENT'
    config_shortcuttofile.EGTreeNode.ElementID = config_shortcuttofile.Element.Element.ID
    config_shortcuttofile.EGTreeNode.Expanded = 'True'
    config_shortcuttofile.EGTreeNode.Label = config_shortcuttofile.Element.Element.Label

    // 4. config for ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic
    config_shortcuttofile.TaskGraphic = {}
    config_shortcuttofile.TaskGraphic.ID = shortcuttofile_input.TaskGraphic.ID
    config_shortcuttofile.TaskGraphic.Label = config_shortcuttofile.Element.Element.Label
    config_shortcuttofile.TaskGraphic.Element = config_shortcuttofile.Element.Element.ID

    if (shortcuttofile_input.TaskGraphic.PosX) { config_shortcuttofile.TaskGraphic.PosX = shortcuttofile_input.TaskGraphic.PosX }
    if (shortcuttofile_input.TaskGraphic.PosY) { config_shortcuttofile.TaskGraphic.PosY = shortcuttofile_input.TaskGraphic.PosY }

    return config_shortcuttofile
};// async function config_shortcuttofile_function(config_shortcuttofile)

// make and append the taskgraphic components
async function make_append_shortcuttofile_taskgraphic_component(doms_obj, config_shortcuttofile) {
    // 1. make task_taskgraphic
    let shortcuttofile_taskgraphic_dom_obj = await make_taskgraphic_component(config_shortcuttofile.TaskGraphic)
    // console.log('line68', task_taskgraphic_dom_obj.prop('outerHTML'))

    // 2. append the shortcuttofile.TaskGraphic to ProjectColletion.External_Objects.ProcessFlowView.Graphics
    // Note: ProjectColletion.External_Objects.ProcessFlowView.Graphics is not specific by PFD
    let the_graphic_dom_obj = $(doms_obj.find('External_Objects').find('ProcessFlowView').find('Graphics')[0])
    the_graphic_dom_obj.append(shortcuttofile_taskgraphic_dom_obj)

    return doms_obj
};//async function make_append_shortcuttofile_taskgraphic_component

// make and append the egtreenode components
async function make_append_shortcuttofile_egtreenode_component(doms_obj, config_shortcuttofile) {
    // 1. make shortcuttofile_egtreenode_component
    let shortcuttofile_egtreenode_component = await make_egtreenode(config_shortcuttofile.EGTreeNode)

    // 2. append the component to ProjectCollection.External_Objectives.EGTreeNode(of the parent PFD)
    // 2.1 find the parent PFD
    let the_egtreenode_pfd_dom_obj = get_egtreenode_of_pfd_by_pfdid(doms_obj, config_shortcuttofile.Element.Element.Container)
    // console.log('line159', the_egtreenode_pfd_dom_obj.prop('outerHTML') )
    the_egtreenode_pfd_dom_obj.append(shortcuttofile_egtreenode_component)
    return doms_obj
};//async function make_append_shortcuttofile_egtreenode_component

// find the EGTreeNode of a PFD according to pfdid
function get_egtreenode_of_pfd_by_pfdid(doms_obj, pfdid) {
    // find all PFD EGTreeNode under Elements ProjectColletion.External_Objects.ProjectTreeView
    let egtreenode_pfd_doms_obj = $(doms_obj.find('External_Objects').find('ProjectTreeView').find('EGTreeNode'))
    // loop for each of such EGTreeNode elements, and identify the one with the same PFD ID as from the input pfdid
    for (let i = 0; i < egtreenode_pfd_doms_obj.length; i++) {
        let the_egtreenode_pfd_dom_obj = $(egtreenode_pfd_doms_obj[i])
        // get the textcontent of .ElementID tag of the_egtreenode_pfd_dom_obj
        let the_egtreenode_pfd_elementid_dom_obj = $(the_egtreenode_pfd_dom_obj.find('ElementID')[0])
        let the_pfd_id = the_egtreenode_pfd_elementid_dom_obj.text()
        // compare the_pfd_id with the pfd id in config_task.Element.Container (config_task.Element.Container)
        if (the_pfd_id && the_pfd_id === pfdid) {
            return the_egtreenode_pfd_dom_obj
            break
        } // if (the_pfd_id && the_pfd_id === pfdid )
    } // for (let i=0; i < egtreenode_pfd_doms_obj.length; i++)
}; // function get_egtreenode_of_pfd_by_pfdid (pfdid)

// make and append the element components
async function make_append_shortcuttofile_element_component(doms_obj, config_shortcuttofile) {
    // 1. make shortcuttofile_element_component
    let shortcuttofile_element_component = await make_shortcuttofile_element_component(config_shortcuttofile)

    // 2. append the component to ProjectCollection.ExternalFileList
    $(doms_obj.find('Elements')[0]).append(shortcuttofile_element_component)

    return doms_obj
};//async function make_append_shortcuttofile_element_component

//make shortcuttofile_element_component
async function make_shortcuttofile_element_component(config_shortcuttofile) {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___h02_shortcuttofile_element_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line104', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
    let component_dom_obj = $(thesrcxmlstr_cleaned)

    // config the ProjectCollection.Elements.Element(of this shortcuttofile).Element
    let element_element_dom_obj = $(component_dom_obj.find('Element')[0])
    // console.log('line160', element_element_dom_obj.prop('outerHTML') )
    // console.log('line161', config_shortcuttofile.ExternalFile ); return
    if (config_shortcuttofile.Element.Element.Label) { $(element_element_dom_obj.find('Label')[0]).text(config_shortcuttofile.Element.Element.Label) }
    if (config_shortcuttofile.Element.Element.Container) { $(element_element_dom_obj.find('Container')[0]).text(config_shortcuttofile.Element.Element.Container) }
    if (config_shortcuttofile.Element.Element.ID) { $(element_element_dom_obj.find('ID')[0]).text(config_shortcuttofile.Element.Element.ID) }
    if (config_shortcuttofile.Element.Element.CreatedOn) { $(element_element_dom_obj.find('CreatedOn')[0]).text(config_shortcuttofile.Element.Element.CreatedOn) }
    if (config_shortcuttofile.Element.Element.ModifiedOn) { $(element_element_dom_obj.find('ModifiedOn')[0]).text(config_shortcuttofile.Element.Element.ModifiedOn) }
    if (config_shortcuttofile.Element.Element.ModifiedBy) { $(element_element_dom_obj.find('ModifiedBy')[0]).text(config_shortcuttofile.Element.Element.ModifiedBy) }
    if (config_shortcuttofile.Element.Element.ModifiedByEGID) { $(element_element_dom_obj.find('ModifiedByEGID')[0]).text(config_shortcuttofile.Element.Element.ModifiedByEGID) }
    if (config_shortcuttofile.Element.Element.InputIDs) { $(element_element_dom_obj.find('InputIDs')[0]).text(config_shortcuttofile.Element.Element.InputIDs) }
    // could config more... 

    // config the ProjectCollection.Elements.Element(of the ShortCutToFile).ExternalFile.ExternalFile
    let element_shortcuttofile_dom_obj = $(component_dom_obj.find('SHORTCUT')[0])
    if (config_shortcuttofile.Element.Element.SHORTCUT.Parent) { $(element_shortcuttofile_dom_obj.find('Parent')[0]).text(config_shortcuttofile.Element.Element.SHORTCUT.Parent) }
    // could config more...                   

    // console.log('line129', component_dom_obj.prop('outerHTML'))
    return component_dom_obj
};//async function make_shortcuttofile_externalfile_component

// make and append the externalfile components
async function make_append_shortcuttofile_externalfile_component(doms_obj, config_shortcuttofile) {
    // console.log('line335', config_shortcuttofile)
    // 1. make shortcuttofile_externalfile_component
    let shortcuttofile_externalfile_component = await make_shortcuttofile_externalfile_component(config_shortcuttofile)

    // 2. append the component to ProjectCollection.ExternalFileList
    $(doms_obj.find('ExternalFileList')[0]).append(shortcuttofile_externalfile_component)

    return doms_obj
};//async function make_append_shortcuttofile_externalfile_component

//make shortcuttofile_externalfile_component
async function make_shortcuttofile_externalfile_component(config_shortcuttofile) {
    // console.log('line347', config_shortcuttofile)
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
    // console.log('line358', config_shortcuttofile.ExternalFile ); return
    if (config_shortcuttofile.ExternalFile.Element.Label) { $(externalfile_element_dom_obj.find('Label')[0]).text(config_shortcuttofile.ExternalFile.Element.Label) }
    if (config_shortcuttofile.ExternalFile.Element.Container) { $(externalfile_element_dom_obj.find('Container')[0]).text(config_shortcuttofile.ExternalFile.Element.Container) }
    if (config_shortcuttofile.ExternalFile.Element.ID) { $(externalfile_element_dom_obj.find('ID')[0]).text(config_shortcuttofile.ExternalFile.Element.ID) }
    if (config_shortcuttofile.ExternalFile.Element.CreatedOn) { $(externalfile_element_dom_obj.find('CreatedOn')[0]).text(config_shortcuttofile.ExternalFile.Element.CreatedOn) }
    // console.log('line368', config_shortcuttofile.ExternalFile.Element)
    // Note: it is important to have .CreatedOn, ModifiedOn, etc. If any of these tags are left blank (without textcontent), the SAS EGP cannot display the component
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
    let shortcuttofile_externalfile_externalfile_dna_dna_doms_obj = await make_dna_component(config_shortcuttofile.ExternalFile.ExternalFile.DNA)

    // 2. Note: unlike other components, the DNA part should be inserted as HTML (not textcontent) to ProjectCollection.Elements.Element(of the task).CodeTask.DNA
    // Make DNA HTML

    let dna_outerHTMLstr = make_dna_html(shortcuttofile_externalfile_externalfile_dna_dna_doms_obj)
    if (config_shortcuttofile.ExternalFile.ExternalFile.DNA.html) { // if the config contains DNA.html, use it directly. These are copied from a v8 epg file
        dna_outerHTMLstr = config_shortcuttofile.ExternalFile.ExternalFile.DNA.html
    } //if (config_shortcuttofile.ExternalFile.ExternalFile.DNA.html)

    // 3. insert dna_outerHTMLstr as html to ProjectCollection.ExternalFileList.ExternalFile(of this externalfile).DNA
    // Note: the differece between html() and text() is that for html, '&lt;' is kept as it was; while
    // for text(), '&lt;' is converted to '&amp;lt;', which cannot be recognized correctly by SAS EG
    $(component_dom_obj.find('ExternalFile').find('DNA')[0]).html(dna_outerHTMLstr)

    // could config more...                   

    // console.log('line129', component_dom_obj.prop('outerHTML'))
    return component_dom_obj
};//async function make_shortcuttofile_externalfile_component

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
    config_link.Element.Container = link_input.LinkFrom_config.Element.Container // !!!
    config_link.Element.ID = link_input.ID
    config_link.Element.CreatedOn = link_input.LinkFrom_config.Element.CreatedOn
    config_link.Element.ModifiedOn = link_input.LinkFrom_config.Element.ModifiedOn
    config_link.Element.ModifiedBy = link_input.LinkFrom_config.Element.ModifiedBy
    config_link.Element.ModifiedByEGID = link_input.LinkFrom_config.Element.ModifiedByEGID
    config_link.Element.InputIDs = link_input.LinkFrom_config.Element.ID

    //1b. configuration for the Log components of ProjectCollection.Elements.Element(PFD).Element(element of the curreant link)
    config_link.Log = {}
    config_link.Log.Parent = link_input.LinkFrom_config.Element.ID
    config_link.Log.LinkFrom = link_input.LinkFrom_config.Element.ID
    config_link.Log.LinkTo = link_input.LinkTo_config.Element.ID

    return config_link
}; //async function config_link_function(link_input)

// make and append task related components
async function make_append_task_component(doms_obj, config_task, targetzip_v7) {
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
        targetzip_v7.addFile(config_task.Element.ID + '\\code.sas', Buffer.from(task_sascodestr, "utf-8"))
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
async function make_dna_component(config) {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___z03_dna_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line104', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
    let component_dom_obj = $(thesrcxmlstr_cleaned)

    // set the DNA contents (for task shortcut to external .sas files)
    if (config.DNA) {// else if config.DNA is defined, set the .name and .fullpath. These are manually configured tasks (shortcuts to external .sas file)
        if (config.DNA.Name) { $(component_dom_obj.find('Name')[0]).text(config.DNA.Name) }
        if (config.DNA.FullPath) { $(component_dom_obj.find('FullPath')[0]).text(config.DNA.FullPath) }
    } //if (config.html)

    // console.log('line276', component_dom_obj.prop('outerHTML'))
    return component_dom_obj
}; // async function make_dna_component

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
    // console.log('line253', config_task.Embedded)
    if (config_task.Embedded && config_task.Embedded === 'False') {
        // console.log('line255',config_task.CodeTask.DNA.DNA)
        // 1. make task_dna component
        let task_element_codetask_dna_dna_doms_obj = await make_dna_component(config_task.CodeTask.DNA)
        // 2. Note: unlike other components, the DNA part should be inserted as HTML (not textcontent) to ProjectCollection.Elements.Element(of the task).CodeTask.DNA
        // Make DNA HTML
        let dna_outerHTMLstr = make_dna_html(task_element_codetask_dna_dna_doms_obj)
        if (config_task.CodeTask.DNA.html) { // if the config contains DNA.html, use it directly. These are copied from a v8 epg file
            dna_outerHTMLstr = config_task.CodeTask.DNA.html
        } //if (config_task.CodeTask.DNA.html)
        // console.log('line1188', dna_outerHTMLstr) 
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
    let task_taskgraphic_dom_obj = await make_taskgraphic_component(config_task.TaskGraphic)
    // console.log('line68', task_taskgraphic_dom_obj.prop('outerHTML'))

    // 1b. append task_taskgraphic components
    // The ProjectColletion.External_Objects.ProcessFlowView.Graphics is not specific by PFD
    // As such, there is no need to loop and find the specific PFD for the task_taskgraphic
    let the_graphic_dom_obj = $(doms_obj.find('External_Objects').find('ProcessFlowView').find('Graphics')[0])
    the_graphic_dom_obj.append(task_taskgraphic_dom_obj)

    return doms_obj
}; // async function make_append_task_taskgraphic_component 

//make task_taskgraphic
async function make_taskgraphic_component(config) {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___z04_taskgraphic_v7.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line57', thesrcxmlstr)

    // cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thesrcxmlstr)
    let component_dom_obj = $(thesrcxmlstr_cleaned)

    if (config.ID) { $(component_dom_obj.find('ID')[0]).text(config.ID) }
    if (config.Label) { $(component_dom_obj.find('Label')[0]).text(config.Label) }
    if (config.Element) { $(component_dom_obj.find('Element')[0]).text(config.Element) }
    // could config more... 

    if (config.PosX) { $(component_dom_obj.find('PosX')[0]).text(config.PosX) }
    if (config.PosY) { $(component_dom_obj.find('PosY')[0]).text(config.PosY) }

    return component_dom_obj

};//async function make_task_process_component

// within ProjectColletion.External_Objects.ProjectTreeView.EGTreeNode(for PFD1).EGTreeNode(for wrapping all programs/tasks), add a EGTreeNode component
async function make_append_task_egtreenode_component(doms_obj, config_task) {
    // 1a. make task_egtreenode_component
    let task_egtreenode_dom_obj = await make_egtreenode(config_task.EGTreeNode)
    // console.log('line69', task_egtreenode_dom_obj.prop('outerHTML'))
    // 1b. append task_egtreenode_component
    // find the parent PFD's EGTreeNode under Elements ProjectColletion.External_Objects.ProjectTreeView
    let egtreenode_pfd_dom_obj = get_egtreenode_of_pfd_by_pfdid(doms_obj, config_task.Element.Container)
    // find the EGTreeNode for Programs within the parent PFD's EGTreeNode
    let the_egtreenode_program_dom_obj = get_egtreenode_of_program_in_a_egtreenode_of_pfd(egtreenode_pfd_dom_obj)
    // append the task EGTreeNode to the EGTreeNode for Programs
    the_egtreenode_program_dom_obj.append(task_egtreenode_dom_obj)
    return doms_obj
}; // async function make_append_task_egtreenode_component  

// find the EGTreeNode for Programs within EGTreeNode of a specified parent PFD's 
function get_egtreenode_of_program_in_a_egtreenode_of_pfd(egtreenode_pfd_dom_obj) {
    // within egtreenode_pfd_dom_obj, find the first EGTreeNode of which the .NodeType's textcontent is 'NODETYPE_PROGRAMFOLDER'
    let egtreenode_program_egtreenode_pfd_doms_obj = $(egtreenode_pfd_dom_obj.find('EGTreeNode'))
    // loop for each of such EGTreeNode elements, and identify the program EGTreeNode, i.e. the one with NoteType.text() = 'NODETYPE_PROGRAMFOLDER' and Label.text()='Programs'
    for (let j = 0; j < egtreenode_program_egtreenode_pfd_doms_obj.length; j++) {
        let the_egtreenode_program_dom_obj = $(egtreenode_program_egtreenode_pfd_doms_obj[j])
        // console.log('line88', the_egtreenode_program_dom_obj)
        let nodetype_the_egtreenode_dom_obj = $(the_egtreenode_program_dom_obj.find('NodeType')[0])
        let nodetypetext = nodetype_the_egtreenode_dom_obj.text()
        // let label_the_egtreenode_dom_obj = $(the_egtreenode_program_dom_obj.find('Label')[0])
        // let labeltext = label_the_egtreenode_dom_obj.text()
        if (nodetypetext === 'NODETYPE_PROGRAMFOLDER') {
            // append the task_egtreenode_dom_obj to the current the_egtreenode_dom_obj
            return the_egtreenode_program_dom_obj
        } //if (nodetypetext_the_egtreenode_dom_obj === '' && labeltext_the_egtreenode_dom_obj === '')
    }//  for (let j = 0; j < the_egtreenode_program_egtreenode_pfd_doms_obj.length; j++)
}; //function get_egtreenode_of_programs_in_a_egtreenode_of_pfd(egtreenode_pfd_dom_obj)

//within a PFD component's PFD tag (ProjectCollection.Elements.Element(PFD).PFD), add a process component with the taskID
async function make_append_task_process_component(doms_obj, config_task) {
    // console.log('line150', doms_obj)
    // 1a. make task_process            
    let task_process_doms_obj = await make_task_process_component(config_task)
    // console.log('line54', task_process_doms_obj.prop('outerHTML'))

    // 1b. append task_process to the corresponding PFD
    // find all PFD Elements under Elements
    let element_pfd_dom_obj = get_element_of_pfd_by_pfdid(doms_obj, config_task.Element.Container)
    $(element_pfd_dom_obj.find('PFD')[0]).append(task_process_doms_obj)
    // console.log('line171', doms_obj)
    return doms_obj
}; // async function make_append_task_process_component 

// find all PFD Elements under Elements
function get_element_of_pfd_by_pfdid(doms_obj, pfdid) {
    let element_pfd_dom_obj = $(doms_obj.find('Elements').find('Element'))
    // loop for each of such Element elements, and identify the one with the same PFD ID as in config_task.Element.Container
    for (let i = 0; i < element_pfd_dom_obj.length; i++) {
        let the_element_pfd_dom_obj = $(element_pfd_dom_obj[i])
        // get the textcontent of .ElementID tag of the_element_pfd_dom_obj
        let the_element_pfd_element_id_dom_obj = $(the_element_pfd_dom_obj.find('Element').find('ID')[0])
        let the_pfd_id = the_element_pfd_element_id_dom_obj.text()
        // compare the_pfd_id with the input pfd id
        if (the_pfd_id && the_pfd_id === pfdid) {
            // return the found pfd dom obj
            return element_pfd_dom_obj
        } // if (the_pfd_id && the_pfd_id === config_pfd.Element.ID )
    } // for (let i=0; i < egtreenode_pfd_doms_obj.length; i++)        
};// function get_element_of_pfd_by_pfdid

// make process components for a task
async function make_task_process_component(config_task) {
    // load the prototype xml for the target component
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___z05_process_v7.xml'
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
    // console.log('line811',config_pfd)
    config_task.Element.Container = config_pfd.Element.ID
    config_task.Element.ID = task_input.Element.ID
    config_task.Element.CreatedOn = config_pfd.Element.CreatedOn
    config_task.Element.ModifiedOn = config_pfd.Element.ModifiedOn
    config_task.Element.ModifiedBy = config_pfd.Element.ModifiedBy
    config_task.Element.ModifiedByEGID = config_pfd.Element.ModifiedByEGID

    //1b. configuration for the SubmitableElement components that are to be added to ProjectCollection.Elements.Element(PFD).Element(element of the curreant task)
    // there is nothing to change from the default config

    //1c. configuration for the CodeTask components that are to be added to ProjectCollection.Elements.Element(PFD).Element(element of the curreant task)
    // For task as shortcut to external sas files, additional <DNA> components should be appended to ProjectCollection.Elements.Element(PFD).Element(element of the curreant task).CodeTask.DNA
    if (task_input.Embedded && task_input.Embedded === 'False' && task_input.DNA) {
        config_task.Embedded = task_input.Embedded
        config_task.CodeTask = {}
        config_task.CodeTask.DNA = {}

        // if the config contains DNA.html, use it directly. These are copied from a v8 epg file
        if (task_input.DNA.html) {
            config_task.CodeTask.DNA.html = task_input.DNA.html
        } else if (task_input.DNA.FullPath) {
            // if there is no DNA.html but DNA.FullPath, set DNA.Name and .FullPath. These are manually configured tasks
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
        }// if(task_input.DNA.html) else ...
        // console.log('line1474', config_task.CodeTask.DNA)

        // also, set config_task.CodeTask.Embedded to False. That tiny change controls whether the task is
        // a shortcut, or with SAS code embedded in the current EGP
        config_task.CodeTask.Embedded = task_input.Embedded

    } //  if (task_input.Embedded && task_input.Embedded ...)

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
    config_task.TaskGraphic.ID = task_input.TaskGraphic.ID
    config_task.TaskGraphic.Label = config_task.Element.Label
    config_task.TaskGraphic.Element = config_task.Element.ID
    if (task_input.TaskGraphic.PosX) { config_task.TaskGraphic.PosX = task_input.TaskGraphic.PosX }
    if (task_input.TaskGraphic.PosY) { config_task.TaskGraphic.PosY = task_input.TaskGraphic.PosY }

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
    config_pfd.Element.ID = pfd_input.ID
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
    config.Element.Label = "__testv7"
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
async function init_v7_doms_obj(config) {

    // 1. read the xml code from the prototype scala of project collection
    let thesrcxmlfile = 'data/in/prototype/__xml/egpv7/___a_projectcollection_v7.xml'
    // read the xml into a dom object
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await mymodules.readtxt(thesrcxmlfile, encoding);
    // console.log('line1616', thesrcxmlstr.substr(0, 100))

    // 2.remove the head '<?xml version="1.0" encoding="utf-16"?>'
    let thebodyxmlstr = thesrcxmlstr.split('encoding="utf-16"?>')[1]

    // 3.cleanup the xmlstr (removing strange chars, convert self-closing html, etc.) 
    let thesrcxmlstr_cleaned = cleanxmlstr(thebodyxmlstr)
    // console.log('line1623', thesrcxmlstr_cleaned.substr(0, 500))

    // 4. convert the cleaned xml str to a DOM (like <PROJECTCOLLECTION>...</PROJECTCOLLECTION>)
    let doms_obj = $(thesrcxmlstr_cleaned)
    // console.log('line1627', doms_obj.prop('outerHTML'))

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

    // console.log('line1657', doms_obj.prop('outerHTML'))

    return { "doms_obj_v7": doms_obj, "thesrcxmlstr_v7": thesrcxmlstr_cleaned }
};//async function init_v7_doms_obj

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
    // let thesrcxmlstr_ampersand_code_normalized = normalize_ampersand_code(thexmlstr_remove_nonprintable)
    // Note: second thought! do not convert ampersand symbols. These ampersand symbols are necessary for SAS EGP to identify settings within an xml tag from xmltag
    // for example within <DNA>  </DNA>, the html '&lt;DNA...&gt;DNA' has special meanings for SAS EG to identify (in this case, to identify the setting for location of an external file)
    // If the ampersand code '&lt;' is converted, SAS EG will wrongly consider it as an xml tag, and ignore the settings.  
    let thesrcxmlstr_ampersand_code_normalized = thexmlstr_remove_nonprintable

    // jsdom does not handle the tag <Table>A</Table> well
    // In that case, it alters the html to '<Table></Table>A' !
    // The following is to rename the tag <Table> to <Table123> to work around
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

// alternative methid to generate a GUID
// originally from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
function uuidv4() {
    const crypto = require('crypto');
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        //   (c ^ crypto.randomBytes(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        // crypto.randoBytes is decapricated
        // a GUID can be generated by node.js crptyo.randomUUID(). However, .randomUUID() is available for node version 15 and above
        // whereas mine is node.js v14, and netlify currently support node.js v12 only!
        // the following is a workaround, it works on my node v14.  
        (c ^ crypto.randomInt(64) & 15 >> c / 4).toString(16)
    );
}
// let guid4 =uuidv4()
// console.log('line176', guid4)