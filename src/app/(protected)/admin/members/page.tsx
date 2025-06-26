import ModeratorTopbar from "@/components/layout/moderator/ModeratorTopbar";

const Page = () => {
  return (
    <>
      <ModeratorTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Members</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage Members
          </p>
        </div>
      </ModeratorTopbar>

      <div className="p-2 sm:p-4">
        <p className="text-muted-foreground">Under Construction</p>
      </div>
    </>
  );
};

export default Page;
