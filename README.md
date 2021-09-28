The d3 tree map is available in src/treedata/sas_egp_v8_v7
It is copied from ~\PHPWeb\lit_d3python\src\treedata\sas_egp_v8_v7 
The one in lit_d3python folder is the most updated

Note: if a egp file is too large, it might cause memory heap out issues
In that case, simply enlarge size like:
$ node --max-old-space-size=50000 localbackend/app/01_extract_projectxml_from_egp.js

To solve the heap out of memory issue when migrating to Netlify, try adding the following in the netlify.toml file: (size = 50000 instead of 4096 )
https://stackoverflow.com/questions/64000248/gatsby-netlify-cms-javascript-heap-out-of-memory
[build.environment]
  NODE_OPTIONS = "--max_old_space_size=50000" 

