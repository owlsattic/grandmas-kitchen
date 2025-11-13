import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductForm } from '@/components/ProductForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Trash2, ExternalLink, Pencil, Eye, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategoryManagement } from '@/components/CategoryManagement';
import { AffiliateLinkUpdater } from '@/components/AffiliateLinkUpdater';
import logo from '@/assets/grandmas-kitchen-logo.png';

interface Product {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  category: string[];
  image_url: string | null;
  images: string[] | null;
  amazon_url: string;
  price: number | null;
  asin: string | null;
  video_url: string | null;
  brand: string | null;
  material: string | null;
  colour: string | null;
  rating: number | null;
  approved: boolean | null;
  created_at: string;
  fab_table: { feature: string; advantage: string; benefit: string }[] | null;
}

const ProductManagement = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isModerator } = useUserRole(user?.id);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } else {
      setProducts((data as unknown as Product[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user && (isAdmin || isModerator)) {
      fetchProducts();
    }
  }, [user, isAdmin, isModerator]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      fetchProducts();
    }
  };

  const handleEditSuccess = () => {
    setEditingProduct(null);
    fetchProducts();
  };

  const handleToggleApproval = async (id: string, currentApprovalStatus: boolean | null) => {
    const newStatus = !currentApprovalStatus;
    const { error } = await supabase
      .from('products')
      .update({ approved: newStatus })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update approval status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Product ${newStatus ? 'approved' : 'unapproved'} successfully`,
      });
      fetchProducts();
    }
  };

  const handleBulkApprove = async () => {
    if (!confirm('Are you sure you want to approve ALL unapproved products?')) return;

    const { error } = await supabase
      .from('products')
      .update({ approved: true })
      .eq('approved', false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to bulk approve products',
        variant: 'destructive',
      });
    } else {
      const unapprovedCount = products.filter(p => !p.approved).length;
      toast({
        title: 'Success',
        description: `${unapprovedCount} products approved successfully`,
      });
      fetchProducts();
    }
  };

  const handleGenerateFAB = async (product: Product) => {
    toast({
      title: 'Generating FAB Table',
      description: 'AI is analyzing the product...',
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-fab', {
        body: { productData: product }
      });

      if (error) throw error;

      if (!data || !data.fabTable) {
        throw new Error('Invalid response from AI');
      }

      // Update product with FAB table
      const { error: updateError } = await supabase
        .from('products')
        .update({ fab_table: data.fabTable })
        .eq('id', product.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'FAB table generated successfully!',
      });
      
      fetchProducts();
    } catch (error) {
      console.error('Error generating FAB:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate FAB table',
        variant: 'destructive',
      });
    }
  };

  if (!user || (!isAdmin && !isModerator)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need admin or moderator privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-grandma-cream border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img 
                  src={logo} 
                  alt="Grandma's Kitchen" 
                  className="h-16 w-auto"
                />
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                  Admin Panel
                </Link>
                <Link to="/product-management" className="text-foreground font-medium">
                  Products
                </Link>
              </nav>
            </div>
            <Button variant="ghost" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">Product Management</h1>
          <p className="text-muted-foreground">
            Add and manage Amazon affiliate products for Grandma's Kitchen
          </p>
        </div>

        <Tabs defaultValue="add" className="space-y-6">
          <TabsList>
            <TabsTrigger value="add">Add Product</TabsTrigger>
            <TabsTrigger value="manage">Manage Products ({products.length})</TabsTrigger>
            <TabsTrigger value="update-links">Update Affiliate Links</TabsTrigger>
            <TabsTrigger value="categories">Manage Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
                <CardDescription>
                  Add Amazon products manually. Make sure to use your affiliate link with tag: grandmaskitch-21
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductForm onSuccess={fetchProducts} />
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>How to Get Amazon Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Method 1: Using SiteStripe</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Navigate to the product on Amazon</li>
                    <li>Use the SiteStripe toolbar at the top</li>
                    <li>Click "Get Link" and select "Full Link"</li>
                    <li>Your affiliate tag (grandmaskitch-21) will be automatically included</li>
                    <li>Paste the link and click "Fetch Details" to auto-fill most fields</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Method 2: Getting the Image</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><strong>Option A:</strong> Upload an image directly using the file upload button</li>
                    <li><strong>Option B:</strong> Right-click the Amazon product image → "Copy Image Address" → Paste the URL</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <CardTitle>All Products</CardTitle>
                    <CardDescription>
                      View and manage all products in the database
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <Button
                      onClick={handleBulkApprove}
                      variant="default"
                      disabled={!products.some(p => !p.approved)}
                    >
                      Approve All Unapproved ({products.filter(p => !p.approved).length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading products...</div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No products yet. Add your first product!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>ASIN</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              {product.image_url && (
                                <img 
                                  src={product.image_url} 
                                  alt={product.title}
                                  className="w-24 h-24 object-contain rounded"
                                />
                              )}
                            </TableCell>
                            <TableCell className="font-medium max-w-xs">
                              {product.title}
                            </TableCell>
                            <TableCell>
                              <div dangerouslySetInnerHTML={{ __html: product.category?.join(', ') || '' }} />
                            </TableCell>
                            <TableCell>
                              {product.price ? `£${product.price.toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {product.asin || '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant={product.approved ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleToggleApproval(product.id, product.approved)}
                              >
                                {product.approved ? 'Approved' : 'Approve'}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setPreviewProduct(product)}
                                  title="Preview Product Card"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleGenerateFAB(product)}
                                  title="Generate FAB Table with AI"
                                >
                                  <Sparkles className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                >
                                  <a 
                                    href={product.amazon_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingProduct(product)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(product.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="update-links">
            <AffiliateLinkUpdater />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>
        </Tabs>

        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <ProductForm
                productId={editingProduct.id}
                initialData={{
                  title: editingProduct.title,
                  short_description: editingProduct.short_description,
                  description: editingProduct.description,
                  images: editingProduct.images,
                  amazon_url: editingProduct.amazon_url,
                  category: editingProduct.category,
                  asin: editingProduct.asin,
                  brand: editingProduct.brand,
                  material: editingProduct.material,
                  colour: editingProduct.colour,
                  video_url: editingProduct.video_url,
                  approved: editingProduct.approved,
                }}
                onSuccess={handleEditSuccess}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!previewProduct} onOpenChange={(open) => !open && setPreviewProduct(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Product Card Preview</DialogTitle>
            </DialogHeader>
            {previewProduct && (
              <div className="bg-muted p-6 rounded-lg">
                <div className="max-w-sm mx-auto bg-background">
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="aspect-square overflow-hidden bg-muted">
                      {previewProduct.image_url && (
                        <img 
                          src={previewProduct.image_url} 
                          alt={previewProduct.title}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold line-clamp-2">{previewProduct.title}</h3>
                      {previewProduct.short_description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {previewProduct.short_description}
                        </p>
                      )}
                      {previewProduct.price && (
                        <p className="text-lg font-bold text-primary">
                          £{previewProduct.price.toFixed(2)}
                        </p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1" asChild>
                          <a href={previewProduct.amazon_url} target="_blank" rel="noopener noreferrer">
                            Buy on Amazon
                          </a>
                        </Button>
                        {previewProduct.video_url && (
                          <Button variant="outline" asChild>
                            <a href={previewProduct.video_url} target="_blank" rel="noopener noreferrer">
                              View Video
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ProductManagement;
