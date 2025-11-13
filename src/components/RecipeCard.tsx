import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import type { Recipe } from '@/data/recipes';

interface RecipeCardProps {
  recipe: Recipe;
}

export const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const displayImage = recipe.images?.[0] || recipe.image || '';
  const altText = recipe.altText || `${recipe.title} - ${recipe.category} recipe from Grandma's Kitchen`;
  
  return (
    <Link to={`/recipe/${recipe.id}`}>
      <Card className="group overflow-hidden border-border bg-card hover:shadow-soft transition-all duration-300 h-full">
        <div className="aspect-square overflow-hidden">
          <img
            src={displayImage}
            alt={altText}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <CardContent className="p-4">
          <div className="text-xs font-medium text-primary mb-2 uppercase tracking-wider">
            {recipe.category}
          </div>
          <h3 className="font-serif text-xl font-semibold text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {recipe.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{recipe.time} min</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
