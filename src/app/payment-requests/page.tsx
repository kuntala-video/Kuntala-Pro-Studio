'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { PaymentRequest } from '@/lib/types';
import { format } from 'date-fns';
import { useFirebase } from '@/firebase';
import { collection, query, orderBy, getDocs, doc } from 'firebase/firestore';

import { StudioLayout } from '@/components/studio-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Eye, CheckCircle, XCircle, Bot } from 'lucide-react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PaymentRequestService } from '@/lib/payment-requests';
import { PaymentAutomationService } from '@/lib/payment-automation';
import { useTranslation } from '@/context/i18n-context';


export default function PaymentRequestsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { db, auth } = useFirebase();
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(true);
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
         if (!db) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
         const q = query(collection(db, "paymentRequests"), orderBy('createdAt', 'desc'));
         const snapshot = await getDocs(q);
    
         const items = snapshot.docs.map(doc => ({
           id: doc.id,
           ...doc.data()
         })) as PaymentRequest[];
    
         setRequests(items);
       } catch (error) {
         console.error("Failed to load payment requests:", error);
         toast({ title: 'Error fetching requests', description: (error as Error).message, variant: 'destructive'});
         setRequests([]);
       } finally {
         setIsLoading(false);
       }
    }, [db, toast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApproveRequest = async (request: PaymentRequest) => {
        if (!db || !auth) return;
        setIsProcessing(request.id);
        try {
            await PaymentRequestService.updatePaymentRequestStatus(db, auth, request.id, 'approved');
            
            const params = new URLSearchParams();
            params.set('email', request.email);
            params.set('name', request.fullName);
            params.set('plan', request.plan);
            if (request.whatsapp) params.set('whatsapp', request.whatsapp);
            if (request.screenshotBase64) params.set('receiptUrl', request.screenshotBase64);

            router.push(`/manual-accounts?${params.toString()}`);

            toast({ 
                title: 'Request Approved',
                description: 'Redirecting to create manual account...'
            });

        } catch (error: any) {
            toast({ title: 'Approval Failed', description: error.message, variant: 'destructive' });
            setIsProcessing(null);
        }
    };
    
    const handleAutoVerify = async (request: PaymentRequest) => {
        if (!db || !auth) return;
        setIsProcessing(request.id);
        try {
            const resultMessage = await PaymentAutomationService.verifyPaymentAndProvisionUser(db, auth, request);
            toast({ title: 'Automation Successful', description: resultMessage });
            fetchRequests(); // Refresh the list
        } catch (error: any) {
            toast({ title: 'Automation Failed', description: error.message, variant: 'destructive' });
            fetchRequests(); // Refresh to show 'failed' status
        } finally {
            setIsProcessing(null);
        }
    };


    const handleRejectRequest = async (request: PaymentRequest) => {
        if (!db || !auth) return;
        setIsProcessing(request.id);
        try {
            await PaymentRequestService.updatePaymentRequestStatus(db, auth, request.id, 'rejected');
            toast({ title: 'Request Rejected' });
            setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'rejected' } : r));
        } catch (error: any) {
            toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsProcessing(null);
        }
    };


    if (isLoading) {
        return (
            <StudioLayout>
                <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </StudioLayout>
        );
    }

    const getStatusBadge = (status: PaymentRequest['status']) => {
        switch (status) {
            case 'approved':
            case 'verified':
                return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3"/> {status}</Badge>;
            case 'rejected':
            case 'failed':
                return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/> {status}</Badge>;
            case 'pending':
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <StudioLayout>
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle className="font-headline text-3xl flex items-center gap-2">
                            <CreditCard /> {t('payment_requests')}
                        </CardTitle>
                        <CardDescription>{t('incoming_manual_payments')}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                         <div className="h-48 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                           {t('no_payment_requests_found')}
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('guest')}</TableHead>
                                <TableHead>{t('plan')} &amp; Amount</TableHead>
                                <TableHead>{t('transaction')}</TableHead>
                                <TableHead>{t('status')}</TableHead>
                                <TableHead className="text-right">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.fullName || 'N/A'}</div>
                                        <div className="text-sm text-muted-foreground">{req.email || 'N/A'}</div>
                                        {req.whatsapp && <div className="text-sm text-muted-foreground">WhatsApp: {req.whatsapp}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium capitalize">{req.plan || 'N/A'}</div>
                                        <div className="text-sm text-muted-foreground">₹{req.amount ?? 0}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-mono text-xs">{req.transactionId || 'N/A'}</div>
                                        <div className="text-xs text-muted-foreground" title={req.createdAt?.toDate()?.toISOString()}>
                                            {t('submitted')}: {req.createdAt?.toDate ? format(req.createdAt.toDate(), 'PP') : 'N/A'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(req.status)}
                                        {req.status === 'failed' && (
                                            <p className="text-xs text-destructive mt-1 truncate max-w-[150px]" title={req.verificationFailureReason}>
                                                {req.verificationFailureReason}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {req.screenshotBase64 && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="outline"><Eye className="mr-2 h-4 w-4"/>{t('screenshot')}</Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>{t('screenshot_for', {name: req.fullName})}</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="mt-4 rounded-md border p-2 flex justify-center bg-muted">
                                                        <Image src={req.screenshotBase64} alt="Payment Screenshot" width={400} height={600} className="max-h-[60vh] w-auto object-contain rounded-md" />
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                        {req.status === 'pending' && (
                                            <>
                                                <Button size="sm" variant="secondary" onClick={() => handleAutoVerify(req)} disabled={isProcessing === req.id}>
                                                    {isProcessing === req.id ? <Loader2 className="animate-spin"/> : <Bot/>}
                                                    {t('auto_verify')}
                                                </Button>
                                                <Button size="sm" onClick={() => handleApproveRequest(req)} disabled={isProcessing === req.id}>
                                                    {t('manual_approve')}
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(req)} disabled={isProcessing === req.id}>
                                                    {t('reject')}
                                                </Button>
                                            </>
                                        )}
                                        {req.status === 'failed' && (
                                            <Button size="sm" variant="secondary" onClick={() => handleAutoVerify(req)} disabled={isProcessing === req.id}>
                                                {isProcessing === req.id ? <Loader2 className="animate-spin"/> : <Bot/>}
                                                {t('retry_verification')}
                                            </Button>
                                        )}
                                         {(req.status === 'approved' || req.status === 'verified') && (
                                            <p className='text-sm text-muted-foreground'>{t('account_provisioned')}</p>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
        </StudioLayout>
    );
}
