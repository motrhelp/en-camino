export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Validate URL
    const urlObj = new URL(url);
    
    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Simple HTML parsing using regex (no external dependencies)
    const metadata = {
      title: '',
      description: '',
      image: '',
      siteName: '',
      url: url,
    };

    // Extract title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    
    metadata.title = (ogTitleMatch && ogTitleMatch[1]) || 
                     (twitterTitleMatch && twitterTitleMatch[1]) || 
                     (titleMatch && titleMatch[1]) || '';

    // Extract description
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    const twitterDescMatch = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    
    metadata.description = (ogDescMatch && ogDescMatch[1]) || 
                          (twitterDescMatch && twitterDescMatch[1]) || 
                          (metaDescMatch && metaDescMatch[1]) || '';

    // Extract image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    
    if (ogImageMatch || twitterImageMatch) {
      metadata.image = (ogImageMatch && ogImageMatch[1]) || (twitterImageMatch && twitterImageMatch[1]) || '';
      // Make relative URLs absolute
      if (metadata.image && !metadata.image.startsWith('http')) {
        metadata.image = new URL(metadata.image, url).href;
      }
    }

    // Extract site name
    const ogSiteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    metadata.siteName = (ogSiteNameMatch && ogSiteNameMatch[1]) || urlObj.hostname;

    // Clean up the data
    Object.keys(metadata).forEach(key => {
      if (typeof metadata[key] === 'string') {
        metadata[key] = metadata[key].trim();
      }
    });

    return res.status(200).json(metadata);

  } catch (error) {
    console.error('Error fetching metadata:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
