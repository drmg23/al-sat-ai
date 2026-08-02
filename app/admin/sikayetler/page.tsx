"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type SikayetDurumu =
  | "beklemede"
  | "inceleniyor"
  | "sonuclandi"
  | "reddedildi";

type IlanBilgisi = {
  id: number;
  baslik: string;
  kategori: string | null;
  sehir: string | null;
  ilce: string | null;
  fotograflar: string[] | null;
};

type Sikayet = {
  id: string;
  ilan_id: number;
  sikayet_eden_id: string;
  neden: string;
  aciklama: string | null;
  durum: SikayetDurumu;
  yonetici_notu: string | null;
  created_at: string;
  updated_at: string;
  ilanlar: IlanBilgisi | null;
};

const durumSecenekleri: Array<{
  value: SikayetDurumu;
  label: string;
}> = [
  { value: "beklemede", label: "Beklemede" },
  { value: "inceleniyor", label: "İnceleniyor" },
  { value: "sonuclandi", label: "Sonuçlandı" },
  { value: "reddedildi", label: "Reddedildi" },
];

function durumEtiketi(durum: SikayetDurumu) {
  return durumSecenekleri.find((secenek) => secenek.value === durum)?.label ?? durum;
}

function durumRengi(durum: SikayetDurumu) {
  if (durum === "beklemede") return "bg-red-100 text-red-700";
  if (durum === "inceleniyor") return "bg-amber-100 text-amber-700";
  if (durum === "sonuclandi") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-200 text-slate-700";
}

