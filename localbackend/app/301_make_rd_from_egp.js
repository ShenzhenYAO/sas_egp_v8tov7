/* To update an xlsx file according to the template */
// need to install the markdown-it package

// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

// https://www.npmjs.com/package/adm-zip
const AdmZip = require('adm-zip');
// const { config, setgroups } = require('process'); what the heck is this? I think it is automatically added by VScode!

const beautify = require('beautify');

const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();


// src and target file settings:
// src path and egp file name:
const srcEGPPath = 'data/in/do_not_git/v8 and v7 samples/real projects/';
const srcEGPFile = 'test_rd_in_comments.egp';
const theEGPFileWithPath = srcEGPPath + srcEGPFile;

const thesrczip = new AdmZip(theEGPFileWithPath);
const targetpath = 'data/out';

(async () => {
    // make a jqeury obj (_jq) from project.xml in the src egp
    let { projectxml_jq, projectxml_str } = await get_xml_from_egp(thesrczip)

    // save the project xml code to a local file
    // //2a. save the thesrcxmlstr_v8 as a local file (for viewing the contents during coding)
    let thesrcxmlfile = targetpath + '/' + '___projectxml_src.xml'
    let beautfied_projectxml_str = beautify(projectxml_str, { format: 'xml' })
    await saveLocalTxtFile(beautfied_projectxml_str, thesrcxmlfile, 'utf16le');

    // get all codetasks
    let codetasks_arr = get_codetasks(projectxml_jq)

    // make an array of htmlparagraphs
    let htmlparagraphs_arr = await make_htmlparagraphs_arr(codetasks_arr, thesrczip)

    // now, an array of w:tc components
    let wtcs_arr = make_wtcs_arr(htmlparagraphs_arr)
    // console.log(46, wtcs_arr[wtcs_arr.length-1].cell.prop('outerHTML'))

    // make a wtcs_dict, each tc has a key like 'r1c1' (row 1 col 1)
    // the above wtcs_arr is not entirely right. actually that arr is supposed to be a collection of w:p (paragraphs) clusters, each for a tc...
    // anyway, just carry on and make a dict out of it, still keep the tc instead of cluster of w:p components
    let wtcs_dict = make_wtcs_dict(wtcs_arr)
    // Note: wtcs_dict starts from r2c1 (row 1 is the table head which is prepared in the template file)
    // console.log(52, wtcs_dict['r2c1'].prop('outerHTML'))

    // make an array of w:tr components
    // there should always be 1 or 4 tc in a w:tr, of which some have a corresponding tc of the same address from wtcs_dict (if the cell is not supposed to be empty), and some not
    let wtrs_arr = make_wtrs_arr(wtcs_dict)
    // console.log(58, wtrs_arr[0].prop('outerHTML'))
    // console.log(59, wtrs_arr[wtrs_arr.length-1].prop('outerHTML'))

    

})()

// make an array of w:tr components
// there should always be 1 or 4 tc in a w:tr, of which some have a corresponding tc of the same address from wtcs_dict (if the cell is not supposed to be empty), and some not
function make_wtrs_arr(wtcs_dict) {
    let wtrs_arr = []
    // find the max row in 
    let addresskeys = Object.keys(wtcs_dict)
    let rows_arr = addresskeys.map(x => { return parseInt(x.split('c')[0].split('r')[1]) })
    let max_row_num = Math.max(...rows_arr) // note: cannot get max from an array, neet to chagne it to a list 

    // loop from row 2 to max row
    for (let i = 2; i < max_row_num + 1; i++) {
        // make a w:tr
        let wxtr_jq = new wxtr().make()
        // remove the default tc
        wxtr_jq.find('w\\:tc').remove()

        // for each tr, add 4 tc
        let mergecells = 0
        for (let j = 1; j < 4 + 1; j++) {
            let addresskey = 'r' + i.toString() + 'c' + j.toString()
            if (wtcs_dict[addresskey]) {
                wxtr_jq.append(wtcs_dict[addresskey])
                // determine if merge of the row is specified
                if (j === 1) {
                    let wxgridspan_jq = $(wtcs_dict[addresskey].find('w\\:tcPr > w\\:gridSpan')[0])
                    if (wxgridspan_jq.length > 0) {
                        // console.log(85, i, j, wxgridspan_jq.prop('outerHTML'))
                        mergecells = 1
                    }
                } //if (j === 1)                   
            } else {
                // console.log(90, mergecells)
                if (mergecells === 0) {
                    // make an empty w:tc
                    let tc_jq = new wxtc().make().appendto(wxtr_jq)
                    tc_jq.attr('address', i.toString() + ',' + j.toString())
                    // console.log(94, tc_jq.prop('outerHTML'))
                    // set column width
                    let width_cols_arr = ['3294', '5461', '3119', '1302']
                    let wxtcw_jq = $(tc_jq.find('w\\:tcPr > w\\:tcW')[0])
                    wxtcw_jq.attr('w:w', width_cols_arr[j - 1])
                    wxtcw_jq.attr('w:type', "dxa")

                    // must add a w:p
                    let wxp_jq = new wxp().make().appendto(tc_jq)
                    let wxr_jq = new wxr().make().appendto(wxp_jq)
                    let wxt_jq = new wxo('w:t').make().appendto(wxr_jq)
                } // if (! (j>1 && mergecells === true))
            } //if (wtcs_dict[addresskey])
        } //for(let j= 1; j< 4+1; j++)
        // console.log(71, wxtr_jq.prop('outerHTML'))

        wtrs_arr.push(wxtr_jq)
    } // for (let i=2; i< max_row_num+1;i++)

    return wtrs_arr
} //function make_wtrs_arr (wtcs_dict)



