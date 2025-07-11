"use client";

import ModeratorTopbar from "@/components/layout/moderator/ModeratorTopbar";
import api from "@/lib/api";
import { APIResponse } from "@/types/common";
import { SpinnerGapIcon } from "@phosphor-icons/react/dist/ssr";
import { Policy } from "@prisma/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import Link from "next/link";
import { SLUGS } from "@/constants/slugs";

const Page = () => {
  const { policyId } = useParams<{ policyId: string }>();
  const router = useRouter();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    content: "",
  });

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await api.get<APIResponse<Policy>>(
          `/api/v1/moderator/policy/${policyId}`
        );
        const policyData = response.data.data;
        setPolicy(policyData || null);

        // Initialize form data
        if (policyData) {
          setFormData({
            name: policyData.name || "",
            slug: policyData.slug || "",
            content: policyData.content || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch policy:", error);
        setError("Failed to load policy details");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [policyId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await api.patch<APIResponse<Policy>>(
        `/api/v1/moderator/policy/${policyId}`,
        formData
      );

      if (response.data.success && response.data.data) {
        setPolicy(response.data.data);

        toast.success("Policy updated successfully!");
      } else {
        setError("Failed to update policy");
      }
    } catch (error: any) {
      console.error("Failed to update policy:", error);
      setError(error.response?.data?.message || "Failed to update policy");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (policy) {
      setFormData({
        name: policy.name || "",
        slug: policy.slug || "",
        content: policy.content || "",
      });
      setError(null);
    }
  };

  if (loading) {
    return (
      <>
        <ModeratorTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Edit Policy</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Loading policy details
            </p>
          </div>
        </ModeratorTopbar>

        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-3 text-muted-foreground">
              <SpinnerGapIcon size={24} className="animate-spin text-primary" />
              <span className="font-medium">Loading policy...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!policy) {
    return (
      <>
        <ModeratorTopbar>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Edit Policy</h1>
            <span className="text-2xl text-muted-foreground hidden sm:inline">
              |
            </span>
            <p className="text-muted-foreground text-sm sm:text-base">
              Policy not found
            </p>
          </div>
        </ModeratorTopbar>

        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Policy Not Found</CardTitle>
                <CardDescription>
                  The policy you're looking for could not be found.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.back()} className="w-full">
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ModeratorTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Edit Policy</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            {policy.name}
          </p>
        </div>
      </ModeratorTopbar>

      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Policy</CardTitle>
              <CardDescription>Update the policy details below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Policy Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Policy Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter policy name"
                  />
                </div>

                {/* Policy Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug">Policy Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter policy slug (e.g., privacy-policy)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in URLs. Should be lowercase with hyphens instead of
                    spaces.
                  </p>
                </div>

                {/* Policy Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Policy Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={12}
                    placeholder="Enter policy content (supports markdown)"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button type="submit" disabled={saving}>
                    {saving && (
                      <SpinnerGapIcon size={16} className="animate-spin mr-2" />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={saving}
                    asChild
                  >
                    <Link href={`/${SLUGS.MODERATOR}/policies`}>Back</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Page;
