***************
A process flow
***************

1. define the PFD elements:
- ProjectCollection.Elements.Element[x]

2. include PFD elements as containers
- ProjectCollection.Containers.ID[x]

3. show PFDs in the tree view panel
- ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x]

4. settings of PFDs in tree view
- ProjectCollection.External_Objects.ProcessFlowView.Containers.Properties[x]

*** note: for unknown reasons, each time saving the egp, a new 
ProjectCollection.External_Objects.ProcessFlowView.Containers.Properties[x] is appended to the .Properties list. The more one save the file, the more these additional properies are appended. These properties (each with a new ID, and settings are background and align) do not seem related to any of other components. The egp file won't be affected when these properties are manually removed.
[!] These additional properties might be garbage that SAS EG v7 forgot to clean up!


***************
A task
***************

1. define the TASK Element:
- ProjectCollection.Elements.Element[x]

2. common settings of all tasks in project tree view
ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x]

3. task-specific settings in project tree view
ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].EGTreeNode[x]

4. show tasks in the tree view panel
- ProjectCollection.External_Objects.ProcessFlowView[x].Graphics.TaskGraphic[x]

***************
A task log (a log file created after running a task)
***************

1. define the LOG Element:
- ProjectCollection.Elements.Element[x]
2. update the log ID in the Task element that created the data shortcut
- ProjectCollection.Elements.Element[x].SubmitableElement.JobRecipe.JobRecipe.log

***************
The last submitted code (the last submitted code from a task, note: if multiple tasks are run, each task will have a separate tag for its last submitted code)
***************
1. define the TASK Element:
- ProjectCollection.Elements.Element[x]
2. update the last submitted code ID in the Task element that created the data shortcut
- ProjectCollection.Elements.Element[x].SubmitableElement.JobRecipe.JobRecipe.code


***************
A data shortcut 
***************
1. define the SHORTCUT Element:
- ProjectCollection.Elements.Element[x]
2. update the shortcut ID in the Task element that created the data shortcut:
- ProjectCollection.Elements.Element[x].SubmitableElement.JobRecipe.JobRecipe.OutputDataList.ID
3. update the graphic of the SHORTCUT element in process view's graphics:
- ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x]
4. show the ID of the FIRST (only the first) shortcut element in MainForm:
- ProjectCollection.MainForm.ActiveData  

***************
A data (in datalist)
***************
1. define the data element in Datalist:
ProjectCollection.DataList.Data[x].ELement
ProjectCollection.DataList.Data[x].Data


***************
A link 
***************
1. define the link Element:
- ProjectCollection.Elements.Element[x]


***************
An ODSResult element
***************
1. define the link Element:
- ProjectCollection.Elements.Element[x]
2. update the ODSResult ID in the Task element that created the data shortcut
- ProjectCollection.Elements.Element[x].SubmitableElement.JobRecipe.JobRecipe.ODSResultsList
3. update the graphic of the ODSResult element in process view's graphics:
- ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x]


***************
A shortcut to file 
***************
1. define the SHORTCUT Element:
- ProjectCollection.Elements.Element[x]
2. define the shortcuttofile process tree view:
- ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x]
3. update the graphic of the SHORTCUT element in process view's graphics:
- ProjectCollection.External_Objects.ProcessFlowView.Graphics.TaskGraphic[x]


***************
A shortcut to a sas file
***************

1. define the shortcut to sas as a TASK Element:
- ProjectCollection.Elements.Element[x]

2. common settings of all tasks in project tree view
ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x]

3. task-specific settings in project tree view
ProjectCollection.External_Objects.ProjectTreeView[x].EGTreeNode[x].EGTreeNode[x].EGTreeNode[x]

4. show tasks in the tree view panel
- ProjectCollection.External_Objects.ProcessFlowView[x].Graphics.TaskGraphic[x]

5. setting in external file
- ProjectCollection.ExternalFileList