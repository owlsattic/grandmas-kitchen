import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { recipes as staticRecipes } from '@/data/recipes';
import type { Recipe } from '@/data/recipes';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ArrowLeft, Clock, Users, Printer, Loader2 } from 'lucide-react';
import logo from '@/assets/grandmas-kitchen-logo.png';
import { OrganizationSchema, RecipeSchema, BreadcrumbSchema } from '@/components/StructuredData';
import { RelatedRecipes } from '@/components/RelatedRecipes';
import { useAuth } from '@/hooks/useAuth';

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaticRecipe, setIsStaticRecipe] = useState(false);
  const [printSections, setPrintSections] = useState({
    pictures: false,
    ingredients: false,
    instructions: false,
  });
  const [printAll, setPrintAll] = useState(false);
  
  const handlePrintAllChange = (checked: boolean) => {
    setPrintAll(checked);
    setPrintSections({
      pictures: checked,
      ingredients: checked,
      instructions: checked,
    });
  };
  
  const handleIndividualSectionChange = (section: keyof typeof printSections, checked: boolean) => {
    const newSections = { ...printSections, [section]: checked };
    setPrintSections(newSections);
    
    // Update printAll based on whether all sections are checked
    const allChecked = newSections.pictures && newSections.ingredients && newSections.instructions;
    setPrintAll(allChecked);
  };
  const [overflowWarnings, setOverflowWarnings] = useState({
    pictures: false,
    ingredients: false,
    instructions: false,
  });

  const checkOverflow = () => {
    const picturesEl = document.querySelector('.print-section-pictures');
    const ingredientsEl = document.querySelector('.print-section-ingredients');
    const instructionsEl = document.querySelector('.print-section-instructions');
    
    const A4_HEIGHT = 1122; // A4 height in pixels at 96 DPI (297mm)
    
    setOverflowWarnings({
      pictures: picturesEl ? picturesEl.scrollHeight > A4_HEIGHT : false,
      ingredients: ingredientsEl ? ingredientsEl.scrollHeight > A4_HEIGHT : false,
      instructions: instructionsEl ? instructionsEl.scrollHeight > A4_HEIGHT : false,
    });
  };

  const handlePrint = () => {
    checkOverflow();
    setTimeout(() => {
      const classList = [];
      if (!printSections.pictures) classList.push('print-hide-pictures');
      if (!printSections.ingredients) classList.push('print-hide-ingredients');
      if (!printSections.instructions) classList.push('print-hide-instructions');
      
      document.body.className = classList.join(' ');
      window.print();
      document.body.className = '';
    }, 100);
  };

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;

      // First check static recipes
      const staticRecipe = staticRecipes.find(r => r.id === id);
      if (staticRecipe) {
        setRecipe(staticRecipe);
        setIsStaticRecipe(true);
        setLoading(false);
        return;
      }

      // Then check database recipes
      try {
        const { data, error } = await supabase
          .from('user_recipes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          const formattedRecipe: Recipe = {
            id: data.id,
            title: data.title,
            category: data.category,
            country: data.country,
            time: data.time,
            images: data.images || [],
            description: data.description,
            ingredients: data.ingredients,
            instructions: data.instructions,
            servings: data.servings,
            nutrition: data.nutrition as Recipe['nutrition'],
          };
          setRecipe(formattedRecipe);
        }
      } catch (error) {
        console.error('Error fetching recipe:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Recipe Not Found</h1>
          <Link to="/">
            <Button variant="default">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Recipes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Generate SEO-friendly meta description
  const generateMetaDescription = () => {
    if (!recipe) return "Traditional family recipe from Grandma's Kitchen";
    
    const truncateText = (text: string, maxLength: number) => {
      return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    };
    
    return truncateText(
      `${recipe.description || recipe.title} - ${recipe.time} min, ${recipe.servings} servings. ${recipe.category} recipe from Grandma's Kitchen`,
      160
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{recipe?.title ? `${recipe.title} Recipe | Grandma's Kitchen` : "Recipe | Grandma's Kitchen"}</title>
        <meta name="description" content={generateMetaDescription()} />
        <meta property="og:title" content={recipe?.title ? `${recipe.title} Recipe` : "Recipe"} />
        <meta property="og:description" content={generateMetaDescription()} />
        {recipe?.image && <meta property="og:image" content={recipe.image} />}
        {recipe?.images?.[0] && <meta property="og:image" content={recipe.images[0]} />}
        <link rel="canonical" href={`${window.location.origin}/recipe/${recipe?.id}`} />
      </Helmet>

      {/* Organization Schema */}
      <OrganizationSchema />

      {/* Recipe Schema */}
      {recipe && (
        <>
          <RecipeSchema
            name={recipe.title}
            description={recipe.description}
            image={recipe.images || (recipe.image ? [recipe.image] : undefined)}
            totalTime={recipe.time}
            recipeYield={recipe.servings}
            recipeCategory={recipe.category}
            recipeIngredient={recipe.ingredients}
            recipeInstructions={recipe.instructions}
            nutrition={recipe.nutrition ? {
              calories: String(recipe.nutrition.calories),
              protein: recipe.nutrition.protein,
              carbs: recipe.nutrition.carbs,
              fat: recipe.nutrition.fat
            } : undefined}
          />
          <BreadcrumbSchema
            items={[
              { name: 'Home', url: window.location.origin },
              { name: 'Recipes', url: `${window.location.origin}/recipes` },
              { name: recipe.title, url: window.location.href }
            ]}
          />
        </>
      )}
      
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block print-header">
        <div style={{ width: '120pt', height: '40pt', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          <img src={logo} alt="Grandma's Kitchen" className="print-logo" />
        </div>
      </div>

      <header className="bg-grandma-cream border-b border-border print:hidden" role="banner">
        <div className="container mx-auto px-4 py-4 max-w-5xl">
          <div className="flex justify-between items-center">
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
                <Button variant="ghost" onClick={signOut}>
                  Sign Out
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-5xl print:px-0 print:max-w-none">
        <div className="bg-background border-b border-border -mx-4 px-4 print:hidden">
          <div className="py-6 flex justify-end">
            <img src={logo} alt="Grandma's Kitchen" className="h-24" />
          </div>
        </div>
        
        <article className="py-8 print:py-0">
          {/* Screen Layout */}
          <div className="print:hidden">
            <header className="mb-8">
              <div className="text-sm font-medium text-primary mb-2 uppercase tracking-wider">
                {recipe.category}
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                {recipe.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                {recipe.description}
              </p>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-medium">{recipe.time} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-medium">{recipe.servings} servings</span>
                </div>
              </div>
            </header>

            {recipe.images && recipe.images.length > 0 ? (
              <Carousel className="w-full mb-8">
                <CarouselContent>
                  {recipe.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="rounded-lg overflow-hidden shadow-soft bg-card">
                        <img
                          src={image}
                          alt={recipe.altText || `${recipe.title} - ${recipe.category} recipe - image ${index + 1}`}
                          className="w-full h-auto object-contain max-h-[600px]"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            ) : recipe.image ? (
              <div className="rounded-lg overflow-hidden mb-8 shadow-soft bg-card">
                <img
                  src={recipe.image}
                  alt={recipe.altText || `${recipe.title} - ${recipe.category} recipe`}
                  className="w-full h-auto object-contain max-h-[600px]"
                />
              </div>
            ) : null}

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <Card className="sticky top-4">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-serif font-semibold mb-4">Ingredients</h2>
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1.5">•</span>
                          <span>{ingredient}</span>
                        </li>
                      ))}
                    </ul>

                    {recipe.nutrition && (
                      <>
                        <Separator className="my-6" />
                        <div>
                          <h3 className="text-lg font-serif font-semibold mb-3">Nutrition (per serving)</h3>
                          <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">Calories</dt>
                              <dd className="font-medium">{recipe.nutrition.calories}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">Protein</dt>
                              <dd className="font-medium">{recipe.nutrition.protein}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">Carbs</dt>
                              <dd className="font-medium">{recipe.nutrition.carbs}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">Fat</dt>
                              <dd className="font-medium">{recipe.nutrition.fat}</dd>
                            </div>
                          </dl>
                        </div>
                      </>
                    )}

                    <Separator className="my-6" />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Printer className="w-4 h-4 mr-2" />
                          Print Options
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 print:hidden">
                        <div className="space-y-4">
                          {(overflowWarnings.pictures || overflowWarnings.ingredients || overflowWarnings.instructions) && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded p-2 text-xs">
                              <p className="font-semibold text-destructive">⚠️ Content Overflow Warning</p>
                              {overflowWarnings.pictures && <p className="text-destructive">• Pictures section exceeds 1 page</p>}
                              {overflowWarnings.ingredients && <p className="text-destructive">• Ingredients section exceeds 1 page</p>}
                              {overflowWarnings.instructions && <p className="text-destructive">• Instructions section exceeds 1 page</p>}
                              <p className="mt-1 text-muted-foreground">Consider reducing text to fit on A4 pages.</p>
                            </div>
                          )}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="print-all" 
                                checked={printAll}
                                onCheckedChange={(checked) => handlePrintAllChange(checked as boolean)}
                              />
                              <label htmlFor="print-all" className="text-sm cursor-pointer font-medium">
                                Print All
                              </label>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="pictures" 
                                checked={printSections.pictures}
                                onCheckedChange={(checked) => handleIndividualSectionChange('pictures', checked as boolean)}
                              />
                              <label htmlFor="pictures" className="text-sm cursor-pointer">
                                Print Pictures {overflowWarnings.pictures && '⚠️'}
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="ingredients" 
                                checked={printSections.ingredients}
                                onCheckedChange={(checked) => handleIndividualSectionChange('ingredients', checked as boolean)}
                              />
                              <label htmlFor="ingredients" className="text-sm cursor-pointer">
                                Print Ingredients & Nutrition {overflowWarnings.ingredients && '⚠️'}
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="instructions" 
                                checked={printSections.instructions}
                                onCheckedChange={(checked) => handleIndividualSectionChange('instructions', checked as boolean)}
                              />
                              <label htmlFor="instructions" className="text-sm cursor-pointer">
                                Print Instructions {overflowWarnings.instructions && '⚠️'}
                              </label>
                            </div>
                          </div>
                          <Button onClick={handlePrint} className="w-full">
                            <Printer className="w-4 h-4 mr-2" />
                            Print Recipe
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                <h2 className="text-2xl font-serif font-semibold mb-4">Instructions</h2>
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </span>
                      <p className="pt-1">{instruction}</p>
                    </li>
                  ))}
                </ol>

                <div className="mt-8 p-6 bg-accent rounded-lg">
                  <p className="text-sm">
                    <strong className="font-serif">Tip:</strong> This recipe has been passed down through generations. 
                    Feel free to adjust seasonings to your taste and make it your own!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Print Layout - Different for static vs user recipes */}
          <div className="hidden print:block">
            {isStaticRecipe ? (
              /* Single-page compact layout for free static recipes */
              <div className="print-section" style={{ pageBreakAfter: 'avoid' }}>
                <h1 className="text-3xl font-serif font-bold mb-2">{recipe.title}</h1>
                <p className="text-sm text-muted-foreground mb-4">{recipe.category} • {recipe.time} min • {recipe.servings} servings</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Single image */}
                  <div className="col-span-2" style={{ height: '200pt' }}>
                    {(recipe.image || recipe.images?.[0]) && (
                      <img
                        src={recipe.image || recipe.images[0]}
                        alt={recipe.altText || `${recipe.title} - ${recipe.category} recipe for printing`}
                        className="w-full h-full object-cover rounded"
                      />
                    )}
                  </div>
                  
                  {/* Ingredients */}
                  <div className="border rounded p-3">
                    <h2 className="text-lg font-serif font-semibold mb-2">Ingredients</h2>
                    <ul className="space-y-1 text-sm">
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-primary mt-0.5">•</span>
                          <span className="text-xs">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Instructions */}
                  <div className="border rounded p-3">
                    <h2 className="text-lg font-serif font-semibold mb-2">Instructions</h2>
                    <ol className="space-y-1.5 text-sm">
                      {recipe.instructions.map((instruction, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">
                            {index + 1}
                          </span>
                          <p className="text-xs pt-0.5">{instruction}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  {/* Nutrition */}
                  {recipe.nutrition && (
                    <div className="col-span-2 border rounded p-3">
                      <h3 className="text-base font-semibold mb-2">Nutrition (per serving)</h3>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{recipe.nutrition.calories}</div>
                          <div className="text-xs text-muted-foreground">Calories</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{recipe.nutrition.protein}</div>
                          <div className="text-xs text-muted-foreground">Protein</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{recipe.nutrition.carbs}</div>
                          <div className="text-xs text-muted-foreground">Carbs</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{recipe.nutrition.fat}</div>
                          <div className="text-xs text-muted-foreground">Fat</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Multi-page layout with 12 images for user-created recipes */
              <>
                {/* Section 1: Pictures */}
                <div className="print-section print-section-pictures">
                  <h1 className="text-4xl font-serif font-bold mb-2">{recipe.title}</h1>
                  <p className="text-sm text-muted-foreground mb-4">{recipe.category} • {recipe.time} min • {recipe.servings} servings</p>
                  
                  <div className="recipe-images-grid">
                    {Array.from({ length: 12 }).map((_, index) => {
                      let imageSrc = null;
                      
                      // Determine which images to use for each position
                      if (index === 0) {
                        // First slot: use hero image if it exists, otherwise first array image
                        imageSrc = recipe.image || (recipe.images?.[0]) || null;
                      } else {
                        // Subsequent slots: use images from array
                        // If we have a separate hero image, start from images[0]
                        // If hero image IS images[0] (or no hero), start from images[1]
                        const hasHeroImage = recipe.image && recipe.image !== recipe.images?.[0];
                        const arrayOffset = hasHeroImage ? 0 : 1;
                        const imageIndex = (index - 1) + arrayOffset;
                        imageSrc = recipe.images?.[imageIndex] || null;
                      }
                      
                      return (
                        <div key={index} className="recipe-image-item">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={recipe.altText || `${recipe.title} - ${recipe.category} recipe - image ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted/20 border border-dashed border-muted-foreground/20 rounded flex items-center justify-center text-xs text-muted-foreground">
                              Image {index + 1}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Ingredients */}
                <div className="print-section print-section-ingredients">
                  <h2 className="text-2xl font-serif font-semibold mb-4">Ingredients</h2>
                  <p className="text-sm mb-4">{recipe.description}</p>
                  <div className="ingredients-box">
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {recipe.nutrition && (
                    <div className="nutrition-box">
                      <h3 className="text-xl font-semibold mb-3">Nutrition (per serving)</h3>
                      <div className="nutrition-grid">
                        <div className="nutrition-row">
                          <span className="nutrition-label">Calories</span>
                          <span className="nutrition-value">{recipe.nutrition.calories}</span>
                        </div>
                        <div className="nutrition-row">
                          <span className="nutrition-label">Protein</span>
                          <span className="nutrition-value">{recipe.nutrition.protein}</span>
                        </div>
                        <div className="nutrition-row">
                          <span className="nutrition-label">Carbs</span>
                          <span className="nutrition-value">{recipe.nutrition.carbs}</span>
                        </div>
                        <div className="nutrition-row">
                          <span className="nutrition-label">Fat</span>
                          <span className="nutrition-value">{recipe.nutrition.fat}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Instructions */}
                <div className="print-section print-section-instructions">
                  <h2 className="text-2xl font-serif font-semibold mb-4">Instructions</h2>
                  <div className="instructions-box">
                    <ol className="space-y-4">
                      {recipe.instructions.map((instruction, index) => (
                        <li key={index} className="flex gap-4">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </span>
                          <p className="pt-1">{instruction}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Related Recipes Section - Only shown on screen */}
          <div className="print:hidden">
            {recipe && <RelatedRecipes currentRecipe={recipe} />}
          </div>
        </article>
      </main>

      <footer className="border-t border-border mt-16 py-8 print:hidden">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Grandma's Recipes • All rights reserved</p>
        </div>
      </footer>

      {/* Print Footer - Only visible when printing */}
      <div className="hidden print:block print-footer">
        <p>© 2025 Grandma's Kitchen • www.grandmaskitchen.org</p>
      </div>
    </div>
  );
};

export default RecipeDetail;
