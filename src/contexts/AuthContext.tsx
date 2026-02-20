import React, { createContext, useContext, useState, ReactNode } from "react";

// Each credential is tied to a specific office by name
const validCredentials = [
  // === KUMASI MAIN OFFICE ===
  { username: "admin", password: "admin123", role: "admin", sector: null, office: "Kumasi Main Office" },
  { username: "user", password: "password", role: "user", sector: null, office: "Kumasi Main Office" },
  { username: "Eugene", password: "Dastan", role: "sector_head", sector: "hospitality", office: "Kumasi Main Office" },
  { username: "Hospitality Head", password: "Hospitality123", role: "sector_head", sector: "hospitality", office: "Kumasi Main Office" },
  { username: "Hagan", password: "Dunstan", role: "user", sector: null, office: "Kumasi Main Office" },
  { username: "Zenora1", password: "Max1", role: "user", sector: null, office: "Kumasi Main Office" },
  { username: "Head1", password: "Director1", role: "admin", sector: null, office: "Kumasi Main Office" },
  { username: "Head2", password: "Director2", role: "admin", sector: null, office: "Kumasi Main Office" },
  { username: "Health Head", password: "Health123", role: "sector_head", sector: "health", office: "Kumasi Main Office" },
  { username: "Mining Head", password: "Mining123", role: "sector_head", sector: "mining", office: "Kumasi Main Office" },
  { username: "Infrastructure Head", password: "Infrastructure123", role: "sector_head", sector: "infrastructure", office: "Kumasi Main Office" },
  { username: "Education Head", password: "Education123", role: "sector_head", sector: "education", office: "Kumasi Main Office" },
  { username: "Agriculture Head", password: "Agriculture123", role: "sector_head", sector: "agriculture", office: "Kumasi Main Office" },
  { username: "Manufacturing Head", password: "Manufacturing123", role: "sector_head", sector: "manufacturing", office: "Kumasi Main Office" },
  { username: "Tourism Head", password: "Tourism123", role: "sector_head", sector: "tourism", office: "Kumasi Main Office" },
  { username: "Finance Head", password: "Finance123", role: "sector_head", sector: "finance", office: "Kumasi Main Office" },
  { username: "Transportation Head", password: "Transportation123", role: "sector_head", sector: "transportation", office: "Kumasi Main Office" },
  { username: "Energy Head", password: "Energy123", role: "sector_head", sector: "energy", office: "Kumasi Main Office" },
  { username: "Chemicals Head", password: "Chemicals123", role: "sector_head", sector: "chemicals", office: "Kumasi Main Office" },
  { username: "Telecommunication Head", password: "Telecommunication123", role: "sector_head", sector: "telecommunication", office: "Kumasi Main Office" },
  { username: "Quarry Head", password: "Quarry123", role: "sector_head", sector: "quarry", office: "Kumasi Main Office" },

  // === AMANSIE AREA OFFICE ===
  { username: "Amansie Director", password: "Amansie@Dir1", role: "admin", sector: null, office: "Amansie Area Office" },
  { username: "Amansie Hospitality", password: "Amansie@Hosp1", role: "sector_head", sector: "hospitality", office: "Amansie Area Office" },
  { username: "Amansie Health", password: "Amansie@Health1", role: "sector_head", sector: "health", office: "Amansie Area Office" },
  { username: "Amansie Mining", password: "Amansie@Mining1", role: "sector_head", sector: "mining", office: "Amansie Area Office" },
  { username: "Amansie User", password: "Amansie@User1", role: "user", sector: null, office: "Amansie Area Office" },

  // === OFFINSO AREA OFFICE ===
  { username: "Offinso Director", password: "Offinso@Dir1", role: "admin", sector: null, office: "Offinso Area Office" },
  { username: "Offinso Hospitality", password: "Offinso@Hosp1", role: "sector_head", sector: "hospitality", office: "Offinso Area Office" },
  { username: "Offinso Health", password: "Offinso@Health1", role: "sector_head", sector: "health", office: "Offinso Area Office" },
  { username: "Offinso Mining", password: "Offinso@Mining1", role: "sector_head", sector: "mining", office: "Offinso Area Office" },
  { username: "Offinso User", password: "Offinso@User1", role: "user", sector: null, office: "Offinso Area Office" },

  // === MAMPONG AREA OFFICE ===
  { username: "Mampong Director", password: "Mampong@Dir1", role: "admin", sector: null, office: "Mampong Area Office" },
  { username: "Mampong Hospitality", password: "Mampong@Hosp1", role: "sector_head", sector: "hospitality", office: "Mampong Area Office" },
  { username: "Mampong Health", password: "Mampong@Health1", role: "sector_head", sector: "health", office: "Mampong Area Office" },
  { username: "Mampong Mining", password: "Mampong@Mining1", role: "sector_head", sector: "mining", office: "Mampong Area Office" },
  { username: "Mampong User", password: "Mampong@User1", role: "user", sector: null, office: "Mampong Area Office" },

  // === NKAWIE AREA OFFICE ===
  { username: "Nkawie Director", password: "Nkawie@Dir1", role: "admin", sector: null, office: "Nkawie Area Office" },
  { username: "Nkawie Hospitality", password: "Nkawie@Hosp1", role: "sector_head", sector: "hospitality", office: "Nkawie Area Office" },
  { username: "Nkawie Health", password: "Nkawie@Health1", role: "sector_head", sector: "health", office: "Nkawie Area Office" },
  { username: "Nkawie Mining", password: "Nkawie@Mining1", role: "sector_head", sector: "mining", office: "Nkawie Area Office" },
  { username: "Nkawie User", password: "Nkawie@User1", role: "user", sector: null, office: "Nkawie Area Office" },

  // === EJISU AREA OFFICE ===
  { username: "Ejisu Director", password: "Ejisu@Dir1", role: "admin", sector: null, office: "Ejisu Area Office" },
  { username: "Ejisu Hospitality", password: "Ejisu@Hosp1", role: "sector_head", sector: "hospitality", office: "Ejisu Area Office" },
  { username: "Ejisu Health", password: "Ejisu@Health1", role: "sector_head", sector: "health", office: "Ejisu Area Office" },
  { username: "Ejisu Mining", password: "Ejisu@Mining1", role: "sector_head", sector: "mining", office: "Ejisu Area Office" },
  { username: "Ejisu User", password: "Ejisu@User1", role: "user", sector: null, office: "Ejisu Area Office" },

  // === TEPA AREA OFFICE ===
  { username: "Tepa Director", password: "Tepa@Dir1", role: "admin", sector: null, office: "Tepa Area Office" },
  { username: "Tepa Hospitality", password: "Tepa@Hosp1", role: "sector_head", sector: "hospitality", office: "Tepa Area Office" },
  { username: "Tepa Health", password: "Tepa@Health1", role: "sector_head", sector: "health", office: "Tepa Area Office" },
  { username: "Tepa Mining", password: "Tepa@Mining1", role: "sector_head", sector: "mining", office: "Tepa Area Office" },
  { username: "Tepa User", password: "Tepa@User1", role: "user", sector: null, office: "Tepa Area Office" },
];

