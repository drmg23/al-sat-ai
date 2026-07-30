"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Ilan = {
  id: string;
  baslik: string;
  fiyat: number;
  kategori: string;
  sehir: string;
  ilce: string | null;
  fotograflar: string[] | null;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yetkisiz, setYetkisiz] = useState(false);
  const [silinenId, setSilinenId] = useState<string | null>(null);
  const [hata, setHata] = useState("");

  useEffect(() => {
    paneliHazirla();
  }, []);

  async function paneliHazirla() {
    setYukleniyor(true);
    setHata("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Yönetici paneline girmek için giriş yapmalısınız.");
      router.replace("/giris");
      return;
    }

    const { data: adminMi, error: adminError } = await supabase.rpc(
      "is_admin"
    );

    if (adminError || !adminMi) {
      setYetkisiz(true);
      setYukleniyor(false);
      return;
    }

    const { data, error } = await supabase
      .from("ilanlar")
      .select(
        "id, baslik, fiyat, kategori, sehir, ilce, fotograflar, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setHata("İlanlar alınamadı: " + error.message);
      setYukleniyor(false);
      return;
    }

    setIlanlar((data as Ilan[]) || []);
    setYukleniyor(false);
  }

  async function ilanSil(id: string, baslik: string) {
    const onay = window.confirm(
      `"${baslik}" başlıklı ilanı kalıcı olarak silmek istediğinizden emin misiniz?`
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
    alert("İlan yönetici tarafından silindi.");
  }

  function fiyatYaz(fiyat: number) {
    return new Intl.NumberFormat("tr-TR").format(Number(fiyat));
  }

  function tarihYaz(tarih: string) {
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(tarih));
  }

  if (yukleniyor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-bold text-slate-700">
          Yönetici paneli yükleniyor...
        </p>
      </main>
    );
  }

  if (yetkisiz) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">🔒</div>

          <h1 className="mt-5 text-3xl font-black text-red-600">
            Yetkisiz erişim
          </h1>

          <p className="mt-3 text-slate-600">
            Bu sayfayı yalnızca yöneticiler görüntüleyebilir.
          </p>

          <Link
            href="/"
            className="mt-7 inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <div>
            <Link href="/" className="text-2xl font-black text-blue-600">
              AL-SAT AI
            </Link>

            <p className="mt-1 text-sm font-bold text-slate-500">
              Yönetici Paneli
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700"
          >
            Ana Sayfa
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-3xl bg-blue-600 p-7 text-white shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-100">
              Toplam ilan
            </p>

            <p className="mt-3 text-5xl font-black">{ilanlar.length}</p>
          </div>

          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Panel durumu
            </p>

            <p className="mt-3 text-2xl font-black text-green-600">
              Yönetici girişi aktif
            </p>
          </div>
        </div>

        <div className="mb-7">
          <h1 className="text-3xl font-black text-slate-900">
            İlan Yönetimi
          </h1>

          <p className="mt-2 text-slate-600">
            Platformdaki bütün ilanları görüntüleyebilir ve uygunsuz ilanları
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
              Henüz yayımlanmış ilan bulunmuyor.
            </p>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ilanlar.map((ilan) => (
            <article
              key={ilan.id}
              className="overflow-hidden rounded-3xl bg-white shadow-sm"
            >
              <div className="h-52 bg-slate-200">
                {ilan.fotograflar?.[0] ? (
                  <img
                    src={ilan.fotograflar[0]}
                    alt={ilan.baslik}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-semibold text-slate-500">
                    Fotoğraf yok
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    {ilan.kategori}
                  </span>

                  <span className="text-xs font-semibold text-slate-400">
                    #{ilan.id}
                  </span>
                </div>

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

                <p className="mt-3 text-xs text-slate-400">
                  Yayın tarihi: {tarihYaz(ilan.created_at)}
                </p>

                <div className="mt-6 grid gap-3">
                  <Link
                    href={`/ilan/${ilan.id}`}
                    className="rounded-xl bg-slate-900 px-4 py-3 text-center font-bold text-white"
                  >
                    İlanı Görüntüle
                  </Link>

                  <button
                    type="button"
                    onClick={() => ilanSil(ilan.id, ilan.baslik)}
                    disabled={silinenId === ilan.id}
                    className="rounded-xl bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                  >
                    {silinenId === ilan.id
                      ? "Siliniyor..."
                      : "İlanı Kalıcı Olarak Sil"}
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