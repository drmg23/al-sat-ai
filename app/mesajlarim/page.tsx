"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { supabase } from "../../lib/supabase";

type IlanOzeti = {
  id: string;
  baslik: string;
  fotograflar: string[] | null;
};

type Mesaj = {
  id: string;
  ilan_id: number;
  ilan_sahibi_id: string;
  ilgili_kullanici_id: string;
  gonderen_id: string;
  icerik: string;
  okundu: boolean;
  created_at: string;
  ilanlar: IlanOzeti | IlanOzeti[] | null;
};

type Konusma = {
  anahtar: string;
  ilanId: number;
  ilanSahibiId: string;
  ilgiliKullaniciId: string;
  ilan: IlanOzeti | null;
  mesajlar: Mesaj[];
  sonMesaj: Mesaj;
  okunmamisSayisi: number;
};

function ilaniAyir(
  ilanlar: IlanOzeti | IlanOzeti[] | null
): IlanOzeti | null {
  if (Array.isArray(ilanlar)) return ilanlar[0] ?? null;
  return ilanlar;
}

function konusmalariOlustur(
  mesajlar: Mesaj[],
  kullaniciId: string | null
): Konusma[] {
  if (!kullaniciId) return [];

  const gruplar = new Map<string, Mesaj[]>();

  for (const mesaj of mesajlar) {
    const anahtar = `${mesaj.ilan_id}:${mesaj.ilgili_kullanici_id}`;
    const grup = gruplar.get(anahtar) ?? [];
    grup.push(mesaj);
    gruplar.set(anahtar, grup);
  }

  return Array.from(gruplar.entries())
    .map(([anahtar, grupMesajlari]) => {
      const siraliMesajlar = [...grupMesajlari].sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );

      const ilkMesaj = siraliMesajlar[0];
      const sonMesaj = siraliMesajlar[siraliMesajlar.length - 1];

      return {
        anahtar,
        ilanId: ilkMesaj.ilan_id,
        ilanSahibiId: ilkMesaj.ilan_sahibi_id,
        ilgiliKullaniciId: ilkMesaj.ilgili_kullanici_id,
        ilan: ilaniAyir(ilkMesaj.ilanlar),
        mesajlar: siraliMesajlar,
        sonMesaj,
        okunmamisSayisi: siraliMesajlar.filter(
          (mesaj) =>
            mesaj.gonderen_id !== kullaniciId && !mesaj.okundu
        ).length,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.sonMesaj.created_at).getTime() -
        new Date(a.sonMesaj.created_at).getTime()
    );
}

