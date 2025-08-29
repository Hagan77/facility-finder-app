import { useState, useEffect } from "react";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on mount
    const authStatus = localStorage.getItem("isAuthenticated");
    const user = localStorage.getItem("currentUser");
    
    if (authStatus === "true" && user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
    
    setIsLoading(false);
  }, []);

  const login = () => {
    const user = localStorage.getItem("currentUser");
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return {
    isAuthenticated,
    currentUser,
    isLoading,
    login,
    logout
  };
};