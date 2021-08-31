// load custom modules
const mymodules = require('./localbackend/app/mytools/mymodules');
// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

const srcfolder = 'data/in/prototype/__xml/egpv8/';

(async () => {

  let text = `
  
  <ProcessFlowView>

  <Zoom>1</Zoom>

  <Grid>True</Grid>



  <Layout>False</Layout>
  `
  console.log(remove_spaces_linebreakers(text))
  


})()

