There can be multiple process flow or tasks within a SAS Enterprise Guide Project (EGP) version 7 (v7) file.
1. The process flow is called PFD. There can be multiple PFDs in a project file, each is defined in ProjectCollection.Elements as individual tags of .Element:

ProjectCollection.Elements.Element[x]
    The properties of a PFD are defined in .Element, including
        Label: 
            ProjectCollection.Elements.Element[x].Element.Label
        Type: ('CONTAINER)
            ProjectCollection.Elements.Element[x].Element.Type
        Container: (the parent node's ID, i.e., ID of the project)
            ProjectCollection.Elements.Element[x].Element.Container
        ... and more
    A special tag is used to define the element type: ('ProcessFlow')
        ContainerElement.ContainerType: ('ProcessFlow')
        ProjectCollection.Elements.Element[x].ContainerElement.ContainerType
    Another special tag is used to define the details of the process flow diagram (PFD) :
        ProjectCollection.Elements.Element[x].PFD
        The .PFD tag contains a tag to define the process shown in PFD:
        ProjectCollection.Elements.Element[x].PFD.Process
            The nodes (e.g., tasks) in the .Process is defined by individual .Element:
            ProjectCollection.Elements.Element[x].PFD.Process.Element[x]
                Each node is identified by ID:(e.g., ID of a task)
                ProjectCollection.Elements.Element[x].PFD.Process.Element[x].ID

            The dependencies of the .process is defined in:
            ProjectCollection.Elements.Element[x].PFD.Process.Dependencies

        The process also has a property of _Type:('SAS.EG.ProjectElements.PFD')
        ProjectCollection.Elements.Element[x].PFD.Process._Type

The ID of the PDFs are also defined in:
ID: (id of the PDF)
ProjectCollection.Containers.ID[x]

2. A program is called a Task, which is defined as an element:
ProjectCollection.Elements.Element[x]
    The properties of a Task are defined in .Element, including
        Label defined in 
            ProjectCollection.Elements.Element[x].Element.Label
        Type defined in (Type value = 'TASK')
            ProjectCollection.Elements.Element[x].Element.Type
        ID defined in 
            ProjectCollection.Elements.Element[x].Element.ID
        Container: (the parent node's ID, i.e., ID of the PFD)
            ProjectCollection.Elements.Element[x].Element.Container
        ... and more
    It has a special tag to define the so called 'SubmitableElement':
        ProjectCollection.Elements.Element[x].SubmitableElement

        within .SubmitableElement, there are IDs of:
        the ID of log: 
        ProjectCollection.Elements.Element[x].SubmitableElement.JobRecipe.JobRecipe.log
        ID of the last submitted code element:
        ProjectCollection.Elements.Element[x].SubmitableElement.JobRecipe.JobRecipe.code
        ID of the OutputDatList (e.g., the id of the shortcut of the output data):
        ProjectCollection.Elements.Element[x].SubmitableElement.JobRecipe.JobRecipe.OutputDataList.ID[x]
        ID of the ODSResult elements:
        ProjectCollection.Elements.Element[x].SubmitableElement.JobRecipe.JobRecipe.ODSResultsList.ID[x]

    It has a special tag to indicate that the task element is a "CodeTask":
        ProjectCollection.Elements.Element[x].CodeTask
    It has a special tag to indicate the type again: ('SAS.EG.ProjectElements.CodeTask')
        ProjectCollection.Elements.Element[x]._Type 

It also appears in .ProjectTreeView:
ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x]
    The common properties of a task (a shotcut to sas file is also treated as a task)
    NodeType:('NODETYPE_PROGRAMFOLDER')
    ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x].Nodetype
    Expanded: ('True')
    ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x].Expanded
    Label: ('Programs', the label for programs. ***Note, the lable is not for task names/lables)

    The properties of individual tasks are defined in ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x].EGTreeNode[x]
    NodeType:('NODETYPE_ELEMENT')
    ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x].EGTreeNode[x].Nodetype
    ElementID: (ID of the task or shortcut to a sas file)
    ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x].EGTreeNode[x].ElementID
    Label: (name of the task or shortcut to a sas file)
    ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x].Label

It also appears as an icon in .Graphics.TaskGraphic[x]
ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x]
    The properties of a TaskGraphics[x] are defined by the following:
        Type: (e.g., 'Task')
        ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Type
        ID: (i.e., the ID of the task graphic/icon. Note: it is different from the task id)
        ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].ID
        Label: (e.g., Label of the Task)
        ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Label
        Element: (ID of the task. Note, this is the ID of the task)
        ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Element

