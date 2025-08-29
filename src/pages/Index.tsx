import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import FacilitySearch from "@/components/FacilitySearch";
import AddFacility from "@/components/AddFacility";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold mb-4">Facility Management System</h1>
            <p className="text-xl text-muted-foreground">Search and manage facility records</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {currentUser}</span>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="search">Search Facilities</TabsTrigger>
            <TabsTrigger value="add">Add Facility</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="w-full">
            <FacilitySearch />
          </TabsContent>
          
          <TabsContent value="add" className="w-full">
            <AddFacility />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
