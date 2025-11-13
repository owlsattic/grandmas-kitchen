import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Pencil, Plus, ChevronRight, ChevronDown, Move } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  children?: Category[];
  productCount?: number;
}

export const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [movingCategory, setMovingCategory] = useState<Category | null>(null);
  const [addingChildTo, setAddingChildTo] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState<string>('none');
  const [editCategoryName, setEditCategoryName] = useState('');
  const [moveToParent, setMoveToParent] = useState<string>('none');
  const [childCategoryName, setChildCategoryName] = useState('');
  const { toast } = useToast();

  const fetchCategories = async () => {
    setIsLoading(true);
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
      // Fetch product counts
      const { data: products } = await supabase
        .from('products')
        .select('category');

      // Count products per category name
      const productCounts = new Map<string, number>();
      products?.forEach((product) => {
        product.category?.forEach((catName: string) => {
          productCounts.set(catName, (productCounts.get(catName) || 0) + 1);
        });
      });

      // Build hierarchical structure
      const categoryMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      // First pass: create map
      data?.forEach((cat) => {
        categoryMap.set(cat.id, { 
          ...cat, 
          children: [],
          productCount: productCounts.get(cat.name) || 0
        });
      });

      // Second pass: build tree
      data?.forEach((cat) => {
        const category = categoryMap.get(cat.id)!;
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });

      setCategories(rootCategories);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    // Expand all categories by default
    supabase
      .from('categories')
      .select('id')
      .then(({ data }) => {
        if (data) {
          setExpandedCategories(new Set(data.map(c => c.id)));
        }
      });
  }, []);

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    const level = newCategoryParent && newCategoryParent !== 'none' ? (
      categories.find(c => c.id === newCategoryParent)?.level ?? 0
    ) + 1 : 0;

    if (level > 2) {
      toast({
        title: 'Error',
        description: 'Maximum category depth is 2 levels',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('categories')
      .insert({
        name: newCategoryName.trim(),
        parent_id: newCategoryParent && newCategoryParent !== 'none' ? newCategoryParent : null,
        level,
      });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Category created successfully',
      });
      setNewCategoryName('');
      setNewCategoryParent('none');
      fetchCategories();
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return;

    const { error } = await supabase
      .from('categories')
      .update({ name: editCategoryName.trim() })
      .eq('id', editingCategory.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Category updated successfully',
      });
      setEditingCategory(null);
      setEditCategoryName('');
      fetchCategories();
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure? This will delete all subcategories too.')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
      fetchCategories();
    }
  };

  const handleMoveCategory = async () => {
    if (!movingCategory) return;

    const allCats = getAllCategories(categories);
    const newParentId = moveToParent === 'none' ? null : moveToParent;
    const newLevel = newParentId ? (allCats.find(c => c.id === newParentId)?.level ?? 0) + 1 : 0;

    if (newLevel > 2) {
      toast({
        title: 'Error',
        description: 'Maximum category depth is 2 levels',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('categories')
      .update({ 
        parent_id: newParentId,
        level: newLevel
      })
      .eq('id', movingCategory.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Category moved successfully',
      });
      setMovingCategory(null);
      setMoveToParent('none');
      fetchCategories();
    }
  };

  const handleAddChild = async () => {
    if (!addingChildTo || !childCategoryName.trim()) return;

    const level = addingChildTo.level + 1;

    if (level > 2) {
      toast({
        title: 'Error',
        description: 'Maximum category depth is 2 levels',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('categories')
      .insert({
        name: childCategoryName.trim(),
        parent_id: addingChildTo.id,
        level,
      });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Child category created successfully',
      });
      setAddingChildTo(null);
      setChildCategoryName('');
      fetchCategories();
      // Expand parent to show new child
      setExpandedCategories(prev => new Set([...prev, addingChildTo.id]));
    }
  };

  const getAllCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    const traverse = (categories: Category[]) => {
      categories.forEach((cat) => {
        result.push(cat);
        if (cat.children && cat.children.length > 0) {
          traverse(cat.children);
        }
      });
    };
    traverse(cats);
    return result;
  };

  const renderCategory = (category: Category, depth: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const indent = depth * 24;

    return (
      <div key={category.id} className="border-b last:border-0">
        <div
          className="flex items-center gap-2 py-3 px-2 hover:bg-muted/50"
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(category.id)}
              className="p-1 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          
          <span className="flex-1 font-medium">{category.name}</span>
          <span className="text-xs text-muted-foreground">Level {category.level}</span>
          <span className="text-xs text-muted-foreground px-2">
            {category.productCount || 0} {category.productCount === 1 ? 'product' : 'products'}
          </span>
          
          <div className="flex gap-1">
            {category.level < 2 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAddingChildTo(category)}
                title="Add child category"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMovingCategory(category);
                setMoveToParent(category.parent_id || 'none');
              }}
              title="Move category"
            >
              <Move className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingCategory(category);
                setEditCategoryName(category.name);
              }}
              title="Edit category"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteCategory(category.id)}
              title="Delete category"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {category.children?.map((child) => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading categories...</div>;
  }

  const allCategories = getAllCategories(categories);
  const availableParents = allCategories.filter(c => c.level < 2);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Category</CardTitle>
          <CardDescription>
            Add a new category (up to 2 levels deep: parent → child → grandchild)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div>
              <Label htmlFor="parent-category">Parent Category (Optional)</Label>
              <Select value={newCategoryParent} onValueChange={setNewCategoryParent}>
                <SelectTrigger>
                  <SelectValue placeholder="None (Top Level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {availableParents.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {'  '.repeat(cat.level)}
                      {cat.name} (Level {cat.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Tree</CardTitle>
          <CardDescription>
            View and manage all categories in a hierarchical structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No categories yet. Create your first category above!
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {categories.map((cat) => renderCategory(cat))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
              />
            </div>
            <Button onClick={handleUpdateCategory}>Update Category</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Category Dialog */}
      <Dialog open={!!movingCategory} onOpenChange={(open) => !open && setMovingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Category</DialogTitle>
            <DialogDescription>
              Change the parent category for "{movingCategory?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="move-parent">New Parent Category</Label>
              <Select value={moveToParent} onValueChange={setMoveToParent}>
                <SelectTrigger>
                  <SelectValue placeholder="None (Top Level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {allCategories
                    .filter(c => c.id !== movingCategory?.id && c.level < 2)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {'  '.repeat(cat.level)}
                        {cat.name} (Level {cat.level})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleMoveCategory}>Move Category</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Child Category Dialog */}
      <Dialog open={!!addingChildTo} onOpenChange={(open) => !open && setAddingChildTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Child Category</DialogTitle>
            <DialogDescription>
              Add a child category under "{addingChildTo?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="child-name">Child Category Name</Label>
              <Input
                id="child-name"
                value={childCategoryName}
                onChange={(e) => setChildCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <Button onClick={handleAddChild}>
              <Plus className="h-4 w-4 mr-2" />
              Add Child Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