3. A task log (a log file created after running a task) is also defined in :
ProjectCollection.Elements.Element[x]
    Its properties defined in .Element
    ProjectCollection.Elements.Element[x].Element
    These properties include:
        Label: (e.g., 'Log')
        ProjectCollection.Elements.Element[x].Element.Label
        Type: (e.g., 'LOG')
        ProjectCollection.Elements.Element[x].Element.Type
        Container: (ID of the PFD)
        ProjectCollection.Elements.Element[x].Element.Container
        ID: (ID of the log)
        ProjectCollection.Elements.Element[x].Element.ID
        InputIDs: (ID of the task which creates the log)
        ProjectCollection.Elements.Element[x].Element.InputIDs
        and more ...
    It has a special tag to define the log:
        ProjectCollection.Elements.Element[x].Log
            The properties of the log is defined in the following:
            
            Parent: (the parent node ID of the log, i.e., the ID of the task which creates the log)
            ProjectCollection.Elements.Element[x].Log.Parent
            ... and more

    It has a special tag to indicate the type again: ('SAS.EG.ProjectElements.Log')
        ProjectCollection.Elements.Element[x]._Type 

4. A shortcut to data, which defined as an element:
ProjectCollection.Elements.Element[x]
    The properties of a shortcut to data are defined in .Element, including
        Label defined in (i.e., the name of the linked data set ) 
            ProjectCollection.Elements.Element[x].Element.Label
        Type defined in (Type value = 'SHORTCUT')
            ProjectCollection.Elements.Element[x].Element.Type
        ID defined in 
            ProjectCollection.Elements.Element[x].Element.ID
        Container: (the parent node's ID, i.e., ID of the PFD)
            ProjectCollection.Elements.Element[x].Element.Container
        InputIDs: (ID of the task which creates the shortcut)
        ... and more

    It has a special tag 'SHORTCUT' to define the properties of the SHORTCUT:
    ProjectCollection.Elements.Element[x].SHORTCUT
        The properties include:
        Parent: (the ID of the data that the shortcut links to)
        ProjectCollection.Elements.Element[x].SHORTCUT.Parent
        .INPUTLIST.INPUTID:(the ID of the task which creates the shortcut)
        ProjectCollection.Elements.Element[x].SHORTCUT.Parent.INPUTLIST.INPUTID

    It has a special tag to indicate that whether user has explicitly set the label:
        ProjectCollection.Elements.Element[x].ShortCutToData.UserHasExplicitlySetLabel

    It has a special tag to indicate the type again: ('SAS.EG.ProjectElements.ShortCutToData')
        ProjectCollection.Elements.Element[x]._Type     

It also appears in External_Objects.ProcessFlowView.Graphics.TaskGraphic:
ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x]
    with the following properties:
    Type: ('Task', very strange, a shortcut in the ProcessFlow View is with Type='Task'!)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Type
    Id: (Id of the grapic)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Id
    Label: (Label of the shortcut, i.e., the name of the data set that the shortcut links to)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Label
    Element: (the ID of this shortcut item)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Element

The first shortcut (ONLY the first shortcut) also appears in MainForm:  
(ID of the first shortcut)
ProjectCollection.MainForm.ActiveData  

5. A data element is defined in:
ProjectCollection.DataList
    It has the following properties:
    Data: (to define the properies of the data element)
    ProjectCollection.DataList.Data[x]
        in .Data[x], properties of a data element is in
        ProjectCollection.DataList.Data[x].Element
            such as:
            Label: (name of the data set)
            ProjectCollection.DataList.Data[x].Element.Label
            Type: ('DATA')
            ProjectCollection.DataList.Data[x].Element.Type
            ID: (ID of the data set)
            ProjectCollection.DataList.Data[x].Element.ID
            and more...

        more about the data element:
            ..ShortCutID: (The ID of the shortcut element that is linked to this data set )
            ProjectCollection.DataList.Data[x].Data.ShortCutlist.ShortCutID[x]
            ..DataModel: 
            ProjectCollection.DataList.Data[x].Data.DataModel
            *** Note: the DataModel tag contains ProjectCollection.DataList.Data.Data.DataModel.RawActiveDataSourceStat.DNA, of which the xml code is often messed up ('<DNA>' was displayed as '&lt;DNA&gt;DNA'. The reasons are unknown!)

