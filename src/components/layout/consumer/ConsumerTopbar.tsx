import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const ConsumerTopbar = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="flex gap-2 sm:gap-4 items-center w-full p-2 sm:p-4">
        <SidebarTrigger />
        {children}
      </div>
      <Separator />
    </>
  );
};

export default ConsumerTopbar;
