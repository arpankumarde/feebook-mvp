import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UsersIcon,
  CurrencyCircleDollarIcon,
  ClockIcon,
  WarningIcon,
  TrendUpIcon,
  TrendDownIcon,
  WalletIcon,
} from "@phosphor-icons/react/dist/ssr";
import { formatAmount } from "@/utils/formatAmount";

interface DashboardStatsProps {
  stats: {
    totalMembers: number;
    totalRevenue: number;
    pendingAmount: number;
    overdueAmount: number;
    thisMonthRevenue: number;
    revenueGrowth: number;
    totalFeePlans: number;
    pendingFeePlans: number;
    overdueFeePlans: number;
    walletBalance: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: "Total Members",
      value: stats.totalMembers.toLocaleString(),
      icon: <UsersIcon className="h-6 w-6" weight="duotone" />,
      description: "Registered members",
      color: "text-blue-600",
    },
    {
      title: "Total Revenue",
      value: formatAmount(stats.totalRevenue),
      icon: <CurrencyCircleDollarIcon className="h-6 w-6" weight="duotone" />,
      description: `${stats.totalFeePlans} fee plans`,
      color: "text-green-600",
    },
    {
      title: "This Month",
      value: formatAmount(stats.thisMonthRevenue),
      icon:
        stats.revenueGrowth >= 0 ? (
          <TrendUpIcon className="h-6 w-6" weight="duotone" />
        ) : (
          <TrendDownIcon className="h-6 w-6" weight="duotone" />
        ),
      description: (
        <div className="flex items-center gap-1">
          <span
            className={
              stats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
            }
          >
            {stats.revenueGrowth >= 0 ? "+" : ""}
            {stats.revenueGrowth}%
          </span>
          <span>from last month</span>
        </div>
      ),
      color: stats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Wallet Balance",
      value: formatAmount(stats.walletBalance),
      icon: <WalletIcon className="h-6 w-6" weight="duotone" />,
      description: "Available balance",
      color: "text-purple-600",
    },
  ];

  const pendingCards = [
    {
      title: "Pending Fees",
      value: formatAmount(stats.pendingAmount),
      count: stats.pendingFeePlans,
      icon: <ClockIcon className="h-5 w-5" weight="duotone" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Overdue Fees",
      value: formatAmount(stats.overdueAmount),
      count: stats.overdueFeePlans,
      icon: <WarningIcon className="h-5 w-5" weight="duotone" />,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={stat.color}>{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending & Overdue */}
      <div className="grid gap-4 sm:grid-cols-2">
        {pendingCards.map((card, index) => (
          <Card key={index} className={card.bgColor}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <Badge variant="outline" className="mt-2">
                    {card.count} fee plans
                  </Badge>
                </div>
                <div className={`${card.color} p-2 rounded-full bg-white`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;
