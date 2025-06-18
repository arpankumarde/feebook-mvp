"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ShieldCheckIcon } from "lucide-react";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Consumer } from "@prisma/client";
import { toast } from "sonner";
import Link from "next/link";
import { LoginResponse } from "@/types/auth";
import { setConsumerCookie } from "@/lib/auth-utils";
import { SLUGS } from "@/constants/slugs";

interface RegistrationData {
  firstName: string;
  lastName: string;
  phone: string;
}

const Page = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  const validatePhoneNumber = (phoneNumber: string) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleRegisterAndSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.firstName.trim()) {
      setError("First name is required");
      setLoading(false);
      return;
    }

    if (formData.firstName.trim().length < 2) {
      setError("First name must be at least 2 characters long");
      setLoading(false);
      return;
    }

    if (!validatePhoneNumber(formData.phone)) {
      setError("Please enter a valid 10-digit phone number");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/v1/auth/consumer/register", {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || null,
        phone: formData.phone,
      });

      if (response.data.success) {
        setStep("otp");
        toast.success(
          "OTP sent successfully! Please verify your phone number."
        );
      } else {
        setError(response.data.error || "Failed to send OTP");
        toast.error(response.data.error || "Failed to send OTP");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Registration failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post<LoginResponse<Consumer>>(
        "/api/v1/auth/consumer/verify-registration",
        {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim() || null,
          phone: formData.phone,
          otp,
        }
      );

      const { success, user, error: apiError } = response.data;

      if (success && user) {
        setConsumerCookie(user);
        toast.success("Registration successful! Welcome to FeeBook!");
        router.push(`/${SLUGS.CONSUMER}/dashboard`);
      } else {
        setError(apiError || "OTP verification failed");
        toast.error(apiError || "OTP verification failed");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "OTP verification failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post(
        "/api/v1/auth/consumer/resend-registration-otp",
        {
          phone: formData.phone,
        }
      );

      if (response.data.success) {
        toast.success("OTP sent successfully!");
        setOtp("");
      } else {
        setError(response.data.error || "Failed to resend OTP");
        toast.error(response.data.error || "Failed to resend OTP");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to resend OTP";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: value }));
  };

  return (
    <div className="min-h-dvh flex flex-col-reverse md:flex-row items-center justify-center bg-gray-50">
      <div className="p-4 flex-1 min-h-dvh bg-primary/10 hidden sm:block"></div>
      <div className="p-4 flex-1 min-h-dvh w-full flex items-center justify-center">
        <div className="w-full sm:w-4/5 xl:w-3/5">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Consumer Registration
            </h1>
            <p className="text-gray-600">
              {step === "credentials"
                ? "Create your FeeBook account"
                : "Enter the OTP sent to your phone"}
            </p>
          </div>

          {/* Form */}
          <div>
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-400/20">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === "credentials" ? (
              <form onSubmit={handleRegisterAndSendOtp} className="space-y-5">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium text-gray-700"
                    >
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      placeholder="Enter your first name"
                      className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      placeholder="Enter your last name (optional)"
                      className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700"
                  >
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter 10-digit phone number"
                    className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                    maxLength={10}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Enter 10-digit phone number. OTP will be sent for
                    verification.
                  </p>
                </div>

                {/* Register Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-md"
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Continue with OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {/* OTP Input */}
                <div className="space-y-2">
                  <Label
                    htmlFor="otp"
                    className="text-sm font-medium text-gray-700"
                  >
                    <span className="text-center w-full">
                      Enter 6-digit OTP
                    </span>
                  </Label>
                  <div className="flex justify-center h-12">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      className="justify-center my-4"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-12 w-12" />
                        <InputOTPSlot index={1} className="h-12 w-12" />
                        <InputOTPSlot index={2} className="h-12 w-12" />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="h-12 w-12" />
                        <InputOTPSlot index={4} className="h-12 w-12" />
                        <InputOTPSlot index={5} className="h-12 w-12" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    OTP sent to {formData.phone}
                  </p>
                </div>

                {/* Verify OTP Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-md"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "Verifying..." : "Complete Registration"}
                </Button>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                </div>

                {/* Back to credentials */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("credentials");
                      setOtp("");
                      setError("");
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Back to registration
                  </button>
                </div>
              </form>
            )}

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href={`/auth/${SLUGS.CONSUMER}/login`}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Sign In
                </Link>
              </p>
            </div>

            {/* Security Notice */}
            <div className="mt-6 flex items-center justify-center text-xs text-gray-500">
              <ShieldCheckIcon className="h-4 w-4 mr-1" />
              <span>Secure registration • No password required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
