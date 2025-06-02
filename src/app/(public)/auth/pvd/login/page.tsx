"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EyeIcon, EyeOffIcon, ShieldCheckIcon } from "lucide-react";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Provider } from "@prisma/client";
import { toast } from "sonner";
import { setProviderCookie } from "@/lib/auth-utils";
import { LoginResponse } from "@/types/auth";
import { SLUGS } from "@/constants/slugs";
import Link from "next/link";

const Page = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post<LoginResponse<Provider>>(
        "/api/v1/auth/provider/login",
        {
          email,
          password,
        }
      );

      const { success, user, error: apiError } = response.data;

      if (success && user) {
        setProviderCookie(user);

        toast.success("Login successful!");
        router.push(`/${SLUGS.PROVIDER}/dashboard`);
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
    <div className="min-h-screen flex flex-col-reverse md:flex-row items-center justify-center bg-gray-50">
      <div className="flex-1 min-h-screen bg-primary/10"></div>
      <div className="flex-1 min-h-screen w-full flex items-center justify-center">
        <div className="w-full sm:w-4/5 xl:w-3/5">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Organisation Login
            </h1>
            <p className="text-gray-600">Access your FeeBook dashboard</p>
          </div>

          {/* Login Form */}
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
                  placeholder="Enter registered email"
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
                    placeholder="Enter password"
                    className="h-12 pr-10 border-gray-300 focus:border-primary focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  href={`/auth/${SLUGS.PROVIDER}/forgot-password`}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Forgot password?
                </Link>
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

            {/* Create Account Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                New to FeeBook?{" "}
                <Link
                  href={`/auth/${SLUGS.PROVIDER}/register`}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Create Account
                </Link>
              </p>
            </div>

            {/* Security Notice */}
            <div className="mt-6 flex items-center justify-center text-xs text-gray-500">
              <ShieldCheckIcon className="h-4 w-4 mr-1" />
              <span>Secure login • 256-bit encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
