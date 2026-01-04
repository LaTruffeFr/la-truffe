import { useMemo, useState, useEffect, useRef, CSSProperties, ReactElement } from 'react';
import { Grid } from 'react-window';
import { VehicleWithScore } from '@/lib/csvParser';
import { DealCard } from './DealCard';

interface DealGridProps {
  vehicles: VehicleWithScore[];
  onSelectVehicle: (vehicle: VehicleWithScore) => void;
}

const CARD_WIDTH = 320;
const CARD_HEIGHT = 340;
const GAP = 16;

interface CellComponentProps {
  ariaAttributes: { role: "gridcell"; "aria-colindex": number };
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
  vehicles: VehicleWithScore[];
  columnCount: number;
  onSelect: (v: VehicleWithScore) => void;
}

function CellComponent({ 
  columnIndex, 
  rowIndex, 
  style,
  vehicles,
  columnCount,
  onSelect,
}: CellComponentProps): ReactElement | null {
  const index = rowIndex * columnCount + columnIndex;
  if (index >= vehicles.length) {
    return <div style={style} />;
  }

  const vehicle = vehicles[index];

  return (
    <div style={{ ...style, padding: GAP / 2 }}>
      <DealCard
        vehicle={vehicle}
        onClick={() => onSelect(vehicle)}
      />
    </div>
  );
}

export function DealGrid({ vehicles, onSelectVehicle }: DealGridProps) {
  const sortedVehicles = useMemo(() => 
    [...vehicles].sort((a, b) => b.dealScore - a.dealScore),
    [vehicles]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 500 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const columnCount = Math.max(1, Math.floor(dimensions.width / (CARD_WIDTH + GAP)));
  const rowCount = Math.ceil(sortedVehicles.length / columnCount);

  if (sortedVehicles.length === 0) {
    return (
      <div ref={containerRef} className="h-full w-full flex items-center justify-center p-4">
        <p className="text-muted-foreground">Aucun véhicule ne correspond aux filtres</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full p-2">
      <Grid<{ vehicles: VehicleWithScore[]; columnCount: number; onSelect: (v: VehicleWithScore) => void }>
        columnCount={columnCount}
        columnWidth={CARD_WIDTH + GAP}
        rowCount={rowCount}
        rowHeight={CARD_HEIGHT + GAP}
        style={{ height: dimensions.height - 16, width: dimensions.width - 16 }}
        cellComponent={CellComponent}
        cellProps={{
          vehicles: sortedVehicles,
          columnCount,
          onSelect: onSelectVehicle,
        }}
      />
    </div>
  );
}
