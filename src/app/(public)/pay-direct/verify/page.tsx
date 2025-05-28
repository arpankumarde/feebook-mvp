"use client";

import { OrderEntity } from "cashfree-pg";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

const PayDirect = () => {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId");

  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderEntity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data } = await api.get<OrderEntity>("/api/v1/pg/verify-order", {
          params: { orderId },
        });
        setOrderData(data);
        console.log("Order Data:", data);
        if (data.order_status === "PAID") {
          toast.success("Payment successful!");
        } else if (data.order_status === "FAILED") {
          toast.error("Payment failed");
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error || "Error verifying order";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      verifyOrder();
    } else {
      setError("Missing order details");
      setIsLoading(false);
    }
  }, [orderId]);

  const handleBackToPayment = () => {
    router.push("/pay-direct");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Payment Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-gray-500">
                Verifying payment status...
              </p>
            </div>
          ) : error ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <Button onClick={handleBackToPayment}>Back to Payment</Button>
            </div>
          ) : orderData ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-100 p-4">
                <h3 className="mb-2 font-medium">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Order ID:</span>{" "}
                    {orderData.order_id}
                  </p>
                  <p>
                    <span className="font-medium">Amount:</span> ₹
                    {Number(orderData.order_amount).toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`font-medium ${
                        orderData.order_status === "PAID"
                          ? "text-green-600"
                          : orderData.order_status === "FAILED"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {orderData.order_status}
                    </span>
                  </p>
                </div>
              </div>
              <Button
                className="w-full"
                variant={
                  orderData.order_status === "PAID" ? "outline" : "default"
                }
                onClick={handleBackToPayment}
              >
                {orderData.order_status === "PAID"
                  ? "Make Another Payment"
                  : "Back to Payment"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

const Page = () => {
  return (
    <Suspense>
      <PayDirect />
    </Suspense>
  );
};

export default Page;
