"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Ilan = {
  id: string;
  baslik: string;
  aciklama: string;
  fiyat: number;
  kategori: string;
  sehir: string;
  ilce: string | null;
  fotograflar: string[] | null;
  created_at?: string;
};

export default function IlanlarPage() {
  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");

  useEffect(() => {
    ilanlariGetir();
  }, []);

  async function ilanlariGetir() {
    setYukleniyor(true);
    setHata("");

    const { data, error } = await supabase
      .from("ilanlar")
      .select(
        "id, baslik, aciklama, fiyat, kategori, sehir, ilce, fotograflar, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setHata("İlanlar yüklenirken bir hata oluştu.");
      setYukleniyor(false);
      return;
    }

    setIlanlar(data ?? []);
    setYukleniyor(false);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link href="/" className="text-2xl font-black text-emerald-700">
            AL-SAT AI
          </Link>

          <Link
            href="/ilan-ver"
            className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white"
          >
            + İlan Ver
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">
            Tüm İlanlar
          </h1>

          <p className="mt-2 text-slate-500">
            Yayındaki ilanları inceleyin.
          </p>
        </div>

        {yukleniyor && (
          <div className="rounded-2xl bg-white p-8 text-center shadow">
            İlanlar yükleniyor...
          </div>
        )}

        {hata && (
          <div className="rounded-2xl bg-red-50 p-6 text-red-700">
            {hata}
          </div>
        )}

        {!yukleniyor && !hata && ilanlar.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow">
            <div className="text-5xl">📭</div>

            <h2 className="mt-4 text-xl font-black text-slate-900">
              Henüz ilan bulunmuyor
            </h2>

            <p className="mt-2 text-slate-500">
              İlk ilanı siz yayınlayabilirsiniz.
            </p>

            <Link
              href="/ilan-ver"
              className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white"
            >
              İlan Oluştur
            </Link>
          </div>
        )}

        {!yukleniyor && ilanlar.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ilanlar.map((ilan) => {
              const kapakFotografi =
                ilan.fotograflar && ilan.fotograflar.length > 0
                  ? ilan.fotograflar[0]
                  : null;

              return (
                <Link
                  href={`/ilan/${ilan.id}`}
                  key={ilan.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="h-56 bg-slate-200">
                    {kapakFotografi ? (
                      <img
                        src={kapakFotografi}
                        alt={ilan.baslik}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl">
                        📷
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      {ilan.kategori}
                    </span>

                    <h2 className="mt-3 line-clamp-2 text-lg font-black text-slate-900">
                      {ilan.baslik}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      📍 {ilan.ilce ? `${ilan.ilce}, ` : ""}
                      {ilan.sehir}
                    </p>

                    <div className="mt-5 text-xl font-black text-emerald-700">
                      {Number(ilan.fiyat).toLocaleString("tr-TR")} TL
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}