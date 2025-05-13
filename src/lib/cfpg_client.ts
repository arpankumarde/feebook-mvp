"use client";

import { load } from "@cashfreepayments/cashfree-js";

var cashfree = await load({
  mode: "sandbox",
});

export default cashfree;
