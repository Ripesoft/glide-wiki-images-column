const functions = new Map();

window.function = async function (keyword, userName, userEmail) {
  // Extract the actual keyword value - try multiple approaches
  let searchTerm = keyword;
  
  if (typeof keyword === 'object' && keyword !== null) {
    searchTerm = keyword.value || keyword.keyword || keyword.name || keyword.text || String(keyword);
  }
  
  // Ensure it's a string
  searchTerm = String(searchTerm).trim();
  
  // Verify that keyword is provided and not empty
  if (!searchTerm || searchTerm === 'undefined' || searchTerm === 'null' || searchTerm === '[object Object]') {
    return JSON.stringify({
      error: 'Keyword is required and must not be empty',
      keyword: '',
      images: [],
      imageCount: 0
    });
  }
  
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
    
    // Add the main page image if available (need to fetch attribution for it too)
    if (page?.original?.source) {
      // Fetch attribution for the main image
      const mainImageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url|extmetadata&titles=File:${encodeURIComponent(page.original.source.split('/').pop())}&origin=*`;
      
      try {
        const mainImgResponse = await fetch(mainImageUrl, {
          headers: {
            'User-Agent': `${userName} (${userEmail})`,
            'Api-User-Agent': `${userName} (${userEmail})`
          }
        });
        
        if (mainImgResponse.ok) {
          const mainImgData = await mainImgResponse.json();
          const mainImgPages = mainImgData.query?.pages || {};
          const mainImgPage = Object.values(mainImgPages)[0];
          
          if (mainImgPage?.imageinfo && mainImgPage.imageinfo[0]) {
            const info = mainImgPage.imageinfo[0];
            const extmetadata = info.extmetadata || {};
            
            imageUrls.push({
              url: page.original.source,
              attribution: extmetadata.Attribution?.value || extmetadata.Artist?.value || 'Unknown',
              license: extmetadata.LicenseShortName?.value || extmetadata.License?.value || 'Unknown',
              description: extmetadata.ImageDescription?.value || mainImgPage.title || ''
            });
          } else {
            // Fallback if we can't get attribution
            imageUrls.push({
              url: page.original.source,
              attribution: 'Unknown',
              license: 'Unknown',
              description: ''
            });
          }
        } else {
          // Fallback if request fails
          imageUrls.push({
            url: page.original.source,
            attribution: 'Unknown',
            license: 'Unknown',
            description: ''
          });
        }
      } catch (err) {
        // Fallback on error
        imageUrls.push({
          url: page.original.source,
          attribution: 'Unknown',
          license: 'Unknown',
          description: ''
        });
      }
    }
    
    // If we have additional images, fetch their URLs and attribution
    if (page?.images && page.images.length > 0) {
      const imageNames = page.images.slice(0, 10).map(img => img.title);
      const imageInfoUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url|extmetadata&titles=${encodeURIComponent(imageNames.join('|'))}&origin=*`;
      
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
            const info = imgPage.imageinfo[0];
            const extmetadata = info.extmetadata || {};
            
            imageUrls.push({
              url: info.url,
              attribution: extmetadata.Attribution?.value || extmetadata.Artist?.value || 'Unknown',
              license: extmetadata.LicenseShortName?.value || extmetadata.License?.value || 'Unknown',
              description: extmetadata.ImageDescription?.value || imgPage.title || ''
            });
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
