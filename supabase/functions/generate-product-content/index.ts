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
    const { rawText } = await req.json();
    
    if (!rawText || rawText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Raw text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert SEO content writer specialising in e-commerce product descriptions for UK audiences. Your task is to create unique, SEO-optimised product content in British English AND extract key product metadata.

Requirements:
1. Use UK spelling (colour, organise, optimise, etc.)
2. Create unique content that differs from the input while preserving key facts
3. Optimise for search engines with natural keyword placement
4. Make content engaging and conversion-focused
5. Structure descriptions with SHORT paragraphs (2-3 sentences maximum)
6. Use bullet points for key features when appropriate
7. Add clear spacing between sections
8. Ensure excellent readability
9. Extract metadata fields (brand, ASIN, material, colour) from the raw text provided
10. Return ONLY valid JSON with no additional text
11. DO NOT use markdown formatting (**, *, etc.) in the generated content - use plain text only

Product details provided: ${rawText}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: 'Generate SEO-optimised product content with these exact specifications:\n- Title: 50-60 characters for optimal Google display, keyword-rich, compelling\n- Short Description: 20-160 characters for optimal search result display, concise value proposition\n- Long Description: 20-3000 characters, detailed, with SHORT paragraphs (2-3 sentences max), clear spacing, bullet points for features. Make it scannable and easy to read.\n\nALSO extract these metadata fields from the raw product text:\n- brand: Product brand/manufacturer name\n- asin: Amazon ASIN code (10 characters, typically starts with B)\n- material: Main material the product is made from (e.g., Plastic, Stainless Steel)\n- colour: Product colour or finish (e.g., Silver, Black)\n\nReturn as JSON only.' 
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_product_content',
              description: 'Generate SEO-optimised product content in UK English',
              parameters: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: 'SEO-optimised product title, 50-60 characters for optimal Google display, keyword-rich'
                  },
                  short_description: {
                    type: 'string',
                    description: 'Concise value proposition, 20-160 characters for optimal search result display'
                  },
                  long_description: {
                    type: 'string',
                    description: 'Detailed product description with benefits and features, 20-3000 characters, SHORT paragraphs (2-3 sentences), bullet points for key features, excellent readability'
                  },
                  brand: {
                    type: 'string',
                    description: 'Product brand or manufacturer name extracted from the raw text. Look for "Brand Name", "Brand:", "Visit the X Store", or manufacturer references'
                  },
                  asin: {
                    type: 'string',
                    description: 'Amazon ASIN code extracted from the raw text (10 characters, typically starts with B). Look for "ASIN" field in Item details'
                  },
                  material: {
                    type: 'string',
                    description: 'Main material the product is made from, extracted from "Material Type" or "Material" in raw text (e.g., Plastic, Stainless Steel, Wood)'
                  },
                  colour: {
                    type: 'string',
                    description: 'Product colour or finish extracted from "Colour" or "Color" in raw text (e.g., Silver, Black, Transparent)'
                  }
                },
                required: ['title', 'short_description', 'long_description'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_product_content' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      return new Response(
        JSON.stringify({ error: 'Invalid AI response format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const generatedContent = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(generatedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-product-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
