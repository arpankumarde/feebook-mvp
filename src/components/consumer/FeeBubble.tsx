"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  ClockIcon,
  WarningIcon,
  CreditCardIcon,
  SpinnerGapIcon,
  FilePdfIcon,
} from "@phosphor-icons/react/dist/ssr";
import { FeePlan } from "@prisma/client";
import Link from "next/link";

interface FeeBubbleProps {
  feePlan: FeePlan;
  payingFeePlanId?: string | null;
  onPayment?: (feePlanId: string) => void;
}

export const FeeBubble: React.FC<FeeBubbleProps> = ({
  feePlan,
  payingFeePlanId,
  onPayment,
}) => {
  const dueDate = new Date(feePlan.dueDate);
  const isOverdue =
    dueDate < new Date() && feePlan.status !== "PAID" && !feePlan.isOfflinePaid;
  const canPay = feePlan.status !== "PAID" && !feePlan.isOfflinePaid;
  const isPaid = feePlan.status === "PAID" || feePlan.isOfflinePaid;

  const getStatusBadge = () => {
    if (feePlan.isOfflinePaid) {
      return (
        <Badge
          variant="secondary"
          className="gap-1 text-xs bg-white/80 text-gray-700 border-0 absolute top-3 right-3"
        >
          <CheckCircleIcon size={10} weight="fill" />
          PAID
        </Badge>
      );
    }

    switch (feePlan.status) {
      case "PAID":
        return (
          <Badge
            variant="default"
            className="gap-1 bg-white/80 text-green-700 text-xs border-0 font-medium absolute top-3 right-3"
          >
            <CheckCircleIcon size={10} weight="fill" />
            PAID
          </Badge>
        );
      case "DUE":
        if (dueDate && dueDate < new Date()) {
          return (
            <Badge
              variant="destructive"
              className="bg-white text-red-900 gap-1 text-xs absolute top-3 right-3"
            >
              <WarningIcon size={10} weight="fill" />
              Overdue
            </Badge>
          );
        }
        return (
          <Badge className="gap-1 bg-white text-blue-600 text-xs absolute top-3 right-3">
            <ClockIcon size={10} weight="fill" />
            Due
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge
            variant="destructive"
            className="gap-1 text-xs absolute top-3 right-3"
          >
            <WarningIcon size={10} weight="fill" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge className="gap-1 text-xs absolute top-3 right-3">
            {feePlan.status}
          </Badge>
        );
    }
  };

  const getBubbleStyle = () => {
    if (isPaid) {
      return "bg-gradient-to-br from-green-200 to-green-100 border-green-300";
    }
    if (isOverdue) {
      return "bg-gradient-to-br from-red-300 to-red-200 border-red-300";
    }
    return "bg-gradient-to-br from-blue-200 to-blue-100 border-blue-300 text-blue-800";
  };

  const getTextColor = () => {
    return "text-black";
  };

  return (
    <div
      className={`
        relative p-4 rounded-2xl border shadow-lg max-w-sm
        ${getBubbleStyle()}
        before:content-[''] before:absolute before:top-3 before:right-[-10px]
        before:w-0 before:h-0
        before:border-t-[10px] before:border-b-[10px] before:border-l-[10px]
        before:border-t-transparent before:border-b-transparent
        ${
          isPaid
            ? "before:border-l-green-500"
            : isOverdue
            ? "before:border-l-red-500"
            : "before:border-l-blue-500"
        }
  `}
    >
      {/* Status badge positioned absolutely */}
      {getStatusBadge()}

      {/* Header with title only */}
      <div>
        <h3 className={`font-semibold text-lg ${getTextColor()}`}>
          {feePlan.name}
        </h3>
      </div>

      {/* Amount */}
      <div className="flex items-center justify-between">
        <div className={`text-2xl font-bold ${getTextColor()}`}>
          Amount: ₹{Number(feePlan.amount).toLocaleString()}
        </div>
      </div>

      {/* Due date or paid date */}
      {isPaid ? (
        <div className={`text-sm ${getTextColor()} opacity-90 mb-4`}>
          Paid on{" "}
          {dueDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      ) : (
        <div className={`text-sm ${getTextColor()} opacity-90 mb-2`}>
          Due: {dueDate.toLocaleDateString()}
        </div>
      )}

      {/* Description */}
      {feePlan.description && (
        <p
          className={`text-xs ${getTextColor()} opacity-90 mb-3 leading-relaxed`}
        >
          {feePlan.description}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {canPay && onPayment && isOverdue && (
          <Button
            size={"lg"}
            variant={"destructive"}
            onClick={() => onPayment(feePlan.id)}
            disabled={payingFeePlanId === feePlan.id}
            className="gap-2 text-xs"
          >
            {payingFeePlanId === feePlan.id ? (
              <SpinnerGapIcon size={12} className="animate-spin" />
            ) : (
              <CreditCardIcon size={12} weight="fill" />
            )}
            {payingFeePlanId === feePlan.id ? "Processing..." : "Pay Now"}
          </Button>
        )}

        {canPay && onPayment && !isOverdue && (
          <Button
            size={"lg"}
            onClick={() => onPayment(feePlan.id)}
            disabled={payingFeePlanId === feePlan.id}
          >
            {payingFeePlanId === feePlan.id ? (
              <SpinnerGapIcon size={12} className="animate-spin" />
            ) : (
              <CreditCardIcon size={12} weight="fill" />
            )}
            {payingFeePlanId === feePlan.id ? "Processing..." : "Pay Now"}
          </Button>
        )}

        {isPaid && !feePlan.isOfflinePaid && (
          <div className="flex gap-2">
            {feePlan.receipt && (
              <Button
                asChild
                size="sm"
                className="bg-green-600/80 text-xs flex-1 text-white"
              >
                <Link href={feePlan.receipt} target="_blank">
                  <FilePdfIcon weight="fill" />
                  Receipt
                </Link>
              </Button>
            )}
            <Button
              size="sm"
              className="text-xs flex-1 bg-green-600/80 hover:bg-white/30 text-white border-white/30"
              onClick={() => onPayment?.(feePlan.id)}
            >
              Details
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
