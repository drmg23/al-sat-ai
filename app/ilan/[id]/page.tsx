"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../../lib/supabase";

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
  telefon?: string | null;
  created_at?: string;
  goruntulenme?: number | null;
};

const sikayetNedenleri = [
  "Sahte veya yanıltıcı ilan",
  "Yasaklı ürün veya hizmet",
  "Uygunsuz içerik",
  "Spam veya mükerrer ilan",
  "Yanlış kategori veya bilgi",
  "Diğer",
];

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
  const [favoriSayisi, setFavoriSayisi] = useState(0);
  const [oturumKullaniciId, setOturumKullaniciId] = useState<string | null>(
    null
  );
  const [mesaj, setMesaj] = useState("");
  const [mesajGonderiliyor, setMesajGonderiliyor] = useState(false);
  const [sikayetFormuAcik, setSikayetFormuAcik] = useState(false);
  const [sikayetNedeni, setSikayetNedeni] = useState("");
  const [sikayetAciklamasi, setSikayetAciklamasi] = useState("");
  const [sikayetGonderiliyor, setSikayetGonderiliyor] = useState(false);
  const [sikayetGonderildi, setSikayetGonderildi] = useState(false);

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

      const { count: favoriAdedi, error: favoriSayisiHatasi } = await supabase
        .from("favoriler")
        .select("ilan_id", { count: "exact", head: true })
        .eq("ilan_id", ilanId);

      if (favoriSayisiHatasi) {
        console.error(favoriSayisiHatasi);
      } else {
        setFavoriSayisi(favoriAdedi ?? 0);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setOturumKullaniciId(user.id);

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

        if (user.id !== data.user_id) {
          const { data: sikayetKaydi, error: sikayetKontrolHatasi } =
            await supabase
              .from("ilan_sikayetleri")
              .select("id")
              .eq("ilan_id", Number(ilanId))
              .eq("sikayet_eden_id", user.id)
              .maybeSingle();

          if (sikayetKontrolHatasi) {
            console.error(sikayetKontrolHatasi);
          } else {
            setSikayetGonderildi(Boolean(sikayetKaydi));
          }
        }
      }

      try {
        const goruntulemeAnahtari = `ilan-goruntulendi-${ilanId}`;
        const dahaOnceGoruntulendi = window.localStorage.getItem(goruntulemeAnahtari);

        if (!dahaOnceGoruntulendi) {
          const { data: yeniSayi, error: goruntulenmeHatasi } = await supabase.rpc(
            "ilan_goruntulenmesini_artir",
            { p_ilan_id: Number(ilanId) }
          );

          if (goruntulenmeHatasi) {
            console.error(goruntulenmeHatasi);
          } else {
            window.localStorage.setItem(goruntulemeAnahtari, "1");
            setIlan((mevcut) =>
              mevcut
                ? { ...mevcut, goruntulenme: Number(yeniSayi ?? mevcut.goruntulenme ?? 0) }
                : mevcut
            );
          }
        }
      } catch (goruntulenmeHatasi) {
        console.error(goruntulenmeHatasi);
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
        setFavoriSayisi((mevcut) => Math.max(0, mevcut - 1));
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
        setFavoriSayisi((mevcut) => mevcut + 1);
        alert("İlan favorilere eklendi.");
      }
    }

    setFavoriIslemi(false);
  }

  async function mesajGonder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ilan || mesajGonderiliyor) return;

    const temizMesaj = mesaj.trim();

    if (!temizMesaj) {
      alert("Lütfen göndermek istediğiniz mesajı yazın.");
      return;
    }

    if (temizMesaj.length > 2000) {
      alert("Mesaj en fazla 2.000 karakter olabilir.");
      return;
    }

    setMesajGonderiliyor(true);

    const {
      data: { user },
      error: kullaniciHatasi,
    } = await supabase.auth.getUser();

    if (kullaniciHatasi || !user) {
      setMesajGonderiliyor(false);
      alert("Mesaj göndermek için giriş yapmalısınız.");
      router.push("/giris");
      return;
    }

    if (user.id === ilan.user_id) {
      setMesajGonderiliyor(false);
      alert("Kendi ilanınıza mesaj gönderemezsiniz.");
      return;
    }

    const { error } = await supabase.from("mesajlar").insert({
      ilan_id: Number(ilan.id),
      ilan_sahibi_id: ilan.user_id,
      ilgili_kullanici_id: user.id,
      gonderen_id: user.id,
      icerik: temizMesaj,
    });

    if (error) {
      console.error(error);
      alert("Mesaj gönderilemedi: " + error.message);
      setMesajGonderiliyor(false);
      return;
    }

    setOturumKullaniciId(user.id);
    setMesaj("");
    setMesajGonderiliyor(false);
    alert("Mesajınız ilan sahibine gönderildi.");
  }

  async function sikayetGonder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ilan || sikayetGonderiliyor || sikayetGonderildi) return;

    if (!sikayetNedeni) {
      alert("Lütfen şikâyet nedenini seçin.");
      return;
    }

    const temizAciklama = sikayetAciklamasi.trim();

    if (temizAciklama && temizAciklama.length < 3) {
      alert("Açıklama yazacaksanız en az 3 karakter olmalıdır.");
      return;
    }

    if (temizAciklama.length > 1000) {
      alert("Şikâyet açıklaması en fazla 1.000 karakter olabilir.");
      return;
    }

    setSikayetGonderiliyor(true);

    const {
      data: { user },
      error: kullaniciHatasi,
    } = await supabase.auth.getUser();

    if (kullaniciHatasi || !user) {
      setSikayetGonderiliyor(false);
      alert("İlanı şikâyet etmek için giriş yapmalısınız.");
      router.push("/giris");
      return;
    }

    if (user.id === ilan.user_id) {
      setSikayetGonderiliyor(false);
      alert("Kendi ilanınızı şikâyet edemezsiniz.");
      return;
    }

    const { error } = await supabase.from("ilan_sikayetleri").insert({
      ilan_id: Number(ilan.id),
      sikayet_eden_id: user.id,
      neden: sikayetNedeni,
      aciklama: temizAciklama || null,
    });

    if (error) {
      console.error(error);
      setSikayetGonderiliyor(false);

      if (error.code === "23505") {
        setSikayetGonderildi(true);
        setSikayetFormuAcik(false);
        alert("Bu ilanı daha önce şikâyet etmişsiniz.");
      } else {
        alert("Şikâyet gönderilemedi: " + error.message);
      }

      return;
    }

    setOturumKullaniciId(user.id);
    setSikayetGonderildi(true);
    setSikayetFormuAcik(false);
    setSikayetNedeni("");
    setSikayetAciklamasi("");
    setSikayetGonderiliyor(false);
    alert("Şikâyetiniz yönetici incelemesine gönderildi.");
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
                <span>👁️ {Number(ilan.goruntulenme ?? 0).toLocaleString("tr-TR")} görüntülenme</span>
                <span>❤️ {favoriSayisi.toLocaleString("tr-TR")} favori</span>
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

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-100 p-4 text-center">
                  <div className="text-xl">👁️</div>
                  <div className="mt-1 text-lg font-black text-slate-900">
                    {Number(ilan.goruntulenme ?? 0).toLocaleString("tr-TR")}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">Görüntülenme</div>
                </div>

                <div className="rounded-2xl bg-rose-50 p-4 text-center">
                  <div className="text-xl">❤️</div>
                  <div className="mt-1 text-lg font-black text-rose-600">
                    {favoriSayisi.toLocaleString("tr-TR")}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">Favori</div>
                </div>
              </div>

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

                {oturumKullaniciId !== ilan.user_id &&
                  (sikayetGonderildi ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-sm font-bold text-amber-700">
                      ✓ Bu ilanla ilgili bildiriminiz alındı
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSikayetFormuAcik((acik) => !acik)}
                      className="w-full rounded-xl border border-red-200 px-5 py-4 font-bold text-red-600 transition hover:bg-red-50"
                    >
                      ⚠ İlanı Şikâyet Et
                    </button>
                  ))}

                {sikayetFormuAcik && !sikayetGonderildi && (
                  <form
                    onSubmit={sikayetGonder}
                    className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-4"
                  >
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Şikâyet nedeni *
                      </label>

                      <select
                        required
                        value={sikayetNedeni}
                        onChange={(event) =>
                          setSikayetNedeni(event.target.value)
                        }
                        className="w-full rounded-xl border border-red-200 bg-white p-3 text-sm outline-none focus:border-red-400"
                      >
                        <option value="">Neden seçin</option>
                        {sikayetNedenleri.map((neden) => (
                          <option key={neden} value={neden}>
                            {neden}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Açıklama
                      </label>

                      <textarea
                        rows={4}
                        maxLength={1000}
                        value={sikayetAciklamasi}
                        onChange={(event) =>
                          setSikayetAciklamasi(event.target.value)
                        }
                        placeholder="Yöneticinin incelemesine yardımcı olacak bilgileri yazın..."
                        className="w-full resize-y rounded-xl border border-red-200 bg-white p-3 text-sm outline-none focus:border-red-400"
                      />

                      <div className="mt-1 text-right text-xs text-slate-400">
                        {sikayetAciklamasi.length}/1000
                      </div>
                    </div>

                    {!oturumKullaniciId && (
                      <p className="rounded-xl bg-white p-3 text-xs font-semibold text-amber-700">
                        Göndermek için giriş yapmanız istenecektir.
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSikayetFormuAcik(false)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-600"
                      >
                        Vazgeç
                      </button>

                      <button
                        type="submit"
                        disabled={sikayetGonderiliyor}
                        className="rounded-xl bg-red-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                      >
                        {sikayetGonderiliyor ? "Gönderiliyor..." : "Gönder"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">
                İlan Sahibine Mesaj Gönder
              </h2>

              {oturumKullaniciId === ilan.user_id ? (
                <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-700">
                  Bu ilan size ait. Gelen mesajları Mesajlarım sayfasından
                  görüntüleyebilirsiniz.
                </div>
              ) : (
                <form onSubmit={mesajGonder} className="mt-4 space-y-3">
                  {!oturumKullaniciId && (
                    <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">
                      Mesaj göndermek için giriş yapmalısınız.
                    </p>
                  )}

                  <textarea
                    rows={5}
                    maxLength={2000}
                    value={mesaj}
                    onChange={(event) => setMesaj(event.target.value)}
                    placeholder="İlan hakkında sormak istediğiniz mesajı yazın..."
                    className="w-full resize-y rounded-xl border border-slate-300 p-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                  <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                    <span>Kişisel veya finansal bilgilerinizi paylaşmayın.</span>
                    <span>{mesaj.length}/2000</span>
                  </div>

                  <button
                    type="submit"
                    disabled={mesajGonderiliyor}
                    className="w-full rounded-xl bg-blue-600 px-5 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    {mesajGonderiliyor
                      ? "Gönderiliyor..."
                      : "✉ Mesaj Gönder"}
                  </button>
                </form>
              )}
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