import { Cashfree, CFEnvironment } from "cashfree-pg";

const cashfree = new Cashfree(
  process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === "production"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_APP_SECRET
);

export default cashfree;
