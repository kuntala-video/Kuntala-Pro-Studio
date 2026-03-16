'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { StudioLayout } from '@/components/studio-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2, User, CreditCard, Shield, Calendar, KeyRound, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthService } from '@/lib/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useTranslation } from '@/context/i18n-context';

export default function ProfilePage() {
    const { user, userProfile, isLoading, refreshUserProfile } = useUser();
    const { toast } = useToast();
    const { t } = useTranslation();

    const [displayName, setDisplayName] = useState('');
    const [isUpdatingName, setIsUpdatingName] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    
    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || '');
        }
    }, [userProfile]);

    const handleUpdateDisplayName = async () => {
        if (!user) return;
        if (!displayName.trim()) {
            toast({ title: 'Display Name cannot be empty', variant: 'destructive' });
            return;
        }
        setIsUpdatingName(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { displayName: displayName.trim() });
            toast({ title: 'Display Name Updated' });
            refreshUserProfile(); // Refresh context state
        } catch (error: any) {
            toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsUpdatingName(false);
        }
    };
    
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({ title: 'New passwords do not match', variant: 'destructive' });
            return;
        }
        if (newPassword.length < 6) { // Firebase default minimum
            toast({ title: 'Password too short', description: 'New password must be at least 6 characters.', variant: 'destructive' });
            return;
        }
        setIsChangingPassword(true);
        try {
            await AuthService.changePassword(auth, db, currentPassword, newPassword);
            toast({ title: 'Password Changed Successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast({ title: 'Password Change Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsChangingPassword(false);
        }
    };


    if (isLoading || !userProfile) {
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
            <div className="space-y-8 max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl flex items-center gap-2">
                           <User /> {t('my_profile')}
                        </CardTitle>
                        <CardDescription>{t('manage_your_account')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Label className="w-24">{t('email')}</Label>
                            <p className="text-muted-foreground">{userProfile.email}</p>
                        </div>
                         <div className="flex items-center gap-4">
                            <Label className="w-24" htmlFor="displayName">{t('display_name')}</Label>
                            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="max-w-xs" disabled={isUpdatingName} />
                            <Button onClick={handleUpdateDisplayName} size="sm" disabled={isUpdatingName || displayName === (userProfile.displayName || '')}>
                                {isUpdatingName ? <Loader2 className="animate-spin" /> : <Save />}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Shield /> {t('subscription')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center gap-4">
                                <Label className="w-28">{t('role')}</Label>
                                <p className="font-semibold capitalize">{userProfile.role.replace('_', ' ')}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Label className="w-28">{t('current_plan')}</Label>
                                <p className="font-semibold capitalize">{userProfile.plan}</p>
                            </div>
                             <div className="flex items-center gap-4">
                                <Label className="w-28 flex items-center gap-2"><CreditCard/>{t('credits')}</Label>
                                <p className="font-semibold">{userProfile.wallet?.credits ?? 0} <span className="text-sm text-muted-foreground font-normal">{t('remaining')}</span></p>
                            </div>
                             <div className="flex items-center gap-4">
                                <Label className="w-28 flex items-center gap-2"><Calendar /> {t('expires_on')}</Label>
                                <p className="font-semibold">
                                    {userProfile.subscriptionEnd ? format(userProfile.subscriptionEnd.toDate(), 'PPP') : t('never')}
                                </p>
                            </div>
                             <Button variant="outline" onClick={() => toast({title: t('coming_soon')})}>{t('manage_subscription')}</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><KeyRound/> {t('change_password')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="current-password">{t('current_password')}</Label>
                                    <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required disabled={isChangingPassword} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="new-password">{t('new_password')}</Label>
                                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isChangingPassword} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="confirm-password">{t('confirm_new_password')}</Label>
                                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isChangingPassword} />
                                </div>
                                <Button type="submit" disabled={isChangingPassword}>
                                    {isChangingPassword ? <Loader2 className="animate-spin mr-2"/> : null}
                                    {t('update_password')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </StudioLayout>
    );
}
