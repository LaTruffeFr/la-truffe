import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("glass-card overflow-hidden animate-pulse", className)}>
      <div className="h-40 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-20" />
          <div className="h-4 bg-muted rounded w-14" />
        </div>
        <div className="flex justify-between items-end pt-2 border-t border-border/50">
          <div className="h-8 bg-muted rounded w-24" />
          <div className="h-9 bg-muted rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="glass-card p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-7 bg-muted rounded w-24" />
        <div className="h-4 bg-muted rounded w-32" />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 bg-muted rounded w-40" />
        <div className="flex gap-2">
          <div className="h-9 bg-muted rounded w-32" />
          <div className="h-9 bg-muted rounded w-32" />
        </div>
      </div>
      <div className="h-[400px] bg-muted/50 rounded-lg flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Chargement du graphique...</div>
      </div>
    </div>
  );
}
