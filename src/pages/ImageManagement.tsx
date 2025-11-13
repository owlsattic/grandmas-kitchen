import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Upload, ExternalLink, FileUp } from 'lucide-react';
import { recipes } from '@/data/recipes';
import chickenSoupImg from '@/assets/recipes/chicken-soup.jpg';
import cookiesImg from '@/assets/recipes/cookies.jpg';
import carrotJuiceImg from '@/assets/recipes/carrot-juice.jpg';
import lentilSoupImg from '@/assets/recipes/lentil-soup.jpg';
import applePieImg from '@/assets/recipes/apple-pie.jpg';
import gardenSaladImg from '@/assets/recipes/garden-salad.jpg';
import roastBeefDinnerImg from '@/assets/recipes/roast-beef-dinner.jpg';
import legOfLambImg from '@/assets/recipes/leg-of-lamb.jpg';
import roastPorkImg from '@/assets/recipes/roast-pork.jpg';
import roastChickenImg from '@/assets/recipes/roast-chicken.jpg';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ImageInfo {
  id: string;
  name: string;
  path: string;
  format: string;
  source: string;
  usedIn: string;
  productId?: string;
  isMainImage?: boolean;
  arrayIndex?: number;
}

interface UploadMapping {
  originalImage: ImageInfo;
  newFile: File | null;
}

