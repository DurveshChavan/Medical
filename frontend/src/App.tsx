import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/hooks/useTheme';
import { SidebarProvider, useSidebar } from '@/hooks/useSidebar';
import { SandboxProvider, useSandbox } from '@/hooks/useSandbox';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import SandboxStatusBanner from '@/components/SandboxStatusBanner';
import DashboardPage from '@/pages/DashboardPage';
import MainDashboardPage from '@/pages/MainDashboardPage';
import BillingPage from '@/pages/BillingPage';
import ReturnsPage from '@/pages/ReturnsPage';
import CustomersPage from '@/pages/CustomersPage';
import SuppliersManufacturersPage from '@/pages/SuppliersManufacturersPage';
import EnhancedSeasonalAnalyticsPage from '@/pages/SeasonalAnalyticsPage';
import InventoryPage from '@/pages/InventoryPage';
import InventoryManagementPage from '@/pages/InventoryManagementPage';
import DataManagementPage from '@/pages/DataManagementPage';
import AdvancedAnalyticsPage from '@/pages/AdvancedAnalyticsPage';
import DataUploadPage from '@/pages/DataUploadPage';
import SettingsPage from '@/pages/SettingsPage';
import '@/styles/fonts.css';
import '@/styles/theme.css';
import '@/styles/layout.css';
import '@/styles/responsive.css';

const AppContent: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const { isSandboxMode, uploadedFilename } = useSandbox();
  
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SandboxStatusBanner 
        isSandboxMode={isSandboxMode} 
        uploadedFilename={uploadedFilename}
        isUsingTempDatabase={isSandboxMode}
      />
      <div className="app-container">
        <Sidebar />
        <div className={`main-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Routes>
              <Route 
                path="/" 
                element={
                  <>
                    <Navbar title="Dashboard" />
                    <main className="main-content">
                      <MainDashboardPage />
                    </main>
                  </>
                } 
              />
              <Route 
                path="/billing" 
                element={
                  <>
                    <Navbar title="Billing" />
                    <main className="main-content">
                      <BillingPage />
                    </main>
                  </>
                } 
              />
                  <Route
                    path="/returns"
                    element={
                      <>
                        <Navbar title="Returns & Refunds" />
                        <main className="main-content">
                          <ReturnsPage />
                        </main>
                      </>
                    }
                  />
                  <Route
                    path="/customers"
                    element={
                      <>
                        <Navbar title="Customer Management" />
                        <main className="main-content">
                          <CustomersPage />
                        </main>
                      </>
                    }
                  />
                  <Route
                    path="/suppliers-manufacturers"
                    element={
                      <>
                        <Navbar title="Suppliers & Manufacturers" />
                        <main className="main-content">
                          <SuppliersManufacturersPage />
                        </main>
                      </>
                    }
                  />
              <Route 
                path="/dashboard-old" 
                element={
                  <>
                    <Navbar title="Dashboard (Original)" />
                    <main className="main-content">
                      <DashboardPage />
                    </main>
                  </>
                } 
              />
              <Route 
                path="/seasonal" 
                element={
                  <>
                    <Navbar title="Seasonal Analysis" />
                    <main className="main-content">
                      <EnhancedSeasonalAnalyticsPage />
                    </main>
                  </>
                } 
              />
              <Route 
                path="/inventory" 
                element={
                  <>
                    <Navbar title="Inventory Management" />
                    <main className="main-content">
                      <InventoryManagementPage />
                    </main>
                  </>
                } 
              />
              <Route 
                path="/inventory-old" 
                element={
                  <>
                    <Navbar title="Inventory (Original)" />
                    <main className="main-content">
                      <InventoryPage />
                    </main>
                  </>
                } 
              />
              <Route 
                path="/advanced-analytics" 
                element={
                  <>
                    <Navbar title="Advanced Analytics" />
                    <main className="main-content">
                      <AdvancedAnalyticsPage />
                    </main>
                  </>
                } 
              />
              <Route 
                path="/data-upload" 
                element={
                  <>
                    <Navbar title="Data Management" />
                    <main className="main-content">
                      <DataManagementPage />
                    </main>
                  </>
                } 
              />
              <Route 
                path="/data-upload-old" 
                element={
                  <>
                    <Navbar title="Data Management (Original)" />
                    <main className="main-content">
                      <DataUploadPage />
                    </main>
                  </>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <>
                    <Navbar title="Settings" />
                    <main className="main-content">
                      <SettingsPage />
                    </main>
                  </>
                } 
              />
            </Routes>
        </div>
      </div>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider>
      <SandboxProvider>
        <SidebarProvider>
          <AppContent />
        </SidebarProvider>
      </SandboxProvider>
    </ThemeProvider>
  );
}

export default App;