and other properties of Datalist...:

ProjectCollection.ExternalFileList.ExternalFIle
ProjectCollection.ExternalFileList.InformationMap_List


6.  The last submitted code element is also defined in:

ProjectCollection.Elements.Element[x]
    Its properties defined in .Element
    ProjectCollection.Elements.Element[x].Element
    These properties include:
        Label: (e.g., 'Last Submitted Code')
        ProjectCollection.Elements.Element[x].Element.Label
        Type: (e.g., 'CODE')
        ProjectCollection.Elements.Element[x].Element.Type
        Container: (ID of the PFD)
        ProjectCollection.Elements.Element[x].Element.Container
        ID: (ID of this 'Last Submitted Code' object)
        ProjectCollection.Elements.Element[x].Element.ID
        InputIDs: (ID of the tasks which submitted the code)
        ProjectCollection.Elements.Element[x].Element.InputIDs
        and more ...

    It has a special tag to define the submitted TextElement:
    ProjectCollection.Elements.Element[x].TextElement
        It has properties:
        Text contents of the submitted code:
        ProjectCollection.Elements.Element[x].TextElement.Text
        The code after SAS EG adding begining and macro code
        ProjectCollection.Elements.Element[x].Code.BeginAppCode
        ... and more

       *** Note: 
       in ProjectCollection.Elements.Element[x].Code.BeginAppCode, SAS EGP added GPATH=&sasworklocation. The sign '&' causes problem when converting xml to DOM using JSDOM and jQuery. The reasons are unknown. 

7. A link elemenet is defined in:

ProjectCollection.Elements.Element[x]
    The properties of a link are defined in .Element, including
        Label defined in (name of the link, by default, it is like 'Link to' + the label of the destination task):
            ProjectCollection.Elements.Element[x].Element.Label
        Type defined in (Type value = 'LINK')
            ProjectCollection.Elements.Element[x].Element.Type
        ID defined in 
            ProjectCollection.Elements.Element[x].Element.ID
        Container: (the parent node's ID, i.e., ID of the PFD)
            ProjectCollection.Elements.Element[x].Element.Container
        InputIDs: (the ID of the source task, i.e., the task from which the link begins)
        ... and more
    It has a special tag to define the so called 'Log':
        ProjectCollection.Elements.Element[x].Log
            The properties of the link is defined as:
            Parent: (the ID of the task which creates the link, i.e., the link of the source task)
            ProjectCollection.Elements.Element[x].Log.Parent
            LinkFrom: (the ID of the task which creates the link, i.e., the link of the source task, cannot see why it differs from .Parent)
            ProjectCollection.Elements.Element[x].Log.LinkFrom
            LinkTo: (the ID of the destination task)
            ProjectCollection.Elements.Element[x].Log.LinkTo
    It has a special tag to indicate the type again: ('SAS.EG.ProjectElements.Link')
        ProjectCollection.Elements.Element[x]._Type



8. An ODSResult element

ProjectCollection.Elements.Element[x]
    The properties of a link are defined in .Element, including
        Label defined in (name of the ODS report, by default, it is like 'SAS Report - ' + the label of the destination task):
            ProjectCollection.Elements.Element[x].Element.Label
        Type defined in (Type value = 'ODS_RESULTS')
            ProjectCollection.Elements.Element[x].Element.Type
        ID defined in 
            ProjectCollection.Elements.Element[x].Element.ID
        Container: (the parent node's ID, i.e., ID of the PFD)
            ProjectCollection.Elements.Element[x].Element.Container
        InputIDs: (the ID of the source task, i.e., the task by which the ODSReport is made)
        ... and more
    It has a special tag to define the so called 'ODSResult':
        ProjectCollection.Elements.Element[x].ODSResult

            The properties of the ODSResult is defined as:
            ResultType: ('SasReport')
            ProjectCollection.Elements.Element[x].ODSResult.ResultType
            Parent: (the ID of the task which creates the result)
            ProjectCollection.Elements.Element[x].ODSResult.Parent
            OdsTreeNode: (properties of the OdsTreeNode)
            ProjectCollection.Elements.Element[x].ODSResult.OdsTreeNode
            and more...
    It has a special tag to indicate the type again: ('SAS.EG.ProjectElements.ODSResult')
        ProjectCollection.Elements.Element[x]._Type


It also appears in External_Objects.ProcessFlowView.Graphics.TaskGraphic:
ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x]
    with the following properties:
    Type: ('Task', very strange, an ODSResult in the ProcessFlow View is with Type='Task'!)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Type
    Id: (Id of the grapic)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Id
    Label: (Label of the ODSResult, by default, 'SAS Report - ' + Label of the task by which the results are generated)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Label
    Element: (the ID of this ODSResult item)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Element


9. ShortCutToFile (a shortcut to an external file)
ProjectCollection.Elements.Element[x]
    The properties of a Task are defined in .Element, including
        Label: ('xls.xlsx))
            ProjectCollection.Elements.Element[x].Element.Label
        Type defined in (Type value = 'SHORTCUT')
            ProjectCollection.Elements.Element[x].Element.Type
        ID defined in 
            ProjectCollection.Elements.Element[x].Element.ID
        Container: (the parent node's ID, i.e., ID of the PFD)
            ProjectCollection.Elements.Element[x].Element.Container
        ... and more

    It has a special tag 'SHORTCUT' to define the properties of the SHORTCUT:
    ProjectCollection.Elements.Element[x].SHORTCUT
        The properties include:
        Parent: (the ID of the ExternalFile that the shortcut links to)
        ProjectCollection.Elements.Element[x].SHORTCUT.Parent

    It has a special tag called ShortCutToFile:
        ProjectCollection.Elements.Element[x].ShortCutToFile

    It has a special tag to indicate the type again: ('SAS.EG.ProjectElements.ShortCutToFile')
        ProjectCollection.Elements.Element[x]._Type     

It also appears in PFD's TreeView (ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x] represents a PFD):
ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x]
    The properties are defined as:
    NodeType: ('NODETYPE_ELEMENT')
    ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].NodeType
    ElementID: (ID of the shorcutToFile obj)
    ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].ElementID
    Expanded: ('True')
    ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].Expanded
    Label: (Label of this shorcutToFile obj, e.g., 'xls.xlsx')
    ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].Label

