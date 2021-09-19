/* To update an xlsx file according to the template */

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
const srcPath = 'data/in/do_not_git/analyst_doc/';
const srcFile = '__ad.xlsx';
const srcfilepath = srcPath + srcFile;
// target path
const targetFilePath = 'data/out/';
// targetFile name will be automatically named (srcFileName + '_totarget.file')

// make a zip instance of the thesrc src file file
const srczip = new AdmZip(srcfilepath);
const targetzip = new AdmZip();

(async () => {

    // make a xlsx
    await make_xlsx();

})()


/*** functions to make and write a xlsx*/

// convert a update a xlsx file
async function make_xlsx() {

    // 1. get xml script and src_jq from a src file
    let src_dict = await read_xmls_from_src(srczip)
    // console.log('45:',  jq_src.prop('outerHTML').substr(0,500))
    Object.keys(src_dict).forEach(async function (d) {
        // jq_src, theoriginsrcxmlstr_src
        // 1a. save the theoriginsrcxmlstr_src as a local file (for viewing the contents during coding)
        let xmlfile_src = targetFilePath + '__src_' + d + '.xml'
        let beautfied_theoriginsrcxmlstr_src = beautify(src_dict[d].theoriginsrcxmlstr_src, { format: 'xml' })
        await saveLocalTxtFile(beautfied_theoriginsrcxmlstr_src, xmlfile_src, 'utf-8');
    }) // Object.keys(src_xmls_dict).forEach


    // 2. set the init index for the shared values
    let si_index = 0
    // working on the template of sheet1 (the 'credential' sheet)

    // 3. make template of the sharedStrings sheet
    let body_jq_sharedStrings_src = src_dict['sharedStrings'].jq_src
    // console.log('61', body_jq_sharedStrings_src.prop('outerHTML'))
    body_jq_sharedStrings_src.empty()

    // 4. make rows in the credential sheet (sheet1): make 4 rows, each with one cell, in which add a v tag with the si_index as the textcontent 
    let body_jq_sheet1_src = $(src_dict['sheet1'].jq_src.find('sheetData')[0])
    body_jq_sheet1_src.empty()
    let cellvalues_arr = ['Project', 'Created by', 'Last modified on']
    // make the row jq
    for (let i = 1; i < 4; i++) {
        let row_jq = new wxo('row', { "r": parseInt(i), "spans": "1:1", "x14ac:dyDescent": "0.25" }).make().appendto(body_jq_sheet1_src)
        let cell_jq = new wxo('c', { "r": "A" + parseInt(i), "s": "1", "t": "s" }).make().appendto(row_jq)
        let v_cell_jq = new wxo('v', { si_index: parseInt(si_index) }, null, si_index).make().appendto(cell_jq)
        // let v_cell_jq = new wxo('v', null, null, si_index).make().appendto(cell_jq)

        // add the corresponding string values to body_jq_sharedStrings_src
        let si_jq = new wxo('si', { si_index: parseInt(si_index) }).make().appendto(body_jq_sharedStrings_src)
        let t_qj = new wxo('t', { si_index: parseInt(si_index) }, null, cellvalues_arr[i - 1]).make().appendto(si_jq)
        // update the count number in <sst>
        body_jq_sharedStrings_src.attr('count', parseInt(si_index+1))
        body_jq_sharedStrings_src.attr('uniquecount', parseInt(si_index+1))
        si_index++
    }// for (let i = 1; i<4;i++)

    // 5. make rows in the steps sheet (sheet2): make 1 rows  with 5 cells, in each add a v tag with the si_index as the textcontent 
    let body_jq_sheet2_src = $(src_dict['sheet2'].jq_src.find('sheetData')[0])
    body_jq_sheet2_src.empty()
    cellvalues_arr = ['Steps', 'Task', 'SAS Macros and other inputs', 'Source Code File', 'Output File']
    // make the row jq
    let row_jq = new wxo('row', { "r": "1", "spans": "1:5",  "s":"1", "customFormat":"1", "x14ac:dyDescent": "0.25" }).make().appendto(body_jq_sheet2_src)
    for (let i = 1; i < 6; i++) {
        let cell_jq = new wxo('c', { "r": String.fromCharCode(i + 64) + "1", "s": "1", "t": "s" }).make().appendto(row_jq)
        let v_cell_jq = new wxo('v', { si_index: parseInt(si_index) }, null, si_index).make().appendto(cell_jq)

        // add the corresponding string values to body_jq_sharedStrings_src
        let si_jq = new wxo('si', { si_index: parseInt(si_index) }).make().appendto(body_jq_sharedStrings_src)
        let t_qj = new wxo('t', { si_index: parseInt(si_index) }, null, cellvalues_arr[i - 1]).make().appendto(si_jq)
        // update the count number in <sst>
        body_jq_sharedStrings_src.attr('count', parseInt(si_index+1))
        body_jq_sharedStrings_src.attr('uniquecount', parseInt(si_index+1))
        si_index++
    }// for (let i = 1; i<6;i++)

    // 6. clean up the target xml
    for (let i=0; i<Object.keys(src_dict).length; i++){
        
        let d = Object.keys(src_dict)[i]

        // finalize the xml code text (clean up the target xml code)
        // 6a the src xml need to be cleaned as well before making the original tagname dict in cleanup_targetxml
        let thesrcxmlstr_cleaned2 = src_dict[d].theoriginsrcxmlstr_src.split('?>')[1]
        thesrcxmlstr_cleaned2 = thesrcxmlstr_cleaned2.replace(/\>/g, '>\n')
        thesrcxmlstr_cleaned2 = cleanxmlstr(thesrcxmlstr_cleaned2)
        // console.log('120', src_dict[d].jq_src.prop('outerHTML'))

        // 6b clean up the target xml (recover the orignal tagname and attr name, etc)
        let xmlstr_target_cleaned = await cleanup_targetxml(src_dict[d].jq_src, thesrcxmlstr_cleaned2)
        // console.log('122', xmlstr_target_cleaned)

        // console.log('124', xmlstr_target_cleaned.substr(530, 50))

        // 6c. save beatufied target xml
        xmlstr_target = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>\n' + xmlstr_target_cleaned
        src_dict[d].xmlstr_target = xmlstr_target
        // console.log('121', src_dict[d])
        xmlstr_target_beautified = beautify(xmlstr_target, { format: 'xml' })
        let xmlfile_target = targetFilePath + '__target_' + d + '.xml'
        await saveLocalTxtFile(xmlstr_target_beautified, xmlfile_target, 'utf-8');
    } // loop for each Object.keys(src_xmls_dict)

    // console.log('126', src_dict['sheet1'].xmlstr_target)
    // 7. make the targetzip obj
    // do not beautify the target xml file as it'll add line breakers to the textcontent!
    let xmlfiles_arr = ['xl/sharedStrings.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml']
    for (let i=0; i<xmlfiles_arr.length; i++){
        let d = xmlfiles_arr[i]
        let thexmlfilename = get_filename(d).name
        // console.log('134', thexmlfilename)
        srczip.deleteFile(d)
        // console.log('136', src_dict[thexmlfilename])
        srczip.addFile(d, Buffer.from(src_dict[thexmlfilename].xmlstr_target, "utf-8"))
    }// for (let i=0; i<xmlfiles_arr.length; i++)

    // 8. the amd-zip has a bug that theZip object (created from a zip) has error local header when using .toBuffer()
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

    // 9 save the targetzip obj as the target xlsx
    //determine the name of the target file.
    let target_filename = '__ad'
    // console.log ('99', target_filename)
    // save the target file. await targetzip.writeZip("data/out/" + config_project.Element.Label + "_totarget.file")
    await targetzip.writeZip(targetFilePath + target_filename + "_target.xlsx")

}; //async function make_xlsx()

