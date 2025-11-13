import { Link } from 'react-router-dom';
import { recipes as staticRecipes } from '@/data/recipes';
import type { Recipe } from '@/data/recipes';
import { Card, CardContent } from '@/components/ui/card';

interface RelatedRecipesProps {
  currentRecipe: Recipe;
  maxItems?: number;
}

export const RelatedRecipes = ({ currentRecipe, maxItems = 3 }: RelatedRecipesProps) => {
  // Get related recipes from the same category, excluding the current recipe
  const relatedRecipes = staticRecipes
    .filter(recipe => 
      recipe.id !== currentRecipe.id && 
      recipe.category === currentRecipe.category
    )
    .slice(0, maxItems);

  // If not enough from same category, fill with other recipes
  if (relatedRecipes.length < maxItems) {
    const additionalRecipes = staticRecipes
      .filter(recipe => 
        recipe.id !== currentRecipe.id && 
        recipe.category !== currentRecipe.category &&
        !relatedRecipes.find(r => r.id === recipe.id)
      )
      .slice(0, maxItems - relatedRecipes.length);
    
    relatedRecipes.push(...additionalRecipes);
  }

  if (relatedRecipes.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-3xl font-serif font-bold mb-6">You Might Also Like</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {relatedRecipes.map((recipe) => (
          <Link key={recipe.id} to={`/recipe/${recipe.id}`} className="group">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={recipe.image || recipe.images?.[0]}
                  alt={`${recipe.title} - ${recipe.category} recipe`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <CardContent className="p-4">
                <div className="text-xs text-primary font-medium mb-1 uppercase tracking-wider">
                  {recipe.category}
                </div>
                <h3 className="font-serif font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  {recipe.title}
                </h3>
                <div className="text-sm text-muted-foreground flex gap-4">
                  <span>⏱ {recipe.time} min</span>
                  <span>👥 {recipe.servings} servings</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};
