import Image from "next/image";

export default function Footer({ lang }: { lang: "tr" | "en" }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface_container_highest pt-8 pb-8 border-t border-on_surface/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {/* Brand Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 mb-6">
              <Image
                src="/brand/logo/logo_background_removed.png"
                alt="Arada Burger Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain grayscale opacity-70"
              />
              <span className="font-display font-extrabold text-xl uppercase tracking-tighter opacity-70">
                Arada Burger
              </span>
            </div>

            <p className="text-on_surface/60 text-sm leading-relaxed max-w-[280px]">
              {lang === "tr"
                ? "Retro diner ruhuyla hazırlanan, yerel ve taze malzemelerle sunulan modern gurme burgerler."
                : "Modern gourmet burgers prepared with a retro diner spirit, served with local and fresh ingredients."}
            </p>
          </div>

          {/* Opening Hours */}
          <div className="flex flex-col items-center text-center">
            <h4 className="font-display font-bold uppercase mb-4 text-sm tracking-widest">
              {lang === "tr" ? "Çalışma Saatleri" : "Opening Hours"}
            </h4>

            <div className="w-fit text-left">
              <p className="text-on_surface/60 text-sm">
              {lang === "tr" ? "Pazartesi: Kapalıyız" : "Monday: Closed"}
            </p>
              <p className="text-on_surface/60 text-sm">
              {lang === "tr" ? "Salı: 12:00 – 02:00" : "Tuesday: 12:00 – 02:00"}
            </p>
              <p className="text-on_surface/60 text-sm">
              {lang === "tr" ? "Çarşamba: 12:00 – 02:00" : "Wednesday: 12:00 – 02:00"}
            </p>
              <p className="text-on_surface/60 text-sm">
              {lang === "tr" ? "Perşembe: 12:00 – 02:00" : "Thursday: 12:00 – 02:00"}
            </p>
              <p className="text-on_surface/60 text-sm">
              {lang === "tr" ? "Cuma: 12:00 – 02:00" : "Friday: 12:00 – 02:00"}
            </p>
              <p className="text-on_surface/60 text-sm">
              {lang === "tr" ? "Cumartesi: 12:00 – 02:00" : "Saturday: 12:00 – 02:00"}
            </p>
              <p className="text-on_surface/60 text-sm">
              {lang === "tr" ? "Pazar: 12:00 – 02:00" : "Sunday: 12:00 – 02:00"}
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <h4 className="font-display font-bold uppercase mb-6 text-sm tracking-widest">
              {lang === "tr" ? "İletişim" : "Contact"}
            </h4>

            <p className="text-on_surface/60 text-sm mb-2">info@aradaburger.com</p>
            <p className="text-on_surface/60 text-sm">@aradaburger</p>
          </div>
        </div>

        <div className="checkerboard my-8 opacity-10"></div>

        <div className="flex justify-center items-center text-center text-xs font-bold uppercase tracking-widest opacity-40">
          <p>
            © {currentYear} Arada Burger.{" "}
            {lang === "tr" ? "Tüm Hakları Saklıdır." : "All Rights Reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
}
