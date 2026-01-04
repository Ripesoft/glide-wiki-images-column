const functions = new Map();

window.function = async function (keyword, userName, userEmail) {
  // Extract the actual keyword value if it's an object
  const searchTerm = typeof keyword === 'object' && keyword !== null 
    ? (keyword.value || keyword.toString()) 
    : String(keyword);
  
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
    
    // Return the complete Wikipedia response as-is
    return JSON.stringify(data);
  } catch (error) {
    throw new Error(`Failed to fetch Wikipedia images: ${error.message}`);
  }
}
