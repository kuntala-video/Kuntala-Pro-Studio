"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { cartoonStylize } from "@/ai/flows/cartoon-stylization";
import type { CartoonStylizationOutput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ImageIcon, Camera as CameraIcon } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export function CartoonStylizer() {
  const [isLoading, setIsLoading] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [stylizedImage, setStylizedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
        setStylizedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhoto = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: "Using file upload",
        description: "Camera access is only available on the native mobile app.",
      });
      fileInputRef.current?.click();
      return;
    }
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        setOriginalImage(image.dataUrl);
        setStylizedImage(null);
      }
    } catch (error) {
      // User might have cancelled the photo capture, so we don't show an error.
      console.info("Camera action was cancelled by user.");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!originalImage) {
      toast({ title: "No image selected", description: "Please upload an image to stylize.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    setStylizedImage(null);

    const formData = new FormData(event.currentTarget);
    const styleDescription = formData.get("styleDescription") as string;
    
    try {
      const result: CartoonStylizationOutput = await cartoonStylize({
        imageDataUri: originalImage,
        styleDescription,
      });
      setStylizedImage(result.stylizedImageDataUri);
    } catch (error) {
      console.error(error);
      toast({
        title: "Stylization Failed",
        description: "Could not generate the cartoon image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><ImageIcon className="text-primary"/> AI Cartoon Stylizer</CardTitle>
        <CardDescription>Upload an image or take a photo and describe a cartoon style to transform it.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-2">
            <Label>Image</Label>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              disabled={isLoading}
            />
             <div className="flex flex-col sm:flex-row gap-2">
                <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex-1"
                >
                <Upload className="mr-2 h-4 w-4" />
                {originalImage ? "Change Image" : "Upload From File"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleTakePhoto}
                    disabled={isLoading}
                    className="flex-1"
                >
                    <CameraIcon className="mr-2 h-4 w-4" />
                    Take Photo
                </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="styleDescription">Style Description</Label>
            <Input
              id="styleDescription"
              name="styleDescription"
              placeholder="e.g., 'Minimalist flat design', '90s anime style', 'Modern Disney-like'"
              disabled={isLoading || !originalImage}
            />
          </div>

          <Button type="submit" disabled={isLoading || !originalImage}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Stylizing...
              </>
            ) : (
              "Stylize Image"
            )}
          </Button>
        </form>

        {(originalImage || isLoading) && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-headline mb-2 text-center">Original</h3>
              <Card className="overflow-hidden">
                {originalImage && <Image src={originalImage} alt="Original" width={500} height={500} className="w-full h-auto object-contain" />}
              </Card>
            </div>
            <div>
              <h3 className="font-headline mb-2 text-center">Stylized</h3>
              <Card className="overflow-hidden aspect-square flex items-center justify-center bg-card">
                {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                {!isLoading && stylizedImage && <Image src={stylizedImage} alt="Stylized" width={500} height={500} className="w-full h-auto object-contain" />}
                 {!isLoading && !stylizedImage && <div className="text-muted-foreground p-4 text-center">Your stylized image will appear here.</div>}
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
