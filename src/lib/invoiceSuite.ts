import axios from "axios";

const ivSuite = axios.create({
  baseURL: process.env.INVOICE_SUITE_ENDPOINT,
  headers: {
    Authorization: "Bearer " + process.env.INVOICE_SUITE_API_KEY,
  },
});

export default ivSuite;
