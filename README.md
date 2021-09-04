The d3 tree map is available in src/treedata/sas_egp_v8_v7
It is copied from ~\PHPWeb\lit_d3python\src\treedata\sas_egp_v8_v7 
The one in lit_d3python folder is the most updated

Note: if a egp file is too large, it might cause memory heap out issues
In that case, simply enlarge size like:
$ node --max-old-space-size=50000 localbackend/app/01_extract_projectxml_from_egp.js

