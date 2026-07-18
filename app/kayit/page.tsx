"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function KayitPage() {
  const [adSoyad, setAdSoyad] = useState("");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  async function hesapOlustur() {
    setMesaj("");

    if (!adSoyad || !email || !sifre) {
      setMesaj("Lütfen tüm alanları doldurun.");
      return;
    }

    if (sifre.length < 6) {
      setMesaj("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setYukleniyor(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: sifre,
      options: {
        data: {
          ad_soyad: adSoyad,
        },
      },
    });

    setYukleniyor(false);

    if (error) {
      setMesaj("Kayıt oluşturulamadı: " + error.message);
      return;
    }

    setMesaj(
      "Kayıt başarılı. E-posta adresinize gelen doğrulama bağlantısını kontrol edin."
    );

    setAdSoyad("");
    setEmail("");
    setSifre("");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-green-600 mb-6">
          AL-SAT AI
        </h1>

        <h2 className="text-xl font-semibold text-center mb-6">
          Yeni Hesap Oluştur
        </h2>

        <input
          type="text"
          placeholder="Ad Soyad"
          value={adSoyad}
          onChange={(e) => setAdSoyad(e.target.value)}
          className="w-full border rounded-lg p-3 mb-4"
        />

        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg p-3 mb-4"
        />

        <input
          type="password"
          placeholder="Şifre"
          value={sifre}
          onChange={(e) => setSifre(e.target.value)}
          className="w-full border rounded-lg p-3 mb-4"
        />

        <button
          type="button"
          onClick={hesapOlustur}
          disabled={yukleniyor}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {yukleniyor ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
        </button>

        {mesaj && (
          <p className="text-center mt-4 text-sm text-gray-700">{mesaj}</p>
        )}

        <p className="text-center mt-6">
          Zaten hesabın var mı?
          <a href="/giris" className="text-blue-600 ml-2">
            Giriş Yap
          </a>
        </p>
      </div>
    </main>
  );
}