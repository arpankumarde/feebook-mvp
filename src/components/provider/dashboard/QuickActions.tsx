import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlusIcon,
  CreditCardIcon,
  UsersIcon,
  GearSixIcon,
  WalletIcon,
  IdentificationCardIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { SLUGS } from "@/constants/slugs";

interface QuickActionsProps {
  isVerified: boolean;
  hasDefaultBank: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  isVerified,
  hasDefaultBank,
}) => {
  const actions = [
    {
      title: "Add Member",
      description: "Register a new member",
      icon: <UserPlusIcon className="h-5 w-5" weight="duotone" />,
      href: `/${SLUGS.PROVIDER}/members/add`,
      enabled: isVerified,
    },
    {
      title: "View Members",
      description: "Manage all members",
      icon: <UsersIcon className="h-5 w-5" weight="duotone" />,
      href: `/${SLUGS.PROVIDER}/members`,
      enabled: true,
    },
    {
      title: "Fee Management",
      description: "Create and manage fees",
      icon: <CreditCardIcon className="h-5 w-5" weight="duotone" />,
      href: `/${SLUGS.PROVIDER}/fee-management`,
      enabled: isVerified,
    },
    {
      title: "Wallet",
      description: "View wallet & withdrawals",
      icon: <WalletIcon className="h-5 w-5" weight="duotone" />,
      href: `/${SLUGS.PROVIDER}/wallet`,
      enabled: isVerified && hasDefaultBank,
    },
    {
      title: "KYC Verification",
      description: "Complete verification",
      icon: <IdentificationCardIcon className="h-5 w-5" weight="duotone" />,
      href: `/${SLUGS.PROVIDER}/kyc`,
      enabled: true,
      highlight: !isVerified,
    },
    {
      title: "Settings",
      description: "Account settings",
      icon: <GearSixIcon className="h-5 w-5" weight="duotone" />,
      href: `/${SLUGS.PROVIDER}/settings`,
      enabled: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              asChild
              variant={action.highlight ? "default" : "outline"}
              className="h-auto p-4 justify-start"
              disabled={!action.enabled}
            >
              <Link href={action.href}>
                <div className="flex items-start gap-3">
                  <div
                    className={`${
                      action.highlight
                        ? "text-primary-foreground"
                        : "text-primary"
                    }`}
                  >
                    {action.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div
                      className={`text-xs ${
                        action.highlight
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      {action.description}
                    </div>
                  </div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
