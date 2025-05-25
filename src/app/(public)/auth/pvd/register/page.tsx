"use client";

import { AccountType, Provider } from "@/generated/prisma";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import genShortCode from "@/utils/genShortCode";
import { setProviderCookie } from "@/lib/auth-utils";
import { SLUGS } from "@/constants/slugs";

const Page = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  return (
    <div>
      <div>
        <h1>Create Organization</h1>
        <p>Fill out the form below to create an organization</p>
      </div>
      <form
        action={async (formData) => {
          try {
            setIsSubmitting(true);
            setError("");

            const data = {
              name: formData.get("name") as string,
              adminName: formData.get("adminName") as string,
              email: formData.get("email") as string,
              phone: formData.get("phone"),
              password: formData.get("password") as string,
              accountType: formData.get("accountType") as AccountType,
              code: genShortCode(formData.get("name") as string),
            };

            const { provider }: { provider: Provider } = (
              await api.post("/api/v1/provider", data)
            ).data;

            if (!provider) {
              throw new Error("Failed to create organization");
            }

            setProviderCookie(provider);

            router.push(`/${SLUGS.PROVIDER}/dashboard`);
          } catch (error) {
            console.error(error);
            setError(
              error instanceof Error
                ? error.message
                : "An unknown error occurred"
            );
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <div>
          <Select name="accountType" defaultValue={AccountType.INDIVIDUAL}>
            <SelectTrigger>
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
        <div>
          <Input name="name" placeholder="Organization Name" required />
        </div>
        <div>
          <Input name="adminName" placeholder="Admin Name" required />
        </div>
        <div>
          <Input name="email" placeholder="Email" type="email" required />
        </div>
        <div>
          <Input
            name="phone"
            placeholder="Phone (10 digits)"
            type="tel"
            pattern="[0-9]{10}"
            minLength={10}
            maxLength={10}
            title="Please enter exactly 10 digits"
            required
          />
        </div>
        <div>
          <Input
            name="password"
            placeholder="Password"
            type="password"
            required
          />
        </div>
        {error && <div>{error}</div>}
        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Proceed to Verification"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Page;
