"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { deleteCookie } from "cookies-next/client";
import Image from "next/image";
import { ChartPie, Users } from "@phosphor-icons/react";

const EducatorSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();

    ["__fb_user"].forEach((cookie) => {
      deleteCookie(cookie.trim(), {
        domain: `.${window.location.hostname}`,
        path: "/",
      });
    });

    window.location.href = "/auth/login";
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size={"lg"} asChild>
              <Link href="/educator/dashboard">
                <Image
                  src="/brand/logo.png"
                  alt="Feebook Logo"
                  width={40}
                  height={40}
                  className="aspect-square size-10 object-contain"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Feebook</span>
                  <span className="truncate text-xs">For Educators</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/educator/dashboard">
                <ChartPie size={40} />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/educator/students">
                <Users size={40} />
                <span>Students</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button variant="destructive" onClick={logout}>
                <LogOut />
                <span>Logout</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default EducatorSidebar;
