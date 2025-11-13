import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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

const RecipeModeration = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, isAdmin, isModerator, loading: roleLoading } = useUserRole(user?.id);
  const [pendingRecipes, setPendingRecipes] = useState<PendingRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && !roleLoading && user && role !== null && !isAdmin && !isModerator) {
      toast({
        title: 'Access Denied',
        description: 'Only staff members can access recipe moderation.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [user, isAdmin, isModerator, role, authLoading, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin || isModerator) {
      fetchPendingRecipes();
    }
  }, [isAdmin, isModerator]);

  const fetchPendingRecipes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_recipes')
      .select('*')
      .eq('visibility', 'pending_review')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending recipes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending recipes',
        variant: 'destructive',
      });
    } else {
      setPendingRecipes(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async (recipeId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('user_recipes')
      .update({ visibility: 'public' })
      .eq('id', recipeId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Recipe approved and published',
      });
      fetchPendingRecipes();
    }
    setLoading(false);
  };

  const handleReject = async (recipeId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('user_recipes')
      .update({ visibility: 'private' })
      .eq('id', recipeId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Recipe Rejected',
        description: 'Recipe has been set to private',
      });
      fetchPendingRecipes();
    }
    setLoading(false);
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAdmin && !isModerator) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-2 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Panel
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Recipe Moderation</h1>
          <p className="text-muted-foreground">Review and approve user-submitted recipes</p>
        </div>

        {loading && pendingRecipes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading pending recipes...
            </CardContent>
          </Card>
        ) : pendingRecipes.length === 0 ? (
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
      </div>
    </div>
  );
};

export default RecipeModeration;