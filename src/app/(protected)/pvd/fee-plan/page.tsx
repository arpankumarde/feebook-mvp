"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Member, FeePlan } from "@prisma/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProviderAuth } from "@/hooks/use-provider-auth";

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
  const { provider, isAuthenticated } = useProviderAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Provider not found. Please log in again.");
    }
  }, [isAuthenticated]);

  const [searchId, setSearchId] = useState("");
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

  const fetchMember = async () => {
    if (!searchId || !provider?.id) return;

    setLoading(true);
    setError("");
    setMember(null);

    try {
      // Search by memberId only
      const response = await api.get(
        `/api/v1/provider/member?providerId=${provider.id}&memberId=${searchId}`
      );

      if (!response.data) {
        throw new Error("Student not found");
      }

      setMember(response.data);

      // If member has existing fee plans, populate the form
      if (response.data.feePlans && response.data.feePlans.length > 0) {
        const existingPlans = response.data.feePlans.map((plan: FeePlan) => ({
          id: plan.id,
          name: plan.name,
          description: plan.description || "",
          amount: plan.amount.toString(),
          dueDate: new Date(plan.dueDate),
          isPaid: plan.status === "PAID",
          isDeleted: false,
        }));
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

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Add Fee Plans</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="searchId" className="mb-2 block">
                Student Unique ID
              </Label>
              <Input
                id="searchId"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Student Unique ID"
              />
            </div>
            <Button onClick={fetchMember} disabled={loading || !searchId}>
              {loading ? "Loading..." : "Fetch Details"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          Fee plans saved successfully!
        </div>
      )}

      {member && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Student Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Name</Label>
                  <p>{`${member.firstName} ${
                    member.middleName ? member.middleName + " " : ""
                  }${member.lastName}`}</p>
                </div>
                <div>
                  <Label className="font-medium">Unique ID</Label>
                  <p>{member.uniqueId}</p>
                </div>
                <div>
                  <Label className="font-medium">Phone</Label>
                  <p>{member.phone || "N/A"}</p>
                </div>
                <div>
                  <Label className="font-medium">Email</Label>
                  <p>{member.email || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Fee Plans</h2>
                <Button variant="outline" size="sm" onClick={addFeePlan}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Fee Plan
                </Button>
              </div>

              {feePlans.map(
                (plan, index) =>
                  !plan.isDeleted && (
                    <div key={index} className="p-4 border rounded-md mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Fee Plan {index + 1}</h3>
                        {feePlans.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFeePlan(index)}
                            disabled={plan.isPaid}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor={`name-${index}`}
                            className="mb-2 block"
                          >
                            Fee Type*
                          </Label>
                          <Input
                            id={`name-${index}`}
                            value={plan.name}
                            onChange={(e) =>
                              handleFeePlanChange(index, "name", e.target.value)
                            }
                            placeholder="Tuition Fee"
                            disabled={plan.isPaid}
                            required
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor={`description-${index}`}
                            className="mb-2 block"
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
                            placeholder="May Month"
                            disabled={plan.isPaid}
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor={`amount-${index}`}
                            className="mb-2 block"
                          >
                            Amount (₹)*
                          </Label>
                          <Input
                            id={`amount-${index}`}
                            type="number"
                            value={plan.amount}
                            onChange={(e) => {
                              handleFeePlanChange(
                                index,
                                "amount",
                                e.target.value
                              );
                            }}
                            step={0.01}
                            min={1}
                            placeholder="Enter amount"
                            disabled={plan.isPaid}
                            required
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor={`dueDate-${index}`}
                            className="mb-2 block"
                          >
                            Due Date*
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !plan.dueDate && "text-muted-foreground"
                                )}
                                disabled={plan.isPaid}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {plan.dueDate ? (
                                  format(plan.dueDate, "PPP")
                                ) : (
                                  <span>Select date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={plan.dueDate}
                                onSelect={(date) =>
                                  handleFeePlanChange(index, "dueDate", date)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  )
              )}

              <div className="flex justify-end mt-6">
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Saving..." : "Save Fee Plans"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Page;
