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
  ArrowUpDown,
  ChevronRight
} from "lucide-react";
import { Icon } from "@iconify/react";
import { AnimatePresence } from "motion/react";
import { useProductSearchParams } from "../hooks/useProductSearchParams";
import { useNavigate, useSearchParams } from "react-router-dom";
import { VirtuosoGrid } from 'react-virtuoso';
import { 
  DataContext, 
  LanguageContext, 
  SettingsContext, 
  ProductCard,
  ProductCardVariant,
  ExploreProducts,
  ExploreProductsProps,
  FilterDrawer
} from "../App";
import { Product, Store, Category, Tag } from "../types";
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
    actions?: {
      label: string;
      path: string;
      icon?: string;
      variant?: "primary" | "secondary" | "outline" | "ghost";
    }[];
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
    title?: string;
    description?: string;
    seeMoreLabel?: string;
    seeMorePath?: string;
    layout: "grid" | "carousel";
    limit: number;
  };
  ProductsExplore: {
    title?: string;
    description?: string;
    image?: string;
    icon?: string;
    seeMoreLabel?: string;
    seeMorePath?: string;
    layout: "grid" | "carousel" | "masonry" | "list";
    columns?: number;
    gapSize?: "none" | "small" | "medium" | "large";
    cardVariant?: ProductCardVariant;
    categoryIds: { id: string }[];
    defaultTagId?: string;
    defaultSearch?: string;
    useUrlParams?: boolean;
    enableVirtualScroll?: boolean;
    limit: number;
    showFilters: boolean;
    filterStyle?: 'drawer' | 'bar' | 'sidebar';
    enableSearch?: boolean;
    enableSort?: boolean;
    restrictToFiltered?: boolean;
  };
  CategoriesExplore: {
    title?: string;
    description?: string;
    seeMoreLabel?: string;
    seeMorePath?: string;
    layout: "grid" | "carousel";
    limit: number;
    sizeScale?: "small" | "medium" | "large";
    enableLoop?: boolean;
  };
  Space: {
    height: number;
  };
};

