import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface CSVUploaderProps {
  onFileUpload: (file: File) => void;
  compact?: boolean;
}

export function CSVUploader({ onFileUpload, compact = false }: CSVUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  if (compact) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
          className="hidden"
        />
        <Button variant="outline" size="sm" onClick={handleClick} className="gap-2">
          <Upload className="w-4 h-4" />
          Nouveau CSV
        </Button>
      </>
    );
  }

  return (
    <div className="w-full max-w-xl">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleChange}
        className="hidden"
      />
      
      <button
        onClick={handleClick}
        className="w-full p-12 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-card/50 hover:bg-card transition-all group cursor-pointer"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-1">
              Importer votre fichier CSV
            </h3>
            <p className="text-muted-foreground text-sm">
              AutoScout24, LeBonCoin, ou tout autre format CSV
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded bg-muted">.csv</span>
            <span className="px-2 py-1 rounded bg-muted">.xlsx</span>
            <span className="px-2 py-1 rounded bg-muted">.xls</span>
          </div>
        </div>
      </button>

      <p className="text-center text-xs text-muted-foreground mt-4">
        La détection des colonnes est automatique (prix, km, année, marque, modèle)
      </p>
    </div>
  );
}
