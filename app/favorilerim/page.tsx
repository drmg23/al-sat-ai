"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Ilan = {
  id: string;
  baslik: string;
  aciklama: string;
  fiyat: number;
  kategori: string;
  sehir: string;
  ilce: string | null;
  fotograflar: string[] | null;
  created_at?: string;
};

export default function FavorilerimPage() {
  const router = useRouter();
  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [silinenIlanId, setSilinenIlanId] = useState<string | null>(null);

  useEffect(() => {
    favorileriGetir();
  }, []);

  async function favorileriGetir() {
    setYukleniyor(true);
    setHata("");

    const {
      data: { user },
      error: kullaniciHatasi,
    } = await supabase.auth.getUser();

    if (kullaniciHatasi || !user) {
      router.replace("/giris");
      return;
    }

    const { data: favoriKayitlari, error: favoriHatasi } = await supabase
      .from("favoriler")
      .select("ilan_id")
      .eq("kullanici_id", user.id);

    if (favoriHatasi) {
      setHata("Favoriler alınamadı: " + favoriHatasi.message);
      setYukleniyor(false);
      return;
    }

    const ilanIdleri = (favoriKayitlari ?? []).map(
      (favori) => favori.ilan_id
    );

    if (ilanIdleri.length === 0) {
      setIlanlar([]);
      setYukleniyor(false);
      return;
    }

    const { data: ilanVerileri, error: ilanHatasi } = await supabase
      .from("ilanlar")
      .select(
        "id, baslik, aciklama, fiyat, kategori, sehir, ilce, fotograflar, created_at"
      )
      .in("id", ilanIdleri)
      .order("created_at", { ascending: false });

    if (ilanHatasi) {
      setHata("Favori ilanlar alınamadı: " + ilanHatasi.message);
      setYukleniyor(false);
      return;
    }

    setIlanlar((ilanVerileri as Ilan[]) ?? []);
    setYukleniyor(false);
  }

  async function favoridenCikar(ilanId: string) {
    setSilinenIlanId(ilanId);
    setHata("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/giris");
      return;
    }

    const { error } = await supabase
      .from("favoriler")
      .delete()
      .eq("kullanici_id", user.id)
      .eq("ilan_id", ilanId);

    if (error) {
      setHata("İlan favorilerden çıkarılamadı: " + error.message);
      setSilinenIlanId(null);
      return;
    }

    setIlanlar((mevcutIlanlar) =>
      mevcutIlanlar.filter((ilan) => ilan.id !== ilanId)
    );
    setSilinenIlanId(null);
  }

  return (
    <main className="sayfa">
      <header className="ust-menu">
        <div className="kapsayici menu-icerik">
          <Link href="/" className="logo">
            <span className="logo-isaret">AI</span>
            <span>AL-SAT AI</span>
          </Link>

          <nav>
            <Link href="/">Ana Sayfa</Link>
            <Link href="/ilan">Tüm İlanlar</Link>
            <Link href="/ilanlarim">Benim İlanlarım</Link>
          </nav>
        </div>
      </header>

      <section className="baslik-alani">
        <div className="kapsayici">
          <span className="ust-baslik">HESABIM</span>
          <h1>Favorilerim</h1>
          <p>Beğendiğiniz ve daha sonra incelemek istediğiniz ilanlar.</p>
        </div>
      </section>

      <section className="kapsayici icerik">
        {yukleniyor ? (
          <div className="durum-kutusu">
            <div className="yukleniyor-isaret">♡</div>
            <h2>Favorileriniz yükleniyor...</h2>
          </div>
        ) : hata ? (
          <div className="durum-kutusu hata-kutusu">
            <div className="durum-isaret">!</div>
            <h2>Bir sorun oluştu</h2>
            <p>{hata}</p>
            <button type="button" onClick={favorileriGetir}>
              Tekrar Dene
            </button>
          </div>
        ) : ilanlar.length === 0 ? (
          <div className="durum-kutusu">
            <div className="durum-isaret">♡</div>
            <h2>Henüz favori ilanınız yok</h2>
            <p>
              Beğendiğiniz ilanlardaki kalp düğmesine basarak onları burada
              görebilirsiniz.
            </p>
            <Link href="/ilan" className="ilanlara-git">
              İlanları İncele
            </Link>
          </div>
        ) : (
          <>
            <div className="sonuc-satiri">
              <strong>{ilanlar.length} favori ilan</strong>
              <Link href="/ilan">Yeni ilanlara göz at →</Link>
            </div>

            <div className="ilan-grid">
              {ilanlar.map((ilan) => {
                const fotograf = ilan.fotograflar?.[0];

                return (
                  <article className="ilan-karti" key={ilan.id}>
                    <div className="gorsel-alani">
                      <Link href={`/ilan/${ilan.id}`} aria-label={ilan.baslik}>
                        {fotograf ? (
                          <img src={fotograf} alt={ilan.baslik} />
                        ) : (
                          <div className="gorsel-yok">📷</div>
                        )}
                      </Link>

                      <span className="kategori">{ilan.kategori}</span>

                      <button
                        type="button"
                        className="favori-dugmesi"
                        onClick={() => favoridenCikar(ilan.id)}
                        disabled={silinenIlanId === ilan.id}
                        aria-label="Favorilerden çıkar"
                        title="Favorilerden çıkar"
                      >
                        {silinenIlanId === ilan.id ? "…" : "♥"}
                      </button>
                    </div>

                    <div className="kart-icerik">
                      <Link href={`/ilan/${ilan.id}`}>
                        <h2>{ilan.baslik}</h2>
                      </Link>

                      <p className="konum">
                        📍 {ilan.sehir}
                        {ilan.ilce ? ` / ${ilan.ilce}` : ""}
                      </p>

                      <p className="aciklama">
                        {ilan.aciklama || "İlan açıklaması bulunmuyor."}
                      </p>

                      <div className="kart-alt">
                        <strong>
                          {Number(ilan.fiyat).toLocaleString("tr-TR")} TL
                        </strong>
                        <Link href={`/ilan/${ilan.id}`}>İncele →</Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          color: #173746;
          background: #f5f9fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button {
          font: inherit;
          cursor: pointer;
        }

        .sayfa {
          min-height: 100vh;
        }

        .kapsayici {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        .ust-menu {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.96);
          border-bottom: 1px solid #dfeae9;
          backdrop-filter: blur(12px);
        }

        .menu-icerik {
          min-height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
        }

        .logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #12394b;
          font-size: 21px;
          font-weight: 900;
        }

        .logo-isaret {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          color: white;
          background: linear-gradient(135deg, #079b80, #1676cc);
          border-radius: 13px;
          font-size: 14px;
        }

        nav {
          display: flex;
          gap: 25px;
          color: #526a75;
          font-size: 14px;
          font-weight: 700;
        }

        nav a:hover {
          color: #078d76;
        }

        .baslik-alani {
          padding: 58px 0;
          color: white;
          background:
            radial-gradient(circle at 85% 15%, rgba(53, 214, 187, 0.28), transparent 30%),
            linear-gradient(135deg, #0d4353, #087c77);
        }

        .ust-baslik {
          color: #b9fff0;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1.8px;
        }

        .baslik-alani h1 {
          margin: 10px 0 10px;
          font-size: 43px;
        }

        .baslik-alani p {
          margin: 0;
          color: #d2e8e9;
          font-size: 17px;
        }

        .icerik {
          padding: 50px 0 80px;
        }

        .sonuc-satiri {
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .sonuc-satiri strong {
          font-size: 18px;
        }

        .sonuc-satiri a {
          color: #087f6d;
          font-weight: 800;
        }

        .ilan-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .ilan-karti {
          overflow: hidden;
          background: white;
          border: 1px solid #dce9e7;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(30, 74, 84, 0.07);
          transition: 0.2s ease;
        }

        .ilan-karti:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 38px rgba(30, 74, 84, 0.12);
        }

        .gorsel-alani {
          position: relative;
          height: 225px;
          overflow: hidden;
          background: linear-gradient(135deg, #e0f4ef, #e8f1fb);
        }

        .gorsel-alani > a,
        .gorsel-alani img,
        .gorsel-yok {
          width: 100%;
          height: 100%;
          display: block;
        }

        .gorsel-alani img {
          object-fit: cover;
        }

        .gorsel-yok {
          display: grid;
          place-items: center;
          font-size: 58px;
        }

        .kategori {
          position: absolute;
          left: 14px;
          bottom: 14px;
          padding: 7px 10px;
          color: #087b69;
          background: white;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 900;
          box-shadow: 0 5px 15px rgba(24, 66, 76, 0.13);
        }

        .favori-dugmesi {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          color: #e53955;
          background: white;
          border: none;
          border-radius: 50%;
          font-size: 23px;
          box-shadow: 0 7px 20px rgba(24, 66, 76, 0.18);
        }

        .favori-dugmesi:disabled {
          opacity: 0.65;
        }

        .kart-icerik {
          padding: 21px;
        }

        .kart-icerik h2 {
          margin: 0 0 11px;
          color: #173a4b;
          font-size: 19px;
          line-height: 1.35;
        }

        .konum {
          margin: 0 0 12px;
          color: #70858e;
          font-size: 14px;
        }

        .aciklama {
          min-height: 44px;
          margin: 0 0 20px;
          display: -webkit-box;
          overflow: hidden;
          color: #647982;
          font-size: 14px;
          line-height: 1.55;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .kart-alt {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .kart-alt strong {
          color: #078873;
          font-size: 21px;
        }

        .kart-alt a {
          color: #176fae;
          font-size: 14px;
          font-weight: 800;
        }

        .durum-kutusu {
          max-width: 650px;
          margin: 30px auto;
          padding: 55px 28px;
          background: white;
          border: 1px solid #dce9e7;
          border-radius: 22px;
          text-align: center;
          box-shadow: 0 12px 35px rgba(30, 74, 84, 0.08);
        }

        .durum-isaret,
        .yukleniyor-isaret {
          width: 70px;
          height: 70px;
          margin: 0 auto 20px;
          display: grid;
          place-items: center;
          color: #e53955;
          background: #fff0f3;
          border-radius: 50%;
          font-size: 38px;
        }

        .yukleniyor-isaret {
          animation: nabiz 1.1s infinite alternate;
        }

        .durum-kutusu h2 {
          margin: 0 0 12px;
          color: #173a4b;
        }

        .durum-kutusu p {
          margin: 0 auto 24px;
          max-width: 480px;
          color: #70848c;
          line-height: 1.65;
        }

        .ilanlara-git,
        .durum-kutusu button {
          display: inline-block;
          padding: 13px 19px;
          color: white;
          background: linear-gradient(135deg, #079b80, #1676cc);
          border: none;
          border-radius: 11px;
          font-weight: 900;
        }

        .hata-kutusu .durum-isaret {
          color: #b42318;
          background: #fff1f0;
        }

        @keyframes nabiz {
          from {
            transform: scale(0.92);
          }
          to {
            transform: scale(1.08);
          }
        }

        @media (max-width: 950px) {
          .ilan-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 680px) {
          .kapsayici {
            width: min(100% - 24px, 1180px);
          }

          nav {
            display: none;
          }

          .baslik-alani {
            padding: 42px 0;
          }

          .baslik-alani h1 {
            font-size: 34px;
          }

          .ilan-grid {
            grid-template-columns: 1fr;
          }

          .sonuc-satiri {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}