export default function MesajlarimPage() {
  const router = useRouter();

  const [kullaniciId, setKullaniciId] = useState<string | null>(null);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [seciliAnahtar, setSeciliAnahtar] = useState<string | null>(null);
  const [cevap, setCevap] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState("");

  const konusmalar = useMemo(
    () => konusmalariOlustur(mesajlar, kullaniciId),
    [mesajlar, kullaniciId]
  );

  const seciliKonusma =
    konusmalar.find((konusma) => konusma.anahtar === seciliAnahtar) ??
    null;

  useEffect(() => {
    mesajlariGetir();
  }, []);

  useEffect(() => {
    if (!seciliAnahtar && konusmalar.length > 0) {
      setSeciliAnahtar(konusmalar[0].anahtar);
    }

    if (
      seciliAnahtar &&
      konusmalar.length > 0 &&
      !konusmalar.some((konusma) => konusma.anahtar === seciliAnahtar)
    ) {
      setSeciliAnahtar(konusmalar[0].anahtar);
    }
  }, [konusmalar, seciliAnahtar]);

  async function mesajlariGetir() {
    setYukleniyor(true);
    setHata("");

    const {
      data: { user },
      error: kullaniciHatasi,
    } = await supabase.auth.getUser();

    if (kullaniciHatasi || !user) {
      alert("Mesajlarınızı görmek için giriş yapmalısınız.");
      router.replace("/giris");
      return;
    }

    setKullaniciId(user.id);

    const { data, error } = await supabase
      .from("mesajlar")
      .select(
        `
          id,
          ilan_id,
          ilan_sahibi_id,
          ilgili_kullanici_id,
          gonderen_id,
          icerik,
          okundu,
          created_at,
          ilanlar (
            id,
            baslik,
            fotograflar
          )
        `
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setHata("Mesajlar alınamadı: " + error.message);
      setYukleniyor(false);
      return;
    }

    setMesajlar((data as Mesaj[]) ?? []);
    setYukleniyor(false);
  }

  async function konusmaSec(konusma: Konusma) {
    setSeciliAnahtar(konusma.anahtar);

    if (!kullaniciId || konusma.okunmamisSayisi === 0) return;

    const okunmamisMesajIdleri = konusma.mesajlar
      .filter(
        (mesaj) =>
          mesaj.gonderen_id !== kullaniciId && !mesaj.okundu
      )
      .map((mesaj) => mesaj.id);

    if (okunmamisMesajIdleri.length === 0) return;

    const { error } = await supabase
      .from("mesajlar")
      .update({ okundu: true })
      .in("id", okunmamisMesajIdleri);

    if (error) {
      console.error(error);
      return;
    }

    setMesajlar((mevcutMesajlar) =>
      mevcutMesajlar.map((mesaj) =>
        okunmamisMesajIdleri.includes(mesaj.id)
          ? { ...mesaj, okundu: true }
          : mesaj
      )
    );
  }

  async function cevapGonder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!seciliKonusma || !kullaniciId || gonderiliyor) return;

    const temizCevap = cevap.trim();

    if (!temizCevap) {
      alert("Lütfen göndermek istediğiniz mesajı yazın.");
      return;
    }

    if (temizCevap.length > 2000) {
      alert("Mesaj en fazla 2.000 karakter olabilir.");
      return;
    }

    setGonderiliyor(true);

    const { data, error } = await supabase
      .from("mesajlar")
      .insert({
        ilan_id: seciliKonusma.ilanId,
        ilan_sahibi_id: seciliKonusma.ilanSahibiId,
        ilgili_kullanici_id: seciliKonusma.ilgiliKullaniciId,
        gonderen_id: kullaniciId,
        icerik: temizCevap,
      })
      .select(
        `
          id,
          ilan_id,
          ilan_sahibi_id,
          ilgili_kullanici_id,
          gonderen_id,
          icerik,
          okundu,
          created_at,
          ilanlar (
            id,
            baslik,
            fotograflar
          )
        `
      )
      .single();

    if (error || !data) {
      console.error(error);
      alert("Mesaj gönderilemedi: " + (error?.message ?? "Bilinmeyen hata"));
      setGonderiliyor(false);
      return;
    }

    setMesajlar((mevcutMesajlar) => [
      ...mevcutMesajlar,
      data as Mesaj,
    ]);
    setCevap("");
    setGonderiliyor(false);
  }

  function tarihYaz(tarih: string) {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(tarih));
  }

  if (yukleniyor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-bold text-slate-700">
          Mesajlarınız yükleniyor...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <Link href="/" className="text-2xl font-black text-emerald-700">
              AL-SAT AI
            </Link>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Mesajlarım
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={mesajlariGetir}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700"
            >
              ↻ Yenile
            </button>

            <Link
              href="/"
              className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white"
            >
              Ana Sayfa
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-7">
          <h1 className="text-3xl font-black sm:text-4xl">Mesajlarım</h1>
          <p className="mt-2 text-slate-600">
            İlanlarla ilgili gelen ve gönderilen mesajları buradan takip
            edebilirsiniz.
          </p>
        </div>

        {hata && (
          <div className="mb-6 rounded-xl bg-red-100 p-4 font-semibold text-red-700">
            {hata}
          </div>
        )}

        {!hata && konusmalar.length === 0 && (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="text-6xl">✉️</div>
            <h2 className="mt-5 text-2xl font-black">
              Henüz mesajınız bulunmuyor
            </h2>
            <p className="mt-2 text-slate-500">
              Bir ilan sahibine mesaj gönderdiğinizde konuşmanız burada
              görünecek.
            </p>
            <Link
              href="/ilan"
              className="mt-7 inline-block rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white"
            >
              İlanları İncele
            </Link>
          </div>
        )}

        {!hata && konusmalar.length > 0 && (
          <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-black">Konuşmalar</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {konusmalar.length} konuşma
                </p>
              </div>

              <div className="max-h-[680px] overflow-y-auto">
                {konusmalar.map((konusma) => {
                  const digerKisiRolu =
                    kullaniciId === konusma.ilanSahibiId
                      ? "Alıcı adayı"
                      : "İlan sahibi";

                  return (
                    <button
                      key={konusma.anahtar}
                      type="button"
                      onClick={() => konusmaSec(konusma)}
                      className={`flex w-full gap-4 border-b border-slate-100 p-5 text-left transition hover:bg-slate-50 ${
                        seciliAnahtar === konusma.anahtar
                          ? "bg-emerald-50"
                          : "bg-white"
                      }`}
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                        {konusma.ilan?.fotograflar?.[0] ? (
                          <img
                            src={konusma.ilan.fotograflar[0]}
                            alt={konusma.ilan.baslik}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-2xl">
                            📷
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-black text-slate-900">
                            {konusma.ilan?.baslik ??
                              `İlan #${konusma.ilanId}`}
                          </p>

                          {konusma.okunmamisSayisi > 0 && (
                            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-black text-white">
                              {konusma.okunmamisSayisi}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs font-bold text-emerald-700">
                          {digerKisiRolu}
                        </p>

                        <p className="mt-2 truncate text-sm text-slate-500">
                          {konusma.sonMesaj.icerik}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {seciliKonusma && (
              <section className="flex min-h-[620px] flex-col">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
                  <div>
                    <h2 className="text-xl font-black">
                      {seciliKonusma.ilan?.baslik ??
                        `İlan #${seciliKonusma.ilanId}`}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {kullaniciId === seciliKonusma.ilanSahibiId
                        ? "Alıcı adayı ile görüşme"
                        : "İlan sahibi ile görüşme"}
                    </p>
                  </div>

                  <Link
                    href={`/ilan/${seciliKonusma.ilanId}`}
                    className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-700"
                  >
                    İlanı Görüntüle
                  </Link>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-5 sm:p-7">
                  {seciliKonusma.mesajlar.map((mesaj) => {
                    const benimMesajim = mesaj.gonderen_id === kullaniciId;

                    return (
                      <div
                        key={mesaj.id}
                        className={`flex ${
                          benimMesajim ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm sm:max-w-[70%] ${
                            benimMesajim
                              ? "rounded-br-md bg-blue-600 text-white"
                              : "rounded-bl-md bg-white text-slate-800"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-6">
                            {mesaj.icerik}
                          </p>

                          <div
                            className={`mt-2 flex justify-end gap-2 text-xs ${
                              benimMesajim
                                ? "text-blue-100"
                                : "text-slate-400"
                            }`}
                          >
                            <span>{tarihYaz(mesaj.created_at)}</span>
                            {benimMesajim && (
                              <span>{mesaj.okundu ? "Okundu" : "Gönderildi"}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={cevapGonder}
                  className="border-t border-slate-200 bg-white p-5"
                >
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={cevap}
                    onChange={(event) => setCevap(event.target.value)}
                    placeholder="Cevabınızı yazın..."
                    className="w-full resize-y rounded-xl border border-slate-300 p-4 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      {cevap.length}/2000
                    </span>

                    <button
                      type="submit"
                      disabled={gonderiliyor}
                      className="rounded-xl bg-blue-600 px-7 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                    >
                      {gonderiliyor ? "Gönderiliyor..." : "Cevap Gönder"}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>
        )}
      </section>
    </main>
  );
}