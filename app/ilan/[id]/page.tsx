"use client";

import { useState } from "react";

const ilanFotoğraflari = [
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=85",
];

const ozellikler = [
  { baslik: "Marka", deger: "Volkswagen" },
  { baslik: "Model", deger: "Passat" },
  { baslik: "Yıl", deger: "2022" },
  { baslik: "Kilometre", deger: "38.500 km" },
  { baslik: "Yakıt", deger: "Dizel" },
  { baslik: "Vites", deger: "Otomatik" },
  { baslik: "Kasa Tipi", deger: "Sedan" },
  { baslik: "Motor Gücü", deger: "150 HP" },
  { baslik: "Motor Hacmi", deger: "1.968 cc" },
  { baslik: "Çekiş", deger: "Önden Çekiş" },
  { baslik: "Renk", deger: "Gri" },
  { baslik: "Garanti", deger: "Devam Ediyor" },
];

const benzerIlanlar = [
  {
    id: 2,
    baslik: "2021 Volkswagen Passat 1.5 TSI",
    fiyat: "1.780.000 TL",
    konum: "İstanbul / Başakşehir",
    foto:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    baslik: "2022 Skoda Superb Prestige",
    fiyat: "1.950.000 TL",
    konum: "İstanbul / Bakırköy",
    foto:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    baslik: "2023 Peugeot 508 Allure",
    fiyat: "2.150.000 TL",
    konum: "İstanbul / Küçükçekmece",
    foto:
      "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80",
  },
];

