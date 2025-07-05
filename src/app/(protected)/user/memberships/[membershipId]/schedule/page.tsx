"use client";

import React, { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CreditCardIcon,
  CurrencyInrIcon,
  SpinnerGapIcon,
  UserIcon,
  BuildingsIcon,
  ClockIcon,
  CheckCircleIcon,
  WarningIcon,
  XIcon,
  IdentificationBadgeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { SLUGS } from "@/constants/slugs";
import ConsumerTopbar from "@/components/layout/consumer/ConsumerTopbar";
import {
  Consumer,
  ConsumerMember,
  FeePlan,
  Member,
  Provider,
} from "@prisma/client";
import { APIResponse } from "@/types/common";
import Link from "next/link";
import { FeeBubble } from "@/components/consumer/FeeBubble";
import { formatAmount } from "@/utils/formatAmount";

interface PaySchedule extends ConsumerMember {
  consumer: Consumer;
  member: Member & {
    feePlans: FeePlan[];
    provider: Provider;
  };
}

const PaymentSchedulePage = () => {
  const params = useParams();
  const router = useRouter();
  const membershipId = params.membershipId as string;

  const [membership, setMembership] = useState<PaySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingFeePlanId, setPayingFeePlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembershipDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<APIResponse<PaySchedule>>(
          `/api/v1/consumer/memberships/${membershipId}`
        );

        if (response.data.success && response.data.data) {
          setMembership(response.data.data);
        } else {
          setError("Membership not found");
        }
      } catch (err) {
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
    } catch (err) {
      console.error("Error initiating payment:", err);
      setError("Failed to initiate payment");
    } finally {
      setPayingFeePlanId(null);
    }
  };

  const getStatusBadge = (
    status: string,
    isOfflinePaid: boolean,
    dueDate?: string
  ) => {
    if (isOfflinePaid) {
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircleIcon size={12} weight="fill" />
          Paid Offline
        </Badge>
      );
    }

    switch (status) {
      case "PAID":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircleIcon size={12} weight="fill" />
            Paid
          </Badge>
        );
      case "DUE":
        // check if the due has already passed, the show overdue badge
        const today = new Date();
        // console.log("Due Date:", dueDate);
        if (dueDate && new Date(dueDate) < today) {
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
        <div className="flex items-center space-x-3 text-muted-foreground">
          <SpinnerGapIcon size={20} className="animate-spin text-primary" />
          <span className="text-sm">Loading membership details...</span>
        </div>
      </div>
    );
  }

  if (error || !membership) {
    return (
      <div className="space-y-4 p-4">
        <Alert variant="destructive">
          <XIcon size={16} />
          <AlertDescription>{error || "Membership not found"}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeftIcon size={16} />
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

  const sortedFeePlans = [...membership.member.feePlans].sort((a, b) => {
    // First, prioritize unpaid fees over paid ones
    const aIsPaid = a.status === "PAID" || a.isOfflinePaid;
    const bIsPaid = b.status === "PAID" || b.isOfflinePaid;

    if (aIsPaid !== bIsPaid) {
      return aIsPaid ? 1 : -1; // Unpaid fees come first
    }

    // Within each group (paid/unpaid), sort by due date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <>
      <ConsumerTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">
            Payment Schedule
          </h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your payment schedules
          </p>
        </div>
      </ConsumerTopbar>

      <div className="max-sm:hidden grid grid-cols-1 lg:grid-cols-12 p-4 sm:p-6 gap-2 lg:gap-6">
        <div className="space-y-4 col-span-1 lg:col-span-6">
          {/* Back Button */}
          <div className="sm:hidden">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeftIcon size={16} />
              Back to Dashboard
            </Button>
          </div>

          {/* Member Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <UserIcon size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{memberName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <IdentificationBadgeIcon size={14} />
                    ID: {membership.member.uniqueId}
                  </CardDescription>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <BuildingsIcon size={14} />
                    {membership.member.provider.name}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {/* Organization Details */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Organization
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Address:</span>{" "}
                      {membership.member.provider.city},{" "}
                      {membership.member.provider.region},{" "}
                      {membership.member.provider.country}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Category:</span>{" "}
                      {membership.member.provider.category}
                    </p>
                  </div>
                </div>

                {/* Member Details */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Member Details
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Category:</span>{" "}
                      {membership.member.category || "N/A"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Subcategory:</span>{" "}
                      {membership.member.subcategory || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="max-md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <CurrencyInrIcon
                      size={24}
                      className="text-blue-600"
                      weight="bold"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Total Amount
                    </p>
                    <p className="text-2xl font-bold">
                      ₹{calculateTotalAmount().toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <CreditCardIcon
                      size={24}
                      className="text-orange-600"
                      weight="bold"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Pending Amount
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      ₹{calculatePendingAmount().toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CalendarIcon
                      size={24}
                      className="text-green-600"
                      weight="bold"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Total Plans
                    </p>
                    <p className="text-2xl font-bold">
                      {membership.member.feePlans.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fee Plans */}
        <div className="col-span-1 lg:col-span-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon size={20} />
                Fee Plans
              </CardTitle>
              <CardDescription>
                All fee plans for this membership sorted by due date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedFeePlans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No fee plans found for this membership.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedFeePlans.map((plan) => {
                    const dueDate = new Date(plan.dueDate);
                    const isOverdue =
                      dueDate < new Date() &&
                      plan.status !== "PAID" &&
                      !plan.isOfflinePaid;
                    const canPay =
                      plan.status !== "PAID" && !plan.isOfflinePaid;

                    return (
                      <Card
                        key={plan.id}
                        className={`transition-all duration-200 flex flex-col py-4 md:flex-row md:items-center justify-between gap-2 ${
                          isOverdue
                            ? "border-red-300 bg-red-50/50"
                            : plan.status === "PAID" || plan.isOfflinePaid
                            ? "border-green-300 bg-green-50/50"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <CardContent className="px-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-lg">
                                  {plan.name}
                                </h3>
                              </div>

                              {plan.description && (
                                <p className="text-sm text-muted-foreground">
                                  {plan.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  {plan.status === "PAID" ? (
                                    <span>
                                      {getStatusBadge(
                                        plan.status,
                                        plan.isOfflinePaid
                                      )}
                                    </span>
                                  ) : (
                                    <>
                                      <span>
                                        {getStatusBadge(
                                          plan.status,
                                          plan.isOfflinePaid,
                                          plan.dueDate.toString()
                                        )}{" "}
                                        {dueDate.toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "2-digit",
                                        })}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center font-medium">
                                  {formatAmount(Number(plan.amount))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardContent className="px-4">
                          <div className="flex flex-col gap-2">
                            {canPay && (
                              <Button
                                onClick={() => handlePayment(plan.id)}
                                disabled={payingFeePlanId === plan.id}
                                className="gap-2"
                              >
                                {payingFeePlanId === plan.id ? (
                                  <SpinnerGapIcon
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <CreditCardIcon size={16} weight="fill" />
                                )}
                                {payingFeePlanId === plan.id
                                  ? "Processing..."
                                  : "Pay Now"}
                              </Button>
                            )}

                            {plan.status === "PAID" && !plan.isOfflinePaid && (
                              <div className="flex md:flex-col justify-between gap-2">
                                {plan.receipt && (
                                  <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    size="sm"
                                  >
                                    <Link href={plan.receipt} target="_blank">
                                      View Receipt
                                    </Link>
                                  </Button>
                                )}

                                <Button
                                  variant={"outline"}
                                  size="sm"
                                  onClick={() => handlePayment(plan.id)}
                                >
                                  View Details
                                </Button>
                              </div>
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
      </div>

      <div className="sm:hidden">
        <div className="col-span-1 lg:col-span-6">
          <Card className="border-0 shadow-none rounded-none py-0 gap-0">
            <CardHeader className="flex items-center py-2">
              <CardTitle className="text-xl">{memberName} |</CardTitle>
              <CardDescription className="font-mono text-black text-xs bg-muted px-2 py-1 rounded-lg">
                {membership.member.uniqueId}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4">
              {sortedFeePlans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No fee plans found for this membership.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedFeePlans.map((plan, index) => {
                    return (
                      <FeeBubble
                        key={index}
                        feePlan={plan}
                        onPayment={handlePayment}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PaymentSchedulePage;

// {/* <Card
//                           key={plan.id}
//                           className={`transition-all duration-200 flex flex-col py-4 md:flex-row md:items-center justify-between gap-2 ${
//                             isOverdue
//                               ? "border-red-300 bg-red-50/50"
//                               : plan.status === "PAID" || plan.isOfflinePaid
//                               ? "border-green-300 bg-green-50/50"
//                               : "border-border hover:border-primary/50"
//                           }`}
//                         >
//                           <CardContent className="px-4">
//                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                               <div className="flex-1 space-y-2">
//                                 <div className="flex items-start justify-between">
//                                   <h3 className="font-semibold text-lg">
//                                     {plan.name}
//                                   </h3>
//                                 </div>

//                                 {plan.description && (
//                                   <p className="text-sm text-muted-foreground">
//                                     {plan.description}
//                                   </p>
//                                 )}

//                                 <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
//                                   <div className="flex items-center gap-1">
//                                     {plan.status === "PAID" ? (
//                                       <span>
//                                         {getStatusBadge(
//                                           plan.status,
//                                           plan.isOfflinePaid
//                                         )}
//                                       </span>
//                                     ) : (
//                                       <>
//                                         <span>
//                                           {getStatusBadge(
//                                             plan.status,
//                                             plan.isOfflinePaid,
//                                             plan.dueDate.toString()
//                                           )}{" "}
//                                           {dueDate.toLocaleDateString()}
//                                         </span>
//                                       </>
//                                     )}
//                                   </div>
//                                   <div className="flex items-center font-medium">
//                                     ₹{Number(plan.amount).toLocaleString()}
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           </CardContent>
//                           <CardContent className="px-4">
//                             <div className="flex flex-col gap-2">
//                               {canPay && (
//                                 <Button
//                                   onClick={() => handlePayment(plan.id)}
//                                   disabled={payingFeePlanId === plan.id}
//                                   className="gap-2"
//                                 >
//                                   {payingFeePlanId === plan.id ? (
//                                     <SpinnerGapIcon
//                                       size={16}
//                                       className="animate-spin"
//                                     />
//                                   ) : (
//                                     <CreditCardIcon size={16} weight="fill" />
//                                   )}
//                                   {payingFeePlanId === plan.id
//                                     ? "Processing..."
//                                     : "Pay Now"}
//                                 </Button>
//                               )}

//                               {plan.status === "PAID" &&
//                                 !plan.isOfflinePaid && (
//                                   <div className="flex md:flex-col justify-between gap-2">
//                                     {plan.receipt && (
//                                       <Button
//                                         className="bg-green-600 hover:bg-green-700"
//                                         size="sm"
//                                       >
//                                         <Link
//                                           href={plan.receipt}
//                                           target="_blank"
//                                         >
//                                           View Receipt
//                                         </Link>
//                                       </Button>
//                                     )}

//                                     <Button
//                                       variant={"outline"}
//                                       size="sm"
//                                       onClick={() => handlePayment(plan.id)}
//                                     >
//                                       View Details
//                                     </Button>
//                                   </div>
//                                 )}
//                             </div>
//                           </CardContent>
//                         </Card> */}
