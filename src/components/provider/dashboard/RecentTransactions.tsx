import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { SLUGS } from "@/constants/slugs";
import { formatAmount } from "@/utils/formatAmount";

interface Transaction {
  id: string;
  amount: number;
  paymentTime: Date | null;
  memberName: string;
  memberUniqueId: string;
  feePlanName: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
}) => {
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Payments</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${SLUGS.PROVIDER}/payments`}>
            View All <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent payments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{transaction.memberName}</h4>
                    <Badge variant="outline" className="text-xs">
                      {transaction.memberUniqueId}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {transaction.feePlanName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.paymentTime)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    {formatAmount(transaction.amount)}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    SUCCESS
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
