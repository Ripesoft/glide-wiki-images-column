const functions = new Map();

window.function = async function (keyword, userName, userEmail) {
  // Build the Wikipedia API URL to search for images
  const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
  
  // First, search for the page related to the keyword
  searchUrl.searchParams.append('action', 'query');
  searchUrl.searchParams.append('format', 'json');
  searchUrl.searchParams.append('titles', keyword);
  searchUrl.searchParams.append('prop', 'pageimages|images');
  searchUrl.searchParams.append('pithumbsize', '300');
  searchUrl.searchParams.append('origin', '*');
  
  try {
    // Fetch page info with images
    const response = await fetch(searchUrl.toString());
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }
    
    const data = await response.json();
    const pages = data.query.pages;
    const page = Object.values(pages)[0];
    
    // Extract image information
    const images = [];
    
    if (page.thumbnail) {
      images.push({
        title: page.title,
        url: page.thumbnail.source,
        width: page.thumbnail.width,
        height: page.thumbnail.height
      });
    }
    
    if (page.images) {
      // Fetch details of images to get their URLs
      const imageNames = page.images.slice(0, 10).map(img => img.title);
      
      if (imageNames.length > 0) {
        const imageInfoUrl = new URL('https://en.wikipedia.org/w/api.php');
        imageInfoUrl.searchParams.append('action', 'query');
        imageInfoUrl.searchParams.append('format', 'json');
        imageInfoUrl.searchParams.append('titles', imageNames.join('|'));
        imageInfoUrl.searchParams.append('prop', 'imageinfo');
        imageInfoUrl.searchParams.append('iiprop', 'url|size');
        imageInfoUrl.searchParams.append('origin', '*');
        
        const imageResponse = await fetch(imageInfoUrl.toString());
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const imagePages = imageData.query.pages;
          
          Object.values(imagePages).forEach(imgPage => {
            if (imgPage.imageinfo) {
              imgPage.imageinfo.forEach(info => {
                images.push({
                  title: imgPage.title,
                  url: info.url,
                  width: info.width,
                  height: info.height
                });
              });
            }
          });
        }
      }
    }
    
    return JSON.stringify({
      keyword: keyword,
      imageCount: images.length,
      images: images,
      userAgent: `${userName} (${userEmail})`
    });
  } catch (error) {
    throw new Error(`Failed to fetch Wikipedia images: ${error.message}`);
  }
}
