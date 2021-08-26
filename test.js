// load custom modules
const mymodules = require('./localbackend/app/mytools/mymodules');
// jsdom and jquery must be used together
const jsdom = require("jsdom");
const { window } = new jsdom.JSDOM(`...`);
var $ = require("jquery")(window);

const srcfolder = 'data/in/prototype/__xml/egpv8/';

(async () => {
    // search between 
 
      let str=`
      <projecttreeview egversion="7.1" usesubcontainers="True"></projecttreeview>
        
        <!-- Note !!! the tag ProcessFlowView is unique in v7, similar to ProcessFlowControlState in v8 
            however, there is only ONE ProcessFlowView in v7 for all ProcessFlows
            While in v8, there can be multiple ProcessFlowControlState, each for a ProcessFlow
        -->
        <processflowview>

        <!-- Note2 !!! the tag ProcessFlowView is unique in v7, similar to ProcessFlowControlState in v8 
            however, there is only ONE ProcessFlowView in v7 for all ProcessFlows
            While in v8, there can be multiple ProcessFlowControlState, each for a ProcessFlow
        -->
        <div></div>
      `
      let result = removecomments(str)
      console.log(result)

})()

function removecomments(thestr){
  let result = ''
  // split str by '<!--'
  let segments = thestr.split('<!--')
  for (let i=0;i<segments.length;i++){
    if (segments[i].includes('-->')){
      let theSeg=segments[i].split('-->')[1]
      result = result + theSeg
    } else {
      result = result +segments[i]
    }
  }
  return result
} //function removecomments





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