"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  Loader2,
} from "lucide-react";
import { SLUGS } from "@/constants/slugs";

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

  const [membership, setMembership] = useState<DetailedMembershipData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingFeePlanId, setPayingFeePlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembershipDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(
          `/api/v1/consumer/memberships/${membershipId}`
        );

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

      // Navigate to payment page with only feePlanId
      router.push(`/${SLUGS.CONSUMER}/pay?feePlanId=${feePlanId}`);
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
    return membership.member.feePlans.reduce(
      (total, plan) => total + Number(plan.amount),
      0
    );
  };

  const calculatePendingAmount = () => {
    if (!membership) return 0;
    return membership.member.feePlans
      .filter((plan) => plan.status !== "PAID" && !plan.isOfflinePaid)
      .reduce((total, plan) => total + Number(plan.amount), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading membership details...</span>
        </div>
      </div>
    );
  }

  if (error || !membership) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error || "Membership not found"}</AlertDescription>
        </Alert>
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
  ]
    .filter(Boolean)
    .join(" ");

  const sortedFeePlans = [...membership.member.feePlans].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Payment Schedule</h1>
        <p className="text-muted-foreground">
          View and manage payment schedules for your membership
        </p>
      </div>

      {/* Membership Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{memberName}</CardTitle>
          <CardDescription>
            {membership.member.provider.name} | Member ID:{" "}
            {membership.member.uniqueId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p>
                <span className="font-medium">Organization:</span>{" "}
                {membership.member.provider.name}
              </p>
              <p>
                <span className="font-medium">Category:</span>{" "}
                {membership.member.provider.category}
              </p>
              <p>
                <span className="font-medium">Type:</span>{" "}
                {membership.member.provider.type}
              </p>
            </div>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Member Category:</span>{" "}
                {membership.member.category || "N/A"}
              </p>
              <p>
                <span className="font-medium">Subcategory:</span>{" "}
                {membership.member.subcategory || "N/A"}
              </p>
              <p>
                <span className="font-medium">Claimed:</span>{" "}
                {new Date(membership.claimedAt).toLocaleDateString()}
              </p>
            </div>
            {(membership.member.email || membership.member.phone) && (
              <div className="space-y-2">
                {membership.member.email && (
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {membership.member.email}
                  </p>
                )}
                {membership.member.phone && (
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {membership.member.phone}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  ₹{calculateTotalAmount().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold">
                  ₹{calculatePendingAmount().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Plans</p>
                <p className="text-2xl font-bold">
                  {membership.member.feePlans.length}
                </p>
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
            <div className="text-center py-12 text-muted-foreground">
              No fee plans found for this membership.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedFeePlans.map((plan) => {
                const dueDate = new Date(plan.dueDate);
                const isOverdue =
                  dueDate < new Date() &&
                  plan.status !== "PAID" &&
                  !plan.isOfflinePaid;

                return (
                  <Card
                    key={plan.id}
                    className={`transition-colors ${
                      isOverdue
                        ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                        : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{plan.name}</h3>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground">
                              {plan.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(plan.status, plan.isOfflinePaid)}
                          <Badge
                            variant="outline"
                            className="text-lg font-bold px-3 py-1"
                          >
                            ₹{Number(plan.amount).toLocaleString()}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium">Due:</span>{" "}
                            {dueDate.toLocaleDateString()}
                          </p>
                          <p>
                            <span className="font-medium">Created:</span>{" "}
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {plan.status !== "PAID" && !plan.isOfflinePaid && (
                          <Button
                            disabled={payingFeePlanId === plan.id}
                            variant={isOverdue ? "destructive" : "default"}
                            className="min-w-[100px]"
                            asChild
                          >
                            <Link
                              href={`/${SLUGS.CONSUMER}/pay?feePlanId=${plan.id}`}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              "Pay Now"
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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
