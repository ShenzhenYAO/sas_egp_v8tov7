module.exports = {
    readtxt:
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
        }
    ,
    getSentences:
        function getSentences(theparagraph) {
            // for each paragraph, use regexp to find punctuation boundries, and split into sentences
            //https://stackoverflow.com/questions/11761563/javascript-regexp-for-splitting-text-into-sentences-and-keeping-the-delimiter
            var theSentences = theparagraph.match(/[^。\.!\?]+[。\.!\?]+/g);
            // console.log(theSentences)
            return theSentences
        }
    ,
    textTosentencesJSON:
        function textTosentencesJSON(thetext) {

            // var thetxtparagraphs = thetext.split(/\r\n\r\n/) // for montaine apology only
            var thetxtparagraphs = thetext.split(/\r\n/) // for project 3 text import
            // console.log(thetxtparagraphs)

            var theTxtJSON = []
            thetxtparagraphs.forEach((d, i) => {
                var theparagraph = thetxtparagraphs[i]
                // get sentences
                // var theSentences = theparagraph.match(/[^\.!\?]+[\.!\?]+/g);
                var theSentences = this.getSentences(theparagraph)
                if (theSentences !== null
                    && theSentences !== undefined
                    && theSentences !== "") {
                    for (var j = 0; j < theSentences.length; j++) {
                        theSentence = '///t' + theSentences[j] + 't///' + '///h' + 'h///'
                        // push the sentences into the textJSON
                        var tmp = {}
                        tmp.paragraphid = i
                        tmp.sentenceid = j
                        tmp.sentence = theSentence
                        theTxtJSON.push(tmp)
                    }
                }
            })
            return theTxtJSON
        } //textTosentencesJSON

    ,
    saveJSON:
        async function saveJSON(thetxtjson, targetjsonfile) {
            var thetxtjosnstr = JSON.stringify(thetxtjson)
            // save it as a js at local
            var fs = require('fs');
            // use writeFileSync instead of writeFile to avoid async problems
            fs.writeFileSync(targetjsonfile, thetxtjosnstr, function (err) {
                if (err) {
                    console.log(err);
                }
            });
        } //saveJSON
    ,
    generateUUID:
        // randomly generate a non-repeating id
        //https://bl.ocks.org/adamfeuer/042bfa0dde0059e2b288
        function generateUUID() {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        },
    nesttreejson:
        /**
         * Note, it differs from nestchildrennodes().
         * nestreejson is static, it can only make tree jsons of paragraph and sentence
         * (it can insert tmp folders though)
         * nestchildrennodes() can make flexible layers defined by the user
     * for example, the flatnodes is an array, it contains sentences from a text called
     *  'apology'. these sentences are indicated for its paragraphid, sentenceid, and 
     *     contents (in the field sentence):
     * [
     *  {
     *      paragraphid:1,
     *      sentenceid: 4,
     *      sentence: 'blahblahblah'
     *  },
     * ...
     * ]
     * 
     * the following is create a hierrachical structure like
     * [
     *  {
     *      name: 'apology'
     *      idx: <a randomly created non-repeatable id>
     *      children: [
     *          {
     *              name: 'paragraph-0',
     *              idx:<a randomly created non-repeatable id>
     *              paragraphid:1 
     *              children: [
     *                  {name: '1.4', idx:<a random uid>, NodeDescription:'blahblahblah' },
     *                  {...}    
     *              ]    
     *          },
     *          ...
     *      ]
     *  }
     * ]
     * the name of a paragraph node is its paragraphid
     * the name of a sentence node is its paragraphid.setenceid
     * the NodeDescription of a sentence node is its sentence
     * 
     */

        // var rootname = 'apology'
        // var flatnodes = thetxtjson
        // var parentid='paragraphid'
        // var childid = 'sentenceid'
        // var nodedescfield = 'sentence'
        // var thetree=this.nesttreejson(flatnodes, rootname, parentid, childid, nodedescfield)

        function nesttreejson(flatnodes, rootname, parentid, childid, nodedescfield) {

            // create a root node
            var root = {}
            root.idx = this.generateUUID()
            root.name = rootname
            root.children = []

            parentids = []

            flatnodes.forEach(d => {

                // it does not work to directly get d[parentid]
                var keys = Object.keys(d)
                // get index of the key of the parent id (.e.g., the paragraph id)
                var parentkeyindex = keys.indexOf(parentid);
                // console.log(parentkeyindex)
                // console.log(d[keys[parentkeyindex]])

                // get index of the key of the child id (e.g.,  the sentence id)
                var childkeyindex = keys.indexOf(childid);
                // get index of the key of the nodedescfield (e.g.,  the field sentence)
                var nodedescfieldkeyindex = keys.indexOf(nodedescfield);

                // console.log('d=====')
                // console.log(d)
                // console.log(parentkeyindex)
                // console.log(d[keys[parentkeyindex]])

                // create nodes for parentids
                if (!parentids.includes(d[keys[parentkeyindex]])) {
                    parentids.push(d[parentid])
                    var parentnodeobj = {}
                    parentnodeobj.idx = this.generateUUID()
                    parentnodeobj.name = 'paragraph' + d[keys[parentkeyindex]]
                    parentnodeobj[parentid] = d[keys[parentkeyindex]] // creating the parent id 
                    parentnodeobj.children = []
                    root.children.push(parentnodeobj)
                }

                // push the sentences into the array of children nodes of the paragraph
                d.idx = this.generateUUID()
                d.name = d[keys[parentkeyindex]] + "." + d[keys[childkeyindex]] // e.g., the sentence id
                d.NodeDescription = d[keys[nodedescfieldkeyindex]] //e.g. the sentence
                delete d[keys[nodedescfieldkeyindex]]

                //find the parent node
                root.children.forEach(e => {
                    //e is a paragraph node
                    // why here can use the e[parentid] directly without searching for the key index
                    // because when it was created (in the above line with comment 'creating the parent id')
                    //      it is created as like ['paragraphid'], not as .paragraphid
                    if (e[parentid] === d[keys[parentkeyindex]]) {
                        // if mathced, push the sentence into the children array of the paragraph
                        e.children.push(d)
                    }
                })
            })

            return root

        }, // nesttreejson

    foldnodes:
        /**
         * The following function fold nodes into multiple layers
         * 
         * e.g., there are 500 paragraphs from an article, 
         * it'be painful to display 500 nodes at level one
         * 
         * the solution, for one, is to fold these 500 paragraphs into layers, and 
         *  inject these folding layers between the root and the paragraphs
         * suppose that the maxsize (max number fo children of a folding node) is 6
         * the 500 nodes should be folded into 3 layers, i.e., 
         *  - the 500 nodes are folded into 84 layer1 folding nodes, each containing up to 6 paragraphs
         *  - next, the 84 layerl folding nodes are folded again into 14 layer2 folding nodes, each contaiting up to 6 layer1 folding nodes
         *  - finally, the 14 layer2 folding nodes are folded into 3 layer3 folding nodes, each containing up to 6 layer 2 folding nodes 
         * 
         * in math, the numer of folding nodes = floor of log(500) / log(6) = 3
         * 
         * The following is to make such foldings
         * 
         * In addition, it adds one more layer called substeps between the root and the folding nodes 
         * Making the hierrachy like
         * 
         * root 
         *      substeps
         *          folding layer3
         *              folding  layer 2
         *                  folding layer 1
         *                      paragraphs
         *                          sentences
         *   
         * The additonal layer substeps has special applications in my d3 tree diagram:
         *      it can be hidden!
         * 
         * That way, we can pull out and work on a few nodes while hiding the rest, pretty handy.
         * 
         */
        function foldnodes(thejson, maxsize) {

            //**** This part is not used, just for analysis ******************/
            var level1nodes = thejson.children.length
            // console.log(level1nodes)
            // the problem is that there are too many nodes at level 1
            // in this case, there are 497 paragraphs
            /**Note the following is to make it flexible in choosing the base of the log
             * there is no function like log9 ( log function with a base of 9)
             * However, in math log9(x) = log(x) / log(9)
             */
            var layersfloat = Math.log(level1nodes) / Math.log(maxsize)
            var folderlevels = Math.floor(layersfloat)
            //**************************************************************** */

            //make a new root
            var newroot = {}
            newroot.name = thejson.name
            newroot.idx = thejson.idx
            newroot.children = []

            // set a node called substeps to hold the foldered nodes
            newroot.children[0] = {}
            newroot.children[0].name = 'substeps'
            newroot.children[0].idx = this.generateUUID()
            newroot.children[0].children = []


            // loop for level one children nodes in the original json
            // nest these nodes into nodes in a folding layer, recursively
            function addfolder(srcnodes) {

                var k = maxsize
                var fnodeindex = -1
                var foldernodes = []
                srcnodes.forEach(d => {
                    k = k + 1;
                    if (k > maxsize - 1) {
                        fnodeindex = fnodeindex + 1
                        var tmp = {}
                        tmp.name = 'tmp.' + fnodeindex
                        tmp.idx = this.generateUUID // this is to call a module at the grandparent level, do not make it generateUUID()
                        tmp.children = []
                        k = 0
                        foldernodes.push(tmp)
                    }
                    // put the crrent d into the last ele in foldernodes
                    foldernodes[foldernodes.length - 1].children.push(d)
                })

                // check the length of the result foldernodes
                var nfolders = foldernodes.length
                var foldernodes2 = []
                // console.log(foldernodes)
                if (nfolders > maxsize) {
                    foldernodes2 = addfolder(foldernodes)
                    // console.log(foldernodes2.length)
                }

                if (foldernodes2.length === 0) {
                    return foldernodes
                } else {
                    return foldernodes2
                }

            } // addfolder()

            var folded = addfolder(thejson.children)
            // console.log(folded)    
            // store the folded nodes into the node 'substeps', not to the root
            newroot.children[0].children = folded
            // console.log(newroot)

            return newroot

        }// foldnodes()
    ,

    filterJson:
        // from flatjson, select elements of chapter 29
        // https://stackoverflow.com/questions/54000937/how-to-filter-an-json-object-by-another-object-javascript/54000976
        function filterJson(srcjson, filterArray) {

            // var resultjson = srcjson.filter(item => filterArray.every(f =>
            //     f.value.includes(item[f.id])
            // ))
            /**This is not correct at all
             * if srcjosn = [{'paragraphid': 10}, {'paragraphid': 1}]
             * and the filterArray= [{ "id": 'paragraphid', "value": '10' }]
             * guess what? the filter result includes both!
             * resultjson = [{'paragraphid': 10}, {'paragraphid': 1}]
             * the {'paragraphid': 1} should not be there
             * The problem is 'includes'
             * 
             * The following is modified, using exactly match '==='
             */

            var resultjson = srcjson.filter(item => filterArray.every(f =>
                item[f.id] === f.value
            ))

            // The above is in reduced format. The following shows the details

            // var resultjson = srcjson.filter(item => {
            //    // it is like return item.paragraph === 10
            //    // tmp1 is a collection of items that has bee selected for 'true' condition     
            //      var tmp1 = 
            //      filterArray.every(f => {
            //         var tmp2 =  (item[f.id] === f.value)//return true or false
            //         return tmp2
            //      })
            //     return tmp1
            // })

            return resultjson
        } // filterJson
    ,
    makechildrennodes:
        // to make children nodes
        /**e.g., the srcjson contains {chapter:'chapter1', paragraphid: 'p1'} 
         * this function select disticnt values in 'paragraphid', 
         *  and convert the srcjson to items like
         * {idx:<uuid>, level: 'paragraphid', name: 'p1'}
         * The result array can be save as, in a tree json, .children of the parent node 
         * (of data at chapter level)
        */
        function makechildrennodes(srcjson, parentlevelvar, childlevelvar, descvar) {
            var childrennodes = []
            srcjson.forEach(d => {
                // update the array of childrennodenames
                var childrennodenames = childrennodes.map(a => a['name'])
                // console.log(childrennodenames)
                // console.log(d[childlevelvar])
                if (!childrennodenames.includes(d[childlevelvar])) {
                    var tmp = {}
                    tmp['idx'] = this.generateUUID()
                    tmp['level'] = childlevelvar
                    tmp['name'] = d[childlevelvar]

                    // tmp[parentlevelvar] = d[parentlevelvar]
                    if (descvar !== undefined) {
                        tmp['NodeDescription'] = '///t <br/>  ' + d[descvar] + '<br/>   t///  <br/> ///h  <br/> h///'
                    } else[
                        tmp['children'] = [] // only add children node if it is not the bottom level
                    ]
                    childrennodes.push(tmp)
                }
            })
            return childrennodes
        } // makechildrennodes
    ,
    nestchildrennodes:
        /**This function is to make children nodes using the function  makechildrennodes()
         * and save it as .children of the parent node of a tree json. 
         * This function is more powerful than the function nesttreejson. In this function,
         * The nest layers are customized. In nesttreejson, the nesting layers are fixed (only can do paragraph and sentence, and tmp folders)
         */
        function nestchildrennodes
            (theparentnode, filterArray, flatjson_src,
                parentlevelvar, childlevelvar, descvar) {


            // console.log(thechildnode)
            // from the source flatjson, select items of the same document and chapter as in thechapternode
            var flatjson_result = this.filterJson(flatjson_src, filterArray)
            // console.log(flatjson_result)
            // console.log('the flatjson_result here should have the same parentlevel id')
            // console.log(flatjson_result[0])

            // specially for sentence, let node description be the sentence
            var treejson_result =
                this.makechildrennodes(flatjson_result, parentlevelvar, childlevelvar, descvar)
            //console.log(treejson_result)
            theparentnode.children = treejson_result
            // console.log(parentnode)

            // fold nodes if there are >6 children elements in treejson_result
            if (!(maxchildren === null || maxchildren === undefined)) {
                maxsize = maxchildren
                var foldaddedtreejson_results = this.foldnodes(theparentnode, maxsize)
                theparentnode.children = foldaddedtreejson_results.children[0].children
            }
            return { 'flatjson_result': flatjson_result, 'treejson_result': treejson_result }

        } //nestchildrennodes
    ,
    makenextleveltreenodes:
        /**This function is to make a tree json from a flat json. It is way more 
         * powerful than the function nesttreejson() in that the current one is more flexible
         * in customizing tree layers, while nesttreejson() can only make paragraph and senence
         */
        function makenextleveltreenodes(theresults, treelevels, currentlevel, thedesvar, maxchildren) {
            currentlevel = currentlevel + 1
            // console.log('running makenextleveltreenodes ===========' + currentlevel)
            // console.log('current level = ' + currentlevel)

            // console.log('=== flatjson')
            // console.log(theresults['flatjson_result'][theresults['flatjson_result'].length-1])

            var parentlevelvar = treelevels[currentlevel - 1]
            var childlevelvar = treelevels[currentlevel]
            // console.log('parent and children level ===')
            // console.log(parentlevelvar, childlevelvar)

            var treejson_result = theresults['treejson_result']
            var flatjson_result = theresults['flatjson_result']

            treejson_result.forEach(d => {

                // select the node (e.g., a paragraph)
                var theparentnode = d

                // console.log('=== theparentnode')
                // console.log(theparentnode)

                // console.log(theparentnode)
                if (currentlevel < 2) {
                    var filterArray = []
                } else {

                    var filterArray = [
                        { "id": parentlevelvar, "value": d['name'] } // must use the string '7875', not the number 7875
                    ]
                }
                // console.log('the filterArray is ===========')
                // console.log(filterArray)


                var flatjson_src = flatjson_result

                // parentlevelvar = thelevelvar,
                // childlevelvar = 'sentenceid';

                // determine desc var
                if (currentlevel < treelevels.length - 1) {
                    var descvar = undefined
                } else {
                    var descvar = thedesvar
                }
                // console.log(descvar)

                var theresults = this.nestchildrennodes(theparentnode, filterArray, flatjson_src,
                    parentlevelvar, childlevelvar, descvar, maxchildren)
                // console.log('level3, sentences=====================')
                // console.log(theparentnode)

                //make children level nodes level childrennodes        
                if (currentlevel < treelevels.length - 1) {
                    //get all paragraphs
                    var thelevelvar = treelevels[currentlevel]
                    this.makenextleveltreenodes(theresults, treelevels, currentlevel, thedesvar, maxchildren)
                }
            })
        }

    ,

    /**
 * **************************************************************
 *  get data from an dom element
 * **************************************************************
 */

    /**1. get all attributes, save as a collection */
    getAttrs:
        function getAttrs(theDOM) {
            var theAttrs = []
            var attrs_thedom = theDOM.attributes
            if (attrs_thedom !== undefined) {
                for (var i = 0; i < attrs_thedom.length; i++) {
                    tmp = {}
                    var attrName = attrs_thedom[i].nodeName
                    var attrValue = attrs_thedom[i].nodeValue
                    tmp[attrName] = attrValue // this is like {"attr1": "a"}
                    theAttrs.push(tmp)
                }
            }
            // console.log (theAttrs)
            return theAttrs
        },
    /** 2. get textContent, and innerHTML */
    // console.log(theDOM.textContent)
    // console.log(theDOM.innerHTML)
    /**
     * **************************************************************
     * get data of a DOM element
     * **************************************************************
     */
    getDomData:
        function getDomData(theDOM) {
            let data = {}
            data.tagName = theDOM.tagName
            data.attrs = this.getAttrs(theDOM)
            // data.text = theDOM.textContent
            data.innerHTML = theDOM.innerHTML
            data.TopTextContent = this.getTopTextContent(theDOM)
            // console.log(data)
            return data
        },
    // console.log(getDomData(theDOM))

    /**
     * **************************************************************
     * get sibling and children elements (not including text nodes)
     * **************************************************************
     */
    DOM2JSON:
        function DOM2JSON(doms, parentuuid) {
            let eles = []
            // loop for each sibling element
            let kk = -1 // to have a number to indicate the index of the current DOM within all peer DOMs at the same level
            for (let i = 0; i < doms.length; i++) {
                let theDOM = doms[i]
                if (theDOM.nodeType === 1) {
                    let tmp = {}
                    // console.log(i)
                    // console.log(theDOM)
                    let theDOMData = this.getDomData(theDOM)
                    kk = kk + 1
                    tmp.siblingid = kk
                    tmp.tagName = theDOMData.tagName
                    tmp.attrs = theDOMData.attrs
                    tmp.uuid = this.generateUUID()
                    tmp.parentuuid = parentuuid
                    // tmp.text = theDOMData.text                    
                    tmp.TopTextContent = theDOMData.TopTextContent
                    tmp.innerHTML = theDOMData.innerHTML
                    eles.push(tmp)

                    tmp.children = []
                    //check and go to children element nodes
                    // console.log('tagname', tmp.tagName)
                    // console.log("theDOM.innerHTML", theDOM.innerHTML)
                    // console.log("theDOM.childElementCount", theDOM.childElementCount)
                    // console.log("theDOM.children", theDOM.children.length)
                    // if (theDOM.childElementCount > 0) {
                    if (theDOM.children && theDOM.children.length > 0) {
                        // console.log("theDOM.children",  theDOM.children)
                        let theDOM_children = theDOM.children
                        // console.log('children eles==========')
                        let parentuuid_ofchildren = tmp.uuid // do not call it parentuuid again, will mess up with parentuuid of the current DOM 
                        let theDOMData_children = this.DOM2JSON(theDOM_children, parentuuid_ofchildren)
                        // console.log(theDOMData_children)
                        tmp.children = theDOMData_children
                    } // end if
                }

            }// end fo i
            return eles
        } // DOM2JSON()

    ,
    getAttrValueByName:
        /** get attribute of a DOM by the name of the attribute
         * e.g., get the value of class of the DOM <div class='sp'></sp>
         */
        function getAttrValueByName(theDOM, attrname) {
            // get all attrs
            var resultattrvalue
            if (theDOM.attrs.length > 0) {
                // either way works
                // method 1
                // theDOM.attrs.reverse().forEach(d=>{
                //   if (Object.keys(d)[0] === attrname) {
                //     var resultattrvalue = d[attrname]
                //   }
                // })
                // method 2
                var resultattr = theDOM.attrs.filter(d => (Object.keys(d)[0] === attrname))
                if (resultattr.length > 0) {
                    resultattrvalue = resultattr[0][attrname]
                }
            }
            return resultattrvalue
        } // getAttrValueByName()
    ,
    // to flatten an hierrachical json 
    // note: for recursive functions, do not use arrays without returning
    // the array, otherwise will cause error
    // Here, do not use ancestor array, instead use ancestorstr
    flattenJSON:
        function flattenJSON(theJSON, flatJSON, generation, ancestorstr) {
            if (ancestorstr === null || ancestorstr === undefined) {
                ancestorstr = ''
            }
            if (generation === undefined || generation === null) {
                generation = 0
            }
            theJSON.forEach(d => {
                d.generation = generation
                // remove the first ','
                if (ancestorstr.substr(0, 1) === ',') {
                    ancestorstr = ancestorstr.substr(1, ancestorstr.length)
                }
                d.ancestors = ancestorstr
                flatJSON.push(d)
                if (d.children.length > 0) {
                    flattenJSON(d.children, flatJSON, d.generation + 1, (d.ancestors + ',' + d.uuid))
                }
            })
            return flatJSON
        } // flattenJSON()

    ,
    /**Add categories for a DOM from the text political decay
     * details can be found in ./js/mymodules/domcategorytutorial
     */
    addDOMCategory_politicaldecay:
        function addDOMCategory_politicaldecay(theDOM, flatJSON) {

            // jsdom and jquery must be used together
            const jsdom = require("jsdom");
            const { window } = new jsdom.JSDOM(`...`);
            var $ = require("jquery")(window);

            /** Questions pertaining categorizing the DOM
             * 1. What is its tag
             * 2. What are the attributes (name and value)
             * 3. What is the innerHTML
             * 4. What is the innerText
             * 5. What is the caplitalization (upper/lower) of the text
             * 6. Is the text purely comprised of number
             * 7. Who are the children DOMs of it
             * 8. Who is the sibling DOM right before it
             * 9. Who is the sibling DOM right after it
             * 10. And after all, what is the type of the DOM (a part title, a chapater title? etc)
             */

            /**1. Its tag */
            // var theTag = theDOM.tagName
            //  console.log(theTag)
            /**2. Its attributes */
            // var theAttrs = theDOM.attrs
            //  console.log(theAttrs)
            /**3. the innerHTML */
            // var theInnerHTML = theDOM.innerHTML
            //  console.log(theInnerHTML)
            /**4. the innerText. To save space, the innerText is not saved as it is contained
             * in the innerHTML. The idea is to wrap the innerHTML with a div tag, and 
             * get its textContent (need jsdom and jquery to convert the string into a DOM)
             */
            var theInnerText = $('<div>' + theDOM.innerHTML + '</div>')[0].textContent
            // console.log(theInnerText)
            /**5. the caplitalization (upper/lower) of the text */
            var textCaptalization = theInnerText.toUpperCase() === theInnerText;
            // console.log(textCaptalization)
            /**6. Is the text purely comprised of number */
            // https://stackoverflow.com/questions/13229968/js-regex-for-numbers-and-spaces
            // only contains white spaces and digits, must have 1+ digits
            var textIsNum = /^(?=.*\d)[\d ]+$/.test(theInnerText)
            // console.log(textIsNum)
            //7. Who are its children DOMs
            // var theChildrenDOMs = theDOM.children
            // console.log(theChildrenDOMs)

            /**8 and 9. Who is the sibling DOM right before/after it
             * Note: !!!
             * These may not be the neighboring DOMs in the flatJSON. The neighboring
             *  DOMs in the flatJSON can be of different layers
             * 
             * To get it, need to determine
             * a. the parent of the current DOM
             * b. the children index of the current DOM in the parent DOM
             * 
             * To determine the parent DOM, a uuid (will be required for all DOMs)
             * also, each DOM is required to have a siblingid to indicate its position
             * among all peer level siblings. These have been done in the module DOM2JSON
             * 
            */
            //8. Who is the sibling DOM right before it
            //8a. get the uuid of the parent DOM
            var parentuuid = theDOM.parentuuid
            //8b. identify the parent DOM. Need to have an array of flatterned DOMs
            var filterArray = [{ "id": 'uuid', "value": parentuuid }]
            var thepatrentDOM = this.filterJson(flatJSON, filterArray)
            // console.log(thepatrentDOM)
            //8d. the children DOMs of the parent DOM (i.e., the siblings of the current DOM)
            var thesiblingDOMs = thepatrentDOM[0].children
            // console.log(thesiblingDOMs)
            //8c. the sibling DOM before (is [] if it does not exist )
            var filterArray = [{ "id": 'siblingid', "value": theDOM.siblingid - 1 }]
            var theSiblingDOMBefore = this.filterJson(thesiblingDOMs, filterArray)
            // console.log(theSiblingDOMBefore)

            //9. Who is the sibling DOM right after it (is [] if it does not exist )
            var filterArray = [{ "id": 'siblingid', "value": theDOM.siblingid + 1 }]
            var theSiblingDOMAfter = this.filterJson(thesiblingDOMs, filterArray)
            // console.log(theSiblingDOMAfter)

            /** 10. with all info above, it is time to determine the category of the DOM 
             * The Categories include: (see ./data/out/ignore/political decay/html_structure.xlsx)
             * Start box
             * Part title
             * Part subtitle
             * Chapter number
             * Chater title
             * Chapter summary
             * Chapter introduction section
             * section title
             * Paragraph
             * figure link
             * figue id and title
             * figure source 
             * citation
             * stop box
            */

            /** 10.1 is it a startbox
             * A statbox satisfies the followings
             * a. its tagname='P'
             * b. its attr of  id = 'calibre_link-1514 
            */
            // get the attr of id
            // var filterArray=[{ "id": 'id', "value": 'calibre_link-1514'}]
            // var theattr = this.filterJson(theAttrs, filterArray)
            // // console.log(theattr)
            // var theattr_value = theattr.id
            // // console.log(theattr_id_value)
            // the above is too clumpsy, try the following function (built in mymodules)
            var attrname = 'id'
            var theattr_value = this.getAttrValueByName(theDOM, attrname)
            // console.log('by function getAttrByName ====')
            // console.log(theattr_value)
            if (theDOM.tagName === 'P' && theattr_value === 'calibre_link-1514') {
                theDOM.category.push('start box')
            }

            /**10.2 part title 
             * A part title satisfies the followings
             * a. tagName='P'
             * b. class = 'pn'
             * c. text all in uppercase
             * d. text is not pure numbers, i.e., it contains letters
            */
            // get the attr of class
            var attrname = 'class'
            var theattr_value = this.getAttrValueByName(theDOM, attrname)
            if (theDOM.tagName === 'P' && theattr_value === 'pn' && textCaptalization === true
                && textIsNum === false) {
                theDOM.category.push('part title')
            }

            /**10.3 part subtitle 
             * A part subtitle title satisfies the followings
             * a. tagName='P'
             * b. class = 'pt'
            */
            var attrname = 'class'
            var theattr_value = this.getAttrValueByName(theDOM, attrname)
            // console.log(theattr_value)
            if (theDOM.tagName === 'P' && theattr_value === 'pt') {
                theDOM.category.push('part sub title')
            }

            /**10.4 chapter number 
             * It satisfies the followings
             * a. tagName='P'
             * b. class = 'pn'
             * c. it only contains digits and white spaces
            */
            var attrname = 'class'
            var theattr_value = this.getAttrValueByName(theDOM, attrname)
            // console.log(theattr_value)
            if (theDOM.tagName === 'P' && theattr_value === 'pn' && textIsNum === true) {
                theDOM.category.push('chapter number')
            }

            /**10.5 chapter title
             * It satisfies the followings
             * a. tagName='P'
             * b. class = 'ct'
             * c. text all in uppercase
            */
            var attrname = 'class'
            var theattr_value = this.getAttrValueByName(theDOM, attrname)
            // console.log(theattr_value)
            if (theDOM.tagName === 'P' && theattr_value === 'ct' && textCaptalization === true) {
                theDOM.category.push('chapter title')
            }


            /**10.6 chapter summary
             * It satisfies the followings
             * a. tagName='P'
             * b. class = 'csum'
             * c. the category of the sibling before it is 'chapter title'
            */
            var attrname = 'class'
            var theattr_value = this.getAttrValueByName(theDOM, attrname)
            // console.log(theattr_value)
            if (theDOM.tagName === 'P' && theattr_value === 'csum'
                && theSiblingDOMBefore[0].category.includes('chapter title')
            ) {
                theDOM.category.push('chapter summary')
            }

            /**10.7 section title
            * It satisfies the followings
            * a. tagName='P'
            * b. class = 'h'
            * c. text all in uppercase
           */
            var attrname = 'class'
            var theattr_value = this.getAttrValueByName(theDOM, attrname)
            // console.log(theattr_value)
            if (theDOM.tagName === 'P' && theattr_value === 'h' && textCaptalization === true) {
                theDOM.category.push('section title')
            }

            /**10.8 paragraph
            * It satisfies the followings
            * a. tagName='P'
            * b. class = 'tni'
           */
            var attrname = 'class'
            var theattr_value = this.getAttrValueByName(theDOM, attrname)
            // console.log(theattr_value)
            if (theDOM.tagName === 'P' && theattr_value === 'tni') {
                theDOM.category.push('paragraph')
            }

            /**10.9 figure link
            * It satisfies the followings
            * a. tagName='IMG'
            * b. class = 'calibre5'
            * c. text all in uppercase
           */
            var attrname = 'class'
            var theattr_value = this.getAttrValueByName(theDOM, attrname)
            // console.log(theattr_value)
            if (theDOM.tagName === 'IMG' && theattr_value === 'calibre5' && textCaptalization === true) {
                theDOM.category.push('figure link')
            }

            /**10.10 figure title
            * It satisfies the followings
            * a. tagName='P'
            * b. class = 'cst'
           */
            var attrname = 'class'
            var theattr_value = this.getAttrValueByName(theDOM, attrname)
            // console.log(theattr_value)
            if (theDOM.tagName === 'P' && theattr_value === 'cst') {
                theDOM.category.push('figure title')
            }

            /**10.11 figure source
             * It satisfies the followings
             * a. tagName='P'
             * b. class = 'fgh-source'
            */
            var attrname = 'class'
            var theattr_value = this.getAttrValueByName(theDOM, attrname)
            // console.log(theattr_value)
            if (theDOM.tagName === 'P' && theattr_value === 'fgh-source') {
                theDOM.category.push('figure source')
            }

            /**10.12 quote
             * It satisfies the followings
             * a. tagName='P'
             * b. class = 'csum'
             * c. the category of the sibling before it is 'paragraph' 
            */
            var attrname = 'class'
            var theattr_value = this.getAttrValueByName(theDOM, attrname)
            // console.log(theattr_value)
            if (theDOM.tagName === 'P' && theattr_value === 'csum'
                && theSiblingDOMBefore[0].category.includes('paragraph')
            ) {
                theDOM.category.push('quote')
            }

            /**10.13 stop box
             * It satisfies the followings
             * a. tagName='DIV'
             * b. id = 'calibre_link-211'
            */
            var attrname = 'id'
            var theattr_value = this.getAttrValueByName(theDOM, attrname)
            // console.log(theattr_value)
            if (theDOM.tagName === 'P' && theattr_value === 'calibre_link-211') {
                theDOM.category.push('stopbox')
            }

            // do not have to ruturn it
            return theDOM

        } // add DOM category
    ,

    //to replace the img src from a link to the files in a zip to  a base64 string
    convertimgsrc:
        async function convertimgsrc(theinnerhtml, thezip) {
            var AdmZip = require('adm-zip');
            // jsdom and jquery must be used together
            const jsdom = require("jsdom");
            const { window } = new jsdom.JSDOM(`...`);
            var $ = require("jquery")(window);

            if (theinnerhtml.indexOf('<img ') >= 0) {

                // var theinnerhtml = str.replace(/s+/g, ' ')
                // var theinnerhtml = theinnerhtml.replace("\n", ' ')

                //Note: do not use split() as there could be multiple incidence of <img
                // find the position of the first <img
                var p1 = theinnerhtml.indexOf('<img ')
                // console.log(p1)

                // seg 1, the part before <img ...
                var seg1 = theinnerhtml.substr(0, p1 - 1)
                // console.log(seg1)

                // seg 1a, the rest part, including <img...
                var seg1a = theinnerhtml.substr(p1, theinnerhtml.length)
                // console.log(seg1a)

                // find the position of the first > in seg1a, i.e., the > of the img tag
                var p2 = seg1a.indexOf('>')

                // the entire segment of the img tag
                var imghtml = seg1a.substr(0, p2 + 1)
                // console.log(imghtml)

                // the seg3, i.e., the rest of the string afer the img segment
                var seg3 = seg1a.substr(p2 + 2, seg1a.length)
                // console.log(seg3)

                // dealing with the imghtml
                // determine the src// get the class name
                // change the html string to an array of doms
                let thedoms = $(imghtml)
                // get data (i.e., attrs) of a dom
                let thedomdata = this.getDomData(thedoms[0])
                // get the attri src's value
                var attrname = 'src'
                var theimgfilestr = this.getAttrValueByName(thedomdata, attrname)
                // the result is the folder and file name of the image in the zip
                // console.log (theimgfile)

                //https://github.com/cthackers/adm-zip/wiki/ADM-ZIP#a6 
                var zip = new AdmZip(thezip);
                var theimgbuffer = await zip.readFile(theimgfilestr);
                var imgbase64str = theimgbuffer.toString('base64')
                // console.log(imgbase64str)
                var srcbase64str = 'data:image/jpeg;base64, ' + imgbase64str

                // finally, in the imgstr, replace the string of theimgfile with the srcbase64str
                var imghtmlbase64 = imghtml.replace(theimgfilestr, srcbase64str)
                // console.log(imghtmlbase64)

                // now recursively deal with the seg3 which may contains more <img tags
                if (seg3.indexOf('<img ') >= 0) {
                    var seg3a = await this.convertimgsrc(seg3, thezip)
                } else {
                    var seg3a = seg3
                }

                var result = seg1 + imghtmlbase64 + seg3a

            } else {
                var result = theinnerhtml
            } // if else theinnerhtml contains <img 

            return result

        }, // convertimgsrc

    /*******following are new functions only added in this mymodules.js**************************************** */

    saveLocalTxtFile:
        async function saveLocalTxtFile(thetxtstr, targettxtfile, encoding) {
            encoding = encoding || 'utf-8' // by default using utf-8
            let fs = require('fs');
            // use writeFileSync instead of writeFile to avoid async problems
            fs.writeFileSync(targettxtfile, thetxtstr, encoding, function (err) {
                if (err) { console.log(err); }
            });
        },
    // get the textContent of the top level of the dom (not including inner text of its children)
    getTopTextContent:
        //function to remove it's children
        function getTopTextContent(theDom) {

            // make a copy of theDom (theDom_copy), and work on theDom_copy
            let jsdom = require("jsdom");
            let { window } = new jsdom.JSDOM(`...`);
            let $ = require("jquery")(window);
            // get the innerHTML of theDOM
            let DOMOuterHTML = theDom.outerHTML
            let theDom_copy = $(DOMOuterHTML)[0]

            // Note: do not work on theDom directly. Once the children nodes are deleted from theDom, it'll affect theDom object outside of the current function
            //       As a result, children nodes of theDom object outside the current function will also be removed
            // the idea is to remove all children of theDom_copy, so that the theDom only contains textContent of itself
            for (let i = theDom_copy.children.length - 1; i >= 0; i--) {
                theDom_copy.children[i].remove()
            }
            let toptext = theDom_copy.textContent
            // console.log(toptext)
            return toptext
        },


    /* by default, jsdom change tagnames to uppercase, attr names to lowercase. 
    the tagnames in uppercase is ok for SAS to read (as long as the tag /tag are consistently in uppercase)
    however, SAS does not recognize attr names if the case form is changed (e.g., from EGVision to egvision)
    the following is to test how to keep the original case form of tagnames and attr names 

    Here are the ideas:
    the tagname (TAG1) in the original tag is like '<TaG1 ', so we can match '<' + tagname.toUpperCase()+ ' '
        to the original str to find the tagname in original case form
    (note, do not try to match the trailing tag like </tAg3>. in the given case, such trailing tag does not exist)
*/

    // let caseConvertedTagName = 'TAG1'
    // let originalTagName = getOriginalTagName(thestr, caseConvertedTagName)
    // console.log(caseConvertedTagName, "==>", originalTagName)
    getOriginalTagName:
        function getOriginalTagName(xmlstr, caseConvertedTagName) {
            let searchStr = '<' + caseConvertedTagName.toUpperCase() + ' '
            // search for the start position of the searchStr in the orignal html/xml str
            let startpos = xmlstr.toUpperCase().indexOf(searchStr)
            let originalName = caseConvertedTagName
            // search again if startpos=-1 (it could be that the tag is <SubmitableElement>)
            // in that case, search for '<SubmitableElement ' returns nothing
            // the following is to try again by search the tag like <SubmitableElement>
            if (startpos === -1) { 
                searchStr = '<' + caseConvertedTagName.toUpperCase() + '>'
                startpos = xmlstr.toUpperCase().indexOf(searchStr)
            }
            if (startpos !== -1) {
                // from the original html/xml string, get the segment between startpos+1 and caseConvertedName.length()
                originalName = xmlstr.substr(startpos + 1, caseConvertedTagName.length)
            }
            // console.log('startpos=', startpos, 'orignalName=', originalName)
            return originalName
        },

    // let caseConvertedAttrName = 'egvision'
    // let originalAttrName = getOriginalAttrName(thestr, caseConvertedAttrName)
    // console.log(caseConvertedAttrName, "==>", originalAttrName)
    getOriginalAttrName:
        function getOriginalAttrName(xmlstr, caseConvertedAttrName) {
            let searchStr = ' ' + caseConvertedAttrName.toUpperCase() + '='
            // console.log('searchStr=', searchStr)
            // search for the start position of the searchStr in the orignal html/xml str
            let startpos = xmlstr.toUpperCase().indexOf(searchStr)
            // console.log('startpos=', startpos)
            // from the original html/xml string, get the segment between startpos+1 and caseConvertedName.length()
            let originalName = caseConvertedAttrName
            if (startpos !== -1) {
                originalName = xmlstr.substr(startpos + 1, caseConvertedAttrName.length)
            }
            // console.log('startpos=', startpos, 'orignalName=', originalName)
            return originalName
        }, 
    getOriginalCase_of_TagAttrNames:
    // to recover the tagnames and attr names in the original text
    // the JSDOM normalizes the html of the DOM. Thus, the tagnames and attr names
    // after runing the funciton DOM2JSON, the innerHTML of the node is normalized, the tagNames are in uppercases, and the attr names in lowercases
    // As the innerHTML of a DOM object (DOM.innerHTML) created by JSDOM is already normalized, there is no way to recover the original case form of tagnames and attr names from DOM.innerHTML
    // the following is to recover the original case form of tagNames and attr names using the original xmlstr
    // note: it only recovers the .tagName and attr names in .attrs:[...] of elements theJSON (coverted by DOM2JSON). It cannot recover the .innerHTML property of the elements in theJSON
    function getOriginalCase_of_TagAttrNames(xmlstr, theJSON){
        let theJSON_originalCaseForm = []
        theJSON.forEach(d=>{
            d.tagName = this.getOriginalTagName(xmlstr, d.tagName)
            if (d.attrs && d.attrs.length >0){
                d.attrs.forEach(e=>{
                    // console.log(e)
                    // e is like {"egversion": "8.1"} in which 'egversion' is the key
                    //get the keyname of e 
                    let thekey = Object.keys(e)[0]
                    // console.log(thekey)
                    let thekey_originalcaseform = this.getOriginalAttrName(xmlstr, thekey)
                    // console.log(thekey_originalcaseform)
                    // replace thekey with thekey_originalcaseform. Indeed create a new element e[thekey_originalcaseform] and delete the element e[thekey]
                    e[thekey_originalcaseform]=e[thekey]
                    delete e[thekey]
                })
            }
            // if d has children, do recursion for the the children
            if (d.children && d.children.length > 0){
                d.children = this.getOriginalCase_of_TagAttrNames(xmlstr, d.children)
            }
            theJSON_originalCaseForm.push(d)
        })
        return theJSON_originalCaseForm
    }


} // module.export
