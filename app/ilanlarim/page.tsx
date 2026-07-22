"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Ilan = {
  id: string;
  baslik: string;
  aciklama: string | null;
  fiyat: number;
  kategori: string;
  sehir: string;
  ilce: string | null;
  fotograflar: string[] | null;
  created_at: string;
};

export default function IlanlarimPage() {
  const router = useRouter();

  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [silinenId, setSilinenId] = useState<string | null>(null);
  const [hata, setHata] = useState("");

  useEffect(() => {
    ilanlariGetir();
  }, []);

  async function ilanlariGetir() {
    setYukleniyor(true);
    setHata("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("İlanlarınızı görmek için giriş yapmalısınız.");
      router.replace("/giris");
      return;
    }

    const { data, error } = await supabase
      .from("ilanlar")
      .select(
        "id, baslik, aciklama, fiyat, kategori, sehir, ilce, fotograflar, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setHata("İlanlar alınamadı: " + error.message);
      setYukleniyor(false);
      return;
    }

    setIlanlar((data as Ilan[]) || []);
    setYukleniyor(false);
  }

  async function ilanSil(id: string) {
    const onay = window.confirm(
      "Bu ilanı silmek istediğinizden emin misiniz?"
    );

    if (!onay) return;

    setSilinenId(id);

    const { error } = await supabase
      .from("ilanlar")
      .delete()
      .eq("id", id);

    if (error) {
      alert("İlan silinemedi: " + error.message);
      setSilinenId(null);
      return;
    }

    setIlanlar((onceki) => onceki.filter((ilan) => ilan.id !== id));
    setSilinenId(null);
    alert("İlan başarıyla silindi.");
  }

  function fiyatYaz(fiyat: number) {
    return new Intl.NumberFormat("tr-TR").format(Number(fiyat));
  }

  if (yukleniyor) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-lg font-bold text-slate-700">
          İlanlarınız yükleniyor...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-black text-blue-600">
            AL-SAT AI
          </Link>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-xl border px-5 py-3 font-bold text-slate-700"
            >
              Ana Sayfa
            </Link>

            <Link
              href="/ilan-ver"
              className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
            >
              + Yeni İlan Ver
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">
            Benim İlanlarım
          </h1>

          <p className="mt-2 text-slate-600">
            Yayındaki ilanlarınızı buradan görüntüleyebilir, düzenleyebilir ve
            silebilirsiniz.
          </p>
        </div>

        {hata && (
          <div className="mb-6 rounded-xl bg-red-100 p-4 font-semibold text-red-700">
            {hata}
          </div>
        )}

        {!hata && ilanlar.length === 0 && (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <p className="text-xl font-black text-slate-800">
              Henüz ilanınız bulunmuyor.
            </p>

            <Link
              href="/ilan-ver"
              className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
            >
              İlk İlanını Ver
            </Link>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ilanlar.map((ilan) => (
            <article
              key={ilan.id}
              className="overflow-hidden rounded-3xl bg-white shadow-sm"
            >
              <div className="h-56 bg-slate-200">
                {ilan.fotograflar?.[0] ? (
                  <img
                    src={ilan.fotograflar[0]}
                    alt={ilan.baslik}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500">
                    Fotoğraf yok
                  </div>
                )}
              </div>

              <div className="p-6">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  {ilan.kategori}
                </span>

                <h2 className="mt-4 text-xl font-black text-slate-900">
                  {ilan.baslik}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {ilan.sehir}
                  {ilan.ilce ? ` / ${ilan.ilce}` : ""}
                </p>

                <p className="mt-4 text-2xl font-black text-blue-600">
                  {fiyatYaz(ilan.fiyat)} TL
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Link
                    href={`/ilan/${ilan.id}`}
                    className="rounded-xl bg-slate-900 px-4 py-3 text-center font-bold text-white"
                  >
                    Görüntüle
                  </Link>

                  <Link
                    href={`/ilan-duzenle/${ilan.id}`}
                    className="rounded-xl bg-amber-500 px-4 py-3 text-center font-bold text-white"
                  >
                    Düzenle
                  </Link>

                  <button
                    type="button"
                    onClick={() => ilanSil(ilan.id)}
                    disabled={silinenId === ilan.id}
                    className="col-span-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                  >
                    {silinenId === ilan.id ? "Siliniyor..." : "İlanı Sil"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}