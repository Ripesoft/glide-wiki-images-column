const functions = new Map();

window.function = async function (keyword, userName, userEmail) {
  // Extract the actual keyword value - try multiple approaches
  let searchTerm = keyword;
  
  if (typeof keyword === 'object' && keyword !== null) {
    searchTerm = keyword.value || keyword.keyword || keyword.name || keyword.text || String(keyword);
  }
  
  // Ensure it's a string
  searchTerm = String(searchTerm);
  
  // Build the Wikipedia API URL with keyword directly in the URL
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(searchTerm)}&origin=*`;
  
  try {
    // Fetch with user information in headers (Wikipedia API best practice)
    const response = await fetch(url, {
      headers: {
        'User-Agent': `${userName} (${userEmail})`,
        'Api-User-Agent': `${userName} (${userEmail})`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the image URL from the Wikipedia response
    const pages = data.query?.pages || {};
    const page = Object.values(pages)[0];
    const imageUrl = page?.original?.source || '';
    
    // Return only the image URL as a plain string
    return imageUrl;
  } catch (error) {
    throw new Error(`Failed to fetch Wikipedia images: ${error.message}`);
  }
}
