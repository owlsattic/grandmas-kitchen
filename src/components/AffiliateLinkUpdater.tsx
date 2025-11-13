import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, RefreshCw, Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InvalidProduct {
  id: string;
  title: string;
  amazon_url: string;
  image_url: string | null;
}

export const AffiliateLinkUpdater = () => {
  const [products, setProducts] = useState<InvalidProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchInvalidProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, title, amazon_url, image_url')
      .or("amazon_url.not.like.%tag=grandmaskitch-21%,amazon_url.like.%amzn.to%")
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInvalidProducts();
  }, []);

  const handleUpdateUrl = (productId: string, newUrl: string) => {
    setUpdates(prev => ({ ...prev, [productId]: newUrl }));
  };

  const handleSave = async (productId: string) => {
    const newUrl = updates[productId];
    
    if (!newUrl) {
      toast({
        title: 'Error',
        description: 'Please enter a new Amazon URL',
        variant: 'destructive',
      });
      return;
    }

    // Validate the new URL
    if (!newUrl.includes('amazon.') || !newUrl.includes('tag=grandmaskitch-21')) {
      toast({
        title: 'Invalid URL',
        description: 'URL must be a full Amazon link with tag=grandmaskitch-21',
        variant: 'destructive',
      });
      return;
    }

    setSaving(prev => ({ ...prev, [productId]: true }));

    const { error } = await supabase
      .from('products')
      .update({ amazon_url: newUrl })
      .eq('id', productId);

    setSaving(prev => ({ ...prev, [productId]: false }));

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product URL',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Product URL updated successfully',
      });
      // Remove from updates and refetch
      setUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[productId];
        return newUpdates;
      });
      fetchInvalidProducts();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Update Affiliate Links
            </CardTitle>
            <CardDescription>
              Products with short links or missing affiliate tags need to be updated
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvalidProducts}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading products...</div>
        ) : products.length === 0 ? (
          <Alert>
            <AlertDescription>
              ✅ All products have valid affiliate links! No updates needed.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="mb-4">
              <AlertDescription>
                <strong>{products.length} product{products.length !== 1 ? 's' : ''} need{products.length === 1 ? 's' : ''} updating.</strong> 
                <br />
                Please paste the full SiteStripe link (containing tag=grandmaskitch-21) for each product below.
              </AlertDescription>
            </Alert>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current URL</TableHead>
                    <TableHead>New Affiliate URL</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            <img 
                              src={product.image_url} 
                              alt={product.title}
                              className="w-16 h-16 object-contain rounded"
                            />
                          )}
                          <div className="max-w-xs">
                            <p className="font-medium text-sm line-clamp-2">{product.title}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate block">
                            {product.amazon_url}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a 
                              href={product.amazon_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              title="Open current link"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Paste full SiteStripe link here..."
                          value={updates[product.id] || ''}
                          onChange={(e) => handleUpdateUrl(product.id, e.target.value)}
                          className="min-w-[300px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleSave(product.id)}
                          disabled={!updates[product.id] || saving[product.id]}
                        >
                          {saving[product.id] ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Update
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