/*** functions to make and write a xlsx*/


/***** functions for editing xml ********* */

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
            if (!(this.text === null || this.text === undefined)) { _jq.text(this.text) }//if (this.text)

            _jq.appendto = function (parent_jq) {
                parent_jq.append(_jq)
                return _jq
            }
            return _jq
        } // this.make
}; // the word xml object (wxo)


// get xml script from a src file
async function read_xmls_from_src(srczip) {
    /*** read the src file data 
        unlike handling docx file (which is to work on word/document.xml only), in an xlsx package there are 
        multiple (in this case 3) xml files to work on. These files are of two types: 
        1) the xl/sharedStrings.xml storing worksheet cell values, like:
        <si>
            <t>Steps</t>
        </si>
        2) the xl/worksheets/sheet1.xml and sheet2.xml storing the cell address
        <row r="1" spans="1:2" x14ac:dyDescent="0.25">
            <c r="A1" s="1" t="s">
                <v>0</v>
            </c>
        </row>
        the number 0 within the v tag is corresponding to the index number of the si tag in the sharedStrings.xml
        Thus, the cell "A1" (in this case, in sheet2) has a value of 'Steps'
        Note that sharedStrings.xml stores values from all worksheets. The only link is the index number of the si tag
    */
    let xmlfiles_arr = ['xl/sharedStrings.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml']
    let result = {}
    for (let i = 0; i < xmlfiles_arr.length; i++) {
        thexmlfile = xmlfiles_arr[i]
        // console.log('192', thexmlfile)
        // 0. get the file name
        let thexmlfilename = get_filename(thexmlfile).name
        // console.log('194', thexmlfilename)
        // 1. read the script of xl/sharedStrings.xml, xl/worksheets/sheet1.xml and xl/worksheets/sheet2.xml from srczip
        let thesrcxmlfile_src = thexmlfile
        let encoding = "utf-8"; // the srcxml is directly from an file file
        let thesrcxmlstr_src = await srczip.readAsText(thesrcxmlfile_src, encoding);
        // console.log('201:', thesrcxmlstr_src.substr(0, 300))
        // 2. remove the head line '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', and clean the srcxml ()
        let thebodyxmlstr_src = thesrcxmlstr_src.split('standalone="yes"?>')[1]
        let thesrcxmlstr_src_cleaned = cleanxmlstr(thebodyxmlstr_src)
        // console.log('246',thesrcxmlstr_src_cleaned)
        // 3. make a jq for the cleaned src xml
        let src_jq = $(thesrcxmlstr_src_cleaned)
        // console.log('248', src_jq.prop('innerHTML'))
        result[thexmlfilename] = { 'jq_src': src_jq, 'theoriginsrcxmlstr_src': thesrcxmlstr_src }
    } // for (let i in xmlfiles_arr)

    // console.log('line47', src_jq)
    return result //
}; //async function read_xmls_from_src

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
     1. the following is to convert  <Parameters /> to <Parameters></Parameters>
     */
     let thesrcxmlstr_selfclosing_converted = convertSelfClosingHTML_to_OldSchoolHTML(thesrcxmlstr_ampersand_code_normalized)
    //  console.log('287', thesrcxmlstr_selfclosing_converted)
    
    // Note: change self closing tags must precede renaming col to col123
    // otherwise the col tag is <col /> which cannot be recoginzed by the convert self closing function

    // 2. jsdom does not handle the tag <Table>A</Table> <col><col> well
    // In that case, it alters the html to '<Table></Table>A' !
    // The following is to rename the tag <col> to <col123> to work around
    let thesrcxmlstr_rename_col_col123 = rename_tag_named_col(thesrcxmlstr_selfclosing_converted)
    // console.log('297', thesrcxmlstr_rename_col_col123)   

    //3. remove the comments (code within <!--  and -->)
    let thesrcxmlstr_removecomments = removecomments(thesrcxmlstr_rename_col_col123)
    // console.log(thesrcxmlstr_removecomments)

    return thesrcxmlstr_removecomments
}; //function cleanxmlstr(thexmlstr) 

