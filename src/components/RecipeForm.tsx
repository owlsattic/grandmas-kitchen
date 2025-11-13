import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Plus, Upload, Loader2, Sparkles, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { RecipeCard } from './RecipeCard';

const recipeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  category: z.string().min(1, 'Category is required'),
  country: z.string().min(2, 'Country is required').max(50),
  time: z.number().min(1, 'Time must be at least 1 minute').max(999, 'Time must be less than 1000 minutes'),
  servings: z.number().min(1, 'Servings must be at least 1').max(100, 'Servings must be less than 100'),
  ingredients: z.array(z.string().min(1)).min(1, 'At least one ingredient is required'),
  instructions: z.array(z.string().min(1)).min(1, 'At least one instruction is required'),
  calories: z.number().optional(),
  protein: z.string().optional(),
  carbs: z.string().optional(),
  fat: z.string().optional(),
});

type RecipeFormData = z.infer<typeof recipeSchema>;

interface RecipeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export const RecipeForm = ({ onSuccess, onCancel, initialData }: RecipeFormProps) => {
  const { categories } = useCategories();
  const [ingredients, setIngredients] = useState<string[]>(initialData?.ingredients || ['']);
  const [instructions, setInstructions] = useState<string[]>(initialData?.instructions || ['']);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(initialData?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRewritingForKids, setIsRewritingForKids] = useState(false);
  const [visibility, setVisibility] = useState<'private' | 'public'>(initialData?.visibility === 'public' || initialData?.visibility === 'pending_review' ? 'public' : 'private');
  const [authorName, setAuthorName] = useState(initialData?.author_display_name || '');
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      country: initialData?.country || '',
      time: initialData?.time || 30,
      servings: initialData?.servings || 4,
      ingredients: initialData?.ingredients || [''],
      instructions: initialData?.instructions || [''],
      calories: initialData?.nutrition?.calories || undefined,
      protein: initialData?.nutrition?.protein || '',
      carbs: initialData?.nutrition?.carbs || '',
      fat: initialData?.nutrition?.fat || '',
    }
  });

  const formValues = watch();
  const category = watch('category');

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
      setValue('ingredients', newIngredients.filter(ing => ing.trim() !== ''));
    }
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
    setValue('ingredients', newIngredients.filter(ing => ing.trim() !== ''));
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      const newInstructions = instructions.filter((_, i) => i !== index);
      setInstructions(newInstructions);
      setValue('instructions', newInstructions.filter(inst => inst.trim() !== ''));
    }
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
    setValue('instructions', newInstructions.filter(inst => inst.trim() !== ''));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (imagePreviews.length + files.length > 12) {
      toast({
        title: 'Error',
        description: 'Maximum 12 images allowed per recipe',
        variant: 'destructive',
      });
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: `${file.name} is too large. Image size must be less than 5MB`,
          variant: 'destructive',
        });
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        toast({
          title: 'Error',
          description: `${file.name} is not supported. Only JPG, PNG, and WebP images are allowed`,
          variant: 'destructive',
        });
        return;
      }
    }

    setImageFiles([...imageFiles, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset the input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSearchImages = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a search query',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-pexels-images', {
        body: { query: searchQuery, perPage: 12 },
      });

      if (error) throw error;

      if (data?.images) {
        setSearchResults(data.images);
      }
    } catch (error) {
      console.error('Error searching images:', error);
      toast({
        title: 'Error',
        description: 'Failed to search images. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchedImage = (imageUrl: string) => {
    if (imagePreviews.length >= 12) {
      toast({
        title: 'Error',
        description: 'Maximum 12 images allowed per recipe',
        variant: 'destructive',
      });
      return;
    }

    setImagePreviews(prev => [...prev, imageUrl]);
    setShowImageSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    
    toast({
      title: 'Success',
      description: 'Image added to your recipe',
    });
  };

  const handleMakeKidFriendly = async () => {
    // Filter out empty items
    const validIngredients = ingredients.filter(ing => ing.trim() !== '');
    const validInstructions = instructions.filter(inst => inst.trim() !== '');

    if (validIngredients.length === 0 || validInstructions.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add some ingredients and instructions first',
        variant: 'destructive',
      });
      return;
    }

    setIsRewritingForKids(true);

    try {
      const { data, error } = await supabase.functions.invoke('kid-friendly-recipe', {
        body: {
          ingredients: validIngredients,
          instructions: validInstructions,
        },
      });

      if (error) throw error;

      if (data?.ingredients && data?.instructions) {
        setIngredients(data.ingredients);
        setInstructions(data.instructions);
        setValue('ingredients', data.ingredients);
        setValue('instructions', data.instructions);

        toast({
          title: 'Success! 🎉',
          description: 'Recipe rewritten in a kid-friendly way with fun icons!',
        });
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Error rewriting recipe:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to rewrite recipe',
        variant: 'destructive',
      });
    } finally {
      setIsRewritingForKids(false);
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    // Keep existing images from initialData that are still in previews
    if (initialData?.images) {
      uploadedUrls.push(...initialData.images.filter((url: string) => 
        imagePreviews.includes(url)
      ));
    }

    // Add Pexels/external URLs that are in previews but not from file uploads
    imagePreviews.forEach(preview => {
      // Check if it's a Pexels URL or other external URL (not a data URL or already added)
      if ((preview.startsWith('http') || preview.startsWith('https')) && 
          !uploadedUrls.includes(preview)) {
        uploadedUrls.push(preview);
      }
    });

    // Upload new file uploads
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const preview = imagePreviews[i];
      
      // Skip if this preview is not a data URL (meaning it's already a URL)
      if (!preview || !preview.startsWith('data:')) continue;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload ${file.name}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const onSubmit = async (data: RecipeFormData) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const imageUrls = await uploadImages();

      const nutrition = (data.calories || data.protein || data.carbs || data.fat) ? {
        calories: data.calories || 0,
        protein: data.protein || '',
        carbs: data.carbs || '',
        fat: data.fat || '',
      } : null;

      const recipeData = {
        title: data.title,
        description: data.description,
        category: data.category,
        country: data.country,
        time: data.time,
        servings: data.servings,
        ingredients: data.ingredients,
        instructions: data.instructions,
        nutrition,
        images: imageUrls,
        user_id: user.id,
        visibility: (visibility === 'public' ? 'pending_review' : 'private') as 'pending_review' | 'private' | 'public',
        author_display_name: authorName || null,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('user_recipes')
          .update(recipeData)
          .eq('id', initialData.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Recipe updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('user_recipes')
          .insert([recipeData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Recipe created successfully',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save recipe',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-serif font-semibold">Basic Information</h3>

          <div className="space-y-2">
            <Label htmlFor="title">Recipe Title *</Label>
            <Input id="title" {...register('title')} placeholder="Grandma's Chicken Soup" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" {...register('description')} placeholder="A healing bowl of comfort..." rows={3} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {categories.filter(cat => cat !== 'All').map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input id="country" {...register('country')} placeholder="USA" />
              {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">Time (minutes) *</Label>
              <Input id="time" type="number" {...register('time', { valueAsNumber: true })} />
              {errors.time && <p className="text-sm text-destructive">{errors.time.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings">Servings *</Label>
              <Input id="servings" type="number" {...register('servings', { valueAsNumber: true })} />
              {errors.servings && <p className="text-sm text-destructive">{errors.servings.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif font-semibold">Ingredients *</h3>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={handleMakeKidFriendly}
                disabled={isRewritingForKids}
              >
                {isRewritingForKids ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Rewriting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    Make Kid-Friendly
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={ingredient}
                onChange={(e) => updateIngredient(index, e.target.value)}
                placeholder={`Ingredient ${index + 1}`}
              />
              {ingredients.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          {errors.ingredients && <p className="text-sm text-destructive">{errors.ingredients.message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif font-semibold">Instructions *</h3>
            <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
              <Plus className="w-4 h-4 mr-1" />
              Add Step
            </Button>
          </div>
          {instructions.map((instruction, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                {index + 1}
              </div>
              <Input
                value={instruction}
                onChange={(e) => updateInstruction(index, e.target.value)}
                placeholder={`Step ${index + 1}`}
              />
              {instructions.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeInstruction(index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          {errors.instructions && <p className="text-sm text-destructive">{errors.instructions.message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-serif font-semibold">Nutrition (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input id="calories" type="number" {...register('calories', { valueAsNumber: true })} placeholder="245" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein</Label>
              <Input id="protein" {...register('protein')} placeholder="22g" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs</Label>
              <Input id="carbs" {...register('carbs')} placeholder="18g" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Fat</Label>
              <Input id="fat" {...register('fat')} placeholder="9g" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-serif font-semibold">Recipe Images (Up to 12)</h3>
          <div className="space-y-2">
            <Label htmlFor="images">Upload Images (JPG, PNG, WebP - Max 5MB each)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="images"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleImageChange}
                className="cursor-pointer"
                multiple
                disabled={imagePreviews.length >= 12}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={() => document.getElementById('images')?.click()}
                disabled={imagePreviews.length >= 12}
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowImageSearch(true)}
                disabled={imagePreviews.length >= 12}
              >
                <Search className="w-4 h-4 mr-2" />
                Search Images
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {imagePreviews.length}/12 images uploaded. Add multiple images to show preparation steps, cooking stages, and results.
            </p>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="relative w-full h-32 rounded-lg overflow-hidden">
                      <img src={preview} alt={`Recipe preview ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <p className="text-xs text-center mt-1 text-muted-foreground">Image {index + 1}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showImageSearch} onOpenChange={setShowImageSearch}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search Royalty-Free Images</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for food images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchImages()}
              />
              <Button onClick={handleSearchImages} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {searchResults.map((image) => (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer rounded-lg overflow-hidden border hover:border-primary transition-colors"
                    onClick={() => selectSearchedImage(image.url)}
                  >
                    <img
                      src={image.thumbnail}
                      alt={image.alt}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" size="sm">
                        Select Image
                      </Button>
                    </div>
                    <p className="text-xs text-center p-2 text-muted-foreground">
                      Photo by {image.photographer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-serif font-semibold">Privacy & Author Settings</h3>
          
          <div className="space-y-2">
            <Label htmlFor="authorName">Author Display Name (Optional)</Label>
            <Input 
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name or alias (leave blank for Anonymous)"
            />
            <p className="text-sm text-muted-foreground">
              This is the name that will be shown with your recipe. Leave blank to remain anonymous.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Recipe Visibility</Label>
            <RadioGroup value={visibility} onValueChange={(value: any) => setVisibility(value)}>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="private" id="private" />
                <div className="flex-1">
                  <Label htmlFor="private" className="font-normal cursor-pointer">
                    Private
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Only you can see this recipe
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="public" id="public" />
                <div className="flex-1">
                  <Label htmlFor="public" className="font-normal cursor-pointer">
                    Public
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Submit for moderation. If approved by our team, your recipe will be visible to all users.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Recipe Preview */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-serif font-semibold">Recipe Card Preview</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This is how your recipe will appear on the recipes page
          </p>
          <div className="max-w-sm">
            <RecipeCard 
              recipe={{
                id: initialData?.id || 'preview',
                title: formValues.title || 'Recipe Title',
                description: formValues.description || 'Recipe description...',
                category: formValues.category || 'Main Course',
                country: formValues.country || 'USA',
                time: formValues.time || 30,
                servings: formValues.servings || 4,
                ingredients: ingredients.filter(i => i.trim()),
                instructions: instructions.filter(i => i.trim()),
                images: imagePreviews.length > 0 ? imagePreviews : undefined,
                image: imagePreviews[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
                nutrition: (formValues.calories || formValues.protein || formValues.carbs || formValues.fat) ? {
                  calories: formValues.calories || 0,
                  protein: formValues.protein || '',
                  carbs: formValues.carbs || '',
                  fat: formValues.fat || '',
                } : undefined,
                altText: `${formValues.title || 'Recipe'} - ${formValues.category || 'Recipe'} from Grandma's Kitchen`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData ? 'Update Recipe' : 'Create Recipe'}
        </Button>
      </div>
    </form>
  );
};