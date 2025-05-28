"use client";

import { load } from "@cashfreepayments/cashfree-js";

const cashfree = await load({
  mode: "sandbox",
});

export default cashfree;
