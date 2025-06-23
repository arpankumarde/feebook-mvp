"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { Order, OrderStatus, Transaction } from "@prisma/client";
import {
  SpinnerGapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  ReceiptIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import { formatAmount } from "@/utils/formatAmount";
import { OrderTags } from "@/types/cfOrderTypes";
import { PaymentMethod } from "@/types/cfTransactions";

interface ExtendedPayment extends Omit<Transaction, "paymentMethod"> {
  paymentMethod?: PaymentMethod;
}

interface APIResponse {
  order?: Order & { orderTags?: OrderTags };
  payments?: ExtendedPayment[];
  receipt?: string | null;
}

const PaymentVerifyContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [orderData, setOrderData] = useState<APIResponse["order"] | null>(null);
  const [paymentData, setPaymentData] = useState<ExtendedPayment[] | null>(
    null
  );
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<APIResponse>("/api/v1/pg/verify-order", {
          params: { orderId },
        });

        const orderDetails = data?.order;
        const payments = data?.payments || [];

        if (orderDetails) {
          setOrderData(orderDetails);
          setPaymentData(payments);
          setReceiptUrl(data.receipt || null);

          // Show appropriate toast based on payment status
          switch (orderDetails.status) {
            case "PAID":
              toast.success("Payment successful!");
              break;
            case "ACTIVE":
              toast.error("Payment is still active");
              break;
            case "EXPIRED":
              toast.error("Payment expired");
              break;
            case "TERMINATED":
            case "TERMINATION_REQUESTED":
              toast.info("Payment is being processed");
              break;
          }
        } else {
          setError("Order details not found");
        }
      } catch (err: any) {
        console.error("Error verifying payment:", err);
        const errorMessage =
          err.response?.data?.error || "Failed to verify payment";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [orderId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <CheckCircleIcon size={48} className="text-green-600" weight="fill" />
        );
      case "FAILED":
        return <XCircleIcon size={48} className="text-red-600" weight="fill" />;
      case "PENDING":
        return (
          <ClockIcon size={48} className="text-yellow-600" weight="fill" />
        );
      default:
        return <ClockIcon size={48} className="text-gray-600" weight="fill" />;
    }
  };

  const getStatusMessage = (status: OrderStatus) => {
    switch (status) {
      case "PAID":
        return {
          title: "Payment Successful!",
          message:
            "Your payment has been processed successfully. You will receive a confirmation shortly.",
          color: "text-green-800",
          bgColor: "bg-green-50",
          borderColor: "border-green-600/40",
        };
      case "EXPIRED":
        return {
          title: "Payment window Expired",
          message:
            "Your payment could not be processed. Please try again or contact support.",
          color: "text-red-700",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      case "ACTIVE":
        return {
          title: "Payment Processing",
          message:
            "Your payment is being processed. This may take a few minutes.",
          color: "text-yellow-700",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
      default:
        return {
          title: "Payment Status Unknown",
          message: "We are checking your payment status. Please wait.",
          color: "text-gray-700",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <SpinnerGapIcon size={24} className="animate-spin text-primary" />
              <span className="font-medium">Verifying your payment...</span>
            </div>
          </Card>
        </div>
      </>
    );
  }

  if (error || !orderData) {
    return (
      <>
        <div className="max-w-2xl mx-auto p-6">
          <Alert variant="destructive">
            <XCircleIcon size={16} />
            <AlertDescription className="flex flex-col space-y-4">
              <span>{error || "Could not verify payment status"}</span>
              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()} size="sm">
                  Retry Verification
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  size="sm"
                >
                  Go Back
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  const statusInfo = getStatusMessage(orderData.status);
  const latestPayment = paymentData ? paymentData[0] : null; // Most recent payment

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Payment Status Card */}
        <Card className={`${statusInfo.borderColor} ${statusInfo.bgColor}`}>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {getStatusIcon(orderData.status)}
            </div>
            <CardTitle className={`text-2xl ${statusInfo.color}`}>
              {statusInfo.title}
            </CardTitle>
            <CardDescription className={`text-sm ${statusInfo.color}`}>
              {statusInfo.message}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Payment Details */}
        {latestPayment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCardIcon size={20} className="text-primary" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Payment ID
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {latestPayment.externalPaymentId}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Payment Method
                    </span>
                    <span className="font-mono text-sm capitalize">
                      {Object.keys(latestPayment.paymentMethod || {}).join(
                        ", "
                      ) || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Gateway
                    </span>
                    <span className="font-mono text-sm">
                      {latestPayment.paymentGateway}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Order ID
                    </span>
                    <span className="font-mono text-sm">
                      {orderData.externalOrderId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Amount Paid
                    </span>
                    <span className="font-mono text-sm">
                      {formatAmount(Number(latestPayment.amount))}
                    </span>
                  </div>

                  {latestPayment.paymentTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Payment Time
                      </span>
                      <span className="font-mono text-sm">
                        {new Date(latestPayment.paymentTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="bg-primary/10 border-primary/40 shadow-primary/10 shadow-md py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon size={30} className="text-primary" />
              <div>
                <p className="text-sm font-bold text-primary">
                  Secure Transaction
                </p>
                <p className="text-xs">
                  This transaction was processed securely with 256-bit SSL
                  encryption
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="flex-1" size={"lg"} asChild>
            <Link href={`/`}>
              <ArrowLeftIcon size={16} />
              Go to Home
            </Link>
          </Button>

          {orderData.status === "PAID" && (
            <Button
              className="flex-1"
              size={"lg"}
              onClick={() => {
                if (receiptUrl) {
                  // Download receipt if available
                  window.open(receiptUrl, "_blank");
                } else {
                  toast.info("Receipt download will be available soon");
                }
              }}
            >
              <ReceiptIcon size={16} />
              Download Receipt
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

const Page = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <SpinnerGapIcon size={24} className="animate-spin" />
        </div>
      }
    >
      <PaymentVerifyContent />
    </Suspense>
  );
};

export default Page;
