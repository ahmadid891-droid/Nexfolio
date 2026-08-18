import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AdminRoute } from './components/admin/AdminRoute'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { AuthCallback } from './pages/AuthCallback'
import { Dashboard } from './pages/Dashboard'
import { ProductDetail } from './pages/ProductDetail'
import { AdminProducts } from './pages/admin/AdminProducts'
import { AdminOrders } from './pages/admin/AdminOrders'
import { AdminCategories } from './pages/admin/AdminCategories'
import { DriveStatus } from './pages/admin/DriveStatus'
import { MediaFireStatus } from './pages/admin/MediaFireStatus'
import { AdminLoginLogs } from './pages/admin/AdminLoginLogs'

function App() {
  return (
    <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/oauth/callback" element={<AuthCallback />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/purchases" element={<Dashboard />} />
            <Route path="/product/:slug" element={<ProductDetail />} />

            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminProducts />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <AdminRoute>
                  <AdminCategories />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <AdminOrders />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/drive-status"
              element={
                <AdminRoute>
                  <DriveStatus />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/mediafire"
              element={
                <AdminRoute>
                  <MediaFireStatus />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/login-logs"
              element={
                <AdminRoute>
                  <AdminLoginLogs />
                </AdminRoute>
              }
            />
          </Routes>
        </AuthProvider>
    </BrowserRouter>
  )
}

export default App