// make a dict of wtcs, each tc has a key like 'r1c1' (row 1 col 1)
// the thewtcs.row and .col start from 0, which is corresponding to the index in the orignal array
// however, for the research doc steps table, these tcs start from row 2 and col 1 (row 1 is the header) 
function make_wtcs_dict(wtcs_arr) {
    let wtcs_dict = {}
    for (let i = 0; i < wtcs_arr.length; i++) {
        let thewtcs = wtcs_arr[i]
        // add an address attr to each tc
        thewtcs.cell.attr('address', (parseInt(thewtcs.row) + 2).toString() + ',' + (parseInt(thewtcs.col) + 1).toString())
        wtcs_dict['r' + (parseInt(thewtcs.row) + 2).toString() + 'c' + (parseInt(thewtcs.col) + 1).toString()] = thewtcs.cell
    } // for (let i=0; i <wtcs_arr.length; i++ )
    return wtcs_dict
} // function make_wtcs_dict(wtcs_arr)

// now, make word xml code string for the table rows
function make_wtcs_arr(htmlparagraphs_arr) {
    //loop for each element in htmlparagraphs_arr again. This time is to make w:tr, w:tc, and w:p components for the table steps
    let retained_tr_num_by_label_order, retained_col_num, wps_current_wtc = [], wtcs_arr = []
    for (let i = 0; i < htmlparagraphs_arr.length; i++) {

        // for (let i = 0; i < 7; i++) { // for testing
        let htmlparagraph = htmlparagraphs_arr[i]
        // console.log('172', htmlparagraph)
        let thehtmlstr = htmlparagraph.html

        //make an empty w:p component (with w:pPr)
        let wp_jq = new wxp().make()
        // if thehtmlstr's tagname is <ul> or <ol>, add the following innerHTML to define the paragraph as a list, and specify the bulletins
        /*
            <w:pStyle w:val="ListParagraph"></w:pStyle>
            <w:numPr>
                <w:ilvl w:val="0"></w:ilvl>
                <w:numId w:val="1"></w:numId>
            </w:numPr>
         */

        let hp_jq = $(thehtmlstr) // hp for html of the paragraph
        hp_tagname = hp_jq.prop('tagName').toLowerCase()
        wxppr_dict = {}
        wxppr_dict.list = function wxppr_list(wp_jq, listtype) {
            /* to add like the following into w:pPr
                <w:pStyle w:val="ListParagraph"></w:pStyle>
                <w:numPr>
                    <w:ilvl w:val="0"></w:ilvl>
                    <w:numId w:val="1"></w:numId>
                </w:numPr>
             */
            if (listtype === 'ul' || listtype === 'ol') {
                // find or create the tag w:pPr
                let wxppr_jq = $(wp_jq.find('w\\:pPr')[0])
                if (!wxppr_jq) { wxppr_jq = new wxo('w:pPr').make().appendto(wp_jq) }
                // find or create the tag w:pStyle
                let wxpstyle_jq = $(wxppr_jq.find('w\\:pStyle')[0])
                if (!wxpstyle_jq) { wxpstyle_jq = new wxo('w:pStyle').make().appendto(wxppr_jq) }
                // within wxppr_jq, define the attr w:val as 'ListParagraph
                wxppr_jq.attr('w:val', 'ListParagraph')
                // find or create w:numPr
                let wxnumpr_jq = $(wp_jq.find('w\\:numPr')[0])
                if (!wxnumpr_jq) { wxnumpr_jq = new wxo('w:numPr').make().appendto(wp_jq) }
                // find or create w:w:ilvl
                let wxilvl_jq = $(wxnumpr_jq.find('w\\:ilvl')[0])
                if (!wxilvl_jq) { wxilvl_jq = new wxo('w:w:ilvl').make().appendto(wxnumpr_jq) }
                wxilvl_jq.attr('w:val', '0')
                // find or create w:numId
                let wxnumid_jq = $(wxnumpr_jq.find('w\\:numId')[0])
                if (!wxnumid_jq) { wxnumid_jq = new wxo('w:numId').make().appendto(wxnumpr_jq) }
                // by default, the bulletin is '-'
                wxnumid_jq.attr('w:val', '1')
                // for <ol>, make bulletin as numbers
                if (listtype === "ol") { wxnumid_jq.attr('w:val', '2') }
            }// if (listtype === 'ul' || listtype==='ol')
            return wp_jq
        } //  function wxppr_list(wp_jq, listtype)

        wp_jq = wxppr_dict.list(wp_jq, hp_tagname)

        // change html into a jquery object        
        let wxrs_arr = make_paragraph_wxrs(thehtmlstr)
        // console.log('222', wp_jq.prop('outerHTML'))        

        wp_jq.append(wxrs_arr)
        //console.log(345, wp_jq.prop('outerHTML'))
        // by this step, the w:p components is done.        

        // Next, make w:tc
        let current_col_num = htmlparagraph.col_num
        let current_tr_num_by_label_order = htmlparagraph.tr_num_by_label_order
        // console.log(357,current_col_num)

        if (i > 0 && (retained_tr_num_by_label_order !== current_tr_num_by_label_order || retained_col_num !== current_col_num)) {
            retained_col_num = current_col_num
            retained_tr_num_by_label_order = current_tr_num_by_label_order
            // make a new tc
            // make an empty w:tc  (with w:tcPr > w:tcW)
            let wtc_jq = new wxtc().make()
            // set column width
            let wtcw_jq = $(wtc_jq.find('w\\:tcPr > w\\:tcW')[0])
            let width_cols_arr = ['3294', '5461', '3119', '1302']
            let width_tc = width_cols_arr[htmlparagraphs_arr[i - 1].col_num]
            wtcw_jq.attr("w:w", width_tc)
            wtcw_jq.attr("w:type", 'dxa')
            // if (wps_current_wtc.length > 0) { console.log(178, wps_current_wtc[wps_current_wtc.length - 1].prop('outerHTML')) }
            wtc_jq.append(wps_current_wtc)

            // determine whether to the cell merges the whole row
            if (wtc_jq.text().includes('[mergecells]')) {
                wtc_jq.find('w\\:tcPr').append($('<w:gridSpan w:val="4"></w:gridSpan>'))
                let wt_jq = $(wtc_jq.find('w\\:p > w\\:r > w\\:t')[0])
                let text = wt_jq.text()
                text = text.replace(/\[mergecells\]/g, '').trim()
                wt_jq.text(text)
            } // if (wtc_jq.text().includes('[mergecells]'))

            // console.log(190, wtc_jq.prop('outerHTML'))
            // console.log(191, i, htmlparagraphs_arr.length)
            let thewtc = {}
            thewtc.col = htmlparagraphs_arr[i - 1].col_num
            thewtc.row = htmlparagraphs_arr[i - 1].tr_num_by_label_order
            thewtc.cell = wtc_jq
            wtcs_arr.push(thewtc)

            wps_current_wtc = []
            wps_current_wtc.push(wp_jq)

        } else {
            // push the current paragraph into an array of paragraphs for the current w:tc
            wps_current_wtc.push(wp_jq)

            if (i === htmlparagraphs_arr.length - 1) {
                // console.log(206, wps_current_wtc[wps_current_wtc.length - 1].prop('outerHTML'))

                // make a new tc
                // make an empty w:tc  (with w:tcPr > w:tcW)
                let wtc_jq = new wxtc().make()
                // set column width
                let wtcw_jq = $(wtc_jq.find('w\\:tcPr > w\\:tcW')[0])
                let width_cols_arr = ['3294', '5461', '3119', '1302']
                let width_tc = width_cols_arr[htmlparagraphs_arr[i - 1].col_num]
                wtcw_jq.attr("w:w", width_tc)
                wtcw_jq.attr("w:type", 'dxa')
                // if (wps_current_wtc.length > 0) { console.log(217, wps_current_wtc[wps_current_wtc.length - 1].prop('outerHTML')) }
                wtc_jq.append(wps_current_wtc)

                let thewtc = {}
                thewtc.col = htmlparagraphs_arr[i].col_num
                thewtc.row = htmlparagraphs_arr[i].tr_num_by_label_order
                thewtc.cell = wtc_jq
                wtcs_arr.push(thewtc)

            } //
        } // if else (retained_col_num !== current_col_num)
    }//for (let i = 0; i<htmlparagraphs_arr.length; i++ ){
    // console.log(229, wtcs_arr)
    return wtcs_arr
}// function make_wtcs_arr()

