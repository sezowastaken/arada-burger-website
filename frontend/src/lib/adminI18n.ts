/**
 * Admin panel copy, in both languages.
 *
 * The public site localises through its `/[lang]` routes; the admin is a single
 * internal surface, so it carries its own dictionary and keeps the choice in a
 * cookie instead of the URL. Product and category *names* are bilingual data
 * and are edited in both languages regardless of this setting.
 */

export type AdminLang = "tr" | "en";

export const ADMIN_LANG_COOKIE = "arada-admin-lang";
export const DEFAULT_ADMIN_LANG: AdminLang = "tr";

export function isAdminLang(value: unknown): value is AdminLang {
  return value === "tr" || value === "en";
}

const tr = {
  nav: {
    dashboard: "Panel",
    products: "Ürünler",
    categories: "Kategoriler",
    orders: "Siparişler",
    inventory: "Envanter",
    analytics: "Analitik",
    settings: "Ayarlar",
    sectionMenu: "Menü",
    sectionOperations: "İşletme",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
  },
  header: {
    subtitle: "Yönetim Paneli",
    languageLabel: "Dil",
    viewSite: "Siteyi gör",
  },
  common: {
    loading: "Yükleniyor…",
    cancel: "Vazgeç",
    saving: "Kaydediliyor…",
    close: "Kapat",
    retry: "Tekrar dene",
    loadFailed: "Yüklenemedi",
    updateFailed: "Güncellenemedi",
  },
  products: {
    title: "Ürünler",
    allCategories: "Tüm kategoriler",
    newProduct: "Yeni ürün",
    colOrder: "Sıra",
    colImage: "Görsel",
    colName: "Ad",
    colCategory: "Kategori",
    colPrice: "Fiyat",
    colActive: "Menüde",
    colAvailable: "Stok",
    history: "Fiyat geçmişi",
    edit: "Düzenle",
    active: "Menüde",
    // Short enough to stay on one line inside the status pill.
    inactive: "Menü dışı",
    available: "Var",
    unavailable: "Tükendi",
    activateHint: "Menüye geri koy",
    deactivateHint: "Menüden kaldır",
    markAvailable: "Stokta var olarak işaretle",
    markUnavailable: "Tükendi olarak işaretle",
    reorderHintAll: "Sıralamayı değiştirmek için tek bir kategori seç.",
    moveUp: (name: string) => `${name} ürününü yukarı taşı`,
    moveDown: (name: string) => `${name} ürününü aşağı taşı`,
    emptyTitle: "Bu kategoride henüz ürün yok",
    emptyBody: "İlk ürünü ekle; menüde anında görünür.",
  },
  categories: {
    title: "Kategoriler",
    subtitle: "Bu sıra, müşterilerin menüde gördüğü sıradır.",
    newCategory: "Yeni kategori",
    colOrder: "Sıra",
    colName: "Ad",
    colProducts: "Ürün",
    colVisible: "Menüde",
    rename: "Yeniden adlandır",
    visible: "Görünür",
    hidden: "Gizli",
    showHint: "Bu kategoriyi menüde göster",
    hideHint: "Bu kategoriyi ve ürünlerini menüden gizle",
    moveUp: (name: string) => `${name} kategorisini yukarı taşı`,
    moveDown: (name: string) => `${name} kategorisini aşağı taşı`,
    hideConfirm: (name: string, count: number) =>
      `"${name}" kategorisini gizlersen menüdeki ${count} ürünü de kaybolur.\n\nDevam edilsin mi?`,
    emptyTitle: "Henüz kategori yok",
    emptyBody: "Menü kategorilerle başlar. İlkini ekle, sonra içine ürün koy.",
  },
  productForm: {
    createTitle: "Yeni ürün",
    editTitle: "Ürünü düzenle",
    nameTr: "Ad (TR)",
    nameEn: "Ad (EN)",
    descriptionTr: "Açıklama (TR)",
    descriptionEn: "Açıklama (EN)",
    category: "Kategori",
    price: "Fiyat (₺)",
    image: "Görsel yolu",
    create: "Ürünü oluştur",
    save: "Değişiklikleri kaydet",
    errNames: "Türkçe ve İngilizce ad zorunlu.",
    errImage: "Görsel yolu zorunlu.",
    errPrice: "Fiyat 0 veya daha büyük bir sayı olmalı.",
    errCategory: "Kategori seçilmeli.",
    errSave: "Ürün kaydedilemedi",
  },
  categoryForm: {
    createTitle: "Yeni kategori",
    editTitle: "Kategoriyi düzenle",
    nameTr: "Ad (TR)",
    nameEn: "Ad (EN)",
    create: "Kategoriyi oluştur",
    save: "Değişiklikleri kaydet",
    errNames: "Türkçe ve İngilizce ad zorunlu.",
    errSave: "Kategori kaydedilemedi",
    slugNote: (slug: string) =>
      `Adres kısmı ${slug} olarak kalır — yeniden adlandırmak mevcut bağlantıları bozmaz.`,
    hiddenNote: "Yeni kategoriler menüde gizli başlar. Önce ürünlerini ekle, sonra görünür yap.",
  },
  priceHistory: {
    title: "Fiyat geçmişi",
    currentPrice: "Güncel fiyat",
    empty: "Bu ürünün fiyatı oluşturulduğundan beri değişmedi.",
    increase: "zam",
    decrease: "indirim",
    loadFailed: "Fiyat geçmişi yüklenemedi",
  },
  placeholder: {
    comingSoonTitle: "Bu bölüm henüz hazır değil",
    dashboard:
      "Panel, satış ve trafik verisi toplanmaya başladıktan sonra gerçek rakamlarla kurulacak.",
    orders: "Siparişler, YepPos entegrasyonu tamamlandığında buraya gelecek.",
    inventory: "Malzeme girişi, stok ve fire takibi bu bölümde olacak.",
    analytics: "Hangi ürünün ne kadar görüntülendiği ve tıklandığı burada raporlanacak.",
    settings: "Panel ayarları burada olacak.",
  },
};

