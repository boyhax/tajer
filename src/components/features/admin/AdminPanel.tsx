import React, { useState, useEffect, useContext } from 'react';
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
  where,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { 
  Product, 
  Order, 
  UserProfile, 
  Category, 
  LocalizedString, 
  Store, 
  Driver, 
  AppNotification, 
  AppSettings, 
  ProductVariant, 
  Tag,
  Promotion
} from '../../../types';
import { useLanguage, useAuth } from '../../../contexts';
import { config } from '../../../lib/config';
import { OperationType, handleFirestoreError } from '../../../lib/error';
import { uploadImage, STORAGE_PATHS } from '../../../lib/storage';
import { 
  Plus, 
  Trash2, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Store as StoreIcon, 
  Truck, 
  ClipboardList, 
  Users, 
  Send, 
  Upload, 
  Tag as TagIcon, 
  Sparkles, 
  Settings,
  CreditCard,
  ShoppingBag,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminPanel = () => {
  const { t, lang } = useLanguage();
  const { user, profile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'categories' | 'tags' | 'stores' | 'drivers' | 'orders' | 'users' | 'notifications' | 'banners' | 'app-settings'>('products');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [banners, setBanners] = useState<Promotion[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    paymentMethods: { online: true, cod: true }
  });

  // UI State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Promotion | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Banner State
  const [bannerTitleEn, setBannerTitleEn] = useState('');
  const [bannerTitleAr, setBannerTitleAr] = useState('');
  const [bannerBodyEn, setBannerBodyEn] = useState('');
  const [bannerBodyAr, setBannerBodyAr] = useState('');
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  // Notification State
  const [promoTitleEn, setPromoTitleEn] = useState('');
  const [promoTitleAr, setPromoTitleAr] = useState('');
  const [promoBodyEn, setPromoBodyEn] = useState('');
  const [promoBodyAr, setPromoBodyAr] = useState('');

  // Product Form State
  const [prodNameEn, setProdNameEn] = useState('');
  const [prodNameAr, setProdNameAr] = useState('');
  const [prodDescEn, setProdDescEn] = useState('');
  const [prodDescAr, setProdDescAr] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodCats, setProdCats] = useState<string[]>([]);
  const [prodTags, setProdTags] = useState<string[]>([]);
  const [prodImage, setProdImage] = useState<File | null>(null);
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Category Form State
  const [catTitleEn, setCatTitleEn] = useState('');
  const [catTitleAr, setCatTitleAr] = useState('');
  const [catDescEn, setCatDescEn] = useState('');
  const [catDescAr, setCatDescAr] = useState('');
  const [catIcon, setCatIcon] = useState('ShoppingBag');
  const [catIsFeatured, setCatIsFeatured] = useState(false);
  const [catImage, setCatImage] = useState<File | null>(null);
  const [catImageUrl, setCatImageUrl] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Tag Form State
  const [tagTitleEn, setTagTitleEn] = useState('');
  const [tagTitleAr, setTagTitleAr] = useState('');
  const [tagIsPublic, setTagIsPublic] = useState(true);
  const [tagIsPromoted, setTagIsPromoted] = useState(false);
  const [tagDiscountType, setTagDiscountType] = useState<'product' | 'delivery' | 'none'>('none');
  const [tagDiscountValue, setTagDiscountValue] = useState('');
  const [isSavingTag, setIsSavingTag] = useState(false);

  // Fetch Data
  useEffect(() => {
    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubCategories = onSnapshot(query(collection(db, 'categories'), orderBy('createdAt', 'desc')), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));

    const unsubTags = onSnapshot(query(collection(db, 'tags'), orderBy('createdAt', 'desc')), (snap) => {
      setTags(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tags'));

    const unsubStores = onSnapshot(query(collection(db, 'stores'), orderBy('createdAt', 'desc')), (snap) => {
      setStores(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stores'));

    const unsubDrivers = onSnapshot(query(collection(db, 'drivers'), orderBy('createdAt', 'desc')), (snap) => {
      setDrivers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'drivers'));

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as UserProfile)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubBanners = onSnapshot(query(collection(db, 'promotions'), orderBy('createdAt', 'desc')), (snap) => {
      setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'promotions'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'app'), (snap) => {
      if (snap.exists()) setAppSettings(snap.data() as AppSettings);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/app'));

    return () => {
      unsubProducts(); unsubCategories(); unsubTags(); unsubStores();
      unsubDrivers(); unsubOrders(); unsubUsers(); unsubBanners(); unsubSettings();
    };
  }, []);

  // Actions
  const toggleProductStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    await updateDoc(doc(db, 'products', id), { status: newStatus });
  };

  const deleteProduct = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const verifyStore = async (id: string) => {
    await updateDoc(doc(db, 'stores', id), { isVerified: true });
  };

  const verifyDriver = async (id: string) => {
    await updateDoc(doc(db, 'drivers', id), { isVerified: true });
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    await updateDoc(doc(db, 'orders', orderId), { 
      driverId, 
      deliveryStatus: 'assigned',
      updatedAt: serverTimestamp()
    });
  };

  const toggleUserBan = async (uid: string, currentBan: boolean) => {
    await updateDoc(doc(db, 'users', uid), { isBanned: !currentBan });
  };

  const updateUserRoles = async (uid: string, roles: string[]) => {
    await updateDoc(doc(db, 'users', uid), { roles });
  };

  const sendAdminMessage = async () => {
    if (!selectedUser || !adminMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: selectedUser.uid,
        title: { en: 'Message from Admin', ar: 'رسالة من الإدارة' },
        body: { en: adminMessage, ar: adminMessage },
        type: 'admin_message',
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

  const sendPromotion = async (title: LocalizedString, body: LocalizedString) => {
    const confirm = window.confirm(`Send this promotion to ${users.length} users?`);
    if (!confirm) return;

    try {
      const batch = users.map(u => addDoc(collection(db, 'notifications'), {
        userId: u.uid,
        title,
        body,
        type: 'promotion',
        read: false,
        createdAt: serverTimestamp()
      }));
      await Promise.all(batch);
      alert('Promotion broadcasted successfully!');
    } catch (error) {
      console.error('Error broadcasting promotion:', error);
    }
  };

  const handleSaveAppSettings = async (settings: AppSettings) => {
    await setDoc(doc(db, 'settings', 'app'), settings);
  };

  const resetProductForm = () => {
    setProdNameEn(''); setProdNameAr('');
    setProdDescEn(''); setProdDescAr('');
    setProdPrice(''); setProdStock('');
    setProdBrand(''); setProdCats([]); setProdTags([]);
    setProdImage(null); setProdImageUrl('');
  };

  const handleSaveProduct = async () => {
    if (!prodNameEn || !prodNameAr || !prodPrice || !prodStock) {
      alert('Please fill required fields');
      return;
    }
    setIsSavingProduct(true);
    try {
      let imageUrl = prodImageUrl;
      if (prodImage) {
        imageUrl = await uploadImage(prodImage, `${STORAGE_PATHS.PRODUCTS}/${Date.now()}_${prodImage.name}`);
      }

      const productData = {
        locals: {
          name: { en: prodNameEn, ar: prodNameAr },
          description: { en: prodDescEn, ar: prodDescAr }
        },
        price: parseFloat(prodPrice),
        stock: parseInt(prodStock),
        brand: prodBrand,
        categories: prodCats,
        tags: prodTags,
        imageUrl,
        status: editingProduct?.status || 'published',
        storeId: editingProduct?.storeId || 'default-store',
        updatedAt: serverTimestamp()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp()
        });
      }
      setIsAddingProduct(false);
      setEditingProduct(null);
      resetProductForm();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const resetCategoryForm = () => {
    setCatTitleEn(''); setCatTitleAr('');
    setCatDescEn(''); setCatDescAr('');
    setCatIcon('ShoppingBag'); setCatIsFeatured(false);
    setCatImage(null); setCatImageUrl('');
  };

  const handleSaveCategory = async () => {
    if (!catTitleEn || !catTitleAr) {
      alert('Please fill required fields');
      return;
    }
    setIsSavingCategory(true);
    try {
      let imageUrl = catImageUrl;
      if (catImage) {
        imageUrl = await uploadImage(catImage, `${STORAGE_PATHS.CATEGORIES}/${Date.now()}_${catImage.name}`);
      }

      const categoryData = {
        locals: {
          title: { en: catTitleEn, ar: catTitleAr },
          description: { en: catDescEn, ar: catDescAr }
        },
        icon: catIcon,
        isFeatured: catIsFeatured,
        bannerImageUrl: imageUrl,
        updatedAt: serverTimestamp()
      };

      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), categoryData);
      } else {
        await addDoc(collection(db, 'categories'), {
          ...categoryData,
          createdAt: serverTimestamp()
        });
      }
      setIsAddingCategory(false);
      setEditingCategory(null);
      resetCategoryForm();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const resetTagForm = () => {
    setTagTitleEn(''); setTagTitleAr('');
    setTagIsPublic(true); setTagIsPromoted(false);
    setTagDiscountType('none'); setTagDiscountValue('');
  };

  const handleSaveTag = async () => {
    if (!tagTitleEn || !tagTitleAr) {
      alert('Please fill required fields');
      return;
    }
    setIsSavingTag(true);
    try {
      const tagData = {
        title: { en: tagTitleEn, ar: tagTitleAr },
        isPublic: tagIsPublic,
        isPromoted: tagIsPromoted,
        discountType: tagDiscountType,
        discountValue: parseFloat(tagDiscountValue) || 0,
        updatedAt: serverTimestamp()
      };

      if (editingTag) {
        await updateDoc(doc(db, 'tags', editingTag.id), tagData);
      } else {
        await addDoc(collection(db, 'tags'), {
          ...tagData,
          createdAt: serverTimestamp()
        });
      }
      setIsAddingTag(false);
      setEditingTag(null);
      resetTagForm();
    } catch (error) {
      console.error('Error saving tag:', error);
    } finally {
      setIsSavingTag(false);
    }
  };

  const handleSaveBanner = async () => {
    if (!bannerTitleEn || !bannerTitleAr || !bannerBodyEn || !bannerBodyAr) {
      alert('Please fill all required fields');
      return;
    }
    setIsSavingBanner(true);
    try {
      let imageUrl = bannerImageUrl;
      if (bannerImage) {
        imageUrl = await uploadImage(bannerImage, `${STORAGE_PATHS.BANNERS}/${Date.now()}_${bannerImage.name}`);
      }

      const bannerData = {
        title: { en: bannerTitleEn, ar: bannerTitleAr },
        body: { en: bannerBodyEn, ar: bannerBodyAr },
        image: imageUrl,
        updatedAt: serverTimestamp()
      };

      if (editingBanner) {
        await updateDoc(doc(db, 'promotions', editingBanner.id), bannerData);
      } else {
        await addDoc(collection(db, 'promotions'), {
          ...bannerData,
          createdAt: serverTimestamp()
        });
      }
      setIsAddingBanner(false);
      setEditingBanner(null);
      resetBannerForm();
    } catch (error) {
      console.error('Error saving banner:', error);
    } finally {
      setIsSavingBanner(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (window.confirm('Delete this banner?')) {
      await deleteDoc(doc(db, 'promotions', id));
    }
  };

  const resetBannerForm = () => {
    setBannerTitleEn(''); setBannerTitleAr('');
    setBannerBodyEn(''); setBannerBodyAr('');
    setBannerImage(null); setBannerImageUrl('');
  };

  const seedData = async () => {
    if (!window.confirm('This will populate the database with demo supermarket products, categories, and tags. Continue?')) return;

    try {
      // 1. Categories
      const categoriesData = [
        { id: 'cat-fruits', title: { en: 'Fruits & Vegetables', ar: 'الفواكه والخضروات' }, description: { en: 'Fresh from the farm', ar: 'طازجة من المزرعة' }, icon: 'Apple', isFeatured: true, bannerImageUrl: 'https://picsum.photos/seed/fruits/1200/400' },
        { id: 'cat-dairy', title: { en: 'Dairy & Eggs', ar: 'الألبان والبيض' }, description: { en: 'Milk, cheese, and more', ar: 'حليب، جبن، وأكثر' }, icon: 'Milk', isFeatured: true, bannerImageUrl: 'https://picsum.photos/seed/dairy/1200/400' },
        { id: 'cat-bakery', title: { en: 'Bakery', ar: 'المخبوزات' }, description: { en: 'Freshly baked bread and pastries', ar: 'خبز وحلويات طازجة' }, icon: 'Cookie', isFeatured: true, bannerImageUrl: 'https://picsum.photos/seed/bakery/1200/400' },
        { id: 'cat-meat', title: { en: 'Meat & Poultry', ar: 'اللحوم والدواجن' }, description: { en: 'High quality meats', ar: 'لحوم عالية الجودة' }, icon: 'Beef', isFeatured: true, bannerImageUrl: 'https://picsum.photos/seed/meat/1200/400' },
        { id: 'cat-beverages', title: { en: 'Beverages', ar: 'المشروبات' }, description: { en: 'Juices, sodas, and water', ar: 'عصائر، مياه غازية، ومياه' }, icon: 'Coffee', isFeatured: false, bannerImageUrl: 'https://picsum.photos/seed/beverages/1200/400' },
        { id: 'cat-snacks', title: { en: 'Snacks & Sweets', ar: 'الوجبات الخفيفة والحلويات' }, description: { en: 'Chips, chocolate, and more', ar: 'شيبس، شوكولاتة، وأكثر' }, icon: 'Candy', isFeatured: false, bannerImageUrl: 'https://picsum.photos/seed/snacks/1200/400' }
      ];

      for (const cat of categoriesData) {
        await setDoc(doc(db, 'categories', cat.id), {
          locals: { title: cat.title, description: cat.description },
          icon: cat.icon,
          isFeatured: cat.isFeatured,
          bannerImageUrl: cat.bannerImageUrl,
          createdAt: serverTimestamp()
        });
      }

      // 2. Tags
      const tagsData = [
        { id: 'tag-fresh', title: { en: 'Fresh', ar: 'طازج' }, isPublic: true, isPromoted: false },
        { id: 'tag-organic', title: { en: 'Organic', ar: 'عضوي' }, isPublic: true, isPromoted: false },
        { id: 'tag-discount', title: { en: 'Big Sale', ar: 'تخفيضات كبرى' }, isPublic: true, isPromoted: true, bannerImage: 'https://picsum.photos/seed/sale/1200/600', discountType: 'percentage', discountValue: 20 },
        { id: 'tag-new', title: { en: 'New Arrival', ar: 'وصل حديثاً' }, isPublic: true, isPromoted: true, bannerImage: 'https://picsum.photos/seed/new/1200/600', discountType: 'none', discountValue: 0 }
      ];

      for (const tag of tagsData) {
        await setDoc(doc(db, 'tags', tag.id), {
          ...tag,
          createdAt: serverTimestamp()
        });
      }

      // 3. Products
      const productsData = [
        { name: { en: 'Red Apples', ar: 'تفاح أحمر' }, desc: { en: 'Sweet and crunchy red apples', ar: 'تفاح أحمر حلو ومقرمش' }, price: 2.5, cat: ['cat-fruits'], tags: ['tag-fresh'], img: 'https://picsum.photos/seed/apple/400/400', brand: 'Farm Fresh' },
        { name: { en: 'Fresh Milk 1L', ar: 'حليب طازج 1 لتر' }, desc: { en: 'Full cream fresh milk', ar: 'حليب طازج كامل الدسم' }, price: 1.2, cat: ['cat-dairy'], tags: ['tag-fresh'], img: 'https://picsum.photos/seed/milk/400/400', brand: 'Almarai' },
        { name: { en: 'Whole Wheat Bread', ar: 'خبز القمح الكامل' }, desc: { en: 'Healthy whole wheat sliced bread', ar: 'خبز توست القمح الكامل الصحي' }, price: 0.8, cat: ['cat-bakery'], tags: ['tag-fresh'], img: 'https://picsum.photos/seed/bread/400/400', brand: 'Sunbulah' },
        { name: { en: 'Chicken Breast 500g', ar: 'صدور دجاج 500 جرام' }, desc: { en: 'Fresh boneless chicken breast', ar: 'صدور دجاج طازجة بدون عظم' }, price: 5.5, cat: ['cat-meat'], tags: ['tag-fresh'], img: 'https://picsum.photos/seed/chicken/400/400', brand: 'Tanmiah' },
        { name: { en: 'Orange Juice 1.5L', ar: 'عصير برتقال 1.5 لتر' }, desc: { en: '100% pure orange juice', ar: 'عصير برتقال طبيعي 100٪' }, price: 3.0, cat: ['cat-beverages'], tags: ['tag-discount'], img: 'https://picsum.photos/seed/orangejuice/400/400', brand: 'Nadec' },
        { name: { en: 'Potato Chips', ar: 'رقائق البطاطس' }, desc: { en: 'Classic salted potato chips', ar: 'رقائق بطاطس مملحة كلاسيكية' }, price: 1.5, cat: ['cat-snacks'], tags: ['tag-new'], img: 'https://picsum.photos/seed/chips/400/400', brand: 'Lays' },
        { name: { en: 'Organic Bananas', ar: 'موز عضوي' }, desc: { en: 'Certified organic bananas', ar: 'موز عضوي معتمد' }, price: 3.2, cat: ['cat-fruits'], tags: ['tag-organic', 'tag-fresh'], img: 'https://picsum.photos/seed/banana/400/400', brand: 'Organic Co' },
        { name: { en: 'Greek Yogurt', ar: 'زبادي يوناني' }, desc: { en: 'Creamy high-protein Greek yogurt', ar: 'زبادي يوناني كريمي عالي البروتين' }, price: 2.0, cat: ['cat-dairy'], tags: ['tag-new'], img: 'https://picsum.photos/seed/yogurt/400/400', brand: 'Nada' }
      ];

      for (const p of productsData) {
        await addDoc(collection(db, 'products'), {
          locals: { name: p.name, description: p.desc },
          price: p.price,
          categories: p.cat,
          tags: p.tags,
          imageUrl: p.img,
          brand: p.brand,
          stock: 100,
          status: 'published',
          storeId: 'default-store',
          createdAt: serverTimestamp()
        });
      }

      // 4. Create a default store if not exists
      const storeRef = doc(db, 'stores', 'default-store');
      const storeSnap = await getDoc(storeRef);
      if (!storeSnap.exists()) {
        await setDoc(storeRef, {
          name: 'Kuzama Supermarket',
          ownerId: user?.uid || 'admin',
          isVerified: true,
          isDefault: true,
          address: 'Main Street, City Center',
          location: { lat: 24.7136, lng: 46.6753 },
          createdAt: serverTimestamp()
        });
      }

      // 5. Create sample orders if user is logged in
      if (user) {
        const sampleOrders = [
          { items: [{ id: 'sample-1', name: 'Red Apples', price: 2.5, quantity: 2 }], total: 5.0, status: 'paid', delivery: 'delivered' },
          { items: [{ id: 'sample-2', name: 'Fresh Milk', price: 1.2, quantity: 3 }], total: 3.6, status: 'paid', delivery: 'picked_up' }
        ];

        for (const o of sampleOrders) {
          await addDoc(collection(db, 'orders'), {
            userId: user.uid,
            items: o.items,
            totalAmount: o.total,
            status: o.status,
            deliveryStatus: o.delivery,
            createdAt: serverTimestamp(),
            customerInfo: {
              name: profile?.displayName || 'Demo User',
              phone: '123456789',
              address: '123 Demo St',
              destinationCoords: { lat: 24.7136, lng: 46.6753 }
            }
          });
        }
      }

      alert('Data seeded successfully!');
    } catch (error) {
      console.error('Seeding failed:', error);
      alert('Seeding failed. Check console.');
    }
  };

  const filteredAdminProducts = products.filter(p => 
    t(p.locals.name).toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">{t({ en: 'Admin Panel', ar: 'لوحة الإدارة' })}</h1>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-1">{t({ en: 'System Management & Control', ar: 'إدارة وتحكم النظام' })}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={seedData}
            className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {t({ en: 'Seed Demo Data', ar: 'توليد بيانات تجريبية' })}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-12 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'products', icon: ShoppingBag, label: { en: 'Products', ar: 'المنتجات' } },
          { id: 'categories', icon: ClipboardList, label: { en: 'Categories', ar: 'الفئات' } },
          { id: 'tags', icon: TagIcon, label: { en: 'Tags', ar: 'الوسوم' } },
          { id: 'stores', icon: StoreIcon, label: { en: 'Stores', ar: 'المتاجر' } },
          { id: 'drivers', icon: Truck, label: { en: 'Drivers', ar: 'السائقين' } },
          { id: 'orders', icon: ClipboardList, label: { en: 'Orders', ar: 'الطلبات' } },
          { id: 'users', icon: Users, label: { en: 'Users', ar: 'المستخدمين' } },
          { id: 'banners', icon: Sparkles, label: { en: 'Banners', ar: 'البانرات' } },
          { id: 'notifications', icon: Send, label: { en: 'Notifications', ar: 'الإشعارات' } },
          { id: 'app-settings', icon: Settings, label: { en: 'Settings', ar: 'الإعدادات' } },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
              activeSubTab === tab.id ? 'bg-black text-white shadow-xl scale-105' : 'bg-white text-gray-400 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {t(tab.label)}
          </button>
        ))}
      </div>

      {activeSubTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold">{t({ en: 'Product Management', ar: 'إدارة المنتجات' })}</h2>
            <button 
              onClick={() => setIsAddingProduct(true)}
              className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> {t({ en: 'Add Product', ar: 'إضافة منتج' })}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" placeholder={t({ en: 'Search products...', ar: 'البحث عن المنتجات...' })}
              value={productSearchQuery} onChange={(e) => setProductSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAdminProducts.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group hover:shadow-md transition-all">
                <div className="flex gap-4 mb-4">
                  <img src={p.imageUrl} className="w-20 h-20 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <h3 className="font-bold">{t(p.locals.name)}</h3>
                    <p className="text-xs text-gray-400">{p.brand}</p>
                    <p className="text-emerald-500 font-bold mt-1">{p.price} {t(config.currency.symbol)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleProductStatus(p.id, p.status)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      p.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {p.status === 'published' ? t({ en: 'Published', ar: 'منشور' }) : t({ en: 'Draft', ar: 'مسودة' })}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingProduct(p);
                      setProdNameEn(p.locals.name.en);
                      setProdNameAr(p.locals.name.ar);
                      setProdDescEn(p.locals.description.en);
                      setProdDescAr(p.locals.description.ar);
                      setProdPrice(p.price.toString());
                      setProdStock(p.stock.toString());
                      setProdBrand(p.brand);
                      setProdCats(p.categories);
                      setProdTags(p.tags);
                      setProdImageUrl(p.imageUrl);
                      setIsAddingProduct(true);
                    }}
                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
                  >
                    {t({ en: 'Edit', ar: 'تعديل' })}
                  </button>
                  <button 
                    onClick={() => deleteProduct(p.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{t({ en: 'Categories', ar: 'الفئات' })}</h2>
            <button 
              onClick={() => {
                resetCategoryForm();
                setIsAddingCategory(true);
              }}
              className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> {t({ en: 'Add Category', ar: 'إضافة فئة' })}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(c => (
              <div key={c.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">{t(c.locals.title)}</h3>
                    <p className="text-xs text-gray-400">{c.isFeatured ? t({ en: 'Featured', ar: 'مميزة' }) : ''}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingCategory(c);
                      setIsAddingCategory(true);
                    }}
                    className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                  </button>
                  <button 
                    onClick={async () => {
                      if (window.confirm('Delete category?')) {
                        await deleteDoc(doc(db, 'categories', c.id));
                      }
                    }}
                    className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'tags' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{t({ en: 'Tags & Promotions', ar: 'الوسوم والعروض' })}</h2>
            <button 
              onClick={() => {
                resetTagForm();
                setIsAddingTag(true);
              }}
              className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> {t({ en: 'Add Tag', ar: 'إضافة وسم' })}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tags.map(tag => (
              <div key={tag.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-50 rounded-2xl">
                      <TagIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">{t(tag.title)}</h3>
                      <div className="flex gap-1 mt-1">
                        {tag.isPublic && <span className="text-[8px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">Public</span>}
                        {tag.isPromoted && <span className="text-[8px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase">Promoted</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingTag(tag);
                        setTagTitleEn(tag.title.en);
                        setTagTitleAr(tag.title.ar);
                        setTagIsPublic(tag.isPublic);
                        setTagIsPromoted(tag.isPromoted);
                        setTagDiscountType(tag.discountType);
                        setTagDiscountValue(tag.discountValue.toString());
                        setIsAddingTag(true);
                      }}
                      className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                    </button>
                    <button 
                      onClick={async () => {
                        if (window.confirm('Delete tag?')) {
                          await deleteDoc(doc(db, 'tags', tag.id));
                        }
                      }}
                      className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                {tag.isPromoted && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Discount Config</p>
                    <p className="text-xs font-bold">{tag.discountType === 'percentage' ? `${tag.discountValue}% OFF` : `${tag.discountValue} OFF`}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'stores' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{t({ en: 'Store Verification', ar: 'توثيق المتاجر' })}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stores.map(store => (
              <div key={store.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center">
                      <StoreIcon className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">{store.name}</h3>
                      <p className="text-sm text-gray-400">{store.address}</p>
                    </div>
                  </div>
                  {store.isVerified ? (
                    <span className="px-4 py-1.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full uppercase flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {t({ en: 'Verified', ar: 'موثق' })}
                    </span>
                  ) : (
                    <span className="px-4 py-1.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full uppercase">
                      {t({ en: 'Pending', ar: 'قيد الانتظار' })}
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  {!store.isVerified && (
                    <button 
                      onClick={() => verifyStore(store.id)}
                      className="flex-1 bg-black text-white py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all"
                    >
                      {t({ en: 'Verify Store', ar: 'توثيق المتجر' })}
                    </button>
                  )}
                  <button 
                    onClick={async () => {
                      if (store.isDefault) return;
                      // Unset others
                      const others = stores.filter(s => s.isDefault && s.id !== store.id);
                      for (const s of others) {
                        await updateDoc(doc(db, 'stores', s.id), { isDefault: false });
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
            <div className="space-y-4">
              <h3 className="text-lg font-bold">{t({ en: 'Payment Methods', ar: 'طرق الدفع' })}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5" />
                    <span className="font-bold">{t({ en: 'Online Payment', ar: 'الدفع الإلكتروني' })}</span>
                  </div>
                  <button 
                    onClick={() => handleSaveAppSettings({
                      ...appSettings,
                      paymentMethods: { ...appSettings.paymentMethods, online: !appSettings.paymentMethods.online }
                    })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${appSettings.paymentMethods.online ? 'bg-black' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appSettings.paymentMethods.online ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5" />
                    <span className="font-bold">{t({ en: 'Cash on Delivery', ar: 'الدفع عند الاستلام' })}</span>
                  </div>
                  <button 
                    onClick={() => handleSaveAppSettings({
                      ...appSettings,
                      paymentMethods: { ...appSettings.paymentMethods, cod: !appSettings.paymentMethods.cod }
                    })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${appSettings.paymentMethods.cod ? 'bg-black' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${appSettings.paymentMethods.cod ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <h2 className="text-2xl font-bold">{t({ en: 'Order Assignments', ar: 'إسناد الطلبات' })}</h2>
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">{t({ en: 'Order', ar: 'الطلب' })} #{order.id.slice(-6)}</p>
                    <p className="font-bold text-lg">{order.totalAmount} {t(config.currency.symbol)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase">{t({ en: 'Status', ar: 'الحالة' })}</p>
                    <p className="text-sm font-bold">{order.deliveryStatus || t({ en: 'Pending Assignment', ar: 'قيد الإسناد' })}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center pt-4 border-t border-gray-50">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
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

      {activeSubTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{t({ en: 'Banner Management', ar: 'إدارة البانرات' })}</h2>
            <button 
              onClick={() => {
                resetBannerForm();
                setIsAddingBanner(true);
              }}
              className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> {t({ en: 'Add Banner', ar: 'إضافة بانر' })}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map(banner => (
              <div key={banner.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden group">
                <div className="aspect-video rounded-2xl overflow-hidden mb-4 relative">
                  <img src={banner.image} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => {
                        setEditingBanner(banner);
                        setBannerTitleEn(banner.title.en);
                        setBannerTitleAr(banner.title.ar);
                        setBannerBodyEn(banner.body.en);
                        setBannerBodyAr(banner.body.ar);
                        setBannerImageUrl(banner.image);
                        setIsAddingBanner(true);
                      }}
                      className="p-3 bg-white text-black rounded-xl hover:scale-110 transition-transform"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => deleteBanner(banner.id)}
                      className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 transition-transform"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-lg">{t(banner.title)}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">{t(banner.body)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'notifications' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{t({ en: 'Global Notifications', ar: 'الإشعارات العامة' })}</h2>
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
      {isAddingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-4xl rounded-[40px] p-8 shadow-2xl my-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                {editingProduct ? t({ en: 'Edit Product', ar: 'تعديل المنتج' }) : t({ en: 'Add New Product', ar: 'إضافة منتج جديد' })}
              </h2>
              <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); resetProductForm(); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Name (English)', ar: 'الاسم (إنجليزي)' })}</label>
                    <input 
                      type="text" value={prodNameEn} onChange={(e) => setProdNameEn(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Name (Arabic)', ar: 'الاسم (عربي)' })}</label>
                    <input 
                      type="text" value={prodNameAr} onChange={(e) => setProdNameAr(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Description (English)', ar: 'الوصف (إنجليزي)' })}</label>
                    <textarea 
                      value={prodDescEn} onChange={(e) => setProdDescEn(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Description (Arabic)', ar: 'الوصف (عربي)' })}</label>
                    <textarea 
                      value={prodDescAr} onChange={(e) => setProdDescAr(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium min-h-[100px] text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Price', ar: 'السعر' })}</label>
                    <input 
                      type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Stock', ar: 'المخزون' })}</label>
                    <input 
                      type="number" value={prodStock} onChange={(e) => setProdStock(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Brand', ar: 'العلامة التجارية' })}</label>
                    <input 
                      type="text" value={prodBrand} onChange={(e) => setProdBrand(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Product Image', ar: 'صورة المنتج' })}</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-48 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
                      {prodImageUrl ? (
                        <img src={prodImageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-300 mb-2" />
                          <p className="text-xs font-bold text-gray-400">{t({ en: 'Click or drag to upload', ar: 'انقر أو اسحب للتحميل' })}</p>
                        </>
                      )}
                      <input 
                        type="file" accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProdImage(file);
                            setProdImageUrl(URL.createObjectURL(file));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Categories', ar: 'الفئات' })}</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setProdCats(prev => prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          prodCats.includes(cat.id) ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {t(cat.locals.title)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Tags', ar: 'الوسوم' })}</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          setProdTags(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id]);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          prodTags.includes(tag.id) ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {t(tag.title)}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleSaveProduct}
                  disabled={isSavingProduct}
                  className="w-full py-5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSavingProduct ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {editingProduct ? t({ en: 'Update Product', ar: 'تحديث المنتج' }) : t({ en: 'Save Product', ar: 'حفظ المنتج' })}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {isAddingCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-[40px] p-8 shadow-2xl my-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                {editingCategory ? t({ en: 'Edit Category', ar: 'تعديل الفئة' }) : t({ en: 'Add New Category', ar: 'إضافة فئة جديدة' })}
              </h2>
              <button onClick={() => { setIsAddingCategory(false); setEditingCategory(null); resetCategoryForm(); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Title (English)', ar: 'العنوان (إنجليزي)' })}</label>
                  <input 
                    type="text" value={catTitleEn} onChange={(e) => setCatTitleEn(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Title (Arabic)', ar: 'العنوان (عربي)' })}</label>
                  <input 
                    type="text" value={catTitleAr} onChange={(e) => setCatTitleAr(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Description (English)', ar: 'الوصف (إنجليزي)' })}</label>
                  <textarea 
                    value={catDescEn} onChange={(e) => setCatDescEn(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Description (Arabic)', ar: 'الوصف (عربي)' })}</label>
                  <textarea 
                    value={catDescAr} onChange={(e) => setCatDescAr(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium min-h-[100px] text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Icon Name', ar: 'اسم الأيقونة' })}</label>
                  <input 
                    type="text" value={catIcon} onChange={(e) => setCatIcon(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                  />
                </div>
                <div className="flex items-center gap-4 pt-8">
                  <button 
                    onClick={() => setCatIsFeatured(!catIsFeatured)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${catIsFeatured ? 'bg-black' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${catIsFeatured ? 'right-1' : 'left-1'}`} />
                  </button>
                  <span className="text-sm font-bold">{t({ en: 'Featured Category', ar: 'فئة مميزة' })}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Banner Image', ar: 'صورة البانر' })}</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-40 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
                    {catImageUrl ? (
                      <img src={catImageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-xs font-bold text-gray-400">{t({ en: 'Click or drag to upload', ar: 'انقر أو اسحب للتحميل' })}</p>
                      </>
                    )}
                    <input 
                      type="file" accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCatImage(file);
                          setCatImageUrl(URL.createObjectURL(file));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveCategory}
                disabled={isSavingCategory}
                className="w-full py-5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSavingCategory ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {editingCategory ? t({ en: 'Update Category', ar: 'تحديث الفئة' }) : t({ en: 'Save Category', ar: 'حفظ الفئة' })}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isAddingTag && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-[40px] p-8 shadow-2xl my-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                {editingTag ? t({ en: 'Edit Tag', ar: 'تعديل الوسم' }) : t({ en: 'Add New Tag', ar: 'إضافة وسم جديد' })}
              </h2>
              <button onClick={() => { setIsAddingTag(false); setEditingTag(null); resetTagForm(); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Title (English)', ar: 'العنوان (إنجليزي)' })}</label>
                  <input 
                    type="text" value={tagTitleEn} onChange={(e) => setTagTitleEn(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Title (Arabic)', ar: 'العنوان (عربي)' })}</label>
                  <input 
                    type="text" value={tagTitleAr} onChange={(e) => setTagTitleAr(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setTagIsPublic(!tagIsPublic)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${tagIsPublic ? 'bg-black' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tagIsPublic ? 'right-1' : 'left-1'}`} />
                  </button>
                  <span className="text-sm font-bold">{t({ en: 'Public Tag', ar: 'وسم عام' })}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setTagIsPromoted(!tagIsPromoted)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${tagIsPromoted ? 'bg-black' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tagIsPromoted ? 'right-1' : 'left-1'}`} />
                  </button>
                  <span className="text-sm font-bold">{t({ en: 'Promoted (Discount)', ar: 'ترويجي (خصم)' })}</span>
                </div>
              </div>

              {tagIsPromoted && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Discount Type', ar: 'نوع الخصم' })}</label>
                    <select 
                      value={tagDiscountType} onChange={(e) => setTagDiscountType(e.target.value as any)}
                      className="w-full px-6 py-4 bg-white rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                    >
                      <option value="none">None</option>
                      <option value="product">Product Discount</option>
                      <option value="delivery">Free Delivery</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Discount Value (%)', ar: 'قيمة الخصم (%)' })}</label>
                    <input 
                      type="number" value={tagDiscountValue} onChange={(e) => setTagDiscountValue(e.target.value)}
                      className="w-full px-6 py-4 bg-white rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                    />
                  </div>
                </div>
              )}

              <button 
                onClick={handleSaveTag}
                disabled={isSavingTag}
                className="w-full py-5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSavingTag ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {editingTag ? t({ en: 'Update Tag', ar: 'تحديث الوسم' }) : t({ en: 'Save Tag', ar: 'حفظ الوسم' })}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isAddingBanner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-[40px] p-8 shadow-2xl my-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                {editingBanner ? t({ en: 'Edit Banner', ar: 'تعديل البانر' }) : t({ en: 'Add New Banner', ar: 'إضافة بانر جديد' })}
              </h2>
              <button onClick={() => { setIsAddingBanner(false); setEditingBanner(null); resetBannerForm(); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Title (English)', ar: 'العنوان (إنجليزي)' })}</label>
                  <input 
                    type="text" value={bannerTitleEn} onChange={(e) => setBannerTitleEn(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Title (Arabic)', ar: 'العنوان (عربي)' })}</label>
                  <input 
                    type="text" value={bannerTitleAr} onChange={(e) => setBannerTitleAr(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Body (English)', ar: 'المحتوى (إنجليزي)' })}</label>
                  <textarea 
                    value={bannerBodyEn} onChange={(e) => setBannerBodyEn(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Body (Arabic)', ar: 'المحتوى (عربي)' })}</label>
                  <textarea 
                    value={bannerBodyAr} onChange={(e) => setBannerBodyAr(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black font-medium min-h-[100px] text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-2">{t({ en: 'Banner Image', ar: 'صورة البانر' })}</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-40 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
                    {bannerImageUrl ? (
                      <img src={bannerImageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-xs font-bold text-gray-400">{t({ en: 'Click or drag to upload', ar: 'انقر أو اسحب للتحميل' })}</p>
                      </>
                    )}
                    <input 
                      type="file" accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBannerImage(file);
                          setBannerImageUrl(URL.createObjectURL(file));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveBanner}
                disabled={isSavingBanner}
                className="w-full py-5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSavingBanner ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {editingBanner ? t({ en: 'Update Banner', ar: 'تحديث البانر' }) : t({ en: 'Save Banner', ar: 'حفظ البانر' })}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
