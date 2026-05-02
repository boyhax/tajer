import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc,
  deleteDoc,
  writeBatch,
  where,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { cn } from './lib/utils';
import { Product, CartItem, Order, UserProfile, Category, LocalizedString, Store, Driver, AppNotification, AppSettings, ProductVariant, Tag, Region, DeliveryMethod, AddressDetails } from './types';
import { handleFirestoreError, OperationType } from './lib/error';
import { config } from './lib/config';
import { getEnv } from './lib/env';
import * as LucideIcons from 'lucide-react';
import { 
  ShoppingBag, 
  ShoppingCart, 
  User as UserIcon, 
  Plus, 
  Trash2, 
  MessageCircle,
  ChevronRight, 
  Package, 
  CreditCard, 
  Settings,
  Type,
  LogOut,
  X,
  CheckCircle2,
  CheckCircle,
  AlertCircle,
  BadgeDollarSign,
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  FileText,
  SlidersHorizontal,
  Globe,
  Home,
  User as ProfileIcon,
  Store as StoreIcon,
  Truck,
  LayoutDashboard,
  ClipboardList,
  MapPin,
  Car,
  Navigation,
  Bell,
  Clock,
  Heart,
  ShieldCheck,
  ShieldX,
  MessageSquare,
  Eye,
  EyeOff,
  Banknote,
  Tag as TagIcon,
  Star,
  Users,
  Send,
  Upload,
  Apple,
  Milk,
  Beef,
  Coffee,
  Candy,
  Leaf,
  Sprout,
  Sparkles,
  Cookie,
  Building2,
  Info,
  Map as MapIcon,
  ArrowUpDown,
} from 'lucide-react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  useNavigate, 
  useParams, 
  useSearchParams,
  useLocation,
  Link,
  Navigate
} from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { VirtuosoGrid } from 'react-virtuoso';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polygon, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import { Puck, Render } from "@measured/puck";
import "@measured/puck/dist/index.css";
import { config as puckConfig } from "./lib/puck";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "./components/ui/Carousel";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTitleHidden,
  DrawerTrigger,
  DrawerClose,
  VisuallyHidden
} from "./components/ui/Drawer";

// Fix Leaflet marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

import { Icon } from '@iconify/react';
import { useProductSearchParams } from './hooks/useProductSearchParams';
import { FeaturesPage } from './pages/FeaturesPage';
import { uploadImage, STORAGE_PATHS } from './lib/storage';

// --- Contexts ---
interface RegionsContextType {
  regions: Region[];
  loading: boolean;
  addRegion: (region: Omit<Region, 'id' | 'createdAt'>) => Promise<void>;
  updateRegion: (id: string, data: Partial<Region>) => Promise<void>;
  deleteRegion: (id: string) => Promise<void>;
}

const RegionsContext = createContext<RegionsContextType>({
  regions: [],
  loading: true,
  addRegion: async () => {},
  updateRegion: async () => {},
  deleteRegion: async () => {}
});

const RegionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'regions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Region));
      setRegions(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching regions:', error);
      setLoading(false);
    });
    return unsub;
  }, []);

  const addRegion = async (region: Omit<Region, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'regions'), {
      ...region,
      createdAt: serverTimestamp()
    });
  };

  const updateRegion = async (id: string, data: Partial<Region>) => {
    await updateDoc(doc(db, 'regions', id), data);
  };

  const deleteRegion = async (id: string) => {
    await deleteDoc(doc(db, 'regions', id));
  };

  return (
    <RegionsContext.Provider value={{ regions, loading, addRegion, updateRegion, deleteRegion }}>
      {children}
    </RegionsContext.Provider>
  );
};

export const useRegions = () => useContext(RegionsContext);

interface DeliveryMethodsContextType {
  deliveryMethods: DeliveryMethod[];
  loading: boolean;
  addDeliveryMethod: (method: Omit<DeliveryMethod, 'id' | 'createdAt'>) => Promise<void>;
  updateDeliveryMethod: (id: string, data: Partial<DeliveryMethod>) => Promise<void>;
  deleteDeliveryMethod: (id: string) => Promise<void>;
  setDefaultMethod: (id: string) => Promise<void>;
}

const DeliveryMethodsContext = createContext<DeliveryMethodsContextType>({
  deliveryMethods: [],
  loading: true,
  addDeliveryMethod: async () => {},
  updateDeliveryMethod: async () => {},
  deleteDeliveryMethod: async () => {},
  setDefaultMethod: async () => {}
});

const DeliveryMethodsProvider = ({ children }: { children: React.ReactNode }) => {
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'deliveryMethods'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryMethod));
      setDeliveryMethods(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching delivery methods:', error);
      setLoading(false);
    });
    return unsub;
  }, []);

  const addDeliveryMethod = async (method: Omit<DeliveryMethod, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'deliveryMethods'), {
      ...method,
      createdAt: serverTimestamp()
    });
  };

  const updateDeliveryMethod = async (id: string, data: Partial<DeliveryMethod>) => {
    await updateDoc(doc(db, 'deliveryMethods', id), data);
  };

  const deleteDeliveryMethod = async (id: string) => {
    await deleteDoc(doc(db, 'deliveryMethods', id));
  };

  const setDefaultMethod = async (id: string) => {
    const batch = writeBatch(db);
    const snapshot = await getDocs(collection(db, 'deliveryMethods'));
    snapshot.docs.forEach(d => {
      batch.update(d.ref, { isDefault: d.id === id });
    });
    await batch.commit();
  };

  return (
    <DeliveryMethodsContext.Provider value={{ 
      deliveryMethods, 
      loading, 
      addDeliveryMethod, 
      updateDeliveryMethod, 
      deleteDeliveryMethod,
      setDefaultMethod
    }}>
      {children}
    </DeliveryMethodsContext.Provider>
  );
};

export const useDeliveryMethods = () => useContext(DeliveryMethodsContext);

export const LanguageContext = createContext<{
  lang: 'en' | 'ar';
  setLang: (l: 'en' | 'ar') => void;
  t: (ls: LocalizedString | string | any) => string;
}>({ lang: 'en', setLang: () => {}, t: (ls) => typeof ls === 'string' ? ls : (ls?.en || '') });

export const DataContext = createContext<{
  products: Product[];
  categories: Category[];
  stores: Store[];
  tags: Tag[];
  brands: string[];
  loading: boolean;
  onSelectProduct?: (p: Product) => void;
}>({
  products: [],
  categories: [],
  stores: [],
  tags: [],
  brands: [],
  loading: true,
  onSelectProduct: () => {}
});

export const SettingsContext = createContext<{
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
}>({
  appSettings: { 
    paymentMethods: { online: true, cod: true }, 
    restrictDeliveryToRegions: false,
    supportedAddressModes: ['normal', 'map'],
    appName: config.name,
    appDescription: config.description,
    currency: {
      code: 'AED',
      symbol: { en: 'AED', ar: 'د.إ' }
    }
  },
  updateAppSettings: async () => {}
});

export const CartContext = createContext<{
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  total: number;
}>({ cart: [], addToCart: () => {}, removeFromCart: () => {}, clearCart: () => {}, total: 0 });

export const AuthContext = createContext<{
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithPhone: (phoneNumber: string, verifier?: RecaptchaVerifier) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  logout: () => Promise<void>;
}>({ 
  user: null, 
  profile: null, 
  loading: true, 
  signIn: async () => {}, 
  signInWithPhone: async (phoneNumber: string, verifier?: RecaptchaVerifier) => {}, 
  verifyCode: async () => {}, 
  logout: async () => {},
  updateProfile: async () => {}
});

export const NotificationContext = createContext<{
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  requestPermission: () => Promise<void>;
}>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  requestPermission: async () => {}
});

export const WishlistContext = createContext<{
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}>({ wishlist: [], toggleWishlist: async () => {}, isInWishlist: () => false });

const LocationContext = createContext<{
  location: { lat: number; lng: number } | null;
  setLocation: (loc: { lat: number; lng: number }) => void;
  address: string;
  setAddress: (addr: string) => void;
}>({ location: null, setLocation: () => {}, address: '', setAddress: () => {} });

const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [location, setLocationState] = useState<{ lat: number; lng: number } | null>(() => {
    const saved = localStorage.getItem('kuzama_location');
    return saved ? JSON.parse(saved) : null;
  });
  const [address, setAddressState] = useState(() => localStorage.getItem('kuzama_address') || '');

  const setLocation = (loc: { lat: number; lng: number }) => {
    setLocationState(loc);
    localStorage.setItem('kuzama_location', JSON.stringify(loc));
  };

  const setAddress = (addr: string) => {
    setAddressState(addr);
    localStorage.setItem('kuzama_address', addr);
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, address, setAddress }}>
      {children}
    </LocationContext.Provider>
  );
};

const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useContext(AuthContext);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setWishlist([]);
      return;
    }

    const q = query(collection(db, 'wishlist'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setWishlist(snap.docs.map(doc => doc.data().productId));
    });
    return unsub;
  }, [user]);

  const toggleWishlist = async (productId: string) => {
    if (!user) return;

    const q = query(
      collection(db, 'wishlist'), 
      where('userId', '==', user.uid), 
      where('productId', '==', productId)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      await addDoc(collection(db, 'wishlist'), {
        userId: user.uid,
        productId,
        createdAt: serverTimestamp()
      });
    } else {
      await deleteDoc(doc(db, 'wishlist', snap.docs[0].id));
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

const NotificationCenter = ({ onClose }: { onClose: () => void }) => {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useContext(NotificationContext);
  const { t, lang } = useContext(LanguageContext);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden relative z-10 shadow-2xl flex flex-col max-h-[80vh]"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold">{t({ en: 'Notifications', ar: 'التنبيهات' })}</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400 font-medium mt-1">
                {unreadCount} {t({ en: 'new notifications', ar: 'تنبيهات جديدة' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1 bg-emerald-50 rounded-full transition-colors"
              >
                {t({ en: 'Mark all as read', ar: 'تحديد الكل كمقروء' })}
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-20 text-center">
              <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">{t({ en: 'No notifications yet', ar: 'لا توجد تنبيهات بعد' })}</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  notif.read ? 'bg-white border-gray-50 opacity-60' : 'bg-emerald-50/30 border-emerald-100 shadow-sm'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    notif.type === 'order_update' ? 'bg-blue-100 text-blue-600' :
                    notif.type === 'promotion' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {notif.type === 'order_update' ? <Package className="w-5 h-5" /> :
                     notif.type === 'promotion' ? <ShoppingBag className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm mb-1">{t(notif.title)}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{t(notif.body)}</p>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                      {new Date(notif.createdAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

const WelcomeModal = ({ onClose }: { onClose: () => void }) => {
  const { t, lang } = useContext(LanguageContext);
  const { appSettings } = useContext(SettingsContext);
  const { location, setLocation } = useContext(LocationContext);
  const [step, setStep] = useState(1);
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | null>(location || config.map.defaultCenter);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setTempLocation(e.latlng);
      },
    });
    return tempLocation ? <Marker position={tempLocation} /> : null;
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setTempLocation(newLoc);
        mapInstance?.flyTo([newLoc.lat, newLoc.lng], 15);
      });
    }
  };

  const handleFinish = () => {
    if (tempLocation) {
      setLocation(tempLocation);
    }
    localStorage.setItem('kuzama_welcome_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-[3rem] w-full max-w-xl h-[85vh] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.8)] flex flex-col border border-white/20"
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden"
            >
              {/* Animated Background Gradients */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    x: [0, 50, 0],
                    y: [0, -50, 0]
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-1/2 -left-1/2 w-full h-full bg-emerald-500/10 rounded-full blur-[120px]" 
                />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, -120, 0],
                    x: [0, -80, 0],
                    y: [0, 80, 0]
                  }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-emerald-600/10 rounded-full blur-[120px]" 
                />
              </div>

              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 12 }}
                transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
                className="w-40 h-40 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-[3rem] flex items-center justify-center mb-12 shadow-[0_20px_60px_rgba(16,185,129,0.4)] relative z-10"
              >
                <ShoppingBag className="w-20 h-20" />
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-4 -right-4 w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-xl"
                >
                  <Heart className="w-6 h-6 text-emerald-400 fill-emerald-400" />
                </motion.div>
              </motion.div>

              <div className="relative z-10 space-y-6">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-6xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-black to-gray-600"
                >
                  {t(appSettings.appName)}
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-400 text-xl max-w-xs mx-auto font-medium leading-relaxed"
                >
                  {t(appSettings.appDescription)}
                </motion.p>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full mt-16"
              >
                <button 
                  onClick={() => setStep(2)}
                  className="group relative w-full bg-black text-white py-8 rounded-[2.5rem] font-black text-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-4">
                    {t({ en: 'GET STARTED', ar: 'ابدأ الآن' })}
                    <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col relative"
            >
              {/* Full Modal Map */}
              <div className="absolute inset-0 z-0">
                <MapContainer 
                  center={[tempLocation?.lat || config.map.defaultCenter.lat, tempLocation?.lng || config.map.defaultCenter.lng]} 
                  zoom={config.map.defaultZoom} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  ref={setMapInstance}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapEvents />
                </MapContainer>
              </div>

              {/* Glass Overlays */}
              <div className="relative z-10 flex flex-col h-full pointer-events-none">
                {/* Top Bar */}
                <div className="p-8 pt-12 bg-gradient-to-b from-white via-white/80 to-transparent">
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-4xl font-black tracking-tight mb-1">
                        {t({ en: 'WHERE TO?', ar: 'إلى أين؟' })}
                      </h3>
                      <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em]">
                        {t({ en: 'Pin your delivery address', ar: 'حدد عنوان التوصيل الخاص بك' })}
                      </p>
                    </div>
                    <button 
                      onClick={handleLocateMe}
                      className="pointer-events-auto w-14 h-14 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-black hover:bg-emerald-500 hover:text-white transition-all active:scale-90 border border-gray-100"
                    >
                      <Navigation className="w-6 h-6" />
                    </button>
                  </motion.div>
                </div>

                {/* Bottom Controls Overlay */}
                <div className="mt-auto p-8 pb-12 space-y-6 pointer-events-auto">
                  {/* Floating Location Info */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/90 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white flex items-center gap-5"
                  >
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                      <MapPin className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        {t({ en: 'DELIVERY DESTINATION', ar: 'وجهة التوصيل' })}
                      </p>
                      <p className="text-lg font-bold truncate text-black">
                        {tempLocation ? `${tempLocation.lat.toFixed(6)}, ${tempLocation.lng.toFixed(6)}` : t({ en: 'Tap map to select...', ar: 'اضغط على الخريطة للاختيار...' })}
                      </p>
                    </div>
                  </motion.div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep(1)}
                      className="w-24 h-24 bg-white/90 backdrop-blur-2xl text-black rounded-[2.5rem] flex items-center justify-center hover:bg-white transition-all shadow-xl border border-white active:scale-90"
                    >
                      <ArrowLeft className="w-10 h-10" />
                    </button>
                    <button 
                      onClick={handleFinish}
                      disabled={!tempLocation}
                      className="flex-1 bg-black text-white py-8 rounded-[2.5rem] font-black text-2xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98]"
                    >
                      {t({ en: 'CONFIRM', ar: 'تأكيد' })}
                      <CheckCircle2 className="w-8 h-8" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// --- Utilities ---

const isPointInPolygon = (point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]) => {
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
};

const isPointInRectangle = (point: { lat: number; lng: number }, bounds: { lat: number; lng: number }[]) => {
  if (bounds.length < 2) return false;
  const latMin = Math.min(bounds[0].lat, bounds[1].lat);
  const latMax = Math.max(bounds[0].lat, bounds[1].lat);
  const lngMin = Math.min(bounds[0].lng, bounds[1].lng);
  const lngMax = Math.max(bounds[0].lng, bounds[1].lng);
  return point.lat >= latMin && point.lat <= latMax && point.lng >= lngMin && point.lng <= lngMax;
};

const getRegionForPoint = (point: { lat: number; lng: number }, regions: Region[]) => {
  return regions.find(region => {
    if (region.type === 'geozone') {
      return isPointInPolygon(point, region.coordinates);
    } else if (region.type === 'rectangle') {
      return isPointInRectangle(point, region.coordinates);
    }
    return false;
  });
};

// --- Hooks ---

export const useDeliveryCost = () => {
  const { regions } = useRegions();
  const { deliveryMethods } = useDeliveryMethods();

  const calculateCost = (
    sourceCoords: { lat: number; lng: number },
    destCoords: { lat: number; lng: number },
    methodId: string
  ) => {
    const sourceRegion = getRegionForPoint(sourceCoords, regions);
    const destRegion = getRegionForPoint(destCoords, regions);
    const method = deliveryMethods.find(m => m.id === methodId);

    if (!sourceRegion || !destRegion || !method) return null;

    const cost = method.priceMatrix[sourceRegion.id]?.[destRegion.id];
    return cost !== undefined ? cost : null;
  };

  return { calculateCost };
};

// --- Components ---

const Navbar = ({ onNavigate, currentPage }: { onNavigate: (page: string) => void, currentPage: string }) => {
  const { user, profile, signIn, logout } = useContext(AuthContext);
  const { appSettings } = useContext(SettingsContext);
  const { cart } = useContext(CartContext);
  const { lang, setLang, t } = useContext(LanguageContext);
  const { unreadCount } = useContext(NotificationContext);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <nav className="hidden md:flex sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 items-center justify-between" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={() => onNavigate('home')}
      >
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl italic"
          style={{ backgroundColor: config.theme.primary }}
        >
          {t(appSettings.appName).charAt(0)}
        </div>
        <span className="text-xl font-bold tracking-tight">{t(appSettings.appName)}</span>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <button 
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1 text-sm font-bold hover:text-black transition-colors"
        >
          <Globe className="w-4 h-4" />
          {lang === 'en' ? 'العربية' : 'English'}
        </button>

        <button 
          onClick={() => onNavigate('home')}
          className={`text-sm font-medium hover:text-black transition-colors ${currentPage === 'home' ? 'text-black font-bold' : 'text-gray-500'}`}
        >
          {t({ en: 'Shop', ar: 'المتجر' })}
        </button>

        {user && (
          <button 
            onClick={() => onNavigate('wishlist')}
            className={`text-sm font-medium hover:text-black transition-colors ${currentPage === 'wishlist' ? 'text-black font-bold' : 'text-gray-500'}`}
          >
            {t({ en: 'Wishlist', ar: 'الأمنيات' })}
          </button>
        )}

        {user && (
          <button 
            onClick={() => onNavigate('orders')}
            className={`text-sm font-medium hover:text-black transition-colors ${currentPage === 'orders' ? 'text-black font-bold' : 'text-gray-500'}`}
          >
            {t({ en: 'Orders', ar: 'الطلبات' })}
          </button>
        )}

        <button
          onClick={() => onNavigate('features')}
          className={`text-sm font-medium hover:text-black transition-colors ${currentPage === 'features' ? 'text-black font-bold' : 'text-gray-500'}`}
        >
          {t({ en: 'For Merchants', ar: 'للتجار' })}
        </button>

        {profile?.roles?.includes('admin') && (
          <button 
            onClick={() => onNavigate('admin')}
            className={`text-sm font-medium hover:text-black transition-colors ${currentPage === 'admin' ? 'text-black font-bold' : 'text-gray-500'}`}
          >
            {t({ en: 'Admin', ar: 'المشرف' })}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>
        )}

        <button 
          onClick={() => onNavigate('cart')}
          className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cart.length}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <NotificationCenter onClose={() => setShowNotifications(false)} />
          )}
        </AnimatePresence>

        {user ? (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('profile')}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors overflow-hidden"
            >
              {user.photoURL ? (
                <img src={user.photoURL || undefined} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </button>
            <button 
              onClick={logout}
              className="hidden md:flex p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={signIn}
            className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition-all"
          >
            {t({ en: 'Sign In', ar: 'تسجيل الدخول' })}
          </button>
        )}
      </div>
    </nav>
  );
};

