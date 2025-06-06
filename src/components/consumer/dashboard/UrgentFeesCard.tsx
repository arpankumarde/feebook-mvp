import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  WarningIcon,
  ClockIcon,
  CreditCardIcon,
  CalendarIcon,
} from "@phosphor-icons/react/dist/ssr";
import { formatAmount } from "@/utils/formatAmount";
import Link from "next/link";
import { SLUGS } from "@/constants/slugs";

interface UrgentFee {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: string;
  memberName: string;
  providerName: string;
  membershipId: string;
}

interface UrgentFeesCardProps {
  urgentFees: UrgentFee[];
}

export function UrgentFeesCard({ urgentFees }: UrgentFeesCardProps) {
  const getUrgencyBadge = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffDays = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <WarningIcon size={12} weight="fill" />
          {Math.abs(diffDays)} days overdue
        </Badge>
      );
    } else if (diffDays <= 3) {
      return (
        <Badge
          variant="secondary"
          className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-200"
        >
          <ClockIcon size={12} weight="fill" />
          Due in {diffDays} days
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="gap-1">
          <CalendarIcon size={12} weight="fill" />
          Due in {diffDays} days
        </Badge>
      );
    }
  };

  if (urgentFees.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockIcon size={20} className="text-green-600" />
            Urgent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon size={32} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-green-800 mb-2">
              All Caught Up!
            </h3>
            <p className="text-sm text-muted-foreground">
              No urgent payments at this time
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WarningIcon size={20} className="text-orange-600" />
          Urgent Payments ({urgentFees.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {urgentFees.map((fee) => (
          <div
            key={fee.id}
            className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{fee.name}</h4>
                {getUrgencyBadge(fee.dueDate)}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {fee.memberName} • {fee.providerName}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="font-semibold text-lg">
                  {formatAmount(fee.amount)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Due: {new Date(fee.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Button size="sm" className="gap-2" asChild>
              <Link href={`/${SLUGS.CONSUMER}/pay?feePlanId=${fee.id}`}>
                <CreditCardIcon size={16} />
                Pay Now
              </Link>
            </Button>
          </div>
        ))}

        {urgentFees.length > 0 && (
          <div className="pt-2">
            <Button className="w-full" asChild>
              <Link href={`/${SLUGS.CONSUMER}/memberships`}>
                View All Payments
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
