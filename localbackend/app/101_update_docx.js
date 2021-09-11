/* To update a word docx file according to the template 
*/

// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

// https://www.npmjs.com/package/adm-zip
const AdmZip = require('adm-zip');
const { config } = require('process');

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

    // //2a. save the theoriginsrcxmlstr_src as a local file (for viewing the contents during coding)
    let xmlfile_src = targetFilePath + '__src_document.xml'
    let beautfied_theoriginsrcxmlstr_src = beautify(theoriginsrcxmlstr_src, {format: 'xml'})
    // await mymodules.saveLocalTxtFile(theoriginsrcxmlstr_v8, thetargetv8xmlfile, 'utf16le');
    await saveLocalTxtFile(beautfied_theoriginsrcxmlstr_src, xmlfile_src, 'utf-8');

    // identify the body jq_src, for tagnames with ':', need to add escape symbol (\\, must be \\, not \) and make it as \\:
    let body_jq_src =  $(jq_src.find('w\\:body')[0])

    /** identify the title, which is:
     a w:p tag within body_jq_src, with a descending node 'w:pPr' > 'w:pStyle', of which the attr 'w:val' is 'Title
    */
   let paragraphs_jq_src = $(body_jq_src.find('w\\:p'))
   let title_paragraph_jq
   for (let i=0; i<paragraphs_jq_src.length; i++){ //
        let this_jq = $(paragraphs_jq_src[i])
        // if this_jq is  with a descending node 'w:pPr' > 'w:pStyle', of which the attr 'w:val' is 'Title'
        let style_jq = $(this_jq.find('w\\:pPr > w\\:pStyle')[0])
        // console.log('64:', style_jq.attr('w:val'))
        let style_str;
        if (style_jq) {style_str = style_jq.attr('w:val')}
        if (style_str === 'Title'){
            title_paragraph_jq = this_jq
            break
        }
   } // for (let i=0; i<paragraphs_jq.length; i++)

   //within title_paragraph_jq, find a 'w:r' select with text() = 'Project Title'
   let text_jqs_src = $(title_paragraph_jq.find('w\\:r > w\\:t'))
   for (let i=0; i < text_jqs_src.length; i++){ //
        let this_jq = $(text_jqs_src[i])
        // console.log('78', this_jq.text() )
        if (this_jq.text() === 'Project Title'){this_jq.text('Project Tit___')}
   } // for (let i=0; i<paragraphs_jq_src.length; i++)

    let thesrcxmlstr_cleaned2=theoriginsrcxmlstr_src.split('?>')[1]
    thesrcxmlstr_cleaned2=thesrcxmlstr_cleaned2.replace(/\>/g, '>\n')
    thesrcxmlstr_cleaned2=cleanxmlstr(thesrcxmlstr_cleaned2)
    // console.log('84', thesrcxmlstr_cleaned2)
    // thesrcxmlstr_cleaned2 = beautify(thesrcxmlstr_cleaned2, {format: 'xml'})
    let xmlfile_target2 = targetFilePath + '__srcdoc2.xml'
    await saveLocalTxtFile(thesrcxmlstr_cleaned2, xmlfile_target2, 'utf-8');

    let xmlstr_target_cleaned = await cleanup_targetxml(jq_src, thesrcxmlstr_cleaned2)
    // console.log('86', xmlstr_target_cleaned)

    // 3. save converted target project xml
    xmlstr_target = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>\n' + xmlstr_target_cleaned
    xmlstr_target = beautify(xmlstr_target, {format: 'xml'})
    let xmlfile_target = targetFilePath + '__target_document.xml'
    await saveLocalTxtFile(xmlstr_target, xmlfile_target, 'utf-8');

    //4.add converted project.xml to target target file.  using Buffer to import the xml with utf16 encoding
    srczip.deleteFile('word/document.xml')
    srczip.addFile('word/document.xml', Buffer.from(xmlstr_target, "utf-8"))

    // the amd-zip has a bug that theZip object (created from a zip) has error local header when using .toBuffer()
    // when saving theZip to a local file (e.g., theZip.writeZip(), the files within the written zip can be corrupted)
    // the work around is to migrate the files into a new zip! 
    let zipEntries = await srczip.getEntries()
    for (let i=0;i<zipEntries.length;i++){
        let d = zipEntries[i]

        // read each file into a str
        let thefilestr = await srczip.readAsText(d.entryName, 'utf-8')
        // console.log(thefilestr.substring(0,10))
        await targetzip.addFile(d.entryName, Buffer.from(thefilestr, "utf-8"))
    }

        //4a. determine the name of the target file.
        let target_filename = get_filename(srcFile).name
        // console.log ('99', target_filename)
    

    //4b. save the target file. await targetzip.writeZip("data/out/" + config_project.Element.Label + "_totarget.file")
    await targetzip.writeZip(targetFilePath + target_filename + "_target.docx")


}; //async function convert_src_to_target


