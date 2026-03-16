"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, LogOut, User, LifeBuoy, Settings, ShieldCheck, Users, FolderKanban, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { AuthService } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { auth, db } from "@/lib/firebase";
import { useProject } from "@/context/project-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useTranslation } from "@/context/i18n-context";

export const AppHeader = React.memo(function AppHeader() {
  const { user, userProfile } = useUser();
  const { projects, selectedProjectId, setSelectedProjectId, isLoading: areProjectsLoading } = useProject();
  const router = useRouter();
  const { setLanguage, t } = useTranslation();

  const handleLogout = async () => {
    await AuthService.signOut(auth, db);
    router.push('/login');
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  }

  const isAdmin = userProfile && ['admin', 'super_admin'].includes(userProfile.role);
  const isSuperAdmin = userProfile?.role === 'super_admin';

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30 border-t-4 border-primary">
      <SidebarTrigger className="md:hidden" />
      <div className="flex items-center gap-2 md:hidden">
        <Logo className="h-8 w-8" />
        <h1 className="font-headline text-lg font-semibold tracking-wider">
          Kuntala
        </h1>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <Select value={selectedProjectId || ''} onValueChange={(value) => value && setSelectedProjectId(value)} disabled={areProjectsLoading}>
            <SelectTrigger className="w-[180px] lg:w-[250px] h-9">
                <div className="flex items-center gap-2 truncate">
                  <FolderKanban className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                  <SelectValue placeholder={areProjectsLoading ? "Loading..." : "Select a Project"} />
                </div>
            </SelectTrigger>
            <SelectContent>
                {areProjectsLoading ? (
                    <div className="p-4 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                    </div>
                ) : projects.length > 0 ? (
                    projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                            {project.title}
                        </SelectItem>
                    ))
                ) : (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                        No projects found.
                    </div>
                )}
            </SelectContent>
        </Select>
      </div>


      <div className="ml-auto flex items-center gap-4">
        <Badge variant="outline" className="hidden sm:flex">Kuntala Pro Studio</Badge>
        <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Globe className="h-4 w-4" />
              <span className="sr-only">Toggle language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('en')}>{t('english')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('bn')}>{t('bengali')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || ''} alt={user.email || ''} />
                  <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.email}</p>
                  <Badge variant={isAdmin ? 'destructive' : 'secondary'} className="w-fit">{userProfile?.role}</Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              {isSuperAdmin && (
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => router.push('/support')}>
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Support</span>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Admin</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => router.push('/admin-dashboard')}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => router.push('/admin-control')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>User Management</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
});
