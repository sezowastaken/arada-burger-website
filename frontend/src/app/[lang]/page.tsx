import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ui/ProductCard";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  // Validate locale again in page just to be safe with types
  if (lang !== "tr" && lang !== "en") {
    notFound();
  }

  const validLang = lang as "tr" | "en";

  const featuredProducts = [
    { 
      id: 'selimiye', 
      name: { tr: "Selimiye Burger", en: "Selimiye Burger" }, 
      img: "/menu/products/Selimiye_Burger.png", 
      price: "₺340",
      description: { 
        tr: "Karamelize soğan, cheddar peyniri ve özel Arada sos ile.", 
        en: "With caramelized onions, cheddar cheese, and special Arada sauce." 
      }
    },
    { 
      id: 'datca', 
      name: { tr: "Datça Burger", en: "Datça Burger" }, 
      img: "/menu/products/Datça_Burger.png", 
      price: "₺360",
      description: { 
        tr: "Közlenmiş patlıcan, ezine peyniri ve taze yeşillikler ile.", 
        en: "With roasted eggplant, Ezine cheese, and fresh greens." 
      }
    },
    { 
      id: 'aksaz', 
      name: { tr: "Aksaz Hotdog", en: "Aksaz Hotdog" }, 
      img: "/menu/products/Aksaz_Hotdog.png", 
      price: "₺280",
      description: { 
        tr: "Çıtır soğan, turşu ve ballı hardal eşliğinde.", 
        en: "Accompanied by crispy onions, pickles, and honey mustard." 
      }
    },
  ];

  return (
    <div className="flex flex-col gap-24 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 lg:pt-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="font-display font-extrabold text-5xl md:text-7xl lg:text-[10rem] uppercase tracking-tighter leading-[0.8] mb-12">
                {validLang === "tr" ? (
                  <>GERÇEK <span className="text-primary block">BURGER</span> DENEYİMİ</>
                ) : (
                  <>THE REAL <span className="text-primary block">BURGER</span> EXPERIENCE</>
                )}
              </h1>
              <p className="text-lg md:text-xl text-on_surface/70 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {validLang === "tr" 
                  ? "Dondurulmuş ürün yok, fabrikasyon soslar yok. Sadece taze, yerel malzemeler ve tutkuyla hazırlanan gurme reçeteler."
                  : "No frozen products, no industrial sauces. Only fresh, local ingredients and gourmet recipes prepared with passion."}
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Link
                  href={`/${validLang}/menu`}
                  className="bg-primary text-white font-display font-black uppercase px-12 py-5 rounded-full sticker-shadow text-lg tracking-widest hover:-translate-y-1 transition-all"
                >
                  {validLang === "tr" ? "MENÜYÜ GÖR" : "VIEW MENU"}
                </Link>
                <Link
                  href={`/${validLang}/about`}
                  className="bg-surface_container_highest text-on_surface font-display font-black uppercase px-12 py-5 rounded-full border border-on_surface/10 text-lg tracking-widest hover:bg-on_surface hover:text-white transition-all"
                >
                  {validLang === "tr" ? "HİKAYEMİZ" : "OUR STORY"}
                </Link>
              </div>
            </div>
            
            <div className="flex-1 relative">
              <div className="relative z-10 animate-float">
                <Image
                  src="/menu/products/Marmaris_Burger.png"
                  alt="Marmaris Burger"
                  width={600}
                  height={600}
                  className="w-full h-auto drop-shadow-2xl"
                  priority
                />
              </div>
              {/* Sticker Mascot Overlay */}
              <div className="absolute -top-10 -right-10 w-32 h-32 md:w-48 md:h-48 z-20 rotate-12 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="/brand/mascots/burger_maskot.png"
                  alt="Happy Burger Mascot"
                  width={200}
                  height={200}
                  className="w-full h-auto sticker-shadow rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="checkerboard"></div>

      {/* Featured Items Section */}
      <section className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl uppercase tracking-tighter leading-none mb-4">
              {validLang === "tr" ? "ÖNE ÇIKANLAR" : "HIGHLIGHTS"}
            </h2>
            <div className="h-1.5 w-24 bg-primary"></div>
          </div>
          <Link href={`/${validLang}/menu`} className="font-display font-bold uppercase text-sm border-b-2 border-primary pb-1 tracking-widest">
            {validLang === "tr" ? "TÜMÜNÜ GÖR" : "SEE ALL"}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {featuredProducts.map((item) => (
            <ProductCard
              key={item.id}
              imageSrc={item.img}
              imageAlt={item.name[validLang]}
              name={item.name[validLang]}
              price={item.price}
              description={item.description[validLang]}
            />
          ))}
        </div>
      </section>

      {/* Quality Section */}
      <section className="bg-on_surface text-background py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display font-extrabold text-4xl md:text-7xl uppercase tracking-tighter mb-16 leading-none">
              {validLang === "tr" ? "NEDEN ARADA?" : "WHY ARADA?"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div>
                <div className="text-secondary text-5xl mb-6 font-display font-black">01</div>
                <h4 className="font-display font-bold uppercase mb-4 tracking-widest text-lg">{validLang === "tr" ? "%100 Dana" : "100% Beef"}</h4>
                <p className="text-sm opacity-60 leading-relaxed">
                  {validLang === "tr" ? "Sadece en kaliteli yerli besilerden elde edilen taze et kullanıyoruz." : "We only use fresh meat obtained from the highest quality local cattle."}
                </p>
              </div>
              <div>
                <div className="text-secondary text-5xl mb-6 font-display font-black">02</div>
                <h4 className="font-display font-bold uppercase mb-4 tracking-widest text-lg">{validLang === "tr" ? "Taze Ekmek" : "Fresh Buns"}</h4>
                <p className="text-sm opacity-60 leading-relaxed">
                  {validLang === "tr" ? "Her sabah kendi reçetemizle fırından çıkan artisan ekmekler." : "Artisan buns coming out of the oven every morning with our own recipe."}
                </p>
              </div>
              <div>
                <div className="text-secondary text-5xl mb-6 font-display font-black">03</div>
                <h4 className="font-display font-bold uppercase mb-4 tracking-widest text-lg">{validLang === "tr" ? "Yerel Soslar" : "Local Sauces"}</h4>
                <p className="text-sm opacity-60 leading-relaxed">
                  {validLang === "tr" ? "Kendi hazırladığımız özel soslar ile lezzeti zirveye taşıyoruz." : "We take the flavor to the peak with our own special sauces."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
