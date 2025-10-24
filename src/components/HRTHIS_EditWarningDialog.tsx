/**
 * @file HRTHIS_EditWarningDialog.tsx
 * @version v4.8.0
 * @description Warning dialog when user tries to edit multiple cards at once
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface EditWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCardName: string;
}

export function EditWarningDialog({ open, onOpenChange, currentCardName }: EditWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bearbeitung bereits aktiv</AlertDialogTitle>
          <AlertDialogDescription>
            Sie bearbeiten derzeit <strong>"{currentCardName}"</strong>.
            <br />
            <br />
            Bitte speichern oder abbrechen Sie erst die aktuelle Bearbeitung, bevor Sie eine andere Karte bearbeiten.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Verstanden</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
