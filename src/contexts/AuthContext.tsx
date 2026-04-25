import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithPhone: (phoneNumber: string, verifier: RecaptchaVerifier) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signInWithPhone: async () => {},
  verifyCode: async () => {},
  logout: async () => {},
  updateProfile: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const p = docSnap.data() as UserProfile;
          if (!p.roles) {
            p.roles = [p.role || 'customer'];
            await updateDoc(docRef, { roles: p.roles });
          }
          setProfile(p);
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || '',
            role: u.email === 'facegoogl@gmail.com' ? 'admin' : 'customer',
            roles: u.email === 'facegoogl@gmail.com' ? ['admin', 'customer'] : ['customer'],
            createdAt: serverTimestamp()
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithPhone = async (phoneNumber: string, verifier: RecaptchaVerifier) => {
    const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    setConfirmationResult(result);
  };

  const verifyCode = async (code: string) => {
    if (!confirmationResult) throw new Error('No confirmation result');
    await confirmationResult.confirm(code);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    await updateDoc(docRef, data);
    setProfile(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signIn, 
      signInWithPhone, 
      verifyCode, 
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
