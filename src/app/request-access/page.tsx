'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { QrSettingsService } from '@/lib/qr-settings';
import { db } from "@/lib/firebase";
import { useTranslation } from '@/context/i18n-context';

const planOptions = [
    { name:"Monthly", amount:200 },
    { name:"Quarterly", amount:1200 },
    { name:"Yearly", amount:2000 },
    { name:"Enterprise", amount:3000 }
];

const convertToBase64 = (file: File): Promise<string> => {
 return new Promise((resolve, reject) => {
   const reader = new FileReader();
   reader.readAsDataURL(file);
   reader.onload = () => resolve(reader.result as string);
   reader.onerror = error => reject(error);
 });
};

export default function RequestAccessPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const [qrImage, setQrImage] = useState<string>("");
  const [loadingQr, setLoadingQr] = useState(true);

  const { toast } = useToast();
  const router = useRouter();
  const { auth } = useFirebase();
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const signInAttempted = useRef(false);
  
  const [selectedPlanName, setSelectedPlanName] = useState<string>(planOptions[0].name);
  
  const amountMap: { [key: string]: number } = {
    monthly:200,
    quarterly:1200,
    yearly:2000,
    enterprise:3000
   };
  const selectedPlanPrice = amountMap[selectedPlanName.toLowerCase()] || 0;

  const loadQR = useCallback(async () => {
    setLoadingQr(true);
    try {
        const currentSettings = await QrSettingsService.getActiveQrSettings(db);
        if (currentSettings && currentSettings.active && currentSettings.qrImage) {
            setQrImage(currentSettings.qrImage);
        } else {
            setQrImage(""); // Explicitly set to empty if not active or no image
        }
    } catch (error: any) {
        toast({ title: 'Error fetching QR settings', description: error.message, variant: 'destructive' });
        setQrImage("");
    } finally {
        setLoadingQr(false);
    }
  }, [toast]);

  useEffect(() => {
    loadQR();
  }, [loadQR]);


  useEffect(() => {
    if (!auth) {
        setIsAuthLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(firebaseUser);
      setIsAuthLoading(false);
      if (firebaseUser && !firebaseUser.isAnonymous) {
        router.replace('/');
      } else if (!firebaseUser && !signInAttempted.current) {
        signInAttempted.current = true;
        initiateAnonymousSignIn(auth);
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
                title: "File is too large",
                description: "Please upload a receipt image smaller than 5MB.",
                variant: "destructive",
            });
            e.target.value = ''; // Reset file input
            setReceiptFile(null);
        } else {
            setReceiptFile(file);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth) return;

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('name') as string;
    const email = formData.get('email') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const transactionId = formData.get('transactionId') as string;
    
    if (!currentUser) {
        toast({ title: 'Session Error', description: 'User session not initialized. Please wait a moment and try again.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }
    if (!selectedPlanName || !selectedPlanPrice) {
        toast({ title: 'Plan not selected', description: 'Please select a subscription plan.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }
     if (!receiptFile) {
        toast({ title: 'Receipt required', description: 'Please upload a payment screenshot.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }

    let screenshotBase64: string | undefined = undefined;
    if (receiptFile) {
        try {
            setIsUploading(true);
            screenshotBase64 = await convertToBase64(receiptFile);
        } catch (uploadError: any) {
            toast({ title: 'Receipt Conversion Failed', description: uploadError.message, variant: 'destructive' });
            setIsSubmitting(false);
            setIsUploading(false);
            return;
        } finally {
            setIsUploading(false);
        }
    }

    try {
        const docRef = await addDoc(collection(db, "paymentRequests"), {
            fullName,
            email,
            whatsapp,
            plan: selectedPlanName.toLowerCase(),
            amount: selectedPlanPrice,
            transactionId,
            screenshotBase64,
            status: "pending",
            createdAt: serverTimestamp(),
            createdByUid: currentUser.uid,
        });

        // Create an admin notification
        await addDoc(collection(db, 'admin_notifications'), {
            type: 'payment_request',
            referenceId: docRef.id,
            message: `New payment request from ${fullName} for the ${selectedPlanName} plan.`,
            isRead: false,
            createdAt: serverTimestamp(),
        });

      toast({
        title: 'Request Submitted',
        description: 'Your payment request has been sent to the admin for verification.',
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{t('submit_manual_payment')}</CardTitle>
          <CardDescription>
            {t('scan_and_pay')}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Card className="mb-6 bg-muted/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><QrCode/> {t('scan_to_pay_inr')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4 min-h-[256px]">
                    {loadingQr ? (
                         <div className="p-2 bg-white rounded-lg border">
                           <Skeleton className="h-[256px] w-[256px]"/>
                         </div>
                    ) : qrImage ? (
                         <div className="p-2 bg-white rounded-lg border">
                            <img src={qrImage} alt="QR Code" width={256} height={256} className="w-64 h-64 object-contain mx-auto rounded-md" />
                        </div>
                    ) : (
                        <p className="text-red-500 font-semibold p-4">
                          {t('qr_disabled')}
                        </p>
                    )}
                </CardContent>
            </Card>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                <Label htmlFor="name">{t('full_name')}</Label>
                <Input id="name" name="name" type="text" placeholder={t('full_name')} required disabled={isSubmitting || isUploading} />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="email">{t('email_address')}</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required disabled={isSubmitting || isUploading} />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="whatsapp">{t('whatsapp_number')}</Label>
                <Input id="whatsapp" name="whatsapp" type="tel" placeholder={t('whatsapp_number')} required disabled={isSubmitting || isUploading} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="plan">{t('select_plan')}</Label>
                        <Select name="plan" value={selectedPlanName} onValueChange={setSelectedPlanName} required>
                            <SelectTrigger id="plan" disabled={isSubmitting || isUploading}>
                                <SelectValue placeholder={t('choose_a_plan')}/>
                            </SelectTrigger>
                            <SelectContent>
                                {planOptions.map(plan => <SelectItem key={plan.name} value={plan.name}>
                                    {plan.name} - ₹{plan.amount}
                                </SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="amount">{t('amount_inr')}</Label>
                        <Input id="amount" name="amount" type="number" value={selectedPlanPrice} readOnly />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="transactionId">{t('transaction_id')}</Label>
                    <Input id="transactionId" name="transactionId" type="text" placeholder={t('transaction_id')} required disabled={isSubmitting || isUploading} />
                </div>
                
                <div className="grid gap-2">
                <Label htmlFor="receipt">{t('payment_screenshot')}</Label>
                <Input id="receipt" name="receipt" type="file" onChange={handleFileChange} accept="image/*" disabled={isSubmitting || isUploading} required/>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting || isUploading || isAuthLoading}>
                    {isAuthLoading ? t('initializing_session') : isUploading ? <><Loader2 className="mr-2 animate-spin"/>{t('processing_screenshot')}</> : (isSubmitting ? <Loader2 className="animate-spin" /> : t('submit_for_verification'))}
                </Button>
            </form>
            <div className="mt-4 text-center text-sm">
                {t('already_have_account')}{' '}
                <Link href="/login" className="underline">
                {t('login')}
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
