"use client";

import { load } from "@cashfreepayments/cashfree-js";

const cashfree = await load({
  mode:
    process.env.CASHFREE_ENVIRONMENT === "production"
      ? "production"
      : "sandbox",
});

export default cashfree;
