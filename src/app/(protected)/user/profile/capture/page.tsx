"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConsumerAuth } from "@/hooks/use-consumer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import api from "@/lib/api";
import { toast } from "sonner";
import { SLUGS } from "@/constants/slugs";
import {
  UserIcon,
  SpinnerGapIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  HeartIcon,
} from "@phosphor-icons/react/dist/ssr";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
}

const ProfileCapturePage = () => {
  const { consumer, refreshProfile } = useConsumerAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  // Initialize form with consumer data
  useEffect(() => {
    if (consumer) {
      setFormData({
        firstName: consumer.firstName || "",
        lastName: consumer.lastName || "",
        email: consumer.email || "",
      });
    }
  }, [consumer]);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Handle continue (save and redirect)
  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.put("/api/v1/consumer/profile", formData, {
        params: { consumerId: consumer?.id },
      });

      if (response.data.success) {
        toast.success("Profile updated successfully!");

        // Refresh the auth context with updated data
        await refreshProfile();

        // Redirect to add membership page
        router.push(`/${SLUGS.CONSUMER}/memberships/add`);
      } else {
        throw new Error(response.data.error || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle skip (redirect directly)
  const handleSkip = () => {
    setIsSkipping(true);
    toast.info("You can update your profile later from profile page");
    router.push(`/${SLUGS.CONSUMER}/memberships/add`);
  };

  return (
    <div className="md:min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-xl space-y-4 md:space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <HeartIcon size={32} className="text-primary" weight="duotone" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to FeeBook!
            </h1>
            <p className="text-muted-foreground text-lg">
              Let's complete your profile to get started
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center hidden">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <UserIcon size={24} className="text-primary" weight="duotone" />
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              Help us personalize your experience by providing a few details
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 md:space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`h-12 ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  We'll use this email for important notifications and receipts
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={`h-12 ${
                      errors.firstName ? "border-destructive" : ""
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={`h-12 ${
                      errors.lastName ? "border-destructive" : ""
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row-reverse gap-3 pt-4">
              <Button
                onClick={handleContinue}
                disabled={loading || isSkipping}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <SpinnerGapIcon size={20} className="animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon size={20} weight="fill" />
                    Continue
                  </>
                )}
              </Button>

              <Button
                onClick={handleSkip}
                disabled={loading || isSkipping}
                variant="ghost"
                className="flex-1 text-muted-foreground"
                size={"sm"}
              >
                {isSkipping ? (
                  <>
                    <SpinnerGapIcon size={20} className="animate-spin" />
                  </>
                ) : (
                  <>
                    <ArrowRightIcon size={20} className="max-sm:hidden" />
                    Skip for Now
                  </>
                )}
              </Button>
            </div>

            {/* Skip Notice */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                You can always update your profile later from the profile page
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileCapturePage;