// Not `as const`: the Turkish dictionary defines the *shape*, and the English
// one is checked against it for completeness. Literal types would instead
// demand that every English string equal its Turkish counterpart.
type Dictionary = typeof tr;

const en: Dictionary = {
  nav: {
    dashboard: "Dashboard",
    products: "Products",
    categories: "Categories",
    orders: "Orders",
    inventory: "Inventory",
    analytics: "Analytics",
    settings: "Settings",
    sectionMenu: "Menu",
    sectionOperations: "Operations",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  header: {
    subtitle: "Admin Panel",
    languageLabel: "Language",
    viewSite: "View site",
  },
  common: {
    loading: "Loading…",
    cancel: "Cancel",
    saving: "Saving…",
    close: "Close",
    retry: "Try again",
    loadFailed: "Failed to load",
    updateFailed: "Update failed",
  },
  products: {
    title: "Products",
    allCategories: "All categories",
    newProduct: "New product",
    colOrder: "Order",
    colImage: "Image",
    colName: "Name",
    colCategory: "Category",
    colPrice: "Price",
    colActive: "On menu",
    colAvailable: "Stock",
    history: "Price history",
    edit: "Edit",
    active: "On menu",
    inactive: "Off menu",
    available: "In stock",
    unavailable: "Sold out",
    activateHint: "Put back on the menu",
    deactivateHint: "Take off the menu",
    markAvailable: "Mark as in stock",
    markUnavailable: "Mark as sold out",
    reorderHintAll: "Pick a single category to change the order.",
    moveUp: (name: string) => `Move ${name} up`,
    moveDown: (name: string) => `Move ${name} down`,
    emptyTitle: "No products in this category yet",
    emptyBody: "Add the first one — it appears on the menu straight away.",
  },
  categories: {
    title: "Categories",
    subtitle: "This order is the order customers see on the menu.",
    newCategory: "New category",
    colOrder: "Order",
    colName: "Name",
    colProducts: "Products",
    colVisible: "On menu",
    rename: "Rename",
    visible: "Visible",
    hidden: "Hidden",
    showHint: "Show this category on the public menu",
    hideHint: "Hide this category and its products from the public menu",
    moveUp: (name: string) => `Move ${name} up`,
    moveDown: (name: string) => `Move ${name} down`,
    hideConfirm: (name: string, count: number) =>
      `Hiding "${name}" also removes its ${count} product${count === 1 ? "" : "s"} from the public menu.\n\nContinue?`,
    emptyTitle: "No categories yet",
    emptyBody: "The menu starts with categories. Add the first one, then put products in it.",
  },
  productForm: {
    createTitle: "New product",
    editTitle: "Edit product",
    nameTr: "Name (TR)",
    nameEn: "Name (EN)",
    descriptionTr: "Description (TR)",
    descriptionEn: "Description (EN)",
    category: "Category",
    price: "Price (₺)",
    image: "Image path",
    create: "Create product",
    save: "Save changes",
    errNames: "Both Turkish and English names are required.",
    errImage: "Image path is required.",
    errPrice: "Price must be a number of 0 or more.",
    errCategory: "Category is required.",
    errSave: "Failed to save product",
  },
  categoryForm: {
    createTitle: "New category",
    editTitle: "Edit category",
    nameTr: "Name (TR)",
    nameEn: "Name (EN)",
    create: "Create category",
    save: "Save changes",
    errNames: "Both Turkish and English names are required.",
    errSave: "Failed to save category",
    slugNote: (slug: string) =>
      `The URL slug stays ${slug} — renaming does not break existing links.`,
    hiddenNote:
      "New categories start hidden from the public menu. Add products first, then make it visible.",
  },
  priceHistory: {
    title: "Price history",
    currentPrice: "Current price",
    empty: "This price has not changed since the product was created.",
    increase: "increase",
    decrease: "decrease",
    loadFailed: "Failed to load price history",
  },
  placeholder: {
    comingSoonTitle: "This section is not ready yet",
    dashboard:
      "The dashboard gets built on real numbers once sales and traffic data start coming in.",
    orders: "Orders land here once the YepPos integration is done.",
    inventory: "Purchases, stock levels and waste tracking will live in this section.",
    analytics: "Which products get viewed and clicked will be reported here.",
    settings: "Panel settings will live here.",
  },
};

export const adminDictionaries: Record<AdminLang, Dictionary> = { tr, en };

export type AdminCopy = Dictionary;
