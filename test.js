// load custom modules
const mymodules = require('./localbackend/app/mytools/mymodules');
// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

const srcfolder = 'data/in/prototype/__xml/egpv8/';

(async () => {
  let config_pdfelement1 = {}
  config_pdfelement1.attrs =[{"Type":"SAS.EG.ProjectElements.PFD"}]
  config_pdfelement1.Label = 'Process Flow'
  config_pdfelement1.Type = 'CONTAINER'
  config_pdfelement1.Container = 'ProjectCollection-YSaOXvMlqZ6BRnFU'
  config_pdfelement1.ID = 'PFD-n8WHPEFdyR4ZkBwa'
  config_pdfelement1.CreatedOn = '637653859954823300'
  config_pdfelement1.ModifiedOn = '637653859954823300'
  config_pdfelement1.ModifiedBy = 'Z70'
  config_pdfelement1.ModifiedByEGID = 'Z70'

  let element_PFD1 = define_element(config_pdfelement1)
  console.log(element_PFD1.prop('outerHTML'))
})()

function define_element(config) {
  let xmlstr = `
 <Element>
      <Label></Label>
      <Type></Type>
      <Container></Container>
      <ID></ID>
      <CreatedOn></CreatedOn>
      <ModifiedOn></ModifiedOn>
      <ModifiedBy></ModifiedBy>
      <ModifiedByEGID></ModifiedByEGID>
      <ModifiedByEGVer>7.100.5.0</ModifiedByEGVer>
      <HasSerializationError>False</HasSerializationError>
      <InputIDs></InputIDs>
  </Element>
 `
  // make the obj
  let theElement_dom_obj = $(xmlstr)
  // set element attributes
  if (config.attrs && config.attrs.length > 0) {
    config.attrs.forEach(d => {
      theElement_dom_obj.attr(d.name, d.value)
    })
  }
  // set properties
  if (config.Label) { $(theElement_dom_obj.find('label')[0]).text(config.Lable) }
  if (config.Type) { $(theElement_dom_obj.find('Type')[0]).text(config.Type) }
  if (config.Container) { $(theElement_dom_obj.find('Container')[0]).text(config.Container) }
  if (config.ID) { $(theElement_dom_obj.find('ID')[0]).text(config.ID) }
  if (config.CreatedOn) { $(theElement_dom_obj.find('CreatedOn')[0]).text(config.CreatedOn) }
  if (config.ModifiedOn) { $(theElement_dom_obj.find('ModifiedOn')[0]).text(config.ModifiedOn) }
  if (config.ModifiedBy) { $(theElement_dom_obj.find('ModifiedBy')[0]).text(config.ModifiedBy) }
  if (config.ModifiedByEGID) { $(theElement_dom_obj.find('ModifiedByEGID')[0]).text(config.ModifiedByEGID) }
  if (config.ModifiedByEGVer) { $(theElement_dom_obj.find('ModifiedByEGVer')[0]).text(config.ModifiedByEGVer) }
  if (config.HasSerializationError) { $(theElement_dom_obj.find('HasSerializationError')[0]).text(config.HasSerializationError) }
  if (config.InputIDs) { $(theElement_dom_obj.find('InputIDs')[0]).text(config.InputIDs) }
  if (config.ModifiedBy) { $(theElement_dom_obj.find('ModifiedBy')[0]).text(config.ModifiedBy) }

  return theElement_dom_obj
} //define_element






// let xmlbodytext = `
// <DataModel>
//                 <Server>Local</Server>
//                 <ActiveDataSource>WORKA</ActiveDataSource>
//                 <DisplayName>A</DisplayName>
//                 <Table>A</Table>
//                 <RawActiveDataSourceState><DNA>
// <Type>Dataset</Type>
// <Name>A</Name>
// <Version>1</Version>
// <Assembly>SAS.EG.SDS.Model</Assembly>
// <Factory>SAS.EG.SDS.Model.Creator</Factory>
// <ParentName>WORK</ParentName>
// <Server>Local</Server>
// <Library>WORK</Library>
// </DNA></RawActiveDataSourceState>
//                 <DataSourceState>WORKA</DataSourceState>
//                 <TableState>A</TableState>
//                 <MemberType>Unknown</MemberType>
//             </DataModel>
// `