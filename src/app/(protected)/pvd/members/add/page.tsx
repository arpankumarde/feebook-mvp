"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import api from "@/lib/api";
import type { AxiosError } from "axios";
import { Gender } from "@/generated/prisma";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProviderAuth } from "@/hooks/use-provider-auth";

interface MemberFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  uniqueId: string;
  phone: string;
  email: string;
  category: string;
  subcategory: string;
  guardianName: string;
  relationship: string;
  providerId: string;
}

interface ApiErrorResponse {
  message: string;
}

const Page = () => {
  const { provider } = useProviderAuth();
  const [formData, setFormData] = useState<MemberFormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    uniqueId: "",
    phone: "",
    email: "",
    category: "",
    subcategory: "",
    guardianName: "",
    relationship: "",
    providerId: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.providerId) {
      setError("Provider ID is required");
      setLoading(false);
      return;
    }

    try {
      await api.post("/api/v1/provider/member", { member: formData });
      setSuccess(true);
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        uniqueId: "",
        phone: "",
        email: "",
        category: "",
        subcategory: "",
        guardianName: "",
        relationship: "",
        providerId: "",
      });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!provider?.id) {
      setError("Provider information not found");
      return;
    }

    setFormData((prev) => ({ ...prev, providerId: provider?.id }));
  }, [provider?.id]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Add Member</h1>

      {error && <p>{error}</p>}
      {success && <p>Member added successfully!</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="firstName">First Name*</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="middleName">Middle Name</Label>
          <Input
            id="middleName"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="lastName">Last Name*</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select
            name="gender"
            value={formData.gender}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, gender: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Gender.MALE}>{Gender.MALE}</SelectItem>
              <SelectItem value={Gender.FEMALE}>{Gender.FEMALE}</SelectItem>
              <SelectItem value={Gender.OTHER}>{Gender.OTHER}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="UniqueId">Unique ID*</Label>
          <Input
            id="uniqueId"
            name="uniqueId"
            value={formData.uniqueId}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone*</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="subcategory">Subcategory</Label>
          <Input
            id="subcategory"
            name="subcategory"
            value={formData.subcategory}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="guardianName">Guardian Name</Label>
          <Input
            id="guardianName"
            name="guardianName"
            value={formData.guardianName}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="relationship">Relationship</Label>
          <Input
            id="relationship"
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Member"}
        </Button>
      </form>
    </div>
  );
};

export default Page;
