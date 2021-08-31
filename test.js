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


/*
within ProjectCollection.Elements, add a task component
       <Element Type="SAS.EG.ProjectElements.CodeTask">
            <Element>
                <Label>pfd1 p1</Label>
                <Type>TASK</Type>
                <Container>PFD-g1w76DFl1gaR65CW</Container>
                <ID>CodeTask-fGud3CP5bdr2Hxot</ID>
                <CreatedOn>637657899265464154</CreatedOn>
                <ModifiedOn>637657899763139188</ModifiedOn>
                <ModifiedBy>Z70</ModifiedBy>
                <ModifiedByEGID>Z70</ModifiedByEGID>
                <ModifiedByEGVer>7.100.5.6226</ModifiedByEGVer>
                <HasSerializationError>False</HasSerializationError>
                <InputIDs />
            </Element>
            <SubmitableElement>
                <UseGlobalOptions>True</UseGlobalOptions>
                <Server>Local</Server>
                <HASERROR>False</HASERROR>
                <HASWARNING>False</HASWARNING>
                <HtmlActiveOverride>false</HtmlActiveOverride>
                <RtfActiveOverride>false</RtfActiveOverride>
                <PdfActiveOverride>false</PdfActiveOverride>
                <SasReportActiveOverride>true</SasReportActiveOverride>
                <ListingActiveOverride>false</ListingActiveOverride>
                <PowerpointActiveOverride>false</PowerpointActiveOverride>
                <ExcelActiveOverride>false</ExcelActiveOverride>
                <AutoDisplayActiveOverride>true</AutoDisplayActiveOverride>
                <PdfStyleOverride>Pearl</PdfStyleOverride>
                <RtfStyleOverride>RTF</RtfStyleOverride>
                <HtmlStyleNameOverride>HtmlBlue</HtmlStyleNameOverride>
                <HtmlStyleCategoryOverride>BuiltIn</HtmlStyleCategoryOverride>
                <HtmlStyleUrlOverride>F:\Program Files\SASHome\SASEnterpriseGuide\7.1\Styles\HtmlBlue.css</HtmlStyleUrlOverride>
                <SasReportStyleNameOverride>HtmlBlue</SasReportStyleNameOverride>
                <SasReportStyleCategoryOverride>BuiltIn</SasReportStyleCategoryOverride>
                <SasReportStyleUrlOverride>F:\Program Files\SASHome\SASEnterpriseGuide\7.1\Styles\HtmlBlue.css</SasReportStyleUrlOverride>
                <PowerpointStyleOverride>PowerPointLight</PowerpointStyleOverride>
                <ExcelStyleOverride>Excel</ExcelStyleOverride>
                <GraphDeviceOverride>Png</GraphDeviceOverride>
                <UseProjectSubmitOptions>true</UseProjectSubmitOptions>
                <SubmitToGrid>false</SubmitToGrid>
                <QueueSubmitsForServer>true</QueueSubmitsForServer>
                <ActionOnError>StopCurrentBranch</ActionOnError>
                <ExpectedOutputDataList />
                <Parameters />
                <ExecutionTimeSpan>-P10675199DT2H48M5.4775808S</ExecutionTimeSpan>
                <JobRecipe>
                    <JobRecipe>
                        <log />
                        <code />
                        <OutputDataList />
                        <ODSResultsList />
                    </JobRecipe>
                </JobRecipe>
            </SubmitableElement>
            <CodeTask>
                <IncludeWrapper>True</IncludeWrapper>
                <Embedded>True</Embedded>
                <DNA />
            </CodeTask>
        </Element>


        4. within ProjectColletion.External_Objects.ProcessFlowView.Graphics, add:
                <TaskGraphic>
                    <Type>Task</Type>
                    <Id>a0452d75-5792-454d-bd1b-ea1c5cb250d0</Id>
                    <LineWidth>1</LineWidth>
                    <Fill>false</Fill>
                    <PosX>24</PosX>
                    <PosY>12</PosY>
                    <Width>36</Width>
                    <Height>36</Height>
                    <Rotation>0</Rotation>
                    <Visible>true</Visible>
                    <Border>false</Border>
                    <AutoSize>true</AutoSize>
                    <Removable>true</Removable>
                    <Child>false</Child>
                    <Selected>false</Selected>
                    <Label>pfd1 p1</Label>
                    <Element>CodeTask-fGud3CP5bdr2Hxot</Element>
                </TaskGraphic>  

*/
