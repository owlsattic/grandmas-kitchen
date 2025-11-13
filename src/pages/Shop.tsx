import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Images, ChevronDown } from 'lucide-react';
import logo from '@/assets/grandmas-kitchen-logo.png';
import Autoplay from 'embla-carousel-autoplay';
import AffiliateNote from '@/components/AffiliateNote';
import GrandmaApprovedBadge from '@/components/GrandmaApprovedBadge';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { buildHighlighter } from '@/lib/searchHighlight';
import { OrganizationSchema } from '@/components/StructuredData';

interface Product {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  price: number | null;
  image_url: string | null;
  amazon_url: string;
  category: string[];
  approved: boolean | null;
  asin: string | null;
  created_at: string;
  fab_table: { feature: string; advantage: string; benefit: string }[] | null;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
}

const Shop = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isModerator, role } = useUserRole(user?.id);
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, selectedSubCategory, searchQuery]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('level', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    let query = supabase
      .from('products')
      .select('*')
      .eq('approved', true);

    // Apply search filter (title, description, or ASIN contains)
    if (searchQuery.trim().length >= 2) {
      const searchTerm = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},asin.ilike.${searchTerm}`);
    }

    // Order and execute
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } else {
      // Apply category filter client-side since category is an array
      let filteredData = data || [];
      
      if (selectedCategory !== 'All') {
        const categoryNames = getCategoryNamesForFilter(selectedCategory, selectedSubCategory);
        console.log('Filtering by categories:', categoryNames);
        
        if (categoryNames.length > 0) {
          filteredData = filteredData.filter(product => 
            product.category && product.category.some(cat => 
              categoryNames.includes(cat)
            )
          );
        }
      }
      
      setProducts(filteredData as unknown as Product[]);
    }
    setIsLoading(false);
  };

  // Get child categories for the selected parent
  const getChildCategories = (parentName: string): Category[] => {
    const parent = categories.find(c => c.name === parentName);
    if (!parent) return [];
    return categories.filter(c => c.parent_id === parent.id);
  };

  // Check if a category has children
  const hasChildren = (categoryName: string): boolean => {
    const parent = categories.find(c => c.name === categoryName);
    if (!parent) return false;
    return categories.some(c => c.parent_id === parent.id);
  };

  // Get all category names that should be included when filtering
  const getCategoryNamesForFilter = (categoryName: string, subCategoryName?: string | null): string[] => {
    if (categoryName === 'All') return [];
    
    // If a sub-category is selected, only filter by that
    if (subCategoryName) return [subCategoryName];
    
    const selectedCat = categories.find(c => c.name === categoryName);
    if (!selectedCat) return [categoryName];
    
    // Get all child categories
    const childCategories = categories
      .filter(c => c.parent_id === selectedCat.id)
      .map(c => c.name);
    
    // Get all grandchild categories
    const grandchildCategories = categories
      .filter(c => {
        const parent = categories.find(p => p.id === c.parent_id);
        return parent && parent.parent_id === selectedCat.id;
      })
      .map(c => c.name);
    
    return [categoryName, ...childCategories, ...grandchildCategories];
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSubCategory(null);
  };

  const handleSearchChange = (value: string) => {
    // Clear existing timeout
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setSearchQuery(value);
    }, 300);

    setSearchDebounce(timeout);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]');
    if (searchInput) {
      searchInput.value = '';
    }
  };

  const childCategories = selectedCategory !== 'All' ? getChildCategories(selectedCategory) : [];

  const filteredProducts = products;

  // Add Amazon affiliate tag to URLs
  const addAffiliateTag = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (/amazon\./i.test(urlObj.hostname) && !urlObj.searchParams.has('tag')) {
        urlObj.searchParams.set('tag', 'grandmaskitch-21');
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Kitchen Essentials Shop | Grandma's Kitchen</title>
        <meta 
          name="description" 
          content="Browse quality kitchen products and essentials chosen for home cooking. All grandma-approved tools and ingredients with honest reviews and recommendations." 
        />
        <link rel="canonical" href={`${window.location.origin}/shop`} />
      </Helmet>
      
      {/* Organization Schema */}
      <OrganizationSchema />

      <header className="bg-grandma-cream border-b border-border" role="banner">
        <div className="container mx-auto px-4 py-4 max-w-5xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl md:text-3xl font-serif font-bold hover:text-primary transition-colors">
                Grandma's Kitchen
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link to="/recipes" className="text-muted-foreground hover:text-foreground transition-colors">
                  Recipes
                </Link>
                <Link to="/shop" className="text-foreground font-medium">
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

      <main id="main" role="main" className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
            Kitchen Essentials
          </h1>
          <p className="text-xl text-muted-foreground flex items-center justify-center gap-2 flex-wrap">
            Quality products to help you create delicious meals — all <GrandmaApprovedBadge />
          </p>
          <div className="max-w-4xl mx-auto mt-4">
            <AffiliateNote />
          </div>
        </div>

        {(selectedCategory === 'Cutlery' || filteredProducts.some(p => p.category && p.category.includes('Cutlery'))) && selectedCategory !== 'All' && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-900 dark:text-amber-200 text-center">
              <strong>Age Restriction Notice:</strong> Cutlery and knife products require proof of age (18+) at delivery as per Amazon's policies.
            </p>
          </div>
        )}

        {isMobile ? (
          <div className="mb-6">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full max-w-xs mx-auto">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories
                  .filter(cat => cat.level === 0)
                  .map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                      {hasChildren(category.name) && ' →'}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="mb-6">
            <TabsList className="flex flex-wrap justify-center gap-2 h-auto bg-transparent">
              <TabsTrigger 
                value="All"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All
              </TabsTrigger>
              {categories
                .filter(cat => cat.level === 0)
                .map((category) => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.name}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <span className="flex items-center gap-1">
                      {category.name}
                      {hasChildren(category.name) && <ChevronDown className="h-3 w-3" />}
                    </span>
                  </TabsTrigger>
                ))}
            </TabsList>
          </Tabs>
        )}

        {/* Search Box */}
        <div className="mb-6 flex flex-wrap justify-center gap-3 items-center">
          <label htmlFor="search-input" className="text-sm font-medium">
            Search:
          </label>
          <input
            id="search-input"
            type="search"
            placeholder="title / description / ASIN"
            onChange={(e) => handleSearchChange(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg min-w-[260px] focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearSearch}
          >
            Clear
          </Button>
        </div>

        {childCategories.length > 0 && selectedCategory !== 'All' && (
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            <Badge
              variant={selectedSubCategory === null ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedSubCategory(null)}
            >
              All {selectedCategory}
            </Badge>
            {childCategories.map((subCat) => (
              <Badge
                key={subCat.id}
                variant={selectedSubCategory === subCat.name ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedSubCategory(subCat.name)}
              >
                {subCat.name}
              </Badge>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>No Products Yet</CardTitle>
                <CardDescription>
                  We're currently curating the best kitchen products for you. Check back soon!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to="/recipes">Browse Recipes Instead</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(() => {
              const highlighter = buildHighlighter(searchQuery);
              return filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  description={product.short_description || product.description || undefined}
                  imageUrl={product.image_url || ''}
                  productUrl={addAffiliateTag(product.amazon_url)}
                  approved={product.approved || false}
                  category={product.category.join(', ')}
                  highlightedTitle={highlighter(product.title)}
                  highlightedDescription={product.short_description ? highlighter(product.short_description) : product.description ? highlighter(product.description) : undefined}
                  hasFAB={product.fab_table && product.fab_table.length > 0}
                />
              ));
            })()}
           </div>
        )}
      </main>

      <div className="container mx-auto px-4 mt-8">
        <AffiliateNote variant="footer" />
      </div>

      <Footer />
    </div>
  );
};

export default Shop;
