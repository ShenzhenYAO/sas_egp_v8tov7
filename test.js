// load custom modules
const mymodules = require('./localbackend/app/mytools/mymodules');
// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

const srcfolder = 'data/in/prototype/__xml/egpv8/';

(async () => {
    let x = new wxo('div').make()
    let y = new wxo('text', null, null, 'this is a test').make().appendto(x)
    console.log(x.prop('outerHTML'))
})()

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
        _jq.appendto = function (parent_jq){
            parent_jq.append(_jq)
        }
        return _jq
    } // this.make
} // the word xml object (wxo)

