import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Fetching Amazon product from:', url);

    // Extract ASIN from URL or string - strict validation
    const extractASIN = (str: string): string | null => {
      if (!str) return null;
      const raw = str.trim();
      
      // Check if already a 10-char ASIN (ASINs typically start with B for products)
      const directMatch = raw.match(/^[B][A-Z0-9]{9}$/i);
      if (directMatch) return directMatch[0].toUpperCase();
      
      try {
        const u = new URL(raw);
        // Must be an amazon domain
        if (!u.hostname.includes('amazon.')) {
          return null;
        }
        
        // Try common Amazon URL patterns
        const pathMatch = u.pathname.match(/\/dp\/([B][A-Z0-9]{9})/i) || 
                         u.pathname.match(/\/gp\/product\/([B][A-Z0-9]{9})/i) ||
                         u.pathname.match(/\/product\/([B][A-Z0-9]{9})/i);
        if (pathMatch) return pathMatch[1].toUpperCase();
        
        const queryMatch = u.search.match(/[?&]asin=([B][A-Z0-9]{9})/i);
        if (queryMatch) return queryMatch[1].toUpperCase();
      } catch {
        // Not a valid URL - only accept if it looks like a proper ASIN (starts with B)
        const asinMatch = raw.match(/^[B][A-Z0-9]{9}$/i);
        if (asinMatch) return asinMatch[0].toUpperCase();
      }
      
      return null;
    };

    // Enhanced fetch with better headers, cookies, timeout, and progressive backoff
    const fetchWithHeaders = async (attemptUrl: string, retryCount = 0, maxRetries = 3): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch(attemptUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'DNT': '1',
            // Simulate session cookies (makes request look more like real browser)
            'Cookie': 'session-id=135-5555555-5555555; session-token=abc123xyz; ubid-acbuk=135-5555555-5555555',
            'Referer': 'https://www.amazon.co.uk/',
          },
          redirect: 'follow',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log(`[Attempt ${retryCount + 1}/${maxRetries + 1}] Status: ${response.status}, URL: ${response.url}`);

        // Progressive retry on server errors with increasing backoff
        if (!response.ok && (response.status === 503 || response.status === 500) && retryCount < maxRetries) {
          const waitTime = Math.min(2000 * (retryCount + 1), 8000); // 2s, 4s, 6s, 8s max
          console.info(`Got ${response.status}, waiting ${waitTime}ms before retry ${retryCount + 2}/${maxRetries + 1}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return fetchWithHeaders(attemptUrl, retryCount + 1, maxRetries);
        }

        return response;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error(`Request timeout after 15 seconds (attempt ${retryCount + 1})`);
          if (retryCount < maxRetries) {
            const waitTime = 2000 * (retryCount + 1);
            console.info(`Retrying after ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return fetchWithHeaders(attemptUrl, retryCount + 1, maxRetries);
          }
        }
        
        throw fetchError;
      }
    };

    // Extract ASIN first to try multiple URL variants
    const asin = extractASIN(url);
    if (!asin) {
      throw new Error('Invalid input. Please provide a valid Amazon product URL (e.g., https://amazon.co.uk/dp/B0EXAMPLE) or ASIN code (e.g., B0EXAMPLE). Product titles are not supported.');
    }

    console.log('ASIN extracted:', asin);

    // Try multiple URL variants for better success rate (like ChatGPT approach)
    const domain = url.includes('amazon.co.uk') ? 'amazon.co.uk' : 'amazon.com';
    const urlVariants = [
      `https://www.${domain}/dp/${asin}`,
      `https://www.${domain}/gp/product/${asin}`,
      `https://m.${domain}/dp/${asin}`,
    ];

    let response: Response | null = null;
    let html = '';
    let lastError: Error | null = null;

    // Try each URL variant until one works
    for (const tryUrl of urlVariants) {
      try {
        console.log(`Attempting to fetch from: ${tryUrl}`);
        response = await fetchWithHeaders(tryUrl);
        
        if (response.ok) {
          html = await response.text();
          console.log(`Successfully fetched from ${tryUrl}, HTML length: ${html.length}`);
          break;
        } else {
          console.log(`Failed with status ${response.status} from ${tryUrl}`);
        }
      } catch (err: any) {
        console.log(`Error fetching ${tryUrl}:`, err.message);
        lastError = err;
      }
    }

    // If all variants failed, throw error
    if (!response || !response.ok || !html) {
      if (lastError) throw lastError;
      throw new Error('All URL variants failed. Amazon may be blocking requests.');
    }

    const finalUrl = response.url;
    console.log('Final URL after redirects:', finalUrl);
    
    // Debug: Log HTML structure hints
    console.log('HTML length:', html.length);
    console.log('Contains productTitle:', html.includes('productTitle'));
    console.log('Contains price:', html.includes('a-price'));
    console.log('Contains image:', html.includes('landingImage'));
    console.log('First 500 chars:', html.substring(0, 500));
    
    // Check for bot detection pages
    if (html.includes('Sorry, we just need to make sure you\'re not a robot') || 
        html.includes('Enter the characters you see below') ||
        html.toLowerCase().includes('captcha')) {
      console.error('Amazon returned CAPTCHA/bot detection page');
      throw new Error('Amazon detected bot traffic and returned a CAPTCHA page. Please manually enter product details.');
    }

    // Helper function to add randomized delays to dodge bot detection
    const randomDelay = () => {
      const delayMs = Math.floor(Math.random() * 300) + 50; // Random 50-350ms delay
      return new Promise(resolve => setTimeout(resolve, delayMs));
    };

    // Helper function to decode HTML entities
    const decodeHtmlEntities = (text: string) => {
      return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
    };

    // Extract product information using multiple strategies with random delays
    console.log('Starting data extraction with randomized delays...');
    
    // Title - try multiple patterns including JSON-LD
    let titleMatch = html.match(/<span id="productTitle"[^>]*>(.*?)<\/span>/s) ||
                     html.match(/<h1[^>]*id="title"[^>]*>.*?<span[^>]*>(.*?)<\/span>/s) ||
                     html.match(/<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>(.*?)<\/h1>/s) ||
                     html.match(/"name"\s*:\s*"([^"]+)"/);
    
    // Try JSON-LD structured data
    if (!titleMatch) {
      const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          if (jsonLd.name) titleMatch = ['', jsonLd.name];
        } catch (e) {
          console.log('Failed to parse JSON-LD:', e);
        }
      }
    }
    
    const rawTitle = titleMatch ? titleMatch[1].trim().replace(/<[^>]*>/g, '').trim() : '';
    const title = decodeHtmlEntities(rawTitle);
    console.log('Title extracted:', title || 'NONE');
    
    await randomDelay(); // Random delay before next extraction

    // Price - check for £ symbol or detect UK site
    const isUK = finalUrl.includes('amazon.co.uk');
    // Try multiple price patterns including JSON data
    let priceMatch = html.match(/<span class="a-price-whole">([^<]+)<\/span><span[^>]*class="a-price-fraction">([^<]+)<\/span>/) ||
                     html.match(/<span class="a-offscreen">[\£\$€]?([\d,]+\.?\d*)<\/span>/) ||
                     html.match(/<span class="a-price">.*?[\£\$€]([\d,]+\.?\d*).*?<\/span>/s) ||
                     html.match(/"price"\s*:\s*"?[\£\$€]?([\d,]+\.?\d*)"?/) ||
                     html.match(/class="a-price-whole"[^>]*>([^<]+)</) ||
                     html.match(/priceToPay["']?\s*:\s*{\s*["']?value["']?\s*:\s*"?([\d.]+)"?/);
    
    // Try data attributes
    if (!priceMatch) {
      priceMatch = html.match(/data-a-color-price[^>]*>[\£\$€]?([\d,]+\.?\d*)</) ||
                   html.match(/priceblock_ourprice[^>]*>[\£\$€]?([\d,]+\.?\d*)</) ||
                   html.match(/priceblock_dealprice[^>]*>[\£\$€]?([\d,]+\.?\d*)</);
    }
    
    let price = null;
    if (priceMatch) {
      if (priceMatch[2]) {
        price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`.replace(/,/g, ''));
      } else {
        price = parseFloat(priceMatch[1].replace(/[,£$€]/g, ''));
      }
    }
    console.log('Price extracted:', price || 'NONE');
    
    await randomDelay(); // Random delay before next extraction

    // Image - try multiple sources including JSON data
    let imageMatch = html.match(/"hiRes"\s*:\s*"(https:?\/\/[^"]+)"/) ||
                     html.match(/"large"\s*:\s*"(https:?\/\/[^"]+)"/) ||
                     html.match(/<img[^>]*id="landingImage"[^>]*data-old-hires="([^"]+)"/) ||
                     html.match(/<img[^>]*id="landingImage"[^>]*src="([^"]+)"/) ||
                     html.match(/"mainUrl"\s*:\s*"(https:?\/\/[^"]+)"/) ||
                     html.match(/<img[^>]*id="imgBlkFront"[^>]*src="([^"]+)"/) ||
                     html.match(/data-a-dynamic-image=["'][^"']*["'](https:?\/\/m\.media-amazon\.com\/images\/I\/[^"']+)["']/);
    
    // Try colorImages JSON array
    if (!imageMatch) {
      const colorImagesMatch = html.match(/"colorImages"\s*:\s*{\s*"initial"\s*:\s*\[(.*?)\]/s);
      if (colorImagesMatch) {
        const firstImageMatch = colorImagesMatch[1].match(/"hiRes"\s*:\s*"(https:?\/\/[^"]+)"/);
        if (firstImageMatch) imageMatch = ['', firstImageMatch[1]];
      }
    }
    
    let imageUrl = '';
    if (imageMatch && imageMatch[1]) {
      let rawUrl = imageMatch[1];
      // Fix protocol if missing
      if (rawUrl.startsWith('//')) rawUrl = 'https:' + rawUrl;
      
      // Extract image ID from Amazon URL
      const imageIdMatch = rawUrl.match(/\/images\/I\/([^._]+)/);
      if (imageIdMatch) {
        const imageId = imageIdMatch[1];
        imageUrl = `https://m.media-amazon.com/images/I/${imageId}._AC_UL1000_.jpg`;
      } else {
        imageUrl = rawUrl;
      }
    }
    console.log('Image URL extracted:', imageUrl || 'NONE');
    
    await randomDelay(); // Random delay before next extraction

    // Description - try to get feature bullets
    const descriptionMatch = html.match(/<div id="feature-bullets"[^>]*>(.*?)<\/div>/s) ||
                            html.match(/<div id="featurebullets_feature_div"[^>]*>(.*?)<\/div>/s);
    let description = '';
    if (descriptionMatch) {
      const bullets = descriptionMatch[1].match(/<span class="a-list-item">(.*?)<\/span>/gs) ||
                     descriptionMatch[1].match(/<li[^>]*>(.*?)<\/li>/gs);
      if (bullets) {
        description = bullets
          .map(b => b.replace(/<[^>]*>/g, '').trim())
          .filter(b => b.length > 0 && !b.toLowerCase().includes('see more'))
          .join(' ')
          .substring(0, 500);
      }
    }
    
    // If no description from bullets, try product description
    if (!description) {
      const productDescMatch = html.match(/<div id="productDescription"[^>]*>.*?<p>(.*?)<\/p>/s);
      if (productDescMatch) {
        description = decodeHtmlEntities(productDescMatch[1].replace(/<[^>]*>/g, '').trim()).substring(0, 500);
      }
    }
    
    await randomDelay(); // Random delay before next extraction

    // Category - try to get from breadcrumbs
    const categoryMatch = html.match(/<a class="a-link-normal a-color-tertiary"[^>]*>(.*?)<\/a>/) ||
                         html.match(/<span class="a-list-item"><a[^>]*>(.*?)<\/a><\/span>/);
    const category = categoryMatch ? categoryMatch[1].trim().replace(/<[^>]*>/g, '').trim() : '';
    
    await randomDelay(); // Random delay before next extraction

    // Brand - try multiple patterns
    let brand = '';
    const brandMatch = html.match(/Visit the ([^<]+) Store/i) ||
                      html.match(/<a id="bylineInfo"[^>]*>([^<]+)<\/a>/i) ||
                      html.match(/Brand:\s*<\/span><span[^>]*>([^<]+)<\/span>/i) ||
                      html.match(/"brand"\s*:\s*"([^"]+)"/i);
    if (brandMatch) {
      brand = decodeHtmlEntities(brandMatch[1].trim());
    }
    
    await randomDelay(); // Random delay before next extraction

    // Material - look in product details table
    let material = '';
    const materialMatch = html.match(/Material:\s*<\/span><span[^>]*>([^<]+)<\/span>/i) ||
                         html.match(/Material Type:\s*<\/span><span[^>]*>([^<]+)<\/span>/i) ||
                         html.match(/"material"\s*:\s*"([^"]+)"/i);
    if (materialMatch) {
      material = decodeHtmlEntities(materialMatch[1].trim());
    }
    
    await randomDelay(); // Random delay before next extraction

    // Colour - look in product details or variation selector
    let colour = '';
    const colourMatch = html.match(/Colo[u]?r:\s*<\/span><span[^>]*>([^<]+)<\/span>/i) ||
                       html.match(/Colo[u]?r Name:\s*<\/span><span[^>]*>([^<]+)<\/span>/i) ||
                       html.match(/"color"\s*:\s*"([^"]+)"/i) ||
                       html.match(/<span class="selection">([^<]+)<\/span>/i);
    if (colourMatch) {
      colour = decodeHtmlEntities(colourMatch[1].trim());
    }
    
    await randomDelay(); // Random delay before next extraction

    // Rating - look for star rating
    let rating = null;
    const ratingMatch = html.match(/<span[^>]*class="[^"]*a-icon-alt[^"]*"[^>]*>([\d.]+)\s+out of/i) ||
                       html.match(/<i[^>]*class="[^"]*a-star[^"]*"[^>]*><span[^>]*>([\d.]+)\s+out of/i) ||
                       html.match(/"ratingValue"\s*:\s*"?([\d.]+)"?/i);
    if (ratingMatch) {
      const ratingValue = parseFloat(ratingMatch[1]);
      if (!isNaN(ratingValue) && ratingValue >= 0 && ratingValue <= 5) {
        rating = ratingValue;
      }
    }
    
    await randomDelay(); // Random delay before next extraction

    // Video URL - look for product videos in multiple formats
    let videoUrl = '';
    
    // Try to find video in imageBlock JSON data
    const imageBlockMatch = html.match(/"imageBlockData"\s*:\s*({.*?})\s*,\s*"dimensionsDisplay"/s);
    if (imageBlockMatch) {
      try {
        const imageBlockData = JSON.parse(imageBlockMatch[1]);
        if (imageBlockData.videos && Array.isArray(imageBlockData.videos) && imageBlockData.videos.length > 0) {
          const video = imageBlockData.videos[0];
          videoUrl = video.url || video.videoUrl || '';
        }
      } catch (e) {
        console.log('Failed to parse imageBlockData for video:', e);
      }
    }
    
    // Try video JSON data patterns
    if (!videoUrl) {
      const videoMatch = html.match(/"videos"\s*:\s*\[\s*{[^}]*"url"\s*:\s*"([^"]+)"/i) ||
                        html.match(/"videoUrl"\s*:\s*"([^"]+)"/i) ||
                        html.match(/"video"\s*:\s*{\s*"url"\s*:\s*"([^"]+)"/i);
      if (videoMatch) {
        videoUrl = videoMatch[1];
      }
    }
    
    // Try aplus module video
    if (!videoUrl) {
      const aplusVideoMatch = html.match(/data-video-url="([^"]+)"/i);
      if (aplusVideoMatch) {
        videoUrl = aplusVideoMatch[1];
      }
    }
    
    // Fix protocol if missing
    if (videoUrl && videoUrl.startsWith('//')) {
      videoUrl = 'https:' + videoUrl;
    }
    
    console.log('Video URL extracted:', videoUrl || 'NONE');
    console.log('Data extraction complete with randomized timing');

    console.log('Extracted data:', {
      title, 
      price, 
      imageUrl, 
      asin, 
      category, 
      brand, 
      material, 
      colour, 
      rating, 
      videoUrl,
      isUK, 
      descriptionLength: description.length 
    });

    const productData = {
      title: title || 'Unable to fetch title',
      price: price,
      image_url: imageUrl,
      description: description || 'Unable to fetch description',
      category: category || 'Kitchen & Dining',
      asin: asin || null,
      amazon_url: url,
      brand: brand || null,
      material: material || null,
      colour: colour || null,
      rating: rating,
      video_url: videoUrl || null,
    };

    return new Response(JSON.stringify(productData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching Amazon product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Provide helpful error message
    let userMessage = 'Failed to fetch product details. ';
    if (errorMessage.includes('CAPTCHA') || errorMessage.includes('bot')) {
      userMessage = 'Amazon detected bot traffic and returned a CAPTCHA page. Please manually enter product details.';
    } else if (errorMessage.includes('blocked') || errorMessage.includes('503') || errorMessage.includes('500')) {
      userMessage = 'Amazon is blocking automated requests. Please manually enter the product details instead.';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      userMessage = 'Request timed out. Amazon may be slow or blocking. Please try again or enter details manually.';
    } else {
      userMessage = 'The URL format may not be recognized or the page is unavailable.';
    }
    
    // Return 200 with error details so client can distinguish from edge function errors
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: userMessage,
        title: 'Unable to fetch title',
        price: null,
        image_url: '',
        description: 'Unable to fetch description',
        category: 'Kitchen & Dining',
        asin: null,
        amazon_url: '',
        brand: null,
        material: null,
        colour: null,
        rating: null,
        video_url: null,
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
