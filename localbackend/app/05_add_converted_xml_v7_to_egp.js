/*read 'project.xml' from an egp file, and save it as an xml file */

// load custom modules
const mymodules =require('../../localbackend/app/mytools/mymodules');

// https://www.npmjs.com/package/adm-zip
const AdmZip = require('adm-zip');

// sepcify the path and name of the egp file
const theEGP = "data/in/sample3_v8.egp";
// const theEGP = "data/in/AnEGPFileMadeByV71.egp";

// sepcify the file to be extracted from the egp (project.xml in this case)
const thesrcfile = "data/out/04_test_project_modified_for_v7.xml";

(async () => { 

    // read the xml code from the local file with converted xml for SAS EGP v7
    let encoding = "utf16le";
    thesrcxmlstr = await mymodules.readtxt(thesrcfile, encoding);

    // get the zip
    const theZip = new AdmZip(theEGP)
    // using Buffer to impor the xml with utf16 encoding
    theZip.addFile('project_v7.xml', Buffer.from(thesrcxmlstr, "utf16le"))

    // delete the original project.xml
    // ref. https://npmdoc.github.io/node-npmdoc-adm-zip/build/apidoc.html
    theZip.deleteFile('project.xml')

    // rename a file 
    let zipEntries = theZip.getEntries()
    zipEntries.forEach(d=>{
        if (d.entryName === 'project_v7.xml'){
            d.entryName = 'project.xml'
        }
    })
    // write the zip to local disk
    theZip.writeZip("data/out/05_test_jsconverted_v7.egp")
})()