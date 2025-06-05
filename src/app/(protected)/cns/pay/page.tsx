"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useConsumerAuth } from "@/hooks/use-consumer-auth";
import api from "@/lib/api";
import { toast } from "sonner";
import cashfree from "@/lib/cfpg_client";
import { OrderEntity } from "cashfree-pg";
import Link from "next/link";
import { SLUGS } from "@/constants/slugs";
import {
  CalendarIcon,
  CreditCardIcon,
  UserIcon,
  BuildingOfficeIcon,
  SpinnerGapIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  WarningIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
  ShieldCheckIcon,
  CurrencyInrIcon,
  LinkIcon,
  ReceiptIcon,
  FilePdfIcon,
} from "@phosphor-icons/react/dist/ssr";
import ConsumerTopbar from "@/components/layout/consumer/ConsumerTopbar";
import { formatAmount } from "@/utils/formatAmount";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircleIcon size={12} weight="fill" />
            Paid
          </Badge>
        );
      case "DUE":
        const today = new Date();
        const dueDate = new Date(paymentData?.feePlan.dueDate ?? "");
        if (dueDate < today) {
          return (
            <Badge variant="destructive" className="gap-1">
              <WarningIcon size={12} weight="fill" />
              Overdue
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="gap-1 border-blue-500 text-blue-600"
          >
            <ClockIcon size={12} weight="fill" />
            Due
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge variant="destructive" className="gap-1">
            <WarningIcon size={12} weight="fill" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            {status}
          </Badge>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <ConsumerTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">
              Payment Details
            </h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Complete your fee payment securely
            </p>
          </div>
        </ConsumerTopbar>

        <div className="">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-3 bg-white p-6 rounded-xl shadow-sm border">
              <SpinnerGapIcon size={24} className="animate-spin text-primary" />
              <span className="text-muted-foreground font-medium">
                Loading payment details...
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <WarningIcon
                    size={20}
                    className="text-destructive"
                    weight="fill"
                  />
                </div>
                <h3 className="font-semibold text-destructive">
                  Payment Error
                </h3>
              </div>
              <p className="text-muted-foreground mb-6">
                {error || "Payment details not found"}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="gap-2"
                >
                  <ArrowLeftIcon size={16} />
                  Go Back
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="gap-2"
                >
                  <SpinnerGapIcon size={16} />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
    <>
      <ConsumerTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Payment Details</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Complete your fee payment securely
          </p>
        </div>
      </ConsumerTopbar>

      <div className="grid grid-cols-1 md:grid-cols-12 min-h-screen p-2">
        <div className="cols-span-1 md:col-span-8 p-4 space-y-6">
          {/* Payment Summary Card */}
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <ReceiptIcon
                      size={24}
                      className="text-primary"
                      weight="bold"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {paymentData.feePlan.name}
                    </CardTitle>
                    {getStatusBadge(paymentData.feePlan.status)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">
                    {formatAmount(paymentData.feePlan.amount)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentData.feePlan.description && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {paymentData.feePlan.description}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-muted-foreground" />
                  <span>Due: {dueDate.toLocaleDateString()}</span>
                </div>
                {isOverdue && (
                  <Badge variant="destructive" className="gap-1">
                    <WarningIcon size={12} weight="fill" />
                    Overdue
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Member Details */}
            <Card className="border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <UserIcon size={20} className="text-blue-600" />
                  </div>
                  Member Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-lg">{memberName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-medium">Member ID:</span>
                    {paymentData.member.uniqueId}
                  </p>
                </div>

                <div className="space-y-3">
                  {paymentData.member.email && (
                    <div className="flex items-center gap-3">
                      <EnvelopeSimpleIcon
                        size={16}
                        className="text-muted-foreground"
                      />
                      <span className="text-sm">
                        {paymentData.member.email}
                      </span>
                    </div>
                  )}
                  {paymentData.member.phone && (
                    <div className="flex items-center gap-3">
                      <PhoneIcon size={16} className="text-muted-foreground" />
                      <span className="text-sm">
                        {paymentData.member.phone}
                      </span>
                    </div>
                  )}
                  {paymentData.member.category && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Category:
                      </span>
                      <span className="text-sm">
                        {paymentData.member.category}-
                        {paymentData.member.subcategory}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Organization Details */}
            <Card className="border-2 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <BuildingOfficeIcon size={20} className="text-orange-600" />
                  </div>
                  Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-lg">
                    {paymentData.provider.name}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-medium">Code:</span>
                    {paymentData.provider.code}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Category:
                    </span>
                    <span className="text-sm capitalize">
                      {paymentData.provider.category
                        .replace("_", " ")
                        .toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Type:
                    </span>
                    <span className="text-sm capitalize">
                      {paymentData.provider.type.toLowerCase()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Membership Status */}
          {consumer && (
            <Card className="border-2 shadow-sm">
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <LinkIcon size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Membership Status</p>
                      <p className="text-sm text-muted-foreground">
                        {paymentData.membership
                          ? `Claimed on ${new Date(
                              paymentData.membership.claimedAt
                            ).toLocaleDateString()}`
                          : "Not claimed to your account"}
                      </p>
                    </div>
                  </div>
                  {!paymentData.membership && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-2"
                    >
                      <Link href={`/${SLUGS.CONSUMER}/memberships`}>
                        <LinkIcon size={16} />
                        Claim Membership
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="cols-span-1 md:col-span-4 p-4 w-full">
          {/* Payment Actions */}
          <Card className="border-2 shadow-lg">
            <CardContent>
              {paymentData.feePlan.status === "PAID" ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <CheckCircleIcon
                      size={48}
                      className="text-green-600 mx-auto mb-3"
                      weight="fill"
                    />
                    <Badge
                      variant="default"
                      className="gap-1 bg-green-600 mb-4"
                    >
                      <CheckCircleIcon size={12} weight="fill" />
                      Already Paid
                    </Badge>
                    <p className="text-muted-foreground">
                      This fee plan has already been paid.
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Button
                      className="bg-green-600 hover:bg-green-700 w-full"
                      asChild
                    >
                      <Link href={`#`}>
                        <FilePdfIcon size={16} weight="bold" />
                        View Receipt
                      </Link>
                    </Button>
                    <Button
                      variant={"secondary"}
                      asChild
                      className="gap-2 w-full"
                    >
                      <Link href={`/${SLUGS.CONSUMER}/dashboard`}>
                        <ArrowLeftIcon size={16} />
                        Back to Dashboard
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Amount Summary */}
                  <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">
                      Total Amount
                    </p>
                    <p className="text-3xl font-bold text-primary mb-2">
                      {formatAmount(paymentData.feePlan.amount)}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <ShieldCheckIcon size={16} /> Secure Checkout
                    </div>
                  </div>

                  {/* Payment Button */}
                  <Button
                    className="w-full h-12 text-lg gap-3"
                    size="lg"
                    onClick={handlePayment}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <>
                        <SpinnerGapIcon size={20} className="animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCardIcon size={20} />
                        Pay Now
                      </>
                    )}
                  </Button>

                  {/* Security Notice */}
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      🔒 Your payment is secured with 256-bit SSL encryption
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      By proceeding, you agree to our terms and conditions
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

const PayNowPage = () => {
  return (
    <Suspense>
      <PayNowPageContent />
    </Suspense>
  );
};

export default PayNowPage;
