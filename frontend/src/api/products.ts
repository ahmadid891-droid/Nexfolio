import { api } from './client'

export interface Category {
  id: number
  name: string
  slug: string
  has_demo: boolean
  kind: string | null
  sort_order?: number
  is_active?: boolean
  product_count?: number
}

export interface ProductFile {
  id: number
  file_name: string
  drive_file_id: string | null
}

export interface Product {
  id: number
  title: string
  slug: string
  description: string | null
  price_idr: number
  price_formatted?: string
  is_paid?: boolean
  demo_url: string | null
  cover_image: string | null
  cover_url?: string | null
  drive_file_id: string | null
  drive_folder_id?: string | null
  storage_provider?: string
  mediafire_link?: string | null
  mediafire_page_url?: string | null
  mediafire_link_resolved_at?: string | null
  category_id?: number | null
  category?: Category | null
  files?: ProductFile[]
  files_count?: number
  has_drive_file?: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getPublicCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/api/categories')
  return data
}

export async function getPublicProducts(category?: string): Promise<Product[]> {
  const { data } = await api.get<Product[]>('/api/products', {
    params: category ? { category } : undefined,
  })
  return data
}

export async function getPublicProduct(slug: string): Promise<Product> {
  const { data } = await api.get<Product>(`/api/products/${slug}`)
  return data
}

export interface CommentUser {
  id: number
  name: string
  avatar: string | null
}

export interface Comment {
  id: number
  body: string
  parent_id: number | null
  likes_count: number
  liked: boolean
  created_at: string
  user: CommentUser | null
  replies: Comment[]
}

export async function getProductComments(slug: string): Promise<Comment[]> {
  const { data } = await api.get<Comment[]>(`/api/products/${slug}/comments`)
  return data
}

export async function createProductComment(
  slug: string,
  body: string,
  parentId?: number,
): Promise<Comment> {
  const { data } = await api.post<Comment>(`/api/products/${slug}/comments`, {
    body,
    parent_id: parentId,
  })
  return data
}

export async function toggleCommentLike(id: number): Promise<{ liked: boolean; likes_count: number }> {
  const { data } = await api.post<{ liked: boolean; likes_count: number }>(
    `/api/comments/${id}/like`,
  )
  return data
}

export async function deleteProductComment(id: number): Promise<void> {
  await api.delete(`/api/comments/${id}`)
}

export interface SiteStats {
  total: number
  paid: number
  free: number
  with_demo: number
}

export async function getSiteStats(): Promise<SiteStats> {
  const { data } = await api.get<SiteStats>('/api/site/stats')
  return data
}

export interface OnlineStats {
  users_online: number
  visitors_today: number
}

export async function getOnline(): Promise<OnlineStats> {
  const { data } = await api.get<OnlineStats>('/api/online')
  return data
}

export interface LoginLogEntry {
  id: number
  ip_address: string
  user_agent: string | null
  created_at: string
  user: {
    name: string
    email: string
    avatar: string | null
  } | null
}

export interface LoginLogResponse {
  logs: LoginLogEntry[]
  total: number
  unique_ips: number
}

export async function getLoginLogs(limit = 100): Promise<LoginLogResponse> {
  const { data } = await api.get<LoginLogResponse>('/api/admin/login-logs', {
    params: { limit },
  })
  return data
}

export async function getAdminProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>('/api/admin/products')
  return data
}

export async function createProduct(form: FormData): Promise<Product> {
  const { data } = await api.post<Product>('/api/admin/products', form)
  return data
}

export async function updateProduct(id: number, form: FormData): Promise<Product> {
  form.set('_method', 'PUT')
  const { data } = await api.post<Product>(`/api/admin/products/${id}`, form)
  return data
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/api/admin/products/${id}`)
}

export async function deleteProductFile(productId: number, fileId: number): Promise<void> {
  await api.delete(`/api/admin/products/${productId}/files/${fileId}`)
}

export async function getAdminCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/api/admin/categories')
  return data
}

export interface CategoryInput {
  name: string
  has_demo: boolean
  kind: string | null
  sort_order?: number
  is_active?: boolean
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data } = await api.post<Category>('/api/admin/categories', input)
  return data
}

export async function updateCategory(id: number, input: CategoryInput): Promise<Category> {
  const { data } = await api.put<Category>(`/api/admin/categories/${id}`, input)
  return data
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/api/admin/categories/${id}`)
}