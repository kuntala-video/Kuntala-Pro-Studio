'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

export function PwaProvider() {
  const { toast, dismiss } = useToast();
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
        .catch((error) => console.error('Service Worker registration failed:', error));
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (installPrompt) {
      const {id} = toast({
        title: 'Install App',
        description: 'Get the full experience by installing the app to your device.',
        action: (
          <Button
            onClick={() => {
              (installPrompt as any).prompt();
            }}
          >
            <Download className="mr-2" />
            Install
          </Button>
        ),
        duration: Infinity,
      });

      const handleAppInstalled = () => {
        dismiss(id);
      }
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('appinstalled', handleAppInstalled);
      }

    }
  }, [installPrompt, toast, dismiss]);

  return null;
}
