"use client";

import ProviderTopbar from "@/components/layout/provider/ProviderTopbar";
import PersonalKycForm from "@/components/provider/kyc/PersonalKycForm";
import { AccountType } from "@prisma/client";
import { useSearchParams } from "next/navigation";

const Page = () => {
  const searchParams = useSearchParams();
  const accountType = searchParams.get("type") as AccountType;

  if (!accountType) {
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

        <div className="p-4">
          <h2 className="text-lg font-semibold">Error</h2>
          <p className="text-muted-foreground">
            Invalid or missing KYC type. Please try again.
          </p>
        </div>
      </>
    );
  }

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

      <div className="p-4">
        {accountType === AccountType.INDIVIDUAL ? <PersonalKycForm /> : null}
      </div>
    </>
  );
};

export default Page;
