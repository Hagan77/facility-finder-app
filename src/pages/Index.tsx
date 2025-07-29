import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FacilitySearch from "@/components/FacilitySearch";
import AddFacility from "@/components/AddFacility";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Facility Management System</h1>
          <p className="text-xl text-muted-foreground">Search and manage facility records</p>
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
