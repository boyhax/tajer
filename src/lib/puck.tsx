import React, { useContext, useState, useMemo, useEffect } from "react";
import { Config } from "@measured/puck";
import { 
  Type, 
  Image as ImageIcon, 
  Star,
  Mail, 
  ShieldCheck, 
  Layout, 
  Text as TextIcon,
  Columns as ColumnsIcon,
  ArrowRight,
  TrendingUp,
  Store as StoreIcon,
  Tag as TagIcon,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { DataContext, LanguageContext, SettingsContext } from "../App";
import { Product, Store, Category } from "../types";
import { config as appConfig } from "./config";
import { cn } from "./utils";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "../components/ui/Carousel";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger,
  DrawerClose
} from "../components/ui/Drawer";

export type PuckConfig = {
  Hero: {
    title: string;
    description: string;
    buttonText: string;
    imageUrl: string;
    variant: "centered" | "split";
  };
  SearchSection: {
    showSearchBar: boolean;
    showFilterTrigger: boolean;
    showSortTrigger: boolean;
    placeholder: string;
  };
  Text: {
    content: string;
    align: "left" | "center" | "right";
    variant: "body" | "highlight" | "minimal";
  };
  SectionTitle: {
    title: string;
    subtitle?: string;
    alignment: "left" | "center";
  };
  FeatureGrid: {
    items: {
      title: string;
      description: string;
      icon: "truck" | "shield" | "credit-card" | "star";
    }[];
  };
  Banner: {
    title: string;
    imageUrl: string;
    linkUrl: string;
  };
  ContactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  StoresExplore: {
    layout: "grid" | "carousel";
    limit: number;
  };
  ProductsExplore: {
    layout: "grid" | "carousel";
    categoryIds: { id: string }[];
    limit: number;
    showFilters: boolean;
    enableSearch?: boolean;
    enableSort?: boolean;
  };
  CategoriesExplore: {
    layout: "grid" | "carousel";
    limit: number;
  };
  Space: {
    height: number;
  };
};

