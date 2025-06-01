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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Home,
} from "lucide-react";
import Link from "next/link";
import { useConsumerAuth } from "@/hooks/use-consumer-auth";
import api from "@/lib/api";
import { toast } from "sonner";
import { OrderEntity } from "cashfree-pg";
import { OrderStatus } from "@prisma/client";
import { SLUGS } from "@/constants/slugs";

interface PaymentVerificationResult {
  success: boolean;
  paymentStatus: string;
  message: string;
  orderId?: string;
  amount?: number;
  transactionId?: string;
}

const PaymentVerifyContent = () => {
  const { consumer } = useConsumerAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [orderData, setOrderData] = useState<OrderEntity | null>(null);
  const [verificationResult, setVerificationResult] =
    useState<PaymentVerificationResult | null>(null);
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

        const response = await api.get<OrderEntity>("/api/v1/pg/verify-order", {
          params: { orderId },
        });

        const orderDetails = response.data;
        setOrderData(orderDetails);

        // Show appropriate toast based on payment status
        if (orderDetails.order_status === "PAID") {
          toast.success("Payment successful!");
        } else if (orderDetails.order_status === "FAILED") {
          toast.error("Payment failed");
        } else if (orderDetails.order_status === "PENDING") {
          toast.info("Payment is being processed");
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
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case "FAILED":
        return <XCircle className="h-12 w-12 text-red-600" />;
      case "PENDING":
        return <Clock className="h-12 w-12 text-yellow-600" />;
      default:
        return <Clock className="h-12 w-12 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Successful
          </Badge>
        );
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Processing
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "PAID":
        return {
          title: "Payment Successful!",
          message:
            "Your payment has been processed successfully. You will receive a confirmation shortly.",
          color: "text-green-700",
        };
      case "FAILED":
        return {
          title: "Payment Failed",
          message:
            "Your payment could not be processed. Please try again or contact support.",
          color: "text-red-700",
        };
      case "PENDING":
        return {
          title: "Payment Processing",
          message:
            "Your payment is being processed. This may take a few minutes.",
          color: "text-yellow-700",
        };
      default:
        return {
          title: "Payment Status Unknown",
          message: "We are checking your payment status. Please wait.",
          color: "text-gray-700",
        };
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verifying your payment...</span>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col space-y-4">
            <span>{error || "Could not verify payment status"}</span>
            <Button onClick={() => window.location.reload()} className="w-fit">
              Retry Verification
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusInfo = getStatusMessage(orderData.order_status as OrderStatus);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Payment Verification</h1>
        <p className="text-muted-foreground">
          Your payment status has been verified
        </p>
      </div>

      {verificationResult && (
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {verificationResult.success ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
            </div>
            <CardTitle
              className={`text-xl ${
                verificationResult.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {verificationResult.success
                ? "Payment Successful!"
                : "Payment Failed"}
            </CardTitle>
            <CardDescription>{verificationResult.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">
                  Order ID:
                </span>
                <p className="font-medium">
                  {verificationResult.orderId || orderId}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Status:
                </span>
                <Badge
                  variant={
                    verificationResult.success ? "default" : "destructive"
                  }
                >
                  {verificationResult.paymentStatus}
                </Badge>
              </div>
              {verificationResult.amount && (
                <div>
                  <span className="font-medium text-muted-foreground">
                    Amount:
                  </span>
                  <p className="font-medium">₹{verificationResult.amount}</p>
                </div>
              )}
              {verificationResult.transactionId && (
                <div>
                  <span className="font-medium text-muted-foreground">
                    Transaction ID:
                  </span>
                  <p className="font-medium">
                    {verificationResult.transactionId}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => router.push(`/${SLUGS.CONSUMER}/dashboard`)}
                className="flex-1"
              >
                Back to Dashboard
              </Button>
              {verificationResult.success && (
                <Button
                  onClick={() => router.push(`/${SLUGS.CONSUMER}/memberships`)}
                  className="flex-1"
                >
                  View Memberships
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const PaymentVerifyPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentVerifyContent />
    </Suspense>
  );
};

export default PaymentVerifyPage;
