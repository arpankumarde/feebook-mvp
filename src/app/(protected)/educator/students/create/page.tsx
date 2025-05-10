"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getCookie } from "cookies-next/client";
import { ExtendedInstituteUserType } from "@/app/(public)/auth/handlers/auth";
import {
  createEnrollment,
  EnrollmentFormData,
} from "./handlers/createEnrollment";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Page = () => {
  const user: ExtendedInstituteUserType = JSON.parse(
    getCookie("__fb_user") || "{}"
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [minEndDate, setMinEndDate] = useState<string>("");

  // Set default dates when component mounts
  useEffect(() => {
    // Set default start date to first day of current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formattedStartDate = firstDayOfMonth.toISOString().split("T")[0];
    setStartDate(formattedStartDate);

    // Set min end date to be the same as start date
    setMinEndDate(formattedStartDate);

    // Set default end date to first day of next month
    const firstDayOfNextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1
    );
    const formattedEndDate = firstDayOfNextMonth.toISOString().split("T")[0];
    setEndDate(formattedEndDate);
  }, []);

  // Helper function to ensure date is always the first day of the month
  const getFirstDayOfMonth = (dateString: string): string => {
    const date = new Date(dateString);
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  };

  // Calculate total amount whenever monthly amount or dates change
  useEffect(() => {
    if (monthlyAmount && startDate && endDate) {
      // Ensure we're working with first day of month dates
      const start = new Date(getFirstDayOfMonth(startDate));
      const end = new Date(getFirstDayOfMonth(endDate));

      if (start > end) {
        // Invalid date range
        setTotalAmount(0);
        return;
      }

      // Calculate number of months between start and end dates
      const monthDiff =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      // Add 1 to include both start and end months
      const numberOfMonths = monthDiff + 1;

      // Calculate total amount
      const calculatedTotal = monthlyAmount * numberOfMonths;
      setTotalAmount(parseFloat(calculatedTotal.toFixed(2)));
    } else {
      setTotalAmount(0);
    }
  }, [monthlyAmount, startDate, endDate]);

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);

      // Parse form data
      const phoneNumber = formData.get("studentPhone") as string;

      // Validate phone number
      if (
        !phoneNumber ||
        phoneNumber.length !== 10 ||
        !/^\d{10}$/.test(phoneNumber)
      ) {
        toast.error("Please enter a valid 10-digit phone number");
        return;
      }

      // Validate date range
      if (!startDate || !endDate) {
        toast.error("Please select both start and end dates");
        return;
      }

      // Ensure dates are first day of month
      const start = new Date(getFirstDayOfMonth(startDate));
      const end = new Date(getFirstDayOfMonth(endDate));

      if (start > end) {
        toast.error("End date must be after start date");
        return;
      }

      // Verify both dates are first day of month
      if (start.getDate() !== 1 || end.getDate() !== 1) {
        toast.error("Both dates must be the first day of a month");
        return;
      }

      // Validate monthly amount
      if (!monthlyAmount || monthlyAmount <= 0) {
        toast.error("Please enter a valid monthly amount");
        return;
      }

      // Validate total amount
      if (!totalAmount || totalAmount <= 0) {
        toast.error("Total amount must be greater than zero");
        return;
      }

      const data: EnrollmentFormData = {
        studentName: formData.get("studentName") as string,
        studentEmail: (formData.get("studentEmail") as string) || null,
        studentPhone: phoneNumber,
        institutionId: user?.institution?.id as string,
        feeTitle: formData.get("feeTitle") as string,
        totalAmount: totalAmount,
        monthlyAmount: monthlyAmount,
        startDate: new Date(getFirstDayOfMonth(startDate)),
        endDate: new Date(getFirstDayOfMonth(endDate)),
      };

      const result = await createEnrollment(data);

      if (result.success) {
        toast.success("Student enrollment created successfully!");
        // Redirect to students list after successful creation
        window.location.href = "/educator/students";
      } else {
        toast.error(
          "Failed to create enrollment: " + JSON.stringify(result.error)
        );
      }
    } catch (error) {
      console.error("Error creating enrollment:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Student Enrollment</h1>
        <Button asChild variant="outline">
          <Link href="/educator/students">Back to Students</Link>
        </Button>
      </div>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Student Enrollment Form</CardTitle>
          <CardDescription>
            Enter student details and fee information to create a new enrollment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Student Information</h3>

              <div className="space-y-2">
                <Label htmlFor="studentName">Student Name *</Label>
                <Input
                  id="studentName"
                  name="studentName"
                  placeholder="Enter student's full name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Email (Optional)</Label>
                  <Input
                    id="studentEmail"
                    name="studentEmail"
                    type="email"
                    placeholder="student@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentPhone">Phone Number *</Label>
                  <div className="flex">
                    <div className="flex items-center justify-center rounded-l-md border border-r-0 bg-gray-100 px-3 text-sm text-gray-500">
                      +91
                    </div>
                    <Input
                      id="studentPhone"
                      name="studentPhone"
                      className="rounded-l-none"
                      placeholder="10-digit number"
                      pattern="[0-9]{10}"
                      inputMode="numeric"
                      minLength={10}
                      maxLength={10}
                      onChange={(e) => {
                        e.target.value = e.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(0, 10);
                      }}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Must be exactly 10 digits
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Fee Details</h3>

              <div className="space-y-2">
                <Label htmlFor="feeTitle">Fee Title *</Label>
                <Input
                  id="feeTitle"
                  name="feeTitle"
                  placeholder="E.g., Tuition Fee 2024-25"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount *</Label>
                  <Input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Total fee amount"
                    value={totalAmount || ""}
                    readOnly
                    className="bg-gray-50"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Automatically calculated based on monthly amount and date
                    range
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyAmount">Monthly Amount *</Label>
                  <Input
                    id="monthlyAmount"
                    name="monthlyAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Monthly installment amount"
                    value={monthlyAmount || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setMonthlyAmount(isNaN(value) ? 0 : value);
                    }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date (1st of month) *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="month"
                    value={startDate.substring(0, 7)}
                    onChange={(e) => {
                      // Convert month input to first day of selected month
                      const selectedMonth = e.target.value;
                      const firstDayDate = selectedMonth + "-01";
                      const newStartDate = getFirstDayOfMonth(firstDayDate);
                      setStartDate(newStartDate);

                      // Update minimum end date when start date changes
                      setMinEndDate(newStartDate);

                      // If end date is before new start date, update end date
                      if (
                        endDate &&
                        new Date(endDate) < new Date(newStartDate)
                      ) {
                        // Set end date to first day of next month
                        const startDateObj = new Date(newStartDate);
                        const firstDayOfNextMonth = new Date(
                          startDateObj.getFullYear(),
                          startDateObj.getMonth() + 1,
                          1
                        );
                        setEndDate(
                          firstDayOfNextMonth.toISOString().split("T")[0]
                        );
                      }
                    }}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Always set to 1st day of selected month
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (1st of month) *</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="month"
                    value={endDate.substring(0, 7)}
                    min={minEndDate.substring(0, 7)}
                    onChange={(e) => {
                      // Convert month input to first day of selected month
                      const selectedMonth = e.target.value;
                      const firstDayDate = selectedMonth + "-01";
                      setEndDate(getFirstDayOfMonth(firstDayDate));
                    }}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Always set to 1st day of selected month
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Enrollment"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          Fields marked with * are required
        </CardFooter>
      </Card>
    </div>
  );
};

export default Page;
