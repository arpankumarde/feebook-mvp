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
import { ConsumerSidebarData } from "@/data/consumer/sidebar.data";
import { usePathname, useRouter } from "next/navigation";
import { SLUGS } from "@/constants/slugs";
import Image from "next/image";
import { Separator } from "../../ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import { deleteCookie } from "cookies-next/client";
import { COOKIES } from "@/constants/cookies";
import { useConsumerAuth } from "@/hooks/use-consumer-auth";

export function ConsumerSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { consumer } = useConsumerAuth();
  const { setOpenMobile } = useSidebar();

  const isActive = (key: string) => {
    return (
      pathname === `/${SLUGS.CONSUMER}/${key}` ||
      pathname.startsWith(`/${SLUGS.CONSUMER}/${key}/`)
    );
  };

  const logout = () => {
    deleteCookie(COOKIES.CONSUMER);
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
                    src="/brand/icon.png"
                    alt="Feebook"
                    height={50}
                    width={50}
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold text-primary text-2xl">
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
        {ConsumerSidebarData.groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      size={"lg"}
                      asChild
                      className="hover:bg-primary/10 data-[active=true]:text-primary data-[active=true]:bg-primary/10"
                      isActive={isActive(item.key)}
                    >
                      <Link
                        href={`/${SLUGS.CONSUMER}/${item.key}`}
                        className="text-lg font-semibold text-gray-700"
                        onClick={() => setOpenMobile(false)}
                        draggable="false"
                      >
                        <i className="size-6">{item.icon}</i>
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
                {/* <AvatarImage src={consumer?.email} /> */}
                <AvatarFallback className="bg-primary/20">
                  {consumer?.firstName?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-sm">
                {consumer?.firstName} {consumer?.lastName} <br />
                <span className="-ml-1">+91 {consumer?.phone}</span>
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
