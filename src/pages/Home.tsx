import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import heroImage from '@/assets/hero-kitchen.jpg';
import logo from '@/assets/grandmas-kitchen-logo.png';
import { ChefHat, BookOpen, ShoppingBag, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { OrganizationSchema } from '@/components/StructuredData';

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, role } = useUserRole(user?.id);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Grandma's Kitchen | Simple Recipes & Kitchen Essentials</title>
        <meta 
          name="description" 
          content="Discover simple, nourishing recipes from a 104-year legacy. Real ingredients, no fuss. Browse traditional family recipes and quality kitchen products." 
        />
        <link rel="canonical" href={window.location.origin} />
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
                <Link to="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
                  Shop
                </Link>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
                <Link to="/christmas" className="text-muted-foreground hover:text-foreground transition-colors">
                  Christmas
                </Link>
              </nav>
              
              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Link 
                      to="/recipes" 
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Recipes
                    </Link>
                    <Link 
                      to="/shop" 
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Shop
                    </Link>
                    <Link 
                      to="/about" 
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      About
                    </Link>
                    <Link 
                      to="/christmas" 
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Christmas
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
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

      <main id="main" role="main">
        {/* Hero Section */}
        <section className="relative h-[400px] md:h-[600px] overflow-hidden" aria-label="Welcome to Grandma's Kitchen">
          <img
            src={heroImage}
            alt="Warm, inviting kitchen with grandmother cooking"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-transparent flex items-center">
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-2xl text-background">
                <h2 className="text-2xl sm:text-3xl md:text-6xl font-serif font-bold mb-3 md:mb-6 leading-tight">
                  Welcome to Grandma's Kitchen
                </h2>
                <p className="text-sm sm:text-base md:text-2xl mb-4 md:mb-8 opacity-95 leading-relaxed">
                  104 years of family wisdom. Simple food. Lifelong health. Real ingredients, no fuss.
                </p>
                <div className="flex flex-wrap gap-2 md:gap-4">
                  <Button size="lg" asChild>
                    <Link to="/recipes">
                      <ChefHat className="mr-2 h-5 w-5" />
                      Browse Recipes
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="bg-background/10 hover:bg-background/20 text-background border-background" asChild>
                    <Link to="/shop">
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Shop Products
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-lg bg-card border border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-3">Timeless Recipes</h3>
              <p className="text-muted-foreground mb-4">
                Discover thousands of simple, nourishing recipes inspired by a 104-year family legacy.
              </p>
              <Button variant="outline" asChild>
                <Link to="/recipes">Explore Recipes</Link>
              </Button>
            </div>

            <div className="text-center p-8 rounded-lg bg-card border border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-3">Curated Products</h3>
              <p className="text-muted-foreground mb-4">
                Shop our hand-picked selection of kitchen essentials and quality ingredients.
              </p>
              <Button variant="outline" asChild>
                <Link to="/shop">Browse Shop</Link>
              </Button>
            </div>

            <div className="text-center p-8 rounded-lg bg-card border border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-3">Family Legacy</h3>
              <p className="text-muted-foreground mb-4">
                Learn about our grandmother's inspiring 104-year journey and cooking philosophy.
              </p>
              <Button variant="outline" asChild>
                <Link to="/about">Our Story</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-accent py-16">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-4xl font-serif font-bold mb-4">
              Start Your Culinary Journey Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands discovering the joy of simple, nourishing cooking. From 5-minute juices to hearty family suppers.
            </p>
            <Button size="lg" asChild>
              <Link to="/recipes">Get Started Free</Link>
            </Button>
          </div>
        </section>
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

export default Home;
