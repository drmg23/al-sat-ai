"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const categories = [
  "Emlak",
  "Vasıta",
  "Motosiklet",
  "Yedek Parça",
  "İkinci El",
  "İş İlanları",
  "Hizmetler",
  "Hayvanlar",
];

const cities = [
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

type GeneratedListing = {
  title: string;
  description: string;
  suggestedPrice: number;
  priceNote: string;
};

export default function IlanVerPage() {
  const router = useRouter();
  const [aiDetails, setAiDetails] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    if (files.length > 6) {
      alert("En fazla 6 fotoğraf yükleyebilirsiniz.");
      return;
    }

    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      alert("Her fotoğraf en fazla 5 MB olabilir.");
      return;
    }

    const imageReaders = files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Fotoğraf okunamadı."));
          reader.readAsDataURL(file);
        })
    );

    Promise.all(imageReaders)
      .then((results) => {
        setImages(results);
        setImageFiles(files);
      })
      .catch(() => alert("Fotoğraflar yüklenirken bir sorun oluştu."));
  }

  function removeImage(indexToRemove: number) {
    setImages((currentImages) =>
      currentImages.filter((_, index) => index !== indexToRemove)
    );
    setImageFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove)
    );
  }

  async function generateListing() {
    if (!aiDetails.trim()) {
      alert("Önce ürün, araç, emlak veya arsa hakkında kısa bilgi yazın.");
      return;
    }

    if (!category) {
      alert("Önce kategori seçin.");
      return;
    }

    setIsGenerating(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Yapay zekâyı kullanmak için önce giriş yapmalısınız.");
        router.push("/giris");
        return;
      }

      const response = await fetch("/api/ilan-olustur", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          details: aiDetails.trim(),
          category,
          city,
          district: district.trim(),
          currentTitle: title.trim(),
          currentPrice: price ? Number(price) : null,
        }),
      });

      const result = (await response.json()) as
        | GeneratedListing
        | { error: string };

      if (!response.ok || "error" in result) {
        throw new Error(
          "error" in result
            ? result.error
            : "Yapay zekâ yanıtı alınamadı."
        );
      }

      setTitle(result.title.slice(0, 80));
      setDescription(result.description.slice(0, 1500));

      if (result.suggestedPrice > 0) {
        setPrice(String(Math.round(result.suggestedPrice)));
      }

      alert(
        `İlan bilgileri hazırlandı.\n\nFiyat notu: ${result.priceNote}`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Yapay zekâ kullanılırken bir hata oluştu.";
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      alert("Lütfen ilan başlığını yazın.");
      return;
    }

    if (!description.trim()) {
      alert("Lütfen ilan açıklamasını yazın.");
      return;
    }

    if (!price) {
      alert("Lütfen fiyat girin.");
      return;
    }

    if (!category) {
      alert("Lütfen kategori seçin.");
      return;
    }

    if (!city) {
      alert("Lütfen şehir seçin.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("İlan vermek için önce giriş yapmalısınız.");
        router.push("/giris");
        return;
      }

      const photoUrls: string[] = [];

      for (const file of imageFiles) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("ilan-fotograflari")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Fotoğraf yüklenemedi: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("ilan-fotograflari")
          .getPublicUrl(filePath);
        photoUrls.push(publicUrlData.publicUrl);
      }

      const { error: insertError } = await supabase.from("ilanlar").insert({
        user_id: user.id,
        baslik: title.trim(),
        aciklama: description.trim(),
        fiyat: Number(price),
        kategori: category,
        sehir: city,
        ilce: district.trim() || null,
        telefon: phone.trim() || null,
        fotograflar: photoUrls,
      });

      if (insertError) {
        throw new Error(`İlan kaydedilemedi: ${insertError.message}`);
      }

      alert("İlanınız başarıyla yayınlandı.");
      router.push("/ilan");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
            AL-SAT AI
          </div>

          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
            Yeni İlan Oluştur
          </h1>

          <p className="mt-3 text-slate-500">
            İlan bilgilerini doldurun, fotoğraflarınızı ekleyin ve ilanınızı
            hazırlayın.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl bg-white shadow-xl"
        >
          <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-blue-600 px-6 py-5 text-white sm:px-8">
            <h2 className="text-xl font-black">İlan bilgileri</h2>
            <p className="mt-1 text-sm text-white/80">
              Yıldızlı alanları eksiksiz doldurun.
            </p>
          </div>

          <div className="space-y-8 p-6 sm:p-8">
            <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-emerald-50 p-5 sm:p-6">
              <div className="flex flex-col gap-5">
                <div>
                  <div className="mb-2 inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">
                    AL-SAT AI
                  </div>

                  <h3 className="text-xl font-black text-slate-900">
                    İlanınızı yapay zekâ hazırlasın
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Satacağınız şeyin özelliklerini kısa şekilde yazın. Yapay
                    zekâ başlık, açıklama ve tahmini fiyat önerisi hazırlayacak.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Kategori
                  </label>

                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Kategori seçiniz</option>

                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Kısa bilgiler
                  </label>

                  <textarea
                    value={aiDetails}
                    onChange={(event) => setAiDetails(event.target.value)}
                    placeholder="Örneğin: 2012 Volkswagen Passat, dizel, otomatik, 185.000 km, değişensiz, bakımları yeni yapıldı..."
                    rows={4}
                    maxLength={600}
                    className="w-full resize-none rounded-xl border border-blue-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <div className="mt-1 text-right text-xs text-slate-400">
                    {aiDetails.length}/600
                  </div>
                </div>

                <button
                  type="button"
                  onClick={generateListing}
                  disabled={isGenerating}
                  className="self-start rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGenerating
                    ? "Yapay zekâ hazırlıyor..."
                    : "✨ Başlık, Açıklama ve Fiyat Öner"}
                </button>

                <p className="text-xs leading-5 text-slate-500">
                  Fiyat önerisi tahminidir. İlanı yayımlamadan önce piyasa
                  koşullarına göre kontrol edin.
                </p>
              </div>
            </section>

            <section>
              <h3 className="mb-5 text-lg font-black text-slate-900">
                Temel bilgiler
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    İlan başlığı *
                  </label>

                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    type="text"
                    placeholder="Örneğin: 2022 model temiz aile aracı"
                    maxLength={80}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />

                  <div className="mt-1 text-right text-xs text-slate-400">
                    {title.length}/80
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Kategori *
                    </label>

                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="">Kategori seçiniz</option>

                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Fiyat *
                    </label>

                    <div className="relative">
                      <input
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        type="number"
                        min="0"
                        placeholder="Örneğin: 1250000"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-14 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      />

                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                        TL
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    İlan açıklaması
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Ürünün durumunu ve önemli özelliklerini belirtin.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={generateListing}
                  disabled={isGenerating}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGenerating
                    ? "İlan hazırlanıyor..."
                    : "🤖 Yapay Zekâ ile Yenile"}
                </button>
              </div>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="İlan açıklamasını buraya yazın..."
                rows={7}
                maxLength={1500}
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />

              <div className="mt-1 text-right text-xs text-slate-400">
                {description.length}/1500
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h3 className="mb-5 text-lg font-black text-slate-900">
                Konum ve iletişim
              </h3>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Şehir *
                  </label>

                  <select
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="">Şehir seçiniz</option>

                    {cities.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    İlçe
                  </label>

                  <input
                    value={district}
                    onChange={(event) => setDistrict(event.target.value)}
                    type="text"
                    placeholder="Örneğin: Başakşehir"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Telefon numarası
                  </label>

                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h3 className="text-lg font-black text-slate-900">
                İlan fotoğrafları
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                En fazla 6 adet JPG, PNG veya WEBP fotoğraf yükleyebilirsiniz.
              </p>

              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-emerald-500 hover:bg-emerald-50">
                <span className="text-5xl">📷</span>

                <span className="mt-4 font-black text-slate-800">
                  Fotoğraf seçmek için tıklayın
                </span>

                <span className="mt-1 text-sm text-slate-500">
                  Birden fazla fotoğraf seçebilirsiniz
                </span>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {images.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {images.map((image, index) => (
                    <div
                      key={`${image.slice(0, 30)}-${index}`}
                      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={image}
                        alt={`İlan fotoğrafı ${index + 1}`}
                        className="h-40 w-full object-cover"
                      />

                      {index === 0 && (
                        <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                          Kapak
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/80 text-sm font-bold text-white transition hover:bg-red-600"
                        aria-label="Fotoğrafı kaldır"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="border-t border-slate-200 pt-8">
              <div className="rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                <strong>İlan verme ipucu:</strong> Açık ve doğru bilgiler
                girmeniz, ilanınızın daha fazla kullanıcıya ulaşmasına yardımcı
                olur.
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 px-8 py-3 font-black text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "İlan yayınlanıyor..." : "İlanı Yayınla"}
                </button>
              </div>
            </section>
          </div>
        </form>
      </div>
    </main>
  );
}