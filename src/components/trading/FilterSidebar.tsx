import { FilterState } from './TradingDashboard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, RotateCcw } from 'lucide-react';

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  brands: string[];
  totalCount: number;
  filteredCount: number;
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  brands,
  totalCount,
  filteredCount,
}: FilterSidebarProps) {
  const handleBrandToggle = (brand: string) => {
    const newMarques = filters.marques.includes(brand)
      ? filters.marques.filter(m => m !== brand)
      : [...filters.marques, brand];
    onFiltersChange({ ...filters, marques: newMarques });
  };

  const resetFilters = () => {
    onFiltersChange({
      marques: [],
      budgetMin: 0,
      budgetMax: 500000,
      anneeMin: 2010,
      kmMax: 300000,
      dealScoreMin: 50,
    });
  };

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sidebar-primary" />
            <span className="font-semibold text-sidebar-foreground">Filtres</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {filteredCount.toLocaleString()} / {totalCount.toLocaleString()} véhicules
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Deal Score */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-sidebar-foreground">
              Score Deal Minimum
            </Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[filters.dealScoreMin]}
                onValueChange={([val]) => onFiltersChange({ ...filters, dealScoreMin: val })}
                min={0}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="w-10 text-right font-mono text-sm text-primary">
                {filters.dealScoreMin}
              </span>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-sidebar-foreground">Budget</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-muted-foreground">Min</span>
                <Input
                  type="number"
                  value={filters.budgetMin}
                  onChange={(e) => onFiltersChange({ ...filters, budgetMin: parseInt(e.target.value) || 0 })}
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Max</span>
                <Input
                  type="number"
                  value={filters.budgetMax}
                  onChange={(e) => onFiltersChange({ ...filters, budgetMax: parseInt(e.target.value) || 500000 })}
                  className="h-8 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Year */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-sidebar-foreground">
              Année Minimum
            </Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[filters.anneeMin]}
                onValueChange={([val]) => onFiltersChange({ ...filters, anneeMin: val })}
                min={2000}
                max={2024}
                step={1}
                className="flex-1"
              />
              <span className="w-12 text-right font-mono text-sm">
                {filters.anneeMin}
              </span>
            </div>
          </div>

          {/* Max KM */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-sidebar-foreground">
              Kilométrage Max
            </Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[filters.kmMax]}
                onValueChange={([val]) => onFiltersChange({ ...filters, kmMax: val })}
                min={10000}
                max={300000}
                step={10000}
                className="flex-1"
              />
              <span className="w-16 text-right font-mono text-sm">
                {(filters.kmMax / 1000).toFixed(0)}k
              </span>
            </div>
          </div>

          {/* Brands */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-sidebar-foreground">
              Marques ({filters.marques.length > 0 ? filters.marques.length : 'Toutes'})
            </Label>
            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin pr-2">
              {brands.slice(0, 30).map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-sidebar-accent cursor-pointer"
                >
                  <Checkbox
                    checked={filters.marques.includes(brand)}
                    onCheckedChange={() => handleBrandToggle(brand)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-sidebar-foreground">{brand}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
