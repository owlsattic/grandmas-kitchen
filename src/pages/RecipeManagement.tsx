import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RecipeForm } from '@/components/RecipeForm';
import { QuickRecipeEntry } from '@/components/QuickRecipeEntry';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Sparkles, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UserRecipe {
  id: string;
  title: string;
  category: string;
  country: string;
  time: number;
  created_at: string;
}

interface PendingRecipe {
  id: string;
  title: string;
  description: string;
  category: string;
  country: string;
  time: number;
  servings: number;
  images: string[];
  author_display_name: string | null;
  created_at: string;
  user_id: string;
  ingredients: string[];
  instructions: string[];
}

const RecipeManagement = () => {
  console.log('🎯 RecipeManagement component mounting');
  const { user } = useAuth();
  const { isAdmin, role, loading: roleLoading } = useUserRole(user?.id);
  const [recipes, setRecipes] = useState<UserRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [deleteRecipeId, setDeleteRecipeId] = useState<string | null>(null);
  const [pendingRecipes, setPendingRecipes] = useState<PendingRecipe[]>([]);

  useEffect(() => {
    console.log('🔍 RecipeManagement: Auth state:', { 
      userId: user?.id, 
      roleLoading, 
      isAdmin, 
      role,
      isModerator: role === 'moderator' 
    });
    if (user && !roleLoading) {
      console.log('✅ RecipeManagement: Fetching recipes');
      fetchRecipes();
      fetchPendingRecipes();
    }
  }, [user, roleLoading, isAdmin, role]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_recipes')
        .select('id, title, category, country, time, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recipes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('visibility', 'pending_review')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingRecipes(data || []);
    } catch (error) {
      console.error('Error fetching pending recipes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending recipes',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from('user_recipes')
        .update({ visibility: 'public' })
        .eq('id', recipeId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Recipe approved and published',
      });
      
      fetchPendingRecipes();
      fetchRecipes();
    } catch (error) {
      console.error('Error approving recipe:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve recipe',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from('user_recipes')
        .update({ visibility: 'private' })
        .eq('id', recipeId);

      if (error) throw error;

      toast({
        title: 'Recipe Rejected',
        description: 'Recipe has been set to private',
      });
      
      fetchPendingRecipes();
    } catch (error) {
      console.error('Error rejecting recipe:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject recipe',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (recipeId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (error) throw error;
      setEditingRecipe(data);
      setShowForm(true);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recipe details',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteRecipeId) return;

    try {
      const { error } = await supabase
        .from('user_recipes')
        .delete()
        .eq('id', deleteRecipeId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Recipe deleted successfully',
      });

      fetchRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete recipe',
        variant: 'destructive',
      });
    } finally {
      setDeleteRecipeId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRecipe(null);
    fetchRecipes();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingRecipe(null);
  };

  const handleQuickEntrySuccess = (parsedData: any) => {
    setEditingRecipe(parsedData);
    setShowQuickEntry(false);
    setShowForm(true);
  };

  const handleQuickEntryCancel = () => {
    setShowQuickEntry(false);
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && role !== 'moderator') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (showQuickEntry) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <Button variant="ghost" size="sm" onClick={handleQuickEntryCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Recipe List
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-4xl font-serif font-bold mb-2">Quick Recipe Entry</h1>
          <p className="text-muted-foreground mb-8">Paste recipe content from anywhere and let AI organize it for you</p>
          <QuickRecipeEntry
            onSuccess={handleQuickEntrySuccess}
            onCancel={handleQuickEntryCancel}
          />
        </main>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <Button variant="ghost" size="sm" onClick={handleFormCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Recipe List
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-4xl font-serif font-bold mb-8">
            {editingRecipe ? 'Review & Edit Recipe' : 'Create New Recipe'}
          </h1>
          <RecipeForm
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            initialData={editingRecipe}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Panel
              </Link>
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => setShowQuickEntry(true)} variant="secondary">
                <Sparkles className="w-4 h-4 mr-2" />
                Quick Add with AI
              </Button>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Manual Entry
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">Recipe Management</h1>
          <p className="text-muted-foreground">Manage all user-created recipes</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Recipes ({recipes.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending Review ({pendingRecipes.length})
              {pendingRecipes.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingRecipes.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Recipes</CardTitle>
              </CardHeader>
              <CardContent>
                {recipes.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No recipes found</p>
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Recipe
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Time (min)</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipes.map((recipe) => (
                        <TableRow key={recipe.id}>
                          <TableCell className="font-medium">{recipe.title}</TableCell>
                          <TableCell>{recipe.category}</TableCell>
                          <TableCell>{recipe.country}</TableCell>
                          <TableCell>{recipe.time}</TableCell>
                          <TableCell>{new Date(recipe.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(recipe.id)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteRecipeId(recipe.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            {pendingRecipes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No recipes pending review. All caught up!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {pendingRecipes.map((recipe) => (
                  <Card key={recipe.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-2xl">{recipe.title}</CardTitle>
                          <CardDescription>
                            By {recipe.author_display_name || 'Anonymous'} • Submitted {new Date(recipe.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">Pending Review</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {recipe.images && recipe.images.length > 0 && (
                        <div className="w-full h-64 rounded-lg overflow-hidden">
                          <img 
                            src={recipe.images[0]} 
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-muted-foreground">{recipe.description}</p>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">Category:</span>
                          <p className="text-muted-foreground">{recipe.category}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Country:</span>
                          <p className="text-muted-foreground">{recipe.country}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Time:</span>
                          <p className="text-muted-foreground">{recipe.time} mins</p>
                        </div>
                        <div>
                          <span className="font-semibold">Servings:</span>
                          <p className="text-muted-foreground">{recipe.servings}</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">Ingredients</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {recipe.ingredients.map((ingredient, idx) => (
                            <li key={idx}>{ingredient}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Instructions</h4>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                          {recipe.instructions.map((instruction, idx) => (
                            <li key={idx}>{instruction}</li>
                          ))}
                        </ol>
                      </div>

                      <Separator />

                      <div className="flex gap-4 justify-end">
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(recipe.id)}
                          disabled={loading}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => handleApprove(recipe.id)}
                          disabled={loading}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve & Publish
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={deleteRecipeId !== null} onOpenChange={() => setDeleteRecipeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recipe? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RecipeManagement;