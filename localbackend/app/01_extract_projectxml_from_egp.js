/*read 'project.xml' from an egp file, and save it as an xml file */

// load custom modules
const mymodules =require('../../localbackend/app/mytools/mymodules');

// https://www.npmjs.com/package/adm-zip
const AdmZip = require('adm-zip');

// sepcify the path and name of the zip file
const theEGP = "data/in/samplev8.egp";
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

    // save the xmlstr into a text file as ../data/out/
    let thetargetfile = "data/out/test_project.xml";
    await mymodules.saveLocalTxtFile(thexmlstr, thetargetfile, 'utf16le');

})();