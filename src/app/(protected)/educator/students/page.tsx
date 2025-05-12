"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCookie } from "cookies-next/client";
import { ExtendedInstituteUserType } from "@/app/(public)/auth/handlers/auth";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { getEnrollments } from "./handlers/getEnrollments";
import { toast } from "sonner";
import { Enrollment } from "@/generated/prisma";

const Page = () => {
  const user: ExtendedInstituteUserType = JSON.parse(
    getCookie("__fb_user") || "{}"
  );

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        if (!user?.institution?.id) {
          setLoading(false);
          return;
        }

        const result = await getEnrollments(user.institution.id);

        if (result.success && result.data) {
          setEnrollments(result?.data);
        } else {
          toast.error("Failed to fetch enrollments");
        }
      } catch (error) {
        console.error("Error fetching enrollments:", error);
        toast.error("An error occurred while fetching enrollments");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [user?.institution?.id]);

  return (
    <div className="container py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Students</h1>
        <Button asChild>
          <Link href="/educator/students/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Student
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <p>Loading enrollments...</p>
            </div>
          ) : enrollments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Enrollment ID</th>
                    <th className="px-4 py-2 text-left">Student Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Phone</th>
                    <th className="px-4 py-2 text-left">Join Date</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-4 py-2">{enrollment.enrollmentId}</td>
                      <td className="px-4 py-2">{enrollment.studentName}</td>
                      <td className="px-4 py-2">
                        {enrollment.studentEmail || "-"}
                      </td>
                      <td className="px-4 py-2">
                        {enrollment.studentPhone || "-"}
                      </td>
                      <td className="px-4 py-2">
                        {new Date(enrollment.joinDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/educator/students/${enrollment.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="mb-4 text-gray-500">No students enrolled yet</p>
              <Button asChild>
                <Link href="/educator/students/create">
                  Add Your First Student
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
