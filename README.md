# Wikipedia Images Column

A Glide Experimental Code column that fetches images from Wikipedia based on a provided keyword.

## Overview

This custom column integrates with Wikipedia's MediaWiki API to retrieve images related to a search keyword. It returns a JSON response containing image URLs, dimensions, and metadata that can be used in Glide applications.

## Features

- **Keyword-based Search**: Search Wikipedia for articles matching your keyword
- **Image Extraction**: Automatically extracts thumbnail and related images
- **Metadata Included**: Returns image URLs, dimensions, and titles
- **Wikipedia Compliance**: Includes user agent information (developer name and email) as required by Wikipedia's API policy
- **Error Handling**: Graceful error handling with descriptive messages

## Parameters

The column accepts three required parameters:

1. **keyword** (string): The search term for Wikipedia articles
   - Example: "Python programming", "Machine learning", "New York"

2. **userName** (string): Your name or app developer's name
   - Required by Wikipedia to comply with their usage policy
   - Example: "John Doe"

3. **userEmail** (string): Your email or app developer's email
   - Required by Wikipedia to comply with their usage policy
   - Example: "john@example.com"

## Return Value

The function returns a JSON string with the following structure:

```json
{
  "keyword": "your_search_keyword",
  "imageCount": 5,
  "images": [
    {
      "title": "Image file name",
      "url": "https://upload.wikimedia.org/...",
      "width": 300,
      "height": 250
    },
    ...
  ],
  "userAgent": "Developer Name (developer@email.com)"
}
```

## How It Works

1. **Initial Search**: Sends a query to Wikipedia's API to find articles matching the keyword
2. **Thumbnail Extraction**: Retrieves the article's main thumbnail image if available
3. **Image Discovery**: Identifies related images from the article
4. **Image Info Retrieval**: Fetches detailed information (URLs and dimensions) for up to 10 related images
5. **Response Compilation**: Returns all images in a structured JSON format

## Usage in Glide

1. Add a new column to your table
2. Choose "Experimental Code" as the column type
3. Configure it with this component
4. Provide a keyword field, developer name, and email
5. The column will display JSON data containing all fetched images

### Example Usage

```
Column 1: keyword = "Eiffel Tower"
Column 2: userName = "Your Name"
Column 3: userEmail = "your@email.com"
→ Results in JSON with Eiffel Tower related images
```

## API Information

- **Base URL**: `https://en.wikipedia.org/w/api.php`
- **Format**: JSON
- **CORS**: Enabled (origin: *)
- **Rate Limits**: Standard Wikipedia API rate limits apply

## Requirements

- Modern browser with fetch API support
- No external dependencies

## Error Handling

The function includes error handling for:
- Network failures
- Invalid keywords
- API failures
- Missing image data

Errors are returned as exception messages that will be displayed in Glide's error state.

## Implementation Details

### Files

- **glide.json**: Manifest defining the column metadata, parameters, and result type
- **function.js**: Main implementation containing the Wikipedia API integration
- **driver.js**: Message handler for Glide communication
- **index.html**: HTML entry point

### Key Functions

The `window.function` async function handles:
1. Building Wikipedia API URLs with proper query parameters
2. Fetching page information and images
3. Retrieving detailed image metadata
4. Error handling and response formatting
5. Including developer credentials as required by Wikipedia

## Notes

- Results are limited to the top 10 images for performance
- Image availability depends on the Wikipedia article
- Some keywords may return no images if no related article exists
- Always provide valid developer credentials (name and email) to comply with Wikipedia's policy
- The function uses CORS-enabled Wikipedia endpoints for client-side requests
