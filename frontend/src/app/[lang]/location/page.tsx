export default function LocationPage({ params: { lang } }: { params: { lang: "tr" | "en" } }) {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="font-display font-extrabold text-6xl uppercase tracking-tighter mb-8">
        {lang === "tr" ? "KONUM" : "LOCATION"}
      </h1>
      <p className="text-on_surface/60 max-w-xl mx-auto italic">
        {lang === "tr" 
          ? "Bizi ziyaret edin. Marmaris'in en lezzetli köşesinde sizi bekliyoruz."
          : "Visit us. We are waiting for you in the most delicious corner of Marmaris."}
      </p>
    </div>
  );
}
