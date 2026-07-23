"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Ilan = {
  id: string;
  baslik: string;
  aciklama: string | null;
  fiyat: number;
  kategori: string;
  sehir: string;
  ilce: string | null;
  fotograflar: string[] | null;
  telefon?: string | null;
  created_at?: string;
};

export default function IlanDetayPage() {
  const params = useParams();
  const router = useRouter();
  const ilanId = params.id as string;

  const [ilan, setIlan] = useState<Ilan | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [aktifFotograf, setAktifFotograf] = useState(0);
  const [telefonAcik, setTelefonAcik] = useState(false);
  const [favori, setFavori] = useState(false);
  const [favoriIslemi, setFavoriIslemi] = useState(false);

  useEffect(() => {
    async function ilaniGetir() {
      if (!ilanId) return;

      setYukleniyor(true);
      setHata("");

      const { data, error } = await supabase
        .from("ilanlar")
        .select("*")
        .eq("id", ilanId)
        .single();

      if (error) {
        console.error(error);
        setHata("İlan yüklenirken bir hata oluştu.");
        setYukleniyor(false);
        return;
      }

      setIlan(data);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: favoriKaydi, error: favoriHatasi } = await supabase
          .from("favoriler")
          .select("ilan_id")
          .eq("kullanici_id", user.id)
          .eq("ilan_id", ilanId)
          .maybeSingle();

        if (favoriHatasi) {
          console.error(favoriHatasi);
        } else {
          setFavori(Boolean(favoriKaydi));
        }
      }

      setYukleniyor(false);
    }

    ilaniGetir();
  }, [ilanId]);

  function oncekiFotograf() {
    if (!ilan?.fotograflar?.length) return;

    setAktifFotograf((mevcut) =>
      mevcut === 0 ? ilan.fotograflar!.length - 1 : mevcut - 1
    );
  }

  function sonrakiFotograf() {
    if (!ilan?.fotograflar?.length) return;

    setAktifFotograf((mevcut) =>
      mevcut === ilan.fotograflar!.length - 1 ? 0 : mevcut + 1
    );
  }

  async function ilaniPaylas() {
    const paylasimBilgisi = {
      title: ilan?.baslik ?? "AL-SAT AI ilanı",
      text: ilan?.baslik ?? "Bu ilana göz atın.",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(paylasimBilgisi);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("İlan bağlantısı kopyalandı.");
      }
    } catch {
      // Kullanıcı paylaşım penceresini kapatırsa işlem yapılmaz.
    }
  }

  async function favoriyiDegistir() {
    if (!ilan || favoriIslemi) return;

    setFavoriIslemi(true);

    const {
      data: { user },
      error: kullaniciHatasi,
    } = await supabase.auth.getUser();

    if (kullaniciHatasi || !user) {
      setFavoriIslemi(false);
      alert("Favorilere eklemek için giriş yapmalısınız.");
      router.push("/giris");
      return;
    }

    if (favori) {
      const { error } = await supabase
        .from("favoriler")
        .delete()
        .eq("kullanici_id", user.id)
        .eq("ilan_id", ilan.id);

      if (error) {
        console.error(error);
        alert("Favori kaldırılamadı: " + error.message);
      } else {
        setFavori(false);
        alert("İlan favorilerden çıkarıldı.");
      }
    } else {
      const { error } = await supabase.from("favoriler").insert({
        kullanici_id: user.id,
        ilan_id: ilan.id,
      });

      if (error) {
        console.error(error);

        if (error.code === "23505") {
          setFavori(true);
        } else {
          alert("İlan favorilere eklenemedi: " + error.message);
        }
      } else {
        setFavori(true);
        alert("İlan favorilere eklendi.");
      }
    }

    setFavoriIslemi(false);
  }

  if (yukleniyor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white p-8 font-semibold shadow-sm">
          İlan yükleniyor...
        </div>
      </main>
    );
  }

  if (hata || !ilan) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">🔍</div>

          <h1 className="mt-4 text-2xl font-black text-slate-900">
            İlan bulunamadı
          </h1>

          <p className="mt-2 text-slate-500">
            İlan kaldırılmış veya bağlantı geçersiz olabilir.
          </p>

          <Link
            href="/ilan"
            className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white"
          >
            İlanlara Dön
          </Link>
        </div>
      </main>
    );
  }

  const fotograflar = ilan.fotograflar ?? [];

  const tarih = ilan.created_at
    ? new Date(ilan.created_at).toLocaleDateString("tr-TR")
    : "Belirtilmedi";

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="text-2xl font-black text-emerald-700">
            AL-SAT AI
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/ilan"
              className="hidden font-bold text-slate-600 hover:text-emerald-600 sm:block"
            >
              İlanlar
            </Link>

            <Link
              href="/ilan-ver"
              className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700"
            >
              + İlan Ver
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-emerald-600">
            Ana Sayfa
          </Link>

          <span>›</span>

          <Link href="/ilan" className="hover:text-emerald-600">
            İlanlar
          </Link>

          <span>›</span>
          <span>{ilan.kategori}</span>
          <span>›</span>

          <span className="font-semibold text-slate-800">
            {ilan.baslik}
          </span>
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                {fotograflar.length > 0 ? (
                  <img
                    src={fotograflar[aktifFotograf]}
                    alt={ilan.baslik}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-8xl">
                    📷
                  </div>
                )}

                {fotograflar.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={oncekiFotograf}
                      aria-label="Önceki fotoğraf"
                      className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-3xl font-bold shadow-lg hover:bg-white"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      onClick={sonrakiFotograf}
                      aria-label="Sonraki fotoğraf"
                      className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-3xl font-bold shadow-lg hover:bg-white"
                    >
                      ›
                    </button>

                    <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white">
                      {aktifFotograf + 1} / {fotograflar.length}
                    </div>
                  </>
                )}
              </div>

              {fotograflar.length > 1 && (
                <div className="grid grid-cols-4 gap-3 p-4">
                  {fotograflar.map((fotograf, index) => (
                    <button
                      key={`${fotograf}-${index}`}
                      type="button"
                      onClick={() => setAktifFotograf(index)}
                      className={`overflow-hidden rounded-xl border-2 transition ${
                        aktifFotograf === index
                          ? "border-emerald-500"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={fotograf}
                        alt={`${ilan.baslik} ${index + 1}`}
                        className="aspect-[4/3] h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                {ilan.kategori}
              </span>

              <h1 className="mt-4 text-2xl font-black sm:text-3xl">
                {ilan.baslik}
              </h1>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>
                  📍 {ilan.ilce ? `${ilan.ilce}, ` : ""}
                  {ilan.sehir}
                </span>

                <span>📅 {tarih}</span>
                <span>İlan No: {ilan.id}</span>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">İlan açıklaması</h2>

              <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">
                {ilan.aciklama || "Bu ilan için açıklama girilmemiş."}
              </p>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Satış fiyatı</p>

              <p className="mt-2 text-3xl font-black text-emerald-700">
                {Number(ilan.fiyat).toLocaleString("tr-TR")} TL
              </p>

              <div className="mt-6 space-y-3">
                {ilan.telefon ? (
                  <button
                    type="button"
                    onClick={() => setTelefonAcik(!telefonAcik)}
                    className="w-full rounded-xl bg-emerald-600 px-5 py-4 font-bold text-white hover:bg-emerald-700"
                  >
                    {telefonAcik ? ilan.telefon : "☎ Telefonu Göster"}
                  </button>
                ) : (
                  <div className="rounded-xl bg-slate-100 px-5 py-4 text-center text-sm text-slate-500">
                    Telefon numarası belirtilmemiş
                  </div>
                )}

                <button
                  type="button"
                  onClick={favoriyiDegistir}
                  disabled={favoriIslemi}
                  className={`w-full rounded-xl border px-5 py-4 font-bold transition ${
                    favori
                      ? "border-rose-300 bg-rose-50 text-rose-600"
                      : "border-slate-200 text-slate-700 hover:border-rose-300"
                  } ${favoriIslemi ? "cursor-wait opacity-60" : ""}`}
                >
                  {favoriIslemi
                    ? "İşleniyor..."
                    : favori
                      ? "♥ Favorilerde"
                      : "♡ Favorilere Ekle"}
                </button>

                <button
                  type="button"
                  onClick={ilaniPaylas}
                  className="w-full rounded-xl border border-slate-200 px-5 py-4 font-bold text-slate-700 hover:border-emerald-400"
                >
                  ↗ İlanı Paylaş
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Konum</h2>

              <p className="mt-3 text-slate-600">
                📍 {ilan.ilce ? `${ilan.ilce}, ` : ""}
                {ilan.sehir}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}