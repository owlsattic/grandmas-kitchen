import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  children?: Category[];
}

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>(['All']);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipe_categories')
        .select('id, name, parent_id')
        .order('name', { ascending: true });

      if (error) throw error;

      // Build hierarchical structure
      const categoryMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      // First pass: create all category objects
      data?.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });

      // Second pass: build hierarchy
      data?.forEach(cat => {
        const category = categoryMap.get(cat.id)!;
        if (cat.parent_id && categoryMap.has(cat.parent_id)) {
          categoryMap.get(cat.parent_id)!.children!.push(category);
        } else {
          rootCategories.push(category);
        }
      });

      setHierarchicalCategories(rootCategories);

      // Add 'All' at the beginning for filtering purposes
      const categoryNames = ['All', ...(data?.map(cat => cat.name) || [])];
      setCategories(categoryNames);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories if there's an error
      setCategories(['All', 'Appetizer', 'Soups', 'Desserts', 'Juices', 'Salads', 'Main Dishes']);
      setHierarchicalCategories([]);
    } finally {
      setLoading(false);
    }
  };

  return { categories, hierarchicalCategories, loading, refetch: fetchCategories };
};
