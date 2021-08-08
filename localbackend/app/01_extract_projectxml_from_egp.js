/*read 'project.xml' from an egp file, and save it as an xml file */

// load custom modules
const mymodules =require('../../localbackend/app/mytools/mymodules');

// https://www.npmjs.com/package/adm-zip
const AdmZip = require('adm-zip');

// sepcify the path and name of the zip file
const theEGP = "data/in/sample1_v8.egp";
// const theEGP = "data/in/AnEGPFileMadeByV71.egp";

// sepcify the file to be extracted from the egp (project.xml in this case)
const thesrcfile = "project.xml";

(async () => { 

    //define theZip
    const theZip = new AdmZip(theEGP)
    // read the text from the project.xml file, convert encoding from utf-16 to utf-8
    // note: it is very important to convert encoding. otherwise the saved txt file will be unable to read!
    let thexmlstr = await theZip.readAsText(thesrcfile, 'utf16le'); // 'utf-16' type is called 'utf16le'
    // console.log(thexmlstr.substring(1,100))

    /* quite annoying! need to change %lt to < &gt to > */
    thexmlstr=thexmlstr.replace(/&amp;lt;/g, '<')
    thexmlstr=thexmlstr.replace(/&amp;gt;/g, '>')
    thexmlstr=thexmlstr.replace(/&lt;/g, '<')
    thexmlstr=thexmlstr.replace(/&gt;/g, '>')

    thexmlstr=thexmlstr.replace(/&amp;/g, '_')// cannot have &amp; or & in xml


    // jsdom does not handle the tag <Table>A</Table> well
    // In that case, it alters the html to '<Table></Table>A' !
    // The following is to rename the tag <Table> to <Table123> to work around
    thexmlstr=thexmlstr.replace(/\<Table\>/g, '<Table123>')
    thexmlstr=thexmlstr.replace(/\<\/Table\>/g, '</Table123>')

    // the xhtml tags like <Parameters /> must be converted to <Parameters></Parameters>
    // because the JSDOM does not read <Parameters /> well, it'll mess up the nested structure!
    /**
      e.g., the structure is like
     <Parameters />
     <ExecutionTimeSpan>-P10675199DT2H48M5.4775808S</ExecutionTimeSpan>

     JSDOM wrongly treat it as 
     <Parameters>
        <ExecutionTimeSpan>-P10675199DT2H48M5.4775808S</ExecutionTimeSpan>
     </Parameters>
     the following is to convert  <Parameters /> to <Parameters></Parameters>
     */
    thexmlstr = convertXHTML_to_OldSchoolHTML(thexmlstr)

    // save the xmlstr into a text file as ../data/out/
    let thetargetfile = "data/out/01_test_project_v8_extracted_from_egp.xml";
    await mymodules.saveLocalTxtFile(thexmlstr, thetargetfile, 'utf16le');
})();


// convert <Parameters /> to <Parameters></Parameters>
function convertXHTML_to_OldSchoolHTML(str){  
    // let str = "xxx yyy"
    let matched_arr = str.match(/\<(.*) \/\>/)
    // console.log(matched_arr)
    if (matched_arr && matched_arr.length >0) {
        let seg1 = matched_arr[1].split('<')
        let theLastMatchedStr = seg1[seg1.length-1]
        // console.log(theLastMatchedStr)    
        // replace <Others /> with <Others></<Others />
        let xhtmlstr = "<" + theLastMatchedStr + " />" 
        let htmlstr = "<" + theLastMatchedStr + ">" + "</" + theLastMatchedStr + ">"  
        str = str.replace(xhtmlstr, htmlstr)
        let matched_arr2 = str.match(/\<(.*) \/\>/)
        if (matched_arr && matched_arr.length >0) {
            str = convertXHTML_to_OldSchoolHTML(str)
        }
    }
    return str
} // function convertXHTML_to_OldSchoolHTML(str