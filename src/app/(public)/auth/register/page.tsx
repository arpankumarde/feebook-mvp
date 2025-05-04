"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { requestInstitute, RequestInstituteData } from "../handlers/auth";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/brand/logo.png"
              alt="Feebook Logo"
              width={120}
              height={40}
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            Request Institute Account
          </CardTitle>
          <CardDescription>
            Fill out the form below to request an institute account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              try {
                const data: RequestInstituteData = {
                  name: formData.get("name") as string,
                  email: formData.get("email") as string,
                  phone: Number(formData.get("phone")),
                  password: formData.get("password") as string,
                  instituteName: formData.get("instituteName") as string,
                };

                const res = await requestInstitute(data);
                if (res.success) {
                  toast.success(
                    "Your request for an institute account has been submitted successfully. We'll review it and get back to you soon."
                  );
                } else {
                  toast.error("Request failed: " + res.error);
                }
              } catch (error) {
                console.log(error);
                toast.error(
                  "There was a problem submitting your request. Please try again."
                );
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instituteName">Institute Name</Label>
              <Input
                id="instituteName"
                name="instituteName"
                placeholder="Name of your institution"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                pattern="[0-9]{10}"
                inputMode="numeric"
                minLength={10}
                maxLength={10}
                placeholder="Your 10-digit contact number"
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                }}
                required
              />
              <p className="text-xs text-gray-500">Must be exactly 10 digits</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a secure password"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Submit Request
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