const BottomNav = ({ onNavigate, currentPage }: { onNavigate: (page: string) => void, currentPage: string }) => {
  const { user, profile } = useContext(AuthContext);
  const { t, lang } = useContext(LanguageContext);
  const { cart } = useContext(CartContext);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between z-50" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <button 
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center gap-0.5 ${currentPage === 'home' ? 'text-black' : 'text-gray-400'}`}
      >
        <Home className="w-[18px] h-[18px]" />
        <span className="text-[7px] font-bold uppercase">{t({ en: 'Home', ar: 'الرئيسية' })}</span>
      </button>

      <button 
        onClick={() => onNavigate('orders')}
        className={`flex flex-col items-center gap-0.5 ${currentPage === 'orders' ? 'text-black' : 'text-gray-400'}`}
      >
        <ClipboardList className="w-[18px] h-[18px]" />
        <span className="text-[7px] font-bold uppercase">{t({ en: 'Orders', ar: 'الطلبات' })}</span>
      </button>

      <button 
        onClick={() => onNavigate('shop')}
        className={`flex flex-col items-center gap-0.5 ${currentPage === 'shop' ? 'text-black' : 'text-gray-400'}`}
      >
        <ShoppingBag className="w-[18px] h-[18px]" />
        <span className="text-[7px] font-bold uppercase">{t({ en: 'Shop', ar: 'المتجر' })}</span>
      </button>

      <button 
        onClick={() => onNavigate('cart')}
        className={`relative flex flex-col items-center gap-0.5 ${currentPage === 'cart' ? 'text-black' : 'text-gray-400'}`}
      >
        <ShoppingCart className="w-[18px] h-[18px]" />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-white text-[7px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
            {cart.length}
          </span>
        )}
        <span className="text-[7px] font-bold uppercase">{t({ en: 'Cart', ar: 'السلة' })}</span>
      </button>

      <button 
        onClick={() => onNavigate('profile')}
        className={`flex flex-col items-center gap-0.5 ${currentPage === 'profile' ? 'text-black' : 'text-gray-400'}`}
      >
        <ProfileIcon className="w-[18px] h-[18px]" />
        <span className="text-[7px] font-bold uppercase">{t({ en: 'Profile', ar: 'الملف' })}</span>
      </button>
    </div>
  );
};

export type ProductCardVariant = 'default' | 'local-delivery' | 'minimal' | 'modern' | 'cover' | 'glass';

const GridContainer = React.forwardRef(({ children, ...props }: any, ref: any) => (
  <div
    {...props}
    ref={ref}
    className={cn(
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-x-8 md:gap-y-12",
      props.className
    )}
  >
    {children}
  </div>
));

export interface ExploreProductsProps {
  title?: string;
  description?: string | LocalizedString;
  image?: string;
  icon?: string;
  seeMoreLabel?: string | LocalizedString;
  seeMorePath?: string;
  layout?: 'grid' | 'carousel' | 'masonry' | 'list';
  columns?: number;
  gapSize?: 'none' | 'small' | 'medium' | 'large';
  cardVariant?: ProductCardVariant;
  categoryIds?: { id: string }[];
  defaultTagId?: string;
  defaultSearch?: string;
  useUrlParams?: boolean;
  enableVirtualScroll?: boolean;
  limit?: number;
  showFilters?: boolean;
  filterStyle?: 'drawer' | 'bar' | 'sidebar';
  enableSearch?: boolean;
  enableSort?: boolean;
  restrictToFiltered?: boolean;
  onSelectProduct?: (p: Product) => void;
}

export const ExploreProducts = ({ 
  title, description, image, icon, seeMoreLabel, seeMorePath, 
  layout = 'grid', columns = 4, gapSize = 'medium',
  cardVariant = 'default', categoryIds = [], defaultTagId, defaultSearch, 
  useUrlParams = true, enableVirtualScroll = false, limit, 
  showFilters = false, filterStyle = 'drawer',
  enableSearch = false, enableSort = false,
  restrictToFiltered = false,
  onSelectProduct: externalOnSelect
}: ExploreProductsProps) => {
  const { products, categories, tags, brands, loading, onSelectProduct: dataContextOnSelect } = useContext(DataContext);
  const { t, lang } = useContext(LanguageContext);
  const { appSettings } = useContext(SettingsContext);
  const navigate = useNavigate();
  
  const { 
    params: filterParams, 
    setSearchQuery: setUrlSearch,
    setCategorySlugs: setUrlCategorySlugs,
    setSortOption: setUrlSort,
    setSelectedTagId: setUrlTag,
    setSelectedBrand: setUrlBrand,
    setPriceRange: setUrlPrice
  } = useProductSearchParams();

  const [internalCategorySlugs, setInternalCategorySlugs] = useState<string[]>([]);
  const [internalSearch, setInternalSearch] = useState(defaultSearch || '');
  const [internalTag, setInternalTag] = useState(defaultTagId || '');
  const [internalSort, setInternalSort] = useState('newest');
  const [internalBrand, setInternalBrand] = useState('');
  const [internalPriceRange, setInternalPriceRange] = useState<[number, number]>([0, 10000]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  if (loading) return <div className="py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">Fetching Products...</div>;

  const activeCategorySlugs = useUrlParams ? filterParams.categorySlugs : internalCategorySlugs;
  const activeSearch = useUrlParams ? filterParams.searchQuery : internalSearch;
  const activeTag = useUrlParams ? filterParams.selectedTagId : internalTag;
  const activeSort = useUrlParams ? filterParams.sortOption : internalSort;
  const activeBrand = useUrlParams ? filterParams.selectedBrand : internalBrand;
  const activePriceRange = useUrlParams ? [filterParams.minPrice, filterParams.maxPrice] : internalPriceRange;

  const activeCategoryIds = useMemo(() => {
    return categories
      .filter(c => activeCategorySlugs.includes(c.slug) || activeCategorySlugs.includes(c.id))
      .map(c => c.id);
  }, [categories, activeCategorySlugs]);

  const restrictedProducts = products.filter(p => {
    const matchesCategoryBase = categoryIds.length === 0 || (p.categories && categoryIds.some(c => p.categories.includes(c.id)));
    const matchesTagBase = !defaultTagId || (p.tags && p.tags.includes(defaultTagId));
    return matchesCategoryBase && matchesTagBase;
  });

  const filtered = restrictedProducts.filter(p => {
    const activeCategoryMatch = activeCategoryIds.length === 0 || (p.categories && activeCategoryIds.some(id => p.categories.includes(id)));
    
    const searchWords = activeSearch ? activeSearch.toLowerCase().split(/\s+/).filter(Boolean) : [];
    const searchMatch = searchWords.length === 0 || searchWords.every(word => {
      const name = (p.name || '').toLowerCase();
      const localName = (p.locals?.name && t(p.locals.name).toLowerCase()) || '';
      const brand = (p.brand || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const localDesc = (p.locals?.description && t(p.locals.description).toLowerCase()) || '';
      
      return name.includes(word) || localName.includes(word) || brand.includes(word) || desc.includes(word) || localDesc.includes(word);
    });

    const tagMatch = !activeTag || (p.tags && p.tags.includes(activeTag));
    const brandMatch = !activeBrand || p.brand === activeBrand;
    const priceMatch = p.price >= activePriceRange[0] && p.price <= activePriceRange[1];
    
    return activeCategoryMatch && searchMatch && tagMatch && brandMatch && priceMatch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (activeSort === 'price-low') return a.price - b.price;
    if (activeSort === 'price-high') return b.price - a.price;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const displayed = limit ? sorted.slice(0, limit) : sorted;

  const filterOptions = useMemo(() => {
    if (restrictToFiltered && categoryIds.length > 0) {
      return categories.filter(c => categoryIds.some(cid => cid.id === c.id));
    }
    return categories;
  }, [categories, categoryIds, restrictToFiltered]);

  const handleSelect = (product: Product) => {
    if (externalOnSelect) externalOnSelect(product);
    else if (dataContextOnSelect) dataContextOnSelect(product);
    else navigate(`/product/${product.id}`);
  };

  const handleSearchChange = (val: string) => {
    if (useUrlParams) setUrlSearch(val);
    else setInternalSearch(val);
  };

  const handleCategoryToggle = (idOrSlug: string) => {
    if (!idOrSlug) {
      if (useUrlParams) setUrlCategorySlugs([]);
      else setInternalCategorySlugs([]);
      return;
    }

    const category = categories.find(c => c.id === idOrSlug || c.slug === idOrSlug);
    if (!category) return;
    
    const slugToUse = category.slug || category.id;

    if (useUrlParams) {
      const currentSlugs = filterParams.categorySlugs;
      const nextSlugs = currentSlugs.includes(slugToUse) 
        ? currentSlugs.filter(s => s !== slugToUse) 
        : [...currentSlugs, slugToUse];
      setUrlCategorySlugs(nextSlugs);
    } else {
      setInternalCategorySlugs(prev => prev.includes(slugToUse) ? prev.filter(s => s !== slugToUse) : [...prev, slugToUse]);
    }
  };

  const handleSortChange = (val: string) => {
    if (useUrlParams) setUrlSort(val);
    else setInternalSort(val);
  };

  const handleTagChange = (val: string) => {
    if (useUrlParams) {
      const current = filterParams.selectedTagId;
      setUrlTag(current === val ? '' : val);
    } else {
      setInternalTag(prev => prev === val ? '' : val);
    }
  };

  const handleBrandChange = (val: string) => {
    if (useUrlParams) setUrlBrand(val);
    else setInternalBrand(val);
  };

  const handlePriceChange = (min: number, max: number) => {
    if (useUrlParams) setUrlPrice(min, max);
    else setInternalPriceRange([min, max]);
  };

  const gridClass = {
    2: 'grid-cols-2 lg:grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
  }[columns as 2 | 3 | 4 | 5 | 6] || 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

  const gapClass = {
    none: 'gap-0',
    small: 'gap-2 md:gap-4',
    medium: 'gap-4 md:gap-8',
    large: 'gap-6 md:gap-12'
  }[gapSize];

  return (
    <div className="py-12 space-y-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
       {(title || description || image || icon || seeMoreLabel) && (
        <div className="flex flex-row flex-wrap items-center justify-between gap-4 md:gap-8 w-full">
          <div className="flex flex-1 gap-4 md:gap-6 items-start">
            {image && (
              <div className="w-16 h-16 md:w-32 md:h-32 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl shrink-0">
                <img src={image} className="w-full h-full object-cover" alt="" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 md:gap-4 mb-1 md:mb-2">
                {icon && (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                    <Icon icon={icon} className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                )}
                {title && <h2 className="text-2xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">{t(title)}</h2>}
              </div>
              {description && <p className="text-gray-400 font-bold mt-1 md:mt-2 uppercase tracking-[0.2em] text-[8px] md:text-xs max-w-2xl">{t(description)}</p>}
            </div>
          </div>
          {seeMoreLabel && (
            <button 
              onClick={() => seeMorePath ? navigate(seeMorePath) : navigate('/shop')}
              className="shrink-0 flex items-center gap-2 group text-[10px] font-black uppercase tracking-widest hover:text-emerald-500 transition-colors rtl:mr-auto ltr:ml-auto"
            >
              {t(seeMoreLabel)}
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          )}
        </div>
      )}

      {(enableSearch || showFilters || enableSort) && (
        <div className={`space-y-6 ${filterStyle === 'sidebar' ? 'md:hidden' : ''}`}>
          <div className="flex flex-col md:flex-row items-center gap-4">
            {enableSearch && (
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder={t({ en: 'Search collection...', ar: 'بحث في المجموعة...' })}
                  value={activeSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-100 transition-all outline-none text-[10px] font-black uppercase"
                />
              </div>
            )}
            {showFilters && filterStyle === 'drawer' && (
              <button 
                onClick={() => setShowFilterDrawer(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase shadow-xl"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {t({ en: 'Filter', ar: 'تصفية' })}
              </button>
            )}
            {enableSort && filterStyle === 'bar' && (
              <div className="flex gap-2 w-full md:w-auto">
                {['newest', 'price-low', 'price-high'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleSortChange(opt)}
                    className={`flex-1 md:flex-none px-4 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${activeSort === opt ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
                  >
                    {t(opt === 'newest' ? { en: 'Newest', ar: 'الأحدث' } : opt === 'price-low' ? { en: 'Price: Low', ar: 'السعر: من الأقل' } : { en: 'Price: High', ar: 'السعر: من الأعلى' })}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filterStyle === 'bar' && filterOptions.length > 0 && (
             <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
              <CarouselContent className="-ms-2">
                <CarouselItem className="ps-2 basis-auto">
                  <button 
                    onClick={() => useUrlParams ? setUrlCategorySlugs([]) : setInternalCategorySlugs([])}
                    className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategoryIds.length === 0 ? 'bg-black text-white shadow-xl' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    {t({ en: 'All Items', ar: 'الكل' })}
                  </button>
                </CarouselItem>
                {filterOptions.map(cat => (
                  <CarouselItem key={cat.id} className="ps-2 basis-auto">
                    <button 
                      onClick={() => handleCategoryToggle(cat.slug || cat.id)}
                      className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategoryIds.includes(cat.id) ? 'bg-black text-white shadow-[#00000040]_shadow-lg ring-2 ring-black ring-offset-2' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                      {t(cat.locals?.title || cat.name)}
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}
        </div>
      )}

      <div className={`flex flex-col md:flex-row gap-12 min-h-[400px]`}>
        {showFilters && filterStyle === 'sidebar' && (
           <aside className="hidden md:block w-70 shrink-0 space-y-12">
              <div className="space-y-6">
                 <h4 className="text-xs font-black uppercase tracking-[0.2em]">{t({ en: 'Categories', ar: 'الفئات' })}</h4>
                 <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => useUrlParams ? setUrlCategorySlugs([]) : setInternalCategorySlugs([])}
                      className={`text-left text-[10px] font-bold uppercase tracking-widest transition-all ${activeCategoryIds.length === 0 ? 'text-black translate-x-2' : 'text-gray-400 hover:text-black'}`}
                    >
                      — {t({ en: 'All Categories', ar: 'جميع الفئات' })}
                    </button>
                    {filterOptions.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => handleCategoryToggle(cat.slug || cat.id)}
                        className={`text-left text-[10px] font-bold uppercase tracking-widest transition-all ${activeCategoryIds.includes(cat.id) ? 'text-black translate-x-2' : 'text-gray-400 hover:text-black'}`}
                      >
                        — {t(cat.locals?.title || cat.title)}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-xs font-black uppercase tracking-[0.2em]">{t({ en: 'Brands', ar: 'الماركات' })}</h4>
                 <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => handleBrandChange('')}
                      className={`text-left text-[10px] font-bold uppercase tracking-widest transition-all ${activeBrand === '' ? 'text-black translate-x-2' : 'text-gray-400 hover:text-black'}`}
                    >
                      — {t({ en: 'All Brands', ar: 'جميع الماركات' })}
                    </button>
                    {brands.slice(0, 10).map(brand => (
                      <button 
                        key={brand}
                        onClick={() => handleBrandChange(brand)}
                        className={`text-left text-[10px] font-bold uppercase tracking-widest transition-all ${activeBrand === brand ? 'text-black translate-x-2' : 'text-gray-400 hover:text-black'}`}
                      >
                        — {brand}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500">{t({ en: 'Price Range', ar: 'نطاق السعر' })}</h4>
                 <div className="space-y-4 pr-4">
                    <div className="flex justify-between text-[10px] font-black">
                       <span>{activePriceRange[0]}</span>
                       <span>{activePriceRange[1]}</span>
                    </div>
                    <input 
                       type="range"
                       min="0"
                       max="10000"
                       step="100"
                       value={activePriceRange[1]}
                       onChange={(e) => handlePriceChange(activePriceRange[0], parseInt(e.target.value))}
                       className="w-full accent-black"
                    />
                 </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-xs font-black uppercase tracking-[0.2em]">{t({ en: 'Sort By', ar: 'ترتيب حسب' })}</h4>
                 <div className="flex flex-col gap-3">
                    {[
                      { id: 'newest', label: { en: 'Newest Arrivals', ar: 'الأحدث وصولاً' } },
                      { id: 'price-low', label: { en: 'Price: Low to High', ar: 'السعر: من الأقل للأعلى' } },
                      { id: 'price-high', label: { en: 'Price: High to Low', ar: 'السعر: من الأعلى للأقل' } }
                    ].map(opt => (
                      <button 
                        key={opt.id}
                        onClick={() => handleSortChange(opt.id)}
                        className={`text-left text-[10px] font-bold uppercase tracking-widest transition-all ${activeSort === opt.id ? 'text-black translate-x-2' : 'text-gray-400 hover:text-black'}`}
                      >
                        — {t(opt.label)}
                      </button>
                    ))}
                 </div>
              </div>

              {tags.length > 0 && (
                 <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">{t({ en: 'Tags', ar: 'الوسوم' })}</h4>
                    <div className="flex flex-wrap gap-2">
                       {tags.map(tag => (
                          <button 
                            key={tag.id}
                            onClick={() => handleTagChange(tag.id)}
                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${activeTag === tag.id ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
                          >
                            {t(tag.title)}
                          </button>
                       ))}
                    </div>
                 </div>
              )}
           </aside>
        )}

        <div className="flex-1">
          {displayed.length > 0 ? (
            layout === 'carousel' ? (
              <Carousel opts={{ align: "start", loop: false }} className="w-full">
                <CarouselContent>
                  {displayed.map(product => (
                    <CarouselItem key={product.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                      <ProductCard product={product} onSelect={handleSelect} variant={cardVariant} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : layout === 'list' ? (
              <div className="space-y-4">
                {displayed.map(product => (
                  <div key={product.id} className="group relative bg-white rounded-3xl p-4 flex gap-6 hover:shadow-2xl transition-all border border-gray-50 cursor-pointer" onClick={() => handleSelect(product)}>
                    <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                      <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                    </div>
                    <div className="flex-1 py-2 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">{product.brand}</p>
                        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">{t(product.locals.name)}</h3>
                        <p className="text-xs text-gray-400 line-clamp-2 max-w-xl">{t(product.locals.description)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-black tracking-tighter">{product.price} <span className="text-[10px] text-gray-400 font-bold uppercase">{t(appSettings.currency?.symbol || config.currency.symbol)}</span></span>
                        <button className="px-6 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-colors">{t({ en: 'Details', ar: 'التفاصيل' })}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`grid ${gridClass} ${gapClass}`}>
                {displayed.map(product => (
                  <ProductCard key={product.id} product={product} onSelect={handleSelect} variant={cardVariant} />
                ))}
              </div>
            )
          ) : (
            <div className="py-20 text-center bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100">
              <Search className="w-12 h-12 text-gray-200 mx-auto mb-6" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">{t({ en: 'No products matched', ar: 'لا توجد منتجات مطابقة' })}</h3>
              <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">{t({ en: 'Try adjusting your filters', ar: 'حاول تعديل الفلاتر' })}</p>
            </div>
          )}
        </div>
      </div>

      {showFilterDrawer && (
        <FilterDrawer 
          onClose={() => setShowFilterDrawer(false)}
          categories={filterOptions}
          selectedCategoryIds={activeCategoryIds}
          setSelectedCategoryId={handleCategoryToggle}
          brands={brands}
          selectedBrand={activeBrand}
          setSelectedBrand={handleBrandChange}
          priceRange={activePriceRange as [number, number]}
          setPriceRange={handlePriceChange}
          currency={t(appSettings.currency?.symbol || config.currency.symbol)}
          sortOption={activeSort}
          setSortOption={handleSortChange}
          tags={tags}
          selectedTagId={activeTag}
          setSelectedTagId={handleTagChange}
        />
      )}
    </div>
  );
};

export const ProductCard = ({ 
  product, 
  onSelect,
  variant: propVariant
}: { 
  product: Product, 
  onSelect: (p: Product) => void,
  variant?: ProductCardVariant,
  key?: string
}) => {
  const { t } = useContext(LanguageContext);
  const { toggleWishlist, isInWishlist } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { appSettings } = useContext(SettingsContext);

  // Determine variant: prop > category-based > global config
  let variant = propVariant || config.productCard.variant;
  
  // Example category-based logic
  if (!propVariant) {
    if (product.categories.includes('food') || product.categories.includes('drinks')) {
      variant = 'local-delivery';
    }
  }

  if (variant === 'cover') {
    return (
      <div 
        className="group cursor-pointer relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-lg hover:shadow-xl"
        onClick={() => onSelect(product)}
      >
        <img 
          src={product.image || undefined} 
          alt={t(product.locals.name)} 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        
        <div className="absolute top-4 right-4 z-20">
          {user && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-90 ${
                isInWishlist(product.id) 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-black/40'
              }`}
            >
              <Heart className={`w-6 h-6 md:w-7 md:h-7 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-3 bg-gradient-to-t from-black/95 via-black/40 to-transparent">
          <div className="space-y-1">
            <h3 className="font-black text-xl md:text-2xl line-clamp-1 tracking-tighter uppercase italic">{t(product.locals.name)}</h3>
            <p className="text-white/60 text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">{product.brand}</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-1">
              <span className="font-black text-4xl md:text-5xl tracking-tighter leading-none">{product.price}</span>
              <span className="text-xs md:text-sm text-white/50 font-bold uppercase tracking-widest">{t(appSettings.currency?.symbol || config.currency.symbol)}</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 shrink-0"
            >
              <ShoppingCart className="w-7 h-7 md:w-8 md:h-8" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'modern') {
    return (
      <div 
        className="group cursor-pointer"
        onClick={() => onSelect(product)}
      >
        <div className="aspect-[3/4] relative rounded-[3rem] overflow-hidden bg-gray-50 mb-6 shadow-sm hover:shadow-xl">
          <img 
            src={product.image || undefined} 
            className="w-full h-full object-cover" 
            alt={t(product.locals.name)} 
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
            {user && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product.id);
                }}
                className={`w-11 h-11 md:w-13 md:h-13 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-md transition-all ${
                  isInWishlist(product.id) ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 md:w-6 md:h-6 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="absolute bottom-6 left-6 right-6 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 hover:bg-black shadow-2xl z-20"
          >
            {t({ en: 'Add to Cart', ar: 'أضف للسلة' })}
          </button>
        </div>
        <div className="px-4">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">{product.brand}</p>
           <h4 className="text-xl font-black italic uppercase tracking-tighter leading-none mb-3 group-hover:text-emerald-600 transition-colors line-clamp-1">{t(product.locals.name)}</h4>
           <div className="flex items-center gap-3">
             <span className="text-4xl md:text-5xl font-black tracking-tighter text-black">{product.price}</span>
             <span className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">{t(appSettings.currency?.symbol || config.currency.symbol)}</span>
           </div>
        </div>
      </div>
    );
  }

  if (variant === 'glass') {
    return (
      <div 
        className="group cursor-pointer relative aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/20 backdrop-blur-sm shadow-xl"
        onClick={() => onSelect(product)}
      >
        <img 
          src={product.image || undefined} 
          alt={t(product.locals.name)} 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-6 bg-white/10 backdrop-blur-xl border-t border-white/20">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">{product.brand}</p>
           <h4 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none mb-4 line-clamp-1">{t(product.locals.name)}</h4>
           <div className="flex items-center justify-between gap-4">
             <div className="flex items-baseline gap-1 shrink-0">
               <span className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">{product.price}</span>
               <span className="text-[10px] font-bold text-white/50 uppercase">{t(appSettings.currency?.symbol || config.currency.symbol)}</span>
             </div>
             <button 
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
                className="w-11 h-11 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
              >
                <ShoppingCart className="w-6 h-6" />
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (variant === 'local-delivery') {
    return (
      <div 
        className="group cursor-pointer relative aspect-[4/5] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-lg"
        onClick={() => onSelect(product)}
      >
        <img 
          src={product.image || undefined} 
          alt={t(product.locals.name)} 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Top Actions */}
        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20 flex flex-col gap-2">
          {user && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-md transition-all ${
                isInWishlist(product.id) 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 md:w-6 md:h-6 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 text-white space-y-1 md:space-y-2">
          <div className="space-y-0.5">
            <h3 className="font-black text-[10px] md:text-sm line-clamp-1 tracking-tight">{t(product.locals.name)}</h3>
            <p className="text-white/60 text-[7px] md:text-[8px] font-bold uppercase tracking-widest">{product.brand}</p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="font-black text-2xl md:text-3xl tracking-tighter">{product.price}</span>
              <span className="text-[10px] md:text-xs font-black text-white/60 uppercase tracking-widest">{t(appSettings.currency?.symbol || config.currency.symbol)}</span>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
            >
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Minimal Variant (for category sections)
  if (variant === 'minimal') {
    return (
      <div 
        className="group cursor-pointer relative aspect-square rounded-xl md:rounded-2xl overflow-hidden shadow-md"
        onClick={() => onSelect(product)}
      >
        <img 
          src={product.image || undefined} 
          className="absolute inset-0 w-full h-full object-cover" 
          referrerPolicy="no-referrer" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white flex items-end justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="text-[11px] md:text-sm font-black truncate tracking-tight mb-1">{t(product.locals.name)}</h4>
            <div className="flex items-baseline gap-1">
              <span className="text-lg md:text-2xl font-black">{product.price}</span>
              <span className="text-[8px] md:text-[10px] font-bold text-white/60 uppercase">{t(appSettings.currency?.symbol || config.currency.symbol)}</span>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95 shrink-0"
          >
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>
    );
  }

  // Default Variant (Clean/Minimal)
  return (
    <div 
      className="group cursor-pointer relative aspect-[4/5] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-sm"
      onClick={() => onSelect(product)}
    >
      <img 
        src={product.image || undefined} 
        alt={t(product.locals.name)} 
        className="absolute inset-0 w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      
      <div className="absolute top-3 left-3 md:top-6 md:left-6 flex flex-col gap-1 md:gap-2 z-10">
        <div className="bg-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-full text-sm md:text-xl font-black text-black shadow-2xl border border-gray-100 flex items-baseline gap-1">
          <span className="tracking-tighter">{product.price}</span>
          <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t(appSettings.currency?.symbol || config.currency.symbol)}</span>
        </div>
      </div>

      <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20">
        {user && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`w-11 h-11 md:w-13 md:h-13 rounded-full shadow-xl backdrop-blur-md transition-all flex items-center justify-center active:scale-90 ${
              isInWishlist(product.id) 
                ? 'bg-red-500 text-white' 
                : 'bg-white/20 text-white hover:bg-black/40'
            }`}
          >
            <Heart className={`w-6 h-6 md:w-7 md:h-7 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white bg-gradient-to-t from-black/95 via-black/40 to-transparent">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-sm md:text-lg tracking-tight line-clamp-1 mb-1">{t(product.locals.name)}</h3>
            <p className="text-white/50 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{product.brand}</p>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="w-11 h-11 md:w-14 md:h-14 bg-emerald-500 text-white rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center shadow-2xl z-20 hover:scale-110 transition-transform active:scale-95 shrink-0"
          >
            <ShoppingCart className="w-5 h-5 md:w-7 md:h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductGrid = ({ products, onSelect }: { products: Product[], onSelect: (p: Product) => void }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-1.5 md:gap-8 p-1 md:p-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onSelect={onSelect} />
      ))}
    </div>
  );
};

const ProductDetail = ({ product, onBack }: { product: Product, onBack: () => void }) => {
  const { addToCart } = useContext(CartContext);
  const { t } = useContext(LanguageContext);
  const { toggleWishlist, isInWishlist } = useContext(WishlistContext);
  const { user } = useContext(AuthContext);
  const { appSettings } = useContext(SettingsContext);
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const hasDiscount = product.discount && product.discount > 0;
  const discountedPrice = hasDiscount ? currentPrice * (1 - product.discount! / 100) : currentPrice;

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-8 flex flex-col md:flex-row gap-4 md:gap-12">
      <div className="flex-1">
        <button onClick={onBack} className="flex items-center gap-1 text-gray-500 mb-3 md:mb-8 hover:text-black transition-colors text-xs md:text-sm">
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> {t({ en: 'Back to Shop', ar: 'العودة للمتجر' })}
        </button>
        <div 
          className="aspect-square md:aspect-[4/5] bg-gray-100 rounded-xl md:rounded-3xl overflow-hidden relative"
        >
          <img 
            src={product.image || undefined} 
            alt={t(product.locals.name)} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {user && (
            <button 
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-2 right-2 p-1.5 md:top-6 md:right-6 md:p-4 rounded-lg md:rounded-2xl shadow-lg backdrop-blur-md transition-all flex items-center justify-center ${
                isInWishlist(product.id) 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/90 text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 md:w-8 md:h-8 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </button>
          )}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-1.5 py-0.5 md:top-6 md:left-6 md:px-4 md:py-2 rounded-md md:rounded-xl font-bold shadow-lg text-[8px] md:text-sm">
              {product.discount}% OFF
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 py-2 md:py-12">
        <span className="text-[8px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5 md:mb-2 block">{product.brand}</span>
        <h1 className="text-xl md:text-5xl font-bold mb-2 md:mb-6 tracking-tight leading-tight">{t(product.locals.name)}</h1>
        <p className="text-gray-600 text-xs md:text-lg leading-relaxed mb-3 md:mb-8">{t(product.locals.description)}</p>
        
        <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-10">
          <div className="text-xl md:text-4xl font-black">
            {discountedPrice.toFixed(2)} {t(appSettings.currency?.symbol || config.currency.symbol)}
          </div>
          {hasDiscount && (
            <div className="text-sm md:text-2xl text-gray-400 line-through font-bold">
              {currentPrice.toFixed(2)} {t(appSettings.currency?.symbol || config.currency.symbol)}
            </div>
          )}
        </div>

        {product.hasVariants && product.variants && product.variants.length > 0 && (
          <div className="mb-3 md:mb-10 space-y-1.5 md:space-y-4">
            <h3 className="text-[8px] md:text-sm font-bold uppercase tracking-widest text-gray-400">{t({ en: 'Select Variant', ar: 'اختر النوع' })}</h3>
            <div className="flex flex-wrap gap-1.5 md:gap-3">
              {product.variants.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`px-3 py-1.5 md:px-6 md:py-3 rounded-lg md:rounded-2xl font-bold transition-all border-2 text-xs md:text-base ${
                    selectedVariant?.id === variant.id 
                      ? 'border-black bg-black text-white shadow-md' 
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  {t(variant.name)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 md:gap-6 mb-4 md:mb-10">
          <div className="flex items-center bg-gray-100 rounded-lg md:rounded-2xl p-0.5 md:p-2">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center hover:bg-white rounded-md md:rounded-xl transition-all text-sm md:text-base"
            >
              -
            </button>
            <span className="w-8 md:w-12 text-center font-bold text-base md:text-xl">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center hover:bg-white rounded-md md:rounded-xl transition-all text-sm md:text-base"
            >
              +
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if (product.hasVariants && !selectedVariant) {
              // Custom toast or silent feedback would be better, but sticking to requested UI changes
              return;
            }
            const itemToCart = {
              ...product,
              price: discountedPrice,
              id: selectedVariant ? `${product.id}_${selectedVariant.id}` : product.id,
              name: selectedVariant ? `${product.name} (${t(selectedVariant.name)})` : product.name,
              locals: {
                ...product.locals,
                name: selectedVariant ? {
                  en: `${product.locals.name.en} (${selectedVariant.name.en})`,
                  ar: `${product.locals.name.ar} (${selectedVariant.name.ar})`
                } : product.locals.name
              }
            };
            for(let i = 0; i < quantity; i++) {
              addToCart(itemToCart);
            }
          }}
          className="w-full bg-black text-white py-3.5 md:py-6 rounded-xl md:rounded-3xl font-bold text-base md:text-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          <ShoppingCart className="w-5 h-5 md:w-7 md:h-7" /> {t({ en: 'Add to Shopping Bag', ar: 'أضف إلى حقيبة التسوق' })}
        </button>
      </div>
    </div>
  );
};

const WishlistPage = ({ onSelectProduct }: { onSelectProduct: (p: Product) => void }) => {
  const { wishlist } = useContext(WishlistContext);
  const { t } = useContext(LanguageContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const productPromises = wishlist.map(id => getDoc(doc(db, 'products', id)));
        const productSnaps = await Promise.all(productPromises);
        const wishlistProducts = productSnaps
          .filter(snap => snap.exists() && snap.data()?.status === 'published')
          .map(snap => ({ id: snap.id, ...snap.data() } as Product));
        setProducts(wishlistProducts);
      } catch (error) {
        console.error("Error fetching wishlist products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlist]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <Heart className="w-16 h-16 text-gray-200 mb-6" />
        <h2 className="text-3xl font-bold mb-4">{t({ en: 'Your wishlist is empty', ar: 'قائمة الأمنيات فارغة' })}</h2>
        <p className="text-gray-500 max-w-md">
          {t({ 
            en: 'Save items you love to your wishlist and they will appear here.', 
            ar: 'احفظ المنتجات التي تحبها في قائمة الأمنيات وستظهر هنا.' 
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-12">{t({ en: 'My Wishlist', ar: 'قائمة أمنياتي' })}</h1>
      <ProductGrid products={products} onSelect={onSelectProduct} />
    </div>
  );
};

const CartPage = ({ onCheckout }: { onCheckout: () => void }) => {
  const { cart, removeFromCart, total } = useContext(CartContext);
  const { t } = useContext(LanguageContext);
  const { appSettings } = useContext(SettingsContext);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 md:py-32">
        <ShoppingBag className="w-10 h-10 md:w-16 md:h-16 text-gray-200 mb-3 md:mb-6" />
        <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">{t({ en: 'Your bag is empty', ar: 'حقيبتك فارغة' })}</h2>
        <p className="text-gray-500 text-xs md:text-base">{t({ en: "Looks like you haven't added anything yet.", ar: 'يبدو أنك لم تضف أي شيء بعد.' })}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-2 md:p-4">
      <h1 className="text-xl md:text-4xl font-bold mb-3 md:mb-12">{t({ en: 'Shopping Bag', ar: 'حقيبة التسوق' })}</h1>
      <div className="space-y-2 md:space-y-8 mb-4 md:mb-12">
        {cart.map((item) => (
          <div key={item.id} className="flex gap-2.5 md:gap-6 items-center border-b border-gray-100 pb-2 md:pb-8">
            <img 
              src={item.image || undefined} 
              alt={t(item.locals.name)} 
              className="w-14 h-18 md:w-24 md:h-32 object-cover rounded-lg md:rounded-xl bg-gray-100"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1">
              <h3 className="font-bold text-xs md:text-xl leading-tight line-clamp-1">{t(item.locals.name)}</h3>
              <p className="text-[9px] md:text-sm text-gray-500">{item.brand}</p>
              <div className="mt-0.5 md:mt-2 font-semibold text-[10px] md:text-base">{item.price} {t(appSettings.currency?.symbol || config.currency.symbol)} × {item.quantity}</div>
            </div>
            <button 
              onClick={() => removeFromCart(item.id)}
              className="p-1 md:p-3 text-red-400 hover:bg-red-50 rounded-full transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 md:w-5 md:h-5" />
            </button>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 rounded-xl md:rounded-3xl p-3 md:p-8">
        <div className="flex justify-between items-center mb-3 md:mb-8">
          <span className="text-gray-500 font-medium text-[10px] md:text-base">{t({ en: 'Subtotal', ar: 'المجموع الفرعي' })}</span>
          <span className="text-base md:text-2xl font-bold">{total.toFixed(2)} {t(appSettings.currency?.symbol || config.currency.symbol)}</span>
        </div>
        <button 
          onClick={onCheckout}
          className="w-full bg-black text-white py-3 md:py-5 rounded-xl md:rounded-2xl font-bold text-sm md:text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-lg"
        >
          <CreditCard className="w-3.5 h-3.5 md:w-6 md:h-6" /> {t({ en: 'Proceed to Checkout', ar: 'المتابعة لإتمام الشراء' })}
        </button>
      </div>
    </div>
  );
};

const MapPicker = ({ onLocationSelect, initialCoords, t, className = "h-64" }: { onLocationSelect: (lat: number, lng: number) => void, initialCoords: { lat: number, lng: number } | null, t: (ls: any) => string, className?: string }) => {
  const [position, setPosition] = useState<{ lat: number, lng: number } | null>(initialCoords);
  
  const MapEvents = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition({ lat, lng });
        onLocationSelect(lat, lng);
      },
    });

    useEffect(() => {
      if (initialCoords) {
        setPosition(initialCoords);
        map.setView([initialCoords.lat, initialCoords.lng], map.getZoom());
      }
    }, [initialCoords]);

    return null;
  };

  return (
    <div className={`${className} w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner relative z-0`}>
      <MapContainer 
        center={position ? [position.lat, position.lng] : [24.7136, 46.6753]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapEvents />
        {position && (
          <Marker position={[position.lat, position.lng]}>
            <Popup>{t({ en: 'Delivery Location', ar: 'موقع التوصيل' })}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

const AddressDrawer = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialAddress, 
  initialCoords, 
  initialMode = 'normal',
  initialDetails,
  t 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (address: string, coords: { lat: number, lng: number } | null, mode: 'normal' | 'map', details?: AddressDetails) => void,
  initialAddress: string,
  initialCoords: { lat: number, lng: number } | null,
  initialMode?: 'normal' | 'map',
  initialDetails?: AddressDetails,
  t: (ls: any) => string
}) => {
  const { user } = useContext(AuthContext);
  const { appSettings } = useContext(SettingsContext);
  const [address, setAddress] = useState(initialAddress);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(initialCoords);
  const [showMap, setShowMap] = useState(false);
  const [errorString, setErrorString] = useState('');
  const { regions } = useRegions();

  const [details, setDetails] = useState<AddressDetails>(initialDetails || {
    regionId: '',
    streetName: '',
    buildingNumber: '',
    floorNumber: '',
    apartmentNumber: '',
    additionalInstructions: '',
    customerName: '',
    customerPhone: ''
  });

  useEffect(() => {
    if (isOpen) {
      setAddress(initialAddress);
      setCoords(initialCoords);
      if (initialDetails) setDetails(initialDetails);
      setShowMap(!!initialCoords && initialMode === 'map');
      setErrorString('');
    }
  }, [isOpen, initialAddress, initialCoords, initialMode, initialDetails]);

  // Update string address when details change
  useEffect(() => {
    const regionName = regions.find(r => r.id === details.regionId)?.name || '';
    const parts = [
      details.customerName ? `${details.customerName} (${details.customerPhone || ''})` : '',
      regionName,
      details.streetName ? `${t({ en: 'Street', ar: 'شارع' })}: ${details.streetName}` : '',
      details.buildingNumber ? `${t({ en: 'Building', ar: 'بناية' })}: ${details.buildingNumber}` : '',
      details.floorNumber ? `${t({ en: 'Floor', ar: 'طابق' })}: ${details.floorNumber}` : '',
      details.apartmentNumber ? `${t({ en: 'Apartment', ar: 'شقة' })}: ${details.apartmentNumber}` : '',
    ].filter(Boolean);
    setAddress(parts.join(', '));
  }, [details, regions, t]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data.display_name) {
        // If we geocode, we might want to fill some details if possible, but let's keep it simple for now
        // and just update the main address string or set a flag
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
        const region = getRegionForPoint({ lat: latitude, lng: longitude }, regions);
        if (region && !details.regionId) {
          setDetails(prev => ({ ...prev, regionId: region.id }));
        }
      }, (err) => {
        console.error(err);
        alert(t({ en: 'Could not get location', ar: 'تعذر الحصول على الموقع' }));
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative bg-white w-full max-w-2xl h-[90vh] rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between z-20 bg-white">
              <h2 className="text-xl font-bold">{t({ en: 'Delivery Address', ar: 'عنوان التوصيل' })}</h2>
              <button 
                onClick={onClose}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!user && appSettings.features?.guestCheckout && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Full Name (Mandatory)', ar: 'الاسم الكامل (إلزامي)' })}</label>
                    <input 
                      type="text" 
                      value={details.customerName || ''}
                      onChange={(e) => setDetails({ ...details, customerName: e.target.value })}
                      placeholder={t({ en: 'e.g. John Doe', ar: 'مثلاً زيد طارق' })}
                      className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Phone Number (Mandatory)', ar: 'رقم الهاتف (إلزامي)' })}</label>
                    <input 
                      type="tel" 
                      value={details.customerPhone || ''}
                      onChange={(e) => setDetails({ ...details, customerPhone: e.target.value })}
                      placeholder={t({ en: 'e.g. +971 50...', ar: 'مثلاً +971 50...' })}
                      className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Region Selector */}
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Region (Mandatory)', ar: 'المنطقة (إلزامي)' })}</label>
                <select 
                  value={details.regionId}
                  onChange={(e) => setDetails({ ...details, regionId: e.target.value })}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none font-bold"
                >
                  <option value="">{t({ en: 'Select Region', ar: 'اختر المنطقة' })}</option>
                  {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
              </div>

              {/* Address Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Street Name', ar: 'اسم الشارع' })}</label>
                  <input 
                    type="text" 
                    value={details.streetName}
                    onChange={(e) => setDetails({ ...details, streetName: e.target.value })}
                    placeholder={t({ en: 'e.g. Al Khalidiyah St', ar: 'مثلاً شارع الخالدية' })}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Building Number', ar: 'رقم البناية' })}</label>
                  <input 
                    type="text" 
                    value={details.buildingNumber}
                    onChange={(e) => setDetails({ ...details, buildingNumber: e.target.value })}
                    placeholder={t({ en: 'e.g. 12', ar: 'مثلاً 12' })}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Floor Number', ar: 'رقم الطابق' })}</label>
                  <input 
                    type="text" 
                    value={details.floorNumber}
                    onChange={(e) => setDetails({ ...details, floorNumber: e.target.value })}
                    placeholder={t({ en: 'e.g. 3', ar: 'مثلاً 3' })}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Apartment Number', ar: 'رقم الشقة' })}</label>
                  <input 
                    type="text" 
                    value={details.apartmentNumber}
                    onChange={(e) => setDetails({ ...details, apartmentNumber: e.target.value })}
                    placeholder={t({ en: 'e.g. 304', ar: 'مثلاً 304' })}
                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Additional Instructions (Optional)', ar: 'تعليمات إضافية (اختياري)' })}</label>
                <textarea 
                  value={details.additionalInstructions}
                  onChange={(e) => setDetails({ ...details, additionalInstructions: e.target.value })}
                  placeholder={t({ en: 'Near the supermarket, etc...', ar: 'بجانب السوبر ماركت، الخ...' })}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none resize-none min-h-[80px]"
                />
              </div>

              {/* Map Toggle Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-gray-400">{t({ en: 'Precise Map Location', ar: 'موقع الخريطة الدقيق' })}</label>
                  <button 
                    onClick={() => setShowMap(!showMap)}
                    className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    {showMap ? t({ en: 'Hide Map', ar: 'إخفاء الخريطة' }) : t({ en: 'Show Map', ar: 'إظهار الخريطة' })}
                  </button>
                </div>

                {showMap && (
                  <div className="h-[250px] rounded-[32px] overflow-hidden border border-gray-100 relative">
                    <MapPicker 
                      t={t}
                      className="h-full"
                      initialCoords={coords} 
                      onLocationSelect={(lat, lng) => {
                        setCoords({ lat, lng });
                        const region = getRegionForPoint({ lat, lng }, regions);
                        if (region && !details.regionId) {
                          setDetails(prev => ({ ...prev, regionId: region.id }));
                        }
                      }} 
                    />
                    <button 
                      onClick={getCurrentLocation}
                      className="absolute top-4 left-4 z-10 p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20"
                    >
                      <MapPin className="w-5 h-5 text-emerald-500" />
                    </button>
                    {coords && (
                      <div className="absolute bottom-4 left-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 text-[10px] font-bold text-center text-emerald-600">
                        {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 bg-emerald-50 rounded-3xl flex gap-3 items-start">
                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{t({ en: 'Address Summary', ar: 'ملخص العنوان' })}</p>
                  <p className="text-[11px] text-emerald-700 leading-relaxed mt-1">{address || t({ en: 'Please fill details...', ar: 'يرجى تعبئة التفاصيل...' })}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
              {errorString && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-bold leading-tight">{errorString}</span>
                </div>
              )}
              <button 
                onClick={() => {
                  setErrorString('');
                  if (!user && appSettings.features?.guestCheckout) {
                    if (!details.customerName?.trim() || !details.customerPhone?.trim()) {
                      return setErrorString(t({ en: 'Please enter your name and phone number', ar: 'يرجى إدخال اسمك ورقم هاتفك' }));
                    }
                  }
                  if (!details.regionId) return setErrorString(t({ en: 'Please select a region', ar: 'يرجى اختيار منطقة' }));
                  if (!details.streetName?.trim()) return setErrorString(t({ en: 'Please enter street name', ar: 'يرجى إدخال اسم الشارع' }));
                  if (!details.buildingNumber?.trim()) return setErrorString(t({ en: 'Please enter building number', ar: 'يرجى إدخال رقم البناية' }));

                  onSave(address, coords, coords ? 'map' : 'normal', details);
                  onClose();
                }}
                className="w-full py-4 bg-black text-white rounded-3xl font-bold hover:bg-gray-900 transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <span>{t({ en: 'Save Address', ar: 'حفظ العنوان' })}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const cleanObject = (obj: any) => {
  if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(item => cleanObject(item));
  
  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (val === undefined) {
      newObj[key] = null;
    } else if (val && typeof val === 'object' && val.constructor === Object) {
      newObj[key] = cleanObject(val);
    } else {
      newObj[key] = val;
    }
  });
  return newObj;
};

const CheckoutPage = ({ onComplete }: { onComplete: (orderId: string) => void }) => {
  const { cart, total, clearCart } = useContext(CartContext);
  const { user, profile } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { appSettings } = useContext(SettingsContext);
  const { location: savedLocation, address: savedAddress } = useContext(LocationContext);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(savedAddress || profile?.address || '');
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(savedLocation || profile?.defaultLocation || null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [addressDetails, setAddressDetails] = useState<AddressDetails | undefined>(profile?.addressDetails);
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');

  const { deliveryMethods } = useDeliveryMethods();
  const { regions } = useRegions();

  useEffect(() => {
    if (profile) {
      if (!savedAddress && profile.address) setAddress(profile.address);
      if (!savedLocation && profile.defaultLocation) setCoords(profile.defaultLocation);
      setAddressDetails(profile.addressDetails);
    } else {
      try {
        const storedStr = localStorage.getItem('kuzama_guest_address_data');
        if (storedStr) {
          const stored = JSON.parse(storedStr);
          if (stored.addressStr && !savedAddress) setAddress(stored.addressStr);
          if (stored.coords && !savedLocation) setCoords(stored.coords);
          if (stored.details) {
            setAddressDetails(stored.details);
            if (stored.details.regionId) setSelectedRegionId(stored.details.regionId);
          }
        }
      } catch (e) {}
    }
  }, [profile, savedAddress, savedLocation]);

  useEffect(() => {
    if (deliveryMethods.length > 0) {
      const def = deliveryMethods.find(m => m.isDefault) || deliveryMethods[0];
      setSelectedMethodId(def.id);
    }
  }, [deliveryMethods]);

  useEffect(() => {
    if (!appSettings.paymentMethods.online.enabled && appSettings.paymentMethods.cod.enabled) {
      setPaymentMethod('cod');
    }
  }, [appSettings.paymentMethods.online.enabled, appSettings.paymentMethods.cod.enabled]);

  const [selectedRegionId, setSelectedRegionId] = useState(addressDetails?.regionId || '');

  useEffect(() => {
    if (addressDetails?.regionId) {
      setSelectedRegionId(addressDetails.regionId);
    } else if (coords && appSettings.restrictDeliveryToRegions) {
      const region = getRegionForPoint(coords, regions);
      if (region) setSelectedRegionId(region.id);
    }
  }, [addressDetails, coords, regions, appSettings.restrictDeliveryToRegions]);

  const handlePayment = async () => {
    setCheckoutError(null);
    if (!user && !appSettings.features?.guestCheckout) {
      setCheckoutError(t({ en: 'Please sign in to checkout', ar: 'يرجى تسجيل الدخول لإتمام الشراء' }));
      return;
    }

    if (!user && appSettings.features?.guestCheckout) {
      if (!addressDetails?.customerName || !addressDetails?.customerPhone) {
         setCheckoutError(t({ en: 'Please provide your name and phone number in the shipping address formulation', ar: 'يرجى إدخال الاسم ورقم الهاتف في تفاصيل عنوان الشحن' }));
         return;
      }
    }

    const selectedMethod = deliveryMethods.find(m => m.id === selectedMethodId);
    if (!selectedMethod) {
      setCheckoutError(t({ en: 'Please select a delivery method', ar: 'يرجى اختيار طريقة التوصيل' }));
      return;
    }

    if (!selectedRegionId) {
      setCheckoutError(t({ en: 'Please select a delivery region', ar: 'يرجى اختيار منطقة التوصيل' }));
      return;
    }

    if (!address) {
      setCheckoutError(t({ en: 'Please provide a shipping address', ar: 'يرجى تقديم عنوان الشحن' }));
      return;
    }

    if (selectedMethod.requiresCoords && !coords) {
      setCheckoutError(t({ en: 'This delivery method requires pinning your location on the map', ar: 'طريقة التوصيل هذه تتطلب تحديد موقعك على الخريطة' }));
      return;
    }

    setLoading(true);
    try {
      const isPreTransaction = paymentMethod === 'online' ? appSettings.paymentMethods.online.preTransaction : appSettings.paymentMethods.cod.preTransaction;
      const orderData = cleanObject({
        userId: user ? user.uid : null,
        guestContact: user ? null : {
          name: addressDetails?.customerName || '',
          phone: addressDetails?.customerPhone || ''
        },
        items: cart.map(item => ({
          id: item.id,
          name: t(item.locals.name),
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: total,
        status: isPreTransaction ? 'pending' : 'processing',
        paymentMethod,
        deliveryMethodId: selectedMethodId,
        createdAt: serverTimestamp(),
        customerInfo: {
          name: user?.displayName || addressDetails?.customerName || 'Guest',
          email: user?.email || 'guest@example.com',
          address: address,
          addressDetails: addressDetails || null,
          destinationCoords: coords || null,
          regionId: selectedRegionId || null
        }
      });
      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      if (appSettings.whatsappOrders?.enabled) {
        if (!appSettings.whatsappOrders.phoneNumber) {
          setCheckoutError(t({ en: 'WhatsApp number is not configured by admin.', ar: 'رقم واتساب غير مهيأ من قبل الإدارة.' }));
          setLoading(false);
          return;
        }
        const orderIdPart = orderRef.id.slice(-6).toUpperCase();
        let waText = `*New Order #${orderIdPart}*\n\n`;
        waText += `*Customer:* ${user?.displayName || addressDetails?.customerName || 'Guest'}\n`;
        waText += `*Address:* ${address}\n\n`;
        waText += `*Items:*\n`;
        cart.forEach(item => {
          waText += `- ${item.quantity}x ${t(item.locals.name)} (${item.price} ${t(appSettings.currency?.symbol || config.currency.symbol)})\n`;
        });
        waText += `\n*Total:* ${total.toFixed(2)} ${t(appSettings.currency?.symbol || config.currency.symbol)}\n`;
        
        const waLink = `https://wa.me/${appSettings.whatsappOrders.phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waText)}`;
        window.open(waLink, '_blank');
        
        clearCart();
        onComplete(orderRef.id);
        setLoading(false);
        return;
      }
      
      if (!isPreTransaction) {
        clearCart();
        onComplete(orderRef.id);
        return;
      }

      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: appSettings.currency?.code || config.currency.code,
          customerName: user?.displayName || addressDetails?.customerName || 'Guest',
          customerEmail: user?.email || 'guest@example.com',
          orderId: orderRef.id
        })
      });

      const data = await response.json();
      if (data.IsSuccess) {
        window.location.href = data.Data.PaymentURL;
      } else {
        throw new Error(data.Message || 'Payment initiation failed');
      }
    } catch (error: any) {
      console.error(error);
      setCheckoutError(t({ en: `Checkout failed: ${error.message}`, ar: `فشلت عملية الشراء: ${error.message}` }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-1 md:p-4 pb-20">
      <h1 className="text-xl md:text-3xl font-bold mb-6">{t({ en: 'Checkout', ar: 'إتمام الشراء' })}</h1>
      
      <AnimatePresence>
        {checkoutError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-red-700">{checkoutError}</div>
            <button onClick={() => setCheckoutError(null)} className="text-red-400 hover:text-red-500"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Delivery Method */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400 mb-3 block">{t({ en: 'Delivery Method', ar: 'طريقة التوصيل' })}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {deliveryMethods.filter(m => m.isPublished).map(method => (
                <button 
                  key={method.id}
                  onClick={() => setSelectedMethodId(method.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                    selectedMethodId === method.id ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="font-bold text-sm mb-1">{method.name}</div>
                  <div className="text-[10px] text-gray-500 line-clamp-1">{method.description}</div>
                  {method.requiresCoords && (
                    <div className="mt-2 flex items-center gap-1 text-[9px] text-emerald-600 font-bold">
                      <MapIcon className="w-3 h-3" />
                      {t({ en: 'Requires Map Pin', ar: 'يتطلب تحديد الموقع' })}
                    </div>
                  )}
                  {selectedMethodId === method.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Address Info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm md:text-base">{t({ en: 'Shipping Address', ar: 'عنوان الشحن' })}</h3>
            <button 
              onClick={() => setIsAddressDrawerOpen(true)}
              className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg"
            >
              <MapPin className="w-3 h-3" />
              {t({ en: 'Modify Address', ar: 'تعديل العنوان' })}
            </button>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 min-h-[60px]">
            {address ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-700 leading-relaxed font-medium">{address}</p>
                {coords && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    {t({ en: 'Map Location Set', ar: 'تم تحديد الموقع' })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">{t({ en: 'No address provided', ar: 'لم يتم توفير عنوان' })}</p>
            )}
          </div>

          <AddressDrawer 
            isOpen={isAddressDrawerOpen}
            onClose={() => setIsAddressDrawerOpen(false)}
            initialAddress={address}
            initialCoords={coords}
            initialDetails={addressDetails}
            t={t}
            onSave={async (newAddress, newCoords, _mode, details) => {
              setAddress(newAddress);
              setCoords(newCoords);
              setAddressDetails(details);
              if (details?.regionId) setSelectedRegionId(details.regionId);

              if (!user) {
                localStorage.setItem('kuzama_guest_address_data', JSON.stringify({
                  addressStr: newAddress,
                  coords: newCoords,
                  details: details
                }));
              } else if (profile) {
                try {
                  await updateDoc(doc(db, 'users', user.uid), cleanObject({
                    address: newAddress,
                    defaultLocation: newCoords,
                    addressMode: _mode,
                    addressDetails: details
                  }));
                } catch (e) {
                  console.error('Failed to update address profile', e);
                }
              }
            }}
          />
        </div>

        {/* Payment & Summary */}
        <div className={`grid grid-cols-1 ${!appSettings.whatsappOrders?.enabled ? 'md:grid-cols-2' : ''} gap-6`}>
          {!appSettings.whatsappOrders?.enabled && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-base mb-4">{t({ en: 'Payment Method', ar: 'طريقة الدفع' })}</h3>
              <div className="grid grid-cols-2 gap-3">
                {appSettings.paymentMethods.online && (
                  <button 
                    onClick={() => setPaymentMethod('online')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'online' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-[10px] font-bold">{t({ en: 'Online', ar: 'إلكتروني' })}</span>
                  </button>
                )}
                {appSettings.paymentMethods.cod && (
                  <button 
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'cod' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <Banknote className="w-6 h-6" />
                    <span className="text-[10px] font-bold">{t({ en: 'COD', ar: 'عند الاستلام' })}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-base mb-4">{t({ en: 'Order Summary', ar: 'ملخص الطلب' })}</h3>
            <div className="space-y-2 mb-4 max-h-[120px] overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="text-gray-500">{t(item.locals.name)} × {item.quantity}</span>
                  <span className="font-bold">{(item.price * item.quantity).toFixed(2)} {t(appSettings.currency?.symbol || config.currency.symbol)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="font-bold text-lg">{t({ en: 'Total', ar: 'المجموع' })}</span>
              <span className="font-bold text-lg text-emerald-600">{total.toFixed(2)} {t(appSettings.currency?.symbol || config.currency.symbol)}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-black text-white py-5 rounded-[24px] font-extrabold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-black/10 active:scale-[0.98]"
        >
          {loading ? t({ en: 'Processing...', ar: 'جاري المعالجة...' }) : 
           appSettings.whatsappOrders?.enabled ? (
             <>
               <MessageCircle className="w-5 h-5" />
               {t({ en: 'Order via WhatsApp', ar: 'الطلب عبر واتساب' })}
             </>
           ) :
           paymentMethod === 'online' ? t({ en: 'Pay Now', ar: 'ادفع الآن' }) :
           t({ en: 'Confirm Order', ar: 'تأكيد الطلب' })}
        </button>
      </div>
    </div>
  );
};

let recaptchaVerifier: RecaptchaVerifier | null = null;

const PhoneLogin = () => {
  const { signIn, signInWithPhone, verifyCode } = useContext(AuthContext);
  const { t, lang } = useContext(LanguageContext);
  const { appSettings } = useContext(SettingsContext);
  const [phoneNumber, setPhoneNumber] = useState(config.auth.defaultCountryCode);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initRecaptcha = () => {
    if (recaptchaVerifier) {
      try { recaptchaVerifier.clear(); } catch (e) {}
      recaptchaVerifier = null;
    }
    const container = document.getElementById('recaptcha-container');
    if (container) container.innerHTML = '';
    
    try {
      recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        badge: 'inline'
      });
    } catch (err) {
      console.error('Failed to init recaptcha', err);
    }
  };

  useEffect(() => {
    initRecaptcha();
    return () => {
      if (recaptchaVerifier) {
        try { recaptchaVerifier.clear(); } catch (e) {}
        recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      if (!recaptchaVerifier) {
        initRecaptcha();
      }

      await signInWithPhone(phoneNumber, recaptchaVerifier!);
      setStep('code');
    } catch (err: any) {
      console.error('Recaptcha init or sign in failed:', err);
      
      // On auth failure, clear and re-initialize the verifier
      initRecaptcha();

      let errorMessage = err.message || 'Failed to send code';
      if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Phone Authentication is not enabled in the Firebase Console. Please enable it under Authentication > Sign-in method.';
      } else if (err.message?.includes('already been rendered')) {
        errorMessage = 'reCAPTCHA error. Please refresh the page and try again.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyCode(verificationCode);
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-3xl border border-gray-100 shadow-xl mt-12">
      <div className="text-center mb-8">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl italic mx-auto mb-4"
          style={{ backgroundColor: config.theme.primary }}
        >
          {t(appSettings.appName).charAt(0)}
        </div>
        <h2 className="text-2xl font-bold">{t({ en: 'Sign In', ar: 'تسجيل الدخول' })}</h2>
        <p className="text-gray-400 text-sm mt-2">{t(appSettings.appDescription)}</p>
      </div>

      <div id="recaptcha-container" className="flex justify-center mb-6 overflow-hidden rounded-xl"></div>
      {step === 'phone' ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">{t({ en: 'Phone Number', ar: 'رقم الهاتف' })}</label>
            <input 
              type="tel" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+968 0000 0000"
              className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black transition-all"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? t({ en: 'Sending...', ar: 'جاري الإرسال...' }) : t({ en: 'Send Code', ar: 'إرسال الكود' })}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">{t({ en: 'Verification Code', ar: 'كود التحقق' })}</label>
            <input 
              type="text" 
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black transition-all text-center tracking-[1em] font-bold"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setStep('phone')}
              className="flex-1 py-4 bg-gray-100 text-black rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              {t({ en: 'Back', ar: 'رجوع' })}
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              {loading ? t({ en: 'Verifying...', ar: 'جاري التحقق...' }) : t({ en: 'Verify & Sign In', ar: 'التحقق والدخول' })}
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 pt-8 border-t border-gray-50 text-center">
        <p className="text-xs text-gray-400 mb-4">{t({ en: 'Or continue with', ar: 'أو المتابعة بواسطة' })}</p>
        <button 
          onClick={signIn}
          className="w-full py-3 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          <span className="text-sm font-bold">Google</span>
        </button>
      </div>
    </div>
  );
};

const DefaultAddressSection = ({ profile, t }: { profile: UserProfile, t: (ls: any) => string }) => {
  const [address, setAddress] = useState(profile.address || '');
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(profile.defaultLocation || null);
  const [addressMode, setAddressMode] = useState<'normal' | 'map'>(profile.addressMode || 'map');
  const [addressDetails, setAddressDetails] = useState<AddressDetails | undefined>(profile.addressDetails);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setAddress(profile.address || '');
      setCoords(profile.defaultLocation || null);
      setAddressMode(profile.addressMode || 'map');
      setAddressDetails(profile.addressDetails);
    }
  }, [profile]);

  const handleSave = async (newAddress: string, newCoords: { lat: number, lng: number } | null, mode: 'normal' | 'map', details?: AddressDetails) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), cleanObject({
        address: newAddress,
        defaultLocation: newCoords,
        addressMode: mode,
        addressDetails: details || null
      }));
      setAddress(newAddress);
      setCoords(newCoords);
      setAddressMode(mode);
      setAddressDetails(details);
      alert(t({ en: 'Default address saved!', ar: 'تم حفظ العنوان الافتراضي!' }));
    } catch (error) {
      console.error(error);
      alert(t({ en: 'Error saving address', ar: 'خطأ في حفظ العنوان' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg">{t({ en: 'Default Delivery Address', ar: 'عنوان التوصيل الافتراضي' })}</h3>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-2 rounded-xl transition-colors"
        >
          <MapPin className="w-3 h-3" />
          {t({ en: 'Change Default Address', ar: 'تغيير العنوان الافتراضي' })}
        </button>
      </div>

      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <p className="text-sm text-gray-600 leading-relaxed">
          {address || t({ en: 'No default address set', ar: 'لم يتم تعيين عنوان افتراضي' })}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {addressMode === 'map' && coords && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-white px-2 py-1 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-3 h-3" />
              {t({ en: 'Precise location set', ar: 'تم تحديد الموقع بدقة' })}
            </div>
          )}
          {addressMode === 'normal' && (
            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-white px-2 py-1 rounded-lg border border-blue-100">
              <Building2 className="w-3 h-3" />
              {t({ en: 'Structured Address', ar: 'عنوان مفصل' })}
            </div>
          )}
        </div>
      </div>

      <AddressDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        initialAddress={address}
        initialCoords={coords}
        initialMode={addressMode}
        initialDetails={addressDetails}
        t={t}
        onSave={handleSave}
      />
    </div>
  );
};

const ProfilePage = ({ 
  onNavigate, 
  openPageEditor,
  openNewPageEditor,
  allPages 
}: { 
  onNavigate: (page: string) => void,
  openPageEditor: (slug: string) => void,
  openNewPageEditor: () => void,
  allPages: any[]
}) => {
  const { user, profile, logout } = useContext(AuthContext);
  const { t, lang, setLang } = useContext(LanguageContext);
  const { appSettings } = useContext(SettingsContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as any) || 'info';
  const setActiveTab = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams);
  };
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ displayName: profile?.displayName || '', photoURL: user?.photoURL || '' });

  useEffect(() => {
    if (profile) {
      setEditData({ displayName: profile?.displayName || '', photoURL: user?.photoURL || '' });
    }
  }, [profile, user]);

  const handleUpdateProfile = async () => {
    try {
      await updateProfile(user, editData);
      setIsEditing(false);
      alert(t({ en: 'Profile updated!', ar: 'تم تحديث الملف الشخصي!' }));
    } catch (error) {
      alert('Error updating profile');
    }
  };

  if (!user || !profile) return <PhoneLogin />;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-32" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 md:mb-12 gap-4 md:gap-0">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-start">
          <div className="relative group">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-full overflow-hidden border-4 border-white shadow-lg shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL || undefined} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-10 h-10 m-5 md:w-12 md:h-12 md:m-6 text-gray-400" />
              )}
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute bottom-0 right-0 p-1.5 bg-black text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{user?.displayName || t({ en: 'User', ar: 'مستخدم' })}</h1>
            <p className="text-sm md:text-base text-gray-500">{user.email}</p>
            <div className="flex gap-2 mt-2 justify-center md:justify-start">
              <span className="px-2 py-0.5 md:px-3 md:py-1 bg-black text-white text-[8px] md:text-[10px] font-bold uppercase rounded-full">
                {profile.roles?.includes('admin') ? 'Admin' : profile.role}
              </span>
              {profile.isVerified && (
                <span className="px-2 py-0.5 md:px-3 md:py-1 bg-green-500 text-white text-[8px] md:text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  {t({ en: 'Verified', ar: 'موثق' })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-100 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
          <button 
            onClick={logout}
            className="p-2.5 md:p-3 bg-red-50 text-red-500 rounded-xl md:rounded-2xl hover:bg-red-100 transition-all"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsEditing(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 relative z-10 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">{t({ en: 'Edit Profile', ar: 'تعديل الملف الشخصي' })}</h3>
              <div className="space-y-4">
                <ImageUpload 
                  label="Profile Picture"
                  path={STORAGE_PATHS.AVATARS}
                  currentUrl={editData.photoURL || undefined}
                  onUpload={(url) => setEditData({ ...editData, photoURL: url })}
                />
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Display Name', ar: 'الاسم المستعار' })}</label>
                  <input 
                    type="text"
                    value={editData.displayName || ''}
                    onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                    className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold"
                  >
                    {t({ en: 'Cancel', ar: 'إلغاء' })}
                  </button>
                  <button 
                    onClick={handleUpdateProfile}
                    className="flex-1 py-3 bg-black text-white rounded-xl font-bold"
                  >
                    {t({ en: 'Save', ar: 'حفظ' })}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex border-b border-gray-100 mb-6 md:mb-8 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('info')}
          className={`px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'info' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
        >
          {t({ en: 'Info', ar: 'المعلومات' })}
        </button>
        {(profile.roles?.includes('store') || profile.roles?.includes('admin')) && appSettings.features?.marketplace && (
          <button 
            onClick={() => setActiveTab('store')}
            className={`px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'store' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
          >
            {t({ en: 'Store', ar: 'المتجر' })}
          </button>
        )}
        {(profile.roles?.includes('driver') || profile.roles?.includes('admin')) && appSettings.features?.drivers && (
          <button 
            onClick={() => setActiveTab('driver')}
            className={`px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'driver' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
          >
            {t({ en: 'Driver', ar: 'السائق' })}
          </button>
        )}
        {profile.roles?.includes('admin') && (
          <button 
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'admin' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
          >
            {t({ en: 'Admin', ar: 'المشرف' })}
          </button>
        )}
      </div>

      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4">{t({ en: 'Account Details', ar: 'تفاصيل الحساب' })}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t({ en: 'Display Name', ar: 'الاسم المعروض' })}</label>
                    <p className="font-medium">{user?.displayName || 'User'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t({ en: 'Email Address', ar: 'البريد الإلكتروني' })}</label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t({ en: 'Roles', ar: 'الأدوار' })}</label>
                    <div className="flex flex-wrap gap-1">
                      {profile.roles?.map(r => (
                        <span key={r} className="px-2 py-0.5 bg-gray-100 text-[8px] font-bold uppercase rounded-full">{r}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-4">{t({ en: 'Quick Actions', ar: 'إجراءات سريعة' })}</h3>
                  <div className="space-y-2">
                    <button onClick={() => onNavigate('orders')} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex items-center justify-between group transition-all">
                      <span className="text-sm font-medium">{t({ en: 'View My Orders', ar: 'عرض طلباتي' })}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-all" />
                    </button>
                    <button onClick={() => onNavigate('wishlist')} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex items-center justify-between group transition-all">
                      <span className="text-sm font-medium">{t({ en: 'My Wishlist', ar: 'قائمة أمنياتي' })}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-all" />
                    </button>
                    <button onClick={() => onNavigate('cart')} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex items-center justify-between group transition-all">
                      <span className="text-sm font-medium">{t({ en: 'Go to Shopping Cart', ar: 'الذهاب إلى سلة التسوق' })}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-all" />
                    </button>
                    {appSettings.features?.marketplace && !profile.roles?.includes('store') && (
                      <button onClick={() => setActiveTab('store')} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex items-center justify-between group transition-all text-emerald-600">
                        <span className="text-sm font-medium">{t({ en: 'Join as a Store', ar: 'انضم كمتجر' })}</span>
                        <ChevronRight className="w-4 h-4 text-emerald-300 group-hover:text-emerald-600 transition-all" />
                      </button>
                    )}
                    {appSettings.features?.drivers && !profile.roles?.includes('driver') && (
                      <button onClick={() => setActiveTab('driver')} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex items-center justify-between group transition-all text-blue-600">
                        <span className="text-sm font-medium">{t({ en: 'Join as a Driver', ar: 'انضم كسائق' })}</span>
                        <ChevronRight className="w-4 h-4 text-blue-300 group-hover:text-blue-600 transition-all" />
                      </button>
                    )}
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className="mt-6 w-full py-4 bg-red-50 text-red-500 rounded-xl font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t({ en: 'Sign Out', ar: 'تسجيل الخروج' })}
                </button>
              </div>
            </div>

            <DefaultAddressSection profile={profile} t={t} />
          </div>
        )}

        {activeTab === 'store' && (
          (profile.roles?.includes('store') || profile.roles?.includes('admin')) ? (
            <StoreDashboard />
          ) : appSettings.features?.marketplace ? (
            <StoreRegistration />
          ) : (
            <div className="text-center p-12 bg-gray-50 rounded-2xl text-gray-400 font-bold">{t({ en: 'Marketplace feature is currently disabled.', ar: 'ميزة السوق المتعدد معطلة حالياً.' })}</div>
          )
        )}

        {activeTab === 'driver' && (
          (profile.roles?.includes('driver') || profile.roles?.includes('admin')) ? (
            <DriverDashboard />
          ) : appSettings.features?.drivers ? (
            <DriverRegistration />
          ) : (
            <div className="text-center p-12 bg-gray-50 rounded-2xl text-gray-400 font-bold">{t({ en: 'Drivers feature is currently disabled.', ar: 'ميزة السائقين معطلة حالياً.' })}</div>
          )
        )}

        {activeTab === 'admin' && (
          <AdminPanel 
            setCurrentPage={onNavigate} 
            openPageEditor={openPageEditor}
            openNewPageEditor={openNewPageEditor}
            allPages={allPages} 
          />
        )}
      </motion.div>
    </div>
  );
};

const StoreRegistration = () => {
  const { user, profile } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { appSettings } = useContext(SettingsContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const storeId = user.uid;
      await setDoc(doc(db, 'stores', storeId), {
        id: storeId,
        ownerId: user.uid,
        name: formData.name,
        description: formData.description,
        location: formData.location,
        isVerified: false,
        locals: {
          name: { en: formData.name, ar: formData.name },
          description: { en: formData.description, ar: formData.description }
        },
        createdAt: serverTimestamp()
      });
      if (profile.roles?.includes('admin')) {
        // Admins don't change role, just add to roles if not present
        if (!profile.roles.includes('store')) {
          await updateDoc(doc(db, 'users', user.uid), { roles: [...profile.roles, 'store'] });
        }
      } else {
        await updateDoc(doc(db, 'users', user.uid), { role: 'store', roles: [...(profile.roles || []), 'store'] });
      }
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Error registering store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
          <StoreIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">{t({ en: 'Register as a Store', ar: 'التسجيل كمتجر' })}</h2>
        <p className="text-gray-500 text-sm mt-2">{t({ en: `Start selling your products on ${t(appSettings.appName)} today.`, ar: `ابدأ ببيع منتجاتك على ${t(appSettings.appName)} اليوم.` })}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t({ en: 'Store Name', ar: 'اسم المتجر' })}</label>
          <input 
            required
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black"
            placeholder={t({ en: 'Enter store name', ar: 'أدخل اسم المتجر' })}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t({ en: 'Description', ar: 'الوصف' })}</label>
          <textarea 
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black min-h-[100px]"
            placeholder={t({ en: 'Tell us about your store', ar: 'أخبرنا عن متجرك' })}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t({ en: 'Location', ar: 'الموقع' })}</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              required
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-4 pl-12 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black"
              placeholder={t({ en: 'Store address', ar: 'عنوان المتجر' })}
            />
          </div>
        </div>
        <button 
          disabled={loading}
          className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          {loading ? t({ en: 'Processing...', ar: 'جاري المعالجة...' }) : t({ en: 'Register Store', ar: 'تسجيل المتجر' })}
        </button>
      </form>
    </div>
  );
};

const ImageUpload = ({ 
  onUpload, 
  currentUrl, 
  path, 
  label 
}: { 
  onUpload: (url: string) => void, 
  currentUrl?: string, 
  path: string, 
  label: string 
}) => {
  const { t } = useContext(LanguageContext);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const url = await uploadImage(file, `${path}/${fileName}`);
      onUpload(url);
    } catch (error: any) {
      console.error('Upload error:', error);
      let errorMessage = 'Failed to upload image';
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Unauthorized: Please check your Firebase Storage rules.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload canceled.';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'Firebase Storage bucket not found. Please enable it in the Firebase Console.';
      }
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: label, ar: label })}</label>
      <div className="flex items-center gap-4">
        {currentUrl && (
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img src={currentUrl || undefined} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}
        <label className={`flex-1 cursor-pointer p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-black transition-all flex items-center justify-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-500">
            {uploading ? t({ en: 'Uploading...', ar: 'جاري الرفع...' }) : t({ en: 'Choose Image', ar: 'اختر صورة' })}
          </span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>
    </div>
  );
};

const DriverRegistration = () => {
  const { user, profile } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { appSettings } = useContext(SettingsContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicleInfo: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const driverId = user.uid;
      await setDoc(doc(db, 'drivers', driverId), {
        id: driverId,
        userId: user.uid,
        vehicleInfo: formData.vehicleInfo,
        isVerified: false,
        status: 'available',
        createdAt: serverTimestamp()
      });
      if (profile.roles?.includes('admin')) {
        // Admins don't change role, just add to roles if not present
        if (!profile.roles.includes('driver')) {
          await updateDoc(doc(db, 'users', user.uid), { roles: [...profile.roles, 'driver'] });
        }
      } else {
        await updateDoc(doc(db, 'users', user.uid), { role: 'driver', roles: [...(profile.roles || []), 'driver'] });
      }
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Error registering driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">{t({ en: 'Become a Driver', ar: 'كن سائقاً' })}</h2>
        <p className="text-gray-500 text-sm mt-2">{t({ en: `Deliver orders and earn money with ${t(appSettings.appName)}.`, ar: `قم بتوصيل الطلبات واكسب المال مع ${t(appSettings.appName)}.` })}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t({ en: 'Vehicle Information', ar: 'معلومات المركبة' })}</label>
          <textarea 
            required
            value={formData.vehicleInfo}
            onChange={(e) => setFormData({ ...formData, vehicleInfo: e.target.value })}
            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black min-h-[100px]"
            placeholder={t({ en: 'Car model, plate number, etc.', ar: 'موديل السيارة، رقم اللوحة، إلخ.' })}
          />
        </div>
        <button 
          disabled={loading}
          className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          {loading ? t({ en: 'Processing...', ar: 'جاري المعالجة...' }) : t({ en: 'Register as Driver', ar: 'التسجيل كسائق' })}
        </button>
      </form>
    </div>
  );
};
const StoreDashboard = () => {
  const { user, profile } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { appSettings } = useContext(SettingsContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', brand: '', description: '', price: 0, discount: 0, categories: [], tags: [], image: '', stock: 10, hasVariants: false, variants: [],
    locals: { name: { en: '', ar: '' }, description: { en: '', ar: '' } }
  });
  const [storeData, setStoreData] = useState<Partial<Store>>({});

  useEffect(() => {
    if (store) {
      setStoreData({
        name: store.name,
        description: store.description,
        location: store.location,
        logoUrl: store.logoUrl,
        bannerUrl: store.bannerUrl,
        isDefault: store.isDefault,
        locals: store.locals
      });
    }
  }, [store]);

  const handleUpdateStore = async () => {
    if (!store) return;
    try {
      if (storeData.isDefault && !store.isDefault) {
        // Unset other defaults if this one is being set as default
        const storesRef = collection(db, 'stores');
        const q = query(storesRef, where('isDefault', '==', true));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          if (d.id !== store.id) {
            await updateDoc(doc(db, 'stores', d.id), { isDefault: false });
          }
        }
      }
      await updateDoc(doc(db, 'stores', store.id), storeData);
      setShowSettings(false);
      alert(t({ en: 'Store settings updated!', ar: 'تم تحديث إعدادات المتجر!' }));
    } catch (error) {
      console.error('Error updating store:', error);
      alert('Error updating store');
    }
  };
  const [variantAttributes, setVariantAttributes] = useState<{ type: string, values: string[] }[]>([]);

  const generateVariants = () => {
    if (variantAttributes.length === 0) return;

    const combinations = (arrays: string[][]): string[][] => {
      return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]] as string[][]);
    };

    const attributeValues = variantAttributes.map(attr => attr.values);
    const allCombinations = combinations(attributeValues);

    const generatedVariants: ProductVariant[] = allCombinations.map(combo => {
      const name = combo.join(' / ');
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: { en: name, ar: name },
        price: newProduct.price || 0,
        stock: newProduct.stock || 0,
        attributes: variantAttributes.reduce((acc, attr, idx) => ({ ...acc, [attr.type]: combo[idx] }), {})
      };
    });

    setNewProduct({ ...newProduct, variants: [...(newProduct.variants || []), ...generatedVariants] });
    setVariantAttributes([]);
  };

  useEffect(() => {
    if (!user || !profile) return;
    const storeId = profile.roles?.includes('admin') ? 'default-store' : user.uid;
    
    const unsubStore = onSnapshot(doc(db, 'stores', storeId), (snap) => {
      if (snap.exists()) {
        setStore({ id: snap.id, ...snap.data() } as Store);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `stores/${storeId}`));

    const q = query(collection(db, 'products'), where('storeId', '==', storeId));
    const unsubProducts = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));

    const unsubTags = onSnapshot(collection(db, 'tags'), (snap) => {
      setTags(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tags'));

    return () => {
      unsubStore();
      unsubProducts();
      unsubCats();
      unsubTags();
    };
  }, [user, profile]);

  const handleSave = async () => {
    if (!user || !profile) return;
    const storeId = profile.roles?.includes('admin') ? 'default-store' : user.uid;
    try {
      const productData = {
        ...newProduct,
        storeId,
        status: profile.roles?.includes('admin') ? 'published' : 'review',
        locals: {
          name: { en: newProduct.locals?.name.en || newProduct.name || '', ar: newProduct.locals?.name.ar || newProduct.name || '' },
          description: { en: newProduct.locals?.description.en || newProduct.description || '', ar: newProduct.locals?.description.ar || newProduct.description || '' }
        },
        createdAt: serverTimestamp()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      setShowAdd(false);
      setEditingProduct(null);
      setNewProduct({ name: '', brand: '', description: '', price: 0, discount: 0, categories: [], tags: [], image: '', stock: 10, hasVariants: false, variants: [] });
    } catch (error) {
      alert('Error saving product');
    }
  };

  return (
    <div className="space-y-6">
      {store?.adminMessage && (
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">{t({ en: 'Message from Admin', ar: 'رسالة من الإدارة' })}</p>
            <p className="text-sm text-orange-900 font-medium">{store.adminMessage}</p>
          </div>
        </div>
      )}

        <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">{t({ en: 'My Products', ar: 'منتجاتي' })}</h2>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setNewProduct({ 
              name: '', brand: '', description: '', price: 0, discount: 0, categories: [], tags: [], image: '', stock: 10, hasVariants: false, variants: [],
              locals: { name: { en: '', ar: '' }, description: { en: '', ar: '' } }
            });
            setVariantAttributes([]);
            setShowAdd(true);
          }}
          className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t({ en: 'Add Product', ar: 'إضافة منتج' })}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 relative group">
            <img src={product.image || undefined} alt={product.name} className="w-20 h-20 rounded-xl object-cover" referrerPolicy="no-referrer" />
            <div className="flex-1">
              <h4 className="font-bold">{t(product.locals.name)}</h4>
              <p className="text-xs text-gray-500">{product.brand}</p>
              <p className="font-bold mt-1">{product.price} {t(appSettings.currency?.symbol || config.currency.symbol)}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  product.status === 'published' ? 'bg-green-100 text-green-600' :
                  product.status === 'review' ? 'bg-orange-100 text-orange-600' :
                  product.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {product.status || 'draft'}
                </span>
                {product.status === 'draft' && (
                  <button 
                    onClick={async () => {
                      await updateDoc(doc(db, 'products', product.id), { status: 'review' });
                    }}
                    className="text-[10px] font-bold text-blue-500 hover:underline"
                  >
                    {t({ en: 'Submit for Review', ar: 'إرسال للمراجعة' })}
                  </button>
                )}
              </div>
              {product.adminMessage && (
                <p className="text-[10px] text-red-500 mt-1 italic">
                  {t({ en: 'Admin:', ar: 'الإدارة:' })} {product.adminMessage}
                </p>
              )}
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                  setEditingProduct(product);
                  setNewProduct({
                    ...product,
                    locals: product.locals || { name: { en: product.name, ar: product.name }, description: { en: product.description, ar: product.description } }
                  });
                  setVariantAttributes([]);
                  setShowAdd(true);
                }}
                className="p-1.5 bg-white rounded-full shadow-sm text-blue-500 hover:bg-blue-50"
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-3xl p-8 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-2xl font-bold mb-6">{t({ en: 'Store Settings', ar: 'إعدادات المتجر' })}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Store Name (EN)', ar: 'اسم المتجر (EN)' })}</label>
                    <input 
                      type="text"
                      value={storeData.locals?.name.en || ''}
                      onChange={(e) => setStoreData({ ...storeData, name: e.target.value, locals: { ...storeData.locals!, name: { ...storeData.locals!.name, en: e.target.value } } })}
                      className="w-full p-4 bg-gray-50 rounded-xl border-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Store Name (AR)', ar: 'اسم المتجر (AR)' })}</label>
                    <input 
                      type="text"
                      value={storeData.locals?.name.ar || ''}
                      onChange={(e) => setStoreData({ ...storeData, locals: { ...storeData.locals!, name: { ...storeData.locals!.name, ar: e.target.value } } })}
                      className="w-full p-4 bg-gray-50 rounded-xl border-none text-right"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Location', ar: 'الموقع' })}</label>
                  <input 
                    type="text"
                    value={storeData.location || ''}
                    onChange={(e) => setStoreData({ ...storeData, location: e.target.value })}
                    className="w-full p-4 bg-gray-50 rounded-xl border-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUpload 
                    label="Store Logo"
                    path={STORAGE_PATHS.STORES}
                    currentUrl={storeData.logoUrl}
                    onUpload={(url) => setStoreData({ ...storeData, logoUrl: url })}
                  />
                  <ImageUpload 
                    label="Store Banner"
                    path={STORAGE_PATHS.STORES}
                    currentUrl={storeData.bannerUrl}
                    onUpload={(url) => setStoreData({ ...storeData, bannerUrl: url })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <StoreIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-bold">{t({ en: 'Default Store', ar: 'المتجر الافتراضي' })}</p>
                      <p className="text-[10px] text-gray-400">{t({ en: 'Set this as the primary store for the app', ar: 'تعيين هذا كمتجر أساسي للتطبيق' })}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStoreData({ ...storeData, isDefault: !storeData.isDefault })}
                    className={`w-12 h-6 rounded-full transition-all relative ${storeData.isDefault ? 'bg-black' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${storeData.isDefault ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold"
                  >
                    {t({ en: 'Cancel', ar: 'إلغاء' })}
                  </button>
                  <button 
                    onClick={handleUpdateStore}
                    className="flex-1 py-3 bg-black text-white rounded-xl font-bold"
                  >
                    {t({ en: 'Save Settings', ar: 'حفظ الإعدادات' })}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showAdd && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAdd(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-3xl p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold mb-6">{editingProduct ? t({ en: 'Edit Product', ar: 'تعديل المنتج' }) : t({ en: 'Add New Product', ar: 'إضافة منتج جديد' })}</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Product Name (English)', ar: 'اسم المنتج (إنجليزي)' })}</label>
                    <input 
                      type="text"
                      value={newProduct.locals?.name.en || ''} 
                      onChange={(e) => setNewProduct({...newProduct, locals: { ...newProduct.locals!, name: { ...newProduct.locals!.name, en: e.target.value } }, name: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-xl border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Product Name (Arabic)', ar: 'اسم المنتج (عربي)' })}</label>
                    <input 
                      type="text"
                      value={newProduct.locals?.name.ar || ''} 
                      onChange={(e) => setNewProduct({...newProduct, locals: { ...newProduct.locals!, name: { ...newProduct.locals!.name, ar: e.target.value } }})}
                      className="w-full p-4 bg-gray-50 rounded-xl border-none text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Description (English)', ar: 'الوصف (إنجليزي)' })}</label>
                    <textarea 
                      value={newProduct.locals?.description.en || ''} 
                      onChange={(e) => setNewProduct({...newProduct, locals: { ...newProduct.locals!, description: { ...newProduct.locals!.description, en: e.target.value } }, description: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-xl border-none min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Description (Arabic)', ar: 'الوصف (عربي)' })}</label>
                    <textarea 
                      value={newProduct.locals?.description.ar || ''} 
                      onChange={(e) => setNewProduct({...newProduct, locals: { ...newProduct.locals!, description: { ...newProduct.locals!.description, ar: e.target.value } }})}
                      className="w-full p-4 bg-gray-50 rounded-xl border-none min-h-[100px] text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Price', ar: 'السعر' })}</label>
                    <input 
                      type="number"
                      value={newProduct.price || 0} onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                      className="w-full p-4 bg-gray-50 rounded-xl border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Discount %', ar: 'الخصم %' })}</label>
                    <input 
                      type="number"
                      value={newProduct.discount || 0} onChange={(e) => setNewProduct({...newProduct, discount: parseFloat(e.target.value) || 0})}
                      className="w-full p-4 bg-gray-50 rounded-xl border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Stock', ar: 'المخزون' })}</label>
                    <input 
                      type="number"
                      value={newProduct.stock || 0} onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                      className="w-full p-4 bg-gray-50 rounded-xl border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Brand', ar: 'الماركة' })}</label>
                    <input 
                      type="text"
                      value={newProduct.brand} onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-xl border-none"
                    />
                  </div>
                </div>

                <ImageUpload 
                  label="Product Image"
                  path={STORAGE_PATHS.PRODUCTS}
                  currentUrl={newProduct.image || undefined}
                  onUpload={(url) => setNewProduct({ ...newProduct, image: url })}
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Categories', ar: 'الفئات' })}</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          const cats = newProduct.categories || [];
                          if (cats.includes(cat.id)) {
                            setNewProduct({...newProduct, categories: cats.filter(id => id !== cat.id)});
                          } else {
                            setNewProduct({...newProduct, categories: [...cats, cat.id]});
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          newProduct.categories?.includes(cat.id) ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {t(cat.locals.title)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">{t({ en: 'Tags (Public Only)', ar: 'الوسوم (العامة فقط)' })}</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.filter(t => t.isPublic).map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          const tgs = newProduct.tags || [];
                          if (tgs.includes(tag.id)) {
                            setNewProduct({...newProduct, tags: tgs.filter(id => id !== tag.id)});
                          } else {
                            setNewProduct({...newProduct, tags: [...tgs, tag.id]});
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          newProduct.tags?.includes(tag.id) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {t(tag.title)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm">{t({ en: 'Product Variants', ar: 'أنواع المنتج' })}</h4>
                    <button 
                      onClick={() => setNewProduct({...newProduct, hasVariants: !newProduct.hasVariants, variants: []})}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${newProduct.hasVariants ? 'bg-red-50 text-red-500' : 'bg-black text-white'}`}
                    >
                      {newProduct.hasVariants ? t({ en: 'Disable Variants', ar: 'تعطيل الأنواع' }) : t({ en: 'Enable Variants', ar: 'تفعيل الأنواع' })}
                    </button>
                  </div>

                  {newProduct.hasVariants && (
                    <div className="space-y-4">
                      {/* Variant Generator */}
                      <div className="bg-blue-50 p-4 rounded-2xl space-y-4">
                        <h5 className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t({ en: 'Variant Generator', ar: 'مولد الأنواع' })}</h5>
                        <div className="space-y-3">
                          {variantAttributes.map((attr, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                              <div className="flex-1 space-y-2">
                                <input 
                                  placeholder={t({ en: 'Attribute (e.g. Size)', ar: 'السمة (مثل الحجم)' })}
                                  className="w-full p-2 text-xs bg-white rounded-lg border-none"
                                  value={attr.type}
                                  onChange={(e) => {
                                    const newAttrs = [...variantAttributes];
                                    newAttrs[idx].type = e.target.value;
                                    setVariantAttributes(newAttrs);
                                  }}
                                />
                                <input 
                                  placeholder={t({ en: 'Values (comma separated)', ar: 'القيم (مفصولة بفاصلة)' })}
                                  className="w-full p-2 text-xs bg-white rounded-lg border-none"
                                  value={attr.values.join(',')}
                                  onChange={(e) => {
                                    const newAttrs = [...variantAttributes];
                                    newAttrs[idx].values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                                    setVariantAttributes(newAttrs);
                                  }}
                                />
                              </div>
                              <button 
                                onClick={() => setVariantAttributes(variantAttributes.filter((_, i) => i !== idx))}
                                className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setVariantAttributes([...variantAttributes, { type: '', values: [] }])}
                            className="flex-1 py-2 border-2 border-dashed border-blue-200 text-blue-500 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
                          >
                            <Plus className="w-3 h-3 inline mr-1" />
                            {t({ en: 'Add Attribute', ar: 'إضافة سمة' })}
                          </button>
                          {variantAttributes.length > 0 && (
                            <button 
                              onClick={generateVariants}
                              className="flex-1 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all"
                            >
                              {t({ en: 'Generate Combinations', ar: 'توليد التشكيلات' })}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{t({ en: 'Generated Variants', ar: 'الأنواع المولدة' })}</p>
                        <button 
                          onClick={() => setNewProduct({
                            ...newProduct, 
                            variants: [...(newProduct.variants || []), { id: Math.random().toString(36).substr(2, 9), name: { en: '', ar: '' }, price: newProduct.price || 0, stock: newProduct.stock || 0, attributes: {} }]
                          })}
                          className="text-xs font-bold text-black flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          {t({ en: 'Add Manually', ar: 'إضافة يدوياً' })}
                        </button>
                      </div>

                      {newProduct.variants?.map((variant, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-2xl space-y-3 relative">
                          <button 
                            onClick={() => {
                              const v = [...(newProduct.variants || [])];
                              v.splice(idx, 1);
                              setNewProduct({...newProduct, variants: v});
                            }}
                            className="absolute top-2 right-2 p-1 text-red-400 hover:bg-red-50 rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text" placeholder="Name (EN)"
                              value={variant.name.en}
                              onChange={(e) => {
                                const v = [...(newProduct.variants || [])];
                                v[idx].name.en = e.target.value;
                                setNewProduct({...newProduct, variants: v});
                              }}
                              className="w-full p-3 bg-white rounded-xl text-xs border-none"
                            />
                            <input 
                              type="text" placeholder="Name (AR)"
                              value={variant.name.ar}
                              onChange={(e) => {
                                const v = [...(newProduct.variants || [])];
                                v[idx].name.ar = e.target.value;
                                setNewProduct({...newProduct, variants: v});
                              }}
                              className="w-full p-3 bg-white rounded-xl text-xs border-none text-right"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="number" placeholder="Price"
                              value={variant.price || 0}
                              onChange={(e) => {
                                const v = [...(newProduct.variants || [])];
                                v[idx].price = parseFloat(e.target.value) || 0;
                                setNewProduct({...newProduct, variants: v});
                              }}
                              className="w-full p-3 bg-white rounded-xl text-xs border-none"
                            />
                            <input 
                              type="number" placeholder="Stock"
                              value={variant.stock || 0}
                              onChange={(e) => {
                                const v = [...(newProduct.variants || [])];
                                v[idx].stock = parseInt(e.target.value) || 0;
                                setNewProduct({...newProduct, variants: v});
                              }}
                              className="w-full p-3 bg-white rounded-xl text-xs border-none"
                            />
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const v = [...(newProduct.variants || [])];
                          v.push({ id: Math.random().toString(36).substr(2, 9), name: { en: '', ar: '' }, price: newProduct.price || 0, stock: 10, attributes: {} });
                          setNewProduct({...newProduct, variants: v});
                        }}
                        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-400 hover:border-black hover:text-black transition-all"
                      >
                        + {t({ en: 'Add Variant', ar: 'إضافة نوع' })}
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl active:scale-[0.98]"
                >
                  {editingProduct ? t({ en: 'Update Product', ar: 'تحديث المنتج' }) : t({ en: 'Create Product', ar: 'إنشاء المنتج' })}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mt-12 pt-12 border-t border-gray-100">
        <OrdersList 
          storeId={store?.id || (profile?.roles?.includes('admin') ? 'default-store' : user?.uid)}
          title={t({ en: 'Store Orders', ar: 'طلبات المتجر' })}
          features={{
            canChangeStatus: true,
            canContactCustomer: true
          }}
          showCustomerDetails={true}
        />
      </div>
    </div>
  );
};

const DeliveryTracker = ({ driverId, destinationCoords }: { driverId: string, destinationCoords?: { lat: number, lng: number } }) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const { t } = useContext(LanguageContext);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'drivers', driverId), (snap) => {
      if (snap.exists()) {
        setDriver({ id: snap.id, ...snap.data() } as Driver);
      }
    });
    return unsub;
  }, [driverId]);

  if (!driver || !driver.currentLocation) {
    return (
      <div className="h-48 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 text-sm italic">
        <div className="flex flex-col items-center gap-2">
          <Navigation className="w-6 h-6 animate-pulse" />
          {t({ en: 'Waiting for driver location...', ar: 'بانتظار موقع السائق...' })}
        </div>
      </div>
    );
  }

  const driverPos: [number, number] = [driver.currentLocation.lat, driver.currentLocation.lng];
  const destPos: [number, number] | null = destinationCoords ? [destinationCoords.lat, destinationCoords.lng] : null;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distance = destPos ? calculateDistance(driverPos[0], driverPos[1], destPos[0], destPos[1]) : null;
  const estimatedTime = distance ? Math.round(distance / 0.5) : null; // Assuming 30km/h average

  return (
    <div className="space-y-4">
      {estimatedTime !== null && (
        <div className="bg-emerald-50 p-4 rounded-2xl flex items-center justify-between border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t({ en: 'Estimated Arrival', ar: 'الوصول المتوقع' })}</p>
              <p className="text-lg font-bold text-emerald-900">{estimatedTime} {t({ en: 'mins', ar: 'دقيقة' })}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t({ en: 'Distance', ar: 'المسافة' })}</p>
            <p className="text-sm font-bold text-emerald-900">{distance?.toFixed(1)} km</p>
          </div>
        </div>
      )}
      
      <div className="h-64 rounded-2xl overflow-hidden border border-gray-100 shadow-inner relative z-0">
        <MapContainer center={driverPos} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={driverPos}>
            <Popup>
              <div className="text-xs font-bold">
                {t({ en: 'Driver is here', ar: 'السائق هنا' })}
              </div>
            </Popup>
          </Marker>
          {destPos && (
            <Marker position={destPos}>
              <Popup>
                <div className="text-xs font-bold">
                  {t({ en: 'Your Location', ar: 'موقعك' })}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

const DriverDashboard = () => {
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('driverId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const fetchedOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      
      // Auto-enable tracking if any order is picked up
      const hasActiveDelivery = fetchedOrders.some(o => o.deliveryStatus === 'picked_up');
      setIsTracking(hasActiveDelivery);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user || !isTracking) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await updateDoc(doc(db, 'drivers', user.uid), {
            currentLocation: {
              lat: latitude,
              lng: longitude,
              updatedAt: serverTimestamp()
            }
          });
        } catch (error) {
          console.error('Error updating location:', error);
        }
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, isTracking]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t({ en: 'Delivery Assignments', ar: 'مهام التوصيل' })}</h2>
      <OrdersList 
        driverId={user?.uid} 
        emptyMessage={t({ en: 'No orders assigned yet.', ar: 'لا توجد طلبات مسندة بعد.' })}
        features={{ canChangeDeliveryStatus: true, canContactCustomer: true }}
        showCustomerDetails={true}
      />
    </div>
  );
};

const OrderStatusBadge = ({ status, deliveryStatus, t }: { status: string, deliveryStatus?: string, t: any }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'paid': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: { en: 'Paid', ar: 'مدفوع' } };
      case 'processing': return { bg: 'bg-blue-100', text: 'text-blue-700', label: { en: 'Processing', ar: 'قيد التنفيذ' } };
      case 'shipped': return { bg: 'bg-purple-100', text: 'text-purple-700', label: { en: 'Shipped', ar: 'تم الشحن' } };
      case 'delivered': return { bg: 'bg-green-100', text: 'text-green-700', label: { en: 'Delivered', ar: 'تم التوصيل' } };
      case 'failed': return { bg: 'bg-rose-100', text: 'text-rose-700', label: { en: 'Failed', ar: 'فشل' } };
      default: return { bg: 'bg-amber-100', text: 'text-amber-700', label: { en: 'Pending', ar: 'معلق' } };
    }
  };

  const getDeliveryConfig = () => {
    switch (deliveryStatus) {
      case 'assigned': return { bg: 'bg-indigo-100', text: 'text-indigo-700', label: { en: 'Driver Assigned', ar: 'تم تعيين سائق' } };
      case 'picked_up': return { bg: 'bg-cyan-100', text: 'text-cyan-700', label: { en: 'Picked Up', ar: 'تم الاستلام' } };
      case 'delivered': return { bg: 'bg-green-100', text: 'text-green-700', label: { en: 'Delivered', ar: 'تم التوصيل' } };
      default: return null;
    }
  };

  const sc = getStatusConfig();
  const dc = getDeliveryConfig();

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text}`}>
        {t(sc.label)}
      </span>
      {dc && (
        <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${dc.bg} ${dc.text}`}>
          {t(dc.label)}
        </span>
      )}
    </div>
  );
};

