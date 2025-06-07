import ProviderTopbar from "@/components/layout/provider/ProviderTopbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProviderTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">KYC</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Complete your KYC to access all features
          </p>
        </div>
      </ProviderTopbar>

      {children}
    </>
  );
}