It also appears as an icon/graphic in External_Objects.ProcessFlowView.Graphics.TaskGraphic:
ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x]
    with the following properties:
    Type: ('Task', very strange, a shortcut in the ProcessFlow View is with Type='Task'!)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Type
    Id: (Id of the grapic)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Id
    Label: (Label of the shortcut, i.e., the name of the file that the shortcut links to)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Label
    Element: (the ID of this shortcuttofile obj)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Element

The first shortcut (ONLY the first shortcut) also appears in MainForm:  
(ID of the first shortcut)
ProjectCollection.MainForm.ActiveData  


10. ShortCutToSAS (a shortcut to an external .sas file)
ProjectCollection.Elements.Element[x]
    The properties of a Task are defined in .Element, including
        Label: ('sas'))
            ProjectCollection.Elements.Element[x].Element.Label
        Type defined in (Type value = 'TASK')
            ***Note, although a shortcut, it is treated as a TASK here!
            ProjectCollection.Elements.Element[x].Element.Type
        ID defined in 
            ProjectCollection.Elements.Element[x].Element.ID
        Container: (the parent node's ID, i.e., ID of the PFD)
            ProjectCollection.Elements.Element[x].Element.Container
        ... and more

    It has a special tag to define the so called 'SubmitableElement':
        ProjectCollection.Elements.Element[x].SubmitableElement

        within .SubmitableElement, there are IDs of:
        the ID of log: 
        ProjectCollection.Elements.Element[x].SubmitableElement.JobRecipe.JobRecipe.log
        ID of the last submitted code element:
        ProjectCollection.Elements.Element[x].SubmitableElement.JobRecipe.JobRecipe.code
        ID of the OutputDatList (e.g., the id of the shortcut of the output data):
        ProjectCollection.Elements.Element[x].SubmitableElement.JobRecipe.JobRecipe.OutputDataList.ID[x]
        ID of the ODSResult elements:
        ProjectCollection.Elements.Element[x].SubmitableElement.JobRecipe.JobRecipe.ODSResultsList.ID[x]    

It also appears in .ProjectTreeView:
ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x]
    The common properties of a task (a shotcut to sas file is also treated as a task)
    NodeType:('NODETYPE_PROGRAMFOLDER')
    ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x].Nodetype
    Expanded: ('True')
    ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x].Expanded
    Label: ('Programs', the label for programs. ***Note, the lable is not for task names/lables)

    The properties of individual tasks are defined in ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x].EGTreeNode[x]
    NodeType:('NODETYPE_ELEMENT')
    ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x].EGTreeNode[x].Nodetype
    ElementID: (ID of the task or shortcut to a sas file)
    ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x].EGTreeNode[x].ElementID
    Label: (name of the task or shortcut to a sas file)
    ProjectCollection.External_Objects.ProjectTreeView.EGTreeNode[x].EGTreeNode[x].Label

