"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Calendar, CreditCard, DollarSign } from "lucide-react";

interface DetailedMembershipData {
  id: string;
  claimedAt: string;
  member: {
    id: string;
    uniqueId: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email?: string;
    phone?: string;
    category?: string;
    subcategory?: string;
    provider: {
      id: string;
      name: string;
      code: string;
      category: string;
      type: string;
    };
    feePlans: Array<{
      id: string;
      name: string;
      description?: string;
      amount: number;
      status: string;
      dueDate: string;
      isOfflinePaid: boolean;
      consumerClaimsPaid: boolean;
      createdAt: string;
    }>;
  };
}

const PaymentSchedulePage = () => {
  const params = useParams();
  const router = useRouter();
  const membershipId = params.membershipId as string;
  
  const [membership, setMembership] = useState<DetailedMembershipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingFeePlanId, setPayingFeePlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembershipDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/api/v1/consumer/memberships/${membershipId}`);
        
        if (response.data.success) {
          setMembership(response.data.data);
        } else {
          setError("Membership not found");
        }
      } catch (err: any) {
        console.error("Error fetching membership details:", err);
        setError("Failed to load membership details");
      } finally {
        setLoading(false);
      }
    };

    if (membershipId) {
      fetchMembershipDetails();
    }
  }, [membershipId]);

  const handlePayment = async (feePlanId: string) => {
    if (!membership) return;

    try {
      setPayingFeePlanId(feePlanId);
      
      // Navigate to payment page with all required parameters
      const providerId = membership.member.provider.id;
      const memberId = membership.member.uniqueId;
      
      window.location.href = `/pay-direct?providerId=${providerId}&memberId=${memberId}&feePlanId=${feePlanId}`;
    } catch (err: any) {
      console.error("Error initiating payment:", err);
      setError("Failed to initiate payment");
    } finally {
      setPayingFeePlanId(null);
    }
  };

  const getStatusBadge = (status: string, isOfflinePaid: boolean) => {
    if (isOfflinePaid) {
      return <Badge variant="secondary">Offline Paid</Badge>;
    }
    
    switch (status) {
      case "PAID":
        return <Badge variant="default">Paid</Badge>;
      case "DUE":
        return <Badge variant="outline">Due</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateTotalAmount = () => {
    if (!membership) return 0;
    return membership.member.feePlans.reduce((total, plan) => total + Number(plan.amount), 0);
  };

  const calculatePendingAmount = () => {
    if (!membership) return 0;
    return membership.member.feePlans
      .filter(plan => plan.status !== "PAID" && !plan.isOfflinePaid)
      .reduce((total, plan) => total + Number(plan.amount), 0);
  };

  if (loading) {
    return <div>Loading membership details...</div>;
  }

  if (error || !membership) {
    return (
      <div>
        <div style={{ color: "red", marginBottom: "1rem" }}>
          Error: {error || "Membership not found"}
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const memberName = [
    membership.member.firstName,
    membership.member.middleName,
    membership.member.lastName,
  ].filter(Boolean).join(" ");

  const sortedFeePlans = [...membership.member.feePlans].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          Payment Schedule
        </h1>
        <p style={{ color: "#666" }}>
          View and manage payment schedules for your membership
        </p>
      </div>

      {/* Membership Overview */}
      <Card style={{ marginBottom: "2rem" }}>
        <CardHeader>
          <CardTitle>{memberName}</CardTitle>
          <CardDescription>
            {membership.member.provider.name} | Member ID: {membership.member.uniqueId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <p><strong>Organization:</strong> {membership.member.provider.name}</p>
              <p><strong>Category:</strong> {membership.member.provider.category}</p>
              <p><strong>Type:</strong> {membership.member.provider.type}</p>
            </div>
            <div>
              <p><strong>Member Category:</strong> {membership.member.category || "N/A"}</p>
              <p><strong>Subcategory:</strong> {membership.member.subcategory || "N/A"}</p>
              <p><strong>Claimed:</strong> {new Date(membership.claimedAt).toLocaleDateString()}</p>
            </div>
            {(membership.member.email || membership.member.phone) && (
              <div>
                {membership.member.email && <p><strong>Email:</strong> {membership.member.email}</p>}
                {membership.member.phone && <p><strong>Phone:</strong> {membership.member.phone}</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <Card>
          <CardContent style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p style={{ fontSize: "0.875rem", color: "#666" }}>Total Amount</p>
                <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>₹{calculateTotalAmount().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CreditCard className="h-5 w-5 text-orange-600" />
              <div>
                <p style={{ fontSize: "0.875rem", color: "#666" }}>Pending Amount</p>
                <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>₹{calculatePendingAmount().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p style={{ fontSize: "0.875rem", color: "#666" }}>Total Plans</p>
                <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{membership.member.feePlans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Plans List */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Plans</CardTitle>
          <CardDescription>
            All fee plans for this membership sorted by due date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedFeePlans.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
              No fee plans found for this membership.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {sortedFeePlans.map((plan) => {
                const dueDate = new Date(plan.dueDate);
                const isOverdue = dueDate < new Date() && plan.status !== "PAID" && !plan.isOfflinePaid;
                
                return (
                  <div
                    key={plan.id}
                    style={{
                      border: `1px solid ${isOverdue ? "#ef4444" : "#e5e7eb"}`,
                      borderRadius: "0.5rem",
                      padding: "1rem",
                      backgroundColor: isOverdue ? "#fef2f2" : "white",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <h3 style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                          {plan.name}
                        </h3>
                        {plan.description && (
                          <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
                            {plan.description}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {getStatusBadge(plan.status, plan.isOfflinePaid)}
                        <span style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                          ₹{Number(plan.amount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "0.875rem", color: "#666" }}>
                        <p>Due: {dueDate.toLocaleDateString()}</p>
                        <p>Created: {new Date(plan.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      {plan.status !== "PAID" && !plan.isOfflinePaid && (
                        <Button
                          onClick={() => handlePayment(plan.id)}
                          disabled={payingFeePlanId === plan.id}
                          variant={isOverdue ? "destructive" : "default"}
                        >
                          {payingFeePlanId === plan.id ? "Processing..." : "Pay Now"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSchedulePage;