// make htmlparagraphs_arr
async function make_htmlparagraphs_arr(codetasks_arr, thesrczip) {
    // loop for each element in codetasks_arr, according to the codetask id, find the entry like (<codetaskid>/code.sas) in the srczip
    // note, always use for loop instead of .forEach (the latter does not support async)
    let rdtext_arr = [], htmlparagraphs_arr = [], tr_num_by_task_create_order = -1
    for (let i = 0; i < codetasks_arr.length; i++) {
        let thecodetask_id = codetasks_arr[i].id
        let thecodetask_label = codetasks_arr[i].label
        // console.log('55', thecodetask_id, thecodetask_label)
        let theEntry = thecodetask_id + '/' + 'code.sas'

        // get the sas code of the codetask
        let thecodetext = await thesrczip.readAsText(theEntry, 'utf-8')
        // console.log('57', thecodetext)
        // save the code text (including code and comments) into the codetask_arr
        codetasks_arr[i].codetext = thecodetext

        // within the code text, get the text for research document, i.e., an array of contents betweeen //tr and tr//
        /* 
        In the sas code, there could be multipe matches of rd text
            //tr
            # Objective 1: Cohort Preparation [mergecells]
            tr//

            //tr
            1a) Make a dummy set of drug claims.
            It contains a patient id (__pid__) and a __DIN__.
            //
            - DINs in '001'
            - DINs in '002', '003'
            //
            See doc received on 2021-09-19 from David Jones. There are totally one doc.
            tr//
        */
        let matched_rdtext_arr = [...codetasks_arr[i].codetext.matchAll(/\/\/tr([\S\s]*?)tr\/\//g)]
        codetasks_arr[i].rdtext = []
        codetasks_arr[i].rdhtml = []
        // loop for each matched rd text:
        for (let j = 0; j < matched_rdtext_arr.length; j++) {
            tr_num_by_task_create_order++
            let therdtext = matched_rdtext_arr[j][1]
            /* 
                therdtext is now like:
                1a) Make a dummy set of drug claims.
                It contains a patient id (__pid__) and a __DIN__.
                //
                - DINs in '001'
                - DINs in '002', '003'
                //
                See doc received on 2021-09-19 from David Jones. There are totally one doc.

                there are '//' (and line breakers) to split the rdtext into several segments, seg[0] is for the column of 'step' in the steps table
                seg[1] for the column 'criteria', seg[2] for 'rationale, etc.
            */
            //split the rd text by '//\r\n' (each ele in the result rdtextsegs_arr is for one of the four columns in the __rd table 'steps')
            let rdtextsegs_arr = therdtext.split('\/\/\r\n')
            for (k = 0; k < rdtextsegs_arr.length; k++) {
                let rdtextseg = rdtextsegs_arr[k]
                // each rdtextseg is for a column (e.g., seg[0] for step, seg[1] for criteria, seg[2] for rationale, etc)
                // the rdtextseg is further split by line breaker to have textlines

                /* 
                Now, a rdtextseg is like:
                    1a) Make a dummy set of drug claims.\r\n
                    It can be easily created by loop in data steps.It contains a patient id (__pid__) and a __DIN__.\r\n
                It contains multiple lines
                */
                // split the rdtextseg into lines by the line breaker \r\n. Thus, each line is an indepedent paragraph !
                let rdtextlines_arr = rdtextseg.split('\r\n')
                for (let m = 0; m < rdtextlines_arr.length; m++) {
                    let thetextline = rdtextlines_arr[m].trim()
                    /* 
                    now thetextline is like:
                        It can be easily created by loop in data steps.It contains a patient id (__pid__) and a __DIN__.
                    */
                    if (thetextline !== '') {
                        // only keep the lines that are not blank
                        // convert the textline to html by markdown-it
                        // console.log(130, thetextline)
                        let htmlline_by_markdownit = md.render(thetextline)
                        // console.log(132, htmlline_by_markdownit)
                        htmlline_by_markdownit = htmlline_by_markdownit.replace(/\n/g, "")
                        htmlparagraphs_arr.push({ html: htmlline_by_markdownit, id: thecodetask_id, label: thecodetask_label, rd_order_in_task: j, col_num: k, paragraph_order_in_rd: m, tr_num_by_task_create_order: tr_num_by_task_create_order })
                        rdtext_arr.push({ text: thetextline, id: thecodetask_id, label: thecodetask_label, rd_order_in_task: j, col_num: k, paragraph_order_in_rd: m, tr_num_by_task_create_order: tr_num_by_task_create_order })
                    } // if (thetextline !=='')
                }// for each ele in rdtextlines_arr
            } // for (k=0; k<rdtextsegs_arr.length;k++)
        } //for (let j=0; j<matched_rdtext_arr.length; j++)
    }//for (let i=0; i<codetasks_arr.length; i++ )
    // console.log('97', htmlparagraphs_arr)

    // By this step, the contents for the steps table are all saved in htmlparagraphs_arr
    // it should be reorder in such: by label (i.e., __credential comes before _xa, which comes befor _xb...), then by rd_order_in_task, then by paragraph_order_in_rd
    // Note: the name of the label should reflect the order of analytical steps
    // It does not have to be by col_num. The col_num already indicated which col the content should go into the steps table
    htmlparagraphs_arr.sort((a, b) => (a.label.localeCompare(b.label) || a.rd_order_in_task - b.rd_order_in_task || a.paragraph_order_in_rd - b.paragraph_order_in_rd || a.col_num - b.col_num));
    // console.log('144', htmlparagraphs_arr)

    // in the above, the row number (tr_num_by_task_create_order) is ordered by chronic order by which tasks are created (those created earlier come first)
    // now, as the htmlparagraphs_arr is reordered by its label, a new tr_num should be created, so as to be conform with the label order
    // as stated in the above, name of the label should reflect the order of analytical steps 
    let tr_num_by_label_order = -1, retained_tr_num_by_task_create_order = -1
    for (let i = 0; i < htmlparagraphs_arr.length; i++) {
        let htmlparagraph = htmlparagraphs_arr[i]
        let current_tr_num_by_task_create_order = htmlparagraph.tr_num_by_task_create_order
        if (retained_tr_num_by_task_create_order !== current_tr_num_by_task_create_order) {
            retained_tr_num_by_task_create_order = current_tr_num_by_task_create_order
            tr_num_by_label_order++
        }// if (retained_tr_num_by_task_create_order !== current_tr_num_by_task_create_order)
        htmlparagraph.tr_num_by_label_order = tr_num_by_label_order
    } //for (let i = 0; i<htmlparagraphs_arr.length; i++ )
    htmlparagraphs_arr.sort((a, b) => (a.label.localeCompare(b.label) || a.tr_num_by_label_order - b.tr_num_by_label_order || a.col_num - b.col_num || a.paragraph_order_in_rd - b.paragraph_order_in_rd));
    // console.log('164', htmlparagraphs_arr)

    return htmlparagraphs_arr

} // function make_htmlparagraphs_arr ()

// get all codetasks
function get_codetasks(projectxml_jq) {
    // Find the jq dom with codetask id and label info, i.e., in ProjectCollection > Elements, get all <Element Type="SAS.EG.ProjectElements.CodeTask"> and find their > ELement
    let codetasks_jq = projectxml_jq.find('Elements > Element[Type="SAS.EG.ProjectElements.CodeTask"] > Element')
    // console.log('39', codetasks_jq)

    // loop and get codetask id
    let codetasks_arr = []
    for (let i = 0; i < codetasks_jq.length; i++) {
        let thecodetask_element_jq = $(codetasks_jq[i])
        let codetaskid = $(thecodetask_element_jq.find('ID')[0]).text()
        let codetasklabel = $(thecodetask_element_jq.find('Label')[0]).text()
        codetasks_arr.push({ id: codetaskid, label: codetasklabel })
    } // for (let i=0; i<codetasks_jq.length; i++ )
    // console.log('47', codetasks_arr)

    return codetasks_arr
} // function get_codetasks(projectxml_jq) {

// make an array of w:r components according to the input html
function make_paragraph_wxrs(htmlstr) {
    let wxrs_arr = []
    let wxrpr_dict = {}

    // 1. make a jquery obj from the htmlstr
    let h_jq = $(htmlstr)
    // 2. get the tag name of the obj
    let tagname = h_jq.prop('tagName').toLowerCase()
    // tagname are used to determine the property (w:pPr) of the 
    // for making the research doc, only strong, ins, will be identified. other tagnames are treated as plain text.
    // if tagname = strong, add<w:b/> into <w:rPr>

    wxrpr_dict.strong = function wxrpr_strong(wxr_jq) {
        // find or create w:rPr
        // console.log(239, wxr_jq.prop('outerHTML'))
        let wxrpr_jq = $(wxr_jq.find('w\\:rPr')[0])
        // console.log(241, wxrpr_jq.prop('outerHTML'))
        if (!wxrpr_jq) { wxrpr_jq = new wxo('w:rPr').make().appendto(wxr_jq) } //if (! wxrpr)
        // add <w:b/> to w:rPr (making font bold)
        wxrpr_jq.html('<w:b/>')
        return wxr_jq
    } // function wxr_strong (wxr_jq)
    wxrpr_dict.em = function wxrpr_em(wxr_jq) {
        // find or create w:rPr
        // console.log(239, wxr_jq.prop('outerHTML'))
        let wxrpr_jq = $(wxr_jq.find('w\\:rPr')[0])
        // console.log(241, wxrpr_jq.prop('outerHTML'))
        if (!wxrpr_jq) { wxrpr_jq = new wxo('w:rPr').make().appendto(wxr_jq) } //if (! wxrpr)
        // add <w:b/> to w:rPr (making font bold)
        wxrpr_jq.html('<w:i/>')
        return wxr_jq
    } // function wxr_strong (wxr_jq)
    wxrpr_dict.ins = function wxrpr_ins(wxr_jq) {
        // find or create w:rPr
        let wxrpr_jq = $(wxr_jq.find('w\\:rPr')[0])
        if (!wxrpr_jq) { wxrpr_jq = new wxo('w:rPr').make().appendto(wxr_jq) } //if (! wxrpr)
        // add <w:b/> to w:rPr (making font bold)
        wxrpr_jq.html('<w:u w:val="single"/>')
        return wxr_jq
    } // function wxr_ins (wxr_jq)

    // 3. get the innerHTML of the object
    let innerhtmlstr = h_jq.prop('innerHTML')
    // the innerhtmlstr could be like '... a patient id (<strong>pid</strong>) and a <strong>DIN</strong>...'
    // in which there are multiple children nodes

    // if there is no cildren nodes, the whole innerhtmlstr will be make into a single w:r component
    if (h_jq.children().length === 0) {
        let wp_text = innerhtmlstr
        wxrs_arr.push(make_text_wrwt(wxrpr_dict, tagname, wp_text))
    } else {
        // need to replace the outerHTML of the children nodes with the mark __123childrenNodeOuterHTML123__
        // that way, the text contents of the current h_jq can be split by mark into several strings

        // do some math here:
        // consider the innerHTML is like 'seg0<outerHTML_child0>seg1<outerHTML_child1>seg2'
        // there should be five  w:r components, each for 3 segs and two child nodes
        // the order (wxr_index) of the w:r components should follow the original order, 
        // i.e, seg0's wxr_index=0, child0's wxr_index=1, seg1's = 2, etc...
        // therefore a dictionary of these w:r components should be created, remembering their order in original text
        let wxrs_dict = {}, wxr_index

        // for the child nodes, if the index of the child in the children node array (index_childrennode)  is 0, 1, 2
        // the wxr_index should be 1, 3, 5 (i.e., wxr_index = index_childrennode*2+1)
        // for segments, if the index of the segment array (index_segment) is 0, 1, 2
        // the wxr_index should be 0,2,4 (i.e., wxr_index = index_segment*2)

        for (let j = 0; j < h_jq.children().length; j++) {
            let thechildnode_jq = $(h_jq.children()[j])
            let outHTML_thechildnode = thechildnode_jq.prop('outerHTML')
            innerhtmlstr = innerhtmlstr.replace(outHTML_thechildnode, '__123childrenNodeOuterHTML123__')

            // make w:r according to outHTML of the childnode
            // for the child nodes, if the index of the child in the children node (index_childrennode) array is 0, 1, 2
            // the wxr_index should be 1, 3, 5 (i.e., wxr_index = index_childrennode*2+1)
            wxr_index = j * 2 + 1
            wxrs_dict[wxr_index] = make_paragraph_wxrs(outHTML_thechildnode)
        } // for (let j=0; j<h_jq.children().length; j++)

        // 
        innerhtmlsegs_arr = innerhtmlstr.split('__123childrenNodeOuterHTML123__')
        // loop for each of the seg, and make w:r components
        for (let j = 0; j < innerhtmlsegs_arr.length; j++) {
            let innerhtmlsegs = innerhtmlsegs_arr[j]
            wxr_index = j * 2
            wxrs_dict[wxr_index] = make_text_wrwt(wxrpr_dict, tagname, innerhtmlsegs)
        }//loop j for innerhtmlsegs_arr[j]

        //now add the individual wxr components into wxrs_arr by the original order (which is the key of the wxrs_dict)
        // the total number of subwxrs is the number of children nodes plus the number of segments
        let n_subwxrs = h_jq.children().length + innerhtmlsegs_arr.length
        for (let j = 0; j < n_subwxrs; j++) {
            // for wxrs_dict[j] from children nodes, it is an array of w:r elements
            if (parseInt(j / 2) !== j / 2) {
                for (let k = 0; k < wxrs_dict[j].length; k++) {
                    // console.log(310, wxrs_dict[j][k].prop('outerHTML'))
                    wxrs_arr.push(wxrs_dict[j][k])
                } // for (let k = 0; k<wxrs_dict[j].length;k++
            } else {
                wxrs_arr.push(wxrs_dict[j])
            } // if (parsInt(j/2) !== j/2)                    
        } //for (let j = 0; j<n_subwxrs; j++)
        // console.log(316, wxrs_arr)
        return wxrs_arr
    } // if else (h_jq.children().length === 0)

    // console.log(338, wxrs_arr)
    return wxrs_arr
} // make_paragraph_wxrs

// make a component w:r nesting a w:t, adding text contents in w:t
function make_text_wrwt(wxrpr_dict, tagname, wp_text) {
    if (wp_text !== '') {
        // make a w:r
        let wxr_text_jq = new wxr().make()
        // console.log(325, tagname, wxrpr_dict[tagname])
        // set w:rPr property (e.g., bold, italic, etc)
        if (wxrpr_dict[tagname]) { wxr_text_jq = wxrpr_dict[tagname](wxr_text_jq) }
        // make a w:t
        wxt_text_jq = new wxo('w:t', null, null, wp_text).make().appendto(wxr_text_jq)
        return wxr_text_jq
    } // if (wp_text !== '')                
} // function make_text_wrwt

// save to local file
async function saveLocalTxtFile(thetxtstr, targettxtfile, encoding) {
    encoding = encoding || 'utf-8' // by default using utf-8
    let fs = require('fs');
    // use writeFileSync instead of writeFile to avoid async problems
    fs.writeFileSync(targettxtfile, thetxtstr, encoding, function (err) {
        if (err) { console.log(err); }
    });
}; // saveLocalTxtFile


async function get_xml_from_egp(thesrczip) {
    //*** read the v8 egp data */
    // based on 01 extract_projectxml_from_egp.js, and 12_convert_xml_to_v7.js
    // 1. read the script of project.xml from thesrczip
    let thesrcxmlfile = 'project.xml'
    let encoding = "utf16le"; // the srcxml is directly from an egp file, remmember to read in using "utf16le" encoding
    let thesrcxmlstr = await thesrczip.readAsText(thesrcxmlfile, encoding); // 'utf-16' type is called 'utf16le'
    // 2. remove the head line '<encoding="utf-16"?>', and clean the srcxml ()
    let thebodyxmlstr = thesrcxmlstr.split('encoding="utf-16"?>')[1]
    let thesrcxmlstr_cleaned = cleanxmlstr(thebodyxmlstr)
    // 3. make a doms_obj for the cleaned src xml
    let projectxml_jq = $(thesrcxmlstr_cleaned)
    // console.log('line47', v8_doms_obj)
    return { 'projectxml_jq': projectxml_jq, 'projectxml_str': thesrcxmlstr }
}; //async function get_xml_from_egp

// clean up the xmlstr
function cleanxmlstr(thexmlstr) {

    // to cleanup the nonprintable chars
    // let thexmlstr_remove_nonprintable = thexmlstr.replace(/[^\x20-\x7E\s\S]+/g, "")
    let thexmlstr_remove_nonprintable = thexmlstr

    // the xmlstr is messed up with strange chars like &amp;lt; &lt;, etc
    // The following is to change &amp;lt to <, &gt to > ...
    // let thesrcxmlstr_ampersand_code_normalized = normalize_ampersand_code(thexmlstr_remove_nonprintable)
    // Note: second thought! do not convert ampersand symbols. These ampersand symbols are necessary for SAS EGP to identify settings within an xml tag from xmltag
    // for example within <DNA>  </DNA>, the html '&lt;DNA...&gt;DNA' has special meanings for SAS EG to identify (in this case, to identify the setting for location of an external file)
    // If the ampersand code '&lt;' is converted, SAS EG will wrongly consider it as an xml tag, and ignore the settings.  
    let thesrcxmlstr_ampersand_code_normalized = thexmlstr_remove_nonprintable

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
    // console.log(thesrcxmlstr_normalized_2)

    //3. remove the comments (code within <!--  and -->)
    let thesrcxmlstr_removecomments = removecomments(thesrcxmlstr_selfclosing_converted)
    // console.log(thesrcxmlstr_removecomments)

    return thesrcxmlstr_removecomments
}; //

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

function wxtc() {
    this.make = function () {
        // make an empty w:tc
        let wxtc_jq = new wxo('w:tc').make()
        // nest a w:tcPr within w:tc
        let wxtcpr_jq = new wxo('w:tcPr').make().appendto(wxtc_jq)
        // nest a tcW within w:tcPr
        let wxtcw_jq = new wxo('w:tcW').make().appendto(wxtcpr_jq)
        wxtc_jq.appendto = function (parent_jq) {
            parent_jq.append(wxtc_jq)
            return wxtc_jq
        }
        return wxtc_jq
    } // this.make
} // wxtc

function wxr() {
    this.make = function () {
        // make an empty w:r
        let wxr_jq = new wxo('w:r').make()
        // nest a w:rPr within w:r
        let wxrpr_jq = new wxo('w:rPr').make().appendto(wxr_jq)
        wxr_jq.appendto = function (parent_jq) {
            parent_jq.append(wxr_jq)
            return wxr_jq
        }
        return wxr_jq
    } // this.make
} // wxtc

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
} // the word xml object (wxo)


// make a word tbl row xml (with empty cells and paragraphs)
function wxtr(width_cols_str, shdattrs_headrow, gridSpanAttrs, width_tbl, n_cols) {
    this.gridSpanAttrs = gridSpanAttrs
    this.width_cols_str = width_cols_str
    this.shdattrs_headrow = shdattrs_headrow
    this.width_tbl = width_tbl
    this.n_cols = n_cols
    this.make = function () {
        // set default table width, and make a column width string by evenly divide width of column
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

        // Define an array of column width values (cols_width_arr)
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
            let thecell_jq = new wxo('w:tc').make().appendto(tr_jq)
            // add a selector for cell property
            let thecell_pr_jq = new wxo('w:tcPr').make()
            thecell_jq.append(thecell_pr_jq)
            // set width
            thecell_pr_jq.append(new wxo('w:tcW', { 'w:w': d.width, 'w:type': 'dxa' }).make())

            // if fill is defined, set fill color
            if (this.shdattrs_headrow) {
                thecell_pr_jq.append(new wxo('w:shd', { ...this.shdattrs_headrow, ...{ 'w:type': 'dxa' } }).make())
            } //if (this.shdattrs_headrow) {

            // in the cell property tag, add a tag(w:gridSpan) to define horizontal merging: wxo()
            if (this.gridSpanAttrs) { thecell_pr_jq.append(new wxo('w:gridSpan', this.gridSpanAttrs).make()) } //if (gridSpanAttrs)

            // get the text of the corresponding cell
            let celltext = celltext_arr[col_index].celltext
            // make a paragraph for the text, and append to the cell
            let p_jq = new wxp([celltext]).make().appendto(thecell_jq)

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