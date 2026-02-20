import React, { createContext, useContext, useState, ReactNode } from "react";

// User credentials with roles and sectors
const validCredentials = [
  // Original users
  { username: "admin", password: "admin123", role: "admin", sector: null },
  { username: "user", password: "password", role: "user", sector: null },
  { username: "Eugene", password: "Dastan", role: "sector_head", sector: "hospitality" },
  { username: "Hospitality Head", password: "Hospitality123", role: "sector_head", sector: "hospitality" },
  { username: "Hagan", password: "Dunstan", role: "user", sector: null },
  { username: "Zenora1", password: "Max1", role: "user", sector: null },
  { username: "Head1", password: "Director1", role: "admin", sector: null },
  { username: "Head2", password: "Director2", role: "admin", sector: null },
  
  // Sector Heads
  { username: "Health Head", password: "Health123", role: "sector_head", sector: "health" },
  { username: "Mining Head", password: "Mining123", role: "sector_head", sector: "mining" },
  { username: "Infrastructure Head", password: "Infrastructure123", role: "sector_head", sector: "infrastructure" },
  { username: "Education Head", password: "Education123", role: "sector_head", sector: "education" },
  { username: "Agriculture Head", password: "Agriculture123", role: "sector_head", sector: "agriculture" },
  { username: "Manufacturing Head", password: "Manufacturing123", role: "sector_head", sector: "manufacturing" },
  { username: "Tourism Head", password: "Tourism123", role: "sector_head", sector: "tourism" },
  { username: "Finance Head", password: "Finance123", role: "sector_head", sector: "finance" },
  { username: "Transportation Head", password: "Transportation123", role: "sector_head", sector: "transportation" },
  { username: "Energy Head", password: "Energy123", role: "sector_head", sector: "energy" },
  { username: "Chemicals Head", password: "Chemicals123", role: "sector_head", sector: "chemicals" },
  { username: "Telecommunication Head", password: "Telecommunication123", role: "sector_head", sector: "telecommunication" },
  { username: "Quarry Head", password: "Quarry123", role: "sector_head", sector: "quarry" },

  // === AREA OFFICE CREDENTIALS ===

  // Amansie Area Office
  { username: "Amansie Director", password: "Amansie@Dir1", role: "admin", sector: null },
  { username: "Amansie Hospitality", password: "Amansie@Hosp1", role: "sector_head", sector: "hospitality" },
  { username: "Amansie Health", password: "Amansie@Health1", role: "sector_head", sector: "health" },
  { username: "Amansie Mining", password: "Amansie@Mining1", role: "sector_head", sector: "mining" },
  { username: "Amansie User", password: "Amansie@User1", role: "user", sector: null },

  // Offinso Area Office
  { username: "Offinso Director", password: "Offinso@Dir1", role: "admin", sector: null },
  { username: "Offinso Hospitality", password: "Offinso@Hosp1", role: "sector_head", sector: "hospitality" },
  { username: "Offinso Health", password: "Offinso@Health1", role: "sector_head", sector: "health" },
  { username: "Offinso Mining", password: "Offinso@Mining1", role: "sector_head", sector: "mining" },
  { username: "Offinso User", password: "Offinso@User1", role: "user", sector: null },

  // Mampong Area Office
  { username: "Mampong Director", password: "Mampong@Dir1", role: "admin", sector: null },
  { username: "Mampong Hospitality", password: "Mampong@Hosp1", role: "sector_head", sector: "hospitality" },
  { username: "Mampong Health", password: "Mampong@Health1", role: "sector_head", sector: "health" },
  { username: "Mampong Mining", password: "Mampong@Mining1", role: "sector_head", sector: "mining" },
  { username: "Mampong User", password: "Mampong@User1", role: "user", sector: null },

  // Nkawie Area Office
  { username: "Nkawie Director", password: "Nkawie@Dir1", role: "admin", sector: null },
  { username: "Nkawie Hospitality", password: "Nkawie@Hosp1", role: "sector_head", sector: "hospitality" },
  { username: "Nkawie Health", password: "Nkawie@Health1", role: "sector_head", sector: "health" },
  { username: "Nkawie Mining", password: "Nkawie@Mining1", role: "sector_head", sector: "mining" },
  { username: "Nkawie User", password: "Nkawie@User1", role: "user", sector: null },

  // Ejisu Area Office
  { username: "Ejisu Director", password: "Ejisu@Dir1", role: "admin", sector: null },
  { username: "Ejisu Hospitality", password: "Ejisu@Hosp1", role: "sector_head", sector: "hospitality" },
  { username: "Ejisu Health", password: "Ejisu@Health1", role: "sector_head", sector: "health" },
  { username: "Ejisu Mining", password: "Ejisu@Mining1", role: "sector_head", sector: "mining" },
  { username: "Ejisu User", password: "Ejisu@User1", role: "user", sector: null },

  // Tepa Area Office
  { username: "Tepa Director", password: "Tepa@Dir1", role: "admin", sector: null },
  { username: "Tepa Hospitality", password: "Tepa@Hosp1", role: "sector_head", sector: "hospitality" },
  { username: "Tepa Health", password: "Tepa@Health1", role: "sector_head", sector: "health" },
  { username: "Tepa Mining", password: "Tepa@Mining1", role: "sector_head", sector: "mining" },
  { username: "Tepa User", password: "Tepa@User1", role: "user", sector: null },
];

interface UserProfile {
  username: string;
  role: string;
  sector: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: string | null;
  userProfile: UserProfile | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state immediately from localStorage
  const savedAuth = localStorage.getItem("isAuthenticated");
  const savedUser = localStorage.getItem("currentUser");
  const savedProfile = localStorage.getItem("userProfile");
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(savedAuth === "true");
  const [currentUser, setCurrentUser] = useState<string | null>(savedUser);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(
    savedProfile ? JSON.parse(savedProfile) : null
  );

  const login = (username: string, password: string): boolean => {
    const validUser = validCredentials.find(
      (cred) => cred.username === username && cred.password === password
    );

    if (validUser) {
      const profile: UserProfile = {
        username: validUser.username,
        role: validUser.role,
        sector: validUser.sector,
      };
      
      setIsAuthenticated(true);
      setCurrentUser(username);
      setUserProfile(profile);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("currentUser", username);
      localStorage.setItem("userProfile", JSON.stringify(profile));
      return true;
    }
    return false;
  };

  const logout = () => {
    console.log("Logout function called");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userProfile");
    console.log("Logout completed - auth state cleared");
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      currentUser,
      userProfile,
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