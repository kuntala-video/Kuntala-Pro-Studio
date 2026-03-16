'use client';

import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StudioLayout } from "@/components/studio-layout";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { useFirebase } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BackupManagerSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Skeleton className="h-6 w-1/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-48" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const BackupManager = dynamic(
    () => import('@/components/backup-manager').then(mod => mod.BackupManager),
    { 
        ssr: false,
        loading: () => <BackupManagerSkeleton /> 
    }
);

export default function SettingsPage() {
    const { user, userProfile, isLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const { auth, db } = useFirebase();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const isSuperAdmin = userProfile?.role === 'super_admin';
    
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth || !db) return;
        if (newPassword !== confirmPassword) {
            toast({ title: 'Passwords do not match', variant: 'destructive' });
            return;
        }
        if (newPassword.length < 8) {
            toast({ title: 'Password too short', description: 'New password must be at least 8 characters long.', variant: 'destructive' });
            return;
        }

        setIsChangingPassword(true);
        try {
            await AuthService.changePassword(auth, db, currentPassword, newPassword);
            toast({ title: 'Password Updated Successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast({ title: 'Password Change Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsChangingPassword(false);
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

  return (
    <StudioLayout>
        {isSuperAdmin ? (
            <div className="space-y-6">
                <BackupManager />
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                    <KeyRound className="text-primary"/> Security Settings
                    </CardTitle>
                    <CardDescription>
                    Manage your Super Admin account password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                        <div className="grid gap-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required disabled={isChangingPassword} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isChangingPassword} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isChangingPassword} />
                        </div>
                        <Button type="submit" disabled={isChangingPassword}>
                            {isChangingPassword ? <Loader2 className="animate-spin mr-2"/> : null}
                            Change Password
                        </Button>
                    </form>
                </CardContent>
                </Card>
            </div>
        ) : (
            <div className="flex h-full w-full items-center justify-center">
                <Card className="text-center p-8">
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>You do not have permission to view this page.</CardDescription>
                </Card>
            </div>
        )}
    </StudioLayout>
  );
}
