import { SLUGS } from "@/constants/slugs";
import { redirect } from "next/navigation";

const Page = () => {
  return redirect(`/${SLUGS.MODERATOR}/dashboard`);
};

export default Page;
