export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: "tr" | "en" }>;
}) {
  const { lang } = await params;
  const isTr = lang === "tr";

  const content = {
    eyebrow: isTr ? "Hakkımızda" : "About Us",
    headlineTop: isTr ? "Kaburgadan Gelen" : "Taste from the",
    headlineAccent: isTr ? "Lezzet" : "Ribs",
    headlineBottom: isTr ? "Aileden Gelen Özen." : "Care from the Family.",
    intro: isTr
      ? "Biz, işin özünün iyi malzeme ve güler yüz olduğuna inanan bir aile işletmesiyiz. Amacımız sadece karın doyuran değil; retro diner kültürünün o sıcak, gösterişsiz ama özenli ruhunu masanıza taşıyan gerçek ürünler sunmak."
      : "We are a family business that believes the heart of good food is good ingredients and genuine hospitality. Our goal is not just to serve something filling, but to bring the warm, unpretentious, and carefully crafted spirit of retro diner culture to your table.",
    subIntro: isTr
      ? "Bizim için en iyi tarif, misafirlerimizin yüzündeki samimi memnuniyettir."
      : "For us, the best recipe is the sincere satisfaction on our guests’ faces.",
    closing: isTr
      ? "Mutfağımızda özen, kapımızda her zaman samimiyet var; bekleriz."
      : "There is always care in our kitchen and sincerity at our door; you are always welcome.",
    highlights: isTr
      ? [
          {
            number: "01",
            title: "Sıradan Değil, Kaburga Eti",
            text: "Burger köftelerimizde standart karışımlar kullanmıyoruz; lokmanıza lezzetini ve suyunu veren gerçek kaburga etiyle çalışıyoruz.",
            featured: true,
          },
          {
            number: "02",
            title: "Ev Yapımı Soslar",
            text: "Hazır lezzetlerle işimiz yok. Burgerlerimizin ve atıştırmalıklarımızın ruhunu tamamlayan soslarımızı kendi mutfağımızda, kendi tariflerimizle hazırlıyoruz.",
            featured: false,
          },
          {
            number: "03",
            title: "Gerçek Frankfurter",
            text: "Hotdog menümüzde kaliteden taviz vermiyor; doyurucu ve karakterli lezzetiyle fark yaratan ithal frankfurter sosis kullanıyoruz.",
            featured: false,
          },
          {
            number: "04",
            title: "Kesintisiz Tazelik",
            text: "Sebzelerimizi rafta bekletmiyor; mutfağımızın temposuna göre gün içinde kısa aralıklarla yenileyerek her siparişte tazeliği koruyoruz.",
            featured: false,
          },
        ]
      : [
          {
            number: "01",
            title: "Not Ordinary, Rib Meat",
            text: "We do not use standard mixtures in our burger patties; we work with real rib meat that brings both flavor and juiciness to every bite.",
            featured: true,
          },
          {
            number: "02",
            title: "Homemade Sauces",
            text: "We do not rely on ready-made flavors. The sauces that complete our burgers and snacks are prepared in our own kitchen, with our own recipes.",
            featured: false,
          },
          {
            number: "03",
            title: "Real Frankfurter",
            text: "We do not compromise on quality in our hotdog menu; we use imported frankfurter sausages that bring a classic, satisfying character.",
            featured: false,
          },
          {
            number: "04",
            title: "Constant Freshness",
            text: "Our vegetables do not sit around waiting. We refresh them frequently throughout the day to match the rhythm of the kitchen.",
            featured: false,
          },
        ],
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Soft background ornament */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-bl-full bg-secondary/5 md:h-80 md:w-80"
        aria-hidden="true"
      />

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-16">
          {/* LEFT / INTRO */}
          <div className="min-w-0">
            <div className="inline-flex items-center gap-3">
              <span className="h-[3px] w-10 rounded-full bg-primary" />
              <span className="font-display text-xs font-extrabold uppercase tracking-[0.22em] text-primary sm:text-sm">
                {content.eyebrow}
              </span>
            </div>

            <h1 className="mt-6 max-w-4xl font-display text-4xl font-black leading-[0.96] tracking-tighter text-on_surface sm:text-5xl lg:text-6xl xl:text-[4.5rem]">
              {content.headlineTop}{" "}
              <span className="text-primary italic">{content.headlineAccent}</span>
              <br className="hidden md:block" /> {content.headlineBottom}
            </h1>

            <div className="mt-8 max-w-2xl space-y-5">
              <p className="font-[family:var(--font-manrope)] text-base leading-8 text-on_surface/78 sm:text-lg">
                {content.intro}
              </p>
              <p className="font-[family:var(--font-manrope)] text-base leading-8 text-on_surface/78 sm:text-lg">
                {content.subIntro}
              </p>
            </div>

            {/* Divider */}
            <div className="my-4 h-[6px] w-full max-w-xl opacity-90" />

            {/* Closing statement */}
            <div className="max-w-2xl rounded-[2rem] border border-on_surface/8 bg-surface_container_low px-6 py-5 shadow-[4px_4px_16px_rgba(30,28,16,0.06)]">
              <p className="font-display text-xl font-bold leading-snug text-on_surface sm:text-2xl">
                {isTr ? (
                  <>
                    Mutfağımızda <span className="text-secondary">özen</span>,
                    kapımızda her zaman <span className="text-secondary">samimiyet</span> var; bekleriz.
                  </>
                ) : (
                  <>
                    There is <span className="text-secondary">care</span> in our
                    kitchen and <span className="text-secondary">sincerity</span> at
                    our door; you are always welcome.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* RIGHT / HIGHLIGHTS */}
          <div className="min-w-0">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
              {content.highlights.map((item) => {
                const isFeatured = item.featured;

                return (
                  <article
                    key={item.number}
                    className={`relative min-w-0 overflow-hidden rounded-[2rem] p-6 md:p-8 ${
                      isFeatured
                        ? "bg-primary text-background shadow-[10px_10px_24px_rgba(30,28,16,0.10)]"
                        : "border border-on_surface/8 bg-surface_container_low text-on_surface shadow-[4px_4px_16px_rgba(30,28,16,0.05)]"
                    }`}
                  >
                    {isFeatured && (
                      <div
                        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"
                        aria-hidden="true"
                      />
                    )}

                    <div
                      className={`mb-6 flex h-12 w-12 items-center justify-center rounded-full font-display text-lg font-black ${
                        isFeatured
                          ? "bg-background text-primary"
                          : "bg-surface_container_highest text-primary"
                      }`}
                    >
                      {item.number}
                    </div>

                    <h2 className="max-w-[16ch] font-display text-2xl font-black leading-tight tracking-tight sm:text-[2rem]">
                      {item.title}
                    </h2>

                    <p
                      className={`mt-4 font-[family:var(--font-manrope)] text-base leading-8 ${
                        isFeatured ? "text-background/90" : "text-on_surface/72"
                      }`}
                    >
                      {item.text}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}