# Wikipedia Images Column

A Glide Experimental Code column that fetches images from Wikipedia based on a provided keyword.

## Overview

This custom column integrates with Wikipedia's MediaWiki API to retrieve images related to a search keyword. It returns a JSON response containing image URLs, attribution, licensing information, and descriptions that can be used in Glide applications.

## Features

- **Keyword-based Search**: Search Wikipedia for articles matching your keyword
- **Image Extraction**: Automatically extracts the main page image and up to 10 related images
- **Rich Metadata**: Returns image URLs, attribution, license information, and descriptions
- **Wikipedia Compliance**: Includes user agent information (developer name and email) as required by Wikipedia's API policy
- **Comprehensive Error Handling**: Graceful error handling with descriptive messages
- **Smart Keyword Parsing**: Handles various input formats including objects and strings

## Parameters

The column accepts three required parameters:

1. **keyword** (string or object): The search term for Wikipedia articles
   - Example: "Aardvark", "Python programming", "Eiffel Tower"
   - Can handle object inputs by extracting the keyword value

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
  "keyword": "Aardvark",
  "pageTitle": "Aardvark",
  "images": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/...",
      "attribution": "Kelly Abram",
      "license": "CC BY 4.0",
      "description": "Aardvark (Orycteropus afer)"
    }
  ],
  "imageCount": 11,
  "error": null
}
```

### Response Fields

- **keyword**: The search term used for the query
- **pageTitle**: The actual Wikipedia page title found
- **images**: Array of image objects, each containing:
  - **url**: Direct URL to the image file
  - **attribution**: Creator or source attribution (may include HTML)
  - **license**: License type (e.g., "CC BY 4.0", "CC BY-SA 3.0", "PD")
  - **description**: Image description (may include HTML and semantic information)
- **imageCount**: Total number of images returned
- **error**: Error message if no images found, or `null` if successful

## How It Works

1. **Keyword Processing**: Intelligently extracts and validates the keyword from various input formats
2. **Initial Search**: Sends a query to Wikipedia's API to find the article matching the keyword
3. **Main Image Extraction**: Retrieves the article's main/original image with full attribution
4. **Related Images Discovery**: Identifies up to 10 additional images from the article
5. **Metadata Retrieval**: Fetches detailed attribution, licensing, and description for each image
6. **Response Compilation**: Returns all images with complete metadata in a structured JSON format

## Usage in Glide

1. Add a new column to your table
2. Choose "Experimental Code" as the column type
3. Configure it with this component
4. Provide a keyword field, developer name, and email
5. The column will display JSON data containing all fetched images

### Example Usage

```
keyword = "Aardvark"
userName = "Your Name"
userEmail = "your@email.com"

→ Returns JSON with:
  - keyword: "Aardvark"
  - pageTitle: "Aardvark"
  - 11 images with URLs, attribution, licenses, and descriptions
  - imageCount: 11
  - error: null
```

### Example Response

```json
{
  "keyword": "Aardvark",
  "pageTitle": "Aardvark", 
  "images": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/f/f0/Orycteropus_afer_175359469.jpg",
      "attribution": "Kelly Abram",
      "license": "CC BY 4.0",
      "description": "Aardvark (Orycteropus afer)"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Aardvark_%28Orycteropus_afer%29.jpg",
      "attribution": "Theo Kruse Burgers' Zoo",
      "license": "CC BY-SA 4.0",
      "description": "The aardvark is a medium-sized, burrowing, nocturnal mammal native to Africa..."
    }
  ],
  "imageCount": 11,
  "error": null
}
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

The function includes comprehensive error handling for:
- **Missing or Invalid Keywords**: Returns error message when keyword is empty, undefined, or invalid
- **Page Not Found**: Detects when Wikipedia doesn't have a matching article
- **Network Failures**: Handles fetch errors gracefully
- **API Failures**: Manages HTTP error responses from Wikipedia API
- **Missing Image Data**: Provides fallback values for missing attribution/license information

All errors are returned in the JSON response with an `error` field containing a descriptive message.

## Implementation Details

### Files

- **glide.json**: Manifest defining the column metadata, parameters, and result type
- **function.js**: Main implementation containing the Wikipedia API integration
- **driver.js**: Message handler for Glide communication
- **index.html**: HTML entry point

### Key Functions

The `window.function` async function handles:
1. **Smart Keyword Parsing**: Extracts keywords from various input formats (objects or strings)
2. **Input Validation**: Ensures keywords are valid and not empty
3. **API Request Construction**: Builds Wikipedia API URLs with proper query parameters
4. **Main Image Fetching**: Retrieves the primary page image with full metadata
5. **Related Images Discovery**: Fetches up to 10 additional article images
6. **Attribution Retrieval**: Extracts detailed metadata including attribution, license, and descriptions
7. **Error Handling**: Provides fallback values and comprehensive error messages
8. **Response Formatting**: Returns structured JSON with all image data

## Notes

- The main page image is fetched first with complete attribution data
- Additional related images are limited to 10 for performance
- Attribution and description fields may contain HTML markup from Wikipedia
- Image availability depends on the Wikipedia article content
- Some keywords may return no images if no related article exists or the page lacks images
- Always provide valid developer credentials (name and email) to comply with Wikipedia's API policy
- The function uses CORS-enabled Wikipedia endpoints for client-side requests
- License information follows Creative Commons and other standard formats (CC BY, CC BY-SA, PD, etc.)
