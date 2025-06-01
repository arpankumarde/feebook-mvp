/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "@cashfreepayments/cashfree-js" {
  export function load(options: {
    mode: "sandbox" | "production";
  }): Promise<any>;
}
