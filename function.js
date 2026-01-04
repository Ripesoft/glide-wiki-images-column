const functions = new Map();

window.function = async function (keyword, userName, userEmail) {
  // Extract the actual keyword value if it's an object
  const searchTerm = typeof keyword === 'object' && keyword !== null 
    ? (keyword.value || keyword.toString()) 
    : String(keyword);
  
  // Build the Wikipedia API URL to search for images
  const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
  
  // First, search for the page related to the keyword
  searchUrl.searchParams.append('action', 'query');
  searchUrl.searchParams.append('format', 'json');
  searchUrl.searchParams.append('titles', searchTerm);
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
    
    // Return the complete Wikipedia response as-is
    return JSON.stringify(data);
  } catch (error) {
    throw new Error(`Failed to fetch Wikipedia images: ${error.message}`);
  }
}
