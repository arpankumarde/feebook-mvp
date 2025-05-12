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
import {
  format,
  addMonths,
  differenceInMonths,
  parse,
  startOfMonth,
} from "date-fns";

const Page = () => {
  const user: ExtendedInstituteUserType = JSON.parse(
    getCookie("__fb_user") || "{}"
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Set default dates when component mounts
  useEffect(() => {
    // Set default start date to current month
    const today = new Date();
    const currentMonth = format(today, "yyyy-MM");
    setStartDate(currentMonth);

    // Set default end date to next month
    const nextMonth = format(addMonths(today, 1), "yyyy-MM");
    setEndDate(nextMonth);
  }, []);

  // Calculate total amount whenever monthly amount or dates change
  useEffect(() => {
    if (monthlyAmount && startDate && endDate) {
      try {
        // Parse the month strings to create date objects using date-fns
        // Create dates in local timezone first
        const start = parse(startDate, "yyyy-MM", new Date());
        const end = parse(endDate, "yyyy-MM", new Date());

        // Ensure we're working with the first day of each month
        const startMonth = startOfMonth(start);
        const endMonth = startOfMonth(end);

        if (startMonth > endMonth) {
          // Invalid date range
          setTotalAmount(0);
          return;
        }

        // Calculate number of months between start and end dates using date-fns
        // Add 1 to include both start and end months
        const numberOfMonths = differenceInMonths(endMonth, startMonth) + 1;

        // Calculate total amount
        const calculatedTotal = monthlyAmount * numberOfMonths;
        setTotalAmount(parseFloat(calculatedTotal.toFixed(2)));
      } catch (error) {
        console.error("Error calculating total amount:", error);
        setTotalAmount(0);
      }
    } else {
      setTotalAmount(0);
    }
  }, [monthlyAmount, startDate, endDate]);

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);

      const formDataObj = Object.fromEntries(formData.entries());
      console.log("Form data:", formDataObj);

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

      // Parse the month strings to create date objects using date-fns
      const start = parse(startDate, "yyyy-MM", new Date());
      const end = parse(endDate, "yyyy-MM", new Date());

      // Ensure we're working with the first day of each month
      const startMonth = startOfMonth(start);
      const endMonth = startOfMonth(end);

      if (startMonth > endMonth) {
        toast.error("End date must be after start date");
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

      // Convert dates to UTC+5:30 (Indian Standard Time)
      // This ensures all dates are stored consistently in the database with IST timezone
      // Create new Date objects with the IST offset (+5:30 hours = 330 minutes)
      const istOffsetMinutes = 330; // +5:30 hours in minutes

      // Create Date objects for the first day of the selected month in UTC
      const startMonthUTC = new Date(startMonth);
      const endMonthUTC = new Date(endMonth);

      // Adjust for IST by adding the offset
      startMonthUTC.setMinutes(startMonthUTC.getMinutes() + istOffsetMinutes);
      endMonthUTC.setMinutes(endMonthUTC.getMinutes() + istOffsetMinutes);

      const data: EnrollmentFormData = {
        studentName: formData.get("studentName") as string,
        studentEmail: (formData.get("studentEmail") as string) || null,
        studentPhone: phoneNumber,
        institutionId: user?.institution?.id as string,
        feeTitle: formData.get("feeTitle") as string,
        totalAmount: totalAmount,
        monthlyAmount: monthlyAmount,
        // Store dates in UTC+5:30 timezone (IST)
        startDate: startMonthUTC,
        endDate: endMonthUTC,
      };

      console.log("Dates in IST:", {
        startDate: startMonthUTC.toISOString(),
        endDate: endMonthUTC.toISOString(),
      });

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
          <form
            action={(e) => {
              console.log(e);
              handleSubmit(e);
            }}
            className="space-y-6"
          >
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
                    value={startDate}
                    onChange={(e) => {
                      const selectedMonth = e.target.value;
                      setStartDate(selectedMonth);

                      // If end date is before new start date, update end date
                      if (endDate) {
                        try {
                          const selectedStartDate = parse(
                            selectedMonth,
                            "yyyy-MM",
                            new Date()
                          );
                          const currentEndDate = parse(
                            endDate,
                            "yyyy-MM",
                            new Date()
                          );

                          if (currentEndDate < selectedStartDate) {
                            // Set end date to next month after start date using date-fns
                            const nextMonth = format(
                              addMonths(selectedStartDate, 1),
                              "yyyy-MM"
                            );
                            setEndDate(nextMonth);
                          }
                        } catch (error) {
                          console.error("Error updating end date:", error);
                        }
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
                    value={endDate}
                    min={startDate} // Minimum end date is the start date
                    onChange={(e) => {
                      const selectedMonth = e.target.value;
                      setEndDate(selectedMonth);
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
