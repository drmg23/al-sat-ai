"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Ilan = {
  id: number;
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
  const router = useRouter();

  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [favoriler, setFavoriler] = useState<Set<number>>(new Set());
  const [kullaniciId, setKullaniciId] = useState<string | null>(null);
  const [islemdekiIlan, setIslemdekiIlan] = useState<number | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");

  useEffect(() => {
    sayfayiHazirla();
  }, []);

  async function sayfayiHazirla() {
    setYukleniyor(true);
    setHata("");

    const { data: ilanVerileri, error: ilanHatasi } = await supabase
      .from("ilanlar")
      .select(
        "id, baslik, aciklama, fiyat, kategori, sehir, ilce, fotograflar, created_at"
      )
      .order("created_at", { ascending: false });

    if (ilanHatasi) {
      console.error(ilanHatasi);
      setHata("İlanlar yüklenirken bir hata oluştu.");
      setYukleniyor(false);
      return;
    }

    setIlanlar(ilanVerileri ?? []);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setKullaniciId(user.id);

      const { data: favoriVerileri, error: favoriHatasi } = await supabase
        .from("favoriler")
        .select("ilan_id")
        .eq("kullanici_id", user.id);

      if (favoriHatasi) {
        console.error(favoriHatasi);
      } else {
        const favoriNumaralari = new Set<number>(
          (favoriVerileri ?? []).map((favori) => Number(favori.ilan_id))
        );

        setFavoriler(favoriNumaralari);
      }
    }

    setYukleniyor(false);
  }

  async function favoriyiDegistir(ilanId: number) {
    if (!kullaniciId) {
      router.push("/giris");
      return;
    }

    if (islemdekiIlan !== null) {
      return;
    }

    setIslemdekiIlan(ilanId);

    const favorideMi = favoriler.has(ilanId);

    if (favorideMi) {
      const { error } = await supabase
        .from("favoriler")
        .delete()
        .eq("kullanici_id", kullaniciId)
        .eq("ilan_id", ilanId);

      if (error) {
        console.error(error);
        alert("Favori kaldırılırken bir hata oluştu.");
      } else {
        setFavoriler((oncekiFavoriler) => {
          const yeniFavoriler = new Set(oncekiFavoriler);
          yeniFavoriler.delete(ilanId);
          return yeniFavoriler;
        });
      }
    } else {
      const { error } = await supabase.from("favoriler").insert({
        kullanici_id: kullaniciId,
        ilan_id: ilanId,
      });

      if (error) {
        console.error(error);
        alert("İlan favorilere eklenirken bir hata oluştu.");
      } else {
        setFavoriler((oncekiFavoriler) => {
          const yeniFavoriler = new Set(oncekiFavoriler);
          yeniFavoriler.add(ilanId);
          return yeniFavoriler;
        });
      }
    }

    setIslemdekiIlan(null);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link href="/" className="text-2xl font-black text-emerald-700">
            AL-SAT AI
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/favorilerim"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-600"
            >
              ♥ Favorilerim
            </Link>

            <Link
              href="/ilan-ver"
              className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white"
            >
              + İlan Ver
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">
            Tüm İlanlar
          </h1>

          <p className="mt-2 text-slate-500">
            Beğendiğiniz ilanları kalp düğmesine basarak kaydedebilirsiniz.
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

              const favorideMi = favoriler.has(ilan.id);
              const islemdeMi = islemdekiIlan === ilan.id;

              return (
                <div
                  key={ilan.id}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <button
                    type="button"
                    onClick={() => favoriyiDegistir(ilan.id)}
                    disabled={islemdeMi}
                    aria-label={
                      favorideMi
                        ? "Favorilerden çıkar"
                        : "Favorilere ekle"
                    }
                    title={
                      favorideMi
                        ? "Favorilerden çıkar"
                        : "Favorilere ekle"
                    }
                    className={`absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full text-3xl shadow-lg transition ${
                      favorideMi
                        ? "bg-red-500 text-white"
                        : "bg-white text-slate-400 hover:text-red-500"
                    } ${
                      islemdeMi
                        ? "cursor-wait opacity-60"
                        : "hover:scale-110"
                    }`}
                  >
                    {favorideMi ? "♥" : "♡"}
                  </button>

                  <Link href={`/ilan/${ilan.id}`} className="block">
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
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}