import db from "@/lib/db";
import Markdown from "react-markdown";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateStaticParams() {
  const policy = await db.policy.findMany({});

  // consolidate all slugs in an array
  const slugs = policy?.map((item) => item.slug) || [];

  const flatSlugs = slugs.flat();

  return flatSlugs.map((slug) => ({
    slug: slug,
  }));
}

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const policy = await db.policy.findUnique({ where: { slug } });

  if (!policy) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 prose prose-strong:font-bold">
      <Markdown>{policy?.content}</Markdown>
    </div>
  );
};

export default Page;
