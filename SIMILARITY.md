# Enhanced Search Similarity Features

## Overview
This project now includes advanced similarity and matching algorithms to provide more accurate search results, especially for:
- **Multi-language queries** (e.g., "Pies" in Polish → "Dog" in English)
- **Typos and misspellings** (e.g., "Caat" → "Cat")
- **Fuzzy matching** for better relevance

## Key Improvements

### 1. **Wikidata Integration**
The system now queries Wikidata to find English equivalents of foreign language terms.

**How it works:**
- Query "Pies" (Polish) → Wikidata returns English label "Dog"
- System searches Wikipedia with "Dog" instead
- Returns accurate dog images

**Benefits:**
- Works with multiple languages (Polish, Spanish, German, French, etc.)
- Finds canonical English article names
- Improves international user experience

### 2. **Levenshtein Distance Algorithm**
Calculates the minimum number of single-character edits needed to change one word into another.

**Example:**
```
"Caat" vs "Cat"
- Distance: 1 (one extra 'a')
- Similarity: 75%

"Elepahnt" vs "Elephant"
- Distance: 1 (transposed 'h')
- Similarity: 88%
```

**Implementation:**
```javascript
function levenshteinDistance(a, b) {
  // Creates a matrix comparing each character
  // Returns minimum edit distance
}

function calculateSimilarity(str1, str2) {
  // Returns 0-1 score (1 = perfect match)
  // Uses: (length - distance) / length
}
```

### 3. **Multi-Strategy Search**
The system tries multiple search approaches simultaneously:
1. Direct search (as-is)
2. Quoted exact phrase search
3. Capitalized version (for proper nouns)
4. Wikidata translation lookup

### 4. **Relevance Scoring**
Each search result gets a relevance score based on:
- **Title similarity** (Levenshtein-based)
- **Snippet matching** (does the excerpt contain the search term?)

**Formula:**
```
relevanceScore = titleSimilarity + snippetBonus
where snippetBonus = 0.2 if snippet contains term
```

### 5. **Alternative Match Display**
Shows top 3 alternative matches with their scores, helping users understand:
- What the system found
- Why it chose a particular result
- Other possible matches

## API Response Format

The enhanced response now includes:

```json
{
  "keyword": "Pies",
  "pageTitle": "Dog",
  "relevanceScore": 0.85,
  "alternativeMatches": [
    {"title": "Pie", "score": 0.45},
    {"title": "Pies (food)", "score": 0.40}
  ],
  "images": [...],
  "imageCount": 5
}
```

## Testing

### Using the Test Page
Open `test-similarity.html` in a browser to test various scenarios:

**Multi-language Tests:**
- 🇵🇱 Pies (Polish for Dog)
- 🇪🇸 Perro (Spanish for Dog)
- 🇩🇪 Hund (German for Dog)
- 🇫🇷 Chien (French for Dog)

**Fuzzy Matching Tests:**
- Caat → Cat
- Elepahnt → Elephant
- Lioon → Lion

### Expected Results

| Query | Should Find | Relevance Score |
|-------|-------------|-----------------|
| Pies | Dog | ~85-100% |
| Perro | Dog | ~85-100% |
| Caat | Cat | ~75% |
| Elepahnt | Elephant | ~88% |

## Performance Considerations

### Trade-offs
1. **More API calls** - Queries Wikidata + multiple Wikipedia searches
2. **Slightly slower** - But more accurate results
3. **Better UX** - Users get what they expect

### Optimization Tips
- Results are ranked, so best match appears first
- Alternative matches are limited to top 3
- Failed translation attempts don't block results

## Future Enhancements

### Possible Additions:
1. **LibreTranslate API** - For more reliable translation
2. **Phonetic matching** (Soundex/Metaphone) - For pronunciation-based searches
3. **TF-IDF scoring** - Weight terms by importance
4. **Embedding-based similarity** - Use ML models for semantic matching
5. **Caching** - Store translation mappings locally
6. **User feedback loop** - Learn from user selections

### Advanced Algorithms to Consider:

**Cosine Similarity:**
```javascript
// For comparing search term against multiple results
// Good for longer text snippets
function cosineSimilarity(vec1, vec2) {
  // Convert text to vectors
  // Calculate cosine of angle between vectors
}
```

**Jaro-Winkler Distance:**
```javascript
// Better for short strings (names)
// Gives more weight to matching prefixes
function jaroWinkler(s1, s2) {
  // Specialized for proper nouns
}
```

**BM25 Ranking:**
```javascript
// Industry-standard for search engines
// Used by Elasticsearch, Lucene
// Ranks documents by term frequency + importance
```

## Code Structure

### Main Components:

1. **levenshteinDistance()** - Calculates edit distance
2. **calculateSimilarity()** - Converts distance to 0-1 score
3. **findBestMatch()** - Orchestrates multi-strategy search
4. **window.function()** - Main entry point

### Flow:
```
User Query → findBestMatch()
    ↓
    ├─→ Direct Wikipedia search
    ├─→ Quoted phrase search  
    ├─→ Capitalized search
    └─→ Wikidata translation
    ↓
Merge & deduplicate results
    ↓
Calculate relevance scores
    ↓
Sort by score
    ↓
Return best match + alternatives
```

## Debugging

### To see what's happening:
1. Open browser console (F12)
2. Look for logs during searches
3. Check relevance scores in response
4. Review alternative matches

### Common Issues:

**Low relevance scores (<40%):**
- Search term very different from article title
- Consider using more specific terms
- Check alternative matches for better options

**No Wikidata results:**
- Term may not be in Wikidata database
- Falls back to direct Wikipedia search
- Not an error, just limited translation

## Conclusion

These enhancements significantly improve search accuracy by:
- ✅ Handling multi-language queries via Wikidata
- ✅ Forgiving typos with Levenshtein distance
- ✅ Ranking results by relevance
- ✅ Showing transparency with scores and alternatives
- ✅ Maintaining backwards compatibility

The "Pies" → "Dog" example now works correctly!
