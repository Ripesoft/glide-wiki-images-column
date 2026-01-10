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
  
  try {
    // Step 1: Search for the page to handle case-insensitive and fuzzy matches
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&origin=*`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': `${userName} (${userEmail})`,
        'Api-User-Agent': `${userName} (${userEmail})`
      }
    });
    
    if (!searchResponse.ok) {
      return JSON.stringify({
        error: `Wikipedia API error: ${searchResponse.status}`,
        keyword: searchTerm,
        images: []
      });
    }
    
    const searchData = await searchResponse.json();
    
    // Get the best match from search results
    if (!searchData.query?.search || searchData.query.search.length === 0) {
      return JSON.stringify({
        error: `No Wikipedia articles found for keyword: ${searchTerm}`,
        keyword: searchTerm,
        images: []
      });
    }
    
    const pageTitle = searchData.query.search[0].title;
    
    // Step 2: Fetch page with main image only (using pageimages)
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(pageTitle)}&origin=*`;
    
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
      const fileName = page.original.source.split('/').pop();
      
      // Fetch attribution for the main image
      const mainImageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url|extmetadata&titles=File:${encodeURIComponent(fileName)}&origin=*`;
      
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
    
    // Step 3: Get additional quality images from Wikimedia Commons using category search
    // This approach gets curated images instead of all page clutter
    const categoryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=categories&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
    
    const categoryResponse = await fetch(categoryUrl, {
      headers: {
        'User-Agent': `${userName} (${userEmail})`,
        'Api-User-Agent': `${userName} (${userEmail})`
      }
    });
    
    // Additionally, search Wikimedia Commons for related images
    const commonsSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(searchTerm)}&format=json&srlimit=10&origin=*`;
    
    try {
      const commonsResponse = await fetch(commonsSearchUrl, {
        headers: {
          'User-Agent': `${userName} (${userEmail})`,
          'Api-User-Agent': `${userName} (${userEmail})`
        }
      });
      
      if (commonsResponse.ok) {
        const commonsData = await commonsResponse.json();
        const searchResults = commonsData.query?.search || [];
        
        // Filter out SVG icons and get actual photo/image files
        const imageFiles = searchResults.filter(result => {
          const title = result.title.toLowerCase();
          // Exclude common icons, logos, and SVG files
          return !title.includes('icon') && 
                 !title.includes('logo') && 
                 !title.includes('.svg') &&
                 !title.includes('button') &&
                 !title.includes('symbol') &&
                 !title.includes('wikimedia') &&
                 (title.includes('.jpg') || title.includes('.jpeg') || title.includes('.png') || title.includes('.gif'));
        }).slice(0, 5); // Limit to 5 additional images
        
        if (imageFiles.length > 0) {
          const fileNames = imageFiles.map(f => f.title).join('|');
          const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiprop=url|extmetadata&titles=${encodeURIComponent(fileNames)}&origin=*`;
          
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
      }
    } catch (err) {
      // Continue if Commons search fails - we still have the main image
      console.error('Commons search failed:', err);
    }
    
    // Return array of image URLs with metadata
    return JSON.stringify({
      keyword: searchTerm,
      pageTitle: pageTitle,
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
