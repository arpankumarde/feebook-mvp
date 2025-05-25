"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Consumer } from "@/generated/prisma";
import { toast } from "sonner";
import Link from "next/link";
import { LoginResponse } from "@/types/auth";
import { setConsumerCookie } from "@/lib/auth-utils";
import { SLUGS } from "@/constants/slugs";

const Page = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (formData.phone.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post<LoginResponse<Consumer>>(
        "/api/v1/auth/consumer/register",
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }
      );

      const { success, user, error: apiError, message } = response.data;

      if (success && user) {
        setConsumerCookie(user);

        toast.success(message || "Registration successful!");
        router.push(`/${SLUGS.CONSUMER}/dashboard`);
      } else {
        setError(apiError || "Registration failed");
        toast.error(apiError || "Registration failed");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "An error occurred during registration";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            Consumer Registration
          </CardTitle>
          <CardDescription>
            Create your account to access payment services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name*</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name*</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john.doe@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number*</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/[^0-9]/g, "")
                    .slice(0, 10);
                  setFormData((prev) => ({ ...prev, phone: value }));
                }}
                placeholder="9876543210"
                pattern="[0-9]{10}"
                minLength={10}
                maxLength={10}
                title="Please enter exactly 10 digits"
                required
              />
              <p className="text-xs text-gray-500">10-digit mobile number</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password*</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a secure password"
                minLength={6}
                required
              />
              <p className="text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link
              href={`/auth/${SLUGS.CONSUMER}/login`}
              className="text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Page;
