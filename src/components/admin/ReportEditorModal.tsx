import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ReportEditorModal({ isOpen, onClose }: any) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Édition du rapport</DialogTitle>
        </DialogHeader>
        <p>Fonctionnalité d'édition rapide.</p>
      </DialogContent>
    </Dialog>
  );
}