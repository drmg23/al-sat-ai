"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function SifreYenilePage() {
  const router = useRouter();

  const [sifre, setSifre] = useState("");
  const [sifreTekrar, setSifreTekrar] = useState("");
  const [baglantiHazir, setBaglantiHazir] = useState(false);
  const [kontrolEdiliyor, setKontrolEdiliyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");

  useEffect(() => {
    let aktif = true;

    async function oturumuKontrolEt() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!aktif) return;

      if (session?.user) {
        setBaglantiHazir(true);
        setHata("");
      } else {
        setHata(
          "Şifre yenileme bağlantısı geçersiz veya süresi dolmuş olabilir."
        );
      }

      setKontrolEdiliyor(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!aktif) return;

      if (event === "PASSWORD_RECOVERY" && session?.user) {
        setBaglantiHazir(true);
        setKontrolEdiliyor(false);
        setHata("");
      }
    });

    oturumuKontrolEt();

    return () => {
      aktif = false;
      subscription.unsubscribe();
    };
  }, []);

  async function sifreyiGuncelle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (sifre.length < 6) {
      setHata("Yeni şifreniz en az 6 karakter olmalıdır.");
      return;
    }

    if (sifre !== sifreTekrar) {
      setHata("Yazdığınız şifreler birbiriyle aynı değil.");
      return;
    }

    setKaydediliyor(true);
    setHata("");

    const { error } = await supabase.auth.updateUser({ password: sifre });

    if (error) {
      setHata("Şifre güncellenemedi: " + error.message);
      setKaydediliyor(false);
      return;
    }

    await supabase.auth.signOut();
    alert("Şifreniz başarıyla yenilendi. Yeni şifrenizle giriş yapabilirsiniz.");
    router.replace("/giris");
  }

  if (kontrolEdiliyor) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="font-semibold text-gray-700">
          Şifre yenileme bağlantısı kontrol ediliyor...
        </p>
      </main>
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
          Yeni Şifre Belirle
        </h2>

        {baglantiHazir ? (
          <form onSubmit={sifreyiGuncelle} className="mt-6">
            <input
              type="password"
              placeholder="Yeni şifre"
              value={sifre}
              onChange={(event) => setSifre(event.target.value)}
              className="mb-4 w-full rounded-lg border p-3"
            />

            <input
              type="password"
              placeholder="Yeni şifre tekrar"
              value={sifreTekrar}
              onChange={(event) => setSifreTekrar(event.target.value)}
              className="w-full rounded-lg border p-3"
            />

            {hata && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
                {hata}
              </p>
            )}

            <button
              type="submit"
              disabled={kaydediliyor}
              className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {kaydediliyor ? "Kaydediliyor..." : "Yeni Şifreyi Kaydet"}
            </button>
          </form>
        ) : (
          <div className="mt-6 text-center">
            <p className="rounded-lg bg-red-50 p-4 font-semibold leading-6 text-red-700">
              {hata}
            </p>

            <Link
              href="/sifremi-unuttum"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white"
            >
              Yeni Bağlantı İste
            </Link>
          </div>
        )}
      </div>
     </main>
  );
}