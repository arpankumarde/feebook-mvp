"use client";

import { useConsumerAuth } from "@/hooks/use-consumer-auth";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ConsumerTopbar from "@/components/layout/consumer/ConsumerTopbar";
import { DashboardStats } from "@/components/consumer/dashboard/DashboardStats";
import { UrgentFeesCard } from "@/components/consumer/dashboard/UrgentFeesCard";
import { RecentTransactionsCard } from "@/components/consumer/dashboard/RecentTransactionsCard";
import { MembershipsOverviewCard } from "@/components/consumer/dashboard/MembershipsOverviewCard";
import {
  SpinnerGapIcon,
  XCircleIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { SLUGS } from "@/constants/slugs";

interface DashboardData {
  statistics: {
    totalMemberships: number;
    totalPendingFees: number;
    totalPendingAmount: number;
    overdueFees: number;
    overdueAmount: number;
    upcomingFees: number;
    recentPaymentsTotal: number;
    recentPaymentsCount: number;
  };
  urgentFees: Array<{
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    status: string;
    memberName: string;
    providerName: string;
    membershipId: string;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    paymentTime: string | null;
    feePlanName: string;
    memberName: string;
    providerName: string;
  }>;
  memberships: Array<{
    id: string;
    claimedAt: string;
    memberName: string;
    memberUniqueId: string;
    providerName: string;
    providerCategory: any;
    pendingFeesCount: number;
  }>;
}

const ConsumerDashboard = () => {
  const { consumer } = useConsumerAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!consumer?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/api/v1/consumer/dashboard", {
          params: {
            consumerId: consumer.id,
          },
        });

        if (response.data.success) {
          setDashboardData(response.data.data);
        } else {
          throw new Error(response.data.error || "Failed to load dashboard");
        }
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.response?.data?.error || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [consumer?.id]);

  // Loading state
  if (loading) {
    return (
      <>
        <ConsumerTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Welcome back, {consumer?.firstName || "User"}
            </p>
          </div>
        </ConsumerTopbar>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-3 text-muted-foreground">
            <SpinnerGapIcon size={24} className="animate-spin text-primary" />
            <span className="font-medium">Loading your dashboard...</span>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <ConsumerTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Welcome back, {consumer?.firstName || "User"}
            </p>
          </div>
        </ConsumerTopbar>

        <div className="p-4">
          <Alert variant="destructive">
            <XCircleIcon size={16} />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <>
        <ConsumerTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Welcome back, {consumer?.firstName || "User"}
            </p>
          </div>
        </ConsumerTopbar>

        <div className="p-4">
          <Alert>
            <AlertDescription>
              No dashboard data available. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <ConsumerTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Welcome back, {consumer?.firstName || "User"}
            </p>
          </div>

          {dashboardData.statistics.totalMemberships === 0 && (
            <Button className="gap-2 hidden lg:inline-flex" asChild>
              <Link href={`/${SLUGS.CONSUMER}/memberships/add`}>
                <PlusIcon size={16} weight="bold" />
                Add Membership
              </Link>
            </Button>
          )}
        </div>
      </ConsumerTopbar>

      <div className="p-4 space-y-6">
        {/* Dashboard Statistics */}
        <DashboardStats statistics={dashboardData.statistics} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <UrgentFeesCard urgentFees={dashboardData.urgentFees} />
            <RecentTransactionsCard
              transactions={dashboardData.recentTransactions}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <MembershipsOverviewCard memberships={dashboardData.memberships} />

            {/* Quick Actions Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link href={`/${SLUGS.CONSUMER}/memberships/add`}>
                  <PlusIcon size={24} weight="bold" />
                  <span className="text-sm">Add Membership</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link href={`/${SLUGS.CONSUMER}/payment-history`}>
                  <SpinnerGapIcon size={24} weight="bold" />
                  <span className="text-sm">Payment History</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Quick Actions */}
        {dashboardData.statistics.totalMemberships === 0 && (
          <div className="lg:hidden">
            <Button className="w-full gap-2" size="lg" asChild>
              <Link href={`/${SLUGS.CONSUMER}/memberships/add`}>
                <PlusIcon size={20} weight="bold" />
                Add Your First Membership
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default ConsumerDashboard;
