import { RefreshCw, Download, Filter, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuickActionsProps {
  onRefresh?: () => void;
  onExport?: () => void;
  vehicleCount: number;
  isRefreshing?: boolean;
}

export function QuickActions({ 
  onRefresh, 
  onExport, 
  vehicleCount,
  isRefreshing = false 
}: QuickActionsProps) {
  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Actualiser les données</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              disabled={vehicleCount === 0}
              className="h-9 w-9"
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Exporter en CSV</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="h-6 w-px bg-border mx-1" />

      <div className="text-sm text-muted-foreground">
        <span className="font-mono font-medium text-foreground">{vehicleCount}</span>
        {' '}véhicule{vehicleCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
