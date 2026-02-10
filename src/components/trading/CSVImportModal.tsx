import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, Car, AlertCircle } from 'lucide-react';

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File, marque: string, modele: string) => void;
}

export function CSVImportModal({ open, onOpenChange, onImport }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.json') || droppedFile.name.endsWith('.txt'))) {
      handleFileChange(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleSubmit = () => {
    if (file && marque.trim() && modele.trim()) {
      onImport(file, marque.trim(), modele.trim());
      // Reset form
      setFile(null);
      setMarque('');
      setModele('');
      onOpenChange(false);
    }
  };

  const canSubmit = file && marque.trim() && modele.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            Importer un fichier CSV
          </DialogTitle>
          <DialogDescription>
            Précisez le véhicule que vous analysez pour une estimation de marché précise.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Upload Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer
              ${dragActive ? 'border-primary bg-primary/5' : file ? 'border-success bg-success/5' : 'border-border hover:border-primary/50'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json,.txt"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            <div className="text-center">
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-success" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} Ko
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground">Glissez votre fichier ici</p>
                  <p className="text-sm text-muted-foreground mt-1">ou cliquez pour sélectionner</p>
                  <p className="text-xs text-muted-foreground mt-2">CSV, XLSX, XLS, JSON, TXT</p>
                </>
              )}
            </div>
          </div>

          {/* Brand & Model Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marque" className="flex items-center gap-2">
                Marque <span className="text-destructive">*</span>
              </Label>
              <Input
                id="marque"
                placeholder="Ex: Audi, BMW, Peugeot..."
                value={marque}
                onChange={(e) => setMarque(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modele" className="flex items-center gap-2">
                Modèle <span className="text-destructive">*</span>
              </Label>
              <Input
                id="modele"
                placeholder="Ex: RS3, Serie 3, 308..."
                value={modele}
                onChange={(e) => setModele(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Pourquoi cette info ?</p>
              <p className="text-muted-foreground mt-1">
                En précisant la marque et le modèle, notre algorithme calcule une cote de marché beaucoup plus précise en comparant avec les véhicules identiques.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit}
            className="gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Analyser
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
