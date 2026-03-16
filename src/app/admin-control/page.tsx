'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/provider';
import { AuthService } from '@/lib/auth';
import { ProjectService } from '@/lib/projects';
import type { UserProfile, Project, UserPermissions } from '@/lib/types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ActivityLogService } from '@/lib/activity-log';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { StudioLayout } from '@/components/studio-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Users, Trash2, ToggleLeft, ToggleRight, UserPlus, KeyRound, Edit, Film, Video, CreditCard, MicVocal, Calendar as CalendarIcon, Mail, MessageSquare, Copy, Check, RefreshCw, FolderKanban } from 'lucide-react';
import { TableRowSkeleton } from '@/components/skeletons';
import { Badge } from '@/components/ui/badge';

export default function AdminControlPage() {
    const { user: adminUser, userProfile, isLoading: isUserLoading } = useUser();
    const { firestore: db, auth } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    
    const [userToReset, setUserToReset] = useState<UserProfile | null>(null);
    const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);

    // Create User State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserProfile['role']>('subscriber');
    const [newPlan, setNewPlan] = useState<UserProfile['plan']>('free');
    const [newUserCredits, setNewUserCredits] = useState(100);

    // Edit User State
    const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editedDisplayName, setEditedDisplayName] = useState('');
    const [editedUserRole, setEditedUserRole] = useState<UserProfile['role']>('subscriber');
    const [editedUserPlan, setEditedUserPlan] = useState<UserProfile['plan']>('free');
    const [editedExpiryDate, setEditedExpiryDate] = useState<Date | undefined>(undefined);
    const [editedUserPermissions, setEditedUserPermissions] = useState<UserProfile['permissions']>({
        animation: false,
        reels: false,
        voiceClone: false,
        avatar: false,
        cinematic: false,
    });
    const [editedWallet, setEditedWallet] = useState<{ credits: number; spent: number }>({ credits: 0, spent: 0 });

    // State for credential delivery
    const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
    const [newlyCreatedUser, setNewlyCreatedUser] = useState<{email: string, password: string, plan: UserProfile['plan'], expiry?: Date, credits: number, receiptUrl?: string} | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const userProjectCounts = useMemo(() => {
        const counts = new Map<string, number>();
        projects.forEach(project => {
            if (project.ownerId) {
                counts.set(project.ownerId, (counts.get(project.ownerId) || 0) + 1);
            }
        });
        return counts;
    }, [projects]);

    const fetchData = useCallback(async () => {
        if (!db || !auth) return;
        setIsLoadingData(true);
        try {
            const [allUsers, allProjects] = await Promise.all([
                AuthService.getAllUsers(db),
                ProjectService.getAllProjectsForAdmin(auth),
            ]);
            setUsers(allUsers);
            setProjects(allProjects as Project[]);
        } catch (error: any) {
            toast({ title: 'Error fetching data', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoadingData(false);
        }
    }, [toast, db, auth]);

    useEffect(() => {
        if (isUserLoading) return;
        if (adminUser && userProfile) {
            const isAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin';
            if (!isAdmin) {
                toast({ title: 'Access Denied', description: 'You do not have permission to view this page.', variant: 'destructive' });
                router.replace('/guest');
            } else {
                fetchData();
            }
        }
    }, [adminUser, userProfile, isUserLoading, router, fetchData, toast]);
    
     useEffect(() => {
        if (userToEdit) {
            setEditedDisplayName(userToEdit.displayName || '');
            setEditedUserRole(userToEdit.role);
            setEditedUserPlan(userToEdit.plan);
            setEditedExpiryDate(userToEdit.subscriptionEnd?.toDate ? userToEdit.subscriptionEnd.toDate() : undefined);
            setEditedUserPermissions(userToEdit.permissions || { animation: false, reels: false, voiceClone: false, avatar: false, cinematic: false });
            setEditedWallet(userToEdit.wallet || { credits: 0, spent: 0 });
        }
    }, [userToEdit]);

    const handleToggleAccountStatus = async (user: UserProfile) => {
        if (!db || !auth) return;
        setIsProcessing(user.id);
        const newStatus = !(user.disabled || false);
        try {
            await AuthService.toggleUserAccount(db, auth, user.id, newStatus);
            toast({ title: 'User Status Updated', description: `${user.email}'s account has been ${newStatus ? 'suspended' : 'activated'}.` });
            fetchData();
        } catch (error: any) {
            toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsProcessing(null);
        }
    };
    
    const handleDeleteUser = async () => {
        if (!userToDelete || !db || !auth) return;
        setIsProcessing(userToDelete.id);
        try {
            await AuthService.deleteUser(db, auth, userToDelete.id);
            toast({ title: 'User Deleted', description: `User ${userToDelete.email} has been deleted.`});
            fetchData();
        } catch (error: any) {
            toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsProcessing(null);
            setIsDeleteAlertOpen(false);
            setUserToDelete(null);
        }
    };

    const generateSecurePassword = () => {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        let password = "";
        const requirements = [
            /[a-z]/,
            /[A-Z]/,
            /[0-9]/,
            /[!@#$%^&*()]/
        ];
        
        while (true) {
            password = "";
            for (let i = 0; i < length; i++) {
                password += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            if (requirements.every(regex => regex.test(password))) {
                break;
            }
        }
        setNewUserPassword(password);
    };

    const handleCreateUser = async () => {
        if (!auth || !db) return;
        if (!newUserEmail || !newUserPassword) {
            toast({ title: "Email and password are required.", variant: 'destructive'});
            return;
        }
        setIsCreatingUser(true);
        try {
            let subscriptionEndDate: Date | undefined = undefined;
            const now = new Date();
            if (newPlan === 'monthly') {
                subscriptionEndDate = new Date(new Date().setDate(now.getDate() + 30));
            } else if (newPlan === 'quarterly') {
                subscriptionEndDate = new Date(new Date().setDate(now.getDate() + 90));
            } else if (newPlan === 'yearly' || newPlan === 'enterprise') {
                subscriptionEndDate = new Date(new Date().setFullYear(now.getFullYear() + 1));
            }

            await AuthService.createUser(auth, db, {
                email: newUserEmail,
                password: newUserPassword,
                displayName: newDisplayName,
                role: newUserRole,
                plan: newPlan,
                subscriptionEnd: subscriptionEndDate,
                wallet: {
                    credits: newUserCredits,
                    spent: 0,
                },
            });

            toast({ title: 'User Created', description: `Account for ${newUserEmail} has been created.` });
            fetchData();

            setNewlyCreatedUser({
                email: newUserEmail,
                password: newUserPassword,
                plan: newPlan,
                expiry: subscriptionEndDate,
                credits: newUserCredits,
            });

            setIsCreateModalOpen(false);
            setShowCredentialsDialog(true);
            
            setNewDisplayName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('subscriber');
            setNewPlan('free');
            setNewUserCredits(100);
        } catch (error: any) {
            toast({ title: 'User Creation Failed', description: error.message, variant: 'destructive'});
        } finally {
            setIsCreatingUser(false);
        }
    };
    
    const handlePlanChangeForEdit = (newPlan: UserProfile['plan']) => {
        setEditedUserPlan(newPlan);

        // Only auto-update permissions for subscribers. Privileged users' permissions are managed manually.
        if (userToEdit?.role === 'subscriber') {
            const newPermissions: UserPermissions = {
                animation: true,
                reels: true,
                voiceClone: newPlan === 'quarterly' || newPlan === 'yearly' || newPlan === 'enterprise',
                avatar: newPlan === 'yearly' || newPlan === 'enterprise',
                cinematic: newPlan === 'enterprise',
            };
            setEditedUserPermissions(newPermissions);
        }
    };

    const handleUpdateUser = async () => {
        if (!userToEdit || !db || !auth) return;
        setIsProcessing(userToEdit.id);
        try {
            const userDocRef = doc(db, 'users', userToEdit.id);
            const updates: Partial<UserProfile> = {
                displayName: editedDisplayName,
                role: editedUserRole,
                plan: editedUserPlan,
                subscriptionEnd: editedExpiryDate,
                permissions: editedUserPermissions,
                wallet: editedWallet,
                updatedAt: serverTimestamp() as any,
            };
            await updateDoc(userDocRef, updates);
            
            await ActivityLogService.logAdminAction(auth, db, 'user_profile_updated', {
                targetUid: userToEdit.id,
                targetEmail: userToEdit.email,
                changes: { role: editedUserRole, plan: editedUserPlan, permissions: editedUserPermissions, wallet: editedWallet }
            });
            
            toast({ title: 'User Updated', description: `${userToEdit.email}'s profile has been updated.` });
            fetchData();
            setIsEditModalOpen(false);
        } catch (error: any) {
            toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsProcessing(null);
            setUserToEdit(null);
        }
    };


    const handleResetPassword = async () => {
        if (!userToReset || !auth || !db) return;
        setIsProcessing(userToReset.id);
        try {
            await AuthService.sendPasswordResetEmailToUser(auth, db, userToReset.email);
            toast({ title: 'Password Reset Email Sent', description: `An email has been sent to ${userToReset.email}.`});
        } catch (error: any) {
            toast({ title: 'Failed to Send Email', description: error.message, variant: 'destructive' });
        } finally {
            setIsProcessing(null);
            setIsResetAlertOpen(false);
            setUserToReset(null);
        }
    };

    const showSkeleton = isUserLoading || isLoadingData;

    let messageBody = '';
    if (newlyCreatedUser) {
        messageBody = `Your account is ready ✅

User ID: ${newlyCreatedUser.email}
Password: ${newlyCreatedUser.password}

Plan: ${newlyCreatedUser.plan}
Expiry: ${newlyCreatedUser.expiry ? format(newlyCreatedUser.expiry, 'dd/MM/yyyy') : 'N/A'}
Credits: ${newlyCreatedUser.credits}

Payment received successfully.`;
        if (newlyCreatedUser.receiptUrl) {
            messageBody += `
Receipt: ${newlyCreatedUser.receiptUrl}`;
        }
    }

    const handleCopyToClipboard = () => {
        if (!messageBody) return;
        navigator.clipboard.writeText(messageBody);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (!db || !auth) {
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
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl flex items-center justify-between">
                            <div className="flex items-center gap-2"><Users/> User Control Panel</div>
                            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline"><UserPlus className="mr-2"/> Create User</Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Create New User</DialogTitle>
                                        <DialogDescription>
                                            Manually create a new user account and set their initial plan and permissions.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="new-name">Display Name (Username)</Label>
                                            <Input id="new-name" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} disabled={isCreatingUser} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="new-email">Email</Label>
                                            <Input id="new-email" type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} disabled={isCreatingUser} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="new-password">Password</Label>
                                            <div className="flex gap-2">
                                                <Input id="new-password" type="text" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} disabled={isCreatingUser} placeholder="Enter or generate a password" />
                                                <Button type="button" variant="outline" size="icon" onClick={generateSecurePassword} disabled={isCreatingUser}>
                                                    <RefreshCw className="h-4 w-4" />
                                                    <span className="sr-only">Generate Password</span>
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="new-role">Role</Label>
                                                <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)} disabled={isCreatingUser}>
                                                    <SelectTrigger id="new-role"><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="subscriber">Subscriber</SelectItem>
                                                        <SelectItem value="staff">Staff</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                             <div className="grid gap-2">
                                                <Label htmlFor="new-plan">Plan</Label>
                                                <Select value={newPlan} onValueChange={(value: any) => setNewPlan(value)} disabled={isCreatingUser}>
                                                    <SelectTrigger id="new-plan"><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="free">Free</SelectItem>
                                                        <SelectItem value="monthly">Monthly</SelectItem>
                                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                                        <SelectItem value="yearly">Yearly</SelectItem>
                                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="new-credits">Initial Credits</Label>
                                            <Input id="new-credits" type="number" value={newUserCredits} onChange={e => setNewUserCredits(Number(e.target.value) || 0)} placeholder="e.g., 100" disabled={isCreatingUser}/>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline" disabled={isCreatingUser}>Cancel</Button></DialogClose>
                                        <Button onClick={handleCreateUser} disabled={isCreatingUser || !newUserEmail || !newUserPassword}>
                                            {isCreatingUser ? <Loader2 className="mr-2 animate-spin"/> : 'Create'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardTitle>
                        <CardDescription>Manage user accounts, roles, and permissions across the platform.</CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">All Users <Badge variant="outline">{users.length}</Badge></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Projects</TableHead>
                                    <TableHead>Expires On</TableHead>
                                    <TableHead>Credits</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {showSkeleton ? (
                                    <TableRowSkeleton columns={8} rows={5} />
                                ) : users.length > 0 ? (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                <div>{user.displayName || user.email}</div>
                                                {user.displayName && <div className="text-xs text-muted-foreground">{user.email}</div>}
                                            </TableCell>
                                            <TableCell><Badge variant={user.role === 'super_admin' ? 'destructive' : user.role === 'admin' ? 'default' : user.role === 'staff' ? 'secondary' : 'outline'}>{user.role}</Badge></TableCell>
                                            <TableCell><Badge variant={user.plan === 'enterprise' ? 'destructive' : user.plan === 'yearly' ? 'default' : user.plan === 'quarterly' ? 'secondary' : 'outline'}>{user.plan}</Badge></TableCell>
                                            <TableCell className='text-center'>{userProjectCounts.get(user.id) || 0}</TableCell>
                                            <TableCell>{user.subscriptionEnd?.toDate ? format(user.subscriptionEnd.toDate(), 'PP') : 'N/A'}</TableCell>
                                            <TableCell>{user.wallet?.credits ?? 0}</TableCell>
                                            <TableCell>
                                                {user.disabled ? (
                                                    <Badge variant="destructive">Suspended</Badge>
                                                ) : (
                                                    <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button size="sm" variant="outline" onClick={() => { setUserToEdit(user); setIsEditModalOpen(true); }} disabled={!!isProcessing || user.id === userProfile?.id || user.role === 'super_admin'}>
                                                    <Edit className="mr-2 h-4 w-4"/> Edit
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleToggleAccountStatus(user)} disabled={!!isProcessing || user.id === userProfile?.id || user.role === 'super_admin'}>
                                                    {isProcessing === user.id ? <Loader2 className="animate-spin" /> : (user.disabled ? <ToggleRight/> : <ToggleLeft/>)}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => { setUserToReset(user); setIsResetAlertOpen(true); }} disabled={!!isProcessing || user.id === userProfile?.id}>
                                                     <KeyRound/>
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => { setUserToDelete(user); setIsDeleteAlertOpen(true); }} disabled={!!isProcessing || user.id === userProfile?.id || user.role === 'super_admin'}>
                                                     <Trash2/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">No users found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
             <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user profile for <span className="font-bold">{userToDelete?.email}</span> from the database. It does not delete their authentication record, so they may still be able to log in but will have no associated data or permissions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing === userToDelete?.id} onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90" disabled={isProcessing === userToDelete?.id}>
                            {isProcessing === userToDelete?.id ? <Loader2 className="animate-spin" /> : "Yes, delete user"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={isResetAlertOpen} onOpenChange={setIsResetAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to send a password reset email?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will send a password reset link to <span className="font-bold">{userToReset?.email}</span>. The user will then be able to set a new password.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing === userToReset?.id} onClick={() => setUserToReset(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetPassword} disabled={isProcessing === userToReset?.id}>
                            {isProcessing === userToReset?.id ? <Loader2 className="animate-spin" /> : "Yes, Send Email"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit User: {userToEdit?.email}</DialogTitle>
                        <DialogDescription>
                            Promote, downgrade, or modify the user's role, plan, and feature permissions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Display Name (Username)</Label>
                            <Input id="edit-name" value={editedDisplayName} onChange={e => setEditedDisplayName(e.target.value)} disabled={isProcessing === userToEdit?.id} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select value={editedUserRole} onValueChange={(value) => setEditedUserRole(value as UserProfile['role'])} disabled={isProcessing === userToEdit?.id}>
                                <SelectTrigger id="edit-role"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="subscriber">Subscriber</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-plan">Plan</Label>
                            <Select value={editedUserPlan} onValueChange={handlePlanChangeForEdit} disabled={isProcessing === userToEdit?.id}>
                                <SelectTrigger id="edit-plan"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Subscription Expiry Date</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("justify-start text-left font-normal", !editedExpiryDate && "text-muted-foreground")} disabled={isProcessing === userToEdit?.id}>
                                        <CalendarIcon className="mr-2"/>
                                        {editedExpiryDate ? format(editedExpiryDate, "PPP") : <span>No expiry</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editedExpiryDate} onSelect={setEditedExpiryDate} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label>Permissions</Label>
                            <div className="space-y-3 rounded-md border p-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="perm-animation" className="font-normal flex items-center gap-2"><Film/> Animation Studio</Label>
                                    <Switch
                                        id="perm-animation"
                                        checked={editedUserPermissions?.animation ?? false}
                                        onCheckedChange={(checked) => setEditedUserPermissions(p => ({...p, animation: checked}))}
                                        disabled={isProcessing === userToEdit?.id}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="perm-reels" className="font-normal flex items-center gap-2"><Video/> Reels Generator</Label>
                                    <Switch
                                        id="perm-reels"
                                        checked={editedUserPermissions?.reels ?? false}
                                        onCheckedChange={(checked) => setEditedUserPermissions(p => ({...p, reels: checked}))}
                                        disabled={isProcessing === userToEdit?.id}
                                    />
                                </div>
                                 <div className="flex items-center justify-between">
                                    <Label htmlFor="perm-avatar" className="font-normal flex items-center gap-2"><Users/> 3D Avatar Creator</Label>
                                    <Switch
                                        id="perm-avatar"
                                        checked={editedUserPermissions?.avatar ?? false}
                                        onCheckedChange={(checked) => setEditedUserPermissions(p => ({...p, avatar: checked}))}
                                        disabled={isProcessing === userToEdit?.id}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="perm-cinematic" className="font-normal flex items-center gap-2"><Video/> Cinematic Camera</Label>
                                    <Switch
                                        id="perm-cinematic"
                                        checked={editedUserPermissions?.cinematic ?? false}
                                        onCheckedChange={(checked) => setEditedUserPermissions(p => ({...p, cinematic: checked}))}
                                        disabled={isProcessing === userToEdit?.id}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="perm-voiceClone" className="font-normal flex items-center gap-2"><MicVocal/> Voice Clone</Label>
                                    <Switch
                                        id="perm-voiceClone"
                                        checked={editedUserPermissions?.voiceClone ?? false}
                                        onCheckedChange={(checked) => setEditedUserPermissions(p => ({...p, voiceClone: checked}))}
                                        disabled={isProcessing === userToEdit?.id}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="flex items-center gap-2"><CreditCard /> Wallet</Label>
                            <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-credits">Credits</Label>
                                    <Input
                                        id="edit-credits"
                                        type="number"
                                        value={editedWallet.credits}
                                        onChange={(e) => setEditedWallet(w => ({ ...w, credits: Number(e.target.value) || 0 }))}
                                        disabled={isProcessing === userToEdit?.id}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-spent">Spent</Label>
                                    <Input
                                        id="edit-spent"
                                        type="number"
                                        value={editedWallet.spent}
                                        readOnly
                                        disabled
                                        className="bg-muted/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isProcessing === userToEdit?.id}>Cancel</Button>
                        <Button onClick={handleUpdateUser} disabled={isProcessing === userToEdit?.id}>
                            {isProcessing === userToEdit?.id ? <Loader2 className="animate-spin"/> : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Credentials Ready for Delivery</DialogTitle>
                        <DialogDescription>
                            The account for {newlyCreatedUser?.email} is ready. Send them their login credentials.
                        </DialogDescription>
                    </DialogHeader>
                    {newlyCreatedUser && (
                        <>
                            <div className="my-4 space-y-2">
                                <Label>Message Template</Label>
                                <Card className="bg-muted max-h-60 overflow-y-auto">
                                    <CardContent className="p-4 text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                                        {messageBody}
                                    </CardContent>
                                </Card>
                            </div>
                            <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
                                <Button variant="outline" onClick={handleCopyToClipboard} className="w-full sm:w-auto">
                                    {isCopied ? <Check className="mr-2"/> : <Copy className="mr-2"/>}
                                    {isCopied ? 'Copied!' : 'Copy Text'}
                                </Button>
                                <div className="flex justify-end gap-2 w-full sm:w-auto">
                                    <Button asChild variant="secondary">
                                        <a href={`mailto:${newlyCreatedUser.email}?subject=Your%20Kuntala%20Pro%20Studio%20Account%20is%20Ready&body=${encodeURIComponent(messageBody)}`} target="_blank">
                                            <Mail className="mr-2"/> Email
                                        </a>
                                    </Button>
                                    <Button asChild>
                                        <a href={`https://wa.me/?text=${encodeURIComponent(messageBody)}`} target="_blank">
                                            <MessageSquare className="mr-2"/> WhatsApp
                                        </a>
                                    </Button>
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </StudioLayout>
    );
}

    