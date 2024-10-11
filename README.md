# searchJSON
JSON formatting and searching. Open source, zero data retention. 

## Overview
searchJSON is an open source, zero data retention json formatter and search web app. It allows users to safely format and search their json without the worry their data is being saved on the backend. 

## Features
### Format JSON
Using searchJSON is simple. Just paste your unformatted json into the input box and formatted json is returned. 


### Search & Scrolling
Searching is done via the Search box and automatically highlights all partial and full matches in yellow. Each time the Search icon or Enter button is pressed the window will scroll to the next found match. Once at the end of matches it will reset to the first match and continually loop. 

![searching](/readme_images/search.png)


### Search Paths
When a match has been found, the Search Paths are populated on the right with database notation. This allows users to quickly copy the found path for use in their database query. 
![search paths](/readme_images/search_paths.png)
