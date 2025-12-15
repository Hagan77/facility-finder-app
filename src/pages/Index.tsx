import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FacilitySearch from "@/components/FacilitySearch";
import PaymentSearch from "@/components/PaymentSearch";
import AddFacility from "@/components/AddFacility";
import AdminDashboard from "@/components/AdminDashboard";
import SuperAdminDashboard from "@/components/SuperAdminDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Search, CreditCard, Plus } from "lucide-react";

const Index = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'main' | 'permit' | 'payment' | 'add'>('main');
  
  // Check user role and sector
  const isAdmin = userProfile?.role === 'admin';
  const isSectorHead = userProfile?.role === 'sector_head';
  const userSector = userProfile?.sector;

  const renderMainMenu = () => (
    <div className="max-w-2xl mx-auto space-y-6 px-2 sm:px-0">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4">Facility Management System</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">Choose an option to continue</p>
      </div>
      
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('permit')}>
          <CardHeader className="text-center p-4 sm:p-6">
            <Search className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-primary" />
            <CardTitle className="text-lg sm:text-xl">Check Permit Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              Search and view facility permit information and records
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('payment')}>
          <CardHeader className="text-center p-4 sm:p-6">
            <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-primary" />
            <CardTitle className="text-lg sm:text-xl">Check Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              Search and view payment records and transaction history
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-6 sm:mt-8">
        <Button 
          variant="outline" 
          onClick={() => setCurrentView('add')}
          className="mb-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Facility
        </Button>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'permit':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Permit Status</h2>
            </div>
            <FacilitySearch />
          </div>
        );
      case 'payment':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Payment Status</h2>
            </div>
            <PaymentSearch />
          </div>
        );
      case 'add':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Add New Facility</h2>
            </div>
            <AddFacility />
          </div>
        );
      default:
        return renderMainMenu();
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Check if user is the super admin (admin/admin123)
  const isSuperAdmin = isAdmin && currentUser === 'admin';

  // If user is the super admin, show enhanced SuperAdminDashboard
  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background">
        {/* Top Navigation Bar */}
        <nav className="border-b bg-background">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Welcome, Super Admin</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto py-8 px-4">
          <SuperAdminDashboard />
        </div>
      </div>
    );
  }

  // If user is a regular admin (Head1, Head2), show standard admin dashboard
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        {/* Top Navigation Bar */}
        <nav className="border-b bg-background">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Welcome, Director {currentUser}</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto py-8 px-4">
          <AdminDashboard />
        </div>
      </div>
    );
  }

  // If user is a sector head, show their sector-specific dashboard
  if (isSectorHead && userSector) {
    const sectorTitle = `${userSector.charAt(0).toUpperCase() + userSector.slice(1)} Sector Dashboard`;
    
    return (
      <div className="min-h-screen bg-background">
        {/* Top Navigation Bar */}
        <nav className="border-b bg-background">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Welcome, {currentUser}</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto py-8 px-4">
          <AdminDashboard 
            sectorFilter={userSector} 
            title={sectorTitle} 
          />
        </div>
      </div>
    );
  }

  // Regular user interface
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="border-b bg-background">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Left side - Back to Menu button or Welcome message */}
            <div className="flex items-center">
              {currentView !== 'main' ? (
                <Button variant="outline" onClick={() => setCurrentView('main')}>
                  ← Back to Menu
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">Welcome, {currentUser}</span>
              )}
            </div>
            
            {/* Right side - Logout button */}
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default Index;
