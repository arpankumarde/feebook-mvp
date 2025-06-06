import { Card, CardContent } from "@/components/ui/card";
import {
  CurrencyInrIcon,
  UsersThreeIcon,
  WarningIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { formatAmount } from "@/utils/formatAmount";

interface DashboardStatsProps {
  statistics: {
    totalMemberships: number;
    totalPendingFees: number;
    totalPendingAmount: number;
    overdueFees: number;
    overdueAmount: number;
    upcomingFees: number;
    recentPaymentsTotal: number;
    recentPaymentsCount: number;
  };
}

export function DashboardStats({ statistics }: DashboardStatsProps) {
  const stats = [
    {
      title: "Total Memberships",
      value: statistics.totalMemberships,
      icon: UsersThreeIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Active memberships",
    },
    {
      title: "Pending Amount",
      value: formatAmount(statistics.totalPendingAmount),
      icon: CurrencyInrIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: `${statistics.totalPendingFees} pending fees`,
    },
    {
      title: "Overdue Fees",
      value: statistics.overdueFees,
      icon: WarningIcon,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: formatAmount(statistics.overdueAmount),
    },
    {
      title: "Recent Payments",
      value: formatAmount(statistics.recentPaymentsTotal),
      icon: CheckCircleIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: `${statistics.recentPaymentsCount} transactions`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                  <IconComponent
                    size={24}
                    className={stat.color}
                    weight="bold"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground truncate">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {stat.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
