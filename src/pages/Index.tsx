import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FacilitySearch from "@/components/FacilitySearch";
import PaymentSearch from "@/components/PaymentSearch";
import AddFacility from "@/components/AddFacility";
import { useAuth } from "@/hooks/useAuth";
import { Search, CreditCard, Plus } from "lucide-react";

const Index = () => {
  const { currentUser, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'main' | 'permit' | 'payment' | 'add'>('main');

  const renderMainMenu = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Facility Management System</h1>
        <p className="text-xl text-muted-foreground">Choose an option to continue</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('permit')}>
          <CardHeader className="text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-xl">Check Permit Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              Search and view facility permit information and records
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('payment')}>
          <CardHeader className="text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-xl">Check Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              Search and view payment records and transaction history
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8">
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
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrentView('main')}>
                ← Back to Menu
              </Button>
              <h2 className="text-2xl font-bold">Permit Status</h2>
              <div></div>
            </div>
            <FacilitySearch />
          </div>
        );
      case 'payment':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrentView('main')}>
                ← Back to Menu
              </Button>
              <h2 className="text-2xl font-bold">Payment Status</h2>
              <div></div>
            </div>
            <PaymentSearch />
          </div>
        );
      case 'add':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrentView('main')}>
                ← Back to Menu
              </Button>
              <h2 className="text-2xl font-bold">Add New Facility</h2>
              <div></div>
            </div>
            <AddFacility />
          </div>
        );
      default:
        return renderMainMenu();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {currentView === 'main' && (
              <span className="text-sm text-muted-foreground">Welcome, {currentUser}</span>
            )}
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
        
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default Index;
