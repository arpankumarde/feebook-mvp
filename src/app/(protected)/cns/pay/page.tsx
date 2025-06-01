"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useConsumerAuth } from "@/hooks/use-consumer-auth";
import api from "@/lib/api";
import { toast } from "sonner";
import cashfree from "@/lib/cfpg_client";
import { OrderEntity } from "cashfree-pg";
import { ArrowLeft, Calendar, CreditCard, User, Building } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SLUGS } from "@/constants/slugs";

interface PaymentPageData {
  feePlan: {
    id: string;
    name: string;
    description?: string;
    amount: number;
    status: string;
    dueDate: string;
  };
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
  };
  provider: {
    id: string;
    name: string;
    code: string;
    category: string;
    type: string;
  };
  membership?: {
    id: string;
    claimedAt: string;
  };
}

interface PaymentGatewayResponse {
  paymentDetails?: {
    paymentMessage: string;
  };
  error?: string;
  redirect?: boolean;
}

const PayNowPageContent = () => {
  const { consumer } = useConsumerAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract only feePlanId from URL parameters
  const feePlanId = searchParams.get("feePlanId");

  const [paymentData, setPaymentData] = useState<PaymentPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment details using only feePlanId
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!feePlanId) {
        setError("Fee plan ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch fee plan details using the new API
        const response = await api.get(`/api/v1/fee-plans/${feePlanId}`);

        if (!response.data.success) {
          throw new Error(response.data.error || "Fee plan not found");
        }

        const { feePlan, member, provider } = response.data.data;

        const paymentInfo: PaymentPageData = {
          feePlan: {
            id: feePlan.id,
            name: feePlan.name,
            description: feePlan.description,
            amount: Number(feePlan.amount),
            status: feePlan.status,
            dueDate: feePlan.dueDate,
          },
          member: {
            id: member.id,
            uniqueId: member.uniqueId,
            firstName: member.firstName,
            middleName: member.middleName,
            lastName: member.lastName,
            email: member.email,
            phone: member.phone,
            category: member.category,
            subcategory: member.subcategory,
          },
          provider: {
            id: provider.id,
            name: provider.name,
            code: provider.code,
            category: provider.category,
            type: provider.type,
          },
        };

        // Check if consumer has claimed this membership
        if (consumer?.id) {
          try {
            const membershipResponse = await api.get(
              "/api/v1/consumer/memberships",
              {
                params: {
                  consumerId: consumer.id,
                },
              }
            );

            const existingMembership =
              membershipResponse.data.memberships?.find(
                (m: any) => m.member.id === member.id
              );

            if (existingMembership) {
              paymentInfo.membership = {
                id: existingMembership.id,
                claimedAt: existingMembership.claimedAt,
              };
            }
          } catch (err) {
            // Membership check failed, continue without membership info
            console.warn("Could not check membership status:", err);
          }
        }

        setPaymentData(paymentInfo);
      } catch (err: any) {
        console.error("Error fetching payment details:", err);
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to load payment details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [feePlanId, consumer?.id]);

  // Handle payment processing
  const handlePayment = async () => {
    if (!paymentData || !feePlanId) return;

    try {
      setProcessingPayment(true);

      // Create payment order using existing PG API
      const orderResponse = await api.post<OrderEntity>(
        "/api/v1/pg/create-order",
        {
          feePlanId,
          memberId: paymentData.member.id,
          providerId: paymentData.provider.id,
          consumerId: consumer?.id, // Include consumer ID if authenticated
        }
      );

      const orderData = orderResponse.data;

      if (orderData?.payment_session_id && orderData?.order_id) {
        // Process payment through Cashfree
        await processPaymentGateway(
          orderData.payment_session_id,
          orderData.order_id
        );
      } else {
        throw new Error("Failed to create payment session");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(
        err.response?.data?.message || "Payment failed. Please try again."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const processPaymentGateway = async (
    paymentSessionId: string,
    orderId: string
  ) => {
    const checkoutOptions = {
      paymentSessionId: paymentSessionId,
      redirectTarget: "_modal",
    };

    try {
      const result = (await cashfree.checkout(
        checkoutOptions
      )) as PaymentGatewayResponse;

      if (result.error) {
        console.warn("Payment gateway error:", result.error);
        toast.error("Payment was cancelled or failed");
      } else if (result.redirect) {
        console.info("Payment redirected");
        toast.info("Payment is being processed...");
      } else if (result.paymentDetails) {
        console.log("Payment completed:", result.paymentDetails);
        toast.success("Payment completed successfully!");

        // Redirect to verification page
        router.push(`/${SLUGS.CONSUMER}/pay/verify?orderId=${orderId}`);
      }
    } catch (err) {
      console.error("Payment gateway error:", err);
      toast.error("Payment processing failed");
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading payment details...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !paymentData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col space-y-4">
            <span>{error || "Payment details not found"}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const memberName = [
    paymentData.member.firstName,
    paymentData.member.middleName,
    paymentData.member.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const dueDate = new Date(paymentData.feePlan.dueDate);
  const isOverdue =
    dueDate < new Date() && paymentData.feePlan.status !== "PAID";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Details</h1>
        <p className="text-muted-foreground">
          Complete your fee payment securely
        </p>
      </div>

      {/* Payment Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payment Summary</span>
            {getStatusBadge(paymentData.feePlan.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium">{paymentData.feePlan.name}</span>
              <span className="font-bold text-2xl">
                {formatAmount(paymentData.feePlan.amount)}
              </span>
            </div>

            {paymentData.feePlan.description && (
              <p className="text-muted-foreground">
                {paymentData.feePlan.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>Due: {dueDate.toLocaleDateString()}</span>
              {isOverdue && (
                <Badge variant="destructive" className="ml-2">
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Member Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">{memberName}</p>
              <p className="text-sm text-muted-foreground">
                Member ID: {paymentData.member.uniqueId}
              </p>
            </div>
            <div className="space-y-1">
              {paymentData.member.email && (
                <p className="text-sm">Email: {paymentData.member.email}</p>
              )}
              {paymentData.member.phone && (
                <p className="text-sm">Phone: {paymentData.member.phone}</p>
              )}
              {paymentData.member.category && (
                <p className="text-sm">
                  Category: {paymentData.member.category}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">{paymentData.provider.name}</p>
              <p className="text-sm text-muted-foreground">
                Code: {paymentData.provider.code}
              </p>
            </div>
            <div>
              <p className="text-sm">
                Category: {paymentData.provider.category}
              </p>
              <p className="text-sm">Type: {paymentData.provider.type}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membership Status */}
      {consumer && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Membership Status</p>
                <p className="text-sm text-muted-foreground">
                  {paymentData.membership
                    ? `Claimed on ${new Date(
                        paymentData.membership.claimedAt
                      ).toLocaleDateString()}`
                    : "Not claimed to your account"}
                </p>
              </div>
              {!paymentData.membership && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${SLUGS.CONSUMER}/memberships`}>
                    Claim Membership
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Actions */}
      <Card>
        <CardContent className="pt-6">
          {paymentData.feePlan.status === "PAID" ? (
            <div className="text-center">
              <Badge variant="default" className="mb-4">
                Already Paid
              </Badge>
              <p className="text-muted-foreground mb-4">
                This fee plan has already been paid.
              </p>
              <Button asChild>
                <Link href={`/${SLUGS.CONSUMER}/dashboard`}>
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">
                  Total Amount: {formatAmount(paymentData.feePlan.amount)}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Secure payment powered by Cashfree
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handlePayment}
                disabled={processingPayment}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {processingPayment ? "Processing Payment..." : "Pay Now"}
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  By proceeding, you agree to our terms and conditions
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const PayNowPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PayNowPageContent />
    </Suspense>
  );
};

export default PayNowPage;
