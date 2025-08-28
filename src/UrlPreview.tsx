import { Box, Card, CardContent, CardMedia, Typography, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';

interface UrlPreviewProps {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

interface UrlMetadata {
  title: string;
  description: string;
  image: string;
  siteName: string;
}

const UrlPreview = ({ url, title, description, image, siteName }: UrlPreviewProps) => {
  const [metadata, setMetadata] = useState<UrlMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!url) return;
      
      setLoading(true);
      try {
        const urlObj = new URL(url);
        
        // Try to fetch OG metadata first
        let scrapedMetadata: Partial<UrlMetadata> = {};
        
        // For now, skip API calls in development and go straight to URL parsing
        // This avoids CORS and API rate limiting issues
        console.log('Using URL parsing for metadata extraction');
        
        // Use URL parsing for metadata extraction
        let extractedTitle = title;
        let extractedDescription = description;
        let extractedImage = image;
        let extractedSiteName = siteName;

        if (urlObj.hostname.includes('notion.site')) {
          // For Notion pages, extract info from URL
          console.log('Parsing Notion URL:', url);
          console.log('Pathname:', urlObj.pathname);
          
          const pathParts = urlObj.pathname.split('/');
          console.log('Path parts:', pathParts);
          
          const pageId = pathParts[pathParts.length - 1];
          console.log('Page ID:', pageId);
          
          if (!extractedTitle) {
            // Extract the title from the page ID (which contains the full title)
            // Remove the page ID suffix (the long hash at the end)
            const titleFromUrl = pageId.replace(/-[a-f0-9]{32}$/, '');
            
            console.log('Title from URL:', titleFromUrl);
            
            // Convert kebab-case to Title Case
            extractedTitle = titleFromUrl
              .replace(/-/g, ' ')
              .replace(/^\s+|\s+$/g, '') // Trim whitespace
              .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
            
            console.log('Final extracted title:', extractedTitle);
            
            if (!extractedTitle) {
              extractedTitle = 'Notion Page';
            }
          }
          
          // No description for Notion pages
          if (!extractedDescription) {
            extractedDescription = '';
          }
          
          if (!extractedImage) {
            // Use a travel-themed image for Notion pages
            extractedImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&crop=center';
          }
          
          extractedSiteName = 'Notion';
        }
        
        if (!extractedDescription) {
          extractedDescription = 'Click to view the full content';
        }
        
        if (!extractedImage) {
          // Use a default image
          extractedImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&crop=center';
        }

        setMetadata({
          title: extractedTitle || 'Link Preview',
          description: extractedDescription || 'Click to view the full content',
          image: extractedImage || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
          siteName: extractedSiteName || urlObj.hostname
        });
      } catch (error) {
        console.error('Error fetching URL metadata:', error);
        setMetadata({
          title: 'Link Preview',
          description: 'Click to view the full content',
          image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
          siteName: 'External Link'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [url, title, description, image, siteName]);

  const handleReadClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <Card sx={{ 
        maxWidth: 400, 
        mb: 2,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Loading preview...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!metadata) {
    return null;
  }

  return (
    <Box
      onClick={handleReadClick}
      sx={{ cursor: 'pointer' }}
    >
      {metadata.image && (
        <CardMedia
          component="img"
          height="140"
          image={metadata.image}
          alt={metadata.title}
          sx={{ objectFit: 'cover' }}
        />
      )}
      <CardContent sx={{ p: 2 }}>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            fontWeight: 500,
            mb: 1,
            display: 'block'
          }}
        >
          {metadata.siteName}
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 1, 
            fontWeight: 600, 
            color: 'text.primary',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {metadata.title}
        </Typography>
        {metadata.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              lineHeight: 1.5,
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {metadata.description}
          </Typography>
        )}
        <Button
          variant="outlined"
          size="small"
          startIcon={<OpenInNewIcon />}
          onClick={(e) => {
            e.stopPropagation();
            handleReadClick();
          }}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
            }
          }}
        >
          Read Article
        </Button>
      </CardContent>
    </Box>
  );
};

export default UrlPreview;
