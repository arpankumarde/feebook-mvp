"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { OrderEntity } from "cashfree-pg";
import { useRouter } from "next/navigation";
import cashfree from "@/lib/cfpg_client";
import { CreateOrderDto } from "@/app/api/pg/create-order/route";
import { Enrollment, PaymentSchedule } from "@/generated/prisma";

interface ApiResponse {
  enrollment?: Enrollment & { fees: PaymentSchedule[] };
  latestUnpaidFee?: PaymentSchedule | null;
  error?: string;
}

interface PGResponse {
  paymentDetails?: {
    paymentMessage: string;
  };
  error?: string;
  redirect?: boolean;
}

const Page = () => {
  const router = useRouter();

  const [enrollmentId, setEnrollmentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<ApiResponse>();
  const [error, setError] = useState<string | null>(null);

  const handleFetchEnrollment = async () => {
    if (!enrollmentId) {
      toast.error("Please enter an enrollment number");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data } = await axios.get<ApiResponse>(
        `/api/enrollment/find-unpaid`,
        {
          params: { enrollmentId },
        }
      );

      if (data.enrollment) {
        setEnrollmentData(data);
        console.log("Enrollment Data:", data);
      } else {
        setError(data.error || "Failed to fetch enrollment details");
        toast.error(data.error || "Failed to fetch enrollment details");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.error || "Failed to fetch enrollment details"
        );
        toast.error(
          error.response?.data?.error || "Failed to fetch enrollment details"
        );
      } else {
        setError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      }
      console.error("Error fetching enrollment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = () => {
    const createOrderRequestBody: CreateOrderDto = {
      enrollmentId: enrollmentData?.enrollment?.enrollmentId ?? "",
      orderAmount: Number(enrollmentData?.latestUnpaidFee?.dueAmount) ?? 1.0,
      customerName: enrollmentData?.enrollment?.studentName ?? "",
      customerPhone: enrollmentData?.enrollment?.studentPhone ?? "",
      customerEmail: enrollmentData?.enrollment?.studentEmail ?? "",
      paymentScheduleId: enrollmentData?.latestUnpaidFee?.id ?? "",
    };

    axios
      .post<OrderEntity>("/api/pg/create-order", createOrderRequestBody)
      .then((response) => {
        console.log("Order Created successfully:", response.data);
        if (response.data.payment_session_id && response.data.order_id) {
          toast.success("Order created successfully");
          doPayment(response.data.payment_session_id, response.data.order_id);
        }
      })
      .catch((error) => {
        console.error("Error:", error.response.data.error);
        toast.error(error.response.data.error);
      });
  };

  const doPayment = async (
    paymentScheduleId: string,
    currentOrderId: string
  ) => {
    let checkoutOptions = {
      paymentScheduleId: paymentScheduleId,
      redirectTarget: "_top",
    };
    cashfree.checkout(checkoutOptions).then((result: PGResponse) => {
      console.log("Payment Result", result);
      if (result.error) {
        console.log(
          "User has closed the popup or there is some payment error, Check for Payment Status"
        );
        console.log(result.error);
      }
      if (result.redirect) {
        // This will be true when the payment redirection page couldnt be opened in the same window
        // This is an exceptional case only when the page is opened inside an inAppBrowser
        // In this case the customer will be redirected to return url once payment is completed
        console.log("Payment will be redirected");
      }
      if (result.paymentDetails) {
        console.log("Payment Details", result);
        console.log(
          "Payment has been completed, Check for Payment Status:",
          result.paymentDetails.paymentMessage
        );
        router.push(`/pay/verify?orderId=${currentOrderId}`);
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Fee Payment</CardTitle>
          <CardDescription>
            Enter your enrollment number to view and pay your fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!enrollmentData ? (
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="enrollmentId">Enrollment Number</Label>
                <Input
                  id="enrollmentId"
                  name="enrollmentId"
                  title="Enrollment Number"
                  placeholder="Enter your enrollment number"
                  value={enrollmentId}
                  onChange={(e) => setEnrollmentId(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleFetchEnrollment}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Fetch Details"}
              </Button>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-100 p-4">
                <h3 className="font-medium">Student Details</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {enrollmentData?.enrollment?.studentName}
                  </p>
                  <p>
                    <span className="font-medium">Enrollment ID:</span>{" "}
                    {enrollmentData?.enrollment?.enrollmentId}
                  </p>
                  {enrollmentData?.enrollment?.studentEmail && (
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {enrollmentData?.enrollment?.studentEmail}
                    </p>
                  )}
                  {enrollmentData?.enrollment?.studentPhone && (
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {enrollmentData?.enrollment?.studentPhone}
                    </p>
                  )}
                </div>
              </div>

              {enrollmentData.latestUnpaidFee ? (
                <div className="rounded-lg bg-blue-50 p-4">
                  <h3 className="font-medium">Latest Unpaid Fee</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Month:</span>{" "}
                      {format(
                        new Date(enrollmentData.latestUnpaidFee.month),
                        "MMMM yyyy"
                      )}
                    </p>
                    <p>
                      <span className="font-medium">Amount Due:</span> ₹
                      {Number(enrollmentData.latestUnpaidFee.dueAmount).toFixed(
                        2
                      )}
                    </p>
                    <p>
                      <span className="font-medium">Due Date:</span>{" "}
                      {format(
                        new Date(enrollmentData.latestUnpaidFee.dueDate),
                        "dd MMM yyyy"
                      )}
                    </p>
                  </div>
                  <Button className="mt-4 w-full" onClick={handlePayment}>
                    Pay Now
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <p className="text-green-700">No pending fees found!</p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEnrollmentData({});
                  setError(null);
                }}
              >
                Search Another Enrollment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
