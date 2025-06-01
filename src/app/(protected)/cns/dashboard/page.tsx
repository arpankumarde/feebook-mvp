"use client";

import { useConsumerAuth } from "@/hooks/use-consumer-auth";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SLUGS } from "@/constants/slugs";

interface MembershipData {
  id: string;
  claimedAt: string;
  member: {
    id: string;
    uniqueId: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    provider: {
      id: string;
      name: string;
      code: string;
      category: string;
    };
    feePlans: Array<{
      id: string;
      name: string;
      description?: string;
      amount: number;
      status: string;
      dueDate: string;
    }>;
  };
}

const ConsumerDashboard = () => {
  const { consumer } = useConsumerAuth();
  const [memberships, setMemberships] = useState<MembershipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingMembershipId, setRemovingMembershipId] = useState<
    string | null
  >(null);
  const router = useRouter();

  const fetchMemberships = async () => {
    if (!consumer?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use GET method as per the API implementation
      const response = await api.get("/api/v1/consumer/memberships", {
        params: {
          consumerId: consumer.id,
        },
      });

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

  const handleRemoveMembership = async (
    membershipId: string,
    memberId: string
  ) => {
    if (!consumer?.id) return;

    const confirmRemoval = window.confirm(
      "Are you sure you want to remove this membership? This action cannot be undone."
    );
    if (!confirmRemoval) return;

    try {
      setRemovingMembershipId(membershipId);

      await api.delete("/api/v1/consumer/memberships", {
        params: {
          consumerId: consumer.id,
          memberId: memberId,
        },
      });

      // Refresh memberships after successful removal
      await fetchMemberships();
    } catch (err: any) {
      console.error("Error removing membership:", err);
      setError("Failed to remove membership");
    } finally {
      setRemovingMembershipId(null);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, [consumer?.id]);

  if (loading) {
    return <div className="text-center py-8">Loading your memberships...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertDescription className="flex items-center justify-between">
          <span>Error: {error}</span>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">My Memberships</h2>
        <Button asChild>
          <Link href={`/${SLUGS.CONSUMER}/memberships`}>
            Link New Membership
          </Link>
        </Button>
      </div>

      {!memberships || memberships.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">No memberships found.</p>
            <Button asChild>
              <Link href={`/${SLUGS.CONSUMER}/memberships`}>
                Link your first membership
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {memberships.map((membership) => {
            const memberName = [
              membership.member?.firstName,
              membership.member?.middleName,
              membership.member?.lastName,
            ]
              .filter(Boolean)
              .join(" ");

            const feePlans = membership.member?.feePlans || [];

            return (
              <Card key={membership.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">
                        {memberName || "Unknown Member"}
                      </CardTitle>
                      <CardDescription>
                        <span className="font-medium">Member ID:</span>{" "}
                        {membership.member?.uniqueId || "N/A"}
                        <Separator
                          orientation="vertical"
                          className="mx-2 h-4 inline-block"
                        />
                        {membership.member?.provider?.name ||
                          "Unknown Organization"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/${SLUGS.CONSUMER}/memberships/${membership.id}/schedule`}
                        >
                          View Schedule
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleRemoveMembership(
                            membership.id,
                            membership.member.id
                          )
                        }
                        disabled={removingMembershipId === membership.id}
                      >
                        {removingMembershipId === membership.id
                          ? "Removing..."
                          : "Remove"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Organization:
                      </span>
                      <p>{membership.member?.provider?.name || "N/A"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Category:
                      </span>
                      <p>{membership.member?.provider?.category || "N/A"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Claimed:
                      </span>
                      <p>
                        {membership.claimedAt
                          ? new Date(membership.claimedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {feePlans.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Pending Fee Plans</h4>
                          <Badge variant="secondary">{feePlans.length}</Badge>
                        </div>
                        <div className="grid gap-3">
                          {feePlans.slice(0, 3).map((plan) => (
                            <Card key={plan.id} className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h5 className="font-medium">
                                    {plan.name || "Unnamed Fee"}
                                  </h5>
                                  <p className="text-sm text-muted-foreground">
                                    Due:{" "}
                                    {plan.dueDate
                                      ? new Date(
                                          plan.dueDate
                                        ).toLocaleDateString()
                                      : "No due date"}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-lg font-semibold"
                                >
                                  ₹{plan.amount || 0}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  const feePlanId = plan.id;
                                  if (feePlanId) {
                                    // Use only feePlanId parameter
                                    router.push(
                                      `/${SLUGS.CONSUMER}/pay?feePlanId=${feePlanId}`
                                    );
                                  }
                                }}
                                disabled={!plan.id}
                              >
                                Pay Now
                              </Button>
                            </Card>
                          ))}
                        </div>
                        {feePlans.length > 3 && (
                          <p className="text-sm text-muted-foreground text-center">
                            ... and {feePlans.length - 3} more. View full
                            schedule for details.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConsumerDashboard;