// jsdom does not handle the tag <col>A</col> well
// In that case, it alters the html to '<col></col>A' !
// The following is to rename the tag <col> to <col123> to work around
function rename_tag_named_col(thestr) {
    thestr = thestr.replace(/\<col\>/g, '<col123>')
    thestr = thestr.replace(/\<col /g, '<col123 ')
    thestr = thestr.replace(/\<\/col\>/g, '</col123>')
    // console.log('310', thestr)
    return thestr
}; // function rename_tag_named_col

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


// clean up the target xml (e.g., convert standardized tag names and attribute names to original case form, etc)
async function cleanup_targetxml(_jq, thesrcxmlstr_cleaned) {
    // 1. get the modified xmlstr
    let modified_xmlstr = _jq.prop('outerHTML')

    // change tag col123 to col
    modified_xmlstr=modified_xmlstr.replace(/\<col123 /g, '<col ')
    modified_xmlstr=modified_xmlstr.replace(/\<\/col123\>/g, '</col>')

    // 2. the program does not work well in identifying the tag names if there are two tags in a line
    // the following is to force line breaking between two tags. 
    // the forced line breakers are with special marks ('___123456___')
    // that way, after identifying the tag names, the target xml will be recovered to the original layout by removing these marked line breakers
    modified_xmlstr = modified_xmlstr.replace(/\>/g, '>\n___123456___\n')
    // console.log('133', modified_xmlstr)

    // 3a. make a dictionary to map out the standardized and original tagnames
    let originalTagnames_dict_crude = getOriginalTagNames_dict_crude(thesrcxmlstr_cleaned)
    originalTagnames_dict_crude = { ...originalTagnames_dict_crude, ...{ 'W:TRPR': 'w:trPr' } }
    // console.log('140', originalTagnames_dict_crude)
    // 3b. make a dictionary to map out the standardized and original attribute names
    let originalAttrNames_dict_crude = getOriginalAttrNames_dict_crude(thesrcxmlstr_cleaned)
    // console.log('145', originalAttrNames_dict_crude)

    // 4a. replacce the standardized tagnames (all in uppercase) to original names
    Object.keys(originalTagnames_dict_crude).forEach(d => {
        let theoriginal = originalTagnames_dict_crude[d]
        let regEx_normalized1 = new RegExp('\<' + d.toLowerCase() + '\x20', 'g')
        let regEx_normalized2 = new RegExp('\<' + d.toLowerCase() + '\>', 'g')
        let regEx_normalized3 = new RegExp('\<\/' + d.toLowerCase() + '>', 'g')
        modified_xmlstr = modified_xmlstr.replace(regEx_normalized1, '<' + theoriginal + ' ')
        modified_xmlstr = modified_xmlstr.replace(regEx_normalized2, '<' + theoriginal + '>')
        modified_xmlstr = modified_xmlstr.replace(regEx_normalized3, '</' + theoriginal + '>')
    })

    // 4b. replace the standardized attribute names (all in lowercase) to original names
    Object.keys(originalAttrNames_dict_crude).forEach(d => {
        let theoriginal = originalAttrNames_dict_crude[d]
        let regEx_normalized1 = new RegExp(d.toLowerCase() + '=', 'g')
        modified_xmlstr = modified_xmlstr.replace(regEx_normalized1, theoriginal + '=')
    })

    // 5. remove the '\n___123456___\n'
    modified_xmlstr = modified_xmlstr.replace(/\n___123456___\n/g, '')

    return modified_xmlstr
}; //async function cleanup_targetxml()

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
    // console.log("line205", matched_arr1[0])
    let matched_arr2 = [...thexhmlstr.matchAll(/\<(.*) \/\>/g)]
    // console.log("matched_arr1", matched_arr1.length)
    // console.log("matched_arr2", matched_arr2)
    /** each element of the array is like the following, in which the second element is the text of the origianl tagname
        ['<Tag6 />','Tag6', ...]
    */
    // the following is to push such a second element into the final arr with distinct tagNames
    matched_arr1.forEach(d => {
        // console.log(d[1])
        let theTag = d[1].split(' ')[0]
        if (!Object.keys(orignalTagnames_dict).includes(theTag.toUpperCase())) {
            orignalTagnames_dict[theTag.toUpperCase()] = theTag
        }
    })
    matched_arr2.forEach(d => {
        let theTag = d[1].split(' ')[0]
        if (!Object.keys(orignalTagnames_dict).includes(theTag.toUpperCase())) {
            orignalTagnames_dict[theTag.toUpperCase()] = theTag
        }
    })
    return orignalTagnames_dict
}; // function getOriginalTagNames(thexhmlstr)


/***** functions for editing xml ********* */


/**common tools*************************************** */

// get a dict of path, name, and extention name of a file
// Note: the full path string of the file must be give as String.raw``
// let filename_with_path = String.raw`data\in\prototype\__xml/egpv7\__egtask_example.xml`
function get_filename(filename_with_path) {
    // console.log(filename_with_path)
    // convert backslash to slash
    filename_with_path = filename_with_path.replace(/\\/g, '/')
    // console.log(filename_with_path)
    let startpos_slash = filename_with_path.lastIndexOf('/')
    let filename_with_ext = filename_with_path.substr(startpos_slash + 1)
    let startpos_dot = filename_with_ext.lastIndexOf('.')
    let path = filename_with_path.substring(0, startpos_slash)
    let name = filename_with_ext.substring(0, startpos_dot)
    let ext = filename_with_ext.substr(startpos_dot + 1)
    return { path: path, name: name, ext: ext }
}; // function get_filename(filename_with_path)

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
