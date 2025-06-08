"use client";

import ProviderTopbar from "@/components/layout/provider/ProviderTopbar";
import BankCard from "@/components/provider/wallet/BankCard";

const Page = () => {
  return (
    <>
      <ProviderTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Wallet</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your institution{`'`}s wallet here.
          </p>
        </div>
      </ProviderTopbar>

      <div className="p-2 sm:p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <BankCard />
        </div>
      </div>
    </>
  );
};

export default Page;
