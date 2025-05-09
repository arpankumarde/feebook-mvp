"use client";
import { Separator } from "../ui/separator";
import { SidebarTrigger, useSidebar } from "../ui/sidebar";

const EducatorSidebarTriggerHeader = () => {
  const sidebar = useSidebar();
  console.log("sidebar", sidebar);

  return (
    <>
      <div className="px-4 py-2 rounded-t-xl">
        <SidebarTrigger />
      </div>
      <Separator />
    </>
  );
};

export default EducatorSidebarTriggerHeader;
