"use client";

import { useEffect, useState } from "react";
import ProviderTopbar from "@/components/layout/provider/ProviderTopbar";
import DashboardStats from "@/components/provider/dashboard/DashboardStats";
import RecentTransactions from "@/components/provider/dashboard/RecentTransactions";
import RecentMembers from "@/components/provider/dashboard/RecentMembers";
import QuickActions from "@/components/provider/dashboard/QuickActions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SLUGS } from "@/constants/slugs";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import { ArrowRightIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface DashboardData {
  stats: {
    totalMembers: number;
    totalRevenue: number;
    pendingAmount: number;
    overdueAmount: number;
    thisMonthRevenue: number;
    revenueGrowth: number;
    totalFeePlans: number;
    pendingFeePlans: number;
    overdueFeePlans: number;
    walletBalance: number;
  };
  recentTransactions: Array<{
    id: string;
    amount: number;
    paymentTime: Date | null;
    memberName: string;
    memberUniqueId: string;
    feePlanName: string;
  }>;
  recentMembers: Array<{
    id: string;
    name: string;
    uniqueId: string;
    joinedAt: Date;
    pendingAmount: number;
  }>;
  bankAccounts: {
    total: number;
    verified: number;
    hasDefault: boolean;
  };
}

const Page = () => {
  const { provider } = useProviderAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!provider?.id) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/v1/provider/dashboard?providerId=${provider.id}`
        );
        const result = await response.json();

        if (result.success) {
          setDashboardData(result.data);
        } else {
          setError(result.error || "Failed to fetch dashboard data");
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [provider?.id]);

  if (loading) {
    return (
      <>
        <ProviderTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Overview of your institution
            </p>
          </div>
        </ProviderTopbar>

        <div className="p-2 sm:p-4 space-y-6">
          {/* Loading skeletons */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </>
    );
  }

  if (error || !dashboardData) {
    return (
      <>
        <ProviderTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
          </div>
        </ProviderTopbar>

        <div className="p-2 sm:p-4">
          <Alert variant="destructive">
            <WarningIcon className="h-4 w-4" />
            <AlertDescription>
              {error || "Failed to load dashboard data"}
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <ProviderTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Overview of your institution
          </p>
        </div>
      </ProviderTopbar>

      <div className="p-2 sm:p-4 space-y-6">
        {/* KYC Alert */}
        {!provider?.isVerified && (
          <Alert>
            <WarningIcon className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Complete KYC verification to access all features and start
                collecting payments.
              </span>
              <Button asChild variant="default" size="sm">
                <Link
                  href={`/${
                    SLUGS.PROVIDER
                  }/kyc/${provider?.type.toLowerCase()}`}
                >
                  Complete KYC <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Section */}
        <DashboardStats stats={dashboardData.stats} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column - Transactions & Members */}
          <div className="lg:col-span-7 space-y-6">
            <RecentTransactions
              transactions={dashboardData.recentTransactions}
            />
            <RecentMembers members={dashboardData.recentMembers} />
          </div>

          {/* Right Column - Quick Actions */}
          <div className="lg:col-span-5 space-y-6">
            <QuickActions
              isVerified={provider?.isVerified || false}
              hasDefaultBank={dashboardData.bankAccounts.hasDefault}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
