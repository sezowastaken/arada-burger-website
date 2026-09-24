import { notFound } from "next/navigation";

/**
 * Short, plain-language notice about the site's own analytics — not a full
 * KVKK/GDPR policy (there is no login, no payment, no data sale to make one
 * necessary yet), but enough that a visitor can see exactly what is and is
 * not collected. See `backend/src/db/schema.ts` for the technical version of
 * the same rules.
 */
export default async function PrivacyPage({
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
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-black uppercase tracking-tighter text-on_surface md:text-4xl">
        {isTR ? "Gizlilik" : "Privacy"}
      </h1>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-on_surface/75">
        <p>
          {isTR
            ? "Bu site, hangi ürünlerin ilgi gördüğünü anlayabilmek için ziyaretlerle ilgili anonim, kişiselleştirilmemiş bazı bilgiler toplar. Amaç sadece menümüzü geliştirmektir — kimseyi tanımlamak ya da izlemek değil."
            : "This site records some anonymous, non-personal information about visits, so we can understand which products get looked at. The purpose is entirely to improve our menu — never to identify or track anyone."}
        </p>

        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-on_surface">
            {isTR ? "Ne topluyoruz" : "What we collect"}
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              {isTR
                ? "Hangi sayfaların görüntülendiği ve hangi ürün/kategorilere tıklandığı."
                : "Which pages are viewed and which products/categories are clicked."}
            </li>
            <li>
              {isTR
                ? "Kaba bir cihaz türü (telefon / tablet / masaüstü)."
                : "A rough device type (phone / tablet / desktop)."}
            </li>
            <li>
              {isTR
                ? "Bize hangi siteden geldiğiniz (yalnızca alan adı, örn. \"google.com\")."
                : "Which site referred you here (just the domain, e.g. \"google.com\")."}
            </li>
            <li>
              {isTR
                ? "Rastgele, tarayıcı sekmesi kapanınca silinen geçici bir oturum kimliği."
                : "A random, temporary session id that is deleted when the browser tab closes."}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-on_surface">
            {isTR ? "Ne toplamıyoruz" : "What we don't collect"}
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>{isTR ? "IP adresiniz." : "Your IP address."}</li>
            <li>{isTR ? "Ad, e-posta, telefon gibi kimlik bilgileri." : "Your name, email, phone, or any identity."}</li>
            <li>
              {isTR
                ? "Sizi farklı ziyaretlerde ya da farklı sitelerde takip eden bir çerez."
                : "A cookie that tracks you across visits or across other sites."}
            </li>
          </ul>
        </div>

        <p>
          {isTR ? (
            <>
              Sorularınız için <a className="underline" href="mailto:info@aradaburger.com">info@aradaburger.com</a> adresinden
              bize ulaşabilirsiniz.
            </>
          ) : (
            <>
              Questions? Reach us at{" "}
              <a className="underline" href="mailto:info@aradaburger.com">info@aradaburger.com</a>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
