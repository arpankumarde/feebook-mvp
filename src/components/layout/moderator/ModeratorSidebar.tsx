"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { ModeratorSidebarData } from "@/data/moderator/sidebar.data";
import { usePathname, useRouter } from "next/navigation";
import { SLUGS } from "@/constants/slugs";
import Image from "next/image";
import { Separator } from "../../ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import { deleteCookie } from "cookies-next/client";
import { COOKIES } from "@/constants/cookies";
import { BRAND_SUPPORT_URL } from "@/data/common/brand";
import { useModeratorAuth } from "@/hooks/use-moderator-auth";

export function ModeratorSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { moderator } = useModeratorAuth();
  const { setOpenMobile } = useSidebar();

  const isActive = (key: string) => {
    return (
      pathname === `/${SLUGS.MODERATOR}/${key}` ||
      pathname.startsWith(`/${SLUGS.MODERATOR}/${key}/`)
    );
  };

  const logout = () => {
    deleteCookie(COOKIES.MODERATOR);
    router.push(`/`);
  };

  return (
    <Sidebar>
      <SidebarHeader className="bg-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src="/brand/icon.svg"
                    alt="Feebook"
                    height={50}
                    width={50}
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold text-brand/80 text-2xl">
                    Feebook
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <Separator />

      <SidebarContent className="bg-white">
        {ModeratorSidebarData.groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) =>
                  // show all normally, but if any item has superMod only key, then only show it if moderator?.isSuperMod is true
                  item.superModOnly && !moderator?.isSuperMod ? null : (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        size={"lg"}
                        asChild
                        className="hover:bg-primary/10 data-[active=true]:text-primary data-[active=true]:bg-primary/10"
                        isActive={isActive(item.key)}
                      >
                        <Link
                          href={
                            item.key === "support"
                              ? BRAND_SUPPORT_URL || "#"
                              : `/${SLUGS.MODERATOR}/${item.key}`
                          }
                          target={item.key === "support" ? "_blank" : "_self"}
                          className="text-lg font-semibold text-gray-700"
                          onClick={() => setOpenMobile(false)}
                          draggable="false"
                        >
                          <i className="size-6">{item.icon}</i>
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <Separator />

      <SidebarFooter className="bg-white">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between py-1.5">
            <div className="flex gap-3 items-center">
              <Avatar>
                <AvatarImage
                  src={`${process.env.NEXT_PUBLIC_USER_AVATAR_ENDPOINT}/${moderator?.name}`}
                />
                <AvatarFallback className="bg-primary/20">
                  {moderator?.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-sm">
                {moderator?.name} <br />
                <span className="-ml-1">{moderator?.email}</span>
              </span>
            </div>

            <Button variant="destructive" size="icon" onClick={logout}>
              <SignOutIcon weight="bold" />
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
