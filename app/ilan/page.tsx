"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import { supabase } from "../../lib/supabase";

type Ilan = {
  id: string;
  user_id: string;
  baslik: string;
  aciklama: string | null;
  fiyat: number;
  kategori: string;
  sehir: string;
  ilce: string | null;
  fotograflar: string[] | null;
  created_at: string;
};

type Siralama = "yeni" | "fiyat-artan" | "fiyat-azalan";

const kategoriler = [
  "Emlak",
  "Vasıta",
  "Motosiklet",
  "Yedek Parça",
  "İkinci El",
  "İş İlanları",
  "Hizmetler",
  "Hayvanlar",
];

const sehirler = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Kocaeli",
  "Adana",
  "Konya",
  "Gaziantep",
  "Mersin",
];

function metniKucult(deger: string | null | undefined) {
  return (deger || "").toLocaleLowerCase("tr-TR").trim();
}

function fiyatYaz(fiyat: number) {
  return new Intl.NumberFormat("tr-TR").format(Number(fiyat) || 0);
}

function tarihYaz(tarih: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(tarih));
}

export default function IlanlarPage() {
  const router = useRouter();

  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");

  const [arama, setArama] = useState("");
  const [kategori, setKategori] = useState("");
  const [sehir, setSehir] = useState("");
  const [enDusukFiyat, setEnDusukFiyat] = useState("");
  const [enYuksekFiyat, setEnYuksekFiyat] = useState("");
  const [siralama, setSiralama] = useState<Siralama>("yeni");

  const [kullaniciId, setKullaniciId] = useState<string | null>(null);
  const [favoriler, setFavoriler] = useState<Set<string>>(new Set());
  const [favoriIslemiId, setFavoriIslemiId] = useState<string | null>(null);

  useEffect(() => {
    const adresParametreleri = new URLSearchParams(window.location.search);

    setArama(adresParametreleri.get("arama") || "");
    setKategori(adresParametreleri.get("kategori") || "");
    setSehir(adresParametreleri.get("sehir") || "");

    async function sayfayiHazirla() {
      setYukleniyor(true);
      setHata("");

      const { data: ilanVerisi, error: ilanHatasi } = await supabase
        .from("ilanlar")
        .select(
          "id, user_id, baslik, aciklama, fiyat, kategori, sehir, ilce, fotograflar, created_at"
        )
        .order("created_at", { ascending: false });

      if (ilanHatasi) {
        console.error(ilanHatasi);
        setHata("İlanlar alınamadı: " + ilanHatasi.message);
        setYukleniyor(false);
        return;
      }

      setIlanlar((ilanVerisi as Ilan[]) || []);

      const {
        data: { user },
        error: kullaniciHatasi,
      } = await supabase.auth.getUser();

      if (!kullaniciHatasi && user) {
        setKullaniciId(user.id);

        const { data: favoriVerisi, error: favoriHatasi } = await supabase
          .from("favoriler")
          .select("ilan_id")
          .eq("kullanici_id", user.id);

        if (favoriHatasi) {
          console.error(favoriHatasi);
        } else {
          setFavoriler(
            new Set(
              (favoriVerisi || []).map((kayit) => String(kayit.ilan_id))
            )
          );
        }
      } else {
        setKullaniciId(null);
        setFavoriler(new Set());
      }

      setYukleniyor(false);
    }

    sayfayiHazirla();
  }, []);

  const kullanilanKategoriler = useMemo(() => {
    const tumKategoriler = new Set(kategoriler);
    ilanlar.forEach((ilan) => tumKategoriler.add(ilan.kategori));
    return Array.from(tumKategoriler).filter(Boolean);
  }, [ilanlar]);

  const kullanilanSehirler = useMemo(() => {
    const tumSehirler = new Set(sehirler);
    ilanlar.forEach((ilan) => tumSehirler.add(ilan.sehir));
    return Array.from(tumSehirler).filter(Boolean);
  }, [ilanlar]);

  const gorunenIlanlar = useMemo(() => {
    const arananMetin = metniKucult(arama);
    const altSinir = enDusukFiyat ? Number(enDusukFiyat) : null;
    const ustSinir = enYuksekFiyat ? Number(enYuksekFiyat) : null;

    const filtrelenmis = ilanlar.filter((ilan) => {
      const aranacakAlan = metniKucult(
        `${ilan.baslik} ${ilan.aciklama || ""} ${ilan.kategori} ${ilan.sehir} ${
          ilan.ilce || ""
        }`
      );

      const aramaUyuyor = !arananMetin || aranacakAlan.includes(arananMetin);
      const kategoriUyuyor = !kategori || ilan.kategori === kategori;
      const sehirUyuyor = !sehir || ilan.sehir === sehir;
      const altFiyatUyuyor = altSinir === null || Number(ilan.fiyat) >= altSinir;
      const ustFiyatUyuyor = ustSinir === null || Number(ilan.fiyat) <= ustSinir;

      return (
        aramaUyuyor &&
        kategoriUyuyor &&
        sehirUyuyor &&
        altFiyatUyuyor &&
        ustFiyatUyuyor
      );
    });

    return [...filtrelenmis].sort((a, b) => {
      if (siralama === "fiyat-artan") {
        return Number(a.fiyat) - Number(b.fiyat);
      }

      if (siralama === "fiyat-azalan") {
        return Number(b.fiyat) - Number(a.fiyat);
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [
    ilanlar,
    arama,
    kategori,
    sehir,
    enDusukFiyat,
    enYuksekFiyat,
    siralama,
  ]);

  function filtreleriTemizle() {
    setArama("");
    setKategori("");
    setSehir("");
    setEnDusukFiyat("");
    setEnYuksekFiyat("");
    setSiralama("yeni");

    window.history.replaceState({}, "", "/ilan");
  }

  async function favoriyiDegistir(
    event: MouseEvent<HTMLButtonElement>,
    ilanId: string
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (favoriIslemiId) return;

    if (!kullaniciId) {
      alert("Favorilere eklemek için giriş yapmalısınız.");
      router.push("/giris");
      return;
    }

    setFavoriIslemiId(ilanId);
    const favorideMi = favoriler.has(String(ilanId));

    if (favorideMi) {
      const { error } = await supabase
        .from("favoriler")
        .delete()
        .eq("kullanici_id", kullaniciId)
        .eq("ilan_id", ilanId);

      if (error) {
        console.error(error);
        alert("İlan favorilerden çıkarılamadı: " + error.message);
      } else {
        setFavoriler((onceki) => {
          const yeniFavoriler = new Set(onceki);
          yeniFavoriler.delete(String(ilanId));
          return yeniFavoriler;
        });
      }
    } else {
      const { error } = await supabase.from("favoriler").insert({
        kullanici_id: kullaniciId,
        ilan_id: ilanId,
      });

      if (error && error.code !== "23505") {
        console.error(error);
        alert("İlan favorilere eklenemedi: " + error.message);
      } else {
        setFavoriler((onceki) => {
          const yeniFavoriler = new Set(onceki);
          yeniFavoriler.add(String(ilanId));
          return yeniFavoriler;
        });
      }
    }

    setFavoriIslemiId(null);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/" className="text-2xl font-black text-emerald-700">
            AL-SAT AI
          </Link>

          <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link
              href="/"
              className="rounded-xl px-4 py-3 font-bold text-slate-600 hover:bg-slate-100"
            >
              Ana Sayfa
            </Link>

            {kullaniciId ? (
              <>
                <Link
                  href="/mesajlarim"
                  className="rounded-xl px-4 py-3 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Mesajlarım
                </Link>

                <Link
                  href="/favorilerim"
                  className="rounded-xl px-4 py-3 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Favorilerim
                </Link>

                <Link
                  href="/ilanlarim"
                  className="rounded-xl px-4 py-3 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Benim İlanlarım
                </Link>
              </>
            ) : (
              <Link
                href="/giris"
                className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
              >
                Giriş Yap
              </Link>
            )}

            <Link
              href="/ilan-ver"
              className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700"
            >
              + İlan Ver
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
            AL-SAT AI İlanları
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Aradığınız ilanı kolayca bulun
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Arama ve filtreleri kullanın, ilan ayrıntılarını inceleyin veya
            beğendiğiniz ilanları favorilerinize ekleyin.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="md:col-span-2 lg:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                İlan ara
              </span>

              <input
                value={arama}
                onChange={(event) => setArama(event.target.value)}
                placeholder="Ev, araba, telefon veya ilan başlığı..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Kategori
              </span>

              <select
                value={kategori}
                onChange={(event) => setKategori(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              >
                <option value="">Tüm kategoriler</option>
                {kullanilanKategoriler.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Şehir
              </span>

              <select
                value={sehir}
                onChange={(event) => setSehir(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              >
                <option value="">Tüm Türkiye</option>
                {kullanilanSehirler.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                En düşük fiyat
              </span>

              <input
                type="number"
                min="0"
                value={enDusukFiyat}
                onChange={(event) => setEnDusukFiyat(event.target.value)}
                placeholder="0 TL"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                En yüksek fiyat
              </span>

              <input
                type="number"
                min="0"
                value={enYuksekFiyat}
                onChange={(event) => setEnYuksekFiyat(event.target.value)}
                placeholder="Sınırsız"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Sıralama
              </span>

              <select
                value={siralama}
                onChange={(event) => setSiralama(event.target.value as Siralama)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              >
                <option value="yeni">En yeni ilanlar</option>
                <option value="fiyat-artan">Fiyat: düşükten yükseğe</option>
                <option value="fiyat-azalan">Fiyat: yüksekten düşüğe</option>
              </select>
            </label>

            <button
              type="button"
              onClick={filtreleriTemizle}
              className="self-end rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>

        <div className="mb-5 mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">İlanlar</h2>

          <p className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm">
            {gorunenIlanlar.length} ilan bulundu
          </p>
        </div>

        {yukleniyor && (
          <div className="rounded-3xl bg-white p-12 text-center font-bold text-slate-600 shadow-sm">
            İlanlar yükleniyor...
          </div>
        )}

        {!yukleniyor && hata && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-bold text-red-700">{hata}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-red-600 px-5 py-3 font-bold text-white"
            >
              Yeniden Dene
            </button>
          </div>
        )}

        {!yukleniyor && !hata && gorunenIlanlar.length === 0 && (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">🔍</div>
            <h3 className="mt-4 text-xl font-black">Uygun ilan bulunamadı</h3>
            <p className="mt-2 text-slate-500">
              Arama kelimesini veya filtreleri değiştirmeyi deneyin.
            </p>

            <button
              type="button"
              onClick={filtreleriTemizle}
              className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white"
            >
              Tüm İlanları Göster
            </button>
          </div>
        )}

        {!yukleniyor && !hata && gorunenIlanlar.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gorunenIlanlar.map((ilan) => {
              const ilanId = String(ilan.id);
              const favorideMi = favoriler.has(ilanId);
              const fotograf = ilan.fotograflar?.[0];

              return (
                <article
                  key={ilanId}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <Link href={`/ilan/${ilanId}`} className="block">
                    <div className="relative h-60 overflow-hidden bg-slate-200">
                      {fotograf ? (
                        <img
                          src={fotograf}
                          alt={ilan.baslik}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-6xl">
                          📷
                        </div>
                      )}

                      <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
                        {ilan.kategori}
                      </span>
                    </div>

                    <div className="p-6">
                      <h3 className="line-clamp-2 min-h-[3.5rem] text-xl font-black text-slate-900">
                        {ilan.baslik}
                      </h3>

                      <p className="mt-3 text-sm text-slate-500">
                        📍 {ilan.ilce ? `${ilan.ilce}, ` : ""}
                        {ilan.sehir}
                      </p>

                      <p className="mt-4 text-2xl font-black text-emerald-700">
                        {fiyatYaz(ilan.fiyat)} TL
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                        <span>{tarihYaz(ilan.created_at)}</span>
                        <span className="font-bold text-slate-600">İncele →</span>
                      </div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={(event) => favoriyiDegistir(event, ilanId)}
                    disabled={favoriIslemiId === ilanId}
                    aria-label={
                      favorideMi ? "Favorilerden çıkar" : "Favorilere ekle"
                    }
                    className={`absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-lg transition hover:scale-105 disabled:cursor-wait disabled:opacity-60 ${
                      favorideMi ? "text-rose-600" : "text-slate-500"
                    }`}
                  >
                    {favorideMi ? "♥" : "♡"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}