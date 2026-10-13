import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
} from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import Auth from "./pages/auth/Auth";
import Dashboard from "./pages/dashboard/Dashboard";
import Records from "./pages/Records";
import Details from "./pages/Details";
import Analytics from "./pages/analytics/Analytics";
import Settings from "./pages/settings/Settings";
import { Button } from "./components/ui/button";
function Protected() {
  const { user, loading, error, refresh } = useAuth();
  if (loading)
    return (
      <div className="app-loading">
        <div className="loader" />
        <p>Getting your workspace ready…</p>
      </div>
    );
  if (error)
    return (
      <div className="app-loading">
        <p>{error}</p>
        <Button onClick={refresh}>Retry connection</Button>
      </div>
    );
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route element={<Protected />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              {["projects", "clients", "payments"].map((type) => (
                <Route
                  key={type}
                  path={type}
                  element={<Records key={type} type={type} />}
                />
              ))}
              {["projects", "clients"].map((type) => (
                <Route
                  key={type}
                  path={`${type}/:id`}
                  element={<Details key={type} type={type} />}
                />
              ))}
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route
                path="*"
                element={
                  <div className="empty-state">
                    <h1>Page not found</h1>
                    <Button asChild>
                      <Link to="/dashboard">Back to dashboard</Link>
                    </Button>
                  </div>
                }
              />
            </Route>
          </Route>
        </Routes>
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}
