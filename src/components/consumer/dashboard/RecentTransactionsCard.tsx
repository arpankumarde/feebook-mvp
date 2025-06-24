import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  ReceiptIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { formatAmount } from "@/utils/formatAmount";
import Link from "next/link";
import { SLUGS } from "@/constants/slugs";

interface RecentTransaction {
  id: string;
  amount: number;
  paymentTime: string | null;
  feePlanName: string;
  memberName: string;
  providerName: string;
}

interface RecentTransactionsCardProps {
  transactions: RecentTransaction[];
}

export function RecentTransactionsCard({
  transactions,
}: RecentTransactionsCardProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptIcon size={20} className="text-primary" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ReceiptIcon size={32} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No Recent Payments</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your payment history will appear here
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${SLUGS.CONSUMER}/memberships`}>
                Make Your First Payment
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <ReceiptIcon size={20} className="text-primary" />
          Recent Payments
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${SLUGS.CONSUMER}/payment-history`} className="gap-1">
            View All
            <ArrowRightIcon size={14} />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg border border-green-200/50"
          >
            <div className="flex max-sm:flex-col items-start sm:items-center gap-2">
              <div className="flex items-center gap-4 p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon
                  size={16}
                  className="text-green-600"
                  weight="fill"
                />
                <div className="sm:hidden text-right">
                  <span className="font-semibold text-green-600">
                    {formatAmount(transaction.amount)}
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm truncate">
                  {transaction.feePlanName}
                </h4>
                <p className="text-xs text-muted-foreground truncate">
                  {transaction.memberName} <br /> {transaction.providerName}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <CalendarIcon size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {transaction.paymentTime
                      ? new Date(transaction.paymentTime).toLocaleDateString()
                      : "Recently"}
                  </span>
                </div>
              </div>
            </div>
            <div className="max-sm:hidden text-right">
              <span className="font-semibold text-green-600">
                {formatAmount(transaction.amount)}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
