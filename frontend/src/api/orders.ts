import { api } from './client'

export interface PaymentConfig {
  client_key: string
  is_production: boolean
}

export interface CheckoutResult {
  status: 'paid' | 'already_purchased' | 'pending_payment'
  snap_token?: string
  snap_redirect_url?: string
  order: {
    id: number
    status: string
    total_idr: number
    payment_type: string | null
  }
}

export interface Purchase {
  id: number
  status: string
  total_idr: number
  total_formatted: string
  payment_type: string | null
  paid_at: string | null
  product: {
    id: number
    title: string
    slug: string
    cover_url: string | null
  }
  drive_link: string | null
  fulfilled: boolean
}

export interface InboxMessage {
  id: number
  subject: string
  body: string
  button_label: string | null
  button_url: string | null
  is_read: boolean
  created_at: string
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const { data } = await api.get<PaymentConfig>('/api/payment/config')
  return data
}

export async function checkout(productId: number): Promise<CheckoutResult> {
  const { data } = await api.post<CheckoutResult>('/api/checkout', { product_id: productId })
  return data
}

export async function getPurchases(): Promise<Purchase[]> {
  const { data } = await api.get<Purchase[]>('/api/my/purchases')
  return data
}

export async function getInbox(): Promise<InboxMessage[]> {
  const { data } = await api.get<InboxMessage[]>('/api/my/inbox')
  return data
}

export async function markInboxRead(id: number): Promise<void> {
  await api.post(`/api/my/inbox/${id}/read`)
}

export interface AdminOrder {
  id: number
  order_ref: string | null
  status: string
  total_idr: number
  total_formatted: string
  payment_type: string | null
  payment_method: string | null
  paid_at: string | null
  created_at: string
  user: { name: string | null; email: string | null }
  product: { title: string | null; slug: string | null }
  fulfillment: {
    status: string
    drive_link: string | null
    granted_to: string | null
    delivered_at: string | null
  }
}

export interface AdminOrdersResponse {
  orders: AdminOrder[]
  summary: {
    total: number
    pending: number
    paid: number
    failed: number
    delivery_failed: number
  }
}

export async function getAdminOrders(): Promise<AdminOrdersResponse> {
  const { data } = await api.get<AdminOrdersResponse>('/api/admin/orders')
  return data
}

export async function getAdminOrderStats(): Promise<AdminOrderStatsResponse> {
  const { data } = await api.get<AdminOrderStatsResponse>('/api/admin/orders/stats')
  return data
}

export async function getInboxUnread(): Promise<number> {
  const { data } = await api.get<{ unread: number }>('/api/my/inbox/unread')
  return data.unread
}

export interface AdminOrderStatsResponse {
  summary: {
    total: number
    pending: number
    paid: number
    failed: number
    delivery_failed: number
    revenue_idr: number
  }
  daily: {
    date: string
    label: string
    orders: number
    revenue_idr: number
  }[]
}

export async function retryOrderDelivery(id: number): Promise<void> {
  await api.post(`/api/admin/orders/${id}/retry`)
}

export async function syncOrderStatus(id: number): Promise<{ message: string; status: string }> {
  const { data } = await api.post<{ message: string; status: string }>(
    `/api/admin/orders/${id}/sync`,
  )
  return data
}

export async function cancelOrder(id: number): Promise<void> {
  await api.post(`/api/admin/orders/${id}/cancel`)
}