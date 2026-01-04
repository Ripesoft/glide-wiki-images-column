const functions = new Map();

window.function = async function (keyword, userName, userEmail) {
  // Extract the actual keyword value - try multiple approaches
  let searchTerm = keyword;
  
  if (typeof keyword === 'object' && keyword !== null) {
    searchTerm = keyword.value || keyword.keyword || keyword.name || keyword.text || String(keyword);
  }
  
  // Ensure it's a string
  searchTerm = String(searchTerm);
  
  // Build the Wikipedia API URL to get page with images
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|images&format=json&piprop=original&titles=${encodeURIComponent(searchTerm)}&origin=*`;
  
  try {
    // Fetch with user information in headers (Wikipedia API best practice)
    const response = await fetch(url, {
      headers: {
        'User-Agent': `${userName} (${userEmail})`,
        'Api-User-Agent': `${userName} (${userEmail})`
      }
    });
    
    if (!response.ok) {
      return JSON.stringify({
        error: `Wikipedia API error: ${response.status}`,
        keyword: searchTerm,
        images: []
      });
    }
    
    const data = await response.json();
    
    // Extract the page
    const pages = data.query?.pages || {};
    const page = Object.values(pages)[0];
    
    // Check if page was found
    if (page?.missing !== undefined || page?.invalid !== undefined) {
      return JSON.stringify({
        error: `Page not found for keyword: ${searchTerm}`,
        keyword: searchTerm,
        images: []
      });
    }
    
    const imageUrls = [];
    
    // Add the main page image if available
    if (page?.original?.source) {
      imageUrls.push(page.original.source);
    }
    
    // If we have additional images, fetch their URLs
    if (page?.images && page.images.length > 0) {
      const imageNames = page.images.slice(0, 10).map(img => img.title);
      const imageInfoUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url&titles=${encodeURIComponent(imageNames.join('|'))}&origin=*`;
      
      const imageResponse = await fetch(imageInfoUrl, {
        headers: {
          'User-Agent': `${userName} (${userEmail})`,
          'Api-User-Agent': `${userName} (${userEmail})`
        }
      });
      
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imagePages = imageData.query?.pages || {};
        
        Object.values(imagePages).forEach(imgPage => {
          if (imgPage.imageinfo && imgPage.imageinfo[0]?.url) {
            imageUrls.push(imgPage.imageinfo[0].url);
          }
        });
      }
    }
    
    // Return array of image URLs with metadata
    return JSON.stringify({
      keyword: searchTerm,
      pageTitle: page?.title || '',
      images: imageUrls,
      imageCount: imageUrls.length,
      error: imageUrls.length === 0 ? 'No images found for this keyword' : null
    });
    
  } catch (error) {
    return JSON.stringify({
      error: `Failed to fetch Wikipedia images: ${error.message}`,
      keyword: searchTerm,
      images: []
    });
  }
}
