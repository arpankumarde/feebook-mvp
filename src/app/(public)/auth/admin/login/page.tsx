"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Moderator } from "@prisma/client";
import { toast } from "sonner";
import { setModeratorCookie } from "@/lib/auth-utils";
import { LoginResponse } from "@/types/auth";
import { SLUGS } from "@/constants/slugs";
import { useAuth } from "@/hooks/use-auth";

const Page = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { isLoggedIn, isModerator } = useAuth();

  useEffect(() => {
    if (isLoggedIn && isModerator) {
      router.push(`/${SLUGS.MODERATOR}/dashboard`);
    }
  }, [isLoggedIn, isModerator, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post<LoginResponse<Moderator>>(
        "/api/v1/auth/moderator/login",
        {
          email,
          password,
        }
      );

      const { success, user, error: apiError } = response.data;

      if (success && user) {
        setModeratorCookie(user);
        toast.success("Login successful!");
        router.push(`/${SLUGS.MODERATOR}/dashboard`);
      } else {
        setError(apiError || "Login failed");
        toast.error(apiError || "Login failed");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "An error occurred during login";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col-reverse md:flex-row items-center justify-center bg-gray-50">
      <div className="p-4 flex-1 min-h-dvh bg-primary/10 hidden sm:block"></div>

      <div className="p-4 flex-1 min-h-dvh w-full flex items-center justify-center">
        <div className="w-full sm:w-4/5 xl:w-3/5">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Moderator Login
            </h1>
            <p className="text-gray-600">
              Access your FeeBook moderator dashboard
            </p>
          </div>

          {/* Form */}
          <div>
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-400/20">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 pr-10 border-gray-300 focus:border-primary focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-md"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 flex items-center justify-center text-xs text-gray-500">
              <ShieldCheckIcon className="h-4 w-4 mr-1" weight="bold" />
              <span>Secure login • Admin access only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
