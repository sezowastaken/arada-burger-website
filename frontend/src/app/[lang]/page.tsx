import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "../../components/ui/ProductCard";
import menuData from "../../constants/menuData.json";

type Lang = "tr" | "en";

const mobileCheckerStyle = {
  backgroundImage:
    "conic-gradient(#b20000 90deg, #fff9e7 90deg 180deg, #b20000 180deg 270deg, #fff9e7 270deg)",
  backgroundSize: "24px 24px",
  backgroundRepeat: "repeat",
};

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (lang !== "tr" && lang !== "en") {
    notFound();
  }

  const validLang = lang as Lang;

  const allItems = menuData.categories.flatMap((cat) => cat.items);
  const featuredIds = ["selimiye-burger", "datca-burger", "aksaz-hotdog"];
  const featuredProducts = featuredIds
    .map((id) => allItems.find((item) => item.id === id))
    .filter(Boolean) as typeof allItems;

  const whyAradaItems =
    validLang === "tr"
      ? [
          {
            number: "01",
            title: "Kaburga Eti",
            text: "Burger köftelerimizde sıradan karışımlar değil, lezzetini ve suyunu her lokmada hissettiren gerçek kaburga eti kullanıyoruz.",
          },
          {
            number: "02",
            title: "Ev Yapımı Soslar",
            text: "Hazır lezzetlerle işimiz yok. Burgerlerimizin ruhunu tamamlayan soslarımızı kendi mutfağımızda, kendi tariflerimizle hazırlıyoruz.",
          },
          {
            number: "03",
            title: "Gerçek Frankfurter",
            text: "Hotdog menümüzde kaliteden taviz vermiyor; doyurucu ve karakterli lezzetiyle fark yaratan ithal frankfurter sosis kullanıyoruz.",
          },
        ]
      : [
          {
            number: "01",
            title: "Rib Meat",
            text: "We use real rib meat in our burger patties instead of ordinary blends, so every bite feels richer, juicier, and more satisfying.",
          },
          {
            number: "02",
            title: "Homemade Sauces",
            text: "We do not rely on ready-made flavors. The sauces that complete our burgers are prepared in our own kitchen, with our own recipes.",
          },
          {
            number: "03",
            title: "Real Frankfurter",
            text: "In our hotdog menu, we use imported frankfurter sausages that bring a classic, satisfying character without compromising on quality.",
          },
        ];

  return (
    <div className="flex flex-col pb-24">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pb-24 lg:pt-20 lg:pb-28">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 lg:px-10">
          <div className="relative">
            <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:gap-10 xl:gap-14">
              {/* TEXT BLOCK */}
              <div className="relative z-10 text-center lg:text-left">
                <h1 className="font-display text-[clamp(4rem,10vw,9.5rem)] font-extrabold uppercase leading-[0.82] tracking-tighter">
                  {validLang === "tr" ? (
                    <>
                      GERÇEK <span className="block text-primary">BURGER</span>{" "}
                      DENEYİMİ
                    </>
                  ) : (
                    <>
                      THE REAL <span className="block text-primary">BURGER</span>{" "}
                      TASTE
                    </>
                  )}
                </h1>

                <p className="mx-auto mt-8 max-w-[680px] text-lg leading-relaxed text-on_surface/70 md:text-xl lg:mt-10 lg:mx-0 lg:max-w-[620px]">
                  {validLang === "tr"
                    ? "İyi burgerin iyi etle başladığına inanıyoruz. Taze, yerel malzemeler ve tutkuyla hazırlanan gurme tarifler."
                    : "We believe a great burger starts with great meat. Fresh, local ingredients and passionately crafted gourmet recipes."}
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
                  BURGER MASCOT GUIDE
                  ---------------------------------------------------------
                  Mobile ayarları sadece BASE class'larda yapılır.
                  - Yatay konum: left-[..] / right-[..]
                  - Dikey konum: top-[..]
                  - Boyut: className içindeki w-[..]
                  
                  Örnek:
                  - Mobilde daha sağa almak için left değerini artır
                  - Mobilde daha yukarı almak için top değerini daha negatif yap
                  - Mobilde küçültmek / büyütmek için base w-[..] değiştir
                  
                  Desktop ayarları lg:/xl: prefix'li class'lardır, onlara dokunma.
                */}
                <div className="absolute left-[75%] top-[-13rem] z-20 rotate-12 transition-transform duration-300 ease-in-out hover:scale-110 hover:rotate-3 md:left-[69%] lg:left-[68%] lg:top-[-8rem] xl:left-[60%]">
                  <Image
                    src="/brand/mascots/burger_maskot.png"
                    alt="Happy Burger Mascot"
                    width={250}
                    height={250}
                    className="h-auto w-[200px] drop-shadow-xl sm:w-[110px] md:w-[135px] lg:w-[170px] xl:w-[220px]"
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
        <div className="relative w-full">
          {/* 
            FRIES MASCOT GUIDE
            ---------------------------------------------------------
            Mobile ayarları sadece base / sm class'larda yapılır.
            - Yatay konum: left-[..]
            - Dikey konum: top-1/2 + -translate-y-[..]
            - Boyut: className içindeki w-[..]
            
            Örnek:
            - Mobilde daha sağa almak için left değerini artır
            - Daha yukarı / aşağı almak için -translate-y-[..] ile oyna
            - Daha büyük/küçük için base w-[..] değiştir
            
            md:/lg:/xl: class'lar desktop/tablet ayarlarıdır.
          */}
          <div className="absolute left-[9%] top-1/2 z-20 -translate-y-[56%] transition-transform duration-300 ease-in-out hover:scale-110 hover:rotate-3 sm:left-[16%] md:left-[11%] md:-translate-y-1/2 lg:left-[13%] xl:left-[5%]">
            <Image
              src="/brand/mascots/patates_maskotu.png"
              alt="Fries Mascot"
              width={260}
              height={260}
              className="h-auto w-[150px] drop-shadow-xl sm:w-[132px] md:w-[165px] lg:w-[200px] xl:w-[250px]"
            />
          </div>

          {/* Mobile checker thickness */}
          <div
            className="relative h-6 w-full md:hidden"
            style={mobileCheckerStyle}
          />

          {/* Desktop checker thickness - exactly preserved */}
          <div className="checkerboard relative hidden h-16 w-full md:block lg:h-24" />
        </div>
      </section>

      {/* FEATURED SECTION */}
      <section className="relative overflow-visible py-16 md:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 lg:px-10">
          <div className="relative">
            {/* 
              SODA MASCOT
              ---------------------------------------------------------
              Mobilde özellikle gizli kalacak.
              Sadece lg ve üstünde görünecek.
              Mobilde göstermek istersen `hidden lg:block` kısmını değiştir.
            */}
            <div className="absolute left-[-0.5rem] top-[10.5rem] z-20 hidden transition-transform duration-300 ease-in-out hover:scale-110 hover:rotate-3 lg:block xl:left-[-7rem] xl:top-[30rem]">
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
                    <h2 className="font-display text-4xl font-extrabold uppercase leading-none tracking-tighter md:text-5xl">
                      {validLang === "tr" ? "ÖNE ÇIKANLAR" : "HIGHLIGHTS"}
                    </h2>
                    <div className="mt-4 h-1.5 w-24 bg-primary" />
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
              HOTDOG MASCOT GUIDE
              ---------------------------------------------------------
              Mobilde de görünür kalacak.
              Mobile ayarları sadece base / sm class'larda yapılır.
              - Yatay konum: right-[..]
              - Dikey konum: bottom-[..]
              - Boyut: className içindeki w-[..]
              
              Örnek:
              - Mobilde daha sola almak için right değerini küçült
              - Daha yukarı almak için bottom değerini daha az negatif yap
              - Daha küçük/büyük için base w-[..] değiştir
              
              md:/lg:/xl: class'lar daha büyük ekranlar içindir.
            */}
            <div className="absolute bottom-[-10rem] right-5 z-20 transition-transform duration-300 ease-in-out hover:scale-110 hover:rotate-3 sm:right-6 sm:bottom-[-7rem] md:right-[6rem] md:bottom-[-10rem] lg:right-[7rem] lg:bottom-[-14rem] xl:right-[2rem]">
              <Image
                src="/brand/mascots/hotdog_maskot.png"
                alt="Hotdog Mascot"
                width={320}
                height={320}
                className="h-auto w-[175px] drop-shadow-xl sm:w-[150px] md:w-[230px] lg:w-[280px] xl:w-[320px]"
              />
            </div>

            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-16 font-display text-4xl font-extrabold uppercase leading-none tracking-tighter md:text-7xl">
                {validLang === "tr" ? "NEDEN ARADA?" : "WHY ARADA?"}
              </h2>

              {/* Tasarım aynı kaldı, sadece metin içeriği değişti */}
              <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
                {whyAradaItems.map((item) => (
                  <div key={item.number}>
                    <div className="mb-6 font-display text-5xl font-black text-secondary">
                      {item.number}
                    </div>
                    <h4 className="mb-4 font-display text-lg font-bold uppercase tracking-widest">
                      {item.title}
                    </h4>
                    <p className="text-sm leading-relaxed opacity-60">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}