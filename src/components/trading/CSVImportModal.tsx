import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, Car, AlertCircle, X } from 'lucide-react';

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File, marque: string, modele: string) => void;
}

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json', '.txt'];

function isAcceptedFile(file: File): boolean {
  return ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
}

export function CSVImportModal({ open, onOpenChange, onImport }: CSVImportModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | File[]) => {
    const accepted = Array.from(newFiles).filter(isAcceptedFile);
    if (accepted.length > 0) {
      setFiles(prev => {
        const existingNames = new Set(prev.map(f => f.name));
        const unique = accepted.filter(f => !existingNames.has(f.name));
        return [...prev, ...unique];
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleSubmit = () => {
    if (files.length > 0 && marque.trim() && modele.trim()) {
      files.forEach(file => {
        onImport(file, marque.trim(), modele.trim());
      });
      // Reset form
      setFiles([]);
      setMarque('');
      setModele('');
      onOpenChange(false);
    }
  };

  const canSubmit = files.length > 0 && marque.trim() && modele.trim();

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            Importer des fichiers
          </DialogTitle>
          <DialogDescription>
            Déposez un ou plusieurs fichiers pour une analyse de marché.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Upload Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer
              ${dragActive ? 'border-primary bg-primary/5' : files.length > 0 ? 'border-success bg-success/5' : 'border-border hover:border-primary/50'}
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
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <div className="text-center">
              {files.length > 0 ? (
                <div className="space-y-1">
                  <FileSpreadsheet className="w-8 h-8 text-success mx-auto" />
                  <p className="font-medium text-foreground">
                    {files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(totalSize / 1024).toFixed(1)} Ko au total — cliquez pour en ajouter
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground">Glissez vos fichiers ici</p>
                  <p className="text-sm text-muted-foreground mt-1">ou cliquez pour sélectionner</p>
                  <p className="text-xs text-muted-foreground mt-2">CSV, XLSX, XLS, JSON, TXT — plusieurs fichiers acceptés</p>
                </>
              )}
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="w-4 h-4 text-success shrink-0" />
                    <span className="truncate text-foreground">{file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">({(file.size / 1024).toFixed(1)} Ko)</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

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
              <p className="font-medium text-foreground">Import multi-fichiers</p>
              <p className="text-muted-foreground mt-1">
                Vous pouvez déposer plusieurs fichiers (CSV, JSON…) qui seront fusionnés pour une analyse de marché plus complète.
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
            Analyser {files.length > 1 ? `(${files.length} fichiers)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