const GridContainer = React.forwardRef(({ children, ...props }: any, ref: any) => (
  <div
    {...props}
    ref={ref}
    className={cn(
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6 md:gap-10",
      props.className
    )}
  >
    {children}
  </div>
));

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
        actions: {
          type: "array",
          getItemSummary: (item) => item.label || 'Action',
          arrayFields: {
            label: { type: "text" },
            path: { type: "text" },
            icon: { type: "text" },
            variant: {
              type: "select",
              options: [
                { label: "Primary", value: "primary" },
                { label: "Secondary", value: "secondary" },
                { label: "Outline", value: "outline" },
                { label: "Ghost", value: "ghost" },
              ]
            }
          }
        }
      },
      render: ({ title, description, buttonText, imageUrl, variant, actions }) => {
        const navigate = useNavigate();

        const renderActions = () => {
          if (actions && actions.length > 0) {
            return (
              <div className={`flex flex-wrap gap-4 items-center ${variant === "centered" ? "justify-center" : ""}`}>
                {actions.map((action, i) => {
                  let btnClass = "px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-2 ";
                  
                  if (action.variant === 'secondary') {
                     btnClass += variant === 'centered' ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur-md" : "bg-gray-100 hover:bg-gray-200 text-black";
                  } else if (action.variant === 'outline') {
                     btnClass += variant === 'centered' ? "border-2 border-white text-white hover:bg-white hover:text-black" : "border-2 border-black text-black hover:bg-black hover:text-white";
                  } else if (action.variant === 'ghost') {
                     btnClass += variant === 'centered' ? "text-white hover:bg-white/10" : "text-black hover:bg-gray-50 shadow-none";
                  } else {
                     btnClass += variant === 'centered' ? "bg-white text-black" : "bg-black text-white";
                  }

                  return (
                    <button key={i} onClick={() => action.path && navigate(action.path)} className={btnClass}>
                      {action.icon && <Icon icon={action.icon} className="w-5 h-5" />}
                      {action.label}
                    </button>
                  );
                })}
              </div>
            );
          }
          if (buttonText) {
             return (
               <button className={`px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl ${variant === 'centered' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                 {buttonText}
               </button>
             );
          }
          return null;
        };

        if (variant === "split") {
          return (
            <section className="flex flex-col md:flex-row items-center gap-8 md:gap-16 py-12 md:py-20">
              <div className="flex-1 space-y-6">
                <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter leading-none italic uppercase">{title}</h1>
                <p className="text-xl text-gray-500 font-medium">{description}</p>
                {renderActions()}
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
              {renderActions()}
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
        const { categories, brands, tags } = useContext(DataContext);
        const { params, setSearchQuery, setCategorySlugs, setSelectedBrand, setPriceRange, setSortOption, setSelectedTagId } = useProductSearchParams();
        const { appSettings } = useContext(SettingsContext);
        const [showFilters, setShowFilters] = useState(false);
        const [showSort, setShowSort] = useState(false);

        const activeCategorySlugs = params.categorySlugs;
        const selectedCategoryIds = categories.filter(c => activeCategorySlugs.includes(c.slug)).map(c => c.id);

        const handleCategoryToggle = (slug: string) => {
          if (!slug) {
            setCategorySlugs([]);
            return;
          }
          const currentSlugs = params.categorySlugs;
          const nextSlugs = currentSlugs.includes(slug) 
            ? currentSlugs.filter((s: string) => s !== slug) 
            : [...currentSlugs, slug];
          setCategorySlugs(nextSlugs);
        };

        const handleTagToggle = (tagId: string) => {
          setSelectedTagId(params.selectedTagId === tagId ? '' : tagId);
        };

        return (
          <div className="py-4 space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-2">
              {showSearchBar && (
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                  <input 
                    type="text"
                    placeholder={t(placeholder)}
                    value={params.searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-full focus:bg-white focus:border-gray-100 focus:ring-4 focus:ring-black/5 transition-all outline-none text-[10px] uppercase font-black tracking-widest placeholder:text-gray-400"
                  />
                </div>
              )}
              <div className="flex gap-2">
                {showFilterTrigger && (
                  <button 
                    onClick={() => setShowFilters(true)}
                    className="flex items-center justify-center w-10 h-10 bg-black text-white rounded-full shadow-lg hover:scale-110 transition-all shrink-0"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                )}
                {showSortTrigger && (
                  <button 
                    onClick={() => setShowSort(true)}
                    className="flex items-center justify-center w-10 h-10 bg-white border border-gray-100 rounded-full shadow-sm hover:bg-gray-50 transition-all shrink-0"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <FilterDrawer 
                onClose={() => setShowFilters(false)}
                categories={categories}
                selectedCategoryIds={selectedCategoryIds}
                setSelectedCategoryId={handleCategoryToggle}
                brands={brands}
                selectedBrand={params.selectedBrand}
                setSelectedBrand={setSelectedBrand}
                priceRange={[params.minPrice, params.maxPrice]}
                setPriceRange={setPriceRange}
                currency={appSettings.currency || '$'}
                sortOption={params.sortOption}
                setSortOption={setSortOption}
                tags={tags}
                selectedTagId={params.selectedTagId}
                setSelectedTagId={handleTagToggle}
              />
            )}
            
            <AnimatePresence>
              {showSort && (
                <Drawer open={true} onOpenChange={(o) => !o && setShowSort(false)}>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>{t({ en: 'Sort By', ar: 'ترتيب حسب' })}</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-6 space-y-3 pb-20">
                      {[
                        { id: 'newest', label: { en: 'Newest Arrivals', ar: 'الأحدث وصولاً' } },
                        { id: 'price-low', label: { en: 'Price: Low to High', ar: 'السعر: من الأقل للأعلى' } },
                        { id: 'price-high', label: { en: 'Price: High to Low', ar: 'السعر: من الأعلى للأقل' } },
                      ].map(opt => (
                        <button 
                          key={opt.id}
                          onClick={() => {
                            setSortOption(opt.id);
                            setShowSort(false);
                          }}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${params.sortOption === opt.id ? 'border-black bg-black text-white' : 'border-gray-50 hover:border-gray-200'}`}
                        >
                          <span className="font-bold text-sm tracking-tight">{t(opt.label)}</span>
                        </button>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
              )}
            </AnimatePresence>
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
        title: { type: "text" },
        description: { type: "textarea" },
        seeMoreLabel: { type: "text" },
        seeMorePath: { type: "text" },
        layout: {
          type: "select",
          options: [
            { label: "Grid", value: "grid" },
            { label: "Carousel", value: "carousel" },
          ]
        },
        limit: { type: "number" }
      },
      render: ({ title, description, seeMoreLabel, seeMorePath, layout, limit }) => {
        const { stores, loading } = useContext(DataContext);
        const { t, lang } = useContext(LanguageContext);
        const navigate = useNavigate();
 
        if (loading) return <div className="py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Stores...</div>;
 
        const displayedStores = stores.slice(0, limit || 4);
 
        return (
          <div className="py-12 space-y-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
             {(title || description || seeMoreLabel) && (
              <div className="flex flex-row flex-wrap items-center justify-between gap-4 md:gap-6 w-full">
                <div className="flex-1">
                  {title && <h2 className="text-2xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">{t(title)}</h2>}
                  {description && <p className="text-gray-400 font-bold mt-1 md:mt-2 uppercase tracking-[0.2em] text-[8px] md:text-xs max-w-2xl">{t(description)}</p>}
                </div>
                {seeMoreLabel && (
                  <button 
                    onClick={() => seeMorePath && navigate(seeMorePath)}
                    className="shrink-0 flex items-center gap-2 group text-[10px] font-black uppercase tracking-widest hover:text-emerald-500 transition-colors rtl:mr-auto ltr:ml-auto"
                  >
                    {t(seeMoreLabel)}
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                )}
              </div>
            )}

            {layout === "carousel" ? (
              <div className="w-full">
                 {displayedStores.length > 0 && (
                   <Carousel 
                    opts={{ align: "start", loop: displayedStores.length > 2, dragFree: true }}
                    className="w-full"
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    key={`stores-carousel-${displayedStores.map(s => s.id).join(',')}`}
                  >
                    <CarouselContent>
                      {displayedStores.map(store => (
                        <CarouselItem key={store.id} className="basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
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
                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between group-hover:border-black/5 transition-colors">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t({ en: 'Visit Store', ar: 'زيارة المتجر' })}</span>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
    ProductsExplore: {
      fields: {
        title: { type: "text" },
        description: { type: "text" },
        image: { type: "text" },
        icon: { type: "text" },
        seeMoreLabel: { type: "text" },
        seeMorePath: { type: "text" },
        layout: { 
          type: "radio", 
          options: [
            { label: "Grid", value: "grid" },
            { label: "Carousel", value: "carousel" },
            { label: "List", value: "list" }
          ] 
        },
        columns: { type: "number" },
        gapSize: {
          type: "select",
          options: [
            { label: "None", value: "none" },
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" }
          ]
        },
        cardVariant: {
          type: "select",
          options: [
            { label: "Default", value: "default" },
            { label: "Minimal", value: "minimal" },
            { label: "Modern", value: "modern" },
            { label: "Glass", value: "glass" },
            { label: "Cover", value: "cover" },
            { label: "Local Delivery", value: "local-delivery" },
          ]
        },
        categoryIds: { type: "array", getItemSummary: (item) => item.id, arrayFields: { id: { type: "text" } } },
        defaultTagId: { type: "text" },
        defaultSearch: { type: "text" },
        useUrlParams: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        enableVirtualScroll: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        limit: { type: "number" },
        showFilters: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        filterStyle: {
          type: "select",
          options: [
            { label: "Drawer", value: "drawer" },
            { label: "Bar", value: "bar" },
            { label: "Sidebar", value: "sidebar" }
          ]
        },
        enableSearch: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        enableSort: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
        restrictToFiltered: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] }
      },
      render: (props: ExploreProductsProps) => {
        // Ensure useUrlParams is true by default for better cross-component sync
        const useUrlParams = props.useUrlParams !== undefined ? props.useUrlParams : true;
        return (
          <div id="shop-explore">
            <ExploreProducts {...props} useUrlParams={useUrlParams} />
          </div>
        );
      }
    },
    CategoriesExplore: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        seeMoreLabel: { type: "text" },
        seeMorePath: { type: "text" },
        layout: {
          type: "select",
          options: [
            { label: "Grid", value: "grid" },
            { label: "Carousel", value: "carousel" },
          ]
        },
        sizeScale: {
          type: "select",
          options: [
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" },
          ]
        },
        enableLoop: {
          type: "radio",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ]
        },
        limit: { type: "number" }
      },
      render: ({ title, description, seeMoreLabel, seeMorePath, layout, limit, sizeScale = "medium", enableLoop = false }) => {
        const { categories, loading } = useContext(DataContext);
        const { t, lang } = useContext(LanguageContext);
        const navigate = useNavigate();
        const { params: filterParams, setCategorySlugs } = useProductSearchParams();
 
        if (loading) return <div className="py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Categories...</div>;
 
        const displayed = categories.filter(c => c.isFeatured).slice(0, limit || 6);

        const onCategorySelect = (cat: Category) => {
          const slugToUse = cat.slug || cat.id;
          const currentSlugs = filterParams.categorySlugs;
          const nextSlugs = currentSlugs.includes(slugToUse) 
            ? currentSlugs.filter((s: string) => s !== slugToUse) 
            : [...currentSlugs, slugToUse];
          
          setCategorySlugs(nextSlugs);
        };
 
        return (
          <div className="py-12 space-y-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
             {(title || description || seeMoreLabel) && (
              <div className="flex flex-row flex-wrap items-center justify-between gap-4 md:gap-6 w-full">
                <div className="flex-1">
                  {title && <h2 className="text-2xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">{t(title)}</h2>}
                  {description && <p className="text-gray-400 font-bold mt-1 md:mt-2 uppercase tracking-[0.2em] text-[8px] md:text-xs max-w-2xl">{t(description)}</p>}
                </div>
                {seeMoreLabel && (
                  <button 
                    onClick={() => seeMorePath && navigate(seeMorePath)}
                    className="shrink-0 flex items-center gap-2 group text-[10px] font-black uppercase tracking-widest hover:text-emerald-500 transition-colors rtl:mr-auto ltr:ml-auto"
                  >
                    {t(seeMoreLabel)}
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                )}
              </div>
            )}

            {layout === 'carousel' ? (
              <div className="w-full">
                 {displayed.length > 0 && (
                   <Carousel 
                    opts={{ align: "start", loop: enableLoop, dragFree: true }}
                    className="w-full"
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    key={`cat-explore-carousel-${displayed.map(c => c.id).join(',')}-${enableLoop}-${sizeScale}-${filterParams.categorySlugs.join(',')}`}
                  >
                    <CarouselContent>
                      {displayed.map(cat => {
                        let itemBasis = "basis-1/3 md:basis-1/4 lg:basis-1/6 xl:basis-[12.5%]";
                        let iconSize = "w-8 h-8";
                        let innerIconSize = "w-5 h-5";
                        let textSize = "text-[10px]";

                        const isActive = filterParams.categorySlugs.includes(cat.slug) || filterParams.categorySlugs.includes(cat.id);
                        const categoryTitle = cat.locals?.title || cat.title;

                        if (sizeScale === "small") {
                          itemBasis = "basis-1/4 md:basis-1/6 lg:basis-[12.5%] xl:basis-[10%]";
                          textSize = "text-[8px]";
                        } else if (sizeScale === "large") {
                          itemBasis = "basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5";
                          textSize = "text-xs";
                        }

                        return (
                          <CarouselItem key={cat.id} className={itemBasis}>
                             <div 
                               className={`relative aspect-square rounded-full overflow-hidden group cursor-pointer shadow-xl h-full border-4 transition-all duration-300 ${isActive ? 'border-black scale-105 ring-4 ring-black/20 z-10 shadow-black/30' : 'border-white hover:border-gray-100'}`}
                               onClick={() => onCategorySelect(cat)}
                             >
                              <img src={cat.bannerImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={t(categoryTitle)} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end items-center text-center">
                                 <h3 className={`text-white font-black italic uppercase tracking-tighter ${textSize} leading-none`}>{t(categoryTitle)}</h3>
                              </div>
                            </div>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                  </Carousel>
                 )}
              </div>
            ) : (
              <div className={
                sizeScale === "small" 
                  ? "grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-4"
                  : sizeScale === "large"
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-8"
                    : "grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-6"
              }>
                {displayed.map(cat => {
                   const isActive = filterParams.categorySlugs.includes(cat.slug) || filterParams.categorySlugs.includes(cat.id);
                   const categoryTitle = cat.locals?.title || cat.title;
                   let iconSize = "w-10 h-10";
                   let innerIconSize = "w-6 h-6";
                   let textSize = "text-xs";

                   if (sizeScale === "small") {
                     textSize = "text-[9px]";
                   } else if (sizeScale === "large") {
                     textSize = "text-sm";
                   }

                   return (
                    <div key={cat.id}>
                      <div 
                        className={`relative aspect-square rounded-full overflow-hidden group cursor-pointer shadow-xl border-4 transition-all duration-300 ${isActive ? 'border-black scale-105 ring-4 ring-black/20 z-10 shadow-black/30' : 'border-white hover:border-gray-100'}`}
                        onClick={() => onCategorySelect(cat)}
                      >
                        <img src={cat.bannerImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={t(categoryTitle)} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end items-center text-center">
                           <h3 className={`text-white font-black italic uppercase tracking-tighter ${textSize} leading-none`}>{t(categoryTitle)}</h3>
                        </div>
                      </div>
                    </div>
                   );
                })}
              </div>
            )}
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
