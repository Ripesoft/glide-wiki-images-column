const functions = new Map();

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a, b) {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// Calculate similarity score (0-1, where 1 is exact match)
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

// Try to translate or find English equivalent
async function findBestMatch(searchTerm, userName, userEmail) {
  // Step 0: Try auto-translation to English first with multiple methods
  let translatedTerm = null;
  let translationMethod = null;
  
  // Method 1: Try MyMemory Translation API
  try {
    const translateUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(searchTerm)}&langpair=auto|en`;
    
    const translateResponse = await fetch(translateUrl);
    
    if (translateResponse.ok) {
      const translateData = await translateResponse.json();
      
      // Check if translation was successful and different from original
      if (translateData.responseStatus === 200 && translateData.responseData?.translatedText) {
        const translated = translateData.responseData.translatedText.trim();
        
        // Use translation if it's different from original (more lenient check)
        if (translated && 
            translated.toLowerCase() !== searchTerm.toLowerCase()) {
          translatedTerm = translated;
          translationMethod = 'MyMemory API';
          console.log(`Auto-translated "${searchTerm}" to "${translatedTerm}" (confidence: ${translateData.responseData.match})`);
        }
      }
    }
  } catch (translateError) {
    console.log('MyMemory Translation API unavailable:', translateError.message);
  }
  
  // Method 2: If no translation yet, try LibreTranslate (free, open source)
  if (!translatedTerm) {
    try {
      const libreUrl = `https://libretranslate.com/translate`;
      const libreResponse = await fetch(libreUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: searchTerm,
          source: 'auto',
          target: 'en',
          format: 'text'
        })
      });
      
      if (libreResponse.ok) {
        const libreData = await libreResponse.json();
        if (libreData.translatedText && 
            libreData.translatedText.toLowerCase() !== searchTerm.toLowerCase()) {
          translatedTerm = libreData.translatedText.trim();
          translationMethod = 'LibreTranslate';
          console.log(`Auto-translated "${searchTerm}" to "${translatedTerm}" via LibreTranslate`);
        }
      }
    } catch (libreError) {
      console.log('LibreTranslate unavailable:', libreError.message);
    }
  }
  
  // Step 1: Try direct Wikipedia search with multiple strategies
  const searches = [
    // If we have a translation, prioritize it
    ...(translatedTerm ? [translatedTerm] : []),
    // Direct search
    searchTerm,
    // Try with quotes for exact phrase
    `"${searchTerm}"`,
    // Capitalize first letter (common for proper nouns)
    searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase()
  ];
  
  let bestResults = [];
  
  for (const query of searches) {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=10&origin=*`;
    
    try {
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': `${userName} (${userEmail})`,
          'Api-User-Agent': `${userName} (${userEmail})`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.query?.search && data.query.search.length > 0) {
          bestResults = bestResults.concat(data.query.search);
        }
      }
    } catch (err) {
      console.error(`Search failed for ${query}:`, err);
    }
  }
  
  // Step 2: Try Wikidata to find English equivalent
  // This helps with translations like "Pies" (Polish) -> "Dog" (English)
  try {
    const wikidataUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(searchTerm)}&language=en&format=json&limit=5&origin=*`;
    
    const wikidataResponse = await fetch(wikidataUrl, {
      headers: {
        'User-Agent': `${userName} (${userEmail})`,
        'Api-User-Agent': `${userName} (${userEmail})`
      }
    });
    
    if (wikidataResponse.ok) {
      const wikidataData = await wikidataResponse.json();
      
      if (wikidataData.search && wikidataData.search.length > 0) {
        // Get the English label from Wikidata
        const wikidataItem = wikidataData.search[0];
        const englishLabel = wikidataItem.label;
        const description = wikidataItem.description;
        
        // Search Wikipedia with the English label
        if (englishLabel && englishLabel.toLowerCase() !== searchTerm.toLowerCase()) {
          const englishSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(englishLabel)}&format=json&srlimit=10&origin=*`;
          
          const englishResponse = await fetch(englishSearchUrl, {
            headers: {
              'User-Agent': `${userName} (${userEmail})`,
              'Api-User-Agent': `${userName} (${userEmail})`
            }
          });
          
          if (englishResponse.ok) {
            const englishData = await englishResponse.json();
            if (englishData.query?.search && englishData.query.search.length > 0) {
              // Prioritize these results
              bestResults = englishData.query.search.concat(bestResults);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Wikidata search failed:', err);
  }
  
  // Remove duplicates and rank by similarity
  const uniqueResults = [];
  const seen = new Set();
  
  for (const result of bestResults) {
    if (!seen.has(result.title)) {
      seen.add(result.title);
      
      // Calculate relevance score
      const titleSimilarity = calculateSimilarity(searchTerm, result.title);
      const snippetMatch = result.snippet?.toLowerCase().includes(searchTerm.toLowerCase()) ? 0.2 : 0;
      
      uniqueResults.push({
        ...result,
        relevanceScore: titleSimilarity + snippetMatch
      });
    }
  }
  
  // Sort by relevance score
  uniqueResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return {
    results: uniqueResults,
    translatedTerm: translatedTerm,
    translationMethod: translationMethod,
    searchTermsUsed: searches
  };
}

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
    // Step 1: Use improved search with fuzzy matching and translation support
    const searchData = await findBestMatch(searchTerm, userName, userEmail);
    
    // Get the best match from search results
    if (!searchData.results || searchData.results.length === 0) {
      return JSON.stringify({
        error: `No Wikipedia articles found for keyword: ${searchTerm}`,
        keyword: searchTerm,
        queriedKeywords: {
          original: searchTerm,
          translated: searchData.translatedTerm,
          translationMethod: searchData.translationMethod,
          searchTermsUsed: searchData.searchTermsUsed
        },
        images: []
      });
    }
    
    const pageTitle = searchData.results[0].title;
    const relevanceScore = searchData.results[0].relevanceScore;
    
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
        queriedKeywords: {
          original: searchTerm,
          translated: searchData.translatedTerm,
          translationMethod: searchData.translationMethod,
          searchTermsUsed: searchData.searchTermsUsed
        },
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
    // Use pageTitle (which is already in English) for better Commons results
    const commonsSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(pageTitle)}&format=json&srlimit=10&origin=*`;
    
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
      queriedKeywords: {
        original: searchTerm,
        translated: searchData.translatedTerm,
        translationMethod: searchData.translationMethod,
        searchTermsUsed: searchData.searchTermsUsed
      },
      pageTitle: pageTitle,
      relevanceScore: Math.round(relevanceScore * 100) / 100,
      alternativeMatches: searchData.results.slice(1, 4).map(r => ({
        title: r.title,
        score: Math.round(r.relevanceScore * 100) / 100
      })),
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
