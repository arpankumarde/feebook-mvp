"use client";

import { load } from "@cashfreepayments/cashfree-js";

const cashfree = await load({
  mode:
    process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === "production"
      ? "production"
      : "sandbox",
});

export default cashfree;
