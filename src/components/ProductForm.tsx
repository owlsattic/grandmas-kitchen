import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
}

const productSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(300, 'Title must be less than 300 characters'),
  short_description: z.string()
    .min(20, 'Short description must be at least 20 characters')
    .max(160, 'Short description must be less than 160 characters'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(3000, 'Description must be less than 3000 characters'),
  amazon_url: z.string().url('Must be a valid Amazon URL').refine(
    (url) => url.includes('amazon.') && url.includes('tag=grandmaskitch-21'),
    'Must be a full Amazon SiteStripe link containing tag=grandmaskitch-21'
  ),
  category: z.array(z.string()).min(1, 'At least one category is required'),
  asin: z.string().optional(),
  brand: z.string().min(2, 'Brand is required'),
  material: z.string().optional(),
  colour: z.string().optional(),
  video_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  approved: z.boolean().default(false),
  fulfillment_by: z.enum(['amazon', 'grandmas_kitchen']).default('amazon'),
});

// Relaxed schema for drafts - makes all fields optional
const draftSchema = z.object({
  title: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  amazon_url: z.string().optional(),
  category: z.array(z.string()).optional(),
  asin: z.string().optional(),
  brand: z.string().optional(),
  material: z.string().optional(),
  colour: z.string().optional(),
  video_url: z.string().optional(),
  approved: z.boolean().default(false),
  fulfillment_by: z.enum(['amazon', 'grandmas_kitchen']).default('amazon'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSuccess?: () => void;
  productId?: string;
  initialData?: {
    title: string;
    short_description: string | null;
    description: string | null;
    images: string[] | null;
    amazon_url: string;
    category: string[];
    asin: string | null;
    brand: string | null;
    material: string | null;
    colour: string | null;
    video_url?: string | null;
    approved?: boolean | null;
    fulfillment_by?: string | null;
  };
}

export const ProductForm = ({ onSuccess, productId, initialData }: ProductFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialData?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [rawProductText, setRawProductText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReformatting, setIsReformatting] = useState(false);
  const [isFetchingAmazon, setIsFetchingAmazon] = useState(false);
  const [isSuggestingCategories, setIsSuggestingCategories] = useState(false);
  const { toast } = useToast();

  const totalSteps = 5;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('level', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    } else {
      setCategories(data || []);
    }
    setIsLoadingCategories(false);
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: initialData?.title || '',
      short_description: initialData?.short_description || '',
      description: initialData?.description || '',
      amazon_url: initialData?.amazon_url || '',
      category: initialData?.category || [],
      asin: initialData?.asin || '',
      brand: initialData?.brand || '',
      material: initialData?.material || '',
      colour: initialData?.colour || '',
      video_url: initialData?.video_url || '',
      approved: initialData?.approved || false,
      fulfillment_by: (initialData?.fulfillment_by as 'amazon' | 'grandmas_kitchen') || 'amazon',
    },
  });

  // Auto-extract ASIN when Amazon URL changes
  const extractASIN = (url: string): string => {
    try {
      // Check if it's already just an ASIN
      if (/^[A-Z0-9]{10}$/i.test(url.trim())) return url.trim().toUpperCase();
      
      const urlObj = new URL(url);
      const dpMatch = urlObj.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
      const productMatch = urlObj.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);
      const asinParam = urlObj.searchParams.get('asin');
      
      return (dpMatch?.[1] || productMatch?.[1] || asinParam || '').toUpperCase();
    } catch {
      return '';
    }
  };

  // Watch amazon_url and auto-extract ASIN
  const amazonUrl = form.watch('amazon_url');
  useEffect(() => {
    if (amazonUrl) {
      const extractedAsin = extractASIN(amazonUrl);
      if (extractedAsin) {
        form.setValue('asin', extractedAsin);
      }
    }
  }, [amazonUrl]);



  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 12) {
      toast({
        title: 'Error',
        description: `You can only upload up to 12 images. Currently: ${uploadedImages.length}`,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    const newImageUrls: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Error',
            description: `${file.name} is not an image file`,
            variant: 'destructive',
          });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'Error',
            description: `${file.name} must be less than 5MB`,
            variant: 'destructive',
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newImageUrls.push(publicUrl);
      }

      if (newImageUrls.length > 0) {
        setUploadedImages([...uploadedImages, ...newImageUrls]);
        toast({
          title: 'Success',
          description: `${newImageUrls.length} image(s) uploaded successfully`,
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload images',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...uploadedImages];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    setUploadedImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const analyzeReadability = (text: string) => {
    if (!text) return { hasLongParagraphs: false, longCount: 0 };
    
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    const longParagraphs = paragraphs.filter(p => {
      const sentences = p.split(/[.!?]+/).filter(s => s.trim().length > 0);
      return sentences.length > 3;
    });
    
    return {
      hasLongParagraphs: longParagraphs.length > 0,
      longCount: longParagraphs.length
    };
  };

  const handleFetchAmazonData = async () => {
    const amazonUrl = form.getValues('amazon_url');
    
    console.log('handleFetchAmazonData called with URL:', amazonUrl);
    
    if (!amazonUrl?.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an Amazon URL first',
        variant: 'destructive',
      });
      return;
    }

    setIsFetchingAmazon(true);
    try {
      console.log('Calling fetch-amazon-product edge function...');
      const { data, error } = await supabase.functions.invoke('fetch-amazon-product', {
        body: { url: amazonUrl }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data.error) {
        console.error('Data error:', data.error);
        throw new Error(data.error);
      }

      console.log('Extracted data from Amazon:', {
        asin: data.asin,
        brand: data.brand,
        material: data.material,
        colour: data.colour,
        video_url: data.video_url
      });

      // Populate fields from Amazon data with explicit logging
      if (data.asin) {
        console.log('Setting ASIN:', data.asin);
        form.setValue('asin', data.asin);
      }
      if (data.brand) {
        console.log('Setting brand:', data.brand);
        form.setValue('brand', data.brand);
      }
      if (data.material) {
        console.log('Setting material:', data.material);
        form.setValue('material', data.material);
      }
      if (data.colour) {
        console.log('Setting colour:', data.colour);
        form.setValue('colour', data.colour);
      }
      if (data.video_url) {
        console.log('Setting video_url:', data.video_url);
        form.setValue('video_url', data.video_url);
      }

      // Build raw text for AI generation including all fetched data
      const amazonData = `
Title: ${data.title || ''}
Brand: ${data.brand || 'Not specified'}
ASIN: ${data.asin || 'Not specified'}
Material: ${data.material || 'Not specified'}
Colour: ${data.colour || 'Not specified'}
Category: ${data.category || 'Not specified'}
Description: ${data.description || ''}
Rating: ${data.rating || 'Not specified'}
      `.trim();

      setRawProductText(amazonData);

      console.log('All fields set successfully');
      toast({
        title: 'Success',
        description: `Fetched: Brand: ${data.brand || 'N/A'}, Material: ${data.material || 'N/A'}, Colour: ${data.colour || 'N/A'}`,
      });
    } catch (error) {
      console.error('Error in handleFetchAmazonData:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch Amazon data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingAmazon(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!rawProductText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter product information to generate content',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Calling generate-product-content with rawText:', rawProductText.substring(0, 200));
      
      const { data, error } = await supabase.functions.invoke('generate-product-content', {
        body: { rawText: rawProductText }
      });

      console.log('AI Content Generator response:', data);

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Auto-populate form fields with AI-generated content
      form.setValue('title', data.title);
      form.setValue('short_description', data.short_description);
      form.setValue('description', data.long_description);
      
      // Auto-populate extracted metadata fields if present
      if (data.brand) {
        console.log('Setting brand from AI:', data.brand);
        form.setValue('brand', data.brand);
      }
      if (data.asin) {
        console.log('Setting ASIN from AI:', data.asin);
        form.setValue('asin', data.asin);
      }
      if (data.material) {
        console.log('Setting material from AI:', data.material);
        form.setValue('material', data.material);
      }
      if (data.colour) {
        console.log('Setting colour from AI:', data.colour);
        form.setValue('colour', data.colour);
      }

      const extractedFields = [];
      if (data.brand) extractedFields.push(`Brand: ${data.brand}`);
      if (data.material) extractedFields.push(`Material: ${data.material}`);
      if (data.colour) extractedFields.push(`Colour: ${data.colour}`);

      toast({
        title: 'Success',
        description: extractedFields.length > 0 
          ? `Content generated and extracted: ${extractedFields.join(', ')}`
          : 'AI-generated content has been added to the form',
      });

      // Clear the raw text after successful generation
      setRawProductText('');
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReformatDescription = async () => {
    const currentDescription = form.getValues('description');
    
    if (!currentDescription?.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a description to reformat',
        variant: 'destructive',
      });
      return;
    }

    setIsReformatting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reformat-description', {
        body: { description: currentDescription }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      form.setValue('description', data.reformatted_description);

      toast({
        title: 'Success',
        description: 'Description reformatted for better readability',
      });
    } catch (error) {
      console.error('Error reformatting description:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reformat description. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsReformatting(false);
    }
  };

  const handleSuggestCategories = async () => {
    const formData = form.getValues();
    
    if (!formData.title || !formData.description) {
      toast({
        title: "Missing information",
        description: "Please generate content first before suggesting categories",
        variant: "destructive",
      });
      return;
    }

    setIsSuggestingCategories(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-categories', {
        body: { 
          productData: {
            title: formData.title,
            description: formData.description,
            brand: formData.brand,
            material: formData.material
          }
        }
      });

      if (error) throw error;

      if (data.categories) {
        // If there are new categories to create, inform the user
        if (data.newCategories && data.newCategories.length > 0) {
          toast({
            title: "New categories suggested",
            description: `AI suggested ${data.newCategories.length} new categories. They will be created when you save the product.`,
          });
        }

        // Set the suggested categories
        form.setValue("category", data.categories);
        
        toast({
          title: "Categories suggested",
          description: `AI selected ${data.categories.length} relevant categories for this product`,
        });
      }
    } catch (error) {
      console.error('Error suggesting categories:', error);
      toast({
        title: "Error",
        description: "Failed to suggest categories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSuggestingCategories(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      const formValues = form.getValues();
      await saveProduct(formValues, false);
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      await saveProduct(data, true);
    } catch (error) {
      console.error('Error submitting product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProduct = async (data: any, isDraft: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to manage products',
          variant: 'destructive',
        });
        return;
      }

      // Auto-extract ASIN if not provided
      const finalAsin = data.asin || (data.amazon_url ? extractASIN(data.amazon_url) : null);

      const productData = {
        title: data.title?.trim() || null,
        short_description: data.short_description?.trim() || null,
        description: data.description?.trim() || null,
        image_url: uploadedImages[0] || null,
        images: uploadedImages.length > 0 ? uploadedImages : null,
        amazon_url: data.amazon_url || null,
        category: data.category || [],
        asin: finalAsin || null,
        price: null,
        video_url: data.video_url?.trim() || null,
        brand: data.brand?.trim() || null,
        material: data.material?.trim() || null,
        colour: data.colour?.trim() || null,
        rating: null,
        approved: isDraft ? false : (data.approved || false),
        fulfillment_by: data.fulfillment_by || 'amazon',
      };

      if (productId) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId);

        if (error) throw error;

        toast({
          title: 'Success',
          description: isDraft ? 'Draft saved successfully' : 'Product updated successfully',
        });
      } else {
        const { error } = await supabase.from('products').insert({
          ...productData,
          created_by: user.id,
        });

        if (error) throw error;

        toast({
          title: 'Success',
          description: isDraft ? 'Draft saved successfully' : 'Product added successfully',
        });
      }

      form.reset();
      setUploadedImages([]);
      setCurrentStep(1);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: `Failed to ${productId ? 'update' : 'save'} product. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const titleLength = form.watch('title')?.length || 0;
  const shortDescLength = form.watch('short_description')?.length || 0;
  const descLength = form.watch('description')?.length || 0;

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof ProductFormData)[] = [];
    
    switch (step) {
      case 1:
        fieldsToValidate = ['amazon_url', 'title', 'brand'];
        break;
      case 2:
        fieldsToValidate = ['short_description', 'description'];
        break;
      case 3:
        fieldsToValidate = ['category'];
        break;
      case 4:
        // Images are optional
        return true;
      case 5:
        // Final review, all validated
        return true;
      default:
        return true;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Basic Info';
      case 2: return 'Description';
      case 3: return 'Categories';
      case 4: return 'Images';
      case 5: return 'Review';
      default: return '';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : step < currentStep
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step}
                  </div>
                  <span className={`text-xs mt-1 ${step === currentStep ? 'font-semibold' : ''}`}>
                    {getStepTitle(step)}
                  </span>
                </div>
                {step < 5 && (
                  <div
                    className={`h-1 flex-1 ${
                      step < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Step 1: Basic Information</h3>
              <p className="text-sm text-muted-foreground">
                Enter the Amazon product link, title, and brand.
              </p>
            </div>

            {/* AI Content Generator */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-lg">AI Content Generator</h4>
                <Badge variant="secondary" className="ml-auto">SEO Optimised</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Paste raw product information and let AI generate unique, SEO-optimised content in UK English with proper spelling and formatting.
              </p>
              <div className="space-y-3">
                <Textarea
                  placeholder="Paste product details here (e.g., from Amazon listing, product specs, features, etc.)..."
                  value={rawProductText}
                  onChange={(e) => setRawProductText(e.target.value)}
                  rows={6}
                  className="resize-y"
                  disabled={isGenerating}
                />
                <Button
                  type="button"
                  onClick={handleGenerateContent}
                  disabled={isGenerating || !rawProductText.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Unique Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate SEO Content
                    </>
                  )}
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="amazon_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amazon Product Link *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://www.amazon.co.uk/dp/..." 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        const asin = extractASIN(e.target.value);
                        if (asin) form.setValue('asin', asin);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Paste the full Amazon product URL from SiteStripe (must contain tag=grandmaskitch-21)
                  </FormDescription>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFetchAmazonData}
                    disabled={isFetchingAmazon || !form.watch('amazon_url')}
                    className="w-full mt-2"
                  >
                    {isFetchingAmazon ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fetching Amazon Data...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Fetch from Amazon
                      </>
                    )}
                  </Button>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="asin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ASIN (Auto-detected)</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className="bg-muted" />
                  </FormControl>
                  <FormDescription>
                    Amazon Standard Identification Number - automatically extracted from URL
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the product title from Amazon..." {...field} />
                  </FormControl>
                  <FormDescription className="flex justify-between">
                    <span>Copy the product title exactly as it appears on Amazon</span>
                    <span className={titleLength < 10 || titleLength > 300 ? 'text-destructive' : ''}>
                      {titleLength}/300
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SavvyStor" {...field} />
                  </FormControl>
                  <FormDescription>
                    Product brand or manufacturer name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Step 2: Description & Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Step 2: Description & Details</h3>
              <p className="text-sm text-muted-foreground">
                Add product descriptions, material, and colour information.
              </p>
            </div>

            <FormField
              control={form.control}
              name="short_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief summary for product cards..."
                      {...field}
                      rows={3}
                      className="resize-y"
                    />
                  </FormControl>
                  <FormDescription className="flex justify-between">
                    <span>Short description shown on product cards (20-160 characters)</span>
                    <span className={shortDescLength < 20 || shortDescLength > 160 ? 'text-destructive' : ''}>
                      {shortDescLength}/160
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => {
                const readability = analyzeReadability(field.value);
                return (
                  <FormItem>
                    <FormLabel>Full Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the product's features, benefits, and specifications..."
                        {...field}
                        rows={8}
                        className="resize-y"
                      />
                    </FormControl>
                    <FormDescription className="flex justify-between">
                      <span>Full details from the "About this item" section on Amazon</span>
                      <span className={descLength < 20 || descLength > 3000 ? 'text-destructive' : ''}>
                        {descLength}/3000
                      </span>
                    </FormDescription>
                    {readability.hasLongParagraphs && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-2">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                          <div className="flex-1">
                            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                              Readability Warning
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                              {readability.longCount} paragraph{readability.longCount > 1 ? 's have' : ' has'} more than 3 sentences. 
                              Shorter paragraphs improve readability.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleReformatDescription}
                              disabled={isReformatting}
                              className="mt-2 bg-white dark:bg-gray-800 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            >
                              {isReformatting ? 'Reformatting...' : 'Reformat with AI'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="material"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Plastic, Stainless Steel" {...field} />
                  </FormControl>
                  <FormDescription>
                    Main material the product is made from
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="colour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colour (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Transparent, Black" {...field} />
                  </FormControl>
                  <FormDescription>
                    Product colour or finish
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Step 3: Categories */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Step 3: Product Categories</h3>
              <p className="text-sm text-muted-foreground">
                Select one or more categories that best describe this product.
              </p>
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel>Select Categories *</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSuggestCategories}
                      disabled={isSuggestingCategories || isLoadingCategories}
                      className="ml-auto"
                    >
                      {isSuggestingCategories ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          AI Suggesting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          AI Suggest Categories
                        </>
                      )}
                    </Button>
                  </div>
                  {isLoadingCategories ? (
                    <div className="flex items-center justify-center p-8 border rounded-md">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2 text-muted-foreground">Loading categories...</span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 p-4 border rounded-md max-h-96 overflow-y-auto">
                        {categories.map((category) => (
                          <FormItem
                            key={category.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                            style={{ paddingLeft: `${category.level * 1.5}rem` }}
                          >
                            <FormControl>
                              <Checkbox
                                checked={Array.isArray(field.value) && field.value.includes(category.name)}
                                onCheckedChange={(checked) => {
                                  const currentValue = Array.isArray(field.value) ? field.value : [];
                                  if (checked) {
                                    field.onChange([...currentValue, category.name]);
                                  } else {
                                    field.onChange(currentValue.filter((val) => val !== category.name));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {category.level > 0 && '└ '}
                              {category.name}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="text-sm font-medium">Selected:</span>
                          {field.value.map((cat) => (
                            <Badge key={cat} variant="secondary">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fulfillment_by"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/30">
                  <FormControl>
                    <Checkbox
                      checked={field.value === 'grandmas_kitchen'}
                      onCheckedChange={(checked) => {
                        field.onChange(checked ? 'grandmas_kitchen' : 'amazon');
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-semibold">
                      Fulfilled by Grandma's Kitchen
                    </FormLabel>
                    <FormDescription>
                      Check this if the product is shipped by Grandma's Kitchen (leave unchecked for Amazon fulfillment)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Step 4: Images */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Step 4: Product Images & Video (Optional)</h3>
              <p className="text-sm text-muted-foreground">
                Upload product images and add a video URL if available. The first image will be the main display image.
              </p>
            </div>

            <FormField
              control={form.control}
              name="video_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Video URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://www.youtube.com/watch?v=..." 
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add a YouTube or other video link showcasing the product
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {uploadedImages.map((url, index) => (
                    <div
                      key={url}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className="relative group cursor-move"
                    >
                      <img
                        src={url}
                        alt={`Product ${index + 1}`}
                        className="w-32 h-32 object-cover rounded-lg border-2"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <Badge className="absolute bottom-2 left-2">
                          Main Image
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <label htmlFor="product-images" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="lg"
                      disabled={isUploading || uploadedImages.length >= 12}
                      className="pointer-events-none"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          Choose files
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? (
                        <span>Uploading images...</span>
                      ) : (
                        <>
                          Upload up to 12 images (max 5MB each). Drag to reorder images.
                          {uploadedImages.length > 0 && <span className="font-semibold"> ({uploadedImages.length}/12)</span>}
                        </>
                      )}
                    </p>
                  </div>
                </label>
                <Input
                  id="product-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={isUploading || uploadedImages.length >= 12}
                  className="sr-only"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Step 5: Review & Submit</h3>
              <p className="text-sm text-muted-foreground">
                Review all product details before submitting.
              </p>
            </div>

            <div className="space-y-4 border rounded-lg p-6">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Title</h4>
                <p>{form.watch('title') || 'Not set'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Brand</h4>
                <p>{form.watch('brand') || 'Not set'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">ASIN</h4>
                <p>{form.watch('asin') || 'Not set'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Amazon URL</h4>
                <p className="text-xs break-all">{form.watch('amazon_url') || 'Not set'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Description</h4>
                <p className="text-sm line-clamp-3">{form.watch('description') || 'Not set'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Material</h4>
                <p>{form.watch('material') || 'Not specified'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Colour</h4>
                <p>{form.watch('colour') || 'Not specified'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {form.watch('category')?.map((cat) => (
                    <Badge key={cat} variant="secondary">{cat}</Badge>
                  )) || <span>None selected</span>}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Video URL</h4>
                <p className="text-xs break-all">{form.watch('video_url') || 'Not specified'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Images</h4>
                <p>{uploadedImages.length > 0 ? `${uploadedImages.length} image(s) uploaded` : 'No images uploaded'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Fulfillment</h4>
                <p>{form.watch('fulfillment_by') === 'grandmas_kitchen' ? 'Grandma\'s Kitchen' : 'Amazon'}</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="approved"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/30">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-semibold">
                      Approve product for display
                    </FormLabel>
                    <FormDescription>
                      Check this box to make the product visible in the shop immediately
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isLoading || isUploading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Draft
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {productId ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
};
