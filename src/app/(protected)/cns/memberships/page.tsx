"use client";

import { useEffect, useState } from "react";
import ConsumerTopbar from "@/components/layout/consumer/ConsumerTopbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useConsumerAuth } from "@/hooks/use-consumer-auth";
import api from "@/lib/api";
import { SLUGS } from "@/constants/slugs";
import Link from "next/link";
import {
  BarbellIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  GraduationCapIcon,
  PlusIcon,
  SpinnerGapIcon,
  StorefrontIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { AccountCategory } from "@prisma/client";

interface SimplifiedMembershipData {
  id: string;
  claimedAt: string;
  memberName: string;
  memberUniqueId: string;
  providerName: string;
  providerCategory: AccountCategory;
  pendingFeePlansCount: number;
  hasOutstandingFees: boolean;
  hasOverdueFees: boolean;
}

const MembershipsPage = () => {
  const { consumer } = useConsumerAuth();
  const [memberships, setMemberships] = useState<SimplifiedMembershipData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemberships = async () => {
      if (!consumer?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await api.get(
          "/api/v1/consumer/memberships/simplified",
          {
            params: {
              consumerId: consumer.id,
            },
          }
        );

        const membershipData = response.data?.memberships || [];
        setMemberships(Array.isArray(membershipData) ? membershipData : []);
      } catch (err: any) {
        console.error("Error fetching memberships:", err);
        setError("Failed to load memberships");
        setMemberships([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberships();
  }, [consumer?.id]);

  const getProviderCategoryIcon = (category: AccountCategory) => {
    switch (category) {
      case "EDUCATIONAL":
      case "HIGHER_EDUCATION":
        return <GraduationCapIcon size={30} weight="duotone" />;
      case "COACHING":
        return <UsersThreeIcon size={30} weight="duotone" />;
      case "FITNESS_SPORTS":
        return <BarbellIcon size={30} weight="duotone" />;
      default:
        return <StorefrontIcon size={30} weight="duotone" />;
    }
  };

  const getStatusBadge = (
    hasOutstandingFees: boolean,
    hasOverdueFees: boolean,
    pendingCount: number
  ) => {
    if (hasOverdueFees) {
      return (
        <Badge variant="destructive" className="gap-1">
          <WarningCircleIcon className="size-3" weight="fill" />
          Overdue
        </Badge>
      );
    }
    if (hasOutstandingFees) {
      return (
        <Badge variant="secondary" className="gap-1">
          <ClockIcon className="h-3 w-3" />
          {pendingCount} Pending
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <CheckCircleIcon className="h-3 w-3" weight="fill" />
        All Paid
      </Badge>
    );
  };

  if (loading) {
    return (
      <>
        <ConsumerTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Memberships</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your memberships here.
            </p>
          </div>
        </ConsumerTopbar>

        <div className="p-4 flex items-center justify-center min-h-64">
          <div className="flex items-center space-x-2">
            <SpinnerGapIcon size={24} className="animate-spin text-primary" />
            <span className="text-muted-foreground">
              Loading your memberships...
            </span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ConsumerTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Memberships</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your memberships here.
            </p>
          </div>
          <Button className="gap-2 hidden lg:inline-flex" asChild size={"sm"}>
            <Link href={`/${SLUGS.CONSUMER}/memberships/add`}>
              <PlusIcon weight="bold" />
              Add Membership
            </Link>
          </Button>
        </div>
      </ConsumerTopbar>

      <div className="p-4 space-y-6">
        {error && (
          <Alert variant="destructive">
            <WarningCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {memberships.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <BuildingOfficeIcon
                size={32}
                weight="duotone"
                className="h-12 w-12 text-primary"
              />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Memberships Found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              You haven{`'`}t linked any memberships yet. Start by adding your
              first membership to manage fees and payments.
            </p>
            <Button className="gap-2" size="lg" asChild>
              <Link href={`/${SLUGS.CONSUMER}/memberships/add`}>
                <PlusIcon weight="bold" />
                Add Your First Membership
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row items-center justify-between gap-2">
              <div className="text-center md:text-left">
                <h2 className="text-lg font-semibold">Your Memberships</h2>
                <p className="text-sm text-muted-foreground">
                  {memberships.length} membership
                  {memberships.length !== 1 ? "s" : ""} linked to your account
                </p>
              </div>

              <div>
                <Button className="gap-2 md:hidden" asChild>
                  <Link href={`/${SLUGS.CONSUMER}/memberships/add`}>
                    <PlusIcon weight="bold" />
                    Add Membership
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {memberships.map((membership) => (
                <Card
                  key={membership.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center bg-muted-foreground/5 text-primary rounded-lg p-2">
                          {getProviderCategoryIcon(membership.providerCategory)}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {membership.memberName}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            ID: {membership.memberUniqueId}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(
                        membership.hasOutstandingFees,
                        membership.hasOverdueFees,
                        membership.pendingFeePlansCount
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    <div>
                      <p className="font-medium text-sm">
                        {membership.providerName}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {membership.providerCategory
                          .replace("_", " ")
                          .toLowerCase()}
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter className="border-t-2 pt-4">
                    <div className="flex flex-wrap gap-2 w-full">
                      {/* Always show View Details button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        asChild
                      >
                        <Link
                          href={`/${SLUGS.CONSUMER}/memberships/${membership.id}/schedule`}
                        >
                          <EyeIcon className="mr-1" weight="bold" />
                          View Details
                        </Link>
                      </Button>

                      {/* Show Quick Pay button only if there are outstanding fees */}
                      {membership.hasOutstandingFees && (
                        <Button
                          size="sm"
                          className="flex-1"
                          variant={
                            membership.hasOverdueFees
                              ? "destructive"
                              : "default"
                          }
                          asChild
                        >
                          <Link
                            href={`/${SLUGS.CONSUMER}/memberships/${membership.id}/schedule`}
                          >
                            {membership.hasOverdueFees
                              ? "Pay Overdue"
                              : "Quick Pay"}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {memberships.length > 1 && (
              <div className="flex justify-center md:hidden">
                <Button className="gap-2" asChild>
                  <Link href={`/${SLUGS.CONSUMER}/memberships/add`}>
                    <PlusIcon weight="bold" />
                    Add Membership
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default MembershipsPage;
