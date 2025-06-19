"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { FeePlan, Member, Provider } from "@prisma/client";
import cashfree from "@/lib/cfpg_client";
import { OrderEntity } from "cashfree-pg";
import {
  UserIcon,
  CreditCardIcon,
  CalendarIcon,
  CurrencyInrIcon,
  SpinnerGapIcon,
  ArrowLeftIcon,
  WarningIcon,
  InfoIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@phosphor-icons/react/dist/ssr";
import { APIResponse } from "@/types/common";

interface MemberWithProvider extends Member {
  provider: Provider;
}

interface MemberAndFeePlans {
  member: MemberWithProvider;
  feePlans: FeePlan[];
}

interface PaymentGatewayResponse {
  paymentDetails?: {
    paymentMessage: string;
  };
  error?: string;
  redirect?: boolean;
}

const DirectPayMemberPage = () => {
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberId as string;

  // State management
  const [memberData, setMemberData] = useState<MemberWithProvider | null>(null);
  const [pendingFeePlans, setPendingFeePlans] = useState<FeePlan[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch member details and fee plans
  useEffect(() => {
    const fetchMemberData = async () => {
      if (!memberId) return;

      try {
        setIsDataLoading(true);
        setErrorMessage(null);

        const response = await api.get<APIResponse<MemberAndFeePlans>>(
          `/api/v1/member`,
          {
            params: {
              memberId: memberId,
            },
          }
        );

        if (response.data.success && response.data.data) {
          const { member, feePlans } = response.data.data;
          setMemberData(member);

          // Filter pending fee plans
          const pendingFees =
            feePlans?.filter((feePlan: FeePlan) => feePlan.status !== "PAID") ||
            [];
          setPendingFeePlans(pendingFees);
        } else {
          setErrorMessage("Member not found or no data available");
        }
      } catch (error: any) {
        console.error("Error fetching member data:", error);
        const errorMsg =
          error.response?.data?.message || "Failed to load member information";
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchMemberData();
  }, [memberId]);

  // Handle payment gateway integration
  const initiatePaymentProcess = async (
    paymentSessionId: string,
    orderId: string
  ) => {
    const paymentOptions = {
      paymentSessionId: paymentSessionId,
      redirectTarget: "_modal",
    };

    cashfree.checkout(paymentOptions).then((result: PaymentGatewayResponse) => {
      console.log("Payment Result:", result);

      if (result.error) {
        console.log("Payment error occurred:", result.error);
        toast.error("Payment failed. Please try again.");
      }

      if (result.redirect) {
        console.log("Payment redirection required");
      }

      if (result.paymentDetails) {
        console.log("Payment completed:", result.paymentDetails);
        toast.success("Payment completed successfully!");
        router.push(`/direct-pay/verify?orderId=${orderId}`);
      }
    });
  };

  // Handle fee payment
  const handleFeePayment = async (feePlanId: string) => {
    if (!memberData) return;

    try {
      setIsPaymentProcessing(true);

      const response = await api.post<OrderEntity>("/api/v1/pg/create-order", {
        feePlanId,
        memberId: memberData.id,
        providerId: memberData.provider.id,
      });

      if (
        response.data &&
        response.data.payment_session_id &&
        response.data.order_id
      ) {
        await initiatePaymentProcess(
          response.data.payment_session_id,
          response.data.order_id
        );
      } else {
        throw new Error("Invalid payment session data");
      }
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to initiate payment";
      toast.error(errorMsg);
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  // Get fee status badge
  const getFeeStatusBadge = (feePlan: FeePlan) => {
    const dueDate = new Date(feePlan.dueDate);
    const currentDate = new Date();
    const isOverdue = currentDate > dueDate;

    if (feePlan.status === "PAID") {
      return (
        <Badge className="bg-green-600 text-white gap-1">
          <CheckCircleIcon size={12} />
          Paid
        </Badge>
      );
    }

    if (isOverdue) {
      return (
        <Badge variant="destructive" className="gap-1">
          <WarningIcon size={12} />
          Overdue
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="gap-1">
        <ClockIcon size={12} />
        Pending
      </Badge>
    );
  };

  // Loading state
  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-3">
              <SpinnerGapIcon size={24} className="animate-spin text-primary" />
              <span className="font-medium">Loading member information...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (errorMessage || !memberData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <WarningIcon size={20} />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  {errorMessage || "Member information could not be loaded"}
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                onClick={() => router.push("/direct-pay")}
                className="w-full gap-2"
              >
                <ArrowLeftIcon size={16} />
                Back to Search
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fee Payment</h1>
              <p className="text-gray-600">Pay your pending fees securely</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/direct-pay")}
              className="gap-2"
            >
              <ArrowLeftIcon size={16} />
              Back to Search
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Member Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon size={20} className="text-primary" />
              Member Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </p>
                  <p className="font-medium">
                    {[
                      memberData.firstName,
                      memberData.middleName,
                      memberData.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Member ID
                  </p>
                  <p className="font-medium">{memberData.uniqueId}</p>
                </div>
                {memberData.category && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Category
                    </p>
                    <p className="font-medium">
                      {memberData.category}
                      {memberData.subcategory && ` - ${memberData.subcategory}`}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Institution
                  </p>
                  <p className="font-medium">{memberData.provider.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Institution Code
                  </p>
                  <p className="font-medium">{memberData.provider.code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Contact
                  </p>
                  <p className="text-sm">{memberData.provider.email}</p>
                  <p className="text-sm">{memberData.provider.phone}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon size={20} className="text-primary" />
              Pending Fee Payments
            </CardTitle>
            <CardDescription>
              {pendingFeePlans.length} pending fee
              {pendingFeePlans.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingFeePlans.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon
                  size={48}
                  className="mx-auto text-green-600 mb-3"
                />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  All Fees Paid!
                </h3>
                <p className="text-green-600">
                  You have no pending fee payments at this time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingFeePlans.map((feePlan) => (
                  <div
                    key={feePlan.id}
                    className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-lg">
                          {feePlan.name}
                        </h4>
                        {feePlan.description && (
                          <p className="text-sm text-muted-foreground">
                            {feePlan.description}
                          </p>
                        )}
                      </div>
                      {getFeeStatusBadge(feePlan)}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CurrencyInrIcon
                            size={16}
                            className="text-muted-foreground"
                          />
                          <span className="font-medium">
                            ₹{Number(feePlan.amount).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon
                            size={16}
                            className="text-muted-foreground"
                          />
                          <span>
                            Due:{" "}
                            {new Date(feePlan.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleFeePayment(feePlan.id)}
                        disabled={isPaymentProcessing}
                        className="gap-2"
                        variant={
                          new Date(feePlan.dueDate) < new Date()
                            ? "destructive"
                            : "default"
                        }
                      >
                        {isPaymentProcessing ? (
                          <SpinnerGapIcon size={16} className="animate-spin" />
                        ) : (
                          <CreditCardIcon size={16} />
                        )}
                        Pay ₹{Number(feePlan.amount).toLocaleString()}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Important Information */}
        <Alert>
          <InfoIcon size={16} />
          <AlertDescription>
            <strong>Secure Payment:</strong> All payments are processed securely
            through our certified payment gateway. You will receive a receipt
            via email after successful payment.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default DirectPayMemberPage;
