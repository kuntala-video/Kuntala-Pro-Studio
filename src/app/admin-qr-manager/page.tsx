'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/provider';
import { QrSettingsService } from '@/lib/qr-settings';
import { Loader2, QrCode, Upload, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StudioLayout } from '@/components/studio-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function QrManagerPage() {
    const { userProfile, isLoading: isUserLoading } = useUser();
    const { firestore: db } = useFirebase();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [qrEnabled, setQrEnabled] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [qrImageUrl, setQrImageUrl] = useState<string | null>(null); // URL/base64 from DB/Upload
    const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null); // URL for display (can be local object URL or base64)
    
    const isSuperAdmin = userProfile?.role === 'super_admin';

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const fetchSettings = useCallback(async () => {
        if (!db) return;
        setIsLoadingData(true);
        try {
            const currentSettings = await QrSettingsService.getActiveQrSettings(db);
            if (currentSettings) {
                setQrEnabled(currentSettings.active ?? true);
                setQrImageUrl(currentSettings.qrImage);
                setQrPreviewUrl(currentSettings.qrImage);
            }
        } catch (error: any) {
            toast({ title: 'Error fetching QR settings', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoadingData(false);
        }
    }, [toast, db]);
    
    useEffect(() => {
        if (isSuperAdmin && db) {
            fetchSettings();
        } else if (!isUserLoading) {
            setIsLoadingData(false);
        }
    }, [isSuperAdmin, isUserLoading, db, fetchSettings]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                    title: "File is too large",
                    description: "Please upload an image smaller than 5MB.",
                    variant: "destructive",
                });
                return;
            }
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setQrPreviewUrl(objectUrl);
        }
    };
    
    const handleUploadFirst = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        try {
            const base64 = await convertToBase64(selectedFile);
            setQrImageUrl(base64); // This is now the official data for saving
            setQrPreviewUrl(base64); // Update preview to show the base64 image
            toast({
                title:"QR prepared successfully",
                description: "Click 'Save Settings' to apply the new image."
            });
        } catch(error:any) {
            toast({
                title:"Upload failed",
                description:error.message,
                variant: 'destructive'
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveSettings = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            console.log("RAW QR BEFORE SAVE:", qrImageUrl);

            if (!qrImageUrl || typeof qrImageUrl !== "string") {
              alert("Invalid QR image");
              return;
            }

            let finalImage = qrImageUrl;

            if (!finalImage.startsWith("data:image/")) {
              finalImage = "data:image/png;base64," + finalImage;
            }

            console.log("FINAL QR TO SAVE:", finalImage.slice(0,60));
            
            await setDoc(
                doc(db,"qr_settings","default_qr"),
                {
                  qrImage: finalImage,
                  active: qrEnabled,
                  updatedAt: serverTimestamp()
                },
                { merge:true }
            );

            toast({ title:"QR saved successfully" });

        } catch (error: any) {
            toast({
                title: "Save failed",
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const showSkeleton = isUserLoading || (isLoadingData && isSuperAdmin);
    
    if (isUserLoading && !userProfile) {
        return (
            <StudioLayout>
                <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </StudioLayout>
        )
    }
    
    return (
        <StudioLayout>
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <QrCode className="h-6 w-6 text-primary"/> QR Code Payment Manager
                    </CardTitle>
                    <CardDescription>
                        Manage the active QR code and its visibility on the payment page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!isSuperAdmin ? (
                         <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p>You do not have permission to view this page.</p>
                        </div>
                    ) : showSkeleton ? (
                        <div className="space-y-6">
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4">
                                <Label>Current QR Code Image</Label>
                                <Card className="p-4 flex justify-center items-center bg-muted/50">
                                    {qrPreviewUrl ? (
                                        <img src={qrPreviewUrl} alt="Active QR Code" width={280} height={280} className="rounded-md object-contain" />
                                    ) : (
                                        <p className="text-muted-foreground">No QR code image uploaded.</p>
                                    )}
                                </Card>
                                 <Input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden"/>
                                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isSaving}>
                                    <Upload className="mr-2"/>
                                    {selectedFile ? `Selected: ${selectedFile.name.substring(0, 20)}...` : 'Select New Image'}
                                </Button>
                                {selectedFile && (
                                    <Button onClick={handleUploadFirst} disabled={isUploading}>
                                        {isUploading ? <Loader2 className="animate-spin mr-2"/> : <Upload className="mr-2"/>}
                                        Upload First
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <Label htmlFor="qrEnabled" className="text-base">Activate QR Payments</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Turn this on to show the QR code on the payment page.
                                    </p>
                                </div>
                                <Switch
                                    id="qrEnabled"
                                    checked={qrEnabled}
                                    onCheckedChange={setQrEnabled}
                                    disabled={isSaving}
                                />
                            </div>

                            <Button onClick={handleSaveSettings} className="w-full" disabled={isSaving || isLoadingData || isUploading}>
                                {isSaving ? <><Loader2 className="animate-spin mr-2"/> Saving...</> : <><Save className="mr-2"/>Save Settings</>}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </StudioLayout>
    );
}
