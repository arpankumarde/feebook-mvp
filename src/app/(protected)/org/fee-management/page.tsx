"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Member, FeePlan } from "@prisma/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import ProviderTopbar from "@/components/layout/provider/ProviderTopbar";
import { APIResponse } from "@/types/common";
import { useSearchParams } from "next/navigation";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  CalendarBlankIcon,
  UserIcon,
  CreditCardIcon,
  CheckCircleIcon,
  WalletIcon,
  WarningIcon,
  TrashIcon,
  SquaresFourIcon,
  RowsIcon,
  SpinnerGapIcon,
  ClockIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExtendedMember extends Member {
  feePlans: FeePlan[] | null;
}

interface FeePlanFormData {
  id?: string;
  name: string;
  description: string;
  amount: string;
  dueDate: Date | undefined;
  isPaid: boolean;
  isDeleted?: boolean;
}

const Page = () => {
  const {
    provider,
    isAuthenticated,
    loading: isAuthLoading,
  } = useProviderAuth();

  const params = useSearchParams();
  const uniqueId = params.get("uniqueId");
  const [layout, setLayout] = useState<"table" | "card">("card");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      toast.error("Provider not found. Please log in again.");
    }
  }, [isAuthenticated, isAuthLoading]);

  const [searchId, setSearchId] = useState(uniqueId || "");
  const [member, setMember] = useState<ExtendedMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [feePlans, setFeePlans] = useState<FeePlanFormData[]>([
    {
      id: undefined,
      name: "",
      description: "",
      amount: "",
      dueDate: undefined,
      isPaid: false,
    },
  ]);
  // Store original fee plans to compare changes
  const [originalFeePlans, setOriginalFeePlans] = useState<FeePlanFormData[]>(
    []
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [markingPayment, setMarkingPayment] = useState<string | null>(null);

  const fetchMember = async () => {
    if (!searchId || !provider?.id) return;

    setLoading(true);
    setError("");
    setMember(null);

    try {
      // Search by memberId only
      const response = await api.get<APIResponse<ExtendedMember>>(
        `/api/v1/provider/feeplan?providerId=${provider.id}&memberId=${searchId}`
      );

      if (!response.data) {
        throw new Error("Member not found");
      }

      if (response.data.success && response.data.data) {
        setMember(response.data.data);
      }

      // If member has existing fee plans, populate the form
      if (
        response?.data?.data?.feePlans &&
        response.data.data.feePlans.length > 0
      ) {
        const existingPlans = response.data.data.feePlans.map(
          (plan: FeePlan) => ({
            id: plan.id,
            name: plan.name,
            description: plan.description || "",
            amount: plan.amount.toString(),
            dueDate: new Date(plan.dueDate),
            isPaid: plan.status === "PAID",
            isDeleted: false,
          })
        );
        setFeePlans(existingPlans);

        // Store original fee plans for comparison
        setOriginalFeePlans(JSON.parse(JSON.stringify(existingPlans)));
      } else {
        // Reset to empty state if no fee plans
        setFeePlans([
          {
            id: undefined,
            name: "",
            description: "",
            amount: "",
            dueDate: undefined,
            isPaid: false,
          },
        ]);
        setOriginalFeePlans([]);
      }
    } catch (err) {
      console.error("Error fetching member:", err);
      setError("Failed to fetch member details. Please check the Member ID.");
    } finally {
      setLoading(false);
    }
  };

  const addFeePlan = () => {
    setFeePlans([
      ...feePlans,
      {
        id: undefined,
        name: "",
        description: "",
        amount: "",
        dueDate: undefined,
        isPaid: false,
      },
    ]);
  };

  const removeFeePlan = (index: number) => {
    if (feePlans.length === 1) return;

    const updatedPlans = [...feePlans];
    const plan = updatedPlans[index];

    // If the plan has an ID (existing plan), mark it as deleted instead of removing
    if (plan.id) {
      updatedPlans[index] = { ...plan, isDeleted: true };
      setFeePlans(updatedPlans);
    } else {
      // If it's a new plan, remove it from the array
      updatedPlans.splice(index, 1);
      setFeePlans(updatedPlans);
    }
  };

  const handleFeePlanChange = (
    index: number,
    field: keyof FeePlanFormData,
    value: any
  ) => {
    const updatedPlans = [...feePlans];
    updatedPlans[index] = { ...updatedPlans[index], [field]: value };
    setFeePlans(updatedPlans);
  };

  const handleSubmit = async () => {
    if (!member || !provider?.id) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Get visible (non-deleted) plans
      const visiblePlans = feePlans.filter((plan) => !plan.isDeleted);

      // Validate all visible fee plans
      const invalidPlans = visiblePlans.filter(
        (plan) => !plan.name || !plan.amount || !plan.dueDate
      );

      if (invalidPlans.length > 0) {
        setError("Please fill in all required fields for each fee plan.");
        setLoading(false);
        return;
      }

      const promises = [];

      // Handle deleted plans
      const deletedPlans = feePlans.filter((plan) => plan.isDeleted && plan.id);
      for (const plan of deletedPlans) {
        promises.push(
          api.delete(`/api/v1/provider/feeplan`, {
            data: { feePlanId: plan.id },
          })
        );
      }

      // Handle new and modified plans
      for (const plan of visiblePlans) {
        const feePlanData = {
          providerId: provider.id,
          memberId: member.id,
          name: plan.name,
          description: plan.description,
          amount: parseFloat(plan.amount),
          dueDate: plan.dueDate,
        };

        // If plan has an ID, check if it was modified before updating
        if (plan.id) {
          // Find the original plan to compare
          const originalPlan = originalFeePlans.find((p) => p.id === plan.id);

          // Check if plan was modified
          const isModified =
            !originalPlan ||
            originalPlan.name !== plan.name ||
            originalPlan.description !== plan.description ||
            originalPlan.amount !== plan.amount ||
            (originalPlan.dueDate &&
              plan.dueDate &&
              originalPlan.dueDate !== plan.dueDate);

          // Only update if modified
          if (isModified) {
            promises.push(
              api.put(`/api/v1/provider/feeplan`, {
                feePlan: { ...feePlanData, id: plan.id },
              })
            );
          }
        } else {
          // Create new plan
          promises.push(
            api.post("/api/v1/provider/feeplan", { feePlan: feePlanData })
          );
        }
      }

      await Promise.all(promises);

      // Refresh the member data to get updated fee plans
      await fetchMember();

      setSuccess(true);
      toast.success("Fee plans saved successfully!");
    } catch (err) {
      console.error("Error saving fee plans:", err);
      setError("Failed to save fee plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualPayment = async (feePlanId: string, isPaid: boolean) => {
    if (!provider?.id) return;

    try {
      setMarkingPayment(feePlanId);

      const response = await api.post("/api/v1/provider/feeplan/mark-paid", {
        feePlanId,
        isOfflinePaid: isPaid,
        providerId: provider.id,
      });

      if (response.data.success) {
        toast.success(
          isPaid
            ? "Fee marked as paid successfully!"
            : "Fee marked as unpaid successfully!"
        );

        // Refresh member data to show updated status
        await fetchMember();
      } else {
        throw new Error(
          response.data.error || "Failed to update payment status"
        );
      }
    } catch (err: any) {
      console.error("Error marking payment:", err);
      toast.error(
        err.response?.data?.error ||
          err.message ||
          "Failed to update payment status"
      );
    } finally {
      setMarkingPayment(null);
    }
  };

  useEffect(() => {
    // If uniqueId is provided in the URL, fetch member details automatically
    if (uniqueId && provider?.id) {
      setSearchId(uniqueId);
      fetchMember();
    }
  }, [uniqueId, provider?.id]);

  return (
    <>
      <ProviderTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Fee Management</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage member fee plans
          </p>
        </div>
      </ProviderTopbar>

      <div className="p-4 space-y-4">
        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MagnifyingGlassIcon
                className="h-5 w-5 text-primary"
                weight="duotone"
              />
              Search Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter Member Unique ID"
                  className="h-10"
                />
              </div>
              <Button
                onClick={fetchMember}
                disabled={loading || !searchId}
                size={"lg"}
                className="w-36"
              >
                {loading ? (
                  "Searching..."
                ) : (
                  <>
                    <MagnifyingGlassIcon
                      className="h-4 w-4 mr-2"
                      weight="duotone"
                    />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <WarningIcon weight="fill" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-900">
            <CheckCircleIcon weight="fill" />
            <AlertDescription className="text-inherit">
              Fee plans saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {member && (
          <div className="space-y-4">
            {/* Member Details Card */}
            <Card className="gap-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserIcon className="h-5 w-5 text-primary" weight="duotone" />
                  Member Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Full Name
                    </Label>
                    <p className="font-medium">
                      {`${member.firstName} ${
                        member.middleName ? member.middleName + " " : ""
                      }${member.lastName}`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Member ID
                    </Label>
                    <Badge variant="secondary" className="font-mono">
                      {member.uniqueId}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Phone
                    </Label>
                    <p className="font-medium">{member.phone || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Email
                    </Label>
                    <p className="font-medium text-sm">
                      {member.email || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fee Plans Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCardIcon
                      className="h-5 w-5 text-primary"
                      weight="duotone"
                    />
                    Fee Plans
                  </CardTitle>
                  <div className="flex gap-2">
                    <div className="px-2">
                      <Button
                        size="sm"
                        className="rounded-e-none border"
                        variant={layout == "card" ? "secondary" : "default"}
                        onClick={() => setLayout("table")}
                      >
                        <RowsIcon />
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-s-none"
                        variant={layout == "table" ? "secondary" : "default"}
                        onClick={() => setLayout("card")}
                      >
                        <SquaresFourIcon />
                      </Button>
                    </div>
                    <Button size="sm" onClick={addFeePlan} className="gap-2">
                      <PlusIcon className="size-4" weight="bold" />
                      Add Plan
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {layout === "table" && (
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feePlans.map(
                        (plan, index) =>
                          !plan.isDeleted && (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Input
                                  id={`name-${index}`}
                                  value={plan.name}
                                  onChange={(e) =>
                                    handleFeePlanChange(
                                      index,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., Tuition Fee"
                                  disabled={plan.isPaid}
                                  className="h-9"
                                  required
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  id={`description-${index}`}
                                  value={plan.description}
                                  onChange={(e) =>
                                    handleFeePlanChange(
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., May Month"
                                  disabled={plan.isPaid}
                                  className="h-9"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  id={`amount-${index}`}
                                  type="number"
                                  value={plan.amount}
                                  onChange={(e) =>
                                    handleFeePlanChange(
                                      index,
                                      "amount",
                                      e.target.value
                                    )
                                  }
                                  step={0.01}
                                  min={1}
                                  placeholder="0.00"
                                  disabled={plan.isPaid}
                                  className="h-9"
                                  required
                                />
                              </TableCell>
                              <TableCell>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full h-9 justify-start text-left font-normal",
                                        !plan.dueDate && "text-muted-foreground"
                                      )}
                                      disabled={plan.isPaid}
                                    >
                                      <CalendarBlankIcon
                                        className="mr-2 h-4 w-4"
                                        weight="duotone"
                                      />
                                      {plan.dueDate ? (
                                        format(plan.dueDate, "PPP")
                                      ) : (
                                        <span>Select date</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={plan.dueDate}
                                      onSelect={(date) =>
                                        handleFeePlanChange(
                                          index,
                                          "dueDate",
                                          date
                                        )
                                      }
                                    />
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                              <TableCell>
                                {plan.isPaid ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <CheckCircleIcon weight="fill" />
                                    Paid
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-orange-200 text-orange-600"
                                  >
                                    <ClockIcon weight="fill" />
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {feePlans.length > 1 && !plan.isPaid && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => removeFeePlan(index)}
                                      disabled={plan.isPaid}
                                    >
                                      <TrashIcon weight="bold" />
                                    </Button>
                                  )}

                                  {/* Manual payment button for existing fees */}
                                  {plan.id && !plan.isPaid && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleManualPayment(plan.id!, true)
                                      }
                                      disabled={markingPayment === plan.id}
                                      className="gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                    >
                                      {markingPayment === plan.id ? (
                                        <SpinnerGapIcon
                                          size={12}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <CheckCircleIcon
                                          size={12}
                                          weight="fill"
                                        />
                                      )}
                                      Mark Paid
                                    </Button>
                                  )}

                                  {/* Unmark payment button for offline paid fees */}
                                  {plan.id &&
                                    plan.isPaid &&
                                    member?.feePlans?.find(
                                      (fp) => fp.id === plan.id
                                    )?.isOfflinePaid && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleManualPayment(plan.id!, false)
                                        }
                                        disabled={markingPayment === plan.id}
                                        className="gap-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                                      >
                                        {markingPayment === plan.id ? (
                                          <SpinnerGapIcon
                                            size={12}
                                            className="animate-spin"
                                          />
                                        ) : (
                                          <WarningIcon
                                            size={12}
                                            weight="fill"
                                          />
                                        )}
                                        Unmark
                                      </Button>
                                    )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              )}

              {layout === "card" && (
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {feePlans.map(
                    (plan, index) =>
                      !plan.isDeleted && (
                        <Card
                          key={index}
                          className="border-l-4 border-l-primary gap-0"
                        >
                          <CardHeader>
                            <div className="flex justify-between">
                              <div className="flex gap-2">
                                <WalletIcon
                                  className="h-4 w-4 text-primary"
                                  weight="duotone"
                                />
                                <span className="font-medium text-sm">
                                  Fee Plan {index + 1}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                {feePlans.length > 1 && !plan.isPaid && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeFeePlan(index)}
                                    disabled={plan.isPaid}
                                  >
                                    <TrashIcon weight="bold" />
                                  </Button>
                                )}
                                {plan.isPaid && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <CheckCircleIcon weight="fill" />
                                    Paid
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`name-${index}`}
                                  className="text-xs font-medium"
                                >
                                  Fee Type
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`name-${index}`}
                                  value={plan.name}
                                  onChange={(e) =>
                                    handleFeePlanChange(
                                      index,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., Tuition Fee"
                                  disabled={plan.isPaid}
                                  className="h-9"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`description-${index}`}
                                  className="text-xs font-medium"
                                >
                                  Description
                                </Label>
                                <Input
                                  id={`description-${index}`}
                                  value={plan.description}
                                  onChange={(e) =>
                                    handleFeePlanChange(
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., May Month"
                                  disabled={plan.isPaid}
                                  className="h-9"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`amount-${index}`}
                                  className="text-xs font-medium"
                                >
                                  Amount (₹)
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`amount-${index}`}
                                  type="number"
                                  value={plan.amount}
                                  onChange={(e) =>
                                    handleFeePlanChange(
                                      index,
                                      "amount",
                                      e.target.value
                                    )
                                  }
                                  step={0.01}
                                  min={1}
                                  placeholder="0.00"
                                  disabled={plan.isPaid}
                                  className="h-9"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`dueDate-${index}`}
                                  className="text-xs font-medium"
                                >
                                  Due Date
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full h-9 justify-start text-left font-normal",
                                        !plan.dueDate && "text-muted-foreground"
                                      )}
                                      disabled={plan.isPaid}
                                    >
                                      <CalendarBlankIcon
                                        className="mr-2 h-4 w-4"
                                        weight="duotone"
                                      />
                                      {plan.dueDate ? (
                                        format(plan.dueDate, "PPP")
                                      ) : (
                                        <span>Select date</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={plan.dueDate}
                                      onSelect={(date) =>
                                        handleFeePlanChange(
                                          index,
                                          "dueDate",
                                          date
                                        )
                                      }
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </CardContent>

                          {plan.id && (
                            <div className="mt-4 pt-4 px-4 ml-auto border-t">
                              <div className="flex gap-2">
                                {!plan.isPaid && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleManualPayment(plan.id!, true)
                                    }
                                    disabled={markingPayment === plan.id}
                                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                  >
                                    {markingPayment === plan.id ? (
                                      <SpinnerGapIcon
                                        size={12}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <CheckCircleIcon
                                        size={12}
                                        weight="fill"
                                      />
                                    )}
                                    Mark as Paid
                                  </Button>
                                )}

                                {plan.isPaid &&
                                  member?.feePlans?.find(
                                    (fp) => fp.id === plan.id
                                  )?.isOfflinePaid && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleManualPayment(plan.id!, false)
                                      }
                                      disabled={markingPayment === plan.id}
                                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                                    >
                                      {markingPayment === plan.id ? (
                                        <SpinnerGapIcon
                                          size={12}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <WarningIcon size={12} weight="fill" />
                                      )}
                                      Mark as Unpaid
                                    </Button>
                                  )}
                              </div>
                            </div>
                          )}
                        </Card>
                      )
                  )}
                </CardContent>
              )}

              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  size={"lg"}
                  className="w-full md:w-52"
                >
                  {loading ? (
                    "Saving..."
                  ) : (
                    <>
                      <CheckCircleIcon weight="fill" />
                      Save Fee Plans
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default Page;
