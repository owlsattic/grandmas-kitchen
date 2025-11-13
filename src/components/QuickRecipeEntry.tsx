import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QuickRecipeEntryProps {
  onSuccess: (parsedData: any) => void;
  onCancel: () => void;
}

export const QuickRecipeEntry = ({ onSuccess, onCancel }: QuickRecipeEntryProps) => {
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = async () => {
    if (!rawText.trim()) {
      toast({
        title: 'Error',
        description: 'Please paste some recipe content first',
        variant: 'destructive',
      });
      return;
    }

    setIsParsing(true);

    try {
      const { data, error } = await supabase.functions.invoke('parse-recipe', {
        body: { rawText },
      });

      if (error) throw error;

      if (data) {
        toast({
          title: 'Success! 🎉',
          description: 'Recipe parsed successfully. Review and save!',
        });
        onSuccess(data);
      } else {
        throw new Error('No data returned from parser');
      }
    } catch (error) {
      console.error('Error parsing recipe:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to parse recipe',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasteExample = () => {
    const example = `Classic Chicken Noodle Soup

A comforting bowl of homemade chicken noodle soup with tender chicken, vegetables, and egg noodles in a flavorful broth.

Origin: USA
Prep Time: 15 minutes
Cook Time: 45 minutes
Total Time: 60 minutes
Servings: 6

Ingredients:
- 2 tablespoons olive oil
- 1 medium onion, diced
- 3 carrots, sliced
- 3 celery stalks, sliced
- 3 cloves garlic, minced
- 8 cups chicken broth
- 2 cups cooked chicken, shredded
- 2 cups egg noodles
- 1 bay leaf
- 1 teaspoon dried thyme
- Salt and pepper to taste
- Fresh parsley for garnish

Instructions:
1. Heat olive oil in a large pot over medium heat. Add onion, carrots, and celery. Cook for 5-7 minutes until softened.
2. Add garlic and cook for another minute until fragrant.
3. Pour in chicken broth and bring to a boil. Add bay leaf and thyme.
4. Reduce heat and simmer for 20 minutes until vegetables are tender.
5. Add egg noodles and cook according to package directions (usually 6-8 minutes).
6. Stir in cooked chicken and heat through for 3-4 minutes.
7. Season with salt and pepper to taste. Remove bay leaf.
8. Serve hot, garnished with fresh parsley.

Nutrition (per serving):
Calories: 245
Protein: 22g
Carbs: 18g
Fat: 9g`;

    setRawText(example);
    toast({
      title: 'Example Pasted',
      description: 'Try the AI parser with this example recipe!',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick Recipe Entry with AI
          </CardTitle>
          <CardDescription>
            Paste your recipe from anywhere - a website, email, or text file. AI will automatically extract and organize all the information for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Paste Recipe Text</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePasteExample}
              >
                <Copy className="w-4 h-4 mr-1" />
                Load Example
              </Button>
            </div>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your recipe here... Include title, ingredients, instructions, cooking time, servings, and any other details you have."
              rows={20}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Tip: The more information you provide, the better AI can organize it. Include measurements, cooking times, temperatures, and serving sizes.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleParse}
              disabled={isParsing || !rawText.trim()}
              className="flex-1"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI is Organizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Parse with AI
                </>
              )}
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={isParsing}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
