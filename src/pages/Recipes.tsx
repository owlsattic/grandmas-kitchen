import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { recipes as staticRecipes } from '@/data/recipes';
import type { Recipe } from '@/data/recipes';
import { supabase } from '@/integrations/supabase/client';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeFilters } from '@/components/RecipeFilters';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserRole } from '@/hooks/useUserRole';
import heroImage from '@/assets/hero-kitchen.jpg';
import { OrganizationSchema } from '@/components/StructuredData';

const Recipes = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { subscription } = useSubscription(user?.id);
  const { isAdmin, role } = useUserRole(user?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTime, setSelectedTime] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRecipes();
  }, []);

  const fetchUserRecipes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_recipes')
        .select('*');

      if (error) throw error;

      const formattedRecipes: Recipe[] = (data || []).map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        category: recipe.category,
        country: recipe.country,
        time: recipe.time,
        images: recipe.images || [],
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        servings: recipe.servings,
        nutrition: recipe.nutrition as Recipe['nutrition'],
      }));

      setUserRecipes(formattedRecipes);
    } catch (error) {
      console.error('Error fetching user recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const allRecipes = [...staticRecipes, ...userRecipes];

  const filteredAndSortedRecipes = useMemo(() => {
    let filtered = allRecipes.filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
      const matchesTime = selectedTime === 'all' || recipe.time <= parseInt(selectedTime);
      
      if (subscription?.tier === 'free') {
        return matchesSearch && matchesCategory && matchesTime;
      } else if (subscription?.tier === 'country' && subscription.selectedCountry) {
        return matchesSearch && matchesCategory && matchesTime && 
               recipe.country === subscription.selectedCountry;
      }
      
      return matchesSearch && matchesCategory && matchesTime;
    });

    // Only apply the 10-recipe limit for free users who aren't staff
    if (subscription?.tier === 'free' && role !== 'admin' && role !== 'moderator') {
      filtered = filtered.slice(0, 10);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'time') {
        return a.time - b.time;
      } else if (sortBy === 'category') {
        return a.category.localeCompare(b.category);
      }
      return 0;
    });

    return filtered;
  }, [searchQuery, selectedCategory, selectedTime, sortBy, subscription, allRecipes]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Traditional Recipes | Grandma's Kitchen</title>
        <meta 
          name="description" 
          content="Browse simple, traditional family recipes from 5-minute juices to hearty dinners. Real ingredients, clear instructions, and proper nourishment for families." 
        />
        <link rel="canonical" href={`${window.location.origin}/recipes`} />
      </Helmet>
      
      {/* Organization Schema */}
      <OrganizationSchema />

      <header className="bg-grandma-cream border-b border-border" role="banner">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl md:text-3xl font-serif font-bold hover:text-primary transition-colors">
                Grandma's Kitchen
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link to="/recipes" className="text-foreground font-medium">
                  Recipes
                </Link>
                <Link to="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
                  Shop
                </Link>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </nav>
            </div>
            <div className="flex gap-2">
              {user ? (
                <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:flex">
                  Sign Out
                </Button>
              ) : (
                <Button size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">
              Grandma's Recipes
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple food. Lifelong health. Search, filter, and cook with confidence.
            </p>
          </div>
        </div>
      </header>

      <main id="main" role="main" className="container mx-auto px-4 py-8">
        <section className="relative rounded-2xl overflow-hidden mb-12 shadow-soft" aria-label="Kitchen hero image">
          <div className="min-h-[280px] sm:min-h-[240px] md:aspect-[21/7]">
            <img
              src={heroImage}
              alt="Warm, inviting kitchen with grandmother cooking"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent flex items-end">
            <div className="p-4 sm:p-6 md:p-12 text-background">
              <h2 className="text-xl sm:text-2xl md:text-5xl font-serif font-bold mb-2 sm:mb-3 leading-tight">
                Real ingredients. No fuss. Proper nourishment.
              </h2>
              <p className="text-sm sm:text-base md:text-xl opacity-95 max-w-2xl leading-snug">
                Browse 5-minute juices to hearty family suppers — all in one place.
              </p>
            </div>
          </div>
        </section>

        <RecipeFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedTime={selectedTime}
          onTimeChange={setSelectedTime}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground" aria-live="polite">
              {filteredAndSortedRecipes.length} {filteredAndSortedRecipes.length === 1 ? 'recipe' : 'recipes'} found
            </p>
            {subscription?.tier === 'free' && (
              <p className="text-sm text-primary">
                Free plan: showing first 10 recipes. <Link to="/subscription" className="underline">Upgrade for full access</Link>
              </p>
            )}
            {subscription?.tier === 'country' && subscription.selectedCountry && (
              <p className="text-sm text-primary">
                Viewing recipes from {subscription.selectedCountry}
              </p>
            )}
          </div>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" aria-label="Recipe cards">
          {filteredAndSortedRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </section>

        {filteredAndSortedRecipes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">No recipes found matching your criteria.</p>
            <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
          </div>
        )}

        <aside className="bg-accent p-6 rounded-lg text-center max-w-2xl mx-auto">
          <p className="text-sm">
            <strong className="font-serif text-lg">Tip:</strong> Click any recipe to see ingredients, method, nutrition, and a printable card.
          </p>
        </aside>
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4">
          {user && isAdmin && (
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">Admin Panel</Link>
              </Button>
            </div>
          )}
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 Grandma's Kitchen • All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Recipes;
