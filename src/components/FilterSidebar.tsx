import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterState } from "@/types/vehicle";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  brands: string[];
  maxPrice: number;
  maxKm: number;
  isOpen: boolean;
  onClose: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatKm(value: number): string {
  return `${(value / 1000).toFixed(0)}k km`;
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  brands,
  maxPrice,
  maxKm,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  const handlePriceChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      prixMin: values[0],
      prixMax: values[1],
    });
  };

  const handleKmChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      kmMax: values[0],
    });
  };

  const handleGainChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      gainMin: values[0],
    });
  };

  const handleBrandToggle = (brand: string, checked: boolean) => {
    const newBrands = checked
      ? [...filters.marques, brand]
      : filters.marques.filter(b => b !== brand);
    onFiltersChange({
      ...filters,
      marques: newBrands,
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      prixMin: 0,
      prixMax: maxPrice,
      kmMax: maxKm,
      marques: [],
      gainMin: 0,
    });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 right-0 lg:right-auto h-screen lg:h-auto
          w-80 lg:w-72 bg-card border-l lg:border lg:rounded-lg border-border
          z-50 lg:z-auto transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Filtres</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-65px)] lg:h-auto lg:max-h-[600px]">
          <div className="p-4 space-y-6">
            {/* Price Range */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Prix
              </label>
              <Slider
                value={[filters.prixMin, filters.prixMax]}
                min={0}
                max={maxPrice}
                step={1000}
                onValueChange={handlePriceChange}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>{formatCurrency(filters.prixMin)}</span>
                <span>{formatCurrency(filters.prixMax)}</span>
              </div>
            </div>

            {/* KM Max */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Kilométrage max
              </label>
              <Slider
                value={[filters.kmMax]}
                min={0}
                max={maxKm}
                step={5000}
                onValueChange={handleKmChange}
                className="py-4"
              />
              <div className="text-xs text-muted-foreground font-mono text-right">
                {formatKm(filters.kmMax)}
              </div>
            </div>

            {/* Gain Min */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Gain minimum
              </label>
              <Slider
                value={[filters.gainMin]}
                min={-5000}
                max={10000}
                step={500}
                onValueChange={handleGainChange}
                className="py-4"
              />
              <div className="text-xs font-mono text-right">
                <span className={filters.gainMin >= 0 ? 'text-success' : 'text-destructive'}>
                  {filters.gainMin >= 0 ? '+' : ''}{formatCurrency(filters.gainMin)}
                </span>
              </div>
            </div>

            {/* Brands */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Marques ({filters.marques.length}/{brands.length})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {brands.map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-1.5 rounded transition-colors"
                  >
                    <Checkbox
                      checked={filters.marques.includes(brand)}
                      onCheckedChange={(checked) =>
                        handleBrandToggle(brand, checked as boolean)
                      }
                    />
                    <span className="text-sm text-foreground">{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
