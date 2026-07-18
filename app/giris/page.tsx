"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function GirisPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  async function girisYap() {
    if (!email || !sifre) {
      alert("Lütfen e-posta ve şifrenizi yazın.");
      return;
    }

    setYukleniyor(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: sifre,
    });

    setYukleniyor(false);

    if (error) {
      alert("Giriş başarısız: " + error.message);
      return;
    }

    router.replace("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-blue-600">
          AL-SAT AI
        </h1>

        <h2 className="mb-6 text-center text-xl font-semibold">
          Hesabına Giriş Yap
        </h2>

        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border p-3"
        />

        <input
          type="password"
          placeholder="Şifre"
          value={sifre}
          onChange={(e) => setSifre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              girisYap();
            }
          }}
          className="mb-6 w-full rounded-lg border p-3"
        />

        <button
          type="button"
          onClick={girisYap}
          disabled={yukleniyor}
          className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {yukleniyor ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>

        <p className="mt-6 text-center text-gray-600">
          Hesabın yok mu?{" "}
          <a href="/kayit" className="font-semibold text-blue-600">
            Kayıt Ol
          </a>
        </p>
      </div>
    </main>
  );
}