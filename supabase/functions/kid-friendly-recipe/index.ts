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
    const { ingredients, instructions } = await req.json();

    if (!ingredients || !instructions) {
      return new Response(
        JSON.stringify({ error: 'Ingredients and instructions are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a fun cooking teacher who explains recipes to 10-year-old kids. 
Your job is to rewrite ingredients and instructions in a simple, fun way that kids can understand.

IMPORTANT RULES:
1. Use simple words and short sentences
2. Add relevant emojis at the start of each item (like 🥕 for carrot, 🧈 for butter, 🔥 for cooking, etc.)
3. Make it encouraging and fun
4. Keep measurements but explain them simply
5. For instructions, break down complex steps into simple actions
6. Use action words kids understand (mix, pour, stir, wait, etc.)

Return your response as a JSON object with this exact structure:
{
  "ingredients": ["emoji + simple ingredient description", ...],
  "instructions": ["emoji + simple step-by-step instruction", ...]
}`;

    const userPrompt = `Please rewrite these ingredients and instructions for a 10-year-old:

INGREDIENTS:
${ingredients.map((ing: string, i: number) => `${i + 1}. ${ing}`).join('\n')}

INSTRUCTIONS:
${instructions.map((inst: string, i: number) => `${i + 1}. ${inst}`).join('\n')}`;

    console.log('Calling AI with prompt...');

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
        tools: [
          {
            type: 'function',
            function: {
              name: 'rewrite_recipe',
              description: 'Rewrite recipe ingredients and instructions for kids',
              parameters: {
                type: 'object',
                properties: {
                  ingredients: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Kid-friendly ingredients with emojis'
                  },
                  instructions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Kid-friendly instructions with emojis'
                  }
                },
                required: ['ingredients', 'instructions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'rewrite_recipe' } }
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
    console.log('AI response:', JSON.stringify(data, null, 2));

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
    console.error('Error in kid-friendly-recipe function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred while processing the recipe'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
