"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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

export default function IlanDuzenlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ilanId = params.id;

  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [fiyat, setFiyat] = useState("");
  const [kategori, setKategori] = useState("");
  const [sehir, setSehir] = useState("");
  const [ilce, setIlce] = useState("");
  const [telefon, setTelefon] = useState("");
  const [fotograf, setFotograf] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");

  useEffect(() => {
    ilaniGetir();
  }, [ilanId]);

  async function ilaniGetir() {
    setYukleniyor(true);
    setHata("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("İlan düzenlemek için giriş yapmalısınız.");
      router.replace("/giris");
      return;
    }

    const { data, error } = await supabase
      .from("ilanlar")
      .select(
        "id, user_id, baslik, aciklama, fiyat, kategori, sehir, ilce, telefon, fotograflar"
      )
      .eq("id", ilanId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      setHata("Bu ilan bulunamadı veya düzenleme yetkiniz yok.");
      setYukleniyor(false);
      return;
    }

    setBaslik(data.baslik || "");
    setAciklama(data.aciklama || "");
    setFiyat(String(data.fiyat ?? ""));
    setKategori(data.kategori || "");
    setSehir(data.sehir || "");
    setIlce(data.ilce || "");
    setTelefon(data.telefon || "");
    setFotograf(data.fotograflar?.[0] || null);
    setYukleniyor(false);
  }

  async function ilaniGuncelle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!baslik.trim() || !kategori || !fiyat || !sehir) {
      alert("Başlık, kategori, fiyat ve şehir alanları zorunludur.");
      return;
    }

    if (Number(fiyat) <= 0) {
      alert("Lütfen geçerli bir fiyat yazın.");
      return;
    }

    setKaydediliyor(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.");
      setKaydediliyor(false);
      router.replace("/giris");
      return;
    }

    const { error } = await supabase
      .from("ilanlar")
      .update({
        baslik: baslik.trim(),
        aciklama: aciklama.trim(),
        fiyat: Number(fiyat),
        kategori,
        sehir,
        ilce: ilce.trim() || null,
        telefon: telefon.trim() || null,
      })
      .eq("id", ilanId)
      .eq("user_id", user.id);

    if (error) {
      alert("İlan güncellenemedi: " + error.message);
      setKaydediliyor(false);
      return;
    }

    alert("İlan başarıyla güncellendi.");
    router.push("/ilanlarim");
    router.refresh();
  }

  if (yukleniyor) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-lg font-bold text-slate-700">İlan yükleniyor...</p>
      </main>
    );
  }

  if (hata) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-xl font-black text-red-600">{hata}</p>
          <Link
            href="/ilanlarim"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
          >
            Benim İlanlarıma Dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">İlanı Düzenle</h1>
            <p className="mt-2 text-slate-600">
              İlan bilgilerini güncelleyip yeniden kaydedebilirsiniz.
            </p>
          </div>

          <Link
            href="/ilanlarim"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700"
          >
            Vazgeç
          </Link>
        </div>

        <form
          onSubmit={ilaniGuncelle}
          className="rounded-3xl bg-white p-6 shadow-sm sm:p-9"
        >
          {fotograf && (
            <img
              src={fotograf}
              alt={baslik}
              className="mb-7 h-64 w-full rounded-2xl object-cover"
            />
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-2 block font-bold text-slate-700">
                İlan başlığı *
              </span>
              <input
                value={baslik}
                onChange={(event) => setBaslik(event.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500"
              />
            </label>

            <label>
              <span className="mb-2 block font-bold text-slate-700">
                Kategori *
              </span>
              <select
                value={kategori}
                onChange={(event) => setKategori(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-blue-500"
              >
                <option value="">Kategori seçin</option>
                {kategoriler.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block font-bold text-slate-700">
                Fiyat (TL) *
              </span>
              <input
                type="number"
                min="1"
                value={fiyat}
                onChange={(event) => setFiyat(event.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500"
              />
            </label>

            <label>
              <span className="mb-2 block font-bold text-slate-700">
                Şehir *
              </span>
              <select
                value={sehir}
                onChange={(event) => setSehir(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-blue-500"
              >
                <option value="">Şehir seçin</option>
                {sehirler.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block font-bold text-slate-700">İlçe</span>
              <input
                value={ilce}
                onChange={(event) => setIlce(event.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-2 block font-bold text-slate-700">Telefon</span>
              <input
                value={telefon}
                onChange={(event) => setTelefon(event.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-2 block font-bold text-slate-700">
                İlan açıklaması
              </span>
              <textarea
                rows={7}
                value={aciklama}
                onChange={(event) => setAciklama(event.target.value)}
                className="w-full resize-y rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={kaydediliyor}
            className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-black text-white disabled:opacity-50"
          >
            {kaydediliyor ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </form>
      </div>
    </main>
  );
}