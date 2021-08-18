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
    <DNA>&lt;DNA&gt;
    &lt;Type&gt;LocalFile&lt;/Type&gt;
    &lt;Name&gt;sas.sas&lt;/Name&gt;
    &lt;Version&gt;1&lt;/Version&gt;
    &lt;Assembly /&gt;
    &lt;Factory /&gt;
    &lt;FullPath&gt;C:\Users\Z70\Desktop\sas.sas&lt;/FullPath&gt;
  &lt;/DNA&gt;</DNA>
    `

    function htmlDecode(input){
        var e = $('<textarea>')[0];
        e.innerHTML = input;
        // handle case of empty input
        return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
      }
      
      let xxx =htmlDecode(str); 
      console.log(xxx)

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