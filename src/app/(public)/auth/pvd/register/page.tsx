"use client";

import { AccountType, Provider } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import genShortCode from "@/utils/genShortCode";
import { setProviderCookie } from "@/lib/auth-utils";
import { SLUGS } from "@/constants/slugs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { LoginResponse } from "@/types/auth";

interface RegisterProps {
  name: string;
  adminName: string;
  email: string;
  phone: string;
  password: string;
  accountType: AccountType;
  code: string;
}

const Page = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterProps>({
    name: "",
    adminName: "",
    email: "",
    phone: "",
    password: "",
    accountType: AccountType.INDIVIDUAL,
    code: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let propData = formData;

      // generate short code
      propData = {
        ...propData,
        code: genShortCode(propData.name),
      };

      const response = await api.post<LoginResponse<Provider>>(
        "/api/v1/auth/provider/register",
        propData
      );

      const { success, user, error: apiError } = response.data;

      if (success && user) {
        setProviderCookie(user);

        toast.success("Account created successfully!");
        router.push(`/${SLUGS.PROVIDER}/dashboard`);
      } else {
        setError(apiError || "Account creation failed");
        toast.error(apiError || "Account creation failed");
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
    <div className="min-h-dvh flex flex-col-reverse md:flex-row items-center justify-center bg-gray-50">
      <div className="p-4 flex-1 min-h-dvh bg-primary/10 hidden sm:block"></div>

      <div className="p-4 flex-1 min-h-dvh w-full flex items-center justify-center">
        <div className="w-full sm:w-4/5 xl:w-3/5">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Organization
            </h1>
            <p className="text-gray-600">Get Access your FeeBook dashboard</p>
          </div>

          {/* Login Form */}
          <div>
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-400/20">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
                <div className="space-y-2 w-full sm:w-1/2">
                  <Label
                    htmlFor="accountType"
                    className="text-sm font-medium text-gray-700"
                  >
                    Account Type
                  </Label>
                  <Select
                    name="accountType"
                    defaultValue={AccountType.INDIVIDUAL}
                    onValueChange={(value: AccountType) =>
                      setFormData({ ...formData, accountType: value })
                    }
                  >
                    <SelectTrigger
                      id="accountType"
                      className="!h-12 mb-0 w-full border-gray-300 focus:border-primary focus:ring-primary"
                    >
                      <SelectValue placeholder="Account Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AccountType.INDIVIDUAL}>
                        {AccountType.INDIVIDUAL}
                      </SelectItem>
                      <SelectItem value={AccountType.ORGANIZATION}>
                        {AccountType.ORGANIZATION}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full sm:w-1/2">
                  <Label
                    htmlFor="organizationName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Organization Name
                  </Label>
                  <Input
                    id="organizationName"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter organization name"
                    className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
              </div>

              {/* Admin Name Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="adminName"
                  className="text-sm font-medium text-gray-700"
                >
                  Admin Name
                </Label>
                <Input
                  id="adminName"
                  type="text"
                  value={formData.adminName}
                  onChange={(e) =>
                    setFormData({ ...formData, adminName: e.target.value })
                  }
                  placeholder="Enter admin name"
                  className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                  required
                />
              </div>

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
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter registered email"
                  className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                  required
                />
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700"
                >
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  pattern="[0-9]{10}"
                  minLength={10}
                  maxLength={10}
                  title="Please enter exactly 10 digits"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Phone (10 digits)"
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
                    minLength={8}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Enter a strong password"
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

              {/* Register Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-md"
                disabled={loading}
              >
                {loading ? "Creating in..." : "Create Organization"}
              </Button>
            </form>

            {/* Create Account Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href={`/auth/${SLUGS.PROVIDER}/login`}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Log in
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
