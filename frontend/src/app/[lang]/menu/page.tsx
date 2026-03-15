export default function MenuPage({ params: { lang } }: { params: { lang: "tr" | "en" } }) {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="font-display font-extrabold text-6xl uppercase tracking-tighter mb-8">
        {lang === "tr" ? "MENÜ" : "MENU"}
      </h1>
      <p className="text-on_surface/60 max-w-xl mx-auto italic">
        {lang === "tr" 
          ? "Yakında burada tam dijital menümüzü göreceksiniz. Şimdilik öne çıkanlar için ana sayfaya göz atın."
          : "Soon you will see our full digital menu here. For now, check the home page for highlights."}
      </p>
    </div>
  );
}
