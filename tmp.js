
/***** functions for editing xml ********* */














/***** functions for editing xml ********* */

/*** functions to make and write a docx*/










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




/**common tools*************************************** */



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



/**common tools*************************************** */