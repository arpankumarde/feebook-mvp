import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UsersThreeIcon,
  PlusIcon,
  EyeIcon,
  GraduationCapIcon,
  BarbellIcon,
  StorefrontIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { SLUGS } from "@/constants/slugs";
import { AccountCategory } from "@prisma/client";

interface Membership {
  id: string;
  claimedAt: string;
  memberName: string;
  memberUniqueId: string;
  providerName: string;
  providerCategory: AccountCategory;
  pendingFeesCount: number;
}

interface MembershipsOverviewCardProps {
  memberships: Membership[];
}

export function MembershipsOverviewCard({
  memberships,
}: MembershipsOverviewCardProps) {
  const getProviderIcon = (category: AccountCategory) => {
    switch (category) {
      case "EDUCATIONAL":
      case "HIGHER_EDUCATION":
        return GraduationCapIcon;
      case "FITNESS_SPORTS":
        return BarbellIcon;
      default:
        return StorefrontIcon;
    }
  };

  if (memberships.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersThreeIcon size={20} className="text-primary" />
            My Memberships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersThreeIcon size={32} className="text-primary" />
            </div>
            <h3 className="font-semibold mb-2">No Memberships Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect with organizations to manage your fees
            </p>
            <Button className="gap-2" asChild>
              <Link href={`/${SLUGS.CONSUMER}/memberships/add`}>
                <PlusIcon size={16} weight="bold" />
                Add First Membership
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <UsersThreeIcon size={20} className="text-primary" />
          My Memberships ({memberships.length})
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${SLUGS.CONSUMER}/memberships`} className="gap-1">
            View All
            <ArrowRightIcon size={14} />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {memberships.slice(0, 4).map((membership) => {
          const IconComponent = getProviderIcon(membership.providerCategory);
          return (
            <div
              key={membership.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconComponent
                    size={16}
                    className="text-primary"
                    weight="duotone"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm truncate">
                    {membership.memberName}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {membership.providerName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      ID: {membership.memberUniqueId}
                    </span>
                    {membership.pendingFeesCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-1.5 py-0.5"
                      >
                        {membership.pendingFeesCount} pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href={`/${SLUGS.CONSUMER}/memberships/${membership.id}/schedule`}
                >
                  <EyeIcon size={16} />
                </Link>
              </Button>
            </div>
          );
        })}

        {memberships.length > 4 && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${SLUGS.CONSUMER}/memberships`}>
                View {memberships.length - 4} More
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
