
/***** functions for editing xml ********* */


// make a word paragraph xml
function wxp(text_arr, pStyleAttrs, pPrhtml, rPrhtml) {
    this.pPrhtml
    this.rPrhtml
    this.text_arr = text_arr
    this.pStyleAttrs = pStyleAttrs
    this.make = function () {
        let p_jq = new wxo('w:p').make()
        // if pStyleAttrs is defined, add tags for pStyle settings
        // add an empty w:pPr selector
        let p_pPr_jq = new wxo('w:pPr', null, pPrhtml).make()
        p_jq.append(p_pPr_jq)
        if (this.pStyleAttrs) {
            // append a pSytle selector in paragraph
            let pStyle_jq = new wxo('w:pStyle', pStyleAttrs).make()
            p_pPr_jq.append(pStyle_jq)
        }//
        // if runs and text within are defined, make w:r and  w:t according to their runs within the paragraph
        if (text_arr) {
            text_arr.forEach(text => {
                // make a run
                let r_jq = new wxo('w:r', null, rPrhtml).make()
                // make a text
                let t_jq = new wxo('w:t', null, null, text).make()
                // console.log('30', t_jq.prop('outerHTML'))
                r_jq.append(t_jq)
                p_jq.append(r_jq)
            }) // text_arr.forEach
        } // if (text_arr)
        p_jq.appendto = function (parent_jq) {
            parent_jq.append(p_jq)
            return p_jq
        }
        return p_jq
    } //this.make = function
} // function wxp ()

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

// make a word xml object (wxo)
function wxo(tagname, attrs, html, text) {
    this.tagname = tagname,
        this.attrs = attrs,
        this.html = html,
        this.text = text,
        this.make = function () {
            let taghead = '<' + this.tagname + '>', tagend = '</' + this.tagname + '>'
            let theTag = taghead + tagend
            let _jq = $(theTag)
            if (this.html) { _jq.html(this.html) }
            if (this.attrs) {
                Object.keys(this.attrs).forEach(key => {
                    _jq.attr(key, this.attrs[key])
                })
            } // if (this.attrs && this.attrs.length >0)
            if (this.text) { _jq.text(this.text) }//if (this.text)
            _jq.appendto = function (parent_jq) {
                parent_jq.append(_jq)
                return _jq
            }
            return _jq
        } // this.make
} // the word xml object (wxo)

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