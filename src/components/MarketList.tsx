import { useMemo, useState, useDeferredValue } from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Vehicle, FilterState } from "@/types/vehicle";
import { FilterSidebar } from "./FilterSidebar";
import { VirtualizedVehicleGrid } from "./VirtualizedVehicleGrid";
import { BrandModelSelect } from "./BrandModelSelect";
import { getUniqueBrands } from "@/lib/vehicleAnalysis";

interface MarketListProps {
  vehicles: Vehicle[];
}

export function MarketList({ vehicles }: MarketListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const maxPrice = useMemo(() => 
    Math.max(...vehicles.map(v => v.prix), 100000), [vehicles]);
  const maxKm = useMemo(() => 
    Math.max(...vehicles.map(v => v.kilometrage), 300000), [vehicles]);
  const brands = useMemo(() => getUniqueBrands(vehicles), [vehicles]);

  const [filters, setFilters] = useState<FilterState>({
    prixMin: 0,
    prixMax: maxPrice,
    kmMax: maxKm,
    marques: [],
    gainMin: 0,
  });

  const filteredVehicles = useMemo(() => {
    const query = deferredSearch.toLowerCase();
    return vehicles.filter(v => {
      if (v.prix < filters.prixMin || v.prix > filters.prixMax) return false;
      if (v.kilometrage > filters.kmMax) return false;
      if ((v.gainPotentiel || 0) < filters.gainMin) return false;
      if (filters.marques.length > 0 && !filters.marques.includes(v.marque)) return false;
      if (query && !v.titre.toLowerCase().includes(query) && !v.marque.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [vehicles, filters, deferredSearch]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.prixMin > 0) count++;
    if (filters.prixMax < maxPrice) count++;
    if (filters.kmMax < maxKm) count++;
    if (filters.gainMin > 0) count++;
    if (filters.marques.length > 0) count++;
    return count;
  }, [filters, maxPrice, maxKm]);

  return (
    <div className="flex gap-6">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <FilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          brands={brands}
          maxPrice={maxPrice}
          maxKm={maxKm}
          isOpen={true}
          onClose={() => {}}
        />
      </div>

      {/* Mobile Sidebar */}
      <FilterSidebar
        filters={filters}
        onFiltersChange={setFilters}
        brands={brands}
        maxPrice={maxPrice}
        maxKm={maxKm}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Search & Controls */}
        <div className="glass-card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par modèle, marque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setIsFilterOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
              <div className="text-sm text-muted-foreground">
                <span className="font-mono font-semibold text-foreground">
                  {filteredVehicles.length.toLocaleString()}
                </span>{" "}
                résultats
              </div>
            </div>
          </div>
        </div>

        {/* Virtualized Vehicle Grid */}
        <VirtualizedVehicleGrid vehicles={filteredVehicles} />
      </div>
    </div>
  );
}