interface UserProfile {
  username: string;
  role: string;
  sector: string | null;
  assignedOffice: string; // The office this user belongs to
}

export type LoginResult = 
  | { success: true }
  | { success: false; reason: "invalid_credentials" | "wrong_office" };

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: string | null;
  userProfile: UserProfile | null;
  login: (username: string, password: string, selectedOfficeName: string) => LoginResult;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const savedAuth = localStorage.getItem("isAuthenticated");
  const savedUser = localStorage.getItem("currentUser");
  const savedProfile = localStorage.getItem("userProfile");
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(savedAuth === "true");
  const [currentUser, setCurrentUser] = useState<string | null>(savedUser);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(
    savedProfile ? JSON.parse(savedProfile) : null
  );

  const login = (username: string, password: string, selectedOfficeName: string): LoginResult => {
    // Step 1: Validate credentials
    const validUser = validCredentials.find(
      (cred) => cred.username === username && cred.password === password
    );

    if (!validUser) {
      console.warn(`[AUTH] Failed login attempt for username: ${username}`);
      return { success: false, reason: "invalid_credentials" };
    }

    // Step 2: Validate office assignment — credentials must match the selected office
    if (validUser.office !== selectedOfficeName) {
      console.warn(
        `[AUTH] Cross-office login blocked: User "${username}" (assigned: ${validUser.office}) attempted login to "${selectedOfficeName}"`
      );
      return { success: false, reason: "wrong_office" };
    }

    // Step 3: All checks passed — grant access
    const profile: UserProfile = {
      username: validUser.username,
      role: validUser.role,
      sector: validUser.sector,
      assignedOffice: validUser.office,
    };
    
    setIsAuthenticated(true);
    setCurrentUser(username);
    setUserProfile(profile);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("currentUser", username);
    localStorage.setItem("userProfile", JSON.stringify(profile));
    
    console.log(`[AUTH] Login granted: "${username}" → ${validUser.office} (${validUser.role})`);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userProfile");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, userProfile, login, logout }}>
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
