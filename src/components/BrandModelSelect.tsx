import { useMemo, useState, useCallback } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface BrandModelSelectProps {
  brands: string[];
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
}

export function BrandModelSelect({ brands, selectedBrands, onBrandsChange }: BrandModelSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Memoized filtered brands
  const filteredBrands = useMemo(() => {
    if (!search) return brands;
    const query = search.toLowerCase();
    return brands.filter(brand => brand.toLowerCase().includes(query));
  }, [brands, search]);

  const handleSelect = useCallback((brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter(b => b !== brand));
    } else {
      onBrandsChange([...selectedBrands, brand]);
    }
  }, [selectedBrands, onBrandsChange]);

  const handleRemove = useCallback((brand: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onBrandsChange(selectedBrands.filter(b => b !== brand));
  }, [selectedBrands, onBrandsChange]);

  const handleClearAll = useCallback(() => {
    onBrandsChange([]);
  }, [onBrandsChange]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] py-2"
          >
            <span className="text-sm truncate">
              {selectedBrands.length === 0 
                ? "Toutes les marques" 
                : `${selectedBrands.length} marque${selectedBrands.length > 1 ? 's' : ''} sélectionnée${selectedBrands.length > 1 ? 's' : ''}`
              }
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-popover border-border z-50" align="start">
          <Command>
            <CommandInput 
              placeholder="Rechercher une marque..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Aucune marque trouvée.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-y-auto">
                {filteredBrands.map((brand) => (
                  <CommandItem
                    key={brand}
                    value={brand}
                    onSelect={() => handleSelect(brand)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedBrands.includes(brand) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{brand}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected brands badges */}
      {selectedBrands.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedBrands.slice(0, 5).map(brand => (
            <Badge 
              key={brand} 
              variant="secondary" 
              className="text-xs cursor-pointer hover:bg-destructive/20"
              onClick={(e) => handleRemove(brand, e)}
            >
              {brand}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          {selectedBrands.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{selectedBrands.length - 5}
            </Badge>
          )}
          {selectedBrands.length > 1 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={handleClearAll}
            >
              Tout effacer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
