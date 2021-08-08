/*read 'project.xml' from an egp file, and save it as an xml file */

// load custom modules
const mymodules = require('../../localbackend/app/mytools/mymodules');

// https://www.npmjs.com/package/adm-zip
const AdmZip = require('adm-zip');

// sepcify the path and name of the egp file
const theEGP = "data/in/sample2_v8.egp";
// const theEGP = "data/in/AnEGPFileMadeByV71.egp";

// sepcify the file to be extracted from the egp (project.xml in this case)
const thesrcfile = "data/out/04_test_project_modified_for_v7.xml";

(async () => {

    // read the xml code from the local file with converted xml for SAS EGP v7
    let encoding = "utf16le";
    thesrcxmlstr = await mymodules.readtxt(thesrcfile, encoding);

    // get the zip
    const theZip = await new AdmZip(theEGP)
    const newZip = new AdmZip()
    // using Buffer to impor the xml with utf16 encoding
    theZip.addFile('project_v7.xml', Buffer.from(thesrcxmlstr, "utf16le"))

    // delete the original project.xml
    // ref. https://npmdoc.github.io/node-npmdoc-adm-zip/build/apidoc.html
    theZip.deleteFile('project.xml')

    // the amd-zip has a bug that theZip object (created from a zip) has error local header when using .toBuffer()
    // when saving theZip to a local file (e.g., theZip.writeZip(), the files within the written zip can be corrupted)
    // the work around is to migrate the files into a new zip! 
    let zipEntries = await theZip.getEntries()
    for (let i=0;i<zipEntries.length;i++){
        let d = zipEntries[i]

        // read each file into a str
        let thefilestr = await theZip.readAsText(d.entryName, 'utf16le')
        // console.log(thefilestr.substring(0,10))
        await newZip.addFile(d.entryName, Buffer.from(thefilestr, "utf16le"))
    }

    // in the new zip, rename the project_v7.xml as project.xml
    newZip.getEntries().forEach(d=>{
        // console.log("entryNames", d.entryName)
        if (d.entryName === 'project_v7.xml') {
            d.entryName = 'project.xml'
        }//
    })

    // // write the zip to local disk 
    // // the following shows that the origin zip obj (theZip) has error when using .toBuffer method
    // // Error: Invalid LOC header (bad signature)
    // theZip.toBuffer( function ( buf ) {
    //     console.log( 'success?', buf );
    // }, function ( err ) {
    //     console.log( 'error', err );
    // });

    // writeZip the newZip instead of the original (theZip)
    // await theZip.writeZip("data/out/05_test_jsconverted_v7.egp")
    await newZip.writeZip("data/out/05_test_jsconverted_v7.egp")

})()