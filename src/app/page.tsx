import { Button } from "@/components/ui/button";
import { SLUGS } from "@/constants/slugs";
import Link from "next/link";

const Page = () => {
  return (
    <div>
      <h1>Feebook for Teachers</h1>

      <Button asChild>
        <Link href={`/${SLUGS.PROVIDER}/dashboard`}>Provider Dashboard</Link>
      </Button>

      <Button asChild>
        <Link href={`/${SLUGS.CONSUMER}/dashboard`}>Consumer Dashboard</Link>
      </Button>

      <Button asChild>
        <Link href={`/${SLUGS.MODERATOR}/dashboard`}>Moderator Dashboard</Link>
      </Button>
    </div>
  );
};

export default Page;
