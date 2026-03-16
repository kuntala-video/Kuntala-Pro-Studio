'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/hooks/use-user';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useCollection } from '@/firebase';
import { useFirebase } from '@/firebase/provider';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { AuthService } from '@/lib/auth';
import { ProjectService } from '@/lib/projects';
import { PaymentRequestService } from '@/lib/payment-requests';
import type { Project, UserProfile, ActivityLog, SystemLog, PaymentRequest } from '@/lib/types';
import packageJson from '../../../package.json';
import Image from 'next/image';
import { SubscriptionPlanService } from '@/lib/subscription-plans';

import { StudioLayout } from '@/components/studio-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ShieldCheck, UserX, Users, FolderKanban, Film, BookCopy, DollarSign, History, Wand2, Palette, Package, Bug, Eye, UserPlus, CreditCard, PackagePlus, RefreshCw } from 'lucide-react';
import { TableRowSkeleton } from '@/components/skeletons';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useTranslation } from '@/context/i18n-context';

export default function AdminDashboardPage() {
    const { user, userProfile, isLoading: isUserLoading } = useUser();
    const { firestore: db, auth } = useFirebase();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const { t } = useTranslation();

    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    
    const isRealAdmin = (userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && !!userProfile?.createdAt;

    const paymentRequestsQuery = useMemo(() =>
        db && isRealAdmin ? query(collection(db, 'paymentRequests'), orderBy('createdAt', 'desc')) : null,
    [db, isRealAdmin]);
    const { data: paymentRequests, isLoading: isLoadingPaymentRequests } = useCollection<PaymentRequest>(paymentRequestsQuery);

    const activityLogsQuery = useMemo(() =>
        db && isRealAdmin ? query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(10)) : null,
    [db, isRealAdmin]);
    const { data: activityLogs, isLoading: isLoadingLogs } = useCollection<ActivityLog>(activityLogsQuery);

    const systemLogsQuery = useMemo(() =>
        db && isRealAdmin ? query(collection(db, 'systemLogs'), orderBy('timestamp', 'desc'), limit(10)): null,
    [db, isRealAdmin]);
    const { data: systemLogs, isLoading: isLoadingSystemLogs } = useCollection<SystemLog>(systemLogsQuery);

    const [isLoadingData, setIsLoadingData] = useState(true);

    const filteredSystemLogs = useMemo(() => {
        if (!systemLogs) return [];
        return systemLogs.filter(log => 
            log.message && !log.message.includes('No Default Bucket')
        );
    }, [systemLogs]);

    const fetchDataAndSeed = useCallback(async () => {
        if (!db || !auth) return;
        setIsLoadingData(true);
        try {
            await SubscriptionPlanService.getActiveSubscriptionPlans(db);

            const [allProjects, allUsers] = await Promise.all([
                ProjectService.getAllProjectsForAdmin(auth),
                AuthService.getAllUsers(db),
            ]);
            setProjects(allProjects);
            setUsers(allUsers);
        } catch (error: any) {
            toast({ title: 'Error fetching admin data', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoadingData(false);
        }
    }, [toast, db, auth]);

    useEffect(() => {
        if (isUserLoading) return;

        if (user && userProfile) {
            const isAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin';
            if (!isAdmin) {
                 if (pathname !== '/guest') {
                    toast({ title: 'Access Denied', description: 'Redirecting to your dashboard.', variant: 'destructive' });
                }
                router.replace('/guest');
            } else {
                fetchDataAndSeed();
            }
        } else if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, userProfile, isUserLoading, router, toast, fetchDataAndSeed, pathname]);

    const handleApproveRequest = async (request: PaymentRequest) => {
        if (!db || !auth) return;
        setIsProcessing(request.id);
        try {
            await PaymentRequestService.updatePaymentRequestStatus(db, auth, request.id, 'approved');
            toast({ title: 'Request Approved' });
            
            const params = new URLSearchParams();
            params.set('email', request.email);
            params.set('name', request.fullName);
            params.set('plan', request.plan);
            if (request.whatsapp) params.set('whatsapp', request.whatsapp);
            if (request.screenshotUrl) params.set('receiptUrl', request.screenshotUrl);

            router.push(`/manual-accounts?${params.toString()}`);
        } catch (error: any) {
            toast({ title: 'Approval Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsProcessing(null);
        }
    };
    
    const stats = useMemo(() => {
        const totalProjects = projects.length;
        const totalUsers = users.length;
        let videoGenerations = 0;
        let scriptGenerations = 0;
        
        projects.forEach(p => {
            videoGenerations += p.videoGenerations?.length || 0;
            scriptGenerations += p.episodes?.length || 0;
        });

        const totalRevenue = 1234.56;
        const totalCreditsAvailable = users.reduce((acc, user) => acc + (user.wallet?.credits || 0), 0);
        const totalCreditsSpent = users.reduce((acc, user) => acc + (user.wallet?.spent || 0), 0);
        
        return { totalProjects, totalUsers, videoGenerations, scriptGenerations, totalRevenue, totalCreditsAvailable, totalCreditsSpent };
    }, [projects, users]);

    const pendingRequests = useMemo(() => {
        if (!paymentRequests) return [];
        return paymentRequests.filter(p => p.status === 'pending');
    }, [paymentRequests]);


    const showSkeleton = isUserLoading || isLoadingData || isLoadingPaymentRequests;
    
    if (isUserLoading || !userProfile || !db || !auth) {
        return (
            <StudioLayout>
                <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </StudioLayout>
        );
    }
    
    return (
        <StudioLayout>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl flex items-center gap-2">
                            <ShieldCheck/> {t('admin_dashboard')}
                            <Badge variant="outline">v{packageJson.version}</Badge>
                        </CardTitle>
                        <CardDescription>{t('system_wide_stats')}</CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('platform_statistics')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t('total_revenue')}</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent><div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div></CardContent>
                            </Card>
                                <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t('total_users')}</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent><div className="text-2xl font-bold">{showSkeleton ? <Loader2 className="h-6 w-6 animate-spin"/> : stats.totalUsers}</div></CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t('credits_available')}</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent><div className="text-2xl font-bold">{showSkeleton ? <Loader2 className="h-6 w-6 animate-spin"/> : stats.totalCreditsAvailable.toLocaleString()}</div></CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t('credits_spent')}</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent><div className="text-2xl font-bold">{showSkeleton ? <Loader2 className="h-6 w-6 animate-spin"/> : stats.totalCreditsSpent.toLocaleString()}</div></CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t('active_projects')}</CardTitle>
                                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent><div className="text-2xl font-bold">{showSkeleton ? <Loader2 className="h-6 w-6 animate-spin"/> : stats.totalProjects}</div></CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t('pending_payments')}</CardTitle>
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent><div className="text-2xl font-bold">{showSkeleton ? <Loader2 className="h-6 w-6 animate-spin"/> : pendingRequests.length}</div></CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t('video_generations')}</CardTitle>
                                    <Film className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent><div className="text-2xl font-bold">{showSkeleton ? <Loader2 className="h-6 w-6 animate-spin"/> : stats.videoGenerations}</div></CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{t('script_generations')}</CardTitle>
                                    <BookCopy className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent><div className="text-2xl font-bold">{showSkeleton ? <Loader2 className="h-6 w-6 animate-spin"/> : stats.scriptGenerations}</div></CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            {t('pending_payment_requests')}
                            <Button variant="outline" size="sm" asChild><Link href="/payment-requests"><Eye className="mr-2 h-4 w-4"/> {t('view_all')}</Link></Button>
                        </CardTitle>
                        <CardDescription>{t('review_and_approve')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('guest')}</TableHead>
                                    <TableHead>{t('plan')}</TableHead>
                                    <TableHead>{t('date')}</TableHead>
                                    <TableHead className="text-right">{t('action')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {showSkeleton ? <TableRowSkeleton columns={4} rows={3} /> :
                                 pendingRequests.length > 0 ? (
                                    pendingRequests.slice(0, 5).map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell>
                                                <div className="font-medium">{req.fullName}</div>
                                                <div className="text-sm text-muted-foreground">{req.email}</div>
                                            </TableCell>
                                            <TableCell className="capitalize">{req.plan}</TableCell>
                                            <TableCell>{req.createdAt?.toDate ? format(req.createdAt.toDate(), 'PP') : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => handleApproveRequest(req)} disabled={isProcessing === req.id}>
                                                    {isProcessing === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4"/>}
                                                    {t('approve')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                 ) : (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">{t('no_pending_requests')}</TableCell></TableRow>
                                 )
                                }
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                
                <div className="grid gap-8 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><History /> {t('recent_activity')}</CardTitle>
                            <CardDescription>{t('recent_admin_actions')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('action')}</TableHead>
                                        <TableHead>{t('actor')}</TableHead>
                                        <TableHead>{t('time')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {isLoadingLogs || showSkeleton ? (
                                        <TableRowSkeleton columns={3} rows={4} />
                                    ) : activityLogs && activityLogs.length > 0 ? (
                                        activityLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>
                                                    <div className="font-medium capitalize">{log.action?.replace(/_/g, ' ') || 'Unknown Action'}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-xs">{log.details ? Object.values(log.details).join(', ') : 'No details'}</div>
                                                </TableCell>
                                                <TableCell>{log.actorEmail || 'System'}</TableCell>
                                                <TableCell className="text-muted-foreground">{log.timestamp?.toDate ? format(log.timestamp.toDate(), 'Pp') : 'No timestamp'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                         <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">{t('no_recent_activity')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Bug className="text-destructive" /> {t('system_error_logs')}</CardTitle>
                            <CardDescription>{t('recent_client_errors')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('message')}</TableHead>
                                        <TableHead>{t('user_id')}</TableHead>
                                        <TableHead>{t('time')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {isLoadingSystemLogs || showSkeleton ? (
                                        <TableRowSkeleton columns={3} rows={4} />
                                    ) : filteredSystemLogs && filteredSystemLogs.length > 0 ? (
                                        filteredSystemLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>
                                                    <div className="font-medium capitalize">{log.level || 'info'}: {log.message || 'No message provided.'}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-md">{log.context ? JSON.stringify(log.context) : ''}</div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{log.uid || 'N/A'}</TableCell>
                                                <TableCell className="text-muted-foreground">{log.timestamp?.toDate ? format(log.timestamp.toDate(), 'Pp') : 'No timestamp'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                         <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">{t('no_recent_system_errors')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </StudioLayout>
    );
}
