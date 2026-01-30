import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css'
import EstimateForm from "./index.jsx";
import AdminLayout from './pages/admin/AdminLayout.jsx';
import ServicesPage from './pages/admin/ServicesPage.jsx';
import ComboRulesPage from './pages/admin/ComboRulesPage.jsx';
import ProductBenefitsPage from './pages/admin/ProductBenefitsPage.jsx';
import BenefitRulesPage from './pages/admin/BenefitRulesPage.jsx';
import BundleBenefitsPage from './pages/admin/BundleBenefitsPage.jsx';
import SettingsPage from './pages/admin/SettingsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminLayout/></ProtectedRoute>}>
          <Route path="services" element={<ServicesPage/>} />
          <Route path="combo" element={<ComboRulesPage/>} />
          <Route path="product-benefits" element={<ProductBenefitsPage/>} />
          <Route path="benefit-rules" element={<BenefitRulesPage/>} />
          <Route path="bundle-benefits" element={<BundleBenefitsPage/>} />
          <Route path="settings" element={<SettingsPage/>} />
          <Route index element={<Navigate to="services" replace/>} />
        </Route>
        <Route path="/*" element={<ProtectedRoute><EstimateForm/></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage/>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