const ImageManagement = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, role, loading: roleLoading } = useUserRole(user?.id);
  const [recipeImages, setRecipeImages] = useState<ImageInfo[]>([]);
  const [productImages, setProductImages] = useState<ImageInfo[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('recipes');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadMappings, setUploadMappings] = useState<UploadMapping[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCleanup, setShowCleanup] = useState(false);
  const [orphanedImages, setOrphanedImages] = useState<{ name: string; url: string; size: number }[]>([]);
  const [selectedOrphans, setSelectedOrphans] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showWebPConversion, setShowWebPConversion] = useState(false);
  const [jpgImages, setJpgImages] = useState<{ name: string; url: string; productId: string; isMainImage: boolean; arrayIndex?: number }[]>([]);
  const [selectedJpgs, setSelectedJpgs] = useState<Set<string>>(new Set());
  const [isConverting, setIsConverting] = useState(false);
  
  // Recipe WebP conversion state
  const [showRecipeWebPConversion, setShowRecipeWebPConversion] = useState(false);
  const [recipeJpgImages, setRecipeJpgImages] = useState<{ name: string; url: string; recipeId: string; arrayIndex: number }[]>([]);
  const [selectedRecipeJpgs, setSelectedRecipeJpgs] = useState<Set<string>>(new Set());
  const [isConvertingRecipes, setIsConvertingRecipes] = useState(false);
  
  // Recipe orphaned images state
  const [showRecipeCleanup, setShowRecipeCleanup] = useState(false);
  const [recipeOrphanedImages, setRecipeOrphanedImages] = useState<{ name: string; url: string; size: number }[]>([]);
  const [selectedRecipeOrphans, setSelectedRecipeOrphans] = useState<Set<string>>(new Set());

  useEffect(() => {
    // First check if user is logged in
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    // Only redirect if we're done loading AND confirmed the user is NOT an admin
    if (!authLoading && !roleLoading && user && role !== null && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
    }
  }, [user, authLoading, isAdmin, role, roleLoading, navigate]);

  useEffect(() => {
    // Only fetch images if user is confirmed admin
    if (!isAdmin || roleLoading || authLoading) {
      return;
    }

    const fetchAllImages = async () => {
      const recipeImageList: ImageInfo[] = [];
      const productImageList: ImageInfo[] = [];
      
      // Collect all images from recipes
      recipes.forEach(recipe => {
        recipe.images.forEach((imgPath, index) => {
          const fileName = imgPath.split('/').pop() || '';
          const format = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
          
          recipeImageList.push({
            id: `recipe-${recipe.id}-${index}`,
            name: fileName,
            path: imgPath,
            format,
            source: 'Recipe (Static)',
            usedIn: recipe.title
          });
        });
      });

      // Fetch and collect all images from products database
      const { data: products, error } = await supabase
        .from('products')
        .select('id, title, image_url, images');

      if (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load product images');
      } else if (products) {
        products.forEach(product => {
          // Add main image_url if exists
          if (product.image_url) {
            const fileName = product.image_url.split('/').pop() || '';
            const format = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
            
            productImageList.push({
              id: `product-${product.id}-main`,
              name: fileName,
              path: product.image_url,
              format,
              source: 'Product (Database)',
              usedIn: product.title,
              productId: product.id,
              isMainImage: true
            });
          }

          // Add images array if exists
          if (product.images && Array.isArray(product.images)) {
            product.images.forEach((imgPath, index) => {
              const fileName = imgPath.split('/').pop() || '';
              const format = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
              
              productImageList.push({
                id: `product-${product.id}-${index}`,
                name: fileName,
                path: imgPath,
                format,
                source: 'Product (Database)',
                usedIn: product.title,
                productId: product.id,
                isMainImage: false,
                arrayIndex: index
              });
            });
          }
        });
      }

      setRecipeImages(recipeImageList);
      setProductImages(productImageList);
    };

    fetchAllImages();
  }, [isAdmin, roleLoading, authLoading]);

  const handleSelectImage = (id: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedImages(newSelected);
  };


  const handleDownloadImage = async (image: ImageInfo) => {
    try {
      const response = await fetch(image.path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Downloaded ${image.name}`);
    } catch (error) {
      toast.error('Failed to download image');
      console.error(error);
    }
  };

  const handleBatchDownload = async () => {
    const allImages = [...recipeImages, ...productImages];
    const selectedImageList = allImages.filter(img => selectedImages.has(img.id));
    
    for (const image of selectedImageList) {
      await handleDownloadImage(image);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    toast.success(`Downloaded ${selectedImageList.length} images`);
  };

  const handleUploadReplacement = (imageId: string) => {
    setUploadingFor(imageId);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/webp,image/jpeg,image/jpg,image/png';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Here you would implement the actual file upload logic
      // For now, we'll just show a success message
      toast.success(`Ready to replace image. File selected: ${file.name}`);
      toast.info('Note: Update the image path in src/data/recipes.ts to use the new file');
      
      setUploadingFor(null);
    };
    
    input.click();
  };

  const openConversionTool = () => {
    window.open('https://squoosh.app/', '_blank');
    toast.info('Squoosh.app opened - drag & drop your images to convert to WebP');
  };

  const handleStartBulkUpload = () => {
    const currentImages = activeTab === 'recipes' ? recipeImages : productImages;
    const mappings: UploadMapping[] = currentImages.map(img => ({
      originalImage: img,
      newFile: null
    }));
    setUploadMappings(mappings);
    setShowBulkUpload(true);
  };

  const handleFileSelect = (index: number, file: File | null) => {
    const newMappings = [...uploadMappings];
    newMappings[index].newFile = file;
    setUploadMappings(newMappings);
  };

  const handleBulkUploadExecute = async () => {
    if (activeTab === 'recipes') {
      toast.error('Recipe images require manual file replacement in src/assets/recipes/');
      return;
    }

    const filledMappings = uploadMappings.filter(m => m.newFile !== null);
    if (filledMappings.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const mapping of filledMappings) {
        if (!mapping.newFile || !mapping.originalImage.productId) continue;

        try {
          // Upload to Supabase storage
          const fileExt = mapping.newFile.name.split('.').pop();
          const fileName = `${mapping.originalImage.productId}-${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, mapping.newFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          // Update database
          if (mapping.originalImage.isMainImage) {
            const { error: updateError } = await supabase
              .from('products')
              .update({ image_url: publicUrl })
              .eq('id', mapping.originalImage.productId);

            if (updateError) throw updateError;
          } else {
            // Update images array
            const { data: product } = await supabase
              .from('products')
              .select('images')
              .eq('id', mapping.originalImage.productId)
              .single();

            if (product) {
              const newImages = [...(product.images || [])];
              if (mapping.originalImage.arrayIndex !== undefined) {
                newImages[mapping.originalImage.arrayIndex] = publicUrl;
              }

              const { error: updateError } = await supabase
                .from('products')
                .update({ images: newImages })
                .eq('id', mapping.originalImage.productId);

              if (updateError) throw updateError;
            }
          }

          successCount++;
        } catch (error) {
          console.error('Error uploading:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`✅ Upload Complete! Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''} and updated the database.`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} image${errorCount > 1 ? 's' : ''} failed to upload. Please try again.`);
      }
      
      setShowBulkUpload(false);
      setUploadMappings([]);
      
      // Refresh the image list
      window.location.reload();
    } finally {
      setIsUploading(false);
    }
  };

  const handleScanOrphanedImages = async () => {
    setIsScanning(true);
    setOrphanedImages([]);
    
    try {
      // Get all folders from storage bucket
      const { data: folders, error: listError } = await supabase.storage
        .from('product-images')
        .list('', {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (listError) throw listError;

      // Get all files from all folders
      const allFiles: { name: string; path: string; size: number }[] = [];
      
      for (const folder of folders || []) {
        if (folder.name === '.emptyFolderPlaceholder') continue;
        
        const { data: filesInFolder, error: folderError } = await supabase.storage
          .from('product-images')
          .list(folder.name, {
            limit: 1000,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (folderError) {
          console.error(`Error listing files in ${folder.name}:`, folderError);
          continue;
        }

        filesInFolder?.forEach(file => {
          if (file.name !== '.emptyFolderPlaceholder') {
            allFiles.push({
              name: file.name,
              path: `${folder.name}/${file.name}`,
              size: file.metadata?.size || 0
            });
          }
        });
      }

      // Get all referenced image URLs from database
      const { data: products, error: dbError } = await supabase
        .from('products')
        .select('image_url, images');

      if (dbError) throw dbError;

      // Build set of all referenced file paths
      const referencedPaths = new Set<string>();
      products?.forEach(product => {
        if (product.image_url) {
          // Extract path after /product-images/
          const match = product.image_url.match(/\/product-images\/(.+)$/);
          if (match) referencedPaths.add(match[1]);
        }
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach(imgUrl => {
            const match = imgUrl.match(/\/product-images\/(.+)$/);
            if (match) referencedPaths.add(match[1]);
          });
        }
      });

      // Find orphaned files
      const orphaned = allFiles
        .filter(file => !referencedPaths.has(file.path))
        .map(file => {
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(file.path);
          
          return {
            name: file.path,
            url: publicUrl,
            size: file.size
          };
        });

      setOrphanedImages(orphaned);
      
      if (orphaned.length === 0) {
        toast.success('No orphaned images found!');
      } else {
        toast.info(`Found ${orphaned.length} orphaned images`);
      }
    } catch (error) {
      console.error('Error scanning:', error);
      toast.error('Failed to scan for orphaned images');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDeleteOrphaned = async () => {
    if (selectedOrphans.size === 0) {
      toast.error('Please select images to delete');
      return;
    }

    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const filesToDelete = Array.from(selectedOrphans);
      
      for (const filePath of filesToDelete) {
        try {
          const { error } = await supabase.storage
            .from('product-images')
            .remove([filePath]); // Now using full path instead of just filename

          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error(`Error deleting ${filePath}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`✅ Cleanup Complete! Deleted ${successCount} orphaned image${successCount > 1 ? 's' : ''}.`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} image${errorCount > 1 ? 's' : ''} failed to delete. Please try again.`);
      }
      
      setSelectedOrphans(new Set());
      
      // Refresh orphaned images list
      handleScanOrphanedImages();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete images');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleScanRecipeOrphanedImages = async () => {
    setIsScanning(true);
    setRecipeOrphanedImages([]);
    
    try {
      // Get all files from recipe-images bucket
      const { data: files, error: listError } = await supabase.storage
        .from('recipe-images')
        .list('', {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (listError) throw listError;

      const allFiles: { name: string; path: string; size: number }[] = [];
      
      files?.forEach(file => {
        if (file.name !== '.emptyFolderPlaceholder') {
          allFiles.push({
            name: file.name,
            path: file.name,
            size: file.metadata?.size || 0
          });
        }
      });

      // Get all referenced image URLs from database
      const { data: userRecipes, error: dbError } = await supabase
        .from('user_recipes')
        .select('images');

      if (dbError) throw dbError;

      // Build set of all referenced file paths
      const referencedPaths = new Set<string>();
      userRecipes?.forEach(recipe => {
        if (recipe.images && Array.isArray(recipe.images)) {
          recipe.images.forEach(imgUrl => {
            const match = imgUrl.match(/\/recipe-images\/(.+)$/);
            if (match) referencedPaths.add(match[1]);
          });
        }
      });

      // Find orphaned files (exclude static recipe images)
      const orphaned = allFiles
        .filter(file => !referencedPaths.has(file.path))
        .filter(file => !file.path.startsWith('static-')) // Exclude static recipe images
        .map(file => {
          const { data: { publicUrl } } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(file.path);
          
          return {
            name: file.path,
            url: publicUrl,
            size: file.size
          };
        });

      setRecipeOrphanedImages(orphaned);
      
      if (orphaned.length === 0) {
        toast.success('No orphaned recipe images found!');
      } else {
        toast.info(`Found ${orphaned.length} orphaned recipe images`);
      }
    } catch (error) {
      console.error('Error scanning:', error);
      toast.error('Failed to scan for orphaned recipe images');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDeleteRecipeOrphaned = async () => {
    if (selectedRecipeOrphans.size === 0) {
      toast.error('Please select images to delete');
      return;
    }

    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const filesToDelete = Array.from(selectedRecipeOrphans);
      
      for (const filePath of filesToDelete) {
        try {
          const { error } = await supabase.storage
            .from('recipe-images')
            .remove([filePath]);

          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error(`Error deleting ${filePath}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`✅ Cleanup Complete! Deleted ${successCount} orphaned recipe image${successCount > 1 ? 's' : ''}.`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} image${errorCount > 1 ? 's' : ''} failed to delete. Please try again.`);
      }
      
      setSelectedRecipeOrphans(new Set());
      
      // Refresh orphaned images list
      handleScanRecipeOrphanedImages();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete recipe images');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleScanJpgImages = async () => {
    setIsScanning(true);
    setJpgImages([]);
    
    try {
      // Get all products from database
      const { data: products, error: dbError } = await supabase
        .from('products')
        .select('id, title, image_url, images');

      if (dbError) throw dbError;

      const jpgList: { name: string; url: string; productId: string; isMainImage: boolean; arrayIndex?: number }[] = [];

      products?.forEach(product => {
        // Check main image_url
        if (product.image_url && (product.image_url.endsWith('.jpg') || product.image_url.endsWith('.jpeg'))) {
          const fileName = product.image_url.split('/').pop() || '';
          jpgList.push({
            name: fileName,
            url: product.image_url,
            productId: product.id,
            isMainImage: true
          });
        }

        // Check images array
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach((imgUrl, index) => {
            if (imgUrl.endsWith('.jpg') || imgUrl.endsWith('.jpeg')) {
              const fileName = imgUrl.split('/').pop() || '';
              jpgList.push({
                name: fileName,
                url: imgUrl,
                productId: product.id,
                isMainImage: false,
                arrayIndex: index
              });
            }
          });
        }
      });

      setJpgImages(jpgList);
      
      if (jpgList.length === 0) {
        toast.success('No JPG images found! All images are already WebP.');
      } else {
        toast.info(`Found ${jpgList.length} JPG images to convert`);
      }
    } catch (error) {
      console.error('Error scanning:', error);
      toast.error('Failed to scan for JPG images');
    } finally {
      setIsScanning(false);
    }
  };

  const convertImageToWebP = async (imageUrl: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create WebP blob'));
            }
          },
          'image/webp',
          0.9 // Quality setting
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  };

  const handleConvertToWebP = async () => {
    if (selectedJpgs.size === 0) {
      toast.error('Please select images to convert');
      return;
    }

    setIsConverting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const imagesToConvert = jpgImages.filter(img => selectedJpgs.has(img.name));
      
      for (const image of imagesToConvert) {
        try {
          // Extract the storage path from the full URL
          const urlParts = image.url.split('/storage/v1/object/public/product-images/');
          if (urlParts.length !== 2) {
            throw new Error('Invalid image URL format');
          }
          const storagePath = urlParts[1];

          // Convert the image to WebP
          const webpBlob = await convertImageToWebP(image.url);
          
          // Create new filename with .webp extension
          const webpFileName = image.name.replace(/\.(jpg|jpeg)$/i, '.webp');
          const webpPath = storagePath.replace(/\.(jpg|jpeg)$/i, '.webp');

          // Upload the WebP image to storage (overwrite if exists)
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(webpPath, webpBlob, {
              contentType: 'image/webp',
              upsert: true
            });

          if (uploadError) throw uploadError;

          // Get the public URL for the new WebP image
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(webpPath);

          // Update database with new WebP URL
          if (image.isMainImage) {
            const { error: updateError } = await supabase
              .from('products')
              .update({ image_url: publicUrl })
              .eq('id', image.productId);

            if (updateError) throw updateError;
          } else {
            // Update images array
            const { data: product } = await supabase
              .from('products')
              .select('images')
              .eq('id', image.productId)
              .single();

            if (product) {
              const newImages = [...(product.images || [])];
              if (image.arrayIndex !== undefined) {
                newImages[image.arrayIndex] = publicUrl;
              }

              const { error: updateError } = await supabase
                .from('products')
                .update({ images: newImages })
                .eq('id', image.productId);

              if (updateError) throw updateError;
            }
          }

          // Delete the old JPG file after successful conversion
          const { error: deleteError } = await supabase.storage
            .from('product-images')
            .remove([storagePath]);

          if (deleteError) {
            console.warn('Failed to delete old JPG:', deleteError);
          }

          successCount++;
        } catch (error) {
          console.error(`Error converting ${image.name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`✅ Conversion Complete! Converted ${successCount} image${successCount > 1 ? 's' : ''} to WebP.`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} image${errorCount > 1 ? 's' : ''} failed to convert.`);
      }
      
      setSelectedJpgs(new Set());
      
      // Refresh JPG images list
      handleScanJpgImages();
      
      // Refresh the main image list
      window.location.reload();
    } catch (error) {
      console.error('Error converting:', error);
      toast.error('Failed to convert images');
    } finally {
      setIsConverting(false);
    }
  };

  const handleMigrateStaticImages = async () => {
    setIsScanning(true);
    const migratedImages: { name: string; oldPath: string; newUrl: string }[] = [];
    
    try {
      toast.info("Starting migration - Uploading static images to storage...");
      
      // Fetch each static image and upload to Supabase
      const imageFiles = [
        { name: 'chicken-soup.jpg', importPath: chickenSoupImg },
        { name: 'cookies.jpg', importPath: cookiesImg },
        { name: 'carrot-juice.jpg', importPath: carrotJuiceImg },
        { name: 'lentil-soup.jpg', importPath: lentilSoupImg },
        { name: 'apple-pie.jpg', importPath: applePieImg },
        { name: 'garden-salad.jpg', importPath: gardenSaladImg },
        { name: 'roast-beef-dinner.jpg', importPath: roastBeefDinnerImg },
        { name: 'leg-of-lamb.jpg', importPath: legOfLambImg },
        { name: 'roast-pork.jpg', importPath: roastPorkImg },
        { name: 'roast-chicken.jpg', importPath: roastChickenImg },
      ];
      
      for (const { name, importPath } of imageFiles) {
        try {
          // Fetch the image blob from the imported path
          const response = await fetch(importPath);
          const blob = await response.blob();
          
          // Upload to Supabase storage
          const fileName = `static-${Date.now()}-${name}`;
          const { data, error } = await supabase.storage
            .from('recipe-images')
            .upload(fileName, blob, {
              contentType: blob.type,
              cacheControl: '3600',
              upsert: false
            });
          
          if (error) throw error;
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(fileName);
          
          migratedImages.push({
            name,
            oldPath: importPath,
            newUrl: publicUrl
          });
          
          console.log(`Migrated ${name} -> ${publicUrl}`);
        } catch (err) {
          console.error(`Failed to migrate ${name}:`, err);
        }
      }
      
      toast.success(`Migration complete - Uploaded ${migratedImages.length} images. Check console for URLs.`);
      
      // Log the new URLs for manual update of recipes.ts
      console.log('=== Migration Results ===');
      console.log('Copy these URLs to update src/data/recipes.ts:');
      migratedImages.forEach(img => {
        console.log(`${img.name}: "${img.newUrl}"`);
      });
      
    } catch (error) {
      console.error('Migration error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to migrate images");
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanRecipeJpgImages = async () => {
    setIsScanning(true);
    setRecipeJpgImages([]);
    
    try {
      const jpgList: { name: string; url: string; recipeId: string; arrayIndex: number }[] = [];

      // 1. Scan storage bucket for JPG files
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('recipe-images')
        .list();

      if (storageError) throw storageError;

      storageFiles?.forEach(file => {
        if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) {
          const { data: { publicUrl } } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(file.name);
          
          jpgList.push({
            name: file.name,
            url: publicUrl,
            recipeId: 'storage', // Mark as storage file
            arrayIndex: -1 // Not in array
          });
        }
      });

      // 2. Get all user recipes from database
      const { data: userRecipes, error: dbError } = await supabase
        .from('user_recipes')
        .select('id, title, images');

      if (dbError) throw dbError;

      userRecipes?.forEach(recipe => {
        // Check images array
        if (recipe.images && Array.isArray(recipe.images)) {
          recipe.images.forEach((imgUrl, index) => {
            if (imgUrl.endsWith('.jpg') || imgUrl.endsWith('.jpeg')) {
              const fileName = imgUrl.split('/').pop() || '';
              jpgList.push({
                name: fileName,
                url: imgUrl,
                recipeId: recipe.id,
                arrayIndex: index
              });
            }
          });
        }
      });

      setRecipeJpgImages(jpgList);
      
      if (jpgList.length === 0) {
        toast.success('No JPG images found! All recipe images are already WebP.');
      } else {
        toast.info(`Found ${jpgList.length} JPG recipe images to convert`);
      }
    } catch (error) {
      console.error('Error scanning:', error);
      toast.error('Failed to scan for JPG recipe images');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConvertRecipesToWebP = async () => {
    if (selectedRecipeJpgs.size === 0) {
      toast.error('Please select images to convert');
      return;
    }

    setIsConvertingRecipes(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const imagesToConvert = recipeJpgImages.filter(img => selectedRecipeJpgs.has(img.name));
      
      for (const image of imagesToConvert) {
        try {
          // Extract the storage path from the full URL
          const urlParts = image.url.split('/storage/v1/object/public/recipe-images/');
          if (urlParts.length !== 2) {
            throw new Error('Invalid image URL format');
          }
          const storagePath = urlParts[1];

          // Convert the image to WebP
          const webpBlob = await convertImageToWebP(image.url);
          
          // Create new filename with .webp extension
          const webpFileName = image.name.replace(/\.(jpg|jpeg)$/i, '.webp');
          const webpPath = storagePath.replace(/\.(jpg|jpeg)$/i, '.webp');

          // Upload the WebP image to storage (overwrite if exists)
          const { error: uploadError } = await supabase.storage
            .from('recipe-images')
            .upload(webpPath, webpBlob, {
              contentType: 'image/webp',
              upsert: true
            });

          if (uploadError) throw uploadError;

          // Get the public URL for the new WebP image
          const { data: { publicUrl } } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(webpPath);

          // Update database only if this is a user recipe (not a storage file)
          if (image.recipeId !== 'storage' && image.arrayIndex >= 0) {
            const { data: recipe } = await supabase
              .from('user_recipes')
              .select('images')
              .eq('id', image.recipeId)
              .single();

            if (recipe) {
              const newImages = [...(recipe.images || [])];
              newImages[image.arrayIndex] = publicUrl;

              const { error: updateError } = await supabase
                .from('user_recipes')
                .update({ images: newImages })
                .eq('id', image.recipeId);

              if (updateError) throw updateError;
            }
          } else {
            // For storage files, log the new URL for manual update
            console.log(`Converted ${image.name} -> ${publicUrl}`);
          }

          // Delete the old JPG file after successful conversion
          const { error: deleteError } = await supabase.storage
            .from('recipe-images')
            .remove([storagePath]);

          if (deleteError) {
            console.warn('Failed to delete old JPG:', deleteError);
          }

          successCount++;
        } catch (error) {
          console.error(`Error converting ${image.name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`✅ Conversion Complete! Converted ${successCount} recipe image${successCount > 1 ? 's' : ''} to WebP.`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} recipe image${errorCount > 1 ? 's' : ''} failed to convert.`);
      }
      
      setSelectedRecipeJpgs(new Set());
      
      // Refresh JPG images list
      handleScanRecipeJpgImages();
      
      // Refresh the main image list
      window.location.reload();
    } catch (error) {
      console.error('Error converting:', error);
      toast.error('Failed to convert images');
    } finally {
      setIsConvertingRecipes(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const selectedCount = selectedImages.size;
  // Filter out WebP images from display (they're converted and stored in database but hidden from admin view)
  const currentImages = activeTab === 'recipes' 
    ? recipeImages.filter(img => img.format !== 'WEBP')
    : productImages.filter(img => img.format !== 'WEBP');

  const renderImageTable = (images: ImageInfo[]) => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={images.length > 0 && images.every(img => selectedImages.has(img.id))}
                onCheckedChange={() => {
                  const allSelected = images.every(img => selectedImages.has(img.id));
                  const newSelected = new Set(selectedImages);
                  images.forEach(img => {
                    if (allSelected) {
                      newSelected.delete(img.id);
                    } else {
                      newSelected.add(img.id);
                    }
                  });
                  setSelectedImages(newSelected);
                }}
              />
            </TableHead>
            <TableHead>Preview</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Used In</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.map((image) => (
            <TableRow key={image.id}>
              <TableCell>
                <Checkbox
                  checked={selectedImages.has(image.id)}
                  onCheckedChange={() => handleSelectImage(image.id)}
                />
              </TableCell>
              <TableCell>
                <img
                  src={image.path}
                  alt={image.name}
                  className="w-16 h-16 object-cover rounded"
                />
              </TableCell>
              <TableCell className="font-medium">{image.name}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  image.format === 'WEBP' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                }`}>
                  {image.format}
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {image.usedIn}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadImage(image)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUploadReplacement(image.id)}
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Image Management</CardTitle>
            <CardDescription>
              Manage and convert images to WebP format for better performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <Button
                  onClick={handleBatchDownload}
                  disabled={selectedCount === 0}
                  variant="default"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Selected ({selectedCount})
                </Button>
                <p className="text-sm text-muted-foreground">
                  💡 Check the boxes next to images to select them before downloading
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open('/dev?file=src/data/recipes.ts', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  Edit Recipes File
                </Button>
                <Button
                  onClick={() => window.location.href = '/product-management'}
                  variant="outline"
                  size="sm"
                >
                  Manage Products
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Recipe Images</CardTitle>
                  <CardDescription>
                    Static files in <code className="bg-background px-1 rounded">src/assets/recipes/</code> and database storage bucket <code className="bg-background px-1 rounded">recipe-images</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderImageTable(recipeImages.filter(img => img.format !== 'WEBP'))}
                  <p className="text-sm text-muted-foreground">
                    <strong>To update static images:</strong> Replace files and update imports in <code className="bg-background px-1 rounded">src/data/recipes.ts</code>
                  </p>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-4 mt-4">
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleMigrateStaticImages}
                        disabled={isScanning}
                        variant="outline"
                      >
                        {isScanning ? 'Migrating...' : 'Migrate Static Images to Storage'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowRecipeWebPConversion(true);
                          handleScanRecipeJpgImages();
                        }}
                        variant="default"
                        className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                      >
                        Convert Recipe JPG to WebP
                      </Button>
                      <Button
                        onClick={() => {
                          setShowRecipeCleanup(true);
                          handleScanRecipeOrphanedImages();
                        }}
                        variant="outline"
                      >
                        Clean Up Orphaned Recipe Images
                      </Button>
                    </div>

                    {showRecipeWebPConversion && (
                      <Card className="border-2 border-green-500">
                        <CardHeader>
                          <CardTitle>Convert Recipe JPG to WebP</CardTitle>
                          <CardDescription>
                            Automatically convert recipe JPG images to WebP format. Database will be updated automatically.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {isScanning ? (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">Scanning for JPG images...</p>
                              </div>
                            ) : recipeJpgImages.length === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">No JPG images found! All recipe images are already in WebP format.</p>
                                <Button
                                  onClick={() => setShowRecipeWebPConversion(false)}
                                  variant="outline"
                                  className="mt-4"
                                >
                                  Close
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                                  <span className="text-sm font-medium">
                                    Found {recipeJpgImages.length} JPG recipe images to convert
                                  </span>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => {
                                        const allSelected = recipeJpgImages.every(img => selectedRecipeJpgs.has(img.name));
                                        if (allSelected) {
                                          setSelectedRecipeJpgs(new Set());
                                        } else {
                                          setSelectedRecipeJpgs(new Set(recipeJpgImages.map(img => img.name)));
                                        }
                                      }}
                                      variant="outline"
                                      size="sm"
                                    >
                                      {recipeJpgImages.every(img => selectedRecipeJpgs.has(img.name)) ? 'Deselect All' : 'Select All'}
                                    </Button>
                                  </div>
                                </div>

                                <div className="max-h-96 overflow-y-auto border rounded-lg">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-12">
                                          <Checkbox
                                            checked={recipeJpgImages.length > 0 && recipeJpgImages.every(img => selectedRecipeJpgs.has(img.name))}
                                            onCheckedChange={() => {
                                              const allSelected = recipeJpgImages.every(img => selectedRecipeJpgs.has(img.name));
                                              if (allSelected) {
                                                setSelectedRecipeJpgs(new Set());
                                              } else {
                                                setSelectedRecipeJpgs(new Set(recipeJpgImages.map(img => img.name)));
                                              }
                                            }}
                                          />
                                        </TableHead>
                                        <TableHead>Preview</TableHead>
                                        <TableHead>File Name</TableHead>
                                        <TableHead>Position</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {recipeJpgImages.map((image, idx) => (
                                        <TableRow key={`${image.recipeId}-${image.name}-${idx}`}>
                                          <TableCell>
                                            <Checkbox
                                              checked={selectedRecipeJpgs.has(image.name)}
                                              onCheckedChange={() => {
                                                const newSelected = new Set(selectedRecipeJpgs);
                                                if (newSelected.has(image.name)) {
                                                  newSelected.delete(image.name);
                                                } else {
                                                  newSelected.add(image.name);
                                                }
                                                setSelectedRecipeJpgs(newSelected);
                                              }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <img
                                              src={image.url}
                                              alt={image.name}
                                              className="w-16 h-16 object-cover rounded"
                                            />
                                          </TableCell>
                                          <TableCell className="font-mono text-sm">{image.name}</TableCell>
                                          <TableCell className="text-sm text-muted-foreground">
                                            Image #{image.arrayIndex + 1}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>

                                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                  <h4 className="font-semibold text-sm mb-2">How it works:</h4>
                                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                    <li>Select the JPG recipe images you want to convert</li>
                                    <li>Click "Convert Selected Images" button</li>
                                    <li>The system will automatically convert each image to WebP format</li>
                                    <li>Database references will be updated automatically</li>
                                    <li>Old JPG files will be deleted from storage automatically</li>
                                  </ol>
                                </div>

                                <div className="flex gap-3">
                                  <Button
                                    onClick={handleConvertRecipesToWebP}
                                    disabled={isConvertingRecipes || selectedRecipeJpgs.size === 0}
                                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                                  >
                                    {isConvertingRecipes ? 'Converting...' : `Convert Selected Images (${selectedRecipeJpgs.size})`}
                                  </Button>
                                  <Button
                                    onClick={handleScanRecipeJpgImages}
                                    disabled={isConvertingRecipes || isScanning}
                                    variant="outline"
                                  >
                                    Rescan
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setShowRecipeWebPConversion(false);
                                      setRecipeJpgImages([]);
                                      setSelectedRecipeJpgs(new Set());
                                    }}
                                    variant="outline"
                                    disabled={isConvertingRecipes}
                                  >
                                    Close
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {showRecipeCleanup && (
                      <Card className="border-2 border-amber-500">
                        <CardHeader>
                          <CardTitle>Clean Up Orphaned Recipe Images</CardTitle>
                          <CardDescription>
                            Remove images from storage that are no longer referenced in the database
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {isScanning ? (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">Scanning storage bucket...</p>
                              </div>
                            ) : recipeOrphanedImages.length === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">No orphaned recipe images found</p>
                                <Button
                                  onClick={() => setShowRecipeCleanup(false)}
                                  variant="outline"
                                  className="mt-4"
                                >
                                  Close
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                                  <span className="text-sm font-medium">
                                    Found {recipeOrphanedImages.length} orphaned images ({(recipeOrphanedImages.reduce((sum, img) => sum + img.size, 0) / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => {
                                        const allSelected = recipeOrphanedImages.every(img => selectedRecipeOrphans.has(img.name));
                                        if (allSelected) {
                                          setSelectedRecipeOrphans(new Set());
                                        } else {
                                          setSelectedRecipeOrphans(new Set(recipeOrphanedImages.map(img => img.name)));
                                        }
                                      }}
                                      variant="outline"
                                      size="sm"
                                    >
                                      {recipeOrphanedImages.every(img => selectedRecipeOrphans.has(img.name)) ? 'Deselect All' : 'Select All'}
                                    </Button>
                                  </div>
                                </div>

                                <div className="max-h-96 overflow-y-auto border rounded-lg">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-12">
                                          <Checkbox
                                            checked={recipeOrphanedImages.length > 0 && recipeOrphanedImages.every(img => selectedRecipeOrphans.has(img.name))}
                                            onCheckedChange={() => {
                                              const allSelected = recipeOrphanedImages.every(img => selectedRecipeOrphans.has(img.name));
                                              if (allSelected) {
                                                setSelectedRecipeOrphans(new Set());
                                              } else {
                                                setSelectedRecipeOrphans(new Set(recipeOrphanedImages.map(img => img.name)));
                                              }
                                            }}
                                          />
                                        </TableHead>
                                        <TableHead>Preview</TableHead>
                                        <TableHead>File Name</TableHead>
                                        <TableHead>Size</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {recipeOrphanedImages.map((image) => (
                                        <TableRow key={image.name}>
                                          <TableCell>
                                            <Checkbox
                                              checked={selectedRecipeOrphans.has(image.name)}
                                              onCheckedChange={(checked) => {
                                                const newSelection = new Set(selectedRecipeOrphans);
                                                if (checked) {
                                                  newSelection.add(image.name);
                                                } else {
                                                  newSelection.delete(image.name);
                                                }
                                                setSelectedRecipeOrphans(newSelection);
                                              }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <img
                                              src={image.url}
                                              alt={image.name}
                                              className="w-16 h-16 object-cover rounded"
                                            />
                                          </TableCell>
                                          <TableCell className="font-mono text-xs">{image.name}</TableCell>
                                          <TableCell>{(image.size / 1024).toFixed(1)} KB</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>

                                <div className="flex gap-3">
                                  <Button
                                    onClick={handleDeleteRecipeOrphaned}
                                    disabled={isDeleting || selectedRecipeOrphans.size === 0}
                                    variant="destructive"
                                  >
                                    {isDeleting ? 'Deleting...' : `Delete Selected (${selectedRecipeOrphans.size})`}
                                  </Button>
                                  <Button
                                    onClick={handleScanRecipeOrphanedImages}
                                    disabled={isDeleting || isScanning}
                                    variant="outline"
                                  >
                                    Rescan
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setShowRecipeCleanup(false);
                                      setRecipeOrphanedImages([]);
                                      setSelectedRecipeOrphans(new Set());
                                    }}
                                    variant="outline"
                                    disabled={isDeleting}
                                  >
                                    Close
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Product Images</CardTitle>
                  <CardDescription>
                    Database storage bucket <code className="bg-background px-1 rounded">product-images</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderImageTable(productImages.filter(img => img.format !== 'WEBP'))}
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-4 mt-4">
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleStartBulkUpload}
                        variant="default"
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Bulk Upload WebP Images
                      </Button>

                      <Button
                        onClick={() => {
                          setShowCleanup(true);
                          handleScanOrphanedImages();
                        }}
                        variant="outline"
                      >
                        Clean Up Orphaned Images
                      </Button>

                      <Button
                        onClick={() => {
                          setShowWebPConversion(true);
                          handleScanJpgImages();
                        }}
                        variant="default"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        Convert JPG to WebP
                      </Button>
                    </div>

                    {showBulkUpload && (
                      <Card className="border-2 border-primary">
                        <CardHeader>
                          <CardTitle>Bulk Upload WebP Images</CardTitle>
                          <CardDescription>
                            Select WebP files to replace existing product images. Files will be uploaded to storage and database records updated automatically.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="max-h-96 overflow-y-auto border rounded-lg">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Original Image</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>New WebP File</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {uploadMappings.map((mapping, index) => (
                                    <TableRow key={mapping.originalImage.id}>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <img
                                            src={mapping.originalImage.path}
                                            alt={mapping.originalImage.name}
                                            className="w-12 h-12 object-cover rounded"
                                          />
                                          <span className="text-sm">{mapping.originalImage.name}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {mapping.originalImage.usedIn}
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="file"
                                          accept=".webp"
                                          onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                                          className="text-sm"
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            <div className="flex gap-3">
                              <Button
                                onClick={handleBulkUploadExecute}
                                disabled={isUploading || uploadMappings.every(m => !m.newFile)}
                              >
                                {isUploading ? 'Uploading...' : 'Upload & Update Database'}
                              </Button>
                              <Button
                                onClick={() => {
                                  setShowBulkUpload(false);
                                  setUploadMappings([]);
                                }}
                                variant="outline"
                                disabled={isUploading}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {showCleanup && (
                      <Card className="border-2 border-amber-500">
                        <CardHeader>
                          <CardTitle>Clean Up Orphaned Images</CardTitle>
                          <CardDescription>
                            Remove images from storage that are no longer referenced in the database
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {isScanning ? (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">Scanning storage bucket...</p>
                              </div>
                            ) : orphanedImages.length === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">No orphaned images found</p>
                                <Button
                                  onClick={() => setShowCleanup(false)}
                                  variant="outline"
                                  className="mt-4"
                                >
                                  Close
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                                  <span className="text-sm font-medium">
                                    Found {orphanedImages.length} orphaned images ({(orphanedImages.reduce((sum, img) => sum + img.size, 0) / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => {
                                        const allSelected = orphanedImages.every(img => selectedOrphans.has(img.name));
                                        if (allSelected) {
                                          setSelectedOrphans(new Set());
                                        } else {
                                          setSelectedOrphans(new Set(orphanedImages.map(img => img.name)));
                                        }
                                      }}
                                      variant="outline"
                                      size="sm"
                                    >
                                      {orphanedImages.every(img => selectedOrphans.has(img.name)) ? 'Deselect All' : 'Select All'}
                                    </Button>
                                  </div>
                                </div>

                                <div className="max-h-96 overflow-y-auto border rounded-lg">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-12">
                                          <Checkbox
                                            checked={orphanedImages.length > 0 && orphanedImages.every(img => selectedOrphans.has(img.name))}
                                            onCheckedChange={() => {
                                              const allSelected = orphanedImages.every(img => selectedOrphans.has(img.name));
                                              if (allSelected) {
                                                setSelectedOrphans(new Set());
                                              } else {
                                                setSelectedOrphans(new Set(orphanedImages.map(img => img.name)));
                                              }
                                            }}
                                          />
                                        </TableHead>
                                        <TableHead>Preview</TableHead>
                                        <TableHead>File Name</TableHead>
                                        <TableHead>Size</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {orphanedImages.map((image) => (
                                        <TableRow key={image.name}>
                                          <TableCell>
                                            <Checkbox
                                              checked={selectedOrphans.has(image.name)}
                                              onCheckedChange={() => {
                                                const newSelected = new Set(selectedOrphans);
                                                if (newSelected.has(image.name)) {
                                                  newSelected.delete(image.name);
                                                } else {
                                                  newSelected.add(image.name);
                                                }
                                                setSelectedOrphans(newSelected);
                                              }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <img
                                              src={image.url}
                                              alt={image.name}
                                              className="w-16 h-16 object-cover rounded"
                                            />
                                          </TableCell>
                                          <TableCell className="font-mono text-sm">{image.name}</TableCell>
                                          <TableCell className="text-sm text-muted-foreground">
                                            {(image.size / 1024).toFixed(2)} KB
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>

                                <div className="flex gap-3">
                                  <Button
                                    onClick={handleDeleteOrphaned}
                                    disabled={isDeleting || selectedOrphans.size === 0}
                                    variant="destructive"
                                  >
                                    {isDeleting ? 'Deleting...' : `Delete Selected (${selectedOrphans.size})`}
                                  </Button>
                                  <Button
                                    onClick={handleScanOrphanedImages}
                                    disabled={isDeleting || isScanning}
                                    variant="outline"
                                  >
                                    Rescan
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setShowCleanup(false);
                                      setOrphanedImages([]);
                                      setSelectedOrphans(new Set());
                                    }}
                                    variant="outline"
                                    disabled={isDeleting}
                                  >
                                    Close
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {showWebPConversion && (
                      <Card className="border-2 border-blue-500">
                        <CardHeader>
                          <CardTitle>Convert JPG to WebP</CardTitle>
                          <CardDescription>
                            Automatically convert JPG images to WebP format using the edge function. Database will be updated automatically.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {isScanning ? (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">Scanning for JPG images...</p>
                              </div>
                            ) : jpgImages.length === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">No JPG images found! All product images are already in WebP format.</p>
                                <Button
                                  onClick={() => setShowWebPConversion(false)}
                                  variant="outline"
                                  className="mt-4"
                                >
                                  Close
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                                  <span className="text-sm font-medium">
                                    Found {jpgImages.length} JPG images to convert
                                  </span>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => {
                                        const allSelected = jpgImages.every(img => selectedJpgs.has(img.name));
                                        if (allSelected) {
                                          setSelectedJpgs(new Set());
                                        } else {
                                          setSelectedJpgs(new Set(jpgImages.map(img => img.name)));
                                        }
                                      }}
                                      variant="outline"
                                      size="sm"
                                    >
                                      {jpgImages.every(img => selectedJpgs.has(img.name)) ? 'Deselect All' : 'Select All'}
                                    </Button>
                                  </div>
                                </div>

                                <div className="max-h-96 overflow-y-auto border rounded-lg">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-12">
                                          <Checkbox
                                            checked={jpgImages.length > 0 && jpgImages.every(img => selectedJpgs.has(img.name))}
                                            onCheckedChange={() => {
                                              const allSelected = jpgImages.every(img => selectedJpgs.has(img.name));
                                              if (allSelected) {
                                                setSelectedJpgs(new Set());
                                              } else {
                                                setSelectedJpgs(new Set(jpgImages.map(img => img.name)));
                                              }
                                            }}
                                          />
                                        </TableHead>
                                        <TableHead>Preview</TableHead>
                                        <TableHead>File Name</TableHead>
                                        <TableHead>Type</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {jpgImages.map((image) => (
                                        <TableRow key={`${image.productId}-${image.name}`}>
                                          <TableCell>
                                            <Checkbox
                                              checked={selectedJpgs.has(image.name)}
                                              onCheckedChange={() => {
                                                const newSelected = new Set(selectedJpgs);
                                                if (newSelected.has(image.name)) {
                                                  newSelected.delete(image.name);
                                                } else {
                                                  newSelected.add(image.name);
                                                }
                                                setSelectedJpgs(newSelected);
                                              }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <img
                                              src={image.url}
                                              alt={image.name}
                                              className="w-16 h-16 object-cover rounded"
                                            />
                                          </TableCell>
                                          <TableCell className="font-mono text-sm">{image.name}</TableCell>
                                          <TableCell className="text-sm text-muted-foreground">
                                            {image.isMainImage ? 'Main Image' : `Gallery #${(image.arrayIndex || 0) + 1}`}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                  <h4 className="font-semibold text-sm mb-2">How it works:</h4>
                                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                    <li>Select the JPG images you want to convert</li>
                                    <li>Click "Convert Selected Images" button</li>
                                    <li>The system will automatically convert each image to WebP format</li>
                                    <li>Database references will be updated automatically</li>
                                    <li>Old JPG files will remain in storage (you can clean them up using "Clean Up Orphaned Images")</li>
                                  </ol>
                                </div>

                                <div className="flex gap-3">
                                  <Button
                                    onClick={handleConvertToWebP}
                                    disabled={isConverting || selectedJpgs.size === 0}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                  >
                                    {isConverting ? 'Converting...' : `Convert Selected Images (${selectedJpgs.size})`}
                                  </Button>
                                  <Button
                                    onClick={handleScanJpgImages}
                                    disabled={isConverting || isScanning}
                                    variant="outline"
                                  >
                                    Rescan
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setShowWebPConversion(false);
                                      setJpgImages([]);
                                      setSelectedJpgs(new Set());
                                    }}
                                    variant="outline"
                                    disabled={isConverting}
                                  >
                                    Close
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">How to Convert Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Option 1: Batch Convert with Sharp CLI (Recommended for 194+ images)</h4>
                  <div className="bg-muted p-3 rounded-md mb-3">
                    <p className="font-semibold text-xs mb-2">Step-by-step Terminal Commands:</p>
                    <ol className="list-decimal list-inside space-y-3 text-xs ml-2">
                      <li>
                        <span className="font-medium">Install Sharp CLI (only needed once):</span>
                        <br /><code className="bg-background px-2 py-1 rounded block mt-1">npm i -g sharp-cli</code>
                      </li>
                      <li>
                        <span className="font-medium">Navigate to your images folder:</span>
                        <br /><code className="bg-background px-2 py-1 rounded block mt-1">cd /Users/garypickett/Desktop/images-to-convert</code>
                      </li>
                      <li>
                        <span className="font-medium">Create output folder:</span>
                        <br /><code className="bg-background px-2 py-1 rounded block mt-1">mkdir webp</code>
                      </li>
                      <li>
                        <span className="font-medium">Convert all images to WebP:</span>
                        <br /><code className="bg-background px-2 py-1 rounded block mt-1">sharp -i "*.{'{jpg,jpeg,png}'}" -o webp -f webp</code>
                        <span className="text-muted-foreground text-xs block mt-1">Converted files will be in the "webp" folder</span>
                      </li>
                    </ol>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    ✅ Sharp CLI is more reliable and actively maintained than Squoosh CLI
                  </p>
                  <a 
                    href="https://www.npmjs.com/package/sharp-cli" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                  >
                    View Sharp CLI Documentation <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Option 2: Manual Convert with Squoosh Desktop App (For smaller batches)</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Check the boxes next to images you want to convert</li>
                    <li>Click "Download Selected" to download them</li>
                    <li>Open your Squoosh desktop app</li>
                    <li>Drag and drop the downloaded images into Squoosh</li>
                    <li>Select WebP format and adjust quality (recommended: 80-90%)</li>
                    <li>Download the converted WebP files</li>
                    <li>Use the "Bulk Upload WebP Images" button below to replace images</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 If you don't have Squoosh desktop app, you can download it from the GitHub releases page
                  </p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageManagement;
