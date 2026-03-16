
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/provider';
import { AuthService } from '@/lib/auth';
import type { UserProfile } from '@/lib/types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { StudioLayout } from '@/components/studio-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, ToggleLeft, ToggleRight, ShieldCheck, UserPlus, Edit, KeyRound } from 'lucide-react';
import { TableRowSkeleton } from '@/components/skeletons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminStaffPage() {
    const { user: adminUser, userProfile, isLoading: isUserLoading } = useUser();
    const { firestore: db, auth } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();

    const [staff, setStaff] = useState<UserProfile[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

    // Create/Edit State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
    const [editedDisplayName, setEditedDisplayName] = useState('');
    const [editedUserRole, setEditedUserRole] = useState<UserProfile['role']>('staff');
    
    const [newDisplayName, setNewDisplayName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserProfile['role']>('staff');

    const isSuperAdmin = userProfile?.role === 'super_admin';

    const fetchData = useCallback(async () => {
        if (!db) return;
        setIsLoadingData(true);
        
        const fetchPromise = AuthService.getAllUsers(db);
        const timeoutPromise = new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), 1200));

        try {
            const result = await Promise.race([fetchPromise, timeoutPromise]);
            if (result === 'timeout') {
                toast({ title: 'Staff Fetch Timed Out', description: 'Displaying empty list.', variant: 'destructive' });
                setStaff([]);
            } else {
                const allUsers = result as UserProfile[];
                const adminStaff = allUsers.filter(u => u.role === 'admin' || u.role === 'super_admin' || u.role === 'staff');
                setStaff(adminStaff);
            }
        } catch (error: any) {
            toast({ title: 'Error fetching staff', description: error.message, variant: 'destructive' });
            setStaff([]);
        } finally {
            setIsLoadingData(false);
        }
    }, [toast, db]);

    useEffect(() => {
        if (isUserLoading) return;
        if (isSuperAdmin) {
            fetchData();
        } else {
            setIsLoadingData(false);
        }
    }, [isSuperAdmin, isUserLoading, fetchData]);

    useEffect(() => {
        if (userToEdit) {
            setEditedDisplayName(userToEdit.displayName || '');
            setEditedUserRole(userToEdit.role);
        }
    }, [userToEdit]);

    const handleToggleAccountStatus = async (user: UserProfile) => {
        if (!db || !auth) return;
        setIsProcessing(user.id);
        const newStatus = !user.disabled;
        try {
            await AuthService.toggleUserAccount(db, auth, user.id, newStatus);
            toast({ title: 'Staff Status Updated' });
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
            toast({ title: 'Staff Deleted' });
            fetchData();
        } catch (error: any) {
            toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsProcessing(null);
            setUserToDelete(null);
        }
    };
    
    const handleCreateStaff = async () => {
        if (!auth || !db) return;
        setIsSubmitting(true);
        try {
            await AuthService.createUser(auth, db, {
                email: newUserEmail,
                password: newUserPassword,
                displayName: newDisplayName,
                role: newUserRole,
                plan: newUserRole === 'staff' ? 'yearly' : 'enterprise',
            });
            toast({ title: 'Staff Created', description: `Account for ${newUserEmail} created.`});
            fetchData();
            setIsCreateModalOpen(false);
            setNewDisplayName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('staff');
        } catch (error: any) {
            toast({ title: 'Creation Failed', description: error.message, variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStaff = async () => {
        if (!userToEdit || !db) return;
        setIsSubmitting(true);
        try {
            const userDocRef = doc(db, 'users', userToEdit.id);
            await updateDoc(userDocRef, {
                displayName: editedDisplayName,
                role: editedUserRole,
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Staff Updated' });
            fetchData();
            setIsEditModalOpen(false);
        } catch (error: any) {
            toast({ title: 'Update Failed', description: error.message, variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const showSkeleton = isUserLoading || (isLoadingData && isSuperAdmin);
    
    if (isUserLoading) {
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
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline text-3xl flex items-center gap-2">
                            <ShieldCheck/> Admin Staff Management
                        </CardTitle>
                        <CardDescription>Manage administrator and staff accounts. Only Super Admins can access this page.</CardDescription>
                    </div>
                     <Button onClick={() => setIsCreateModalOpen(true)} disabled={!isSuperAdmin}><UserPlus className="mr-2"/> Create Staff</Button>
                </CardHeader>
                <CardContent>
                    {!isSuperAdmin ? (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p>You do not have permission to view or manage staff.</p>
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {showSkeleton ? (
                                <TableRowSkeleton columns={4} rows={3} />
                            ) : staff.length > 0 ? (
                                staff.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell>
                                            <div className="font-medium">{s.displayName || s.email}</div>
                                            {s.displayName && <div className="text-sm text-muted-foreground">{s.email}</div>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={s.role === 'super_admin' ? 'destructive' : s.role === 'admin' ? 'default' : 'secondary'}>{s.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={s.disabled ? "destructive" : "default"}>{s.disabled ? "Suspended" : "Active"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => {setUserToEdit(s); setIsEditModalOpen(true)}} disabled={!!isProcessing || s.role === 'super_admin'}>
                                                <Edit className="mr-2"/> Edit
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleToggleAccountStatus(s)} disabled={!!isProcessing || s.role === 'super_admin'}>
                                                {isProcessing === s.id ? <Loader2 className="animate-spin" /> : (s.disabled ? <ToggleRight/> : <ToggleLeft/>)}
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => setUserToDelete(s)} disabled={!!isProcessing || s.role === 'super_admin'}>
                                                <Trash2/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                 <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No staff added yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create Staff Dialog */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Staff Member</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2"><Label htmlFor="new-name">Display Name</Label><Input id="new-name" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} disabled={isSubmitting} /></div>
                        <div className="grid gap-2"><Label htmlFor="new-email">Email</Label><Input id="new-email" type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} disabled={isSubmitting} /></div>
                        <div className="grid gap-2"><Label htmlFor="new-password">Password</Label><Input id="new-password" type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} disabled={isSubmitting} /></div>
                        <div className="grid gap-2">
                            <Label htmlFor="new-role">Role</Label>
                            <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)} disabled={isSubmitting}>
                                <SelectTrigger id="new-role"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                        <Button onClick={handleCreateStaff} disabled={isSubmitting || !newUserEmail || !newUserPassword}>
                            {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Staff Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Staff Member: {userToEdit?.email}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2"><Label htmlFor="edit-name">Display Name</Label><Input id="edit-name" value={editedDisplayName} onChange={e => setEditedDisplayName(e.target.value)} disabled={isSubmitting} /></div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select value={editedUserRole} onValueChange={(value: any) => setEditedUserRole(value)} disabled={isSubmitting}>
                                <SelectTrigger id="edit-role"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <DialogFooter>
                        <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                        <Button onClick={handleUpdateStaff} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the account for <span className="font-bold">{userToDelete?.email}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={!!isProcessing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90" disabled={!!isProcessing}>
                            {isProcessing === userToDelete?.id ? <Loader2 className="animate-spin" /> : "Yes, delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </StudioLayout>
    );
}
