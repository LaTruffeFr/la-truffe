import { memo, useMemo, useRef, useEffect, useState, CSSProperties, ReactElement } from "react";
import { Grid } from "react-window";
import { Vehicle } from "@/types/vehicle";
import { VehicleCard } from "./VehicleCard";

interface VirtualizedVehicleGridProps {
  vehicles: Vehicle[];
}

// Memoized card wrapper for performance
const MemoizedVehicleCard = memo(VehicleCard);

// Custom cell props (without forbidden keys)
interface CustomCellProps {
  vehicles: Vehicle[];
  columnCount: number;
}

// Cell component for react-window v2
function VehicleCell({ 
  columnIndex, 
  rowIndex, 
  style,
  vehicles,
  columnCount,
}: { 
  columnIndex: number; 
  rowIndex: number; 
  style: CSSProperties;
  ariaAttributes: any;
} & CustomCellProps): ReactElement {
  const index = rowIndex * columnCount + columnIndex;
  
  if (index >= vehicles.length) {
    return <div style={style} />;
  }

  const vehicle = vehicles[index];

  return (
    <div style={{ ...style, padding: '8px' }}>
      <MemoizedVehicleCard vehicle={vehicle} index={index} />
    </div>
  );
}

export function VirtualizedVehicleGrid({ vehicles }: VirtualizedVehicleGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 600 });

  // Calculate column count based on container width
  const columnCount = useMemo(() => {
    const width = dimensions.width;
    if (width < 640) return 1;       // sm
    if (width < 1280) return 2;      // xl
    if (width < 1536) return 3;      // 2xl
    return 4;
  }, [dimensions.width]);

  const rowCount = useMemo(() => 
    Math.ceil(vehicles.length / columnCount), [vehicles.length, columnCount]);

  // Cell dimensions
  const columnWidth = useMemo(() => 
    dimensions.width > 0 ? dimensions.width / columnCount : 300, 
    [dimensions.width, columnCount]);
  
  const rowHeight = 380; // Fixed card height

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: Math.min(window.innerHeight - 200, 800),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Memoized cell props
  const cellProps = useMemo<CustomCellProps>(() => ({
    vehicles,
    columnCount,
  }), [vehicles, columnCount]);

  if (vehicles.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-muted-foreground">
          Aucun véhicule ne correspond à vos critères
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      {dimensions.width > 0 && (
        <>
          <div className="mb-2 text-xs text-muted-foreground text-right">
            Affichage virtualisé • {vehicles.length.toLocaleString()} véhicules
          </div>
          <Grid<CustomCellProps>
            columnCount={columnCount}
            columnWidth={columnWidth}
            rowCount={rowCount}
            rowHeight={rowHeight}
            cellComponent={VehicleCell}
            cellProps={cellProps}
            className="scrollbar-thin"
            style={{ 
              height: dimensions.height, 
              width: dimensions.width,
              overflowX: 'hidden' 
            }}
          />
        </>
      )}
    </div>
  );
}
