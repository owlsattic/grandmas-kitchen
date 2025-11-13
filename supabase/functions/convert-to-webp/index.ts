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
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: 'No image file provided' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Converting image: ${imageFile.name}, type: ${imageFile.type}, size: ${imageFile.size} bytes`);

    // Read the image as array buffer
    const imageBuffer = await imageFile.arrayBuffer();
    
    // Convert to WebP using ImageMagick via Deno FFI
    // For now, we'll use a web service or return the base64 for client-side conversion
    // In production, you'd want to use a proper image processing library
    
    // Convert to base64 for response
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    // In a real implementation, you would:
    // 1. Use an image processing library to convert to WebP
    // 2. Upload to Supabase Storage
    // 3. Return the storage URL
    
    // For now, return instructions for client-side handling
    return new Response(
      JSON.stringify({ 
        message: 'Image received. For WebP conversion, consider using client-side libraries or external services.',
        originalName: imageFile.name,
        originalType: imageFile.type,
        originalSize: imageFile.size,
        recommendation: 'Use tools like squoosh.app or imagemagick for batch conversion of existing images'
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error converting image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
