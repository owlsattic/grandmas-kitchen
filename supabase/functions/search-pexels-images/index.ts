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
    const { query, perPage = 15 } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PEXELS_API_KEY = Deno.env.get('Pexels_API_Key');
    console.log('API Key exists:', !!PEXELS_API_KEY);
    console.log('API Key length:', PEXELS_API_KEY?.length);
    
    if (!PEXELS_API_KEY) {
      console.error('PEXELS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Image search service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Making request to Pexels API...');
    console.log('Query:', query);
    console.log('Per page:', perPage);
    
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY,
        },
      }
    );

    console.log('Pexels response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pexels API error:', response.status, errorText);
      console.error('API Key first 10 chars:', PEXELS_API_KEY.substring(0, 10));
      return new Response(
        JSON.stringify({ error: 'Failed to search images', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Format the response to include relevant image data
    const images = data.photos.map((photo: any) => ({
      id: photo.id,
      url: photo.src.large,
      thumbnail: photo.src.medium,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      alt: photo.alt || query,
    }));

    return new Response(
      JSON.stringify({ images }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-pexels-images function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
