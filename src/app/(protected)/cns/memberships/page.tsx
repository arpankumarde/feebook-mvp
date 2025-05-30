"use client";

import { useConsumerAuth } from "@/hooks/use-consumer-auth";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Provider {
  id: string;
  name: string;
  code: string;
  type: string;
  category: string;
}

interface Member {
  id: string;
  uniqueId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  category?: string;
  subcategory?: string;
}

interface FeePlan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  status: string;
  dueDate: string;
}

const LinkMembership = () => {
  const { consumer } = useConsumerAuth();
  const [step, setStep] = useState(1);
  const [providerCode, setProviderCode] = useState("");
  const [memberUniqueId, setMemberUniqueId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);

  const searchProvider = async () => {
    if (!providerCode.trim()) {
      setError("Please enter a provider code");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/v1/provider/by-code/${providerCode}`);
      
      if (response.data.success) {
        setProvider(response.data.data);
        setStep(2);
      } else {
        setError("Provider not found");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to find provider");
    } finally {
      setLoading(false);
    }
  };

  const searchMember = async () => {
    if (!memberUniqueId.trim()) {
      setError("Please enter your member ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get("/api/v1/provider/member/by-uniqueid", {
        params: {
          providerId: provider?.id,
          uniqueId: memberUniqueId,
        },
      });
      
      setMember(response.data.member);
      setFeePlans(response.data.feePlans || []);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || "Member not found");
    } finally {
      setLoading(false);
    }
  };

  const claimMembershipAction = async () => {
    if (!consumer?.id || !provider?.code || !memberUniqueId) {
      setError("Missing required information");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post("/api/v1/consumer/memberships", {
        consumerId: consumer.id,
        providerCode: provider.code,
        memberUniqueId: memberUniqueId,
      });
      
      if (response.data.success) {
        setSuccess("Membership claimed successfully!");
        setTimeout(() => {
          window.location.href = "/cns/dashboard";
        }, 2000);
      } else {
        setError(response.data.error || "Failed to claim membership");
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("Membership already claimed");
      } else {
        setError(err.response?.data?.error || "Failed to claim membership");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setProviderCode("");
    setMemberUniqueId("");
    setProvider(null);
    setMember(null);
    setFeePlans([]);
    setError(null);
    setSuccess(null);
  };

  return (
    <div>
      <h2>Link New Membership</h2>
      
      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>
          Error: {error}
        </div>
      )}
      
      {success && (
        <div style={{ color: "green", marginBottom: "1rem" }}>
          {success}
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Find Your Organization</CardTitle>
            <CardDescription>Enter the organization code provided by your institution</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ marginBottom: "1rem" }}>
              <Label htmlFor="providerCode">Organization Code</Label>
              <Input
                id="providerCode"
                value={providerCode}
                onChange={(e) => setProviderCode(e.target.value)}
                placeholder="Enter organization code"
              />
            </div>
            <Button onClick={searchProvider} disabled={loading}>
              {loading ? "Searching..." : "Search Organization"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && provider && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Enter Your Member ID</CardTitle>
            <CardDescription>
              Organization: {provider.name} | Category: {provider.category}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ marginBottom: "1rem" }}>
              <Label htmlFor="memberUniqueId">Your Member ID</Label>
              <Input
                id="memberUniqueId"
                value={memberUniqueId}
                onChange={(e) => setMemberUniqueId(e.target.value)}
                placeholder="Enter your member ID"
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={searchMember} disabled={loading}>
                {loading ? "Verifying..." : "Verify Member"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && member && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Confirm Membership</CardTitle>
            <CardDescription>Please verify your information is correct</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ marginBottom: "1rem" }}>
              <p><strong>Name:</strong> {member.firstName} {member.middleName} {member.lastName}</p>
              <p><strong>Member ID:</strong> {member.uniqueId}</p>
              <p><strong>Organization:</strong> {provider?.name}</p>
              {member.email && <p><strong>Email:</strong> {member.email}</p>}
              {member.phone && <p><strong>Phone:</strong> {member.phone}</p>}
              {member.category && <p><strong>Category:</strong> {member.category}</p>}
              {member.subcategory && <p><strong>Subcategory:</strong> {member.subcategory}</p>}
            </div>

            {feePlans.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h4>Pending Fee Plans ({feePlans.length})</h4>
                {feePlans.map((plan) => (
                  <div key={plan.id} style={{ border: "1px solid #eee", padding: "0.5rem", margin: "0.5rem 0" }}>
                    <p><strong>{plan.name}</strong> - ₹{plan.amount}</p>
                    <p>Due: {new Date(plan.dueDate).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={claimMembershipAction} disabled={loading}>
                {loading ? "Claiming..." : "Claim Membership"}
              </Button>
              <Button variant="destructive" onClick={resetForm}>
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LinkMembership;