It also appears in External_Objects.ProcessFlowView.Graphics.TaskGraphic:
ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x]
    with the following properties:
    Type: ('Task', very strange, a shortcut in the ProcessFlow View is with Type='Task'!)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Type
    Id: (Id of the grapic)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Id
    Label: (Label of the shortcut, i.e., the name of the file that the shortcut links to)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Label
    Element: (the ID of this shortcuttofile obj)
    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Element

It also appears as an icon in .Graphics.TaskGraphic[x]
ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x]
    The properties of a TaskGraphics[x] are defined by the following:
        Type: (e.g., 'Task')
        ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Type
        ID: (i.e., the ID of the task graphic/icon. Note: it is different from the task id)
        ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].ID
        Label: (e.g., Label of the Task)
        ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Label
        Element: (ID of the task. Note, this is the ID of the task)
        ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Element 

And more in: 
ProjectCollection.ExternalFileList.ExternalFIle
ProjectCollection.ExternalFileList.InformationMap_List

11. A tree view (for exploring programs in the left panel) is defined in:
    ProjectCollection.External_Objects.ProjectTreeView[x]

    Within .ProjectTreeView[x], there could be multiple PFD, each is defined in a tag .EGTreeNode:
        ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x]

            Within the .EGTreeNode, the properties of a PFD is defined, including:
            NodeType (NODETYPE_ELEMENT):
                ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].NodeType
            ElementID: (ID of the PFD)
                ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].ElementID
            Expanded: (whether the tree is expanded)
                ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].Expanded
            Label: (Name of the PFD like: 'PFD1')
                ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].Label

            The programs (tasks) of the PFD are defined in .EGTreeNode[x] of the .EGTreeNode
            ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x]

                The settings for all tasks are defined as the following:
                NoteType: (e.g., 'NODETYPE_PROGRAMFOLDER')
                ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].NodeType
                Expanded:
                ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].Expanded
                Label: (e.g., 'Programs')
                ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].Label

                The settings for individual task are defined in .EGTreeNode[x].EGTreeNode[x].EGTreeNode[x]
                ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].EGTreeNode[x]
                    The properties of each task includes:
                    NoteType: ('NODETYPE_ELEMENT')
                    ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].EGTreeNode[x].NoteType
                    ElementID: (e.g., ID of the task)
                    ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].EGTreeNode[x].ElementID
                    Expanded:
                    ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].EGTreeNode[x].Expanded
                    Label: (e.g., label of the task)
                    ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].EGTreeNode[x].Label

12. The settings for viewing PFDs are defined in:

    ProjectCollection.External_Objects.ProcessFlowView
        Some general properties are defined in:
        ProjectCollection.External_Objects.ProcessFlowView.Zoom
        ProjectCollection.External_Objects.ProcessFlowView.Grid
        ProjectCollection.External_Objects.ProcessFlowView.Layout
        ProjectCollection.External_Objects.ProcessFlowView.Graphics

            The node (e.g., a task) icons are defined in .Graphics.TaskGraphic[x]
            ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x]
                The properties of a TaskGraphics[x] are defined by the following:
                    Type: (e.g., 'Task')
                    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Type
                    ID: (i.e., the ID of the task graphic. Note: it is different from the task id)
                    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].ID
                    Label: (e.g., Label of the Task)
                    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Label
                    Element: (ID of the task. Note, this is the ID of the task)
                    ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x].Element

        The PFD settings are defined in .Containers
        ProjectCollection.External_Objects.ProcessFlowView.Containers

            For each PFD, there are PFD-specific settings defined in .Containers.Properties[x]
            ProjectCollection.External_Objects.ProcessFlowView.Containers.Properties[x]
                These specific settings include:
                ID:  (ID of the PFD)
                    ProjectCollection.External_Objects.ProcessFlowView.Containers.Properties[x].ID
                BackgroundColor:
                    ProjectCollection.External_Objects.ProcessFlowView.Containers.Properties[x].BacktroundColor
                Align: (e.g., 'AlignTop')
                    ProjectCollection.External_Objects.ProcessFlowView.Containers.Properties[x].Align

