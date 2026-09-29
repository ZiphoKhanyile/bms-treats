import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import AddressStep from './pages/checkout/AddressStep'
import PaymentStep from './pages/checkout/PaymentStep'
import TrackOrder from './pages/TrackOrder'
import TrackOrderLookup from './pages/TrackOrderLookup'
import AdminLayout from './pages/admin/AdminLayout'
import AdminOrders from './pages/admin/AdminOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminResidences from './pages/admin/AdminResidences'
import AdminSettings from './pages/admin/AdminSettings'

function SiteLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Admin — its own sidebar shell, no site header/footer */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOrders />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="residences" element={<AdminResidences />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Auth pages — their own minimal top bar, no site header/footer */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Everything else — normal site header + footer */}
      <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
      <Route path="/product/:id" element={<SiteLayout><ProductDetail /></SiteLayout>} />
      <Route path="/checkout/address" element={<SiteLayout><AddressStep /></SiteLayout>} />
      <Route path="/checkout/payment" element={<SiteLayout><PaymentStep /></SiteLayout>} />
      <Route path="/track-order-lookup" element={<SiteLayout><TrackOrderLookup /></SiteLayout>} />
      <Route path="/track-order/:orderId" element={<SiteLayout><TrackOrder /></SiteLayout>} />
    </Routes>
  )
}