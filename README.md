Source for showing xml nodes:
https://jsonformatter.org/xml-viewer 


Remaining issues:

1. Link is not shown in PFD
2. shortcut is not shown in PFD
compare the diff between converted and real v7

3. memory heap out issue
if heap out of memory, simply enlarge size:
 node --max-old-space-size=50000 localbackend/app/01_extract_projectxml_from_egp.js

For a real egp (the ones with 50+ programs), step 02 (converting xml to json requires to enlarge the old space size to 1000000 !).
Also, the step is very slow. May need to work around by adding elements in DOMs instead of converting to JSON objects.


 Note:
1. jsdom has errors when handling the xml tag <table>A</table>. Magically, it'll turn the script to <table></table>A. It seems that the tag name 'table' has special meanings to jsdom. The work around is to rename the tagname 'table' to whatever else (e.g., <table123></table123>)
2.adm-zip has errors when writing (.writeZip()) an existing zip object to local. The problem is probably that, before writing, the program needs to convert the zip object to Buffer (using .toBuffer()). The adm-zip must have messed it up, as the toBuffer() reports errors [Error: Invalid LOC header (bad signature)]. This could happen occasionally. The work around is to migrate entries (files with path) from the existing zip object to a new zip object. Specifically, all entries in the existing obj should be read (need to pay attention to reading as text or binary, also to encoding issues such as utf-8 or utf-16) and add into the new obj using Buffer. The details were given in localbackend/app/05_add_converted_xml_v7_to_egp.js. However, the code in that js file does not deal with binary files (e.g. images) or files with different encodings (all files were using utf-16 or precisely "utf16le" encoding in that js file). 
3. jquery does not work well with self closing tags (e.g., <SelfClosing />). This problem appears in both jquery 3.3 and 3.5. For example, the original xml is:
<SelfClosing />
<nextTag></nextTag>
after converting to jquery doms, it can be messed up as
<SelfClosing>
<nextTag>
    </SelfClosing>
</nextTag>
The tags are intertwined and invalid
The work around is to convert self closing tags to old school tags (e.g., converting <SelfClosing /> to <SelfClosing></SelfClosing>) before using jquery. To my knowlege, there is no RegEx that can do the job. I have created a function to handle it (see below). The idea is to recursively search for contents between <? /> and replace it with <?><?/>. In d3egp201, I had an alternative work around. That one, however, requires to list out the tagNames (i.e., some tags could be skipped if the tagname is not in the list). The following work around is better than the one in d3epg201

// convert <SelfClosing /> to <SelfClosing></SelfClosing>
function convertSelfClosingHTML_to_OldSchoolHTML(str){  
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
            str = convertSelfClosingHTML_to_OldSchoolHTML(str)
        }
    }
    return str
} // function convertSelfClosingHTML_to_OldSchoolHTML(str...
