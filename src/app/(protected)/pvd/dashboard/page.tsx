"use client";

import ProviderTopbar from "@/components/layout/provider/ProviderTopbar";
import { Button } from "@/components/ui/button";
import { SLUGS } from "@/constants/slugs";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const Page = () => {
  const { provider } = useProviderAuth();

  return (
    <>
      <ProviderTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your institution{`'`}s dashboard here.
          </p>
        </div>
      </ProviderTopbar>

      <div className="p-2 sm:p-4">
        {!provider?.isVerified && (
          <div className="mb-4 p-4 bg-primary text-white rounded-xl">
            <p className="text-white">
              Your organization is not verified yet. Please complete KYC to
              access all features.
            </p>
            <Button asChild variant="secondary" className="mt-2">
              <Link
                href={`/${SLUGS.PROVIDER}/kyc/${provider?.type.toLowerCase()}`}
                prefetch={false}
              >
                Proceed to KYC <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        )}
        <p className="text-muted-foreground">Under Construction</p>
      </div>
    </>
  );
};

export default Page;
