import { SLUGS } from "@/constants/slugs";
import { redirect } from "next/navigation";

const Page = () => {
  return redirect(`/${SLUGS.CONSUMER}/dashboard`);
};

export default Page;