export default function AdminSikayetlerPage() {
  const router = useRouter();

  const [sikayetler, setSikayetler] = useState<Sikayet[]>([]);
  const [filtre, setFiltre] = useState<"tumu" | SikayetDurumu>("beklemede");
  const [yoneticiNotlari, setYoneticiNotlari] = useState<Record<string, string>>(
    {}
  );
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydedilenId, setKaydedilenId] = useState<string | null>(null);
  const [silinenIlanId, setSilinenIlanId] = useState<number | null>(null);
  const [hata, setHata] = useState("");

  useEffect(() => {
    void yetkiyiKontrolEtVeSikayetleriGetir();
  }, []);

  async function yetkiyiKontrolEtVeSikayetleriGetir() {
    setYukleniyor(true);
    setHata("");

    const {
      data: { user },
      error: kullaniciHatasi,
    } = await supabase.auth.getUser();

    if (kullaniciHatasi || !user) {
      alert("Yönetici sayfasını açmak için giriş yapmalısınız.");
      router.replace("/giris");
      return;
    }

    const { data: adminMi, error: adminHatasi } = await supabase.rpc("is_admin");

    if (adminHatasi || adminMi !== true) {
      setHata("Bu sayfayı yalnızca yöneticiler görüntüleyebilir.");
      setYukleniyor(false);
      return;
    }

    await sikayetleriGetir();
  }

  async function sikayetleriGetir() {
    setHata("");

    const { data, error } = await supabase
      .from("ilan_sikayetleri")
      .select(
        "id, ilan_id, sikayet_eden_id, neden, aciklama, durum, yonetici_notu, created_at, updated_at, ilanlar(id, baslik, kategori, sehir, ilce, fotograflar)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setHata("Şikâyetler alınamadı: " + error.message);
      setYukleniyor(false);
      return;
    }

    const gelenSikayetler = (data ?? []) as unknown as Sikayet[];
    setSikayetler(gelenSikayetler);
    setYoneticiNotlari(
      Object.fromEntries(
        gelenSikayetler.map((sikayet) => [
          sikayet.id,
          sikayet.yonetici_notu ?? "",
        ])
      )
    );
    setYukleniyor(false);
  }

  async function sikayetiGuncelle(
    sikayet: Sikayet,
    yeniDurum: SikayetDurumu
  ) {
    setKaydedilenId(sikayet.id);

    const temizNot = (yoneticiNotlari[sikayet.id] ?? "").trim();

    const { error } = await supabase
      .from("ilan_sikayetleri")
      .update({
        durum: yeniDurum,
        yonetici_notu: temizNot || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sikayet.id);

    if (error) {
      console.error(error);
      alert("Şikâyet güncellenemedi: " + error.message);
      setKaydedilenId(null);
      return;
    }

    setSikayetler((mevcut) =>
      mevcut.map((kayit) =>
        kayit.id === sikayet.id
          ? {
              ...kayit,
              durum: yeniDurum,
              yonetici_notu: temizNot || null,
              updated_at: new Date().toISOString(),
            }
          : kayit
      )
    );
    setKaydedilenId(null);
  }

  async function ilaniSil(sikayet: Sikayet) {
    const ilanBasligi = sikayet.ilanlar?.baslik ?? `İlan ${sikayet.ilan_id}`;
    const onay = window.confirm(
      `“${ilanBasligi}” ilanını kalıcı olarak silmek istediğinizden emin misiniz?`
    );

    if (!onay) return;

    setSilinenIlanId(sikayet.ilan_id);

    const { error } = await supabase
      .from("ilanlar")
      .delete()
      .eq("id", sikayet.ilan_id);

    if (error) {
      console.error(error);
      alert("İlan silinemedi: " + error.message);
      setSilinenIlanId(null);
      return;
    }

    setSikayetler((mevcut) =>
      mevcut.filter((kayit) => kayit.ilan_id !== sikayet.ilan_id)
    );
    setSilinenIlanId(null);
    alert("İlan silindi. Bu ilana bağlı şikâyet kayıtları da kaldırıldı.");
  }

  const sayilar = useMemo(
    () => ({
      tumu: sikayetler.length,
      beklemede: sikayetler.filter((s) => s.durum === "beklemede").length,
      inceleniyor: sikayetler.filter((s) => s.durum === "inceleniyor").length,
      sonuclandi: sikayetler.filter((s) => s.durum === "sonuclandi").length,
      reddedildi: sikayetler.filter((s) => s.durum === "reddedildi").length,
    }),
    [sikayetler]
  );

  const gorunenSikayetler = useMemo(
    () =>
      filtre === "tumu"
        ? sikayetler
        : sikayetler.filter((sikayet) => sikayet.durum === filtre),
    [filtre, sikayetler]
  );

  if (yukleniyor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-bold text-slate-700">
          Şikâyetler yükleniyor...
        </p>
      </main>
    );
  }

  if (hata) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-5 text-2xl font-black text-red-600">Erişim sağlanamadı</h1>
          <p className="mt-3 text-slate-600">{hata}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <Link href="/" className="text-2xl font-black text-blue-600">
              AL-SAT AI
            </Link>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Yönetici · İlan Şikâyetleri
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void sikayetleriGetir()}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700"
            >
              ↻ Yenile
            </button>
            <Link
              href="/admin"
              className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
            >
              Yönetici Paneli
            </Link>
            <Link
              href="/"
              className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
            >
              Ana Sayfa
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black sm:text-4xl">İlan Şikâyetleri</h1>
          <p className="mt-2 text-slate-600">
            Kullanıcıların bildirdiği ilanları inceleyin ve sonuçlandırın.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {([
            ["tumu", "Tümü", sayilar.tumu],
            ["beklemede", "Beklemede", sayilar.beklemede],
            ["inceleniyor", "İnceleniyor", sayilar.inceleniyor],
            ["sonuclandi", "Sonuçlandı", sayilar.sonuclandi],
            ["reddedildi", "Reddedildi", sayilar.reddedildi],
          ] as const).map(([deger, baslik, sayi]) => (
            <button
              key={deger}
              type="button"
              onClick={() => setFiltre(deger)}
              className={`rounded-2xl border p-5 text-left shadow-sm transition ${
                filtre === deger
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"
              }`}
            >
              <span className="block text-sm font-bold opacity-80">{baslik}</span>
              <span className="mt-2 block text-3xl font-black">{sayi}</span>
            </button>
          ))}
        </div>

        {gorunenSikayetler.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">✅</div>
            <h2 className="mt-4 text-xl font-black">
              Bu bölümde şikâyet bulunmuyor
            </h2>
          </div>
        ) : (
          <div className="space-y-6">
            {gorunenSikayetler.map((sikayet) => {
              const fotograf = sikayet.ilanlar?.fotograflar?.[0];

              return (
                <article
                  key={sikayet.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="min-h-52 bg-slate-200">
                      {fotograf ? (
                        <img
                          src={fotograf}
                          alt={sikayet.ilanlar?.baslik ?? "Şikâyet edilen ilan"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-52 items-center justify-center text-slate-500">
                          Fotoğraf yok
                        </div>
                      )}
                    </div>

                    <div className="p-6 sm:p-7">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-black ${durumRengi(
                              sikayet.durum
                            )}`}
                          >
                            {durumEtiketi(sikayet.durum)}
                          </span>
                          <h2 className="mt-3 text-2xl font-black">
                            {sikayet.ilanlar?.baslik ?? "İlan kaldırılmış"}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            İlan No: {sikayet.ilan_id}
                            {sikayet.ilanlar?.sehir
                              ? ` · ${sikayet.ilanlar.ilce ? `${sikayet.ilanlar.ilce}, ` : ""}${sikayet.ilanlar.sehir}`
                              : ""}
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-slate-500">
                          {new Date(sikayet.created_at).toLocaleString("tr-TR")}
                        </p>
                      </div>

                      <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl bg-red-50 p-5">
                          <p className="text-xs font-black uppercase tracking-wide text-red-500">
                            Şikâyet nedeni
                          </p>
                          <p className="mt-2 font-black text-red-800">
                            {sikayet.neden}
                          </p>
                          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                            {sikayet.aciklama || "Kullanıcı ek açıklama yazmadı."}
                          </p>
                          <p className="mt-4 text-xs text-slate-400">
                            Bildiren kullanıcı: {sikayet.sikayet_eden_id.slice(0, 8)}…
                          </p>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-black text-slate-700">
                            Yönetici notu
                          </label>
                          <textarea
                            rows={5}
                            maxLength={1000}
                            value={yoneticiNotlari[sikayet.id] ?? ""}
                            onChange={(event) =>
                              setYoneticiNotlari((mevcut) => ({
                                ...mevcut,
                                [sikayet.id]: event.target.value,
                              }))
                            }
                            placeholder="İnceleme sonucuyla ilgili not yazabilirsiniz..."
                            className="w-full resize-y rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        {sikayet.ilanlar && (
                          <Link
                            href={`/ilan/${sikayet.ilan_id}`}
                            className="rounded-xl bg-slate-900 px-4 py-3 text-center font-bold text-white"
                          >
                            İlanı Görüntüle
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            void sikayetiGuncelle(sikayet, "inceleniyor")
                          }
                          disabled={kaydedilenId === sikayet.id}
                          className="rounded-xl bg-amber-500 px-4 py-3 font-bold text-white disabled:opacity-50"
                        >
                          İnceleniyor Yap
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void sikayetiGuncelle(sikayet, "sonuclandi")
                          }
                          disabled={kaydedilenId === sikayet.id}
                          className="rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                        >
                          Sonuçlandır
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void sikayetiGuncelle(sikayet, "reddedildi")
                          }
                          disabled={kaydedilenId === sikayet.id}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 disabled:opacity-50"
                        >
                          Şikâyeti Reddet
                        </button>

                        {sikayet.ilanlar && (
                          <button
                            type="button"
                            onClick={() => void ilaniSil(sikayet)}
                            disabled={silinenIlanId === sikayet.ilan_id}
                            className="rounded-xl bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                          >
                            {silinenIlanId === sikayet.ilan_id
                              ? "Siliniyor..."
                              : "İlanı Sil"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}