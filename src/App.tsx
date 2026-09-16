import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute, ADMIN_PATH } from './components/admin/ProtectedRoute';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';

import { Home } from './pages/public/Home';
import { ProductGallery } from './pages/public/ProductGallery';
import { ProductDetail } from './pages/public/ProductDetail';
import { Contact } from './pages/public/Contact';

import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminProductForm } from './pages/admin/AdminProductForm';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminContactMethods } from './pages/admin/AdminContactMethods';
import { AdminInquiries } from './pages/admin/AdminInquiries';
import { AdminWorkflows } from './pages/admin/AdminWorkflows';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
        <Routes>
          {/* Public site — the only routes linked anywhere in the UI */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductGallery />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/*
            Admin gateway — path comes from VITE_ADMIN_PATH (see .env.example),
            not hardcoded here, and never referenced from PublicLayout, a
            sitemap, or any <a>/<Link> a visitor could find. Knowing the path
            alone isn't enough either: every route below still requires a
            real Supabase Auth session with profiles.role = 'admin',
            enforced again server-side by RLS.
          */}
          <Route path={`${ADMIN_PATH}/login`} element={<AdminLogin />} />
          <Route
            path={ADMIN_PATH}
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="contact-methods" element={<AdminContactMethods />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="workflows" element={<AdminWorkflows />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
          </Route>
        </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
