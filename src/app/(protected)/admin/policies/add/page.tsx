"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import ModeratorTopbar from "@/components/layout/moderator/ModeratorTopbar";
import { APIResponse } from "@/types/common";
import { Policy } from "@prisma/client";
import { useRouter } from "next/navigation";
import { SLUGS } from "@/constants/slugs";
import { toast } from "sonner";

const Page = () => {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const router = useRouter();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug from name
    if (name === "name") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData((prev) => ({
        ...prev,
        slug: slug,
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Basic validation
    if (
      !formData.name.trim() ||
      !formData.slug.trim() ||
      !formData.content.trim()
    ) {
      setMessage({ type: "error", text: "All fields are required." });
      setLoading(false);
      return;
    }

    try {
      await api.post<APIResponse<Policy>>("/api/v1/moderator/policy", {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        content: formData.content.trim(),
      });

      setMessage({ type: "success", text: "Policy created successfully!" });
      toast.success("Policy created successfully!");
      router.push(`/${SLUGS.MODERATOR}/policies`);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to create policy. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ModeratorTopbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Add Policy</h1>
          <span className="text-2xl text-muted-foreground hidden sm:inline">
            |
          </span>
          <p className="text-muted-foreground text-sm sm:text-base">
            Create a new policy
          </p>
        </div>
      </ModeratorTopbar>

      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Add New Policy</CardTitle>
            <CardDescription>
              Create a new policy by filling out the form below. The slug will
              be auto-generated from the name.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {message.text && (
              <Alert
                className={
                  message.type === "success"
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                }
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription
                  className={
                    message.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }
                >
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Policy Name *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter policy name"
                required
                className="w-full"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-medium">
                Slug *
              </Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="auto-generated-from-name"
                required
                className="w-full"
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                URL-friendly version of the policy name. Auto-generated but can
                be edited.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium">
                Content *
              </Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Enter policy content..."
                required
                className="w-full min-h-[200px] resize-y"
                disabled={loading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex gap-4">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Policy...
                </>
              ) : (
                "Create Policy"
              )}
            </Button>

            <Button
              onClick={() => {
                setFormData({ name: "", slug: "", content: "" });
                setMessage({ type: "", text: "" });
              }}
              variant="outline"
              disabled={loading}
            >
              Clear Form
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default Page;
