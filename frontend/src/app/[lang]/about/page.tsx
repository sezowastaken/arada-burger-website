export default function AboutPage({ params: { lang } }: { params: { lang: "tr" | "en" } }) {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="font-display font-extrabold text-6xl uppercase tracking-tighter mb-8">
        {lang === "tr" ? "HAKKIMIZDA" : "ABOUT"}
      </h1>
      <p className="text-on_surface/60 max-w-xl mx-auto italic">
        {lang === "tr" 
          ? "Arada Burger, lezzet ve kaliteyi merkeze alan yeni nesil bir burger dükkanıdır."
          : "Arada Burger is a new generation burger shop that centers on taste and quality."}
      </p>
    </div>
  );
}
