import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productData } = await req.json();
    console.log('Suggesting categories for product:', productData.title);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get existing categories from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existingCategories } = await supabase
      .from('categories')
      .select('name')
      .order('name');

    const categoryList = existingCategories?.map(c => c.name).join(', ') || '';

    const systemPrompt = `You are a category suggestion assistant for a kitchen products website. Given product information, suggest the 4 most relevant categories.

Available categories: ${categoryList}

Rules:
1. Suggest exactly 4 categories
2. Prioritize existing categories from the list above
3. Only suggest new categories if none of the existing ones fit well
4. Focus on the most specific and relevant categories for the product
5. Return a JSON array of category names`;

    const userPrompt = `Product Title: ${productData.title}
Description: ${productData.description || ''}
Brand: ${productData.brand || ''}
Material: ${productData.material || ''}

Suggest 4 best categories for this product.`;

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
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_categories",
            description: "Return 4 category suggestions",
            parameters: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 4,
                  maxItems: 4
                }
              },
              required: ["categories"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "suggest_categories" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required. Please add credits to your workspace.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('AI service error');
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    const toolCall = data.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    const suggestedCategories = result.categories;

    // Check which categories need to be created
    const newCategories: string[] = [];
    for (const category of suggestedCategories) {
      const exists = existingCategories?.some(c => 
        c.name.toLowerCase() === category.toLowerCase()
      );
      if (!exists) {
        newCategories.push(category);
      }
    }

    console.log('Suggested categories:', suggestedCategories);
    console.log('New categories to create:', newCategories);

    return new Response(
      JSON.stringify({ 
        categories: suggestedCategories,
        newCategories: newCategories
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-categories:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
