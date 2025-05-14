export interface CustomerDetails {
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_uid?: string;
}

export interface OrderMeta {
  return_url?: string;
  notify_url?: string;
  payment_methods?: string;
}

export interface OrderTags {
  [key: string]: string;
}
