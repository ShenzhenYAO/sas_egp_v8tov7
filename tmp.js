
/***** functions for editing xml ********* */








// make a word tbl row xml (with empty cells and paragraphs)
function wxtr(width_cols_str, shdattrs_headrow, gridSpanAttrs, width_tbl, n_cols) {
    this.gridSpanAttrs = gridSpanAttrs
    this.width_cols_str = width_cols_str
    this.shdattrs_headrow = shdattrs_headrow
    this.width_tbl = width_tbl
    this.n_cols = n_cols
    this.make = function () {
        if (!this.width_tbl) { this.width_tbl = '8000' }
        if (!this.n_cols) { this.n_cols = 1 }

        // make a width_cols_str according to defined table width and number of columns
        if (this.width_tbl && this.n_cols && !this.width_cols_str) {
            this.width_cols_str = ''
            for (let i = 0; i < this.n_cols; i++) {
                this.width_cols_str = this.width_cols_str + ',' + Math.floor(parseInt(this.width_tbl) / this.n_cols).toString()
            } // for(let i=0; i<this.n_cols-1; i++)
            // remove the heading ',' in the string
            this.width_cols_str = this.width_cols_str.substr(1)
        } //if (this.width_tbl && this.n_cols && !this.width_cols_str)

        // define the cols
        let cols_width_arr = this.width_cols_str.split(',').map(x => { return { width: x.trim() } })
        // use cols_width_arr to make an array of empty celltext ('') 
        // in each cell, make a paragraph, and the paragraph contains a w:r nesting a w:t. 
        // the paragraph is mandated to have within the cell, otherwise WORD application reports error
        let celltext_arr = this.width_cols_str.split(',').map(x => { return { celltext: '' } })

        // make the table row
        let tr_jq = new wxo('w:tr').make()
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

            if (this.gridSpanAttrs) {thecell_pr_jq.append(new wxo('w:gridSpan',this.gridSpanAttrs).make())} //if (gridSpanAttrs)


            // get the colhead of the corresponding column
            let celltext = celltext_arr[col_index].celltext
            // make a paragraph for the colheadtext
            let p_jq = new wxp([celltext]).make()
            // append the paragraph to the cell
            thecell_jq.append(p_jq)

            // append the cell to the row
            tr_jq.append(thecell_jq)

            col_index++

        }) // cols_width_arr.forEach

        tr_jq.appendto = function (parent_jq) {
            parent_jq.append(tr_jq)
            update_cell_address_tbl(parent_jq)
            return tr_jq
        }
        return tr_jq
    }; // this.make (a function)
}; // function wxtr()

// update the address of each cell (like '1,1' for r1c1) in a table
function update_cell_address_tbl(tbl_jq) {
    let rows_credientail_jq = tbl_jq.find('w\\:tr')
    for (let i = 0; i < rows_credientail_jq.length; i++) {
        let therow_jq = $(rows_credientail_jq[i])
        // find the cells
        let cells_therow_jq = therow_jq.find('w\\:tc')
        for (let j = 0; j < cells_therow_jq.length; j++) {
            let thecell_jq = $(cells_therow_jq[j])
            thecell_jq.attr('address', (i + 1).toString() + "," + (j + 1).toString())
        } //for (let j=0;j<cells_therow_jq.length;j++)
    } //for (let i=0;i<rows_credientail.length;i++)
} //function update_address_tbl(tbl_jq)

// add contents (as an array )
function change_cell_contents(tbl_jq, address, ps_jq) {
    // let findstr = 'w\\:tc[address="' + address+'"]'
    let cell_jq = $(tbl_jq.find('w\\:tc[address="' + address + '"]')[0])
    // console.log(cell_jq)
    // remove all paragraph in cell_jq
    let old_ps_cell_jq = cell_jq.find('w\\:p')
    if (old_ps_cell_jq.length > 0) {
        for (let i = old_ps_cell_jq.length - 1; i >= 0; i--) {
            old_ps_cell_jq[i].remove()
        } // for (let i = old_p_cell_jqs.length -1; i >=0; i--)
    } // if (old_p_cell_jqs.length >0)
    // add the new paragraphs to the cell
    cell_jq.append(ps_jq)
}; // function change_cell_contents

/***** functions for editing xml ********* */

/*** functions to make and write a docx*/



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
    originalTagnames_dict_crude = { ...originalTagnames_dict_crude, ...{ 'W:TRPR': 'w:trPr' } }
    // console.log('140', originalTagnames_dict_crude)
    // 4b. make a dictionary to map out the standardized and original attribute names
    let originalAttrNames_dict_crude = getOriginalAttrNames_dict_crude(thesrcxmlstr_cleaned)
    // console.log('145', originalAttrNames_dict_crude)

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