export const config: Config<PuckConfig> = {
  components: {
    Hero: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        buttonText: { type: "text" },
        imageUrl: { type: "text" },
        variant: {
          type: "select",
          options: [
            { label: "Centered", value: "centered" },
            { label: "Split", value: "split" },
          ],
        },
      },
      render: ({ title, description, buttonText, imageUrl, variant }) => {
        if (variant === "split") {
          return (
            <section className="flex flex-col md:flex-row items-center gap-8 md:gap-16 py-12 md:py-20">
              <div className="flex-1 space-y-6">
                <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter leading-none italic uppercase">{title}</h1>
                <p className="text-xl text-gray-500 font-medium">{description}</p>
                <button className="px-10 py-5 bg-black text-white rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">
                  {buttonText}
                </button>
              </div>
              <div className="flex-1 w-full h-[400px] md:h-[600px] rounded-[48px] overflow-hidden shadow-2xl">
                <img 
                   src={imageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2070"} 
                  className="w-full h-full object-cover"
                  alt="Hero"
                  referrerPolicy="no-referrer"
                />
              </div>
            </section>
          );
        }
        return (
          <section className="relative h-[500px] md:h-[700px] flex items-center justify-center text-white overflow-hidden rounded-[64px] my-4 shadow-2xl shadow-black/20">
            <img 
              src={imageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2070"} 
              className="absolute inset-0 w-full h-full object-cover"
              alt="Hero"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative z-10 text-center px-6 max-w-4xl">
              <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-none italic uppercase">{title}</h1>
              <p className="text-xl md:text-2xl text-white/90 mb-12 font-medium max-w-2xl mx-auto">{description}</p>
              <button className="px-12 py-6 bg-white text-black rounded-full font-black text-sm uppercase tracking-widest hover:scale-110 transition-all shadow-xl">
                {buttonText}
              </button>
            </div>
          </section>
        );
      },
    },
    SearchSection: {
      fields: {
        showSearchBar: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        showFilterTrigger: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        showSortTrigger: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        placeholder: { type: "text" }
      },
      render: ({ showSearchBar = true, showFilterTrigger = true, showSortTrigger = true, placeholder = "Search..." }) => {
        const { t, lang } = useContext(LanguageContext);
        const { categories, brands } = useContext(DataContext);
        
        return (
          <div className="py-4 space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-2">
              {showSearchBar && (
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                  <input 
                    type="text"
                    placeholder={t(placeholder)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-full focus:bg-white focus:border-gray-100 focus:ring-4 focus:ring-black/5 transition-all outline-none text-[10px] uppercase font-black tracking-widest placeholder:text-gray-400"
                  />
                </div>
              )}
              <div className="flex gap-2">
                {showFilterTrigger && (
                  <Drawer>
                    <DrawerTrigger asChild>
                      <button 
                        onPointerDown={(e) => e.stopPropagation()}
                        className="flex items-center justify-center w-10 h-10 bg-black text-white rounded-full shadow-lg hover:scale-110 transition-all shrink-0"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                    </DrawerTrigger>
                    <DrawerContent className="max-w-md w-full">
                      <DrawerHeader>
                        <DrawerTitle>{t({ en: 'Filters', ar: 'الفلاتر' })}</DrawerTitle>
                      </DrawerHeader>
                      <div className="p-6 space-y-8">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">{t({ en: 'Categories', ar: 'الفئات' })}</h4>
                          <div className="flex flex-wrap gap-2">
                             {categories.map(cat => (
                               <button key={cat.id} className="px-4 py-2 rounded-full border border-gray-100 text-[10px] font-bold uppercase transition-all hover:bg-gray-50">
                                 {t(cat.locals.title)}
                               </button>
                             ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">{t({ en: 'Brands', ar: 'العلامات التجارية' })}</h4>
                          <div className="flex flex-wrap gap-2">
                             {brands.map(brand => (
                               <button key={brand} className="px-4 py-2 rounded-full border border-gray-100 text-[10px] font-bold uppercase transition-all hover:bg-gray-50">
                                 {brand}
                               </button>
                             ))}
                          </div>
                        </div>
                        <DrawerClose asChild>
                          <button className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase tracking-widest mt-8">
                            {t({ en: 'Apply Filters', ar: 'تطبيق الفلاتر' })}
                          </button>
                        </DrawerClose>
                      </div>
                    </DrawerContent>
                  </Drawer>
                )}
                {showSortTrigger && (
                  <Drawer>
                    <DrawerTrigger asChild>
                      <button 
                        onPointerDown={(e) => e.stopPropagation()}
                        className="flex items-center justify-center w-10 h-10 bg-white border border-gray-100 rounded-full shadow-sm hover:bg-gray-50 transition-all shrink-0"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </DrawerTrigger>
                    <DrawerContent>
                       <DrawerHeader>
                         <DrawerTitle>{t({ en: 'Sort By', ar: 'ترتيب حسب' })}</DrawerTitle>
                       </DrawerHeader>
                       <div className="p-6 space-y-4">
                         {['Latest', 'Price: Low to High', 'Price: High to Low', 'A-Z'].map(s => (
                           <button key={s} className="w-full p-6 text-left hover:bg-gray-50 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-gray-50">
                             {s}
                           </button>
                         ))}
                       </div>
                    </DrawerContent>
                  </Drawer>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    SectionTitle: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        alignment: {
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
          ],
        },
      },
      render: ({ title, subtitle, alignment }) => (
        <div className={`py-12 ${alignment === 'center' ? 'text-center' : ''}`}>
          <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">{title}</h2>
          {subtitle && <p className="text-gray-400 font-bold mt-2 uppercase tracking-[0.3em] text-[10px] md:text-xs">{subtitle}</p>}
        </div>
      ),
    },
    FeatureGrid: {
      fields: {
        items: {
          type: "array",
          getItemSummary: (item) => item.title,
          arrayFields: {
            title: { type: "text" },
            description: { type: "text" },
            icon: {
              type: "select",
              options: [
                { label: "Truck", value: "truck" },
                { label: "Shield", value: "shield" },
                { label: "Credit Card", value: "credit-card" },
                { label: "Star", value: "star" },
              ],
            },
          },
        },
      },
      render: ({ items }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-16">
          {items.map((item, i) => {
            const Icon = {
              "truck": Layout,
              "shield": ShieldCheck,
              "credit-card": Layout,
              "star": Star,
            }[item.icon] || Layout;
            return (
              <div key={i} className="p-10 bg-white border border-gray-50 rounded-[40px] shadow-sm hover:shadow-xl transition-all group">
                <div className="w-16 h-16 bg-gray-50 rounded-[20px] flex items-center justify-center mb-8 group-hover:bg-black group-hover:text-white transition-all">
                  <Icon className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-black italic uppercase tracking-tighter mb-2">{item.title}</h4>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      ),
    },
    Banner: {
      fields: {
        title: { type: "text" },
        imageUrl: { type: "text" },
        linkUrl: { type: "text" },
      },
      render: ({ title, imageUrl }) => (
        <div className="relative h-48 md:h-64 rounded-[32px] md:rounded-[48px] overflow-hidden group cursor-pointer shadow-xl my-8">
          <img src={imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={title} />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <h3 className="text-white text-3xl md:text-5xl font-black italic uppercase tracking-tighter">{title}</h3>
          </div>
        </div>
      )
    },
    Text: {
      fields: {
        content: { type: "textarea" },
        align: {
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
        variant: {
          type: "select",
          options: [
            { label: "Body", value: "body" },
            { label: "Highlight", value: "highlight" },
            { label: "Minimal", value: "minimal" },
          ],
        },
      },
      render: ({ content, align, variant }) => {
        const style = { textAlign: align };
        if (variant === 'highlight') {
          return (
            <div className="py-12 px-12 bg-black text-white rounded-[40px] shadow-2xl my-8" style={style}>
              <p className="text-2xl md:text-4xl font-black italic tracking-tighter leading-tight whitespace-pre-wrap">{content}</p>
            </div>
          );
        }
        if (variant === 'minimal') {
          return (
            <div className="py-4 border-l-4 border-black pl-6 my-4" style={style}>
              <p className="text-gray-400 italic font-medium whitespace-pre-wrap">{content}</p>
            </div>
          );
        }
        return (
          <div className="py-6" style={style}>
            <p className="text-gray-500 leading-relaxed font-bold text-lg md:text-xl whitespace-pre-wrap">{content}</p>
          </div>
        );
      },
    },
    StoresExplore: {
      fields: {
        layout: {
          type: "select",
          options: [
            { label: "Grid", value: "grid" },
            { label: "Carousel", value: "carousel" },
          ]
        },
        limit: { type: "number" }
      },
      render: ({ layout, limit }) => {
        const { stores, loading } = useContext(DataContext);
        const { t, lang } = useContext(LanguageContext);
 
        if (loading) return <div className="py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Stores...</div>;
 
        const displayedStores = stores.slice(0, limit || 4);
 
        if (layout === "carousel") {
          return (
            <div className="py-12">
               {displayedStores.length > 0 && (
                 <Carousel 
                  opts={{ align: "start", loop: displayedStores.length > 2, dragFree: true }}
                  className="w-full"
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  key={`stores-carousel-${displayedStores.map(s => s.id).join(',')}`}
                >
                  <CarouselContent>
                    {displayedStores.map(store => (
                      <CarouselItem key={store.id} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-8 bg-white border border-gray-50 rounded-[40px] shadow-sm hover:shadow-xl transition-all group h-full">
                          <div className="w-20 h-20 bg-gray-50 rounded-[24px] overflow-hidden mb-8 group-hover:scale-105 transition-transform">
                            {store.logoUrl ? (
                               <img src={store.logoUrl} className="w-full h-full object-cover" alt={t(store.locals.name)} />
                            ) : (
                               <StoreIcon className="w-full h-full p-6 text-gray-200" />
                            )}
                          </div>
                          <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">{t(store.locals.name)}</h3>
                          <p className="text-gray-400 text-sm font-medium leading-relaxed line-clamp-2 mb-6">{t(store.locals.description)}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Official Store</span>
                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
               )}
            </div>
          );
        }
 
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
            {displayedStores.map(store => (
              <div key={store.id} className="p-8 bg-white border border-gray-100 rounded-[40px] shadow-sm hover:shadow-xl transition-all group">
                <div className="w-24 h-24 bg-gray-50 rounded-[32px] overflow-hidden mb-8">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} className="w-full h-full object-cover" alt={t(store.locals.name)} />
                  ) : (
                    <StoreIcon className="w-full h-full p-8 text-gray-200" />
                  )}
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">{t(store.locals.name)}</h3>
                <p className="text-gray-400 text-xs font-medium line-clamp-2 mb-6">{t(store.locals.description)}</p>
                <div className="pt-6 border-t border-gray-50 flex items-center justify-between group-hover:border-black/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Visit Store</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                </div>
              </div>
            ))}
          </div>
        );
      }
    },
    ProductsExplore: {
      fields: {
        layout: {
          type: "select",
          options: [
            { label: "Grid", value: "grid" },
            { label: "Carousel", value: "carousel" },
          ]
        },
        categoryIds: { type: "array", getItemSummary: (item) => item.id, arrayFields: { id: { type: "text" } } },
        limit: { type: "number" },
        showFilters: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        enableSearch: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        enableSort: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] }
      },
      render: ({ layout, categoryIds = [], limit = 8, showFilters = false, enableSearch = false, enableSort = false }) => {
        const { products, categories, loading } = useContext(DataContext);
        const { t, lang } = useContext(LanguageContext);
        const { appSettings } = useContext(SettingsContext);
        const [activeCategory, setActiveCategory] = useState<string>('all');
        const [search, setSearch] = useState('');
 
        if (loading) return <div className="py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">Fetching Products...</div>;
 
        const filtered = products.filter(p => {
          const categoryMatch = categoryIds.length === 0 || categoryIds.some(c => p.categories.includes(c.id));
          const activeFilterMatch = activeCategory === 'all' || p.categories.includes(activeCategory);
          const searchMatch = !search || t(p.locals.name).toLowerCase().includes(search.toLowerCase());
          return categoryMatch && activeFilterMatch && searchMatch;
        }).slice(0, limit);
 
        const filterOptions = categoryIds.length > 0 
          ? categories.filter(c => categoryIds.some(cid => cid.id === c.id))
          : categories.slice(0, 6);
 
        return (
          <div className="py-12 space-y-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {(showFilters || enableSearch || enableSort) && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {enableSearch && (
                    <div className="relative flex-1 group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                      <input 
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t({ en: 'Search items...', ar: 'ابحث عن عناصر...' })}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-black/5 transition-all outline-none text-[10px] font-black uppercase tracking-widest"
                      />
                    </div>
                  )}
                  {enableSort && (
                    <button className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-sm">
                      <ArrowUpDown className="w-4 h-4" />
                      {t({ en: 'Sort', ar: 'ترتيب' })}
                    </button>
                  )}
                </div>
                
                {showFilters && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button 
                      onClick={() => setActiveCategory('all')}
                      className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === 'all' ? 'bg-black text-white shadow-xl scale-105' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                      {t({ en: 'All Items', ar: 'الكل' })}
                    </button>
                    {filterOptions.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat.id ? 'bg-black text-white shadow-xl scale-105' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      >
                        {t(cat.locals.title)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
 
            {layout === "carousel" ? (
              <div className="w-full">
                {filtered.length > 0 && (
                  <Carousel 
                    opts={{ align: "start", loop: filtered.length > 3, dragFree: true }}
                    className="w-full"
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    key={`prod-carousel-${filtered.map(p => p.id).join(',')}`}
                  >
                    <CarouselContent>
                      {filtered.map(product => (
                        <CarouselItem key={product.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                           <div className="group h-full">
                            <div className="relative aspect-[3/4] rounded-[40px] overflow-hidden bg-gray-50 mb-6 shadow-sm group-hover:shadow-2xl transition-all">
                              <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={t(product.locals.name)} />
                              <div className="absolute top-6 right-6 p-4 bg-white/90 backdrop-blur shadow-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                <TrendingUp className="w-4 h-4 text-black" />
                              </div>
                              <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/90 backdrop-blur rounded-[32px] opacity-0 group-hover:opacity-100 transition-all translate-y-10 group-hover:translate-y-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{product.brand}</p>
                                <h4 className="font-black italic uppercase leading-none mb-4 truncate text-sm">{t(product.locals.name)}</h4>
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-lg">{product.price} <span className="text-[10px] font-medium">{t(appSettings.currency?.symbol || appConfig.currency.symbol)}</span></span>
                                  <button className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-xl">
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                {filtered.map(product => (
                  <div key={product.id} className="group cursor-pointer">
                    <div className="aspect-[3/4] relative rounded-[40px] overflow-hidden bg-gray-50 mb-6 group-hover:shadow-2xl transition-all">
                      <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={t(product.locals.name)} />
                    </div>
                    <div className="px-2">
                       <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-1">{product.brand}</p>
                       <h4 className="text-lg font-black italic uppercase tracking-tighter leading-none mb-3 group-hover:text-emerald-600 transition-colors">{t(product.locals.name)}</h4>
                       <span className="text-xl font-black">{product.price} <span className="text-xs font-bold text-gray-300">{t(appSettings.currency?.symbol || appConfig.currency.symbol)}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
    CategoriesExplore: {
      fields: {
        layout: {
          type: "select",
          options: [
            { label: "Grid", value: "grid" },
            { label: "Carousel", value: "carousel" },
          ]
        },
        limit: { type: "number" }
      },
      render: ({ layout, limit }) => {
        const { categories, loading } = useContext(DataContext);
        const { t, lang } = useContext(LanguageContext);
 
        if (loading) return <div className="py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Categories...</div>;
 
        const displayed = categories.filter(c => c.isFeatured).slice(0, limit || 6);
 
        if (layout === 'carousel') {
          return (
            <div className="py-12">
               {displayed.length > 0 && (
                 <Carousel 
                  opts={{ align: "start", loop: displayed.length > 5, dragFree: true }}
                  className="w-full"
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  key={`cat-explore-carousel-${displayed.map(c => c.id).join(',')}`}
                >
                  <CarouselContent>
                    {displayed.map(cat => (
                      <CarouselItem key={cat.id} className="basis-1/3 md:basis-1/4 lg:basis-1/6">
                         <div className="relative aspect-square rounded-full overflow-hidden group cursor-pointer shadow-xl h-full border-4 border-white">
                          <img src={cat.bannerImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={t(cat.locals.title)} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end items-center text-center">
                             <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-2 group-hover:bg-white group-hover:text-black transition-all">
                               <Star className="w-4 h-4 text-white group-hover:text-black" />
                             </div>
                             <h3 className="text-white font-black italic uppercase tracking-tighter text-[10px] leading-none">{t(cat.locals.title)}</h3>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
               )}
            </div>
          );
        }

        return (
          <div className="py-12">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {displayed.map(cat => (
                <div key={cat.id}>
                  <div className="relative aspect-square rounded-full overflow-hidden group cursor-pointer shadow-xl border-4 border-white">
                    <img src={cat.bannerImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={t(cat.locals.title)} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end items-center text-center">
                       <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-black transition-all">
                         <Star className="w-5 h-5 text-white group-hover:text-black" />
                       </div>
                       <h3 className="text-white font-black italic uppercase tracking-tighter text-xs leading-none">{t(cat.locals.title)}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    },
    ContactInfo: {
      fields: {
        email: { type: "text" },
        phone: { type: "text" },
        address: { type: "textarea" },
      },
      render: ({ email, phone, address }) => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
          <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/10">
              <Mail className="w-6 h-6" />
            </div>
            <h5 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Email Us</h5>
            <p className="font-black italic text-lg">{email}</p>
          </div>
          <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/10">
              <Star className="w-6 h-6" /> 
            </div>
            <h5 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Call Us</h5>
            <p className="font-black italic text-lg">{phone}</p>
          </div>
          <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/10">
              <TextIcon className="w-6 h-6" />
            </div>
            <h5 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Find Us</h5>
            <p className="font-black italic text-lg leading-tight">{address}</p>
          </div>
        </div>
      ),
    },
    Space: {
      fields: {
        height: { type: "number" },
      },
      render: ({ height }) => <div style={{ height }} />,
    }
  },
};
