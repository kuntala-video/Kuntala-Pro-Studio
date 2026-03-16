'use client';

import { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AdSettings } from '@/lib/types';
import Image from 'next/image';

interface AdvertisementControlsProps {
  adSettings: AdSettings;
  onAdSettingsChange: (settings: AdSettings) => void;
}

export function AdvertisementControls({ adSettings, onAdSettingsChange }: AdvertisementControlsProps) {
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: 'Image too large', description: 'Please upload an image smaller than 2MB.', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        onAdSettingsChange({ ...adSettings, imageUrl: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!adSettings.enabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advertisement Settings</CardTitle>
        <CardDescription>Control the appearance of the ad overlay.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 animate-in fade-in-0">
        <div className="grid gap-2">
          <Label htmlFor="ad-mode">Ad Mode</Label>
          <Select
            value={adSettings.mode}
            onValueChange={(value: AdSettings['mode']) => onAdSettingsChange({ ...adSettings, mode: value })}
          >
            <SelectTrigger id="ad-mode"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-banner">Bottom Banner</SelectItem>
              <SelectItem value="side-banner">Side Banner</SelectItem>
              <SelectItem value="image-overlay">Image Overlay</SelectItem>
              <SelectItem value="text-ticker">Text Ticker</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {['bottom-banner', 'side-banner', 'image-overlay'].includes(adSettings.mode) && (
          <div className="grid gap-2">
            <Label>Ad Image</Label>
            <Input
              type="file"
              accept="image/png, image/jpeg, image/gif"
              ref={imageInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button variant="outline" type="button" onClick={() => imageInputRef.current?.click()}>
              <Upload className="mr-2" /> Upload Image
            </Button>
            {adSettings.imageUrl && (
              <div className="relative mt-2">
                <Image src={adSettings.imageUrl} alt="Ad preview" width={200} height={112} className="w-full h-auto rounded-md border" />
                 <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => onAdSettingsChange({...adSettings, imageUrl: null})}>
                    <X className="h-4 w-4"/>
                </Button>
              </div>
            )}
          </div>
        )}

        {['bottom-banner', 'text-ticker'].includes(adSettings.mode) && (
          <div className="grid gap-2">
            <Label htmlFor="ad-text">Ad Text</Label>
            <Input
              id="ad-text"
              placeholder="Your ad text here..."
              value={adSettings.text}
              onChange={(e) => onAdSettingsChange({ ...adSettings, text: e.target.value })}
            />
          </div>
        )}
        
        <div className="grid gap-2">
            <Label>Opacity</Label>
            <Slider
                value={[adSettings.opacity]}
                onValueChange={(value) => onAdSettingsChange({...adSettings, opacity: value[0]})}
                min={0.1}
                max={1}
                step={0.1}
            />
        </div>
      </CardContent>
    </Card>
  );
}
