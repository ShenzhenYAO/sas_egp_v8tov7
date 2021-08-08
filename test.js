// load custom modules
const mymodules = require('./localbackend/app/mytools/mymodules');
// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

(async () => {

    let xmlbodytext = "<DataModel><Tablel>A</Tablel></DataModel>"

    let thexmldom = $(xmlbodytext)
    let rootuuid = mymodules.generateUUID()
    let theJSON = mymodules.DOM2JSON(thexmldom, rootuuid)
    console.log(theJSON)

})()





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