export default function IlanDetaySayfasi() {
  const [aktifFotoğraf, setAktifFotoğraf] = useState(0);
  const [favori, setFavori] = useState(false);
  const [telefonAcik, setTelefonAcik] = useState(false);
  const [bildirim, setBildirim] = useState("");

  function bildirimGoster(mesaj: string) {
    setBildirim(mesaj);

    setTimeout(() => {
      setBildirim("");
    }, 2500);
  }

  function oncekiFotoğraf() {
    setAktifFotoğraf((mevcut) =>
      mevcut === 0 ? ilanFotoğraflari.length - 1 : mevcut - 1
    );
  }

  function sonrakiFotoğraf() {
    setAktifFotoğraf((mevcut) =>
      mevcut === ilanFotoğraflari.length - 1 ? 0 : mevcut + 1
    );
  }

  function ilaniPaylas() {
    if (navigator.share) {
      navigator.share({
        title: "2022 Volkswagen Passat",
        text: "AL-SAT AI üzerindeki bu ilana göz at.",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      bildirimGoster("İlan bağlantısı kopyalandı.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {bildirim && (
        <div className="fixed right-5 top-5 z-50 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          {bildirim}
        </div>
      )}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-lg font-black text-white">
              AS
            </div>

            <div>
              <div className="text-xl font-black tracking-tight">
                AL-SAT AI
              </div>
              <div className="text-xs text-slate-500">
                Akıllı ilan platformu
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a className="transition hover:text-emerald-600" href="/">
              Ana Sayfa
            </a>
            <a className="transition hover:text-emerald-600" href="/ilanlar">
              İlanlar
            </a>
            <a className="transition hover:text-emerald-600" href="/giris">
              Giriş Yap
            </a>
          </nav>

          <a
            href="/ilan-ver"
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Ücretsiz İlan Ver
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <a href="/" className="hover:text-emerald-600">
            Ana Sayfa
          </a>
          <span>›</span>
          <a href="/ilanlar" className="hover:text-emerald-600">
            Vasıta
          </a>
          <span>›</span>
          <span>Otomobil</span>
          <span>›</span>
          <span className="font-medium text-slate-800">Volkswagen Passat</span>
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                <img
                  src={ilanFotoğraflari[aktifFotoğraf]}
                  alt="İlan fotoğrafı"
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  onClick={oncekiFotoğraf}
                  aria-label="Önceki fotoğraf"
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold shadow-lg transition hover:bg-white"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={sonrakiFotoğraf}
                  aria-label="Sonraki fotoğraf"
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold shadow-lg transition hover:bg-white"
                >
                  ›
                </button>

                <div className="absolute bottom-4 right-4 rounded-full bg-slate-950/75 px-4 py-2 text-sm font-semibold text-white">
                  {aktifFotoğraf + 1} / {ilanFotoğraflari.length}
                </div>

                <div className="absolute left-4 top-4 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white">
                  ÖNE ÇIKAN İLAN
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 p-4">
                {ilanFotoğraflari.map((fotoğraf, index) => (
                  <button
                    key={fotoğraf}
                    type="button"
                    onClick={() => setAktifFotoğraf(index)}
                    className={`overflow-hidden rounded-xl border-2 transition ${
                      aktifFotoğraf === index
                        ? "border-emerald-500"
                        : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={fotoğraf}
                      alt={`${index + 1}. küçük ilan fotoğrafı`}
                      className="aspect-[4/3] h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-emerald-600">
                    Vasıta / Otomobil / Volkswagen
                  </p>

                  <h1 className="max-w-3xl text-2xl font-black leading-tight sm:text-3xl">
                    2022 Volkswagen Passat 2.0 TDI Elegance Hatasız
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>📍 İstanbul / Başakşehir</span>
                    <span>📅 12 Temmuz 2026</span>
                    <span>👁 1.248 görüntülenme</span>
                    <span>İlan No: 1000001</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-sm text-slate-500">Satış fiyatı</p>
                  <p className="mt-1 text-3xl font-black text-emerald-600">
                    1.925.000 TL
                  </p>
                </div>
              </div>

              <div className="grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    setFavori(!favori);
                    bildirimGoster(
                      favori
                        ? "İlan favorilerden çıkarıldı."
                        : "İlan favorilere eklendi."
                    );
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    favori
                      ? "border-rose-200 bg-rose-50 text-rose-600"
                      : "border-slate-200 bg-white text-slate-700 hover:border-rose-300"
                  }`}
                >
                  {favori ? "♥ Favorilerde" : "♡ Favorilere Ekle"}
                </button>

                <button
                  type="button"
                  onClick={ilaniPaylas}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  ↗ İlanı Paylaş
                </button>

                <button
                  type="button"
                  onClick={() =>
                    bildirimGoster("İlan şikâyet formu yakında açılacak.")
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
                >
                  ⚑ İlanı Bildir
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-black">İlan özellikleri</h2>

              <div className="grid gap-x-8 sm:grid-cols-2">
                {ozellikler.map((özellik) => (
                  <div
                    key={özellik.baslik}
                    className="flex items-center justify-between border-b border-slate-100 py-4"
                  >
                    <span className="text-sm text-slate-500">
                      {özellik.baslik}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {özellik.deger}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-black">İlan açıklaması</h2>

              <div className="space-y-4 text-[15px] leading-7 text-slate-600">
                <p>
                  Aracımız 2022 model Volkswagen Passat 2.0 TDI Elegance
                  paketidir. Araç aile aracı olarak kullanılmış olup bütün
                  bakımları zamanında yapılmıştır.
                </p>

                <p>
                  Boya, değişen ve ağır hasar kaydı bulunmamaktadır. İç ve dış
                  kondisyonu oldukça temizdir. Araçta geri görüş kamerası,
                  adaptif hız sabitleyici, dijital gösterge paneli, şerit takip
                  sistemi, ısıtmalı koltuklar ve LED farlar bulunmaktadır.
                </p>

                <p>
                  Ekspertiz raporu alıcıyla paylaşılacaktır. Ciddi alıcılar
                  aracı randevu oluşturarak görebilir.
                </p>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-2xl">
                  🤖
                </div>

                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-black">
                      AL-SAT AI ilan analizi
                    </h2>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      Fiyat uygun
                    </span>
                  </div>

                  <p className="text-sm leading-6 text-slate-600">
                    Yapay zekâ analizimize göre bu ilan, benzer model ve
                    kilometredeki araçların ortalama piyasa değerine yakındır.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white bg-white/80 p-4">
                      <p className="text-xs font-semibold text-slate-500">
                        Tahmini piyasa değeri
                      </p>
                      <p className="mt-2 text-lg font-black text-slate-900">
                        1.880.000–1.980.000 TL
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white bg-white/80 p-4">
                      <p className="text-xs font-semibold text-slate-500">
                        Fiyat değerlendirmesi
                      </p>
                      <p className="mt-2 text-lg font-black text-emerald-600">
                        Piyasaya uygun
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white bg-white/80 p-4">
                      <p className="text-xs font-semibold text-slate-500">
                        İlan güven puanı
                      </p>
                      <p className="mt-2 text-lg font-black text-blue-600">
                        92 / 100
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                    <strong>AI önerisi:</strong> Satın almadan önce ekspertiz
                    raporunu, bakım kayıtlarını ve kilometre bilgisini doğrulayın.
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-black">Konum</h2>

              <div className="flex min-h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-center">
                <div>
                  <div className="mb-3 text-4xl">📍</div>
                  <p className="font-bold text-slate-800">
                    Başakşehir, İstanbul
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Güvenlik nedeniyle yaklaşık konum gösterilmektedir.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="sticky top-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Satıcı</p>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 text-lg font-black text-white">
                  MK
                </div>

                <div>
                  <h3 className="font-black">Mehmet Kaya</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Bireysel satıcı
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-center">
                <div>
                  <p className="text-lg font-black">4.9</p>
                  <p className="text-xs text-slate-500">Satıcı puanı</p>
                </div>

                <div>
                  <p className="text-lg font-black">8</p>
                  <p className="text-xs text-slate-500">Aktif ilan</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => setTelefonAcik(!telefonAcik)}
                  className="w-full rounded-xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  {telefonAcik ? "0555 123 45 67" : "☎ Telefonu Göster"}
                </button>

                <a
                  href="https://wa.me/905551234567?text=Merhaba,%20AL-SAT%20AI%20üzerindeki%20ilanınızla%20ilgileniyorum."
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full rounded-xl bg-green-500 px-5 py-4 text-center text-sm font-black text-white transition hover:bg-green-600"
                >
                  WhatsApp ile Yaz
                </a>

                <button
                  type="button"
                  onClick={() =>
                    bildirimGoster("Mesajlaşma sistemi yakında açılacak.")
                  }
                  className="w-full rounded-xl border border-slate-200 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  ✉ Satıcıya Mesaj Gönder
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-bold text-blue-900">
                  Güvenli alışveriş uyarısı
                </p>
                <p className="mt-2 text-xs leading-5 text-blue-700">
                  Görmediğiniz ürün için ödeme yapmayın. Kapora göndermeden önce
                  satıcıyı ve ilan bilgilerini doğrulayın.
                </p>
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-600">SİZE ÖZEL</p>
              <h2 className="mt-1 text-2xl font-black">Benzer ilanlar</h2>
            </div>

            <a
              href="/ilanlar"
              className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
            >
              Tümünü Gör →
            </a>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benzerIlanlar.map((ilan) => (
              <a
                href={`/ilan/${ilan.id}`}
                key={ilan.id}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-200">
                  <img
                    src={ilan.foto}
                    alt={ilan.baslik}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="p-5">
                  <h3 className="line-clamp-2 font-black">{ilan.baslik}</h3>
                  <p className="mt-3 text-xl font-black text-emerald-600">
                    {ilan.fiyat}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">{ilan.konum}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      </section>

      <footer className="mt-14 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© 2026 AL-SAT AI. Tüm hakları saklıdır.</p>

          <div className="flex gap-5">
            <a href="#" className="hover:text-emerald-600">
              Güvenli Alışveriş
            </a>
            <a href="#" className="hover:text-emerald-600">
              Yardım
            </a>
            <a href="#" className="hover:text-emerald-600">
              İletişim
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}