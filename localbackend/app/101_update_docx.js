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
return
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
    let notes_p_jq = new wxp([notestext], { 'w:val': "Normal" }).make().appendto(body_jq_src)

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

// get xml script from a src file
async function read_xml_from_src(srczip) {
    //*** read the src file data */
    // 1. read the script of document.xml from srczip
    let thesrcxmlfile_src = 'word/document.xml'
    let encoding = "utf-8"; // the srcxml is directly from an file file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr_src = await srczip.readAsText(thesrcxmlfile_src, encoding); // 'utf-16' type is called 'utf16le'
    // console.log('56:', thesrcxmlstr_src)
    // 2. remove the head line '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', and clean the srcxml ()
    let thebodyxmlstr_src = thesrcxmlstr_src.split('standalone="yes"?>')[1]
    let thesrcxmlstr_src_cleaned = cleanxmlstr(thebodyxmlstr_src)

    // 3. make a jq for the cleaned src xml
    let src_jq = $(thesrcxmlstr_src_cleaned)
    // console.log('line47', src_jq)
    return { 'jq_src': src_jq, 'theoriginsrcxmlstr_src': thesrcxmlstr_src }
}; //async function read_xml_from_src

// clean up the xmlstr
function cleanxmlstr(thexmlstr) {

    // to cleanup the nonprintable chars
    // let thexmlstr_remove_nonprintable = thexmlstr.replace(/[^\x20-\x7E\s\S]+/g, "")
    let thexmlstr_remove_nonprintable = thexmlstr

    // the xmlstr is messed up with strange chars like &amp;lt; &lt;, etc
    // The following is to change &amp;lt to <, &gt to > ...
    // let thesrcxmlstr_ampersand_code_normalized = normalize_ampersand_code(thexmlstr_remove_nonprintable)
    // Note: second thought! do not convert ampersand symbols. These ampersand symbols are necessary for SAS file to identify settings within an xml tag from xmltag
    // for example within <DNA>  </DNA>, the html '&lt;DNA...&gt;DNA' has special meanings for SAS EG to identify (in this case, to identify the setting for location of an external file)
    // If the ampersand code '&lt;' is converted, SAS EG will wrongly consider it as an xml tag, and ignore the settings.  
    let thesrcxmlstr_ampersand_code_normalized = thexmlstr_remove_nonprintable
    // console.log('79:', thesrcxmlstr_ampersand_code_normalized)

    // 1. jsdom does not handle the tag <Table>A</Table> well
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
    // console.log('288', thesrcxmlstr_selfclosing_converted)

    //3. remove the comments (code within <!--  and -->)
    let thesrcxmlstr_removecomments = removecomments(thesrcxmlstr_selfclosing_converted)
    // console.log(thesrcxmlstr_removecomments)

    return thesrcxmlstr_removecomments
}; //function cleanxmlstr(thexmlstr) 

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
    let matched_arr = str.match(/\<(.*)\/\>/)
    // console.log('324', matched_arr.length)
    if (matched_arr && matched_arr.length > 0) {
        let seg1 = matched_arr[1].split('<')
        // sometimes the lastmatchedstr is like GitSourceControl GUID="x2K5fW8CFtZy3Ke7"
        // in that case, the part after the first whitespace (GUID="x2K5fW8CFtZy3Ke7") should be excluded 
        let theLastMatchedStr = seg1[seg1.length - 1]
        // console.log(theLastMatchedStr)
        let theLastMatchedStr_tagName = theLastMatchedStr.split(' ')[0]
        // console.log(theLastMatchedStr_tagName)
        // replace <Others /> with <Others></<Others />
        let xhtmlstr = "<" + theLastMatchedStr + "/>"
        let htmlstr = "<" + theLastMatchedStr + ">" + "</" + theLastMatchedStr_tagName + ">"
        str = str.replace(xhtmlstr, htmlstr)
        let matched_arr2 = str.match(/\<(.*)\/\>/)
        if (matched_arr2 && matched_arr2.length > 0) {
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

// make a word paragraph xml
function wxp(text_arr, pStyleAttrs, pPrhtml, rPrhtml) {
    this.pPrhtml
    this.rPrhtml
    this.text_arr = text_arr
    this.pStyleAttrs = pStyleAttrs
    this.make = function () {
        // make an empty paragraph jq object
        let p_jq = new wxo('w:p').make()
        // if pStyleAttrs is defined, add tags for pStyle settings

        // add an empty w:pPr selector
        let p_pPr_jq = new wxo('w:pPr', null, pPrhtml).make()
        p_jq.append(p_pPr_jq)

        // add pStyle tag in w:pPr
        if (this.pStyleAttrs) {
            // append a pSytle selector in paragraph
            let pStyle_jq = new wxo('w:pStyle', pStyleAttrs).make()
            p_pPr_jq.append(pStyle_jq)
        }//

        // add w:r and w:t
        // if runs and text within are defined, make w:r and  w:t according to their runs within the paragraph
        if (text_arr) {
            text_arr.forEach(text => {
                // make a run
                let r_jq = new wxo('w:r', null, rPrhtml).make().appendto(p_jq)
                // make a text
                let t_jq = new wxo('w:t', null, null, text).make().appendto(r_jq)
            }) // text_arr.forEach
        } // if (text_arr)

        p_jq.appendto = function (parent_jq) {
            parent_jq.append(p_jq)
            return p_jq
        }
        return p_jq
    } //this.make = function
} // function wxp ()

// make a word xml object (wxo)
function wxo(tagname, attrs, html, text) {
    this.tagname = tagname,
        this.attrs = attrs,
        this.html = html,
        this.text = text,
        this.make = function () {
            // make an empty jquery object (_jq) of the input tagname
            let taghead = '<' + this.tagname + '>', tagend = '</' + this.tagname + '>'
            let theTag = taghead + tagend
            let _jq = $(theTag)
            // add html
            if (this.html) { _jq.html(this.html) }
            // add attributes
            if (this.attrs) {
                Object.keys(this.attrs).forEach(key => {
                    _jq.attr(key, this.attrs[key])
                })
            } // if (this.attrs && this.attrs.length >0)
            // add text contents
            if (this.text) { _jq.text(this.text) }//if (this.text)

            _jq.appendto = function (parent_jq) {
                parent_jq.append(_jq)
                return _jq
            }
            return _jq
        } // this.make
} // the word xml object (wxo)



// make a word tbl xml 
function wxtbl(tablename, width_cols_str, colheads_str, shdattrs_headrow, width_tbl, n_cols) {
    if (!tablename) (tablename = '')
    this.tablename = tablename
    this.width_cols_str = width_cols_str
    this.colheads_str = colheads_str
    this.shdattrs_headrow = shdattrs_headrow
    this.width_tbl = width_tbl
    this.n_cols = n_cols
    this.make = function () {
        if (!this.width_tbl) { this.width_tbl = '8000' }
        if (!this.n_cols) { this.n_cols = 1 }

        if (this.width_tbl && this.n_cols && !this.width_cols_str) {
            this.width_cols_str = ''
            for (let i = 0; i < this.n_cols; i++) {
                this.width_cols_str = this.width_cols_str + ',' + Math.floor(parseInt(this.width_tbl) / this.n_cols).toString()
            } // for(let i=0; i<this.n_cols-1; i++)
            // remove the heading ',' in the string
            this.width_cols_str = this.width_cols_str.substr(1)
        }

        let tbl_jq = new wxo('w:tbl', { "tablename": this.tablename }).make().append(
            new wxo('w:tblPr').make().append(
                new wxo('w:tblStyle', { 'w:val': 'TableGrid' }).make(),
            ) // new wxo('w:tblPr').make().append
        )// new wxo('w:tbl').make().append

        // define the cols
        let cols_width_arr = this.width_cols_str.split(',').map(x => { return { width: x.trim() } })
        let colheads_arr
        // if colheads_str is null or undefined, use cols_width_arr to make an array of elements of ''
        // that way, the table has at least one row with cells, and in each cell, there is a paragraph. 
        // a paragrah is mandated to have, otherwise WORD application reports error
        if (!this.colheads_str) {
            colheads_arr = this.width_cols_str.split(',').map(x => { return { colheadtext: '' } })
        } else {
            colheads_arr = this.colheads_str.split(',').map(x => { return { colheadtext: x.trim() } })
        } //if (! this.colheads_str) 

        // make the head row
        let headrow_jq = new wxo('w:tr').make()
        tbl_jq.append(headrow_jq)
        // loop for each col and set col
        let col_index = 0
        cols_width_arr.forEach(d => {
            // make the cells of the row
            let thecell_jq = new wxo('w:tc').make()
            // add a selector for cell property
            let thecell_pr_jq = new wxo('w:tcPr').make()
            thecell_jq.append(thecell_pr_jq)
            // set width
            thecell_pr_jq.append(new wxo('w:tcW', { 'w:w': d.width, 'w:type': 'dxa' }).make())

            // if fill is defined, set fill color
            if (this.shdattrs_headrow) {
                thecell_pr_jq.append(new wxo('w:shd', { ...this.shdattrs_headrow, ...{ 'w:type': 'dxa' } }).make())
            } //if (this.shdattrs_headrow) {

            // if header is defined, add header text
            if (colheads_arr) {
                // get the colhead of the corresponding column
                let colheadtext = colheads_arr[col_index].colheadtext
                // make a paragraph for the colheadtext
                // make the font in bold style
                let rPrhtml = `<w:rPr>
                <w:b/>
                <w:sz w:val="24" />
                <w:szCs w:val="24" /></w:rPr>`
                let p_jq = new wxp([colheadtext], null, null, rPrhtml ).make()
                // append the paragraph to the cell
                thecell_jq.append(p_jq)

            } // if (this.colheads_arr)

            // append the cell to the row
            headrow_jq.append(thecell_jq)

            col_index++

        }) // cols_width_arr.forEach
        update_cell_address_tbl(tbl_jq)
        // set the function appendto
        tbl_jq.appendto = function (parent_jq) {
            parent_jq.append(tbl_jq)
            return tbl_jq
        }
        return tbl_jq
    } // this.make = function
} // function wxtbl()

/***** functions for editing xml ********* */















/**common tools*************************************** */

// save to local file
async function saveLocalTxtFile(thetxtstr, targettxtfile, encoding) {
    encoding = encoding || 'utf-8' // by default using utf-8
    let fs = require('fs');
    // use writeFileSync instead of writeFile to avoid async problems
    fs.writeFileSync(targettxtfile, thetxtstr, encoding, function (err) {
        if (err) { console.log(err); }
    });
}; // saveLocalTxtFile





/**common tools*************************************** */
