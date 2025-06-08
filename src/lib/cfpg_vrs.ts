import axios from "axios";

const CASHFREE_VRS_APP_ID = process.env.CASHFREE_VRS_APP_ID;
const CASHFREE_VRS_APP_SECRET = process.env.CASHFREE_VRS_APP_SECRET;

const cfvrs = axios.create({
  baseURL: process.env.CASHFREE_VRS_SERVER_BASE,
  headers: {
    "X-Client-Id": CASHFREE_VRS_APP_ID,
    "X-Client-Secret": CASHFREE_VRS_APP_SECRET,
  },
});

export default cfvrs;
