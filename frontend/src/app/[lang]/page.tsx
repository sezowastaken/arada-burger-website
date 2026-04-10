import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "../../components/ui/ProductCard";
import menuData from "../../constants/menuData.json";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (lang !== "tr" && lang !== "en") {
    notFound();
  }

  const validLang = lang as "tr" | "en";

  const allItems = menuData.categories.flatMap((cat) => cat.items);
  const featuredIds = ["selimiye-burger", "datca-burger", "aksaz-hotdog"];
  const featuredProducts = featuredIds
    .map((id) => allItems.find((item) => item.id === id))
    .filter(Boolean) as typeof allItems;

  return (
    <div className="flex flex-col pb-24">
      {/* =========================================================
          QUICK LAYOUT GUIDE
          ---------------------------------------------------------
          1) SECTIONLAR ARASI MESAFE:
             - section üzerindeki py-* ile oynanır
             - örn: py-16 -> daha sıkı, py-24 -> daha ferah

          2) WRAPPER / CONTENT GENİŞLİĞİ:
             - max-w-[1440px] ana masaüstü sınırı
             - px-4 / md:px-8 / lg:px-10 yatay iç boşluk

          3) MASCOT KONUMU:
             - parent mutlaka relative
             - mascot absolute
             - right / left / top / bottom değerleri ile konum ver
             - boyut için w-[...] değiştir

          4) OVERLAP / ÜST ÜSTE BİNME:
             - z-10, z-20, z-30 ile katman kontrolü
             - taşma isteniyorsa parent'ta overflow-visible kullan

          5) HERO - CHECKER UZAKLIĞI:
             - hero section alt padding'i artır
             - checker section üst/alt padding'i azalt veya artır
         ========================================================= */}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 lg:pt-20 pb-20 md:pb-24 lg:pb-28">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 lg:px-10">
          {/* 
            HERO INNER CONTAINER
            - Bu katman hero içeriğinin hizasını belirler.
            - Hero genelini daha sıkı/açık yapmak için section pb-* değerleriyle oyna.
          */}
          <div className="relative">
            <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:gap-10 xl:gap-14">
              {/* TEXT BLOCK */}
              <div className="relative z-10 text-center lg:text-left">
                <h1 className="font-display font-extrabold uppercase tracking-tighter leading-[0.82] text-[clamp(4rem,10vw,9.5rem)]">
                  {validLang === "tr" ? (
                    <>
                      GERÇEK <span className="text-primary block">BURGER</span>{" "}
                      DENEYİMİ
                    </>
                  ) : (
                    <>
                      THE REAL <span className="text-primary block">BURGER</span>{" "}
                      EXPERIENCE
                    </>
                  )}
                </h1>

                <p className="mt-8 max-w-[680px] text-lg leading-relaxed text-on_surface/70 md:text-xl lg:mt-10 lg:max-w-[620px] lg:mx-0 mx-auto">
                  {validLang === "tr"
                    ? "Dondurulmuş ürün yok, fabrikasyon soslar yok. Sadece taze, yerel malzemeler ve tutkuyla hazırlanan gurme reçeteler."
                    : "No frozen products, no industrial sauces. Only fresh, local ingredients and gourmet recipes prepared with passion."}
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-4 lg:mt-10 lg:justify-start">
                  <Link
                    href={`/${validLang}/menu`}
                    className="rounded-full bg-primary px-12 py-5 font-display text-lg font-black uppercase tracking-widest text-white sticker-shadow transition-all hover:-translate-y-1"
                  >
                    {validLang === "tr" ? "MENÜYÜ GÖR" : "VIEW MENU"}
                  </Link>

                  <Link
                    href={`/${validLang}/about`}
                    className="rounded-full border border-on_surface/10 bg-surface_container_highest px-12 py-5 font-display text-lg font-black uppercase tracking-widest text-on_surface transition-all hover:bg-on_surface hover:text-white"
                  >
                    {validLang === "tr" ? "HİKAYEMİZ" : "OUR STORY"}
                  </Link>
                </div>
              </div>

              {/* VISUAL BLOCK */}
              <div className="relative mx-auto w-full max-w-[620px] lg:max-w-none">
                {/* 
                  BURGER MASCOT
                  - Daha sol/üst için: left/right ve top değerlerini değiştir
                  - Daha büyük/küçük için: w-[...] değiştir
                */}
                <div className="absolute left-[68%] top-[-8rem] z-20 
                rotate-12 transition-transform duration-300 ease-in-out hover:scale-110
                hover:rotate-3 md:left-[69%] lg:left-[68%] xl:left-[60%]">
                  <Image
                    src="/brand/mascots/burger_maskot.png"
                    alt="Happy Burger Mascot"
                    width={250}
                    height={250}
                    className="h-auto w-[120px] drop-shadow-xl md:w-[150px] lg:w-[170px] xl:w-[220px]"
                  />
                </div>

                <div className="relative z-10 animate-float">
                  <Image
                    src="/menu/products/Marmaris_Burger.png"
                    alt="Marmaris Burger"
                    width={620}
                    height={620}
                    className="h-auto w-full"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHECKER DIVIDER SECTION */}
      <section className="relative py-8 md:py-10 lg:py-12">
        {/* 
          CHECKER OUTER WRAPPER
          - Tam genişlik için max-width yok
          - Çizginin sayfanın tamamına yayılması için px-0 bırakıldı
        */}
        <div className="relative w-full">
          {/* 
            FRIES MASCOT
            - Horizontal: left-* ile değiştir
            - Vertical center: top-1/2 + -translate-y-1/2
            - Daha önde görünmesi için boyut çizgiden büyük tutuldu
          */}
          <div className="absolute left-[9%] top-1/2 z-20 -translate-y-1/2
          transition-transform duration-300 ease-in-out hover:scale-110 
          hover:rotate-3 
          md:left-[11%] lg:left-[13%] xl:left-[5%]">
            <Image
              src="/brand/mascots/patates_maskotu.png"
              alt="Fries Mascot"
              width={260}
              height={260}
              className="h-auto w-[120px] drop-shadow-xl md:w-[165px] lg:w-[200px] xl:w-[250px]"
            />
          </div>

          {/* 
            CHECKER LINE
            - h-* ile kalınlık değişir
            - Tam genişlik için w-full
          */}
          <div className="checkerboard relative h-16 md:h-20 lg:h-24 w-full" />
        </div>
      </section>

      {/* FEATURED SECTION */}
      <section className="relative py-16 md:py-20 lg:py-24 overflow-visible">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 lg:px-10">
          {/* 
            FEATURED WRAPPER
            - Soda burada yaşıyor
            - lg:pl-* ile sol tarafta dekor için alan bırakıyoruz
          */}
          <div className="relative">
            {/* 
              SODA MASCOT
              - Daha sola: left değerini küçült
              - Daha yukarı: top değerini küçült / negatif yap
              - Daha büyük: w-[...] artır
            */}
            <div className="absolute left-[-0.5rem] top-[10.5rem] z-20
             hidden transition-transform duration-300 ease-in-out hover:scale-110
              hover:rotate-3 lg:block xl:left-[-7rem] xl:top-[30rem]">
              <Image
                src="/brand/mascots/soda_maskot.png"
                alt="Soda Mascot"
                width={300}
                height={300}
                className="h-auto w-[165px] drop-shadow-xl xl:w-[270px]"
              />
            </div>

            <div className="lg:pl-24 xl:pl-0">
              <div className="mx-auto max-w-[1180px]">
                <div className="mb-12 flex items-end justify-between gap-6">
                  <div>
                    <h2 className="font-display text-4xl font-extrabold uppercase tracking-tighter leading-none md:text-5xl">
                      {validLang === "tr" ? "ÖNE ÇIKANLAR" : "HIGHLIGHTS"}
                    </h2>
                    <div className="mt-4 h-1.5 w-24 bg-primary"></div>
                  </div>

                  <Link
                    href={`/${validLang}/menu`}
                    className="border-b-2 border-primary pb-1 font-display text-sm font-bold uppercase tracking-widest"
                  >
                    {validLang === "tr" ? "TÜMÜNÜ GÖR" : "SEE ALL"}
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
                  {featuredProducts.map((item) => (
                    <ProductCard
                      key={item.id}
                      imageSrc={item.image}
                      imageAlt={item.name[validLang]}
                      name={item.name[validLang]}
                      price={`₺${item.price}`}
                      description={item.description[validLang]}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY ARADA SECTION */}
      <section className="relative overflow-visible bg-on_surface py-32 text-background lg:pb-40">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 lg:px-10">
          <div className="relative">
            {/* 
              HOTDOG MASCOT
              - Sağ alt anchor mantığı
              - Biraz aşağı taşması için bottom negatif
              - Fazla içeriğe girerse right artır veya w küçült
            */}
            <div className="absolute bottom-[-14rem] right-[4.5rem] z-20
             transition-transform duration-300 ease-in-out hover:scale-110 hover:rotate-3
             md:right-[6rem] lg:right-[7rem] xl:right-[2rem]">
              <Image
                src="/brand/mascots/hotdog_maskot.png"
                alt="Hotdog Mascot"
                width={320}
                height={320}
                className="h-auto w-[170px] drop-shadow-xl md:w-[230px] lg:w-[280px] xl:w-[320px]"
              />
            </div>

            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-16 font-display text-4xl font-extrabold uppercase tracking-tighter leading-none md:text-7xl">
                {validLang === "tr" ? "NEDEN ARADA?" : "WHY ARADA?"}
              </h2>

              <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
                <div>
                  <div className="mb-6 font-display text-5xl font-black text-secondary">
                    01
                  </div>
                  <h4 className="mb-4 font-display text-lg font-bold uppercase tracking-widest">
                    {validLang === "tr" ? "%100 Dana" : "100% Beef"}
                  </h4>
                  <p className="text-sm leading-relaxed opacity-60">
                    {validLang === "tr"
                      ? "Sadece en kaliteli yerli besilerden elde edilen taze et kullanıyoruz."
                      : "We only use fresh meat obtained from the highest quality local cattle."}
                  </p>
                </div>

                <div>
                  <div className="mb-6 font-display text-5xl font-black text-secondary">
                    02
                  </div>
                  <h4 className="mb-4 font-display text-lg font-bold uppercase tracking-widest">
                    {validLang === "tr" ? "Taze Ekmek" : "Fresh Buns"}
                  </h4>
                  <p className="text-sm leading-relaxed opacity-60">
                    {validLang === "tr"
                      ? "Her sabah kendi reçetemizle fırından çıkan artisan ekmekler."
                      : "Artisan buns coming out of the oven every morning with our own recipe."}
                  </p>
                </div>

                <div>
                  <div className="mb-6 font-display text-5xl font-black text-secondary">
                    03
                  </div>
                  <h4 className="mb-4 font-display text-lg font-bold uppercase tracking-widest">
                    {validLang === "tr" ? "Yerel Soslar" : "Local Sauces"}
                  </h4>
                  <p className="text-sm leading-relaxed opacity-60">
                    {validLang === "tr"
                      ? "Kendi hazırladığımız özel soslar ile lezzeti zirveye taşıyoruz."
                      : "We take the flavor to the peak with our own special sauces."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}