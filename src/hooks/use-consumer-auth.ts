"use client";

import { useState, useEffect } from "react";
import { AuthService } from "@/lib/auth-service";
import { Consumer } from "@prisma/client";
import api from "@/lib/api";
import { toast } from "sonner";

interface ConsumerWithMemberships extends Consumer {
  memberships?: any[];
}

interface ClaimMembershipData {
  memberId: string;
  providerCode: string;
  memberUniqueId: string;
}

export function useConsumerAuth() {
  const [consumer, setConsumer] = useState<ConsumerWithMemberships | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const consumerData = AuthService.getConsumerAuth();
      setConsumer(consumerData);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const refreshMemberships = async () => {
    try {
      if (!consumer?.id) {
        console.warn("No consumer ID available for refreshing memberships");
        return;
      }

      const response = await api.get(`/api/v1/consumer/memberships`, {
        params: {
          consumerId: consumer.id,
        },
      });

      if (response.data.memberships) {
        // Update consumer with fresh membership data
        setConsumer((prevConsumer) => {
          if (!prevConsumer) return null;
          return {
            ...prevConsumer,
            memberships: response.data.memberships || [],
          };
        });
      }
    } catch (error) {
      console.error("Error refreshing memberships:", error);
      toast.error("Failed to refresh memberships. Please try again later.");
    }
  };

  const claimMembership = async (membershipData: ClaimMembershipData) => {
    try {
      setLoading(true);

      // Add consumer ID to the membership data
      const requestData = {
        ...membershipData,
        consumerId: consumer?.id,
      };

      const response = await api.post(
        "/api/v1/consumer/claim-membership",
        requestData
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to claim membership");
      }

      // Refresh consumer data with updated memberships
      await refreshMemberships();

      return response.data;
    } catch (error) {
      console.error("Error claiming membership:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    consumer,
    isAuthenticated: !!consumer,
    loading,
    logout: () => {
      AuthService.logoutConsumer();
      setConsumer(null);
    },
    refresh: () => {
      const consumerData = AuthService.getConsumerAuth();
      setConsumer(consumerData);
    },
    refreshMemberships,
    claimMembership,
  };
}
