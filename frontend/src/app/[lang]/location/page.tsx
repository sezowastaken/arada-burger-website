import Image from "next/image";
import { notFound } from "next/navigation";

const MAPS_URL =
  "https://www.google.com/maps/place/Arada+Burger/@36.8521682,28.2616038,17z/data=!3m1!4b1!4m6!3m5!1s0x14bfbd7d7ca72cd9:0x36f7c3ad6b1c9cc1!8m2!3d36.8521682!4d28.2641841!16s%2Fg%2F11lgqk9xtz?entry=ttu&g_ep=EgoyMDI2MDQwOC4wIKXMDSoASAFQAw%3D%3D";

const MAP_EMBED_URL =
  "https://www.google.com/maps?q=36.8521682,28.2641841&z=15&output=embed";

export default async function LocationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (lang !== "tr" && lang !== "en") {
    notFound();
  }

  const isTR = lang === "tr";

  return (
    <div className="flex flex-col pb-20">
      {/* =========================================================
          LOCATION PAGE GUIDE
          ---------------------------------------------------------
          1) SOL / SAĞ ORAN:
             - lg:grid-cols-[minmax(0,0.92fr)_minmax(500px,1.08fr)]

          2) ANA BAŞLIK BOYUTU:
             - text-[clamp(3.2rem,7vw,6.2rem)]

          3) AÇIK ADRES KARTI GENİŞLİĞİ:
             - max-w-[560px]
             - büyütmek için artır, küçültmek için azalt

          4) CTA BUTONU STİLİ:
             - bg-primary, text-white, rounded-full
             - daha butonumsu görünüm için sticker shadow verildi

          5) HARİTA BOYUTU:
             - min-h-[520px]

          6) CHECKER BAND:
             - h-[72px]
         ========================================================= */}

      <section className="relative overflow-hidden pt-10 pb-12 md:pt-12 md:pb-14 lg:pt-8 lg:pb-16">
        <div className="mx-auto w-full max-w-[1380px] px-4 md:px-8 lg:px-10">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(500px,1.08fr)] lg:gap-10 xl:gap-12">
            {/* LEFT CONTENT */}
            <div className="pt-0 text-center lg:pt-2 lg:text-left">
              <div className="mb-5">
                <p className="font-display text-xs font-black uppercase tracking-[0.35em] text-secondary md:text-sm">
                  {isTR ? "MARMARİS" : "MARMARIS"}
                </p>
              </div>

              <h1 className="font-display text-[clamp(3.2rem,7vw,6.2rem)] font-extrabold uppercase tracking-tighter leading-[0.92] text-on_surface">
                {isTR ? "BİZİ BURADA BUL" : "FIND US HERE"}
              </h1>

              {/* Açık adres kartı genişletildi */}
              <div className="mt-8 max-w-[560px] rounded-[1.75rem] bg-background/75 p-5 shadow-[8px_8px_24px_rgba(30,28,16,0.06)] backdrop-blur-sm lg:mx-0 mx-auto">
                <p className="font-display text-[11px] font-black uppercase tracking-[0.28em] text-secondary">
                  {isTR ? "AÇIK KONUM" : "LOCATION"}
                </p>

                <h2 className="mt-3 font-display text-2xl font-extrabold uppercase tracking-tighter text-on_surface md:text-3xl">
                  Arada Burger
                </h2>

                <div className="mt-5 text-left text-base leading-relaxed text-on_surface/75">
                  <p>
                    <span className="font-bold text-on_surface">
                      {isTR ? "Adres:" : "Address:"}
                    </span>{" "}
                    Çıldır, Hasan Işık Cd. No:9, 48000 Marmaris/Muğla
                  </p>
                </div>
              </div>

              {/* CTA artık daha net buton gibi */}
              <div className="mt-5 max-w-[560px] lg:mx-0 mx-auto">
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-4 rounded-full bg-primary px-7 py-5 text-left text-white sticker-shadow transition-all hover:-translate-y-1 hover:shadow-[10px_10px_24px_rgba(30,28,16,0.18)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:scale-105">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 21s-6-5.33-6-11a6 6 0 1 1 12 0c0 5.67-6 11-6 11Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </div>

                  <div>
                    <div className="font-display text-sm font-black uppercase tracking-[0.2em]">
                      {isTR ? "GOOGLE MAPS'TE AÇ" : "OPEN IN GOOGLE MAPS"}
                    </div>
                    <div className="mt-1 text-sm leading-relaxed text-white/85 md:text-[15px]">
                      {isTR
                        ? "Google Maps uygulamasında ya da tarayıcıda anında aç."
                        : "Open instantly in Google Maps app or browser."}
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* RIGHT MAP */}
            <div className="relative">
              <div className="absolute right-2 top-[-1.5rem] z-20 rotate-12 transition-transform duration-300 ease-in-out hover:scale-110 hover:rotate-3 md:right-6 xl:right-8">
                <Image
                  src="/brand/mascots/burger_maskot.png"
                  alt="Burger Mascot"
                  width={170}
                  height={170}
                  className="h-auto w-[95px] drop-shadow-xl md:w-[125px] xl:w-[155px]"
                />
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-on_surface/10 bg-surface_container_low shadow-[10px_10px_30px_rgba(30,28,16,0.10)]">
                <div className="min-h-[520px] p-4 md:p-4">
                  <div className="h-full overflow-hidden rounded-[1.75rem] border border-on_surface/10 bg-background shadow-[6px_6px_18px_rgba(30,28,16,0.08)]">
                    <iframe
                      title="Arada Burger Google Maps"
                      src={MAP_EMBED_URL}
                      width="100%"
                      height="100%"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="min-h-[488px] w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FULL-WIDTH CHECKER BAND
      <section className="relative w-full">
        <div
          className="w-full opacity-85"
          style={{
            height: "72px",
            backgroundImage:
              "conic-gradient(#B20000 90deg, #FFFBF0 90deg 180deg, #B20000 180deg 270deg, #FFFBF0 270deg)",
            backgroundSize: "72px 72px",
          }}
        />
      </section> */}
    </div>
  );
}