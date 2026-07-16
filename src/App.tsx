import { Redirect, Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminShell } from "@/components/admin/AdminShell";
import { LoginPage } from "@/pages/Login";
import { DashboardPage } from "@/pages/Dashboard";
import { InvestorsPage } from "@/pages/Investors";
import { InvestorDetailPage } from "@/pages/InvestorDetail";
import { InviteInvestorPage } from "@/pages/InviteInvestor";
import { InvestorNewPage } from "@/pages/InvestorNew";
import { PropertiesPage } from "@/pages/Properties";
import { PropertyFormPage } from "@/pages/PropertyForm";
import { DevelopmentsPage } from "@/pages/Developments";
import { DevelopmentFormPage } from "@/pages/DevelopmentForm";
import { EnquiriesPage } from "@/pages/Enquiries";
import { SignalsPage } from "@/pages/Signals";
import { AssumptionsPage } from "@/pages/Assumptions";
import { PaymentsPage } from "@/pages/Payments";
import { ContentPage } from "@/pages/Content";
import { UsersPage } from "@/pages/Users";
import { ActivityPage } from "@/pages/Activity";
import { SettingsPage } from "@/pages/Settings";

function Protected({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;
  return <AdminShell>{children}</AdminShell>;
}

function Routes() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/" /> : <LoginPage />}
      </Route>
      <Route path="/">
        <Protected>
          <DashboardPage />
        </Protected>
      </Route>
      <Route path="/investors">
        <Protected>
          <InvestorsPage />
        </Protected>
      </Route>
      <Route path="/investors/invite">
        <Protected>
          <InviteInvestorPage />
        </Protected>
      </Route>
      <Route path="/investors/new">
        <Protected>
          <InvestorNewPage />
        </Protected>
      </Route>
      <Route path="/investors/:id">
        <Protected>
          <InvestorDetailPage />
        </Protected>
      </Route>
      <Route path="/properties">
        <Protected>
          <PropertiesPage />
        </Protected>
      </Route>
      <Route path="/properties/new">
        <Protected>
          <PropertyFormPage />
        </Protected>
      </Route>
      <Route path="/properties/:id">
        <Protected>
          <PropertyFormPage />
        </Protected>
      </Route>
      <Route path="/developments">
        <Protected>
          <DevelopmentsPage />
        </Protected>
      </Route>
      <Route path="/developments/new">
        <Protected>
          <DevelopmentFormPage />
        </Protected>
      </Route>
      <Route path="/developments/:id">
        <Protected>
          <DevelopmentFormPage />
        </Protected>
      </Route>
      <Route path="/enquiries">
        <Protected>
          <EnquiriesPage />
        </Protected>
      </Route>
      <Route path="/signals">
        <Protected>
          <SignalsPage />
        </Protected>
      </Route>
      <Route path="/assumptions">
        <Protected>
          <AssumptionsPage />
        </Protected>
      </Route>
      <Route path="/payments">
        <Protected>
          <PaymentsPage />
        </Protected>
      </Route>
      <Route path="/documents">
        <Redirect to="/investors" />
      </Route>
      <Route path="/content">
        <Protected>
          <ContentPage />
        </Protected>
      </Route>
      <Route path="/users">
        <Protected>
          <UsersPage />
        </Protected>
      </Route>
      <Route path="/activity">
        <Protected>
          <ActivityPage />
        </Protected>
      </Route>
      <Route path="/settings">
        <Protected>
          <SettingsPage />
        </Protected>
      </Route>
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Routes />
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </AuthProvider>
  );
}
