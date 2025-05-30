"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FeePlan, Member, Provider } from "@prisma/client";
import { toast } from "sonner";
import cashfree from "@/lib/cfpg_client";
import { OrderEntity } from "cashfree-pg";
import { CreateOrderDto } from "@/app/api/v1/pg/create-order/route";

interface PGResponse {
  paymentDetails?: {
    paymentMessage: string;
  };
  error?: string;
  redirect?: boolean;
}

const Page = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [organizationCode, setOrganizationCode] = useState("");
  const [memberUniqueId, setMemberUniqueId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyProvider = async () => {
    if (!organizationCode) {
      setError("Please enter an organization code");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get(
        `/api/v1/provider/by-code/${organizationCode}`
      );
      setProvider(data);
      setStep(2);
    } catch (error: any) {
      setError(error.response?.data?.message || "Organization not found");
      toast.error("Organization not found");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMember = async () => {
    if (!memberUniqueId) {
      setError("Please enter your member ID");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get(`/api/v1/provider/member/by-uniqueid`, {
        params: {
          providerId: provider?.id,
          uniqueId: memberUniqueId,
        },
      });
      setMember(data.member);
      setFeePlans(data.feePlans);
      setStep(3);
    } catch (error: any) {
      setError(error.response?.data?.message || "Member not found");
      toast.error("Member not found");
    } finally {
      setIsLoading(false);
    }
  };

  const doPayment = async (
    paymentSessionId: string,
    currentOrderId: string
  ) => {
    let checkoutOptions = {
      paymentSessionId: paymentSessionId,
      // redirectTarget: "_top",
      redirectTarget: "_modal",
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
        router.push(`/pay-direct/verify?orderId=${currentOrderId}`);
      }
    });
  };

  const handlePayment = async (feePlanId: string) => {
    try {
      setIsLoading(true);
      const { data } = await api.post<OrderEntity>("/api/v1/pg/create-order", {
        feePlanId,
        memberId: member?.id, // Use member.id instead of member.uniqueId
        providerId: provider?.id,
      });

      if (data && data?.payment_session_id && data?.order_id) {
        doPayment(data?.payment_session_id, data?.order_id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create payment");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <CardHeader>
              <CardTitle>Find Your Organization</CardTitle>
              <CardDescription>
                Enter the organization code to proceed with payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationCode">Organization Code</Label>
                  <Input
                    id="organizationCode"
                    placeholder="Enter organization code"
                    value={organizationCode}
                    onChange={(e) => setOrganizationCode(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleVerifyProvider}
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Next"}
              </Button>
            </CardFooter>
          </>
        );
      case 2:
        return (
          <>
            <CardHeader>
              <CardTitle>Enter Your Member ID</CardTitle>
              <CardDescription>
                {provider?.name} - Enter your member ID to view your fee plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="memberUniqueId">Member ID</Label>
                  <Input
                    id="memberUniqueId"
                    placeholder="Enter your member ID"
                    value={memberUniqueId}
                    onChange={(e) => setMemberUniqueId(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleVerifyMember} disabled={isLoading}>
                {isLoading ? "Verifying..." : "Next"}
              </Button>
            </CardFooter>
          </>
        );
      case 3:
        return (
          <>
            <CardHeader>
              <CardTitle>Your Fee Plans</CardTitle>
              <CardDescription>
                {member?.firstName} {member?.lastName} - Select a fee plan to
                pay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feePlans.length === 0 ? (
                  <p className="text-center py-4">No pending fee plans found</p>
                ) : (
                  <div className="space-y-4">
                    {feePlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between">
                          <h3 className="font-medium">{plan.name}</h3>
                          <span className="font-bold">
                            ₹{Number(plan.amount).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {plan.description || "No description"}
                        </p>
                        <div className="flex justify-between items-center">
                          <p className="text-sm">
                            Due: {new Date(plan.dueDate).toLocaleDateString()}
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handlePayment(plan.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? "Processing..." : "Pay Now"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
            </CardFooter>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">{renderStep()}</Card>
    </div>
  );
};

export default Page;
