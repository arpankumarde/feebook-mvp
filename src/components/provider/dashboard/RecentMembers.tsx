import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { SLUGS } from "@/constants/slugs";
import { formatAmount } from "@/utils/formatAmount";

interface Member {
  id: string;
  name: string;
  uniqueId: string;
  joinedAt: Date;
  pendingAmount: number;
}

interface RecentMembersProps {
  members: Member[];
}

const RecentMembers: React.FC<RecentMembersProps> = ({ members }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Members</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${SLUGS.PROVIDER}/members`}>
            View All <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No members found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{member.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {member.uniqueId}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Joined {formatDate(member.joinedAt)}
                  </p>
                </div>
                <div className="text-right">
                  {member.pendingAmount > 0 && (
                    <p className="text-sm font-medium text-orange-600">
                      {formatAmount(member.pendingAmount)} pending
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentMembers;
