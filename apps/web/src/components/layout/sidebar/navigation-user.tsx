"use client";

import { ChevronsUpDown, InfoIcon, LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogContentContainer,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { clientAuth, useSession } from "@/lib/client-auth";
import LogoIcon from "@/components/assets/logo-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { MiniSwitch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export function NavigationUser() {
  const session = useSession();

  if (session.isPending) {
    return <Skeleton className="h-[142px] w-full" />;
  }

  // if user is null, return a login state
  if (!session.data) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="bg-muted-foreground/5 flex flex-col gap-1 rounded-lg p-4 shadow-xs">
            <div className="instrument-serif font-semibold">Login</div>
            <p className="text-muted-foreground text-xs">
              Login to your account to save your data and access your data anywhere
            </p>
            <LoginButtonModal />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <AllowDataSync defaultChecked={session.data.user.allowedSavingData ?? false} />
      </SidebarMenuItem>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              variant="dark"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground gap-3"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${session.data.user.email}`}
                  alt={session.data.user.name}
                />
                <AvatarFallback className="rounded-lg">L</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight tracking-tight">
                <span className="instrument-sans truncate font-semibold capitalize">{session.data.user.name}</span>
                <span className="jetbrains-mono text-muted-foreground truncate text-xs">{session.data.user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-lg"
            side="top"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${session.data.user.email}`}
                    alt={session.data.user.name}
                  />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{session.data.user.name}</span>
                  <span className="jetbrains-mono text-muted-foreground truncate text-xs">
                    {session.data.user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                clientAuth.signOut();
                session.refetch();
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

const LoginButtonModal = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleLogin = () => {
    setIsDisabled(true);

    clientAuth.signIn.social({
      provider: "google",
      callbackURL: pathname,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="mt-2.5 w-fit" variant="default" size="xs">
          Login
        </Button>
      </DialogTrigger>
      <DialogContent hideCloseButton>
        <DialogContentContainer className="flex items-center py-6 text-center">
          <LogoIcon />
          <div>
            <DialogTitle className="instrument-serif text-3xl font-semibold">Welcome back!</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Login with your google account to continue
            </DialogDescription>
          </div>
          <button disabled={isDisabled} className="mt-2 cursor-pointer" onClick={handleLogin}>
            <Image
              className="dark:hidden"
              src="/social/google-login-btn-light.svg"
              alt="Google Login"
              width={200}
              height={40}
              priority
            />
            <Image
              className="hidden dark:block"
              src="/social/google-login-btn-dark.svg"
              alt="Google Login"
              width={200}
              height={40}
              priority
            />
          </button>
        </DialogContentContainer>
      </DialogContent>
    </Dialog>
  );
};

const AllowDataSync = ({ defaultChecked }: { defaultChecked: boolean }) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [isChecked, setIsChecked] = useState(defaultChecked);

  const handleChange = (checked: boolean) => {
    setIsDisabled(true);

    clientAuth.updateUser({
      allowedSavingData: checked,
      fetchOptions: {
        onSuccess: () => {
          setIsChecked(checked);
          setIsDisabled(false);
        },
      },
    });
  };

  return (
    <div className="bg-muted-foreground/10 mb-2 flex w-full flex-row items-center justify-between rounded-md p-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex flex-row items-center justify-between gap-1.5 text-xs">
              Allow Data Sync <InfoIcon className="text-muted-foreground size-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent align="start" sideOffset={6}>
            <p>
              Allow data sync to your account. <br />
              This will allow us to save your data on
              <br /> our servers.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <MiniSwitch disabled={isDisabled} defaultChecked={isChecked} onCheckedChange={handleChange} />
    </div>
  );
};
