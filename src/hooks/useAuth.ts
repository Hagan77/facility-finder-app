import { useState, useEffect } from "react";

// Predefined user credentials
const validCredentials = [
  { username: "admin", password: "admin123" },
  { username: "user", password: "password" },
  { username: "Eugene", password: "Dastan" },
  { username: "Hagan", password: "Dunstan" },
  { username: "Zenora1", password: "Max1" }
];

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedAuth = localStorage.getItem("isAuthenticated");
    const savedUser = localStorage.getItem("currentUser");
    
    if (savedAuth === "true" && savedUser) {
      setIsAuthenticated(true);
      setCurrentUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    const validUser = validCredentials.find(
      (cred) => cred.username === username && cred.password === password
    );

    if (validUser) {
      setIsAuthenticated(true);
      setCurrentUser(username);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("currentUser", username);
      return true;
    }
    return false;
  };

  const logout = () => {
    console.log("Logout function called");
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    console.log("Logout completed - auth state cleared");
  };

  return {
    isAuthenticated,
    currentUser,
    isLoading,
    login,
    logout
  };
};