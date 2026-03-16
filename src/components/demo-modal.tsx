
'use client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Video } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
}

export function DemoModal({ isOpen, onOpenChange, title, description }: DemoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Video /> {title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">Demo video coming soon.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
