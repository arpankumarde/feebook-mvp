import db from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileTextIcon,
  ArrowRightIcon,
  ScalesIcon,
} from "@phosphor-icons/react/dist/ssr";

export const revalidate = 3600;

const Page = async () => {
  const policies = await db.policy.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-brand/40">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ScalesIcon size={32} className="text-primary" weight="duotone" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Legal Policies
          </h1>
        </div>

        {/* Policies Grid */}
        {policies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {policies.map((policy) => (
              <Card
                key={policy.id}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                        <FileTextIcon
                          size={24}
                          className="text-gray-600"
                          weight="duotone"
                        />
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRightIcon
                        size={16}
                        className="text-gray-400 group-hover:text-primary transition-colors"
                      />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {policy.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Updated:</span>
                    <span className="text-sm text-gray-500">
                      {new Date(policy.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <Link href={`/legal/${policy.slug}`} className="block mt-4">
                    <Button className="w-full group-hover:bg-primary group-hover:text-white transition-all duration-200">
                      <span>Read Policy</span>
                      <ArrowRightIcon
                        size={20}
                        className="group-hover:translate-x-1 transition-transform mt-1"
                      />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <FileTextIcon
                  size={48}
                  className="text-gray-400"
                  weight="duotone"
                />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Policies Available
            </h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
