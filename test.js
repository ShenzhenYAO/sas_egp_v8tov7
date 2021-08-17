// load custom modules
const mymodules = require('./localbackend/app/mytools/mymodules');
// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

const srcfolder = 'data/in/prototype/__xml/egpv8/';

(async () => {
    // search between 
    let str =`
    <Tag1>
        <tAg2 attr="xx"></tAg2>
        <tAg3 attr="yy"></tAg3>
    </Tag1>
    <Tag5 />
    <Tag6 />
        <Tag6 />
    `

    let matched_arr1 = [...str.matchAll(/\<\/(.*)\>/g)]
    let matched_arr2 = [...str.matchAll(/\<(.*) \/\>/g)]
    console.log("matched_arr1", matched_arr1)
    console.log("matched_arr2", matched_arr2)

    // let str2 = 'test1test2'
    // const array = [...str2.matchAll(/t(e)(st(\d?))/g)];
    // console.log(array)
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