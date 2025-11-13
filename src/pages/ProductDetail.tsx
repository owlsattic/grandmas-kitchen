import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ArrowLeft, Loader2, ExternalLink, Package, Truck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Autoplay from 'embla-carousel-autoplay';
import logo from '@/assets/grandmas-kitchen-logo.png';
import AffiliateNote from '@/components/AffiliateNote';
import GrandmaApprovedBadge from '@/components/GrandmaApprovedBadge';
import { OrganizationSchema, ProductSchema, BreadcrumbSchema } from '@/components/StructuredData';
import { useAuth } from '@/hooks/useAuth';

interface Product {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  price: number | null;
  image_url: string | null;
  images: string[] | null;
  amazon_url: string;
  category: string[];
  brand: string | null;
  material: string | null;
  colour: string | null;
  asin: string | null;
  video_url: string | null;
  fulfillment_by: string;
  fab_table: { feature: string; advantage: string; benefit: string }[] | null;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [autoplayPlugin] = useState(() => Autoplay({ delay: 3000, stopOnInteraction: false }));

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .eq('approved', true)
          .single();

        if (error) throw error;
        setProduct(data as unknown as Product);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Generate SEO-friendly meta description
  const generateMetaDescription = () => {
    if (!product) return "Quality kitchen product from Grandma's Kitchen";
    
    const truncateText = (text: string, maxLength: number) => {
      return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    };
    
    const desc = product.short_description || product.description || product.title;
    return truncateText(
      `${desc}. ${product.brand ? `By ${product.brand}. ` : ''}Shop quality kitchen products at Grandma's Kitchen`,
      160
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Product Not Found</h1>
          <Link to="/shop">
            <Button variant="default">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shop
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayImages = product.images && product.images.length > 0 
    ? product.images 
    : product.image_url 
    ? [product.image_url] 
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{product.title} | Grandma's Kitchen Shop</title>
        <meta name="description" content={generateMetaDescription()} />
        <meta property="og:title" content={`${product.title} - Grandma's Kitchen`} />
        <meta property="og:description" content={generateMetaDescription()} />
        {product.image_url && <meta property="og:image" content={product.image_url} />}
        <link rel="canonical" href={`${window.location.origin}/product/${product.id}`} />
      </Helmet>

      {/* Organization Schema */}
      <OrganizationSchema />

      {/* Product Schema */}
      <ProductSchema
        name={product.title}
        description={product.short_description || product.description || product.title}
        image={displayImages}
        brand={product.brand || undefined}
        sku={product.asin || undefined}
      />

      {/* Breadcrumb Schema */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: window.location.origin },
          { name: 'Shop', url: `${window.location.origin}/shop` },
          { name: product.title, url: window.location.href }
        ]}
      />

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

      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-6 max-w-5xl flex justify-between items-center">
          <Link 
            to="/shop" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex flex-col leading-tight"
          >
            <span>Back to</span>
            <span className="font-medium">Kitchen Essentials</span>
          </Link>
          <img src={logo} alt="Grandma's Kitchen" className="h-24" />
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-5xl">
        <article className="py-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Product Images */}
            <div>
              {displayImages.length > 1 && (
                <div className="flex items-center gap-2 mb-3">
                  <Checkbox 
                    id="autoplay" 
                    checked={autoplay}
                    onCheckedChange={(checked) => {
                      setAutoplay(checked as boolean);
                      if (checked) {
                        autoplayPlugin.play();
                      } else {
                        autoplayPlugin.stop();
                      }
                    }}
                  />
                  <Label htmlFor="autoplay" className="text-sm cursor-pointer">
                    Auto-play images
                  </Label>
                </div>
              )}
              
              {displayImages.length > 1 ? (
                <Carousel 
                  className="w-full"
                  plugins={autoplay ? [autoplayPlugin] : []}
                  opts={{ loop: true }}
                >
                  <CarouselContent>
                    {displayImages.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="rounded-lg overflow-hidden shadow-soft bg-card">
                          <img
                            src={image}
                            alt={`${product.title} - ${product.brand || 'kitchen product'} - image ${index + 1} of ${displayImages.length}`}
                            className="w-full h-auto object-contain max-h-[500px]"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              ) : displayImages[0] ? (
                <div className="rounded-lg overflow-hidden shadow-soft bg-card">
                  <img
                    src={displayImages[0]}
                    alt={`${product.title} - ${product.brand || 'kitchen product'} from Grandma's Kitchen shop`}
                    className="w-full h-auto object-contain max-h-[500px]"
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-muted h-[500px] flex items-center justify-center">
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="flex items-start gap-2 mb-3 flex-wrap">
                {product.category.map((cat, idx) => (
                  <Badge key={idx} variant="outline">{cat}</Badge>
                ))}
                <GrandmaApprovedBadge />
              </div>

              <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                {product.title}
              </h1>

              {product.short_description && (
                <p className="text-xl text-muted-foreground mb-4">
                  {product.short_description}
                </p>
              )}

              <div className="flex items-center gap-3 mb-6">
                {product.fulfillment_by === 'amazon' ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="w-4 h-4" />
                    <span>Fulfilled by Amazon</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="w-4 h-4" />
                    <span>Shipped by Grandma's Kitchen</span>
                  </div>
                )}
              </div>

              <Button asChild size="lg" className="w-full mb-4">
                <a 
                  href={product.amazon_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  Check Price on Amazon
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>

              <AffiliateNote />
            </div>
          </div>

          {/* Full Description */}
          {product.description && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>About This Product</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Split description at Key Features section
                  const keyFeaturesRegex = /\*\*Key Features:\*\*/i;
                  const parts = product.description.split(keyFeaturesRegex);
                  
                  if (parts.length > 1) {
                    return (
                      <>
                        <p className="whitespace-pre-line mb-6">{parts[0].trim()}</p>
                        <h3 className="text-2xl font-serif font-bold mb-4">Key Features</h3>
                        <p className="whitespace-pre-line">{parts[1].trim()}</p>
                      </>
                    );
                  }
                  
                  return <p className="whitespace-pre-line">{product.description}</p>;
                })()}
              </CardContent>
            </Card>
          )}


          {/* Feature-Advantage-Benefit Table */}
          {product.fab_table && product.fab_table.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Features, Advantages & Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold bg-muted/50">Feature</th>
                        <th className="text-left p-4 font-semibold bg-muted/50">Advantage</th>
                        <th className="text-left p-4 font-semibold bg-muted/50">Benefit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.fab_table.map((row, index) => (
                        <tr key={index} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4 align-top">{row.feature}</td>
                          <td className="p-4 align-top">{row.advantage}</td>
                          <td className="p-4 align-top">{row.benefit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Details and Video Side by Side */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.brand && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brand:</span>
                    <span className="font-medium">{product.brand}</span>
                  </div>
                )}
                {product.material && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material:</span>
                    <span className="font-medium">{product.material}</span>
                  </div>
                )}
                {product.colour && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Colour:</span>
                    <span className="font-medium">{product.colour}</span>
                  </div>
                )}
                {product.asin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ASIN:</span>
                    <span className="font-mono text-sm">{product.asin}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Video */}
            {product.video_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <a 
                      href={product.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      Watch Product Video on Amazon
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </article>
      </main>
    </div>
  );
};

export default ProductDetail;
