import React, { createContext, useContext, useState, ReactNode } from "react";

// Predefined user credentials
const validCredentials = [
  { username: "admin", password: "admin123" },
  { username: "user", password: "password" },
  { username: "Eugene", password: "Dastan" },
  { username: "Hagan", password: "Dunstan" },
  { username: "Zenora1", password: "Max1" },
  { username: "Head1", password: "Director1" },
  { username: "Head2", password: "Director2" }
];

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state immediately from localStorage
  const savedAuth = localStorage.getItem("isAuthenticated");
  const savedUser = localStorage.getItem("currentUser");
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(savedAuth === "true");
  const [currentUser, setCurrentUser] = useState<string | null>(savedUser);

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

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      currentUser,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};