const RegionsManagement = () => {
  const { t, lang } = useContext(LanguageContext);
  const { regions, addRegion, updateRegion, deleteRegion } = useRegions();
  const [showAdd, setShowAdd] = useState(false);

  const seedOmanRegions = async () => {
    const omanRegions = [
      { name: 'Muscat (مسقط)', type: 'geozone' as const, coordinates: [{ lat: 23.61, lng: 58.59 }, { lat: 23.65, lng: 58.65 }, { lat: 23.55, lng: 58.65 }] },
      { name: 'Dhofar (ظفار)', type: 'geozone' as const, coordinates: [{ lat: 17.02, lng: 54.09 }, { lat: 17.12, lng: 54.19 }, { lat: 16.92, lng: 54.19 }] },
      { name: 'Musandam (مسندم)', type: 'geozone' as const, coordinates: [{ lat: 26.15, lng: 56.24 }, { lat: 26.25, lng: 56.34 }, { lat: 26.05, lng: 56.34 }] },
      { name: 'Buraimi (البريمي)', type: 'geozone' as const, coordinates: [{ lat: 24.25, lng: 55.75 }, { lat: 24.35, lng: 55.85 }, { lat: 24.15, lng: 55.85 }] },
      { name: 'Dakhiliyah (الداخلية)', type: 'geozone' as const, coordinates: [{ lat: 22.93, lng: 57.53 }, { lat: 23.03, lng: 57.63 }, { lat: 22.83, lng: 57.63 }] },
      { name: 'North Batinah (شمال الباطنة)', type: 'geozone' as const, coordinates: [{ lat: 24.34, lng: 56.74 }, { lat: 24.44, lng: 56.84 }, { lat: 24.24, lng: 56.84 }] },
      { name: 'South Batinah (جنوب الباطنة)', type: 'geozone' as const, coordinates: [{ lat: 23.63, lng: 57.43 }, { lat: 23.73, lng: 57.53 }, { lat: 23.53, lng: 57.53 }] },
      { name: 'North Sharqiyah (شمال الشرقية)', type: 'geozone' as const, coordinates: [{ lat: 22.75, lng: 58.55 }, { lat: 22.85, lng: 58.65 }, { lat: 22.65, lng: 58.65 }] },
      { name: 'South Sharqiyah (جنوب الشرقية)', type: 'geozone' as const, coordinates: [{ lat: 22.56, lng: 59.52 }, { lat: 22.66, lng: 59.62 }, { lat: 22.46, lng: 59.62 }] },
      { name: 'Dhahirah (الظاهرة)', type: 'geozone' as const, coordinates: [{ lat: 23.23, lng: 56.51 }, { lat: 23.33, lng: 56.61 }, { lat: 23.13, lng: 56.61 }] },
      { name: 'Wusta (الوسطى)', type: 'geozone' as const, coordinates: [{ lat: 20.0, lng: 56.5 }, { lat: 20.1, lng: 56.6 }, { lat: 19.9, lng: 56.6 }] }
    ];

    try {
      for (const region of omanRegions) {
        await addRegion(region);
      }
      alert('Oman regions seeded successfully');
    } catch (error) {
      console.error(error);
      alert('Error seeding regions');
    }
  };

  const [editing, setEditing] = useState<Region | null>(null);
  const [newRegion, setNewRegion] = useState<Partial<Region>>({ name: '', type: 'geozone', coordinates: [] });
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        if (newRegion.type === 'rectangle' && newRegion.coordinates?.length === 2) {
          setNewRegion({ ...newRegion, coordinates: [e.latlng] });
        } else {
          setNewRegion({ ...newRegion, coordinates: [...(newRegion.coordinates || []), e.latlng] });
        }
      },
    });
    return (
      <>
        {newRegion.coordinates?.map((c, i) => (
          <Marker key={i} position={c} />
        ))}
        {newRegion.type === 'geozone' && newRegion.coordinates && newRegion.coordinates.length > 2 && (
          <Polygon positions={newRegion.coordinates as any} color="emerald" />
        )}
        {newRegion.type === 'rectangle' && newRegion.coordinates && newRegion.coordinates.length === 2 && (
          <Rectangle bounds={newRegion.coordinates as any} color="emerald" />
        )}
      </>
    );
  };

  const handleSave = async () => {
    console.log('Attempting to save region:', newRegion);
    if (!newRegion.name || !newRegion.coordinates?.length) {
      console.error('Validation failed: name or coordinates missing', { name: newRegion.name, coords: newRegion.coordinates });
      return;
    }
    try {
      if (editing) {
        await updateRegion(editing.id, newRegion);
      } else {
        await addRegion(newRegion as any);
      }
      setShowAdd(false);
      setEditing(null);
      setNewRegion({ name: '', type: 'geozone', coordinates: [] });
    } catch (error) {
      console.error('Error saving region:', error);
      alert('Error saving region: ' + error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t({ en: 'Regions Management', ar: 'إدارة المناطق' })}</h2>
        <div className="flex gap-2">
          <button 
            onClick={seedOmanRegions}
            className="text-black bg-gray-100 px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-200"
          >
            <Sparkles className="w-4 h-4" />
            {t({ en: 'Seed Oman', ar: 'تعبئة عمان' })}
          </button>
          <button 
            onClick={() => {
              setEditing(null);
              setNewRegion({ name: '', type: 'geozone', coordinates: [] });
              setShowAdd(true);
            }}
            className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t({ en: 'Add Region', ar: 'إضافة منطقة' })}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t({ en: 'Region Name', ar: 'اسم المنطقة' })}</label>
              <input 
                type="text" value={newRegion.name} onChange={(e) => setNewRegion({ ...newRegion, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t({ en: 'Type', ar: 'النوع' })}</label>
              <select 
                value={newRegion.type} onChange={(e) => setNewRegion({ ...newRegion, type: e.target.value as any, coordinates: [] })}
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black"
              >
                <option value="geozone">{t({ en: 'Geozone (Polygon)', ar: 'منطقة جغرافية (مضلع)' })}</option>
                <option value="rectangle">{t({ en: 'Rectangle (Bounds)', ar: 'مستطيل (حدود)' })}</option>
              </select>
            </div>
          </div>

          <div className="h-80 rounded-2xl overflow-hidden border border-gray-100">
            <MapContainer 
              center={config.map.defaultCenter} 
              zoom={config.map.defaultZoom} 
              style={{ height: '100%', width: '100%' }}
              ref={setMapInstance}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapEvents />
            </MapContainer>
          </div>
          <p className="text-xs text-gray-400">{t({ en: 'Click on map to add points. Rectangle needs 2 points.', ar: 'اضغط على الخريطة لإضافة نقاط. المستطيل يحتاج نقطتين.' })}</p>

          <div className="flex gap-4">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-3 bg-gray-100 rounded-2xl text-sm font-bold">{t({ en: 'Cancel', ar: 'إلغاء' })}</button>
            <button onClick={handleSave} className="flex-1 py-3 bg-black text-white rounded-2xl text-sm font-bold">{t({ en: 'Save', ar: 'حفظ' })}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions.map(region => (
          <div key={region.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-bold">{region.name}</h3>
              <p className="text-xs text-gray-400 uppercase font-medium">{region.type}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setEditing(region);
                  setNewRegion(region);
                  setShowAdd(true);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400" />
              </button>
              <button onClick={() => deleteRegion(region.id)} className="p-2 hover:bg-red-50 rounded-full transition-colors">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DeliveryMethodsManagement = ({ categories, showMatrixEditor = true }: { categories: Category[]; showMatrixEditor?: boolean }) => {
  const { t } = useContext(LanguageContext);
  const { regions } = useRegions();
  const { deliveryMethods, addDeliveryMethod, updateDeliveryMethod, deleteDeliveryMethod, setDefaultMethod } = useDeliveryMethods();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<DeliveryMethod | null>(null);
  const [newMethod, setNewMethod] = useState<Partial<DeliveryMethod>>({
    name: '', description: '', isDefault: false, isPublished: true, categories: [], priceMatrix: {}
  });

  const handleSave = async () => {
    if (!newMethod.name) return;
    try {
      if (editing) {
        await updateDeliveryMethod(editing.id, newMethod);
      } else {
        await addDeliveryMethod(newMethod as any);
      }
      setShowAdd(false);
      setEditing(null);
      setNewMethod({ name: '', description: '', isDefault: false, isPublished: true, categories: [], priceMatrix: {} });
    } catch (error) {
      alert('Error saving delivery method');
    }
  };

  const updatePrice = (sourceId: string, destId: string, price: number) => {
    const matrix = { ...(newMethod.priceMatrix || {}) };
    if (!matrix[sourceId]) matrix[sourceId] = {};
    matrix[sourceId][destId] = price;
    setNewMethod({ ...newMethod, priceMatrix: matrix });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t({ en: 'Delivery Methods', ar: 'طرق التوصيل' })}</h2>
        <button 
          onClick={() => {
            setEditing(null);
            setNewMethod({ name: '', description: '', isDefault: false, isPublished: true, categories: [], priceMatrix: {} });
            setShowAdd(true);
          }}
          className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t({ en: 'Add Method', ar: 'إضافة طريقة' })}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t({ en: 'Method Name', ar: 'اسم الطريقة' })}</label>
              <input 
                type="text" value={newMethod.name} onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t({ en: 'Description', ar: 'الوصف' })}</label>
              <input 
                type="text" value={newMethod.description} onChange={(e) => setNewMethod({ ...newMethod, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t({ en: 'Applicable Categories', ar: 'الأقسام المطبقة' })}</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    const cats = [...(newMethod.categories || [])];
                    if (cats.includes(cat.id)) {
                      setNewMethod({ ...newMethod, categories: cats.filter(id => id !== cat.id) });
                    } else {
                      setNewMethod({ ...newMethod, categories: [...cats, cat.id] });
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    newMethod.categories?.includes(cat.id) ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {t(cat.locals.title)}
                </button>
              ))}
            </div>
          </div>

          {showMatrixEditor && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-4">{t({ en: 'Price Matrix (Source to Destination)', ar: 'مصفوفة الأسعار (من المصدر إلى الوجهة)' })}</label>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 border-b text-left">{t({ en: 'From \\ To', ar: 'من \\ إلى' })}</th>
                      {regions.map(r => <th key={r.id} className="p-2 border-b text-center">{r.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {regions.map(source => (
                      <tr key={source.id}>
                        <td className="p-2 border-b font-bold">{source.name}</td>
                        {regions.map(dest => (
                          <td key={dest.id} className="p-2 border-b text-center">
                            <input 
                              type="number" 
                              value={newMethod.priceMatrix?.[source.id]?.[dest.id] || 0}
                              onChange={(e) => updatePrice(source.id, dest.id, parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 bg-gray-50 rounded-lg text-center outline-none focus:ring-2 focus:ring-black"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" checked={newMethod.isPublished} onChange={(e) => setNewMethod({ ...newMethod, isPublished: e.target.checked })}
                className="w-4 h-4 accent-black"
              />
              <span className="text-sm font-bold">{t({ en: 'Published', ar: 'منشور' })}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" checked={newMethod.isDefault} onChange={(e) => setNewMethod({ ...newMethod, isDefault: e.target.checked })}
                className="w-4 h-4 accent-black"
              />
              <span className="text-sm font-bold">{t({ en: 'Default Method', ar: 'الطريقة الافتراضية' })}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" checked={newMethod.requiresCoords} onChange={(e) => setNewMethod({ ...newMethod, requiresCoords: e.target.checked })}
                className="w-4 h-4 accent-black"
              />
              <span className="text-sm font-bold text-emerald-600">{t({ en: 'Requires Map Pin', ar: 'يتطلب تحديد الموقع' })}</span>
            </label>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-3 bg-gray-100 rounded-2xl text-sm font-bold">{t({ en: 'Cancel', ar: 'إلغاء' })}</button>
            <button onClick={handleSave} className="flex-1 py-3 bg-black text-white rounded-2xl text-sm font-bold">{t({ en: 'Save', ar: 'حفظ' })}</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {deliveryMethods.map(method => (
          <div key={method.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${method.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{method.name}</h3>
                  {method.requiresCoords && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full uppercase ml-1">{t({ en: 'Map Required', ar: 'يتطلب خريطة' })}</span>}
                  {method.isDefault && <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded-full uppercase">{t({ en: 'Default', ar: 'افتراضي' })}</span>}
                </div>
                <p className="text-sm text-gray-500">{method.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {method.categories.map(catId => {
                    const cat = categories.find(c => c.id === catId);
                    return cat ? (
                      <span key={catId} className="px-2 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-lg border border-gray-100">
                        {t(cat.locals.title)}
                      </span>
                    ) : null;
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {method.categories.length} {t({ en: 'categories', ar: 'أقسام' })} • {Object.keys(method.priceMatrix).length} {t({ en: 'regions', ar: 'مناطق' })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {!method.isDefault && (
                <button 
                  onClick={() => setDefaultMethod(method.id)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full text-xs font-bold transition-all"
                >
                  {t({ en: 'Set Default', ar: 'تعيين كافتراضي' })}
                </button>
              )}
              <button 
                onClick={() => {
                  setEditing(method);
                  setNewMethod(method);
                  setShowAdd(true);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
              <button onClick={() => deleteDeliveryMethod(method.id)} className="p-2 hover:bg-red-50 rounded-full transition-colors">
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DeliveryMatrixRecordsManagement = () => {
  const { t } = useContext(LanguageContext);
  const { regions } = useRegions();
  const { deliveryMethods, updateDeliveryMethod } = useDeliveryMethods();
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [sourceRegionId, setSourceRegionId] = useState('');
  const [destinationRegionId, setDestinationRegionId] = useState('');
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    if (!selectedMethodId && deliveryMethods.length > 0) {
      setSelectedMethodId(deliveryMethods[0].id);
    }
  }, [deliveryMethods, selectedMethodId]);

  const selectedMethod = deliveryMethods.find(method => method.id === selectedMethodId);

  const matrixRecords = useMemo(() => {
    if (!selectedMethod) return [] as Array<{ fromId: string; toId: string; price: number }>;
    return Object.entries(selectedMethod.priceMatrix || {}).flatMap(([fromId, destinations]) =>
      Object.entries(destinations || {}).map(([toId, value]) => ({
        fromId,
        toId,
        price: Number(value) || 0,
      }))
    );
  }, [selectedMethod]);

  const handleSaveRecord = async () => {
    if (!selectedMethod || !sourceRegionId || !destinationRegionId) return;
    const updatedMatrix = { ...(selectedMethod.priceMatrix || {}) };
    if (!updatedMatrix[sourceRegionId]) updatedMatrix[sourceRegionId] = {};
    updatedMatrix[sourceRegionId][destinationRegionId] = Number(price) || 0;
    await updateDeliveryMethod(selectedMethod.id, { priceMatrix: updatedMatrix });
    setSourceRegionId('');
    setDestinationRegionId('');
    setPrice(0);
  };

  const handleDeleteRecord = async (fromId: string, toId: string) => {
    if (!selectedMethod) return;
    const updatedMatrix = { ...(selectedMethod.priceMatrix || {}) };
    if (!updatedMatrix[fromId]) return;

    delete updatedMatrix[fromId][toId];
    if (Object.keys(updatedMatrix[fromId]).length === 0) {
      delete updatedMatrix[fromId];
    }

    await updateDeliveryMethod(selectedMethod.id, { priceMatrix: updatedMatrix });
  };

  const getRegionName = (regionId: string) => {
    return regions.find(region => region.id === regionId)?.name || regionId;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t({ en: 'Matrix Records', ar: 'سجلات المصفوفة' })}</h2>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t({ en: 'Delivery Method', ar: 'طريقة التوصيل' })}</label>
          <select
            value={selectedMethodId}
            onChange={(e) => setSelectedMethodId(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">{t({ en: 'Select Method', ar: 'اختر طريقة' })}</option>
            {deliveryMethods.map(method => (
              <option key={method.id} value={method.id}>{method.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={sourceRegionId}
            onChange={(e) => setSourceRegionId(e.target.value)}
            className="px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">{t({ en: 'From', ar: 'من' })}</option>
            {regions.map(region => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>

          <select
            value={destinationRegionId}
            onChange={(e) => setDestinationRegionId(e.target.value)}
            className="px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">{t({ en: 'To', ar: 'إلى' })}</option>
            {regions.map(region => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>

          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            placeholder={t({ en: 'Price', ar: 'السعر' })}
            className="px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black"
          />

          <button
            onClick={handleSaveRecord}
            disabled={!selectedMethodId || !sourceRegionId || !destinationRegionId}
            className="bg-black text-white px-4 py-3 rounded-2xl text-sm font-bold disabled:opacity-50"
          >
            {t({ en: 'Save Record', ar: 'حفظ السجل' })}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">{t({ en: 'Simple Records', ar: 'سجلات بسيطة' })}</h3>
        <div className="space-y-2">
          {matrixRecords.length === 0 && (
            <p className="text-sm text-gray-400">{t({ en: 'No records yet for this method.', ar: 'لا توجد سجلات لهذه الطريقة بعد.' })}</p>
          )}
          {matrixRecords.map((record) => (
            <div key={`${record.fromId}_${record.toId}`} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-2xl">
              <div className="text-sm font-medium">
                {selectedMethod?.name || '-'}: {getRegionName(record.fromId)} {t({ en: 'to', ar: 'إلى' })} {getRegionName(record.toId)}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">{record.price}</span>
                <button
                  onClick={() => handleDeleteRecord(record.fromId, record.toId)}
                  className="p-2 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DeliveryAdminManagement = ({ categories }: { categories: Category[] }) => {
  const { t } = useContext(LanguageContext);
  const [deliveryTab, setDeliveryTab] = useState<'methods' | 'regions' | 'matrix'>('methods');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
        <button
          onClick={() => setDeliveryTab('methods')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${deliveryTab === 'methods' ? 'bg-black text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          {t({ en: 'Methods', ar: 'الطرق' })}
        </button>
        <button
          onClick={() => setDeliveryTab('regions')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${deliveryTab === 'regions' ? 'bg-black text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          {t({ en: 'Regions', ar: 'المناطق' })}
        </button>
        <button
          onClick={() => setDeliveryTab('matrix')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${deliveryTab === 'matrix' ? 'bg-black text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          {t({ en: 'Matrix Records', ar: 'سجلات المصفوفة' })}
        </button>
      </div>

      {deliveryTab === 'methods' && <DeliveryMethodsManagement categories={categories} showMatrixEditor={false} />}
      {deliveryTab === 'regions' && <RegionsManagement />}
      {deliveryTab === 'matrix' && <DeliveryMatrixRecordsManagement />}
    </div>
  );
};

const PageEditor = ({ pageId, onClose }: { pageId: string, onClose: () => void }) => {
  const { t, lang: appLang } = useContext(LanguageContext);
  const [editLang, setEditLang] = useState<'en' | 'ar'>(appLang);
  const [fullData, setFullData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isManualFeaturesContent = (pageData: any) => {
    if (!pageData || typeof pageData !== 'object') return false;
    return Boolean(pageData?.root?.props?.__manualFeaturesPage);
  };

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(doc(db, 'pages', pageId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFullData(data.body || {});
      } else {
        setFullData({ en: { content: [], root: {} }, ar: { content: [], root: {} } });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `pages/${pageId}`);
      setLoading(false);
    });
    return unsub;
  }, [pageId]);

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      const nextData = pageId === 'features'
        ? {
            ...data,
            root: {
              ...(data?.root && typeof data.root === 'object' ? data.root : {}),
              props: {
                ...(data?.root?.props && typeof data.root.props === 'object' ? data.root.props : {}),
                __manualFeaturesPage: true,
              },
            },
          }
        : data;

      await setDoc(doc(db, 'pages', pageId), {
        id: pageId,
        body: {
          ...fullData,
          [editLang]: nextData
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `pages/${pageId}`);
    } finally {
      setSaving(false);
    }
  };

  const currentContent = useMemo(() => {
    const empty = { content: [], root: { props: {} } };
    if (!fullData) return empty;

    const raw = fullData[editLang] || empty;
    if (pageId === 'features' && !isManualFeaturesContent(raw)) {
      return empty;
    }
    const rawContent = Array.isArray(raw?.content) ? raw.content : [];

    let hasHeroOnFeatures = false;

    const normalizedContent = rawContent
      .filter((block: any) => block && typeof block === 'object' && typeof block.type === 'string')
      .filter((block: any) => {
        if (pageId !== 'features' || block.type !== 'Hero') return true;
        if (hasHeroOnFeatures) return false;
        hasHeroOnFeatures = true;
        return true;
      })
      .map((block: any) => {
        const props = (block.props && typeof block.props === 'object') ? { ...block.props } : {};

        if (block.type === 'Hero') {
          props.actions = Array.isArray(props.actions) ? props.actions.filter(Boolean) : [];
        }

        return {
          ...block,
          props,
        };
      });

    return {
      ...raw,
      content: normalizedContent,
      root: raw?.root && typeof raw.root === 'object' ? raw.root : { props: {} },
    };
  }, [fullData, editLang, pageId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="font-bold text-gray-400 animate-pulse uppercase tracking-widest text-xs">Loading Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight uppercase italic">{t({ en: 'Design Page', ar: 'تصميم الصفحة' })}</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Editing: <span className="text-black">{pageId}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t({ en: 'Language', ar: 'اللغة' })}:</label>
            <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
              {(['en', 'ar'] as const).map(l => (
                <button 
                  key={l}
                  onClick={() => setEditLang(l)}
                  className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                    editLang === l ? 'bg-white shadow-lg text-black' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {saving && (
              <span className="text-xs font-bold text-emerald-500 animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                {t({ en: 'Saving...', ar: 'جاري الحفظ...' })}
              </span>
            )}
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-black text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-black/10 text-sm"
            >
              {t({ en: 'Finish & Exit', ar: 'إنهاء وخروج' })}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden puck-editor-container" key={`${pageId}-${editLang}`}>
        <Puck
          config={puckConfig}
          data={currentContent}
          onPublish={handleSave}
        />
      </div>
      
      <style>{`
        .puck-editor-container .Puck {
          height: 100% !important;
        }
      `}</style>
    </div>
  );
};

const AdminPanel = ({ 
  setCurrentPage, 
  openPageEditor,
  openNewPageEditor,
  allPages 
}: { 
  setCurrentPage: (p: string) => void, 
  openPageEditor: (slug: string) => void,
  openNewPageEditor: () => void,
  allPages: any[] 
}) => {
  const { t } = useContext(LanguageContext);
  const { profile, user } = useContext(AuthContext);
  const { appSettings, updateAppSettings } = useContext(SettingsContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSubTab = (searchParams.get('subtab') as any) || 'products';
  const setActiveSubTab = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subtab', tab);
    setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    if (activeSubTab === 'regions' || activeSubTab === 'delivery-methods') {
      setActiveSubTab('delivery');
    }
  }, [activeSubTab]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [promoTitleEn, setPromoTitleEn] = useState('');
  const [promoTitleAr, setPromoTitleAr] = useState('');
  const [promoBodyEn, setPromoBodyEn] = useState('');
  const [promoBodyAr, setPromoBodyAr] = useState('');

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [variantAttributes, setVariantAttributes] = useState<{ name: LocalizedString, values: LocalizedString[] }[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', brand: '', description: '', price: 0, discount: 0, categories: [], tags: [], image: '', stock: 10, hasVariants: false, variants: [],
    locals: { name: { en: '', ar: '' }, description: { en: '', ar: '' } }
  });

  const [productFilterCategory, setProductFilterCategory] = useState<string>('all');
  const [productFilterTag, setProductFilterTag] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    title: '', description: '', icon: 'ph:package-bold', slug: '', isFeatured: false, parentId: null, bannerImageUrl: '',
    locals: { title: { en: '', ar: '' }, description: { en: '', ar: '' } }
  });

  const [showAddTag, setShowAddTag] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTag, setNewTag] = useState<Partial<Tag>>({
    title: { en: '', ar: '' }, icon: 'Tag', bannerImage: '', isPublic: true, isPromoted: false, discountType: 'none', discountValue: 0
  });

  const [defaultStore, setDefaultStore] = useState<Store | null>(null);

  useEffect(() => {
    console.log("AdminPanel: Checking profile roles", profile?.roles);
    if (!profile?.roles?.includes('admin')) {
      console.warn("AdminPanel: User is not admin, roles:", profile?.roles);
      return;
    }

    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubStores = onSnapshot(collection(db, 'stores'), (snap) => {
      const allStores = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
      setStores(allStores);
      const def = allStores.find(s => s.id === 'default-store');
      if (def) setDefaultStore(def);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stores'));

    const unsubDrivers = onSnapshot(collection(db, 'drivers'), (snap) => {
      setDrivers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'drivers'));

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));

    const unsubTags = onSnapshot(collection(db, 'tags'), (snap) => {
      setTags(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tags'));

    return () => {
      unsubProducts();
      unsubStores();
      unsubDrivers();
      unsubOrders();
      unsubUsers();
      unsubCats();
      unsubTags();
    };
  }, [profile]);

  const generateVariants = () => {
    if (variantAttributes.length === 0) return;

    const combinations = (arrays: LocalizedString[][]): LocalizedString[] => {
      let result: LocalizedString[] = [{ en: '', ar: '' }];
      for (const array of arrays) {
        const nextResult: LocalizedString[] = [];
        for (const res of result) {
          for (const item of array) {
            nextResult.push({
              en: res.en ? `${res.en} - ${item.en}` : item.en,
              ar: res.ar ? `${res.ar} - ${item.ar}` : item.ar
            });
          }
        }
        result = nextResult;
      }
      return result;
    };

    const allValues = variantAttributes.map(attr => attr.values);
    const generated = combinations(allValues);

    const newVariants: ProductVariant[] = generated.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
      price: newProduct.price || 0,
      stock: 10,
      attributes: {}
    }));

    setNewProduct({ ...newProduct, variants: newVariants });
  };

  const handleSaveProduct = async () => {
    try {
      const productData = {
        ...newProduct,
        storeId: editingProduct?.storeId || 'default-store',
        status: editingProduct?.status || 'published', // Admin products are published by default if new
        locals: {
          name: { 
            en: newProduct.locals?.name.en || newProduct.name || '', 
            ar: newProduct.locals?.name.ar || newProduct.name || '' 
          },
          description: { 
            en: newProduct.locals?.description.en || newProduct.description || '', 
            ar: newProduct.locals?.description.ar || newProduct.description || '' 
          }
        },
        updatedAt: serverTimestamp()
      };

      if (!editingProduct) {
        (productData as any).createdAt = serverTimestamp();
      }

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      setShowAddProduct(false);
      setEditingProduct(null);
      setNewProduct({ 
        name: '', brand: '', description: '', price: 0, discount: 0, categories: [], tags: [], image: '', stock: 10, hasVariants: false, variants: [],
        locals: { name: { en: '', ar: '' }, description: { en: '', ar: '' } }
      });
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm(t({ en: 'Are you sure?', ar: 'هل أنت متأكد؟' }))) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const handleSaveCategory = async () => {
    try {
      const catData = {
        ...newCategory,
        locals: {
          title: { en: newCategory.locals?.title.en || newCategory.title || '', ar: newCategory.locals?.title.ar || newCategory.title || '' },
          description: { en: newCategory.locals?.description.en || newCategory.description || '', ar: newCategory.locals?.description.ar || newCategory.description || '' }
        },
        updatedAt: serverTimestamp()
      };

      if (!editingCategory) {
        (catData as any).createdAt = serverTimestamp();
      }

      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), catData);
      } else {
        await addDoc(collection(db, 'categories'), catData);
      }
      setShowAddCategory(false);
      setEditingCategory(null);
      setNewCategory({ 
        title: '', description: '', icon: 'ph:package-bold', slug: '', isFeatured: false, parentId: null, bannerImageUrl: '',
        locals: { title: { en: '', ar: '' }, description: { en: '', ar: '' } }
      });
    } catch (error) {
      alert('Error saving category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm(t({ en: 'Are you sure?', ar: 'هل أنت متأكد؟' }))) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  const handleSaveTag = async () => {
    try {
      const tagData = {
        ...newTag,
        createdAt: serverTimestamp()
      };
      if (editingTag) {
        await updateDoc(doc(db, 'tags', editingTag.id), tagData);
      } else {
        await addDoc(collection(db, 'tags'), tagData);
      }
      setShowAddTag(false);
      setEditingTag(null);
      setNewTag({ title: { en: '', ar: '' }, icon: 'Tag', bannerImage: '', isPublic: true, isPromoted: false, discountType: 'none', discountValue: 0 });
    } catch (error) {
      alert('Error saving tag');
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (confirm(t({ en: 'Are you sure?', ar: 'هل أنت متأكد؟' }))) {
      await deleteDoc(doc(db, 'tags', id));
    }
  };

  const handleSaveStoreSettings = async (settings: Partial<Store>) => {
    try {
      if (defaultStore) {
        await updateDoc(doc(db, 'stores', 'default-store'), settings);
      } else {
        await setDoc(doc(db, 'stores', 'default-store'), {
          ...settings,
          id: 'default-store',
          ownerId: 'admin',
          isVerified: true,
          createdAt: serverTimestamp(),
          locals: {
            name: { en: settings.name || 'Default Store', ar: settings.name || 'المتجر الافتراضي' },
            description: { en: settings.description || '', ar: settings.description || '' }
          }
        });
      }
      alert('Store settings saved!');
    } catch (error) {
      alert('Error saving store settings');
    }
  };

  const verifyStore = async (storeId: string) => {
    try {
      await updateDoc(doc(db, 'stores', storeId), { isVerified: true });
      const store = stores.find(s => s.id === storeId);
      if (store) {
        await updateDoc(doc(db, 'users', store.ownerId), { isVerified: true });
        
        // Notify Store Owner
        await addDoc(collection(db, 'notifications'), {
          userId: store.ownerId,
          title: { en: 'Store Verified', ar: 'تم توثيق المتجر' },
          body: { 
            en: `Your store "${t(store.locals.name)}" has been verified! You can now start selling.`, 
            ar: `تم توثيق متجرك "${t(store.locals.name)}"! يمكنك الآن البدء في البيع.` 
          },
          type: 'system',
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error verifying store:', error);
    }
  };

  const verifyDriver = async (driverId: string) => {
    try {
      await updateDoc(doc(db, 'drivers', driverId), { isVerified: true });
      const driver = drivers.find(d => d.id === driverId);
      if (driver) {
        await updateDoc(doc(db, 'users', driver.userId), { isVerified: true });

        // Notify Driver
        await addDoc(collection(db, 'notifications'), {
          userId: driver.userId,
          title: { en: 'Driver Verified', ar: 'تم توثيق السائق' },
          body: { 
            en: 'Your driver account has been verified! You can now accept delivery assignments.', 
            ar: 'تم توثيق حساب السائق الخاص بك! يمكنك الآن قبول مهام التوصيل.' 
          },
          type: 'system',
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error verifying driver:', error);
    }
  };

  const toggleUserBan = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isBanned: !currentStatus });
    } catch (error) {
      console.error('Error toggling ban:', error);
    }
  };

  const updateUserRoles = async (userId: string, newRoles: ('admin' | 'customer' | 'store' | 'driver')[]) => {
    try {
      await updateDoc(doc(db, 'users', userId), { roles: newRoles });
    } catch (error) {
      console.error('Error updating roles:', error);
    }
  };

  const sendAdminMessage = async () => {
    if (!selectedUser || !adminMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: selectedUser.uid,
        title: { en: 'Message from Admin', ar: 'رسالة من المشرف' },
        body: { en: adminMessage, ar: adminMessage },
        type: 'system',
        read: false,
        createdAt: serverTimestamp()
      });
      setAdminMessage('');
      setSelectedUser(null);
      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        driverId, 
        deliveryStatus: 'assigned' 
      });

      // Notify Customer
      const orderSnap = await getDoc(doc(db, 'orders', orderId));
      if (orderSnap.exists()) {
        const orderData = orderSnap.data() as Order;
        await addDoc(collection(db, 'notifications'), {
          userId: orderData.userId,
          title: { en: 'Driver Assigned', ar: 'تم تعيين سائق' },
          body: { 
            en: `A driver has been assigned to your order #${orderId.slice(0, 5)}.`, 
            ar: `تم تعيين سائق لطلبك رقم #${orderId.slice(0, 5)}.` 
          },
          type: 'order_update',
          read: false,
          createdAt: serverTimestamp(),
          metadata: { orderId }
        });

        // Notify Driver
        const driverSnap = await getDoc(doc(db, 'drivers', driverId));
        if (driverSnap.exists()) {
          const driverData = driverSnap.data() as Driver;
          await addDoc(collection(db, 'notifications'), {
            userId: driverData.userId,
            title: { en: 'New Delivery Assigned', ar: 'تم تعيين مهمة توصيل جديدة' },
            body: { 
              en: `You have a new delivery assignment for order #${orderId.slice(0, 5)}.`, 
              ar: `لديك مهمة توصيل جديدة للطلب رقم #${orderId.slice(0, 5)}.` 
            },
            type: 'order_update',
            read: false,
            createdAt: serverTimestamp(),
            metadata: { orderId }
          });
        }
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
    }
  };

  const handleUpdateProductStatus = async (productId: string, status: Product['status'], message?: string) => {
    try {
      const updateData: any = { status };
      if (message !== undefined) updateData.adminMessage = message;
      await updateDoc(doc(db, 'products', productId), updateData);
      
      // Notify Store Owner
      const product = products.find(p => p.id === productId);
      if (product && product.storeId && product.storeId !== 'default-store') {
        const store = stores.find(s => s.id === product.storeId);
        if (store) {
          await addDoc(collection(db, 'notifications'), {
            userId: store.ownerId,
            title: { 
              en: `Product ${status.charAt(0).toUpperCase() + status.slice(1)}`, 
              ar: `تم ${status === 'published' ? 'نشر' : status === 'rejected' ? 'رفض' : 'تعديل حالة'} المنتج` 
            },
            body: { 
              en: `Your product "${t(product.locals.name)}" is now ${status}.${message ? ` Message: ${message}` : ''}`, 
              ar: `منتجك "${t(product.locals.name)}" الآن ${status === 'published' ? 'منشور' : status === 'rejected' ? 'مرفوض' : status}.${message ? ` رسالة: ${message}` : ''}` 
            },
            type: 'system',
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const handleUpdateStoreMessage = async (storeId: string, message: string) => {
    try {
      await updateDoc(doc(db, 'stores', storeId), { adminMessage: message });
      const store = stores.find(s => s.id === storeId);
      if (store) {
        await addDoc(collection(db, 'notifications'), {
          userId: store.ownerId,
          title: { en: 'Admin Message', ar: 'رسالة من الإدارة' },
          body: { en: message, ar: message },
          type: 'system',
          read: false,
          createdAt: serverTimestamp()
        });
      }
      alert('Message sent to store owner!');
    } catch (error) {
      console.error('Error sending message to store:', error);
    }
  };

  const sendPromotion = async (title: LocalizedString, body: LocalizedString) => {
    try {
      const usersResult = await getDocs(collection(db, 'users'));
      const batch = usersResult.docs.map(userDoc => 
        addDoc(collection(db, 'notifications'), {
          userId: userDoc.id,
          title,
          body,
          type: 'promotion',
          read: false,
          createdAt: serverTimestamp()
        })
      );
      await Promise.all(batch);
      alert('Promotion sent to all users!');
    } catch (error) {
      console.error('Error sending promotion:', error);
    }
  };

  const seedData = async () => {
    try {
      // 1. Create Categories
      const catRefs: { [key: string]: string } = {};
      
      const demoCategories = [
        { 
          title: 'Fruits & Vegetables', 
          isFeatured: true, 
          icon: 'Apple', 
          bannerImageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1200',
          locals: {
            title: { en: 'Fruits & Vegetables', ar: 'الفواكه والخضروات' },
            description: { en: 'Fresh from the farm.', ar: 'طازجة من المزرعة.' }
          },
          parentId: null,
          createdAt: serverTimestamp()
        },
        { 
          title: 'Dairy & Eggs', 
          isFeatured: true, 
          icon: 'Milk', 
          bannerImageUrl: 'https://images.unsplash.com/photo-1550583724-125581fe2f8a?w=1200',
          locals: {
            title: { en: 'Dairy & Eggs', ar: 'الألبان والبيض' },
            description: { en: 'Fresh dairy products.', ar: 'منتجات الألبان الطازجة.' }
          },
          parentId: null,
          createdAt: serverTimestamp()
        },
        { 
          title: 'Bakery', 
          isFeatured: true, 
          icon: 'Cookie', 
          bannerImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200',
          locals: {
            title: { en: 'Bakery', ar: 'المخبوزات' },
            description: { en: 'Freshly baked every day.', ar: 'مخبوز طازج كل يوم.' }
          },
          parentId: null,
          createdAt: serverTimestamp()
        },
        { 
          title: 'Meat & Poultry', 
          isFeatured: true, 
          icon: 'Beef', 
          bannerImageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc822?w=1200',
          locals: {
            title: { en: 'Meat & Poultry', ar: 'اللحوم والدواجن' },
            description: { en: 'Premium quality meats.', ar: 'لحوم عالية الجودة.' }
          },
          parentId: null,
          createdAt: serverTimestamp()
        },
        { 
          title: 'Beverages', 
          isFeatured: true, 
          icon: 'Coffee', 
          bannerImageUrl: 'https://images.unsplash.com/photo-1544787210-2827448b303c?w=1200',
          locals: {
            title: { en: 'Beverages', ar: 'المشروبات' },
            description: { en: 'Refreshing drinks and juices.', ar: 'مشروبات وعصائر منعشة.' }
          },
          parentId: null,
          createdAt: serverTimestamp()
        },
        { 
          title: 'Snacks & Sweets', 
          isFeatured: true, 
          icon: 'Candy', 
          bannerImageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bb087?w=1200',
          locals: {
            title: { en: 'Snacks & Sweets', ar: 'الوجبات الخفيفة والحلويات' },
            description: { en: 'Delicious treats for any time.', ar: 'حلويات لذيذة في أي وقت.' }
          },
          parentId: null,
          createdAt: serverTimestamp()
        },
        { 
          title: 'Household', 
          isFeatured: true, 
          icon: 'Home', 
          bannerImageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200',
          locals: {
            title: { en: 'Household', ar: 'الأدوات المنزلية' },
            description: { en: 'Cleaning and home essentials.', ar: 'أساسيات التنظيف والمنزل.' }
          },
          parentId: null,
          createdAt: serverTimestamp()
        }
      ];

      for (const cat of demoCategories) {
        const docRef = await addDoc(collection(db, 'categories'), cat);
        catRefs[cat.title] = docRef.id;
      }

      // 2. Create Tags
      const tagRefs: { [key: string]: string } = {};
      const demoTags = [
        {
          title: { en: 'Fresh', ar: 'طازج' },
          icon: 'Leaf',
          bannerImage: '',
          isPublic: true,
          isPromoted: true,
          discountType: 'none',
          discountValue: 0,
          createdAt: serverTimestamp()
        },
        {
          title: { en: 'Organic', ar: 'عضوي' },
          icon: 'Sprout',
          bannerImage: '',
          isPublic: true,
          isPromoted: false,
          discountType: 'none',
          discountValue: 0,
          createdAt: serverTimestamp()
        },
        {
          title: { en: 'Discounted', ar: 'مخفض' },
          icon: 'Tag',
          bannerImage: '',
          isPublic: true,
          isPromoted: true,
          discountType: 'product',
          discountValue: 20,
          createdAt: serverTimestamp()
        },
        {
          title: { en: 'New Arrival', ar: 'وصل حديثاً' },
          icon: 'Sparkles',
          bannerImage: '',
          isPublic: true,
          isPromoted: true,
          discountType: 'none',
          discountValue: 0,
          createdAt: serverTimestamp()
        }
      ];

      for (const tag of demoTags) {
        const docRef = await addDoc(collection(db, 'tags'), tag);
        tagRefs[tag.title.en] = docRef.id;
      }

      // 3. Create Products
      const demoProducts = [
        { 
          name: 'Red Apples', 
          brand: 'FreshFarm', 
          price: 2.5, 
          categories: [catRefs['Fruits & Vegetables']], 
          tags: [tagRefs['Fresh'], tagRefs['Organic']],
          image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800', 
          description: 'Sweet and crunchy red apples.', 
          locals: {
            name: { en: 'Red Apples', ar: 'تفاح أحمر' },
            description: { en: 'Sweet and crunchy red apples.', ar: 'تفاح أحمر حلو ومقرمش.' }
          },
          stock: 100, 
          storeId: 'default-store',
          status: 'published',
          hasVariants: false,
          createdAt: serverTimestamp() 
        },
        { 
          name: 'Bananas 1kg', 
          brand: 'FreshFarm', 
          price: 1.5, 
          categories: [catRefs['Fruits & Vegetables']], 
          tags: [tagRefs['Fresh']],
          image: 'https://images.unsplash.com/photo-1571771894821-ad990241274d?w=800', 
          description: 'Ripe yellow bananas.', 
          locals: {
            name: { en: 'Bananas 1kg', ar: 'موز 1 كجم' },
            description: { en: 'Ripe yellow bananas.', ar: 'موز أصفر ناضج.' }
          },
          stock: 80, 
          storeId: 'default-store',
          status: 'published',
          hasVariants: false,
          createdAt: serverTimestamp() 
        },
        { 
          name: 'Fresh Milk 1L', 
          brand: 'DairyBest', 
          price: 1.8, 
          categories: [catRefs['Dairy & Eggs']], 
          tags: [tagRefs['Fresh']],
          image: 'https://images.unsplash.com/photo-1563636619-e9107da4a1bb?w=800', 
          description: 'Pasteurized whole milk.', 
          locals: {
            name: { en: 'Fresh Milk 1L', ar: 'حليب طازج 1 لتر' },
            description: { en: 'Pasteurized whole milk.', ar: 'حليب كامل الدسم مبستر.' }
          },
          stock: 50, 
          storeId: 'default-store',
          status: 'published',
          hasVariants: false,
          createdAt: serverTimestamp() 
        },
        { 
          name: 'Large Eggs 12pk', 
          brand: 'DairyBest', 
          price: 3.5, 
          categories: [catRefs['Dairy & Eggs']], 
          tags: [tagRefs['Fresh']],
          image: 'https://images.unsplash.com/photo-1518569190539-242a483c3b2d?w=800', 
          description: 'Farm fresh large eggs.', 
          locals: {
            name: { en: 'Large Eggs 12pk', ar: 'بيض كبير 12 حبة' },
            description: { en: 'Farm fresh large eggs.', ar: 'بيض كبير طازج من المزرعة.' }
          },
          stock: 40, 
          storeId: 'default-store',
          status: 'published',
          hasVariants: false,
          createdAt: serverTimestamp() 
        },
        { 
          name: 'Whole Wheat Bread', 
          brand: 'BakeHouse', 
          price: 1.2, 
          categories: [catRefs['Bakery']], 
          tags: [tagRefs['Fresh']],
          image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800', 
          description: 'Freshly baked whole wheat bread.', 
          locals: {
            name: { en: 'Whole Wheat Bread', ar: 'خبز القمح الكامل' },
            description: { en: 'Freshly baked whole wheat bread.', ar: 'خبز القمح الكامل المخبوز طازجاً.' }
          },
          stock: 30, 
          storeId: 'default-store',
          status: 'published',
          hasVariants: false,
          createdAt: serverTimestamp() 
        },
        { 
          name: 'Chicken Breast 500g', 
          brand: 'MeatMaster', 
          price: 5.5, 
          categories: [catRefs['Meat & Poultry']], 
          tags: [tagRefs['Fresh']],
          image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800', 
          description: 'Skinless and boneless chicken breast.', 
          locals: {
            name: { en: 'Chicken Breast 500g', ar: 'صدر دجاج 500 جرام' },
            description: { en: 'Skinless and boneless chicken breast.', ar: 'صدر دجاج بدون جلد وعظم.' }
          },
          stock: 20, 
          storeId: 'default-store',
          status: 'published',
          hasVariants: false,
          createdAt: serverTimestamp() 
        },
        { 
          name: 'Ribeye Steak 300g', 
          brand: 'MeatMaster', 
          price: 12.0, 
          categories: [catRefs['Meat & Poultry']], 
          tags: [tagRefs['New Arrival']],
          image: 'https://images.unsplash.com/photo-1546248136-24b0ca9d1148?w=800', 
          description: 'Premium grass-fed ribeye steak.', 
          locals: {
            name: { en: 'Ribeye Steak 300g', ar: 'ستيك ريب آي 300 جرام' },
            description: { en: 'Premium grass-fed ribeye steak.', ar: 'ستيك ريب آي فاخر مغذى على الأعشاب.' }
          },
          stock: 10, 
          storeId: 'default-store',
          status: 'published',
          hasVariants: false,
          createdAt: serverTimestamp() 
        },
        { 
          name: 'Orange Juice 1L', 
          brand: 'Juicy', 
          price: 3.2, 
          categories: [catRefs['Beverages']], 
          tags: [tagRefs['Discounted']],
          image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800', 
          description: '100% pure orange juice.', 
          locals: {
            name: { en: 'Orange Juice 1L', ar: 'عصير برتقال 1 لتر' },
            description: { en: '100% pure orange juice.', ar: 'عصير برتقال طبيعي 100٪.' }
          },
          stock: 40, 
          storeId: 'default-store',
          status: 'published',
          hasVariants: false,
          createdAt: serverTimestamp() 
        },
        { 
          name: 'Mineral Water 1.5L', 
          brand: 'Aqua', 
          price: 0.5, 
          categories: [catRefs['Beverages']], 
          tags: [],
          image: 'https://images.unsplash.com/photo-1523362628742-0c26015eb262?w=800', 
          description: 'Pure mineral water.', 
          locals: {
            name: { en: 'Mineral Water 1.5L', ar: 'مياه معدنية 1.5 لتر' },
            description: { en: 'Pure mineral water.', ar: 'مياه معدنية نقية.' }
          },
          stock: 200, 
          storeId: 'default-store',
          status: 'published',
          hasVariants: false,
          createdAt: serverTimestamp() 
        },
        { 
          name: 'Potato Chips', 
          brand: 'Crunchy', 
          price: 1.5, 
          categories: [catRefs['Snacks & Sweets']], 
          tags: [],
          image: 'https://images.unsplash.com/photo-1566478431375-704332ca523f?w=800', 
          description: 'Classic salted potato chips.', 
          locals: {
            name: { en: 'Potato Chips', ar: 'رقائق البطاطس' },
            description: { en: 'Classic salted potato chips.', ar: 'رقائق البطاطس المملحة الكلاسيكية.' }
          },
          stock: 60, 
          storeId: 'default-store',
          status: 'published',
          hasVariants: false,
          createdAt: serverTimestamp() 
        },
        { 
          name: 'Dish Soap 500ml', 
          brand: 'CleanHome', 
          price: 2.2, 
          categories: [catRefs['Household']], 
          tags: [],
          image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', 
          description: 'Tough on grease dish soap.', 
          locals: {
            name: { en: 'Dish Soap 500ml', ar: 'صابون أطباق 500 مل' },
            description: { en: 'Tough on grease dish soap.', ar: 'صابون أطباق قوي على الدهون.' }
          },
          stock: 45, 
          storeId: 'default-store',
          status: 'published',
          hasVariants: false,
          createdAt: serverTimestamp() 
        }
      ];

      const productIds: string[] = [];
      for (const prod of demoProducts) {
        const docRef = await addDoc(collection(db, 'products'), prod);
        productIds.push(docRef.id);
      }

      // 4. Create Sample Orders (if user is logged in)
      if (user) {
        const demoOrders = [
          {
            userId: user.uid,
            items: [
              { ...demoProducts[0], id: productIds[0], quantity: 2 },
              { ...demoProducts[1], id: productIds[1], quantity: 1 }
            ],
            totalAmount: 6.8,
            status: 'delivered',
            paymentMethod: 'cod',
            customerInfo: {
              name: user.displayName || 'Demo User',
              email: user.email || 'demo@example.com',
              address: '123 Demo St, City'
            },
            createdAt: serverTimestamp()
          }
        ];

        for (const order of demoOrders) {
          await addDoc(collection(db, 'orders'), order);
        }
      }

      alert('Supermarket data seeded successfully!');
    } catch (error: any) {
      console.error('Error seeding data:', error);
      alert('Error seeding data: ' + error.message);
    }
  };

  const filteredAdminProducts = products.filter(p => {
    const matchesCategory = productFilterCategory === 'all' || p.categories.includes(productFilterCategory);
    const matchesTag = productFilterTag === 'all' || p.tags.includes(productFilterTag);
    const matchesSearch = t(p.locals.name).toLowerCase().includes(productSearchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(productSearchQuery.toLowerCase());
    return matchesCategory && matchesTag && matchesSearch;
  });

  return (
    <div className="space-y-8 pt-2">
      <div className="flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible gap-2 md:gap-4 border-b border-gray-100 pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
        {[
          { id: 'products', label: t({ en: 'Products', ar: 'المنتجات' }), icon: Package },
          { id: 'categories', label: t({ en: 'Categories', ar: 'الأقسام' }), icon: ClipboardList },
          { id: 'tags', label: t({ en: 'Tags', ar: 'الوسوم' }), icon: TagIcon },
          { id: 'stores', label: t({ en: 'Stores', ar: 'المتاجر' }), icon: StoreIcon },
          { id: 'drivers', label: t({ en: 'Drivers', ar: 'السائقين' }), icon: Car },
          { id: 'orders', label: t({ en: 'Orders', ar: 'الطلبات' }), icon: ShoppingBag },
          { id: 'users', label: t({ en: 'Users', ar: 'المستخدمين' }), icon: Users },
          { id: 'delivery', label: t({ en: 'Delivery', ar: 'التوصيل' }), icon: Truck },
          { id: 'promotions', label: t({ en: 'Promotions', ar: 'العروض' }), icon: Bell },
          { id: 'pages', label: t({ en: 'Pages', ar: 'الصفحات' }), icon: FileText },
          { id: 'app-settings', label: t({ en: 'App Settings', ar: 'إعدادات التطبيق' }), icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              activeSubTab === tab.id ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{t({ en: 'Product Management', ar: 'إدارة المنتجات' })}</h2>
            <div className="flex gap-4">
              <button onClick={seedData} className="text-sm font-bold text-gray-400 hover:text-black transition-colors underline">
                {t({ en: 'Seed Demo Data', ar: 'تعبئة بيانات تجريبية' })}
              </button>
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setNewProduct({ 
                    name: '', brand: '', description: '', price: 0, discount: 0, categories: [], tags: [], image: '', stock: 10, hasVariants: false, variants: [],
                    locals: { name: { en: '', ar: '' }, description: { en: '', ar: '' } }
                  });
                  setVariantAttributes([]);
                  setShowAddProduct(true);
                }}
                className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t({ en: 'Add Product', ar: 'إضافة منتج' })}
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" placeholder={t({ en: 'Search products...', ar: 'البحث عن المنتجات...' })}
                value={productSearchQuery} onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            <select 
              value={productFilterCategory} onChange={(e) => setProductFilterCategory(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">{t({ en: 'All Categories', ar: 'كل الأقسام' })}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{t(cat.locals.title)}</option>
              ))}
            </select>
            <select 
              value={productFilterTag} onChange={(e) => setProductFilterTag(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">{t({ en: 'All Tags', ar: 'كل الوسوم' })}</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>{t(tag.title)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAdminProducts.map(p => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-3xl p-6 flex gap-6 items-center shadow-sm relative group">
                <img src={p.image || undefined} className="w-24 h-24 object-cover rounded-2xl" referrerPolicy="no-referrer" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{t(p.locals.name)}</h3>
                  <p className="text-sm text-gray-400 font-medium">{p.brand}</p>
                  <p className="font-bold text-black mt-2">{p.price} {t(appSettings.currency?.symbol || config.currency.symbol)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      p.status === 'published' ? 'bg-green-100 text-green-600' :
                      p.status === 'review' ? 'bg-orange-100 text-orange-600' :
                      p.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {p.status || 'draft'}
                    </span>
                    {p.status === 'review' && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleUpdateProductStatus(p.id, 'published')}
                          className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                          title={t({ en: 'Publish', ar: 'نشر' })}
                        >
                          <ShieldCheck className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => {
                            const msg = prompt(t({ en: 'Rejection Reason:', ar: 'سبب الرفض:' }));
                            if (msg) handleUpdateProductStatus(p.id, 'rejected', msg);
                          }}
                          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title={t({ en: 'Reject', ar: 'رفض' })}
                        >
                          <ShieldX className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {p.status === 'published' && (
                      <button 
                        onClick={() => handleUpdateProductStatus(p.id, 'draft')}
                        className="p-1 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                        title={t({ en: 'Unpublish', ar: 'إلغاء النشر' })}
                      >
                        <EyeOff className="w-3 h-3" />
                      </button>
                    )}
                    {p.status === 'draft' && (
                      <button 
                        onClick={() => handleUpdateProductStatus(p.id, 'published')}
                        className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        title={t({ en: 'Publish', ar: 'نشر' })}
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        const msg = prompt(t({ en: 'Message for Product Owner:', ar: 'رسالة لمالك المنتج:' }));
                        if (msg) {
                          updateDoc(doc(db, 'products', p.id), { adminMessage: msg });
                          if (p.storeId) {
                            const store = stores.find(s => s.id === p.storeId);
                            if (store) {
                              addDoc(collection(db, 'notifications'), {
                                userId: store.ownerId,
                                title: { en: 'Admin Message for Product', ar: 'رسالة من الإدارة حول منتج' },
                                body: { 
                                  en: `Message regarding product "${t(p.locals.name)}": ${msg}`, 
                                  ar: `رسالة بخصوص المنتج "${t(p.locals.name)}": ${msg}` 
                                },
                                type: 'system',
                                read: false,
                                createdAt: serverTimestamp()
                              });
                            }
                          }
                        }
                      }}
                      className="p-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                      title={t({ en: 'Message Owner', ar: 'مراسلة المالك' })}
                    >
                      <MessageSquare className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingProduct(p);
                      setNewProduct(p);
                      setVariantAttributes([]);
                      setShowAddProduct(true);
                    }}
                    className="p-2 bg-white rounded-full shadow-md text-blue-500 hover:bg-blue-50"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {showAddProduct && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowAddProduct(false)}
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white w-full max-w-lg rounded-3xl p-8 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
                >
                  <h3 className="text-2xl font-bold mb-6">{editingProduct ? t({ en: 'Edit Product', ar: 'تعديل المنتج' }) : t({ en: 'Add New Product', ar: 'إضافة منتج جديد' })}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" placeholder={t({ en: 'Product Name (EN)', ar: 'اسم المنتج (EN)' })}
                        value={newProduct.locals?.name.en} onChange={(e) => setNewProduct({...newProduct, locals: { ...newProduct.locals!, name: { ...newProduct.locals!.name, en: e.target.value } }})}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none"
                      />
                      <input 
                        type="text" placeholder={t({ en: 'Product Name (AR)', ar: 'اسم المنتج (AR)' })}
                        value={newProduct.locals?.name.ar} onChange={(e) => setNewProduct({...newProduct, locals: { ...newProduct.locals!, name: { ...newProduct.locals!.name, ar: e.target.value } }})}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none text-right"
                      />
                    </div>
                    <input 
                      type="text" placeholder={t({ en: 'Brand', ar: 'الماركة' })}
                      value={newProduct.brand} onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                      className="w-full p-4 bg-gray-50 rounded-xl border-none"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <textarea 
                        placeholder={t({ en: 'Description (EN)', ar: 'الوصف (EN)' })}
                        value={newProduct.locals?.description.en} onChange={(e) => setNewProduct({...newProduct, locals: { ...newProduct.locals!, description: { ...newProduct.locals!.description, en: e.target.value } }})}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none min-h-[100px]"
                      />
                      <textarea 
                        placeholder={t({ en: 'Description (AR)', ar: 'الوصف (AR)' })}
                        value={newProduct.locals?.description.ar} onChange={(e) => setNewProduct({...newProduct, locals: { ...newProduct.locals!, description: { ...newProduct.locals!.description, ar: e.target.value } }})}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none min-h-[100px] text-right"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="number" placeholder={t({ en: 'Price', ar: 'السعر' })}
                        value={newProduct.price || 0} onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none"
                      />
                      <input 
                        type="number" placeholder={t({ en: 'Discount (%)', ar: 'الخصم (%)' })}
                        value={newProduct.discount || 0} onChange={(e) => setNewProduct({...newProduct, discount: parseFloat(e.target.value) || 0})}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none"
                      />
                    </div>
                    <input 
                      type="number" placeholder={t({ en: 'Stock', ar: 'المخزون' })}
                      value={newProduct.stock || 0} onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                      className="w-full p-4 bg-gray-50 rounded-xl border-none"
                    />
                    <ImageUpload 
                      label="Product Image"
                      path={STORAGE_PATHS.PRODUCTS}
                      currentUrl={newProduct.image || undefined}
                      onUpload={(url) => setNewProduct({ ...newProduct, image: url })}
                    />
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">{t({ en: 'Categories', ar: 'الأقسام' })}</label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              const current = newProduct.categories || [];
                              if (current.includes(cat.id)) {
                                setNewProduct({...newProduct, categories: current.filter(id => id !== cat.id)});
                              } else {
                                setNewProduct({...newProduct, categories: [...current, cat.id]});
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              (newProduct.categories || []).includes(cat.id) ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {t(cat.locals.title)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">{t({ en: 'Tags', ar: 'الوسوم' })}</label>
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <button
                            key={tag.id}
                            onClick={() => {
                              const current = newProduct.tags || [];
                              if (current.includes(tag.id)) {
                                setNewProduct({...newProduct, tags: current.filter(id => id !== tag.id)});
                              } else {
                                setNewProduct({...newProduct, tags: [...current, tag.id]});
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              (newProduct.tags || []).includes(tag.id) ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {t(tag.title)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4 p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{t({ en: 'Has Variants', ar: 'يحتوي على خيارات' })}</p>
                        <button 
                          onClick={() => setNewProduct({...newProduct, hasVariants: !newProduct.hasVariants, variants: !newProduct.hasVariants ? [] : newProduct.variants})}
                          className={`w-12 h-6 rounded-full transition-all relative ${newProduct.hasVariants ? 'bg-black' : 'bg-gray-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newProduct.hasVariants ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                      {newProduct.hasVariants && (
                        <div className="space-y-4">
                          <div className="p-4 bg-white rounded-xl border border-gray-100 space-y-4">
                            <div className="flex justify-between items-center">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t({ en: 'Variant Generator', ar: 'مولد الخيارات' })}</p>
                              <button 
                                onClick={() => setVariantAttributes([...variantAttributes, { name: { en: '', ar: '' }, values: [] }])}
                                className="text-xs font-bold text-emerald-600 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                {t({ en: 'Add Attribute Type', ar: 'إضافة نوع خيار' })}
                              </button>
                            </div>
                            
                            {variantAttributes.map((attr, idx) => (
                              <div key={idx} className="space-y-2 pb-4 border-b border-gray-50 last:border-0">
                                <div className="flex gap-2">
                                  <input 
                                    type="text" placeholder={t({ en: 'Attribute (e.g. Size)', ar: 'الخيار (مثلاً الحجم)' })}
                                    value={attr.name.en} onChange={(e) => {
                                      const updated = [...variantAttributes];
                                      updated[idx].name.en = e.target.value;
                                      setVariantAttributes(updated);
                                    }}
                                    className="flex-1 p-2 bg-gray-50 rounded-lg text-xs"
                                  />
                                  <input 
                                    type="text" placeholder={t({ en: 'Attribute (AR)', ar: 'الخيار (AR)' })}
                                    value={attr.name.ar} onChange={(e) => {
                                      const updated = [...variantAttributes];
                                      updated[idx].name.ar = e.target.value;
                                      setVariantAttributes(updated);
                                    }}
                                    className="flex-1 p-2 bg-gray-50 rounded-lg text-xs text-right"
                                  />
                                  <button 
                                    onClick={() => setVariantAttributes(variantAttributes.filter((_, i) => i !== idx))}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                  {attr.values.map((val, vIdx) => (
                                    <div key={vIdx} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-[10px] font-bold">
                                      <span>{t(val)}</span>
                                      <button onClick={() => {
                                        const updated = [...variantAttributes];
                                        updated[idx].values = updated[idx].values.filter((_, i) => i !== vIdx);
                                        setVariantAttributes(updated);
                                      }}><X className="w-2 h-2" /></button>
                                    </div>
                                  ))}
                                  <button 
                                    onClick={() => {
                                      const valEn = prompt(t({ en: 'Enter value (EN):', ar: 'أدخل القيمة (EN):' }));
                                      const valAr = prompt(t({ en: 'Enter value (AR):', ar: 'أدخل القيمة (AR):' }));
                                      if (valEn && valAr) {
                                        const updated = [...variantAttributes];
                                        updated[idx].values.push({ en: valEn, ar: valAr });
                                        setVariantAttributes(updated);
                                      }
                                    }}
                                    className="px-2 py-1 border border-dashed border-gray-300 rounded-full text-[10px] text-gray-400 hover:border-black hover:text-black transition-all"
                                  >
                                    + {t({ en: 'Add Value', ar: 'إضافة قيمة' })}
                                  </button>
                                </div>
                              </div>
                            ))}

                            {variantAttributes.length > 0 && (
                              <button 
                                onClick={generateVariants}
                                className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all"
                              >
                                {t({ en: 'Generate Combinations', ar: 'توليد التشكيلات' })}
                              </button>
                            )}
                          </div>

                          <div className="flex justify-between items-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t({ en: 'Generated Variants', ar: 'الخيارات المولدة' })}</p>
                            <button 
                              onClick={() => {
                                const v: ProductVariant = { id: Math.random().toString(36).substr(2, 9), name: { en: '', ar: '' }, price: newProduct.price || 0, stock: 10, attributes: {} };
                                setNewProduct({...newProduct, variants: [...(newProduct.variants || []), v]});
                              }}
                              className="text-xs font-bold text-blue-500 hover:underline"
                            >
                              + {t({ en: 'Add Manual Variant', ar: 'إضافة خيار يدوي' })}
                            </button>
                          </div>
                          {newProduct.variants?.map((v, idx) => (
                            <div key={v.id} className="p-4 bg-white rounded-xl border border-gray-100 space-y-3 relative">
                              <button 
                                onClick={() => {
                                  const filtered = newProduct.variants?.filter((_, i) => i !== idx);
                                  setNewProduct({...newProduct, variants: filtered});
                                }}
                                className="absolute top-2 right-2 text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  type="text" placeholder={t({ en: 'Name (EN)', ar: 'الاسم (EN)' })}
                                  value={v.name.en} onChange={(e) => {
                                    const updated = [...(newProduct.variants || [])];
                                    updated[idx].name.en = e.target.value;
                                    setNewProduct({...newProduct, variants: updated});
                                  }}
                                  className="w-full p-2 bg-gray-50 rounded-lg text-xs"
                                />
                                <input 
                                  type="text" placeholder={t({ en: 'Name (AR)', ar: 'الاسم (AR)' })}
                                  value={v.name.ar} onChange={(e) => {
                                    const updated = [...(newProduct.variants || [])];
                                    updated[idx].name.ar = e.target.value;
                                    setNewProduct({...newProduct, variants: updated});
                                  }}
                                  className="w-full p-2 bg-gray-50 rounded-lg text-xs text-right"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  type="number" placeholder={t({ en: 'Price', ar: 'السعر' })}
                                  value={v.price || 0} onChange={(e) => {
                                    const updated = [...(newProduct.variants || [])];
                                    updated[idx].price = Number(e.target.value) || 0;
                                    setNewProduct({...newProduct, variants: updated});
                                  }}
                                  className="w-full p-2 bg-gray-50 rounded-lg text-xs"
                                />
                                <input 
                                  type="number" placeholder={t({ en: 'Stock', ar: 'المخزون' })}
                                  value={v.stock || 0} onChange={(e) => {
                                    const updated = [...(newProduct.variants || [])];
                                    updated[idx].stock = Number(e.target.value) || 0;
                                    setNewProduct({...newProduct, variants: updated});
                                  }}
                                  className="w-full p-2 bg-gray-50 rounded-lg text-xs"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={handleSaveProduct}
                      className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all"
                    >
                      {editingProduct ? t({ en: 'Update Product', ar: 'تحديث المنتج' }) : t({ en: 'Create Product', ar: 'إنشاء المنتج' })}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {activeSubTab === 'tags' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{t({ en: 'Tag Management', ar: 'إدارة الوسوم' })}</h2>
            <button 
              onClick={() => {
                setEditingTag(null);
                setNewTag({ title: { en: '', ar: '' }, icon: 'Tag', bannerImage: '', isPublic: true, isPromoted: false, discountType: 'none', discountValue: 0 });
                setShowAddTag(true);
              }}
              className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t({ en: 'Add Tag', ar: 'إضافة وسم' })}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tags.map(tag => (
              <div key={tag.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                    <TagIcon className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{t(tag.title)}</h3>
                    <div className="flex gap-2 mt-1">
                      {tag.isPublic && <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full uppercase">Public</span>}
                      {tag.isPromoted && <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full uppercase">Promoted</span>}
                    </div>
                  </div>
                </div>
                {tag.bannerImage && (
                  <img src={tag.bannerImage || undefined} className="w-full h-32 object-cover rounded-xl mb-4" referrerPolicy="no-referrer" />
                )}
                {tag.discountType !== 'none' && (
                  <p className="text-sm font-bold text-green-600">
                    {tag.discountType === 'percentage' ? `${tag.discountValue}% Off` : `${tag.discountValue} Off`}
                  </p>
                )}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingTag(tag);
                      setNewTag(tag);
                      setShowAddTag(true);
                    }}
                    className="p-2 bg-white rounded-full shadow-md text-blue-500 hover:bg-blue-50"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteTag(tag.id)}
                    className="p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {showAddTag && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowAddTag(false)}
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white w-full max-w-lg rounded-3xl p-8 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
                >
                  <h3 className="text-2xl font-bold mb-6">{editingTag ? t({ en: 'Edit Tag', ar: 'تعديل الوسم' }) : t({ en: 'Add New Tag', ar: 'إضافة وسم جديد' })}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" placeholder={t({ en: 'Title (EN)', ar: 'العنوان (EN)' })}
                        value={newTag.title?.en} onChange={(e) => setNewTag({...newTag, title: { ...newTag.title!, en: e.target.value }})}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none"
                      />
                      <input 
                        type="text" placeholder={t({ en: 'Title (AR)', ar: 'العنوان (AR)' })}
                        value={newTag.title?.ar} onChange={(e) => setNewTag({...newTag, title: { ...newTag.title!, ar: e.target.value }})}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none text-right"
                      />
                    </div>
                    <ImageUpload 
                      label="Banner Image"
                      path={STORAGE_PATHS.TAGS}
                      currentUrl={newTag.bannerImage || undefined}
                      onUpload={(url) => setNewTag({ ...newTag, bannerImage: url })}
                    />
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" checked={newTag.isPublic}
                          onChange={(e) => setNewTag({...newTag, isPublic: e.target.checked})}
                        />
                        <span className="text-sm font-bold">{t({ en: 'Public Tag', ar: 'وسم عام' })}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" checked={newTag.isPromoted}
                          onChange={(e) => setNewTag({...newTag, isPromoted: e.target.checked})}
                        />
                        <span className="text-sm font-bold">{t({ en: 'Promoted (Banner)', ar: 'ترويج (بانر)' })}</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <select 
                        value={newTag.discountType} onChange={(e) => setNewTag({...newTag, discountType: e.target.value as any})}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none"
                      >
                        <option value="none">No Discount</option>
                        <option value="percentage">Percentage Off</option>
                        <option value="fixed">Fixed Amount Off</option>
                      </select>
                      {newTag.discountType !== 'none' && (
                        <input 
                          type="number" placeholder={t({ en: 'Discount Value', ar: 'قيمة الخصم' })}
                          value={newTag.discountValue || 0} onChange={(e) => setNewTag({...newTag, discountValue: Number(e.target.value) || 0})}
                          className="w-full p-4 bg-gray-50 rounded-xl border-none"
                        />
                      )}
                    </div>
                    <button 
                      onClick={handleSaveTag}
                      className="w-full bg-black text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      {t({ en: 'Save Tag', ar: 'حفظ الوسم' })}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{t({ en: 'Category Management', ar: 'إدارة الأقسام' })}</h2>
            <button 
              onClick={() => {
                setEditingCategory(null);
                setNewCategory({ 
                  title: '', description: '', icon: 'ph:package-bold', slug: '', isFeatured: false, parentId: null, bannerImageUrl: '',
                  locals: { title: { en: '', ar: '' }, description: { en: '', ar: '' } }
                });
                setShowAddCategory(true);
              }}
              className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t({ en: 'Add Category', ar: 'إضافة قسم' })}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white border border-gray-100 rounded-3xl p-6 flex gap-6 items-center shadow-sm relative group">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 overflow-hidden">
                  {cat.icon ? (
                    <Icon icon={cat.icon} className="w-8 h-8" />
                  ) : (
                    <Package className="w-8 h-8" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{t(cat.locals.title)}</h3>
                  <div className="flex items-center gap-2">
                    {cat.slug && <p className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-mono uppercase tracking-widest text-gray-400">{cat.slug}</p>}
                    <p className="text-xs text-gray-400">{cat.parentId ? t({ en: 'Sub-category', ar: 'قسم فرعي' }) : t({ en: 'Main Category', ar: 'قسم رئيسي' })}</p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingCategory(cat);
                      setNewCategory(cat);
                      setShowAddCategory(true);
                    }}
                    className="p-2 bg-white rounded-full shadow-md text-blue-500 hover:bg-blue-50"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {showAddCategory && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowAddCategory(false)}
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white w-full max-w-lg rounded-3xl p-8 relative z-10 shadow-2xl"
                >
                  <h3 className="text-2xl font-bold mb-6">{editingCategory ? t({ en: 'Edit Category', ar: 'تعديل القسم' }) : t({ en: 'Add New Category', ar: 'إضافة قسم جديد' })}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" placeholder={t({ en: 'Title (EN)', ar: 'العنوان (EN)' })}
                        value={newCategory.locals?.title.en} onChange={(e) => setNewCategory({...newCategory, locals: { ...newCategory.locals!, title: { ...newCategory.locals!.title, en: e.target.value } }})}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none"
                      />
                      <input 
                        type="text" placeholder={t({ en: 'Title (AR)', ar: 'العنوان (AR)' })}
                        value={newCategory.locals?.title.ar} onChange={(e) => setNewCategory({...newCategory, locals: { ...newCategory.locals!, title: { ...newCategory.locals!.title, ar: e.target.value } }})}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none text-right"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <textarea 
                        placeholder={t({ en: 'Description (EN)', ar: 'الوصف (EN)' })}
                        value={newCategory.locals?.description.en} onChange={(e) => setNewCategory({...newCategory, locals: { ...newCategory.locals!, description: { ...newCategory.locals!.description, en: e.target.value } }})}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none min-h-[80px]"
                      />
                      <textarea 
                        placeholder={t({ en: 'Description (AR)', ar: 'الوصف (AR)' })}
                        value={newCategory.locals?.description.ar} onChange={(e) => setNewCategory({...newCategory, locals: { ...newCategory.locals!, description: { ...newCategory.locals!.description, ar: e.target.value } }})}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none text-right min-h-[80px]"
                      />
                    </div>
                    <ImageUpload 
                      label="Banner Image"
                      path={STORAGE_PATHS.CATEGORIES}
                      currentUrl={newCategory.bannerImageUrl || undefined}
                      onUpload={(url) => setNewCategory({ ...newCategory, bannerImageUrl: url })}
                    />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" checked={newCategory.isFeatured} 
                          onChange={(e) => setNewCategory({...newCategory, isFeatured: e.target.checked})}
                          className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className="text-sm font-bold">{t({ en: 'Featured', ar: 'مميز' })}</span>
                      </label>
                      <select 
                        value={newCategory.parentId || ''} 
                        onChange={(e) => setNewCategory({...newCategory, parentId: e.target.value || null})}
                        className="flex-1 p-4 bg-gray-50 rounded-xl border-none text-sm"
                      >
                        <option value="">{t({ en: 'Main Category', ar: 'قسم رئيسي' })}</option>
                        {categories.filter(c => !c.parentId && c.id !== editingCategory?.id).map(c => (
                          <option key={c.id} value={c.id}>{t(c.locals.title)}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={handleSaveCategory}
                      className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all"
                    >
                      {editingCategory ? t({ en: 'Update Category', ar: 'تحديث القسم' }) : t({ en: 'Create Category', ar: 'إنشاء القسم' })}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {activeSubTab === 'stores' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{t({ en: 'Store Verification & Management', ar: 'توثيق وإدارة المتاجر' })}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stores.map(store => (
              <div key={store.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center group relative overflow-hidden">
                <div className="flex items-center gap-4">
                  {store.logoUrl ? (
                    <img src={store.logoUrl || undefined} className="w-16 h-16 rounded-2xl object-cover border border-gray-100" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                      <StoreIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{t(store.locals.name)}</h3>
                      {store.isDefault && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-black text-white rounded-full uppercase">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{store.location}</p>
                    <div className="mt-2 flex items-center gap-3">
                      {store.isVerified ? (
                        <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {t({ en: 'Verified', ar: 'موثق' })}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-orange-500">{t({ en: 'Pending Verification', ar: 'قيد التوثيق' })}</span>
                      )}
                      <button 
                        onClick={() => {
                          const msg = prompt(t({ en: 'Message to Store Owner:', ar: 'رسالة لصاحب المتجر:' }), store.adminMessage || '');
                          if (msg !== null) handleUpdateStoreMessage(store.id, msg);
                        }}
                        className="text-gray-400 hover:text-black transition-colors"
                        title={t({ en: 'Send Message', ar: 'إرسال رسالة' })}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {!store.isVerified && (
                    <button 
                      onClick={() => verifyStore(store.id)}
                      className="bg-black text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-gray-800"
                    >
                      {t({ en: 'Verify', ar: 'توثيق' })}
                    </button>
                  )}
                  <button 
                    onClick={async () => {
                      // If setting to default, unset others first (optional but good for UX)
                      if (!store.isDefault) {
                        const defaultStores = stores.filter(s => s.isDefault);
                        for (const ds of defaultStores) {
                          await updateDoc(doc(db, 'stores', ds.id), { isDefault: false });
                        }
                      }
                      await updateDoc(doc(db, 'stores', store.id), { isDefault: !store.isDefault });
                    }}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                      store.isDefault ? 'bg-gray-100 text-gray-500' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
                  >
                    {store.isDefault ? t({ en: 'Unset Default', ar: 'إلغاء الافتراضي' }) : t({ en: 'Set Default', ar: 'تعيين كافتراضي' })}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'app-settings' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{t({ en: 'App Settings', ar: 'إعدادات التطبيق' })}</h2>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
            {/* App Branding */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-500" />
                {t({ en: 'App Branding', ar: 'هوية التطبيق' })}
              </h3>
              <div className="space-y-4 mb-6">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t({ en: 'App Logo', ar: 'شعار التطبيق' })}</label>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center bg-gray-50 shrink-0">
                    {appSettings.logoUrl ? (
                      <img src={appSettings.logoUrl} alt="App Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-3xl italic rounded-2xl" style={{ backgroundColor: config.theme.primary }}>
                        {t(appSettings.appName || config.name).charAt(0)}
                      </div>
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-black transition-all flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-500">{t({ en: 'Upload Logo', ar: 'رفع الشعار' })}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadImage(file, `app-settings/logo_${Date.now()}_${file.name}`);
                          await updateAppSettings({ logoUrl: url });
                        } catch (err) {
                          console.error('Logo upload failed:', err);
                        }
                      }}
                    />
                  </label>
                  {appSettings.logoUrl && (
                    <button
                      onClick={() => updateAppSettings({ logoUrl: '' })}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title={t({ en: 'Remove logo', ar: 'إزالة الشعار' })}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t({ en: 'App Name (English)', ar: 'اسم التطبيق (إنجليزي)' })}</label>
                  <input
                    type="text"
                    value={appSettings.appName?.en || ''}
                    onChange={(e) => updateAppSettings({ appName: { ...appSettings.appName, en: e.target.value } })}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t({ en: 'App Name (Arabic)', ar: 'اسم التطبيق (عربي)' })}</label>
                  <input
                    type="text"
                    value={appSettings.appName?.ar || ''}
                    onChange={(e) => updateAppSettings({ appName: { ...appSettings.appName, ar: e.target.value } })}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium text-right"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t({ en: 'Description (English)', ar: 'الوصف (إنجليزي)' })}</label>
                  <textarea
                    value={appSettings.appDescription?.en || ''}
                    onChange={(e) => updateAppSettings({ appDescription: { ...appSettings.appDescription, en: e.target.value } })}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t({ en: 'Description (Arabic)', ar: 'الوصف (عربي)' })}</label>
                  <textarea
                    value={appSettings.appDescription?.ar || ''}
                    onChange={(e) => updateAppSettings({ appDescription: { ...appSettings.appDescription, ar: e.target.value } })}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium min-h-[100px] text-right"
                  />
                </div>
              </div>
            </div>

            {/* Currency Settings */}
            <div className="space-y-6 pt-8 border-t border-gray-100">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BadgeDollarSign className="w-5 h-5 text-emerald-500" />
                {t({ en: 'Currency Settings', ar: 'إعدادات العملة' })}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t({ en: 'Currency Code', ar: 'رمز العملة' })}</label>
                  <input
                    type="text"
                    placeholder="e.g., AED, USD"
                    value={appSettings.currency?.code || ''}
                    onChange={(e) => updateAppSettings({ 
                      currency: { 
                        ...(appSettings.currency || { symbol: { en: '', ar: '' } }), 
                        code: e.target.value.toUpperCase() 
                      } 
                    })}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t({ en: 'Symbol (English)', ar: 'الرمز (إنجليزي)' })}</label>
                  <input
                    type="text"
                    placeholder="e.g., AED, $"
                    value={appSettings.currency?.symbol?.en || ''}
                    onChange={(e) => updateAppSettings({ 
                      currency: { 
                        ...(appSettings.currency || { code: '' }), 
                        symbol: { ...(appSettings.currency?.symbol || { ar: '' }), en: e.target.value }
                      } 
                    })}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t({ en: 'Symbol (Arabic)', ar: 'الرمز (عربي)' })}</label>
                  <input
                    type="text"
                    placeholder="e.g., د.إ"
                    value={appSettings.currency?.symbol?.ar || ''}
                    onChange={(e) => updateAppSettings({ 
                      currency: { 
                        ...(appSettings.currency || { code: '' }), 
                        symbol: { ...(appSettings.currency?.symbol || { en: '' }), ar: e.target.value }
                      } 
                    })}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium text-right"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-6 pt-8 border-t border-gray-100">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-500" />
                {t({ en: 'Social Links', ar: 'روابط التواصل الاجتماعي' })}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['instagram', 'twitter', 'facebook', 'whatsapp', 'snapchat', 'tiktok'].map((platform) => (
                  <div key={platform} className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </label>
                    <input
                      type="text"
                      placeholder={platform === 'whatsapp' ? 'e.g., 96812345678' : `https://${platform}.com/username`}
                      value={appSettings.socialLinks?.[platform as keyof NonNullable<AppSettings['socialLinks']>] || ''}
                      onChange={(e) => updateAppSettings({ 
                        socialLinks: { 
                          ...(appSettings.socialLinks || {}), 
                          [platform]: e.target.value 
                        } 
                      })}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4 pt-8 border-t border-gray-100">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                {t({ en: 'Payment Methods', ar: 'طرق الدفع' })}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5" />
                      <span className="font-bold">{t({ en: 'Online Payment', ar: 'الدفع الإلكتروني' })}</span>
                    </div>
                    <button 
                      onClick={() => updateAppSettings({
                        paymentMethods: { ...appSettings.paymentMethods, online: { ...appSettings.paymentMethods.online, enabled: !appSettings.paymentMethods.online.enabled } }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${appSettings.paymentMethods.online.enabled ? 'bg-black' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appSettings.paymentMethods.online.enabled ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500 font-bold uppercase">{t({ en: 'Pre-Transaction', ar: 'عملية مسبقة' })}</span>
                    <button 
                      onClick={() => updateAppSettings({
                        paymentMethods: { ...appSettings.paymentMethods, online: { ...appSettings.paymentMethods.online, preTransaction: !appSettings.paymentMethods.online.preTransaction } }
                      })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${appSettings.paymentMethods.online.preTransaction ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${appSettings.paymentMethods.online.preTransaction ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5" />
                      <span className="font-bold">{t({ en: 'Cash on Delivery', ar: 'الدفع عند الاستلام' })}</span>
                    </div>
                    <button 
                      onClick={() => updateAppSettings({
                        paymentMethods: { ...appSettings.paymentMethods, cod: { ...appSettings.paymentMethods.cod, enabled: !appSettings.paymentMethods.cod.enabled } }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${appSettings.paymentMethods.cod.enabled ? 'bg-black' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appSettings.paymentMethods.cod.enabled ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500 font-bold uppercase">{t({ en: 'Pre-Transaction', ar: 'عملية مسبقة' })}</span>
                    <button 
                      onClick={() => updateAppSettings({
                        paymentMethods: { ...appSettings.paymentMethods, cod: { ...appSettings.paymentMethods.cod, preTransaction: !appSettings.paymentMethods.cod.preTransaction } }
                      })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${appSettings.paymentMethods.cod.preTransaction ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${appSettings.paymentMethods.cod.preTransaction ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-gray-100">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-emerald-500" />
                {t({ en: 'Features', ar: 'الميزات' })}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <StoreIcon className="w-5 h-5" />
                    <div className="flex flex-col">
                      <span className="font-bold">{t({ en: 'Marketplace', ar: 'السوق المتعدد' })}</span>
                      <span className="text-[10px] text-gray-500">{t({ en: 'Allow users to register as stores', ar: 'السماح للمستخدمين بالتسجيل كمتاجر' })}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => updateAppSettings({
                      features: { 
                        ...appSettings.features, 
                        marketplace: !appSettings.features?.marketplace,
                        drivers: appSettings.features?.drivers ?? false
                      }
                    })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${appSettings.features?.marketplace ? 'bg-black' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appSettings.features?.marketplace ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5" />
                    <div className="flex flex-col">
                      <span className="font-bold">{t({ en: 'Drivers', ar: 'السائقين' })}</span>
                      <span className="text-[10px] text-gray-500">{t({ en: 'Allow users to register as drivers', ar: 'السماح للمستخدمين بالتسجيل كسائقين' })}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => updateAppSettings({
                      features: { 
                        ...appSettings.features, 
                        drivers: !appSettings.features?.drivers,
                        marketplace: appSettings.features?.marketplace ?? false,
                        guestCheckout: appSettings.features?.guestCheckout ?? false
                      }
                    })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${appSettings.features?.drivers ? 'bg-black' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appSettings.features?.drivers ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5" />
                    <div className="flex flex-col">
                      <span className="font-bold">{t({ en: 'Guest Checkout', ar: 'الطلب كزائر' })}</span>
                      <span className="text-[10px] text-gray-500">{t({ en: 'Allow unauthenticated users to place orders', ar: 'السماح للمستخدمين غير المسجلين بالطلب' })}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => updateAppSettings({
                      features: { 
                        ...appSettings.features, 
                        guestCheckout: !appSettings.features?.guestCheckout,
                        marketplace: appSettings.features?.marketplace ?? false,
                        drivers: appSettings.features?.drivers ?? false
                      }
                    })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${appSettings.features?.guestCheckout ? 'bg-black' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appSettings.features?.guestCheckout ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-gray-100">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-500" />
                {t({ en: 'WhatsApp Orders', ar: 'طلبات واتساب' })}
              </h3>
              <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5" />
                    <div className="flex flex-col">
                      <span className="font-bold">{t({ en: 'Send Orders to WhatsApp', ar: 'إرسال الطلبات إلى واتساب' })}</span>
                      <span className="text-[10px] text-gray-500">{t({ en: 'Directly send orders to an admin WhatsApp number', ar: 'إرسال الطلبات مباشرة إلى رقم واتساب المسؤول' })}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => updateAppSettings({
                      whatsappOrders: { 
                        phoneNumber: appSettings.whatsappOrders?.phoneNumber || '',
                        enabled: !appSettings.whatsappOrders?.enabled 
                      }
                    })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${appSettings.whatsappOrders?.enabled ? 'bg-black' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appSettings.whatsappOrders?.enabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                {appSettings.whatsappOrders?.enabled && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">{t({ en: 'Admin WhatsApp Number', ar: 'رقم واتساب المسؤول' })}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 1234567890 (include country code)"
                      value={appSettings.whatsappOrders?.phoneNumber || ''}
                      onChange={(e) => updateAppSettings({ whatsappOrders: { enabled: true, phoneNumber: e.target.value } })}
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-gray-100">
              <h3 className="text-lg font-bold">{t({ en: 'Delivery Restrictions', ar: 'قيود التوصيل' })}</h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="font-bold">{t({ en: 'Restrict delivery to regions', ar: 'تقييد التوصيل بالمناطق' })}</span>
                    <span className="text-[10px] text-gray-500">{t({ en: 'Prevent customers from placing orders outside defined regions', ar: 'منع العملاء من تقديم طلبات خارج المناطق المحددة' })}</span>
                  </div>
                </div>
                <button 
                  onClick={() => updateAppSettings({
                    restrictDeliveryToRegions: !appSettings.restrictDeliveryToRegions
                  })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${appSettings.restrictDeliveryToRegions ? 'bg-black' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appSettings.restrictDeliveryToRegions ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'pages' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{t({ en: 'Page Management', ar: 'إدارة الصفحات' })}</h2>
            <button 
              onClick={openNewPageEditor}
              className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t({ en: 'Add Dynamic Page', ar: 'إضافة صفحة ديناميكية' })}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['home', 'shop', 'contact', 'policy', 'features'].map(id => (
              <div key={id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group hover:shadow-xl transition-all relative">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-2">
                  {id === 'home' ? t({ en: 'Home Page', ar: 'الصفحة الرئيسية' }) : 
                   id === 'shop' ? t({ en: 'Shop Page', ar: 'صفحة المتجر' }) : 
                   id === 'contact' ? t({ en: 'Contact Us', ar: 'اتصل بنا' }) :
                   id === 'features' ? t({ en: 'Features Page', ar: 'صفحة المميزات' }) :
                   t({ en: 'Policies', ar: 'السياسات' })}
                </h3>
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-6">System Page</p>
                <button 
                  onClick={() => openPageEditor(id)}
                  className="w-full py-4 bg-gray-100 text-black rounded-2xl font-bold hover:bg-black hover:text-white transition-all text-sm"
                >
                  {t({ en: 'Edit Full Screen', ar: 'تعديل ملء الشاشة' })}
                </button>
              </div>
            ))}
            
            {allPages.filter(p => !['home', 'contact', 'policy', 'features'].includes(p.id)).map(page => (
              <div key={page.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group hover:shadow-xl transition-all relative">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-2">{page.id}</h3>
                <p className="text-xs font-black text-emerald-300 uppercase tracking-widest mb-6">{t({ en: 'Dynamic Page', ar: 'صفحة ديناميكية' })}</p>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => openPageEditor(page.id)}
                    className="flex-1 py-4 bg-gray-100 text-black rounded-2xl font-bold hover:bg-black hover:text-white transition-all text-sm"
                  >
                    {t({ en: 'Edit', ar: 'تعديل' })}
                  </button>
                  <button 
                    onClick={async () => {
                      if (confirm(t({ en: 'Delete this page?', ar: 'حذف هذه الصفحة؟' }))) {
                        await deleteDoc(doc(db, 'pages', page.id));
                      }
                    }}
                    className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400">Path: /p/{page.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'delivery' && <DeliveryAdminManagement categories={categories} />}

      {activeSubTab === 'drivers' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{t({ en: 'Driver Verification', ar: 'توثيق السائقين' })}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {drivers.map(driver => (
              <div key={driver.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{driver.vehicleInfo.model} ({driver.vehicleInfo.year})</h3>
                  <p className="text-sm text-gray-400">{driver.vehicleInfo.plateNumber}</p>
                  <div className="mt-2">
                    {driver.isVerified ? (
                      <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {t({ en: 'Verified', ar: 'موثق' })}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-orange-500">{t({ en: 'Pending Verification', ar: 'قيد التوثيق' })}</span>
                    )}
                  </div>
                </div>
                {!driver.isVerified && (
                  <button 
                    onClick={() => verifyDriver(driver.id)}
                    className="bg-black text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-gray-800"
                  >
                    {t({ en: 'Verify', ar: 'توثيق' })}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'orders' && (
        <div className="space-y-6">
          <OrdersList 
            title={t({ en: 'Order Management', ar: 'إدارة الطلبات' })}
            features={{ 
              canAssignDriver: true, 
              canChangeStatus: true,
              canContactCustomer: true 
            }}
            showCustomerDetails={true}
          />
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{t({ en: 'User Management', ar: 'إدارة المستخدمين' })}</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" placeholder={t({ en: 'Search users by name or email...', ar: 'البحث عن المستخدمين بالاسم أو البريد...' })}
              value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.filter(u => 
              (u.displayName || '').toLowerCase().includes(userSearchQuery.toLowerCase()) || 
              (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase())
            ).map(u => (
              <div key={u.uid} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                      {u.displayName ? u.displayName[0] : '?'}
                    </div>
                    <div>
                      <h3 className="font-bold">{u.displayName || 'No Name'}</h3>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  {u.isBanned && (
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded-full uppercase">
                      {t({ en: 'Banned', ar: 'محظور' })}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t({ en: 'Roles', ar: 'الأدوار' })}</label>
                    <div className="flex flex-wrap gap-1">
                      {['admin', 'customer', 'store', 'driver'].map(role => (
                        <button
                          key={role}
                          onClick={() => {
                            const roles = u.roles || [];
                            const newRoles = roles.includes(role as any) 
                              ? roles.filter(r => r !== role)
                              : [...roles, role as any];
                            updateUserRoles(u.uid, newRoles);
                          }}
                          className={`px-2 py-1 rounded-full text-[8px] font-bold uppercase transition-all ${
                            (u.roles || []).includes(role as any) 
                              ? 'bg-black text-white' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => toggleUserBan(u.uid, !!u.isBanned)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        u.isBanned ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      {u.isBanned ? t({ en: 'Unban', ar: 'إلغاء الحظر' }) : t({ en: 'Ban', ar: 'حظر' })}
                    </button>
                    <button 
                      onClick={() => setSelectedUser(u)}
                      className="flex-1 py-2 bg-blue-100 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-200 transition-all"
                    >
                      {t({ en: 'Message', ar: 'رسالة' })}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">{t({ en: 'Send Message', ar: 'إرسال رسالة' })}</h2>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {t({ en: 'To:', ar: 'إلى:' })} <span className="font-bold text-black">{selectedUser?.displayName || ''}</span>
              </p>
              <textarea 
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder={t({ en: 'Type your message here...', ar: 'اكتب رسالتك هنا...' })}
                className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none resize-none"
              />
              <button 
                onClick={sendAdminMessage}
                disabled={isSendingMessage || !adminMessage.trim()}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSendingMessage ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t({ en: 'Send Message', ar: 'إرسال الرسالة' })}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {activeSubTab === 'promotions' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{t({ en: 'Global Promotions', ar: 'العروض الترويجية العامة' })}</h2>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Title (English)', ar: 'العنوان (إنجليزي)' })}</label>
                <input
                  type="text"
                  placeholder="Big Summer Sale!"
                  value={promoTitleEn}
                  onChange={(e) => setPromoTitleEn(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Title (Arabic)', ar: 'العنوان (عربي)' })}</label>
                <input
                  type="text"
                  placeholder="تخفيضات الصيف الكبرى!"
                  value={promoTitleAr}
                  onChange={(e) => setPromoTitleAr(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium text-right"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Body (English)', ar: 'المحتوى (إنجليزي)' })}</label>
                <textarea
                  placeholder="Get up to 50% off on all electronics this weekend."
                  value={promoBodyEn}
                  onChange={(e) => setPromoBodyEn(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Body (Arabic)', ar: 'المحتوى (عربي)' })}</label>
                <textarea
                  placeholder="احصل على خصم يصل إلى 50٪ على جميع الإلكترونيات في عطلة نهاية الأسبوع هذه."
                  value={promoBodyAr}
                  onChange={(e) => setPromoBodyAr(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium min-h-[120px] text-right"
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (!promoTitleEn || !promoTitleAr || !promoBodyEn || !promoBodyAr) {
                  alert('Please fill all fields');
                  return;
                }
                sendPromotion(
                  { en: promoTitleEn, ar: promoTitleAr },
                  { en: promoBodyEn, ar: promoBodyAr }
                );
                setPromoTitleEn(''); setPromoTitleAr('');
                setPromoBodyEn(''); setPromoBodyAr('');
              }}
              className="w-full py-5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              {t({ en: 'Broadcast Promotion to All Users', ar: 'بث العرض لجميع المستخدمين' })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TrackingDrawer = ({ 
  isOpen, 
  onClose, 
  order, 
  t 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  order: Order | null,
  t: (ls: any) => string
}) => {
  if (!order || !order.driverId) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative bg-white w-full max-w-xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t({ en: 'Track Your Order', ar: 'تتبع طلبك' })}</h2>
                  <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">#{order.id.slice(0, 8)}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <DeliveryTracker 
                driverId={order.driverId} 
                destinationCoords={order.customerInfo.destinationCoords} 
              />
            </div>

            <div className="p-6 border-t border-gray-100 shrink-0">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-900 transition-all shadow-lg shadow-black/10"
              >
                {t({ en: 'Close Tracking', ar: 'إغلاق التتبع' })}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface OrdersListFeatureOptions {
  canAssignDriver?: boolean;
  canChangeStatus?: boolean;
  canChangeDeliveryStatus?: boolean;
  canContactDriver?: boolean;
  canContactCustomer?: boolean;
}

const OrdersList = ({
  userId,
  driverId,
  storeId,
  status,
  features = {},
  title,
  emptyMessage,
  showCustomerDetails = false
}: {
  userId?: string;
  driverId?: string;
  storeId?: string;
  status?: string;
  features?: OrdersListFeatureOptions;
  title?: string;
  emptyMessage?: string;
  showCustomerDetails?: boolean;
}) => {
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { appSettings } = useContext(SettingsContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  useEffect(() => {
    let constraints: any[] = [orderBy('createdAt', 'desc')];
    if (userId) constraints.push(where('userId', '==', userId));
    if (driverId) constraints.push(where('driverId', '==', driverId));
    if (storeId) constraints.push(where('storeId', '==', storeId));
    if (status) constraints.push(where('status', '==', status));

    const q = query(collection(db, 'orders'), ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));
    return unsub;
  }, [userId, driverId, storeId, status]);

  useEffect(() => {
    if (features.canAssignDriver) {
      const unsub = onSnapshot(collection(db, 'drivers'), (snap) => {
        setDrivers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'drivers'));
      return unsub;
    }
  }, [features.canAssignDriver]);

  const assignDriver = async (orderId: string, dId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        driverId: dId, 
        deliveryStatus: 'assigned' 
      });

      const orderSnap = await getDoc(doc(db, 'orders', orderId));
      if (orderSnap.exists()) {
        const orderData = orderSnap.data() as Order;
        if (orderData.userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: orderData.userId,
            title: { en: 'Driver Assigned', ar: 'تم تعيين سائق' },
            body: { 
              en: `A driver has been assigned to your order #${orderId.slice(0, 5)}.`, 
              ar: `تم تعيين سائق لطلبك رقم #${orderId.slice(0, 5)}.` 
            },
            type: 'order_update',
            read: false,
            createdAt: serverTimestamp(),
            metadata: { orderId }
          });
        }

        const driverSnap = await getDoc(doc(db, 'drivers', dId));
        if (driverSnap.exists()) {
          const driverData = driverSnap.data() as Driver;
          await addDoc(collection(db, 'notifications'), {
            userId: driverData.userId,
            title: { en: 'New Delivery Assigned', ar: 'تم تعيين مهمة توصيل جديدة' },
            body: { 
              en: `You have a new delivery assignment for order #${orderId.slice(0, 5)}.`, 
              ar: `لديك مهمة توصيل جديدة للطلب رقم #${orderId.slice(0, 5)}.` 
            },
            type: 'order_update',
            read: false,
            createdAt: serverTimestamp(),
            metadata: { orderId }
          });
        }
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      alert(t({ en: 'Error assigning driver', ar: 'خطأ في تعيين سائق' }));
    }
  };

  const updateDeliveryStatus = async (orderId: string, deliveryStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { deliveryStatus });
      
      const orderSnap = await getDoc(doc(db, 'orders', orderId));
      if (orderSnap.exists()) {
        const orderData = orderSnap.data() as Order;
        if (orderData.userId) {
          const msgTitle = deliveryStatus === 'picked_up' ? 
            { en: 'Order Out for Delivery', ar: 'الطلب في الطريق إليك' } : 
            { en: 'Order Delivered', ar: 'تم توصيل الطلب' };
          const msgBody = deliveryStatus === 'picked_up' ?
            { en: `Your order #${orderId.slice(0, 5)} has been picked up and is on its way!`, ar: `تم استلام طلبك رقم #${orderId.slice(0, 5)} وهو في الطريق إليك!` } :
            { en: `Your order #${orderId.slice(0, 5)} has been delivered. Enjoy!`, ar: `تم توصيل طلبك رقم #${orderId.slice(0, 5)}. استمتع به!` };

          await addDoc(collection(db, 'notifications'), {
            userId: orderData.userId,
            title: msgTitle,
            body: msgBody,
            type: 'order_update',
            read: false,
            createdAt: serverTimestamp(),
            metadata: { orderId }
          });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(t({ en: 'Error updating status', ar: 'خطأ في تحديث الحالة' }));
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      console.error('Error changing order status:', error);
      alert(t({ en: 'Error changing order status', ar: 'خطأ في تغيير حالة الطلب' }));
    }
  };

  return (
    <div className="space-y-6">
      {title && <h2 className="text-xl md:text-2xl font-bold">{title}</h2>}
      
      {orders.length === 0 && (
        <div className="py-12 md:py-24 text-center bg-gray-50 rounded-2xl md:rounded-3xl border border-gray-100 flex flex-col items-center justify-center">
          <ShoppingBag className="w-12 h-12 md:w-16 md:h-16 text-gray-200 mb-4 md:mb-6" />
          <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-800">{emptyMessage || t({ en: 'No orders found', ar: 'لا توجد طلبات' })}</h2>
          <p className="text-gray-500 text-sm">{t({ en: 'Orders matching your criteria will appear here.', ar: 'الطلبات المطابقة للمعايير ستظهر هنا.' })}</p>
        </div>
      )}

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">{t({ en: 'Order', ar: 'الطلب' })} #{order.id.slice(-6)}</p>
                <p className="font-bold text-lg">{order.totalAmount.toFixed(2)} {t(appSettings.currency?.symbol || config.currency.symbol)}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt?.seconds * 1000).toLocaleString()}</p>
              </div>
              <div className="text-right flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                <p className="text-xs font-bold text-gray-400 uppercase hidden sm:block">{t({ en: 'Status', ar: 'الحالة' })}</p>
                
                {features.canChangeStatus ? (
                  <select 
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="w-full sm:w-auto bg-gray-50 border-none text-xs rounded-xl py-2 px-3 focus:ring-2 focus:ring-black outline-none font-bold"
                  >
                    <option value="pending">{t({ en: 'Pending', ar: 'معلق' })}</option>
                    <option value="processing">{t({ en: 'Processing', ar: 'قيد التنفيذ' })}</option>
                    <option value="shipped">{t({ en: 'Shipped', ar: 'تم الشحن' })}</option>
                    <option value="delivered">{t({ en: 'Delivered', ar: 'تم التوصيل' })}</option>
                    <option value="cancelled">{t({ en: 'Cancelled', ar: 'ملغي' })}</option>
                  </select>
                ) : (
                  <OrderStatusBadge status={order.status} deliveryStatus={order.deliveryStatus} t={t} />
                )}
              </div>
            </div>

            {/* Items display */}
            <div className="space-y-2 py-4 border-t border-gray-50">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs md:text-sm text-gray-600">
                  <span className="font-medium">{item.name} × {item.quantity}</span>
                  <span>{(item.price * item.quantity).toFixed(2)} {t(appSettings.currency?.symbol || config.currency.symbol)}</span>
                </div>
              ))}
            </div>
            
            {showCustomerDetails && (
              <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">{t({ en: 'Customer Details', ar: 'بيانات العميل' })}</p>
                  <p className="text-sm font-medium">{order.customerInfo.name}</p>
                  <p className="text-sm text-gray-500">{order.customerInfo.email}</p>
                  <p className="text-sm text-gray-500 mt-1">{order.customerInfo.address}</p>
                </div>
                {(features.canContactCustomer) && order.customerInfo.addressDetails?.customerPhone && (
                  <div className="flex items-center justify-start md:justify-end">
                    <a 
                      href={`https://wa.me/${order.customerInfo.addressDetails.customerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors"
                    >
                      {t({ en: 'Contact via WhatsApp', ar: 'مراسلة عبر واتساب' })}
                    </a>
                  </div>
                )}
              </div>
            )}

            {features.canAssignDriver && (
              <div className="flex flex-wrap gap-4 items-center pt-4 mt-4 border-t border-gray-50">
                <p className="text-sm font-bold text-gray-500">{t({ en: 'Assign to Driver:', ar: 'إسناد لسائق:' })}</p>
                <div className="flex flex-wrap gap-2">
                  {drivers.filter(d => d.isVerified).map(driver => (
                    <button
                      key={driver.id}
                      onClick={() => assignDriver(order.id, driver.userId)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        order.driverId === driver.userId 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {driver.vehicleInfo.model} - {driver.vehicleInfo.plateNumber}
                    </button>
                  ))}
                  {drivers.filter(d => d.isVerified).length === 0 && (
                    <span className="text-xs text-gray-400">{t({ en: 'No verified drivers available', ar: 'لا يوجد سائقين موثقين متاحين' })}</span>
                  )}
                </div>
              </div>
            )}

            {features.canChangeDeliveryStatus && (
              <div className="flex gap-2 pt-4 mt-4 border-t border-gray-50">
                <button 
                  onClick={() => updateDeliveryStatus(order.id, 'picked_up')}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-colors ${order.deliveryStatus === 'picked_up' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {t({ en: 'Mark Picked Up', ar: 'تم الاستلام' })}
                </button>
                <button 
                  onClick={() => updateDeliveryStatus(order.id, 'delivered')}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-colors ${order.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  {t({ en: 'Mark Delivered', ar: 'تم التوصيل' })}
                </button>
              </div>
            )}

            {!features.canChangeDeliveryStatus && order.deliveryStatus === 'picked_up' && order.driverId && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <button 
                  onClick={() => {
                    setTrackingOrder(order);
                    setIsTrackingOpen(true);
                  }}
                  className="w-full py-3 md:py-4 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-sm hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 border border-emerald-100"
                >
                  <Navigation className="w-4 h-4 animate-pulse" />
                  {t({ en: 'Track Real-time Delivery', ar: 'تتبع التوصيل المباشر' })}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isTrackingOpen && trackingOrder && trackingOrder.driverId && trackingOrder.customerInfo.destinationCoords && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrackingOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative bg-white w-full max-w-xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{t({ en: 'Track Your Order', ar: 'تتبع طلبك' })}</h2>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">#{trackingOrder.id.slice(0, 8)}</p>
                  </div>
                </div>
                <button onClick={() => setIsTrackingOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <DeliveryTracker 
                  driverId={trackingOrder.driverId} 
                  destinationCoords={trackingOrder.customerInfo.destinationCoords} 
                />
              </div>

              <div className="p-6 border-t border-gray-100 shrink-0">
                <button 
                  onClick={() => setIsTrackingOpen(false)}
                  className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-900 transition-all shadow-lg shadow-black/10"
                >
                  {t({ en: 'Close Tracking', ar: 'إغلاق التتبع' })}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const OrdersPage = () => {
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-1.5 md:p-4 pb-24">
      <OrdersList 
        userId={user.uid} 
        title={t({ en: 'My Orders', ar: 'طلباتي' })}
      />
    </div>
  );
};

const PuckPage = ({ pageId, onNavigate }: { pageId: string, onNavigate?: (page: string) => void }) => {
  const { t, lang } = useContext(LanguageContext);
  const location = useLocation();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isManualFeaturesContent = (pageData: any) => {
    if (!pageData || typeof pageData !== 'object') return false;
    return Boolean(pageData?.root?.props?.__manualFeaturesPage);
  };

  const normalizePageContent = (rawPageContent: any) => {
    const base = rawPageContent && typeof rawPageContent === 'object' ? rawPageContent : { content: [], root: { props: {} } };
    const rawContent = Array.isArray(base.content) ? base.content : [];
    let hasHeroOnFeatures = false;

    const normalizedContent = rawContent
      .filter((block: any) => block && typeof block === 'object' && typeof block.type === 'string')
      .filter((block: any) => {
        if (pageId !== 'features' || block.type !== 'Hero') return true;
        if (hasHeroOnFeatures) return false;
        hasHeroOnFeatures = true;
        return true;
      })
      .map((block: any) => {
        const props = (block.props && typeof block.props === 'object') ? { ...block.props } : {};
        if (block.type === 'Hero') {
          props.actions = Array.isArray(props.actions) ? props.actions.filter(Boolean) : [];
        }
        return { ...block, props };
      });

    return {
      ...base,
      content: normalizedContent,
      root: base.root && typeof base.root === 'object' ? base.root : { props: {} },
    };
  };

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const docRef = doc(db, 'pages', pageId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const body = data.body || {};
          // Fallback if current language doesn't have content but the other does
          const pageContent = body[lang] || body[lang === 'en' ? 'ar' : 'en'];
          if (pageId === 'features' && !isManualFeaturesContent(pageContent)) {
            setContent(null);
            return;
          }
          setContent(normalizePageContent(pageContent));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `pages/${pageId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [pageId, lang]);

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );

  if (!content) {
    if (pageId === 'home' || pageId === 'shop') {
      return (
        <div className="py-20 text-center px-6">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-4">
            {pageId === 'home' ? t({ en: 'Welcome to Shop', ar: 'مرحبا بك في المتجر' }) : t({ en: 'Shop The Market', ar: 'تسوق من السوق' })}
          </h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">{t({ en: 'This page content is currently empty. Visit the admin panel to customize it.', ar: 'محتوى هذه الصفحة فارغ حالياً. قم بزيارة لوحة التحكم لتخصيصها.' })}</p>
          {pageId === 'home' && (
            <button onClick={() => onNavigate?.('shop')} className="px-8 py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all">
              {t({ en: 'Start Shopping', ar: 'ابدأ التسوق' })}
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="max-w-4xl mx-auto py-32 text-center px-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <h1 className="text-2xl md:text-4xl font-black mb-4 uppercase tracking-tighter italic">{t({ en: 'Page Not Published', ar: 'الصفحة غير منشورة' })}</h1>
        <p className="text-gray-500 mb-8 font-medium">{t({ en: 'This page content has not been set up yet.', ar: 'لم يتم إعداد محتوى هذه الصفحة بعد.' })}</p>
      </div>
    );
  }

  return (
    <div className="puck-content" key={location.search} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Render config={puckConfig} data={content} />
    </div>
  );
};

const FilterSidebar = ({ 
  categories, 
  brands, 
  selectedCategoryIds, 
  setSelectedCategoryId, 
  selectedBrand, 
  setSelectedBrand, 
  priceRange, 
  setPriceRange,
  tags,
  selectedTagId,
  setSelectedTagId
}: { 
  categories: Category[], 
  brands: string[], 
  selectedCategoryIds: string[], 
  setSelectedCategoryId: (c: string) => void, 
  selectedBrand: string, 
  setSelectedBrand: (b: string) => void, 
  priceRange: [number, number], 
  setPriceRange: (r: [number, number]) => void,
  tags: Tag[],
  selectedTagId: string,
  setSelectedTagId: (id: string) => void
}) => {
  const { t } = useContext(LanguageContext);
  const { appSettings } = useContext(SettingsContext);

  return (
    <div className="w-64 flex-shrink-0 space-y-8 pr-8 border-r border-gray-100 hidden md:block">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">{t({ en: 'Tags', ar: 'الوسوم' })}</h3>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setSelectedTagId('')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${selectedTagId === '' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            {t({ en: 'All', ar: 'الكل' })}
          </button>
          {tags.map(tag => (
            <button 
              key={tag.id}
              onClick={() => setSelectedTagId(tag.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${selectedTagId === tag.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              <TagIcon className="w-3 h-3" />
              {t(tag.title)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">{t({ en: 'Categories', ar: 'الفئات' })}</h3>
        <div className="space-y-2">
          <button 
            onClick={() => setSelectedCategoryId('')}
            className={`block text-sm transition-all ${selectedCategoryIds.length === 0 ? 'font-bold text-black border-l-4 border-black pl-2' : 'text-gray-500 hover:text-black border-l-4 border-transparent pl-2'}`}
          >
            {t({ en: 'All Categories', ar: 'جميع الفئات' })}
          </button>
          {categories.map(c => (
            <button 
              key={c.id}
              onClick={() => setSelectedCategoryId(c.slug || c.id)}
              className={`flex items-center gap-2 text-sm transition-all ${selectedCategoryIds.includes(c.id) ? 'font-black text-black scale-105 border-l-4 border-black pl-2' : 'text-gray-500 hover:text-black border-l-4 border-transparent pl-2'}`}
            >
              {t(c.locals.title)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">{t({ en: 'Brands', ar: 'العلامات التجارية' })}</h3>
        <div className="space-y-2">
          <button 
            onClick={() => setSelectedBrand('')}
            className={`block text-sm ${selectedBrand === '' ? 'font-bold text-black' : 'text-gray-500 hover:text-black'}`}
          >
            {t({ en: 'All Brands', ar: 'جميع الماركات' })}
          </button>
          {brands.map(b => (
            <button 
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={`block text-sm ${selectedBrand === b ? 'font-bold text-black' : 'text-gray-500 hover:text-black'}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">{t({ en: 'Price Range', ar: 'نطاق السعر' })}</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="Min"
              value={priceRange[0] || 0}
              onChange={(e) => setPriceRange([parseFloat(e.target.value) || 0, priceRange[1]])}
              className="w-full p-2 bg-gray-50 rounded-lg text-xs border-none focus:ring-1 focus:ring-black"
            />
            <span className="text-gray-300">-</span>
            <input 
              type="number" 
              placeholder="Max"
              value={priceRange[1] || 0}
              onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value) || 1000])}
              className="w-full p-2 bg-gray-50 rounded-lg text-xs border-none focus:ring-1 focus:ring-black"
            />
          </div>
          <input 
            type="range" 
            min="0" 
            max="1000" 
            step="10"
            value={priceRange[1] || 1000}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
            className="w-full accent-black"
          />
          <div className="text-[10px] text-gray-400 flex justify-between">
            <span>0 {t(appSettings.currency?.symbol || config.currency.symbol)}</span>
            <span>1000+ {t(appSettings.currency?.symbol || config.currency.symbol)}</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => {
          setSelectedCategoryId('');
          setSelectedBrand('');
          setSelectedTagId('');
          setPriceRange([0, 1000]);
        }}
        className="text-xs font-bold text-red-500 hover:underline"
      >
        {t({ en: 'Reset Filters', ar: 'إعادة تعيين الفلاتر' })}
      </button>
    </div>
  );
};

const CategoryProducts = ({ categoryId, onSelectProduct }: { categoryId: string, onSelectProduct: (p: Product) => void }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useContext(LanguageContext);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, 'products'),
          where('categories', 'array-contains', categoryId),
          where('status', '==', 'published'),
          limit(4)
        );
        const snap = await getDocs(q);
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryId]);

  if (loading) return <div className="h-20 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div></div>;
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4 mt-4">
      {products.map(p => (
        <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
      ))}
    </div>
  );
};

export const FilterDrawer = ({ 
  onClose,
  categories,
  selectedCategoryIds,
  setSelectedCategoryId,
  brands,
  selectedBrand,
  setSelectedBrand,
  priceRange,
  setPriceRange,
  currency,
  sortOption,
  setSortOption,
  tags,
  selectedTagId,
  setSelectedTagId
}: { 
  onClose: () => void;
  categories: Category[];
  selectedCategoryIds: string[];
  setSelectedCategoryId: (c: string) => void;
  brands: string[];
  selectedBrand: string;
  setSelectedBrand: (b: string) => void;
  priceRange: [number, number];
  setPriceRange: (min: number, max: number) => void;
  currency: string;
  sortOption: string;
  setSortOption: (s: string) => void;
  tags: Tag[];
  selectedTagId: string;
  setSelectedTagId: (id: string) => void;
}) => {
  const { t, lang } = useContext(LanguageContext);
  const [activeTab, setActiveTab] = useState<'sort' | 'categories' | 'brands' | 'price' | 'tags'>('sort');

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-gray-100 pb-4">
          <DrawerTitle>{t({ en: 'Refine Selection', ar: 'تحسين الاختيار' })}</DrawerTitle>
          <DrawerTitleHidden>{t({ en: 'Filter and Sort Products', ar: 'تصفية وترتيب المنتجات' })}</DrawerTitleHidden>
        </DrawerHeader>
        
        <div className="flex border-b border-gray-100 sticky top-0 bg-white z-20 overflow-x-auto no-scrollbar">
          {[
            { id: 'sort', label: { en: 'Sort', ar: 'ترتيب' } },
            { id: 'categories', label: { en: 'Categories', ar: 'الفئات' } },
            { id: 'brands', label: { en: 'Brands', ar: 'العلامات' } },
            { id: 'price', label: { en: 'Price', ar: 'السعر' } },
            { id: 'tags', label: { en: 'Tags', ar: 'الوسوم' } }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[80px] py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20 no-scrollbar">
          {activeTab === 'sort' && (
            <div className="space-y-3">
              {[
                { id: 'newest', label: { en: 'Newest Arrivals', ar: 'وصل حديثاً' } },
                { id: 'price-low', label: { en: 'Price: Low to High', ar: 'السعر: من الأقل للأعلى' } },
                { id: 'price-high', label: { en: 'Price: High to Low', ar: 'السعر: من الأعلى للأقل' } },
              ].map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => setSortOption(opt.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${sortOption === opt.id ? 'border-black bg-black text-white' : 'border-gray-50 hover:border-gray-200'}`}
                >
                  <span className="font-bold text-sm tracking-tight">{t(opt.label)}</span>
                  {sortOption === opt.id && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                </button>
              ))}
            </div>
          )}
          {activeTab === 'categories' && (
            <div className="flex flex-wrap gap-1.5">
              <button 
                onClick={() => setSelectedCategoryId('')}
                className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase transition-all ${
                  selectedCategoryIds.length === 0 ? 'border-black bg-black text-white ring-2 ring-black ring-offset-1 shadow-md' : 'border-gray-50 text-gray-400 hover:border-gray-200'
                }`}
              >
                {t({ en: 'All', ar: 'الكل' })}
              </button>
              {categories.map(c => (
                <button 
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.slug || c.id)}
                  className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${
                    selectedCategoryIds.includes(c.id) ? 'border-black bg-black text-white ring-2 ring-black ring-offset-1 shadow-md' : 'border-gray-50 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  <span>{t(c.locals?.title || c.title)}</span>
                </button>
              ))}
            </div>
          )}
          {activeTab === 'brands' && (
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setSelectedBrand('')}
                className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase transition-all ${
                  selectedBrand === '' ? 'border-black bg-black text-white' : 'border-gray-50 text-gray-400 hover:border-gray-200'
                }`}
              >
                {t({ en: 'All Brands', ar: 'الكل' })}
              </button>
              {brands.map(b => (
                <button 
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
                    selectedBrand === b ? 'border-black bg-black text-white' : 'border-gray-50 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
          {activeTab === 'price' && (
            <div className="space-y-8 p-4">
              <div className="space-y-4">
                 <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                    <span>{priceRange[0]} {currency}</span>
                    <span>{priceRange[1]} {currency}</span>
                 </div>
                 <input 
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange(priceRange[0], parseInt(e.target.value))}
                    className="w-full accent-black"
                 />
                 <p className="text-[10px] text-gray-400 font-bold uppercase text-center">{t({ en: 'Drag to set maximum price', ar: 'اسحب لتحديد السعر الأقصى' })}</p>
              </div>
            </div>
          )}
          {activeTab === 'tags' && (
            <div className="flex flex-wrap gap-1.5">
              <button 
                onClick={() => setSelectedTagId('')}
                className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase transition-all ${
                  selectedTagId === '' ? 'border-black bg-black text-white' : 'border-gray-50 text-gray-400 hover:border-gray-200'
                }`}
              >
                {t({ en: 'All', ar: 'الكل' })}
              </button>
              {tags.map(tag => (
                <button 
                  key={tag.id}
                  onClick={() => setSelectedTagId(tag.id)}
                  className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase transition-all ${
                    selectedTagId === tag.id ? 'border-black bg-black text-white' : 'border-gray-50 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  <span>{t(tag.title)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0">
          <DrawerClose asChild>
            <button className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
              {t({ en: 'Apply Filters', ar: 'تطبيق' })}
            </button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// --- Main App ---

const PuckDynamicPage = ({ onNavigate }: { onNavigate: (p: string) => void }) => {
  const { pageId } = useParams();
  return (
    <div className="max-w-7xl mx-auto px-6">
      <PuckPage pageId={pageId || 'home'} onNavigate={onNavigate} />
    </div>
  );
};

const AdminNewPageRoute = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (handled) return;
    setHandled(true);

    const raw = prompt(t({ en: 'Enter page slug (e.g. about-us):', ar: 'أدخل معرف الصفحة (مثلاً about-us):' })) || '';
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, '-');

    if (normalized) {
      navigate(`/admin/pages/${encodeURIComponent(normalized)}`, { replace: true });
    } else {
      navigate('/admin', { replace: true });
    }
  }, [handled, navigate, t]);

  return null;
};

const AdminPageEditorRoute = ({ onClose }: { onClose: () => void }) => {
  const { pageSlug } = useParams();
  if (!pageSlug) return <Navigate to="/admin" replace />;
  const slug = decodeURIComponent(pageSlug);
  return <PageEditor pageId={slug} onClose={onClose} />;
};

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Use URL for state
  const currentPage = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/shop') return 'shop';
    if (path === '/cart') return 'cart';
    if (path === '/checkout') return 'checkout';
    if (path === '/orders') return 'orders';
    if (path === '/wishlist') return 'wishlist';
    if (path === '/profile') return 'profile';
    if (path === '/admin') return 'admin';
    if (path === '/admin/pages/new' || path.startsWith('/admin/pages/')) return 'admin-page-editor';
    if (path === '/contact') return 'contact';
    if (path === '/policy') return 'policy';
    if (path.startsWith('/p/')) return 'p/' + path.split('/')[2];
    return 'page';
  }, [location.pathname]);

  const { pageId: dynamicPageId } = useParams();
  const effectivePageId = dynamicPageId || (currentPage.startsWith('p/') ? currentPage.split('/')[1] : null);

  const setCurrentPage = (page: string) => {
    if (page === 'home') navigate('/');
    else if (page.startsWith('p/')) navigate('/p/' + (page.split('/')[1] || page.split('/')[2] || page.split('/')[0]));
    else navigate('/' + page);
  };
  const [viewingPageId, setViewingPageId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [allPages, setAllPages] = useState<any[]>([]);
  const [lang, setLangState] = useState<'en' | 'ar'>(() => {
    const saved = localStorage.getItem('kuzama_lang');
    return (saved === 'en' || saved === 'ar') ? saved : 'en';
  });
  const [tags, setTags] = useState<Tag[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ 
    paymentMethods: { online: true, cod: true }, 
    whatsappOrders: { enabled: false, phoneNumber: '' },
    features: { marketplace: false, drivers: false },
    restrictDeliveryToRegions: false,
    supportedAddressModes: ['normal', 'map'],
    appName: config.name,
    appDescription: config.description,
    currency: {
      code: 'AED',
      symbol: { en: 'AED', ar: 'د.إ' }
    }
  });

  useEffect(() => {
    const sans = getEnv('VITE_FONT_FAMILY_SANS');
    const display = getEnv('VITE_FONT_FAMILY_DISPLAY');

    if (sans) document.documentElement.style.setProperty('--font-sans', sans);
    if (display) document.documentElement.style.setProperty('--font-display', display);
  }, []);

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const setLang = async (l: 'en' | 'ar') => {
    setLangState(l);
    localStorage.setItem('kuzama_lang', l);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { language: l });
      } catch (error) {
        console.error('Failed to update language in profile', error);
      }
    }
  };
  const { 
    params: filterParams, 
    updateParams, 
    clearAllFilters,
    setSearchQuery,
    setCategorySlugs,
    setSelectedBrand,
    setPriceRange,
    setSortOption,
    setSelectedTagId
  } = useProductSearchParams();

  const searchQuery = filterParams.searchQuery;
  const selectedBrand = filterParams.selectedBrand;
  const minPrice = filterParams.minPrice;
  const maxPrice = filterParams.maxPrice;
  const priceRange: [number, number] = [minPrice, maxPrice];
  const sortOption = filterParams.sortOption;
  const selectedTagId = filterParams.selectedTagId;

  const selectedCategoryIds = useMemo(() => {
    return categories
      .filter(c => filterParams.categorySlugs.includes(c.slug) || filterParams.categorySlugs.includes(c.id))
      .map(c => c.id);
  }, [categories, filterParams.categorySlugs]);

  const selectedCategoryId = selectedCategoryIds[0] || '';

  const setSelectedCategoryId = (idOrSlug: string) => {
    if (!idOrSlug) {
      setCategorySlugs([]);
      return;
    }
    
    // Find category to get slug
    const category = categories.find(c => c.id === idOrSlug || c.slug === idOrSlug);
    if (category) {
      const slugToUse = category.slug || category.id;
      const slugs = [...filterParams.categorySlugs];
      if (slugs.includes(slugToUse)) {
        setCategorySlugs(slugs.filter(s => s !== slugToUse));
      } else {
        setCategorySlugs([...slugs, slugToUse]);
      }
    }
  };

  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const updateAppSettings = async (settings: Partial<AppSettings>) => {
    try {
      const newSettings = { ...appSettings, ...settings };
      await setDoc(doc(db, 'settings', 'app'), newSettings);
    } catch (error) {
      console.error('Error saving app settings:', error);
    }
  };

  const t = (ls: LocalizedString | string | any) => {
    if (typeof ls === 'string') return ls;
    if (!ls) return '';
    return ls[lang] || ls.en || '';
  };

  // Derived data
  const brands: string[] = Array.from(new Set(products.map(p => p.brand)));
  const featuredCategories = categories.filter(c => c.isFeatured);

  const filteredProducts = products
    .filter(p => {
      const name = t(p.locals.name);
      const brand = p.brand;
      const description = t(p.locals.description);
      
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryIds.length === 0 || selectedCategoryIds.some(id => p.categories.includes(id));
      const matchesBrand = selectedBrand === '' || p.brand === selectedBrand;
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      const matchesTag = selectedTagId === '' || (p.tags && p.tags.includes(selectedTagId));
      
      return matchesSearch && matchesCategory && matchesBrand && matchesPrice && matchesTag;
    })
    .sort((a, b) => {
      if (sortOption === 'price-low') return a.price - b.price;
      if (sortOption === 'price-high') return b.price - a.price;
      return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
    });

  // Auth Logic
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const p = docSnap.data() as UserProfile;
          // Ensure hardcoded admin has the role
          if (u.email === 'facegoogl@gmail.com' && !p.roles?.includes('admin')) {
            p.roles = Array.from(new Set([...(p.roles || []), 'admin']));
            p.role = 'admin';
            await updateDoc(docRef, { roles: p.roles, role: p.role });
          }
          // Migration: if roles doesn't exist, create it from role
          if (!p.roles) {
            p.roles = [p.role || 'customer'];
            await updateDoc(docRef, { roles: p.roles });
          }
          setProfile(p);
          if (p.language && p.language !== lang) {
            setLangState(p.language);
            localStorage.setItem('kuzama_lang', p.language);
          }
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || '',
            role: u.email === 'facegoogl@gmail.com' ? 'admin' : 'customer',
            roles: u.email === 'facegoogl@gmail.com' ? ['admin', 'customer'] : ['customer'],
            language: lang,
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

  // Fetch Products
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'products'), where('status', '==', 'published'), orderBy('createdAt', 'desc')), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
    return unsub;
  }, []);

  // Fetch Categories
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'categories'), orderBy('createdAt', 'desc')), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));
    return unsub;
  }, []);

  // Fetch Tags
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'tags'), orderBy('createdAt', 'desc')), (snap) => {
      setTags(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tags'));
    return unsub;
  }, []);

  // Fetch Stores
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'stores'), where('isVerified', '==', true), orderBy('createdAt', 'desc')), (snap) => {
      setStores(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stores'));
    return unsub;
  }, []);

  // Fetch all pages for admin
  useEffect(() => {
    if (profile?.roles?.includes('admin')) {
      const unsub = onSnapshot(collection(db, 'pages'), (snap) => {
        setAllPages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'pages'));
      return unsub;
    }
  }, [profile]);

  // Fetch App Settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'app'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppSettings;
        // Migration for old paymentMethods format
        const pm = data.paymentMethods as any;
        if (pm && (typeof pm.online === 'boolean' || typeof pm.cod === 'boolean')) {
          data.paymentMethods = {
            online: { enabled: !!pm.online, preTransaction: true },
            cod: { enabled: !!pm.cod, preTransaction: false }
          };
        }
        setAppSettings({
          ...data,
          supportedAddressModes: data.supportedAddressModes || ['normal', 'map'],
          appName: data.appName || config.name,
          appDescription: data.appDescription || config.description
        });
      }
      setSettingsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/app');
      setSettingsLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithPhone = async (phoneNumber: string, verifier?: RecaptchaVerifier) => {
    try {
      if (!verifier) {
        throw new Error('Recaptcha verifier not initialized');
      }
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
    } catch (error) {
      console.error('Phone sign in failed', error);
      throw error;
    }
  };

  const verifyCode = async (code: string) => {
    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result found. This usually happens if the page was refreshed or the initial phone sign-in attempt failed. Please try sending the code again.');
      }
      await confirmationResult.confirm(code);
      setConfirmationResult(null);
    } catch (error: any) {
      console.error('Code verification failed', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentPage('home');
  };

  const dataLoading = loading || !products.length || !categories.length; // Basic loading heuristic

  // Notification Logic
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      
      // Check for new notifications to trigger browser alert
      const prevIds = new Set(notifications.map(n => n.id));
      const newNotifs = fetched.filter(n => !prevIds.has(n.id) && !n.read);
      
      if (newNotifs.length > 0 && Notification.permission === 'granted') {
        newNotifs.forEach(n => {
          new Notification(t(n.title), { body: t(n.body) });
        });
      }

      setNotifications(fetched);
      setUnreadCount(fetched.filter(n => !n.read).length);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));

    return unsub;
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
      }
    }
  };

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Handle Payment Success Redirect
  useEffect(() => {
    const paymentId = searchParams.get('paymentId');
    const orderId = searchParams.get('orderId');
    
    if (paymentId && orderId && user) {
      // Verify payment on backend
      const verify = async () => {
        try {
          const res = await fetch(`/api/payment/verify?paymentId=${paymentId}&orderId=${orderId}`);
          const data = await res.json();
          if (data.IsSuccess && data.Data.InvoiceStatus === 'Paid') {
            clearCart();
            setCurrentPage('orders');
            // Clean up URL params
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('paymentId');
            newParams.delete('orderId');
            setSearchParams(newParams);
          }
        } catch (error) {
          console.error('Verification failed', error);
        }
      };
      verify();
    }
  }, [searchParams, user]);

  const langContextValue = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  const settingsContextValue = useMemo(() => ({ appSettings, updateAppSettings }), [appSettings]);
  const dataContextValue = useMemo(() => ({ 
    products, 
    categories, 
    stores, 
    tags, 
    brands, 
    loading: dataLoading,
    onSelectProduct: setSelectedProduct 
  }), [products, categories, stores, tags, brands, dataLoading, setSelectedProduct]);
  const authContextValue = useMemo(() => ({ 
    user, profile, loading, signIn, signInWithPhone, verifyCode, logout 
  }), [user, profile, loading]);

  if (loading || settingsLoading) {
    const splashAnim = getEnv('VITE_SPLASH_ANIMATION') || 'pulse';
    const splashBg = getEnv('VITE_SPLASH_BG_COLOR') || config.theme.background;
    const splashText = getEnv('VITE_SPLASH_TEXT_COLOR') || config.theme.primary;
    const splashTitle = {
      en: getEnv('VITE_SPLASH_TITLE_EN') || config.name.en,
      ar: getEnv('VITE_SPLASH_TITLE_AR') || config.name.ar
    };

    let animationProps: any = { animate: { opacity: [0.5, 1, 0.5] }, transition: { repeat: Infinity, duration: 2 } };
    
    if (splashAnim === 'scale') {
      animationProps = { animate: { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }, transition: { repeat: Infinity, duration: 2 } };
    } else if (splashAnim === 'bounce') {
      animationProps = { animate: { y: [0, -20, 0] }, transition: { repeat: Infinity, duration: 1, ease: 'easeInOut' } };
    } else if (splashAnim === 'slide-up') {
      animationProps = { animate: { y: [20, 0, 20], opacity: [0, 1, 0] }, transition: { repeat: Infinity, duration: 2 } };
    }

    return (
      <div className="h-screen flex items-center justify-center bg-white" style={{ backgroundColor: splashBg }}>
        <motion.div 
          {...animationProps}
          className="text-4xl font-black italic tracking-tighter"
          style={{ color: splashText }}
        >
          {t(splashTitle)}
        </motion.div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={langContextValue}>
      <SettingsContext.Provider value={settingsContextValue}>
        <DataContext.Provider value={dataContextValue}>
          <AuthContext.Provider value={authContextValue}>
          {profile?.isBanned ? (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
            <div className="max-w-md space-y-6">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldX className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-black">{t({ en: 'Account Banned', ar: 'الحساب محظور' })}</h1>
              <p className="text-gray-500 leading-relaxed">
                {t({ 
                  en: 'Your account has been suspended for violating our terms of service. If you believe this is a mistake, please contact support.', 
                  ar: 'تم تعليق حسابك لانتهاك شروط الخدمة الخاصة بنا. إذا كنت تعتقد أن هذا خطأ، يرجى الاتصال بالدعم.' 
                })}
              </p>
              <button 
                onClick={logout}
                className="px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all"
              >
                {t({ en: 'Sign Out', ar: 'تسجيل الخروج' })}
              </button>
            </div>
          </div>
        ) : (
          <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            markAsRead, 
            markAllAsRead, 
            requestPermission: requestNotificationPermission 
          }}>
          <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
            <LocationProvider>
              <RegionsProvider>
                <DeliveryMethodsProvider>
                  <WishlistProvider>
                    <div 
                      className="min-h-screen bg-white font-sans text-black selection:bg-black selection:text-white"
                      dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      style={{ backgroundColor: config.theme.background, color: config.theme.text }}
                    >
              {currentPage !== 'admin-page-editor' && (
                <Navbar 
                  currentPage={currentPage}
                  onNavigate={(page) => {
                    setCurrentPage(page);
                    setSelectedProduct(null);
                  }} 
                />
              )}
              
              <main className={`${!location.pathname.startsWith('/admin/pages/') ? 'pb-20' : ''}`}>
                <AnimatePresence mode="wait">
                  {selectedProduct && (
                    <Drawer open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                      <DrawerContent className="max-h-[90vh]">
                        <DrawerHeader className="sr-only">
                          <DrawerTitle>{selectedProduct ? t(selectedProduct.locals?.title || { en: selectedProduct.name, ar: selectedProduct.name }) : 'Product Details'}</DrawerTitle>
                        </DrawerHeader>
                        <div className="flex-1 overflow-y-auto pt-4 pb-20">
                          <ProductDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} />
                        </div>
                      </DrawerContent>
                    </Drawer>
                  )}
                </AnimatePresence>

                <Routes>
                  <Route path="/" element={
                      <div className="px-1 md:px-0">
                        <PuckPage pageId="home" onNavigate={setCurrentPage} />
                        <div className="max-w-7xl mx-auto px-6 py-20">
                           <div className="flex justify-between items-end mb-12">
                              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">{t({ en: 'Explore Shop', ar: 'استكشف المتجر' })}</h1>
                              <button onClick={() => navigate('/shop')} className="text-xs font-black text-gray-400 hover:text-black uppercase tracking-widest border-b-2 border-gray-100 pb-1">{t({ en: 'Visit Marketplace', ar: 'زيارة المتجر' })}</button>
                           </div>
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-12">
                              {products.slice(0, 4).map(product => (
                                <ProductCard key={product.id} product={product} onSelect={setSelectedProduct} />
                              ))}
                           </div>
                        </div>
                      </div>
                  } />

                  <Route path="/shop" element={
                      <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <PuckPage pageId="shop" onNavigate={setCurrentPage} />
                      </div>
                  } />

                  <Route path="/cart" element={<CartPage onCheckout={() => navigate('/checkout')} />} />
                  <Route path="/checkout" element={<CheckoutPage onComplete={() => navigate('/orders')} />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/wishlist" element={<WishlistPage onSelectProduct={setSelectedProduct} />} />
                  <Route path="/profile" element={<ProfilePage onNavigate={setCurrentPage} openPageEditor={(slug) => navigate(`/admin/pages/${encodeURIComponent(slug)}`)} openNewPageEditor={() => navigate('/admin/pages/new')} allPages={allPages} />} />
                  <Route path="/contact" element={<div className="max-w-4xl mx-auto px-6"><PuckPage pageId="contact" onNavigate={setCurrentPage} /></div>} />
                  <Route path="/policy" element={<div className="max-w-4xl mx-auto px-6"><PuckPage pageId="policy" onNavigate={setCurrentPage} /></div>} />
                  <Route path="/p/:pageId" element={<PuckDynamicPage onNavigate={setCurrentPage} />} />
                  <Route path="/admin" element={profile?.roles?.includes('admin') ? <AdminPanel setCurrentPage={setCurrentPage} openPageEditor={(slug) => navigate(`/admin/pages/${encodeURIComponent(slug)}`)} openNewPageEditor={() => navigate('/admin/pages/new')} allPages={allPages} /> : <Navigate to="/" />} />
                  <Route path="/features" element={<div className="max-w-7xl mx-auto px-4 md:px-6"><PuckPage pageId="features" onNavigate={setCurrentPage} /></div>} />
                  <Route path="/admin/pages/new" element={profile?.roles?.includes('admin') ? <AdminNewPageRoute /> : <Navigate to="/" />} />
                  <Route path="/admin/pages/:pageSlug" element={profile?.roles?.includes('admin') ? <AdminPageEditorRoute onClose={() => navigate('/admin')} /> : <Navigate to="/" />} />
                </Routes>

                {/* Simple Footer */}
                {!['admin', 'cart', 'checkout', 'admin-page-editor'].includes(currentPage) && (
                  <footer className="hidden md:block mt-20 border-t border-gray-100 py-12 px-6 bg-white overflow-hidden">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl italic"
                            style={{ backgroundColor: config.theme.primary }}
                          >
                            {t(appSettings.appName).charAt(0)}
                          </div>
                          <span className="text-xl font-bold tracking-tight">{t(appSettings.appName)}</span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs">{t(appSettings.appDescription)}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">{t({ en: 'Shop', ar: 'المتجر' })}</h4>
                        <ul className="space-y-4">
                          <li><button onClick={() => setCurrentPage('shop')} className="text-sm font-bold text-gray-600 hover:text-black">{t({ en: 'All Products', ar: 'جميع المنتجات' })}</button></li>
                          <li><button onClick={() => setCurrentPage('orders')} className="text-sm font-bold text-gray-600 hover:text-black">{t({ en: 'My Orders', ar: 'طلباتي' })}</button></li>
                          <li><button onClick={() => setCurrentPage('wishlist')} className="text-sm font-bold text-gray-600 hover:text-black">{t({ en: 'Wishlist', ar: 'الأمنيات' })}</button></li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">{t({ en: 'Support', ar: 'الدعم' })}</h4>
                        <ul className="space-y-4">
                          <li><button onClick={() => setCurrentPage('contact')} className="text-sm font-bold text-gray-600 hover:text-black">{t({ en: 'Contact Support', ar: 'اتصل بنا' })}</button></li>
                          <li><button onClick={() => setCurrentPage('policy')} className="text-sm font-bold text-gray-600 hover:text-black">{t({ en: 'Privacy Policy', ar: 'سياسة الخصوصية' })}</button></li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">{t({ en: 'Connect', ar: 'تواصل' })}</h4>
                        <div className="flex flex-wrap gap-4">
                          {appSettings.socialLinks?.instagram && (
                            <a href={appSettings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                              <LucideIcons.Instagram className="w-5 h-5" />
                            </a>
                          )}
                          {appSettings.socialLinks?.twitter && (
                            <a href={appSettings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                              <LucideIcons.Twitter className="w-5 h-5" />
                            </a>
                          )}
                          {appSettings.socialLinks?.facebook && (
                            <a href={appSettings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                              <LucideIcons.Facebook className="w-5 h-5" />
                            </a>
                          )}
                          {appSettings.socialLinks?.whatsapp && (
                            <a href={`https://wa.me/${appSettings.socialLinks.whatsapp}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                              <LucideIcons.MessageCircle className="w-5 h-5" />
                            </a>
                          )}
                          {appSettings.socialLinks?.tiktok && (
                            <a href={appSettings.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                              <LucideIcons.Video className="w-5 h-5" />
                            </a>
                          )}
                          {appSettings.socialLinks?.snapchat && (
                            <a href={appSettings.socialLinks.snapchat} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                              <LucideIcons.Ghost className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">© 2024 {t(appSettings.appName)}. ALL RIGHTS RESERVED.</p>
                      <div className="flex gap-6">
                        <button onClick={() => setCurrentPage('policy')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black">{t({ en: 'Terms', ar: 'الشروط' })}</button>
                        <button onClick={() => setCurrentPage('policy')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black">{t({ en: 'Privacy', ar: 'الخصوصية' })}</button>
                      </div>
                    </div>
                  </footer>
                )}
              </main>
              <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
              <AnimatePresence>
                {showFilterDrawer && (
                  <FilterDrawer 
                    onClose={() => setShowFilterDrawer(false)}
                    categories={categories}
                    selectedCategoryIds={selectedCategoryIds}
                    setSelectedCategoryId={setSelectedCategoryId}
                    brands={brands}
                    selectedBrand={selectedBrand}
                    setSelectedBrand={setSelectedBrand}
                    priceRange={priceRange}
                    setPriceRange={(min, max) => setPriceRange(min, max)}
                    currency={t(appSettings.currency?.symbol || config.currency.symbol)}
                    sortOption={sortOption}
                    setSortOption={setSortOption}
                    tags={tags}
                    selectedTagId={selectedTagId}
                    setSelectedTagId={setSelectedTagId}
                  />
                )}
              </AnimatePresence>
              {!localStorage.getItem('kuzama_welcome_seen') && (
                <WelcomeModal onClose={() => window.location.reload()} />
              )}
                    </div>
                  </WishlistProvider>
                </DeliveryMethodsProvider>
              </RegionsProvider>
            </LocationProvider>
          </CartContext.Provider>
        </NotificationContext.Provider>
        )}
      </AuthContext.Provider>
    </DataContext.Provider>
  </SettingsContext.Provider>
</LanguageContext.Provider>
  );
}

export default function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}
