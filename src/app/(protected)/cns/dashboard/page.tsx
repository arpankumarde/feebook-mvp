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
import Link from "next/link";

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
  const [removingMembershipId, setRemovingMembershipId] = useState<string | null>(null);

  const fetchMemberships = async () => {
    if (!consumer?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

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

  const handleRemoveMembership = async (membershipId: string, memberId: string) => {
    if (!consumer?.id) return;
    
    const confirmRemoval = window.confirm("Are you sure you want to remove this membership? This action cannot be undone.");
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
    return <div>Loading your memberships...</div>;
  }

  if (error) {
    return (
      <div style={{ color: "red" }}>
        Error: {error}
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
          style={{ marginLeft: "1rem" }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2>My Memberships</h2>

      {!memberships || memberships.length === 0 ? (
        <Card>
          <CardContent style={{ padding: "2rem", textAlign: "center" }}>
            <p>No memberships found.</p>
            <Button asChild style={{ marginTop: "1rem" }}>
              <Link href="/cns/memberships">Link your first membership</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <CardTitle>{memberName || "Unknown Member"}</CardTitle>
                      <CardDescription>
                        Member ID: {membership.member?.uniqueId || "N/A"} |{" "}
                        {membership.member?.provider?.name || "Unknown Organization"}
                      </CardDescription>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <Link href={`/cns/memberships/${membership.id}/schedule`}>
                          View Schedule
                        </Link>
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemoveMembership(membership.id, membership.member.id)}
                        disabled={removingMembershipId === membership.id}
                      >
                        {removingMembershipId === membership.id ? "Removing..." : "Remove"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>
                    <strong>Organization:</strong>{" "}
                    {membership.member?.provider?.name || "N/A"}
                  </p>
                  <p>
                    <strong>Category:</strong>{" "}
                    {membership.member?.provider?.category || "N/A"}
                  </p>
                  <p>
                    <strong>Claimed:</strong>{" "}
                    {membership.claimedAt
                      ? new Date(membership.claimedAt).toLocaleDateString()
                      : "N/A"}
                  </p>

                  {feePlans.length > 0 && (
                    <div style={{ marginTop: "1rem" }}>
                      <h4>Pending Fee Plans ({feePlans.length}):</h4>
                      {feePlans.slice(0, 3).map((plan) => (
                        <div
                          key={plan.id}
                          style={{
                            border: "1px solid #eee",
                            padding: "0.5rem",
                            margin: "0.5rem 0",
                          }}
                        >
                          <p>
                            <strong>{plan.name || "Unnamed Fee"}</strong> - ₹
                            {plan.amount || 0}
                          </p>
                          <p>
                            Due:{" "}
                            {plan.dueDate
                              ? new Date(plan.dueDate).toLocaleDateString()
                              : "No due date"}
                          </p>
                          <Button
                            size="sm"
                            style={{ marginTop: "0.5rem" }}
                            onClick={() => {
                              const providerId = membership.member?.provider?.id;
                              const memberId = membership.member?.uniqueId;
                              const feePlanId = plan.id;

                              if (providerId && memberId && feePlanId) {
                                window.location.href = `/pay-direct?providerId=${providerId}&memberId=${memberId}&feePlanId=${feePlanId}`;
                              }
                            }}
                            disabled={
                              !membership.member?.provider?.id ||
                              !membership.member?.uniqueId ||
                              !plan.id
                            }
                          >
                            Pay Now
                          </Button>
                        </div>
                      ))}
                      {feePlans.length > 3 && (
                        <p style={{ marginTop: "0.5rem", color: "#666" }}>
                          ... and {feePlans.length - 3} more. View full schedule for details.
                        </p>
                      )}
                    </div>
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
