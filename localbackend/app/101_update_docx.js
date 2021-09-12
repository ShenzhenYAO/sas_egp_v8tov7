/* To update a word docx file according to the template */

// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

// https://www.npmjs.com/package/adm-zip
const AdmZip = require('adm-zip');
const { config, setgroups } = require('process');

const beautify = require('beautify');


// src and target file settings:
// src path and file file name:
const srcPath = 'data/in/do_not_git/research_doc/';
const srcFile = '__rd.docx';
const srcfilepath = srcPath + srcFile;//"data/in/sample_a_src.file";
// target path
const targetFilePath = 'data/out/';
// targetFile name will be automatically named (srcFileName + '_totarget.file')

// const targetfile = "data/in/do_not_git/src and target samples/sample3_src.file";
// make a zip instance of the thesrc src file file
const srczip = new AdmZip(srcfilepath);
const targetzip = new AdmZip();

(async () => {

    // make a docx
    await make_docx();

})()

/*** functions to make and write a docx*/

// convert a update a docx file
async function make_docx() {

    // 1. get xml script and src_jq from a src file
    let { jq_src, theoriginsrcxmlstr_src } = await read_xml_from_src(srczip)
    // console.log('45:',  jq_src.prop('outerHTML').substr(0,500))

    // 2a. save the theoriginsrcxmlstr_src as a local file (for viewing the contents during coding)
    let xmlfile_src = targetFilePath + '__src_document.xml'
    let beautfied_theoriginsrcxmlstr_src = beautify(theoriginsrcxmlstr_src, { format: 'xml' })
    // await mymodules.saveLocalTxtFile(theoriginsrcxmlstr_v8, thetargetv8xmlfile, 'utf16le');
    await saveLocalTxtFile(beautfied_theoriginsrcxmlstr_src, xmlfile_src, 'utf-8');

    // 2 identify the body jq_src, for tagnames with ':', need to add escape symbol (\\, must be \\, not \) and make it as \\:
    let body_jq_src = $(jq_src.find('w\\:body')[0])

    // 3 remove the exsiting contents within body xml
    body_jq_src.empty()

    // 4 add a paragraph for title
    let titlestr = 'The greatest research project ever in human history'
    let title_p_jq = new wxp([titlestr], { 'w:val': "Title" }).make().appendto(body_jq_src)

    // 5 add a table for credential (created by, last modified on ...)
    let credential_tbl_jq = new wxtbl('credential', '2093, 11083').make().appendto(body_jq_src)
    // body_jq_src.append(credential_tbl_jq)
    // add a new row to credential_tbl_jq 
    let credential_tr2_jq = new wxtr('2093, 11083').make().appendto(credential_tbl_jq)

    //6 add contents to cells 1,1 and 2,1 of the credential table
    let ps_jq = new wxp(['Created by']).make()
    change_cell_contents(credential_tbl_jq, '1,1', ps_jq)
    ps_jq = new wxp(['Last modified on']).make()
    change_cell_contents(credential_tbl_jq, '2,1', ps_jq)

    ps_jq = new wxp(['Shenzhen Yao']).make()
    change_cell_contents(credential_tbl_jq, '1,2', ps_jq)
    ps_jq = new wxp(['2021-09-10']).make()
    change_cell_contents(credential_tbl_jq, '2,2', ps_jq)

    // 7 add a paragraph for notes
    let notestext = 'Notes:'
    let notes_p_jq = new wxp([notestext], { 'w:val': "Normal" }).make()
    body_jq_src.append(notes_p_jq)

    //8 add a table for research steps
    let steps_tbl_jq = new wxtbl('steps', '3294, 5461, 3119, 1302', 'Steps, Criteria, Rationale, Modified on', { "w:fill": "D9D9D9" }).make().appendto(body_jq_src)
    // body_jq_src.append(steps_tbl_jq)

    // add a row to steps table for the text Objective 1 ({"w:val":"4"} to merge 4 colums)
    new wxtr('11874', null, { "w:val": "4" }).make().appendto(steps_tbl_jq)
    ps_jq = [
        new wxp(['Objective 1:']).make()
    ]
    change_cell_contents(steps_tbl_jq, '2,1', ps_jq)

    new wxtr('3294, 5461, 3119, 1302').make().appendto(steps_tbl_jq)
    ps_jq = [
        new wxp(['Create the cohort of new statin users']).make()
    ]
    change_cell_contents(steps_tbl_jq, '3,1', ps_jq)
    let pPrhtml = `<w:pStyle w:val="ListParagraph" />
    <w:numPr>
        <w:ilvl w:val="0" />
        <w:numId w:val="1" /></w:numPr>`
    ps_jq = [
        new wxp(['index date (date of first statin dispensation) between Jan 1, 2010 and Dec 31, 2017;'], null, pPrhtml).make(),
        new wxp(['continously covered in PHRS within 5 years prior to the index date through 1 year after the index date;'], null, pPrhtml).make(),
        new wxp(['age on index date > = 18.'], null, pPrhtml).make()
    ]
    change_cell_contents(steps_tbl_jq, '3,2', ps_jq)


    // 9 set sector properties
    body_jq_src.append(`<w:sectPr w:rsidR="00206C6A" w:rsidSect="005E006C">
    <w:pgSz w:w="15840" w:h="12240" w:orient="landscape" />
    <w:pgMar w:top="1800" w:right="1440" w:bottom="1800" w:left="1440" w:header="708"
    w:footer="708" w:gutter="0" />
    <w:cols w:space="708" />
    <w:docGrid w:linePitch="360" /></w:sectPr>`)


    //10 the src xml need to be cleaned as well before making the original tagname dict in cleanup_targetxml
    let thesrcxmlstr_cleaned2 = theoriginsrcxmlstr_src.split('?>')[1]
    thesrcxmlstr_cleaned2 = thesrcxmlstr_cleaned2.replace(/\>/g, '>\n')
    thesrcxmlstr_cleaned2 = cleanxmlstr(thesrcxmlstr_cleaned2)

    //11 clean up the target xml (recover the orignal tagname and attr name, etc)
    let xmlstr_target_cleaned = await cleanup_targetxml(jq_src, thesrcxmlstr_cleaned2)
    // console.log('86', xmlstr_target_cleaned)

    // 12. save converted target project xml
    xmlstr_target = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>\n' + xmlstr_target_cleaned
    xmlstr_target_beautified = beautify(xmlstr_target, { format: 'xml' })
    let xmlfile_target = targetFilePath + '__target_document.xml'
    await saveLocalTxtFile(xmlstr_target_beautified, xmlfile_target, 'utf-8');

    // do not beautify the target xml file as it'll add line breakers to the textcontent!
    // 13 .add converted project.xml to target target file.  using Buffer to import the xml with utf16 encoding
    srczip.deleteFile('word/document.xml')
    srczip.addFile('word/document.xml', Buffer.from(xmlstr_target, "utf-8"))

    // 14 the amd-zip has a bug that theZip object (created from a zip) has error local header when using .toBuffer()
    // when saving theZip to a local file (e.g., theZip.writeZip(), the files within the written zip can be corrupted)
    // the work around is to migrate the files into a new zip! 
    let zipEntries = await srczip.getEntries()
    for (let i = 0; i < zipEntries.length; i++) {
        let d = zipEntries[i]

        // read each file into a str
        let thefilestr = await srczip.readAsText(d.entryName, 'utf-8')
        // console.log(thefilestr.substring(0,10))
        await targetzip.addFile(d.entryName, Buffer.from(thefilestr, "utf-8"))
    }

    //15. determine the name of the target file.
    let target_filename = get_filename(srcFile).name
    // console.log ('99', target_filename)
    // save the target file. await targetzip.writeZip("data/out/" + config_project.Element.Label + "_totarget.file")
    await targetzip.writeZip(targetFilePath + target_filename + "_target.docx")


}; //async function make_docx()



/*** functions to make and write a docx*/







/***** functions for editing xml ********* */



/***** functions for editing xml ********* */





/**common tools*************************************** */





/**common tools*************************************** */
