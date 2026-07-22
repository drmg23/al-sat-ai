"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");

  async function sifirlamaBaglantisiGonder(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!email.trim()) {
      setHata("Lütfen e-posta adresinizi yazın.");
      return;
    }

    setGonderiliyor(true);
    setMesaj("");
    setHata("");

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/sifre-yenile`,
    });

    setGonderiliyor(false);

    if (error) {
      setHata("Sıfırlama e-postası gönderilemedi: " + error.message);
      return;
    }

    setMesaj(
      "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin."
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <Link href="/" className="block">
          <h1 className="mb-6 text-center text-3xl font-bold text-blue-600">
            AL-SAT AI
          </h1>
        </Link>

        <h2 className="text-center text-2xl font-bold text-gray-900">
          Şifremi Unuttum
        </h2>

        <p className="mb-6 mt-3 text-center leading-6 text-gray-600">
          Kayıtlı e-posta adresinizi yazın. Yeni şifre belirlemeniz için size
          güvenli bir bağlantı gönderelim.
        </p>

        <form onSubmit={sifirlamaBaglantisiGonder}>
          <input
            type="email"
            placeholder="E-posta adresiniz"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border p-3"
          />

          {hata && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
              {hata}
            </p>
          )}

          {mesaj && (
            <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-semibold leading-6 text-green-700">
              {mesaj}
            </p>
          )}

          <button
            type="submit"
            disabled={gonderiliyor}
            className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {gonderiliyor ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link href="/giris" className="font-semibold text-blue-600">
            ← Giriş sayfasına dön
          </Link>
        </p>
      </div>
    </main>
  );
}