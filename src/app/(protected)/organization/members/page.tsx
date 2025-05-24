"use client";

import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { Member, Provider } from "@/generated/prisma";
import { getCookie } from "cookies-next/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PROVIDER_COOKIE } from "@/constants/cookies";

const Page = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const providerId = getCookie(PROVIDER_COOKIE)
    ? (JSON.parse(getCookie(PROVIDER_COOKIE) ?? "{}") as Provider).id
    : null;

  useEffect(() => {
    const fetchFeePlans = async () => {
      try {
        if (!providerId) {
          setError("Provider information not found");
          setLoading(false);
          return;
        }

        const members = (
          await api.get(`/api/v1/provider/member?providerId=${providerId}`)
        ).data as Member[];
        setMembers(members);
      } catch (err) {
        console.error("Error fetching fee plans:", err);
        setError("Failed to load fee plans");
      } finally {
        setLoading(false);
      }
    };

    fetchFeePlans();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Members</h1>

      <div className="mt-4 flex justify-end">
        <Button asChild>
          <Link href="/organization/members/add">Add Member</Link>
        </Button>
      </div>

      {loading && <p>Loading fee plans...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Enrolled Members</h2>
          {members.length === 0 ? (
            <p>No members found. Please add a member first.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Category/Subcategory
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Phone
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.firstName} {member.middleName} {member.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.category || "N/A"}/{member.subcategory || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          asChild
                        >
                          <Link
                            href={`/organization/members/edit/${member.id}`}
                          >
                            Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          <Link
                            href={`/organization/members/view/${member.id}`}
                          >
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Page;
