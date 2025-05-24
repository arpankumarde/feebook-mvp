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
} from "@/components/ui/card";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { setCookie } from "cookies-next/client";
import { Provider } from "@/generated/prisma";
import { toast } from "sonner";
import { PROVIDER_COOKIE } from "@/constants/cookies";

interface LoginResponse {
  success: boolean;
  provider?: Provider;
  error?: string;
}

const Page = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post<LoginResponse>(
        "/api/v1/auth/provider/login",
        {
          email,
          password,
        }
      );

      const { success, provider, error: apiError } = response.data;

      if (success && provider) {
        setCookie(PROVIDER_COOKIE, provider, {
          maxAge: 60 * 60 * 24 * 7,
        });

        toast.success("Login successful!");
        router.push("/organization/dashboard");
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            Organization Login
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your organization account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
