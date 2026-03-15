import Image from "next/image";

export default function Footer({ lang }: { lang: "tr" | "en" }) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-surface_container_highest pt-16 pb-8 border-t border-on_surface/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Info */}
          <div>
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
            <p className="text-on_surface/60 text-sm max-w-xs">
              {lang === "tr" 
                ? "Retro diner ruhuyla hazırlanan, yerel ve taze malzemelerle sunulan modern gurme burgerler."
                : "Modern gourmet burgers prepared with a retro diner spirit, served with local and fresh ingredients."}
            </p>
          </div>

          {/* Location / Hours */}
          <div>
            <h4 className="font-display font-bold uppercase mb-6 text-sm tracking-widest">
              {lang === "tr" ? "Çalışma Saatleri" : "Opening Hours"}
            </h4>
            <p className="text-on_surface/60 text-sm mb-2">
              {lang === "tr" ? "Hafta içi: 11:30 – 22:00" : "Weekdays: 11:30 – 22:00"}
            </p>
            <p className="text-on_surface/60 text-sm">
              {lang === "tr" ? "Hafta sonu: 12:00 – 23:00" : "Weekends: 12:00 – 23:00"}
            </p>
          </div>

          {/* Social / Contact */}
          <div>
            <h4 className="font-display font-bold uppercase mb-6 text-sm tracking-widest">
              {lang === "tr" ? "İletişim" : "Contact"}
            </h4>
            <p className="text-on_surface/60 text-sm mb-2">info@aradaburger.com</p>
            <p className="text-on_surface/60 text-sm">@aradaburger</p>
          </div>
        </div>

        <div className="checkerboard mb-8 opacity-10"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold uppercase tracking-widest opacity-40">
          <p>© {currentYear} Arada Burger. {lang === "tr" ? "Tüm Hakları Saklıdır." : "All Rights Reserved."}</p>
          <div className="flex gap-6">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