// clean up the target xml (e.g., convert standardized tag names and attribute names to original case form, etc)
async function cleanup_targetxml(doms_obj, thesrcxmlstr_cleaned) {
    // 1. get the modified xmlstr
    let modified_xmlstr = doms_obj.prop('outerHTML')

    // 2. the program does not work well in identifying the tag names if there are two tags in a line
    // the following is to force line breaking between two tags. 
    // the forced line breakers are with special marks ('___123456___')
    // that way, after identifying the tag names, the target xml will be recovered to the original layout by removing these marked line breakers
    modified_xmlstr = modified_xmlstr.replace(/\>/g, '>\n___123456___\n')
    // console.log('133', modified_xmlstr)

    // 4a. make a dictionary to map out the standardized and original tagnames
    let originalTagnames_dict_crude = getOriginalTagNames_dict_crude(thesrcxmlstr_cleaned)
    console.log('140', originalTagnames_dict_crude)
    // 4b. make a dictionary to map out the standardized and original attribute names
    let originalAttrNames_dict_crude = getOriginalAttrNames_dict_crude(thesrcxmlstr_cleaned)
    console.log('145', originalAttrNames_dict_crude)

    // 5a. replacce the standardized tagnames (all in uppercase) to original names
    Object.keys(originalTagnames_dict_crude).forEach(d => {
        let theoriginal = originalTagnames_dict_crude[d]
        let regEx_normalized1 = new RegExp('\<' + d.toLowerCase() + '\x20', 'g')
        let regEx_normalized2 = new RegExp('\<' + d.toLowerCase() + '\>', 'g')
        let regEx_normalized3 = new RegExp('\<\/' + d.toLowerCase() + '>', 'g')
        modified_xmlstr = modified_xmlstr.replace(regEx_normalized1, '<' + theoriginal + ' ')
        modified_xmlstr = modified_xmlstr.replace(regEx_normalized2, '<' + theoriginal + '>')
        modified_xmlstr = modified_xmlstr.replace(regEx_normalized3, '</' + theoriginal + '>')
    })

    // 5b. replacce the standardized attribute names (all in lowercase) to original names
    Object.keys(originalAttrNames_dict_crude).forEach(d => {
        let theoriginal = originalAttrNames_dict_crude[d]
        let regEx_normalized1 = new RegExp(d.toLowerCase() + '=', 'g')
        modified_xmlstr = modified_xmlstr.replace(regEx_normalized1, theoriginal + '=')
    })

    // 6. remove the '\n___123456___\n'
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
    console.log('288', thesrcxmlstr_selfclosing_converted)

    //3. remove the comments (code within <!--  and -->)
    let thesrcxmlstr_removecomments = removecomments(thesrcxmlstr_selfclosing_converted)
    // console.log(thesrcxmlstr_removecomments)

    return thesrcxmlstr_removecomments
}; //function cleanxmlstr(thexmlstr) 


// change &amp;lt to <,  &gt to > ...
function normalize_ampersand_code(thestr) {
    /* quite annoying! need to change escape &amp;lt to __sasdeeplyscrewedamplt__ 
        For unknown reason, SAS EG creates these escape chars in project.xml
        these chars may cause error during conversion ()  if not replaced.
        When the converted target xmlstr is ready, restore these escape chars. 
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


// read text from a local file
async function readtxt(thetextfile, encode) {
    if (encode === undefined) {
        encode = 'utf8'
    }
    let fs = require('fs'), data;
    try {
        data = fs.readFileSync(thetextfile, encode);
        // console.log(data.toString());    
    } catch (e) {
        console.log('Error:', e.stack);
    }
    return data
}; // async function readtxt(thetextfile, encode)

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

/**common tools*************************************** */