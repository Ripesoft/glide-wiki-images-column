# Wikipedia Images Column

A Glide Experimental Code column that fetches images from Wikipedia based on a provided keyword.

## Overview

This custom column integrates with Wikipedia's MediaWiki API to retrieve images related to a search keyword. It returns a JSON response containing image URLs, attribution, licensing information, and descriptions that can be used in Glide applications.

## Features

- **Auto-Translation**: Automatically translates non-English keywords to English for better Wikipedia search results
- **Multi-Language Support**: Search in any language (e.g., "Hund" in German → "Dog", "Chien" in French → "Dog")
- **Smart Search**: Uses fuzzy search to find articles even with case-insensitive or approximate keywords (e.g., "hamster" finds "Hamster")
- **Quality Image Filtering**: Automatically filters out SVG icons, logos, and UI elements to return only real photos
- **Wikimedia Commons Integration**: Searches both Wikipedia and Wikimedia Commons for the best quality images
- **Main Image Priority**: Always extracts the article's main featured image first
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
2. **Auto-Translation**: Automatically translates non-English keywords to English using MyMemory Translation API (free service)
3. **Smart Search**: Performs fuzzy search on Wikipedia to find the best matching article (handles case variations, translations, and close matches)
4. **Wikidata Integration**: Uses Wikidata to find English equivalents for foreign language terms
5. **Main Image Extraction**: Retrieves the article's main/featured image with full attribution
6. **Commons Search**: Searches Wikimedia Commons for additional high-quality images using the English page title
7. **Quality Filtering**: Automatically filters out SVG icons, logos, buttons, and UI elements - returns only actual photos (JPG, PNG, GIF)
8. **Metadata Retrieval**: Fetches detailed attribution, licensing, and description for each image
9. **Response Compilation**: Returns all images with complete metadata in a structured JSON format

## Usage in Glide

1. Add a new column to your table
2. Choose "Experimental Code" as the column type
3. Configure it with this component
4. Provide a keyword field, developer name, and email
5. The column will display JSON data containing all fetched images

### Example Usage

```
keyword = "Aardvark"  (or "Ameisenbär" in German, "Oryctérope" in French)
userName = "Your Name"
userEmail = "your@email.com"

→ Returns JSON with:
  - keyword: "Aardvark" (original or translated)
  - pageTitle: "Aardvark"
  - Multiple images with URLs, attribution, licenses, and descriptions
  - imageCount: varies
  - error: null
```

### Multi-Language Examples

The column automatically translates keywords to English:

- **German**: `"Hund"` → searches for "Dog"
- **French**: `"Chien"` → searches for "Dog"  
- **Spanish**: `"Perro"` → searches for "Dog"
- **Polish**: `"Chomik"` → searches for "Hamster"
- **Japanese**: `"猫"` → searches for "Cat"

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
3. **Auto-Translation**: Translates non-English keywords to English using MyMemory Translation API
4. **Fuzzy Search**: Searches Wikipedia to find the best matching article (handles case variations and translations)
5. **Wikidata Lookup**: Uses Wikidata to find English equivalents for foreign terms
6. **Main Image Fetching**: Retrieves the primary page image with full metadata
7. **Commons Integration**: Searches Wikimedia Commons for additional quality images using the English page title
8. **Quality Filtering**: Excludes SVG icons, logos, and UI elements - returns only photos (JPG/PNG/GIF)
9. **Attribution Retrieval**: Extracts detailed metadata including attribution, license, and descriptions
10. **Error Handling**: Provides fallback values and comprehensive error messages
11. **Response Formatting**: Returns structured JSON with all image data

## Notes

- **Auto-Translation**: Keywords in any language are automatically translated to English for better Wikipedia search results
- Uses MyMemory Translation API (free service, no API key required) for automatic translation
- Uses fuzzy search and Wikidata to match keywords even with case differences (e.g., "hamster" matches "Hamster" article)
- The main Wikipedia page image is fetched first with complete attribution data
- Additional quality images are sourced from Wikimedia Commons using the English page title (limited to 5 for performance)
- Automatically filters out SVG icons, logos, buttons, and website UI elements
- Only returns actual photos in JPG, PNG, or GIF format for better quality results
- Attribution and description fields may contain HTML markup from Wikipedia
- Image availability depends on Wikipedia article content and Wikimedia Commons
- Some keywords may return fewer images if limited quality photos are available
- Always provide valid developer credentials (name and email) to comply with Wikipedia's API policy
- The function uses CORS-enabled Wikipedia, Commons, and translation endpoints for client-side requests
- License information follows Creative Commons and other standard formats (CC BY, CC BY-SA, PD, etc.)
- If translation API is unavailable, the system falls back to using the original keyword
