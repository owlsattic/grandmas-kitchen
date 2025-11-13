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
        JSON.stringify({ error: 'Recipe text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a recipe data extraction expert. Your job is to parse raw recipe text and extract structured information.

IMPORTANT RULES:
1. Extract the recipe title (if not found, create a descriptive one)
2. Extract a brief description (1-2 sentences about the dish)
3. Identify the category from: Soup, Main Course, Dessert, Salad, Beverage, Appetizer, Side Dish
4. Identify the country of origin (e.g., USA, Italy, Mexico, etc.)
5. Extract cooking time in minutes (total time including prep)
6. Extract servings/portions
7. Extract ingredients as a clear list (keep measurements)
8. Extract instructions as step-by-step list
9. Extract nutrition if available (calories, protein, carbs, fat)

Return your response as a JSON object with this exact structure:
{
  "title": "Recipe name",
  "description": "Brief description of the dish",
  "category": "One of the valid categories",
  "country": "Country name",
  "time": number (in minutes),
  "servings": number,
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "nutrition": {
    "calories": number or null,
    "protein": "string with unit" or null,
    "carbs": "string with unit" or null,
    "fat": "string with unit" or null
  }
}`;

    console.log('Parsing recipe text...');

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
          { role: 'user', content: `Please parse this recipe:\n\n${rawText}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_recipe_data',
              description: 'Extract structured recipe data from raw text',
              parameters: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  category: { 
                    type: 'string',
                    enum: ['Soup', 'Main Course', 'Dessert', 'Salad', 'Beverage', 'Appetizer', 'Side Dish']
                  },
                  country: { type: 'string' },
                  time: { type: 'number' },
                  servings: { type: 'number' },
                  ingredients: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  instructions: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  nutrition: {
                    type: 'object',
                    properties: {
                      calories: { type: 'number' },
                      protein: { type: 'string' },
                      carbs: { type: 'string' },
                      fat: { type: 'string' }
                    }
                  }
                },
                required: ['title', 'description', 'category', 'country', 'time', 'servings', 'ingredients', 'instructions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_recipe_data' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service requires payment. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('Invalid response from AI');
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-recipe function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred while parsing the recipe'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
