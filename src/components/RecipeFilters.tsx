import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

interface RecipeFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedTime: string;
  onTimeChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export const RecipeFilters = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTime,
  onTimeChange,
  sortBy,
  onSortChange
}: RecipeFiltersProps) => {
  const { categories } = useCategories();

  return (
    <section className="mb-8" aria-labelledby="filters-title">
      <h2 id="filters-title" className="sr-only">Search and filter recipes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search recipes, e.g. carrot juice or lentil soup"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card border-border"
            aria-label="Search recipes"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="bg-card border-border" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTime} onValueChange={onTimeChange}>
          <SelectTrigger className="bg-card border-border" aria-label="Filter by time">
            <SelectValue placeholder="Any time" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">Any time</SelectItem>
            <SelectItem value="15">≤ 15 min</SelectItem>
            <SelectItem value="30">≤ 30 min</SelectItem>
            <SelectItem value="60">≤ 60 min</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px] bg-card border-border" aria-label="Sort recipes">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="title">A → Z</SelectItem>
            <SelectItem value="time">Fastest first</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
};
