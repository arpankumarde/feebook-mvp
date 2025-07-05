"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import api from "@/lib/api";
import type { AxiosError } from "axios";
import { Gender } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProviderAuth } from "@/hooks/use-provider-auth";
import ProviderTopbar from "@/components/layout/provider/ProviderTopbar";
import { toast } from "sonner";
import { CheckCircleIcon, LightningIcon } from "@phosphor-icons/react/dist/ssr";

interface MemberFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  uniqueId: string;
  phone: string;
  email: string;
  category: string;
  subcategory: string;
  guardianName: string;
  relationship: string;
  providerId: string;
}

interface ApiErrorResponse {
  message: string;
}

const Page = () => {
  const { provider, loading: isAuthLoading } = useProviderAuth();
  const [formData, setFormData] = useState<MemberFormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    uniqueId: "",
    phone: "",
    email: "",
    category: "",
    subcategory: "",
    guardianName: "",
    relationship: "",
    providerId: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  /**
   * Validates phone number format (10 digits)
   */
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  /**
   * Validates email format
   */
  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validates form data before submission
   */
  const validateFormData = (): string | null => {
    if (!formData.firstName.trim()) return "First name is required";
    if (!formData.lastName.trim()) return "Last name is required";
    if (!formData.uniqueId.trim()) return "Unique ID is required";
    if (!formData.phone.trim()) return "Phone number is required";
    if (!validatePhoneNumber(formData.phone))
      return "Please enter a valid 10-digit phone number";
    if (formData.email && !validateEmail(formData.email))
      return "Please enter a valid email address";
    return null;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Handle phone number input - only allow digits
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      uniqueId: "",
      phone: "",
      email: "",
      category: "",
      subcategory: "",
      guardianName: "",
      relationship: "",
      providerId: provider?.id || "",
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validate form data
    const validationError = validateFormData();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    if (!formData.providerId) {
      setError("Provider ID is required");
      setLoading(false);
      return;
    }

    try {
      await api.post("/api/v1/provider/member", { member: formData });
      setSuccess(true);
      toast.success("Member added successfully!");
      resetForm();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.message || "Failed to add member";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!provider?.id) {
      setError("Provider information not found");
      return;
    }

    setFormData((prev) => ({ ...prev, providerId: provider?.id }));
  }, [provider?.id, isAuthLoading]);

  if (isAuthLoading) {
    return (
      <>
        <ProviderTopbar>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Add Member</h1>
          </div>
        </ProviderTopbar>
        <div className="p-4 flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <ProviderTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Add Member</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Add new members to your institution
          </p>
        </div>
      </ProviderTopbar>

      <div className="p-4 max-w-4xl mx-auto">
        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Member added successfully! You can add another member below.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
            <CardDescription>
              Fill in the details below to add a new member to your institution.
              Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleChange}
                      placeholder="Enter middle name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter last name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      name="gender"
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleSelectChange("gender", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Gender.MALE}>Male</SelectItem>
                        <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                        <SelectItem value={Gender.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 -mt-1.5">
                    <span className="inline-flex justify-between items-center w-full">
                      <Label htmlFor="uniqueId">Unique ID *</Label>
                      <Button
                        variant={"ghost"}
                        size={"icon"}
                        type="button"
                        className="h-auto w-auto aspect-square"
                        onClick={() => {
                          const uniqueId = `ID-${Date.now()}`;
                          setFormData((prev) => ({
                            ...prev,
                            uniqueId,
                          }));
                        }}
                      >
                        <LightningIcon />
                      </Button>
                    </span>
                    <Input
                      id="uniqueId"
                      name="uniqueId"
                      value={formData.uniqueId}
                      onChange={handleChange}
                      placeholder="Enter unique identifier"
                      required
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter 10-digit phone number"
                      type="tel"
                      maxLength={10}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter 10-digit phone number without country code
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Category Information Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Category Information (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="Enter category (e.g., Student, Staff)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Input
                      id="subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      placeholder="Enter subcategory (e.g., Grade 10, Teacher)"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Guardian Information Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Guardian Information (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian Name</Label>
                    <Input
                      id="guardianName"
                      name="guardianName"
                      value={formData.guardianName}
                      onChange={handleChange}
                      placeholder="Enter guardian's full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relationship</Label>
                    <Input
                      id="relationship"
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleChange}
                      placeholder="Enter relationship (e.g., Father, Mother)"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  {loading ? "Adding Member..." : "Add Member"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  Clear Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Page;
