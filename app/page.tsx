"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const categories = [
  {
    title: "Emlak",
    description: "Konut, arsa, iş yeri ve projeler",
    icon: "🏠",
    count: "74.650 ilan",
  },
  {
    title: "Vasıta",
    description: "Otomobil, ticari araç ve karavan",
    icon: "🚗",
    count: "42.840 ilan",
  },
  {
    title: "Motosiklet",
    description: "Motosiklet, scooter ve ATV",
    icon: "🏍️",
    count: "7.320 ilan",
  },
  {
    title: "Yedek Parça",
    description: "Araç parçaları ve aksesuarları",
    icon: "⚙️",
    count: "18.760 ilan",
  },
  {
    title: "İkinci El",
    description: "Elektronik, ev ve yaşam",
    icon: "📱",
    count: "27.400 ilan",
  },
  {
    title: "İş İlanları",
    description: "Tam zamanlı ve yarı zamanlı işler",
    icon: "💼",
    count: "12.580 ilan",
  },
  {
    title: "Hizmetler",
    description: "Usta, nakliye, temizlik ve bakım",
    icon: "🛠️",
    count: "9.240 ilan",
  },
  {
    title: "Hayvanlar",
    description: "Evcil hayvanlar ve ihtiyaçları",
    icon: "🐾",
    count: "5.680 ilan",
  },
];

const featuredListings = [
  {
    title: "2022 Model Temiz Aile Aracı",
    location: "İstanbul, Başakşehir",
    price: "1.245.000 TL",
    category: "Vasıta",
    image: "🚙",
  },
  {
    title: "Site İçerisinde 3+1 Daire",
    location: "İstanbul, Küçükçekmece",
    price: "5.750.000 TL",
    category: "Emlak",
    image: "🏢",
  },
  {
    title: "Garantili Akıllı Telefon",
    location: "Ankara, Çankaya",
    price: "32.500 TL",
    category: "İkinci El",
    image: "📱",
  },
];

export default function Home() {
  const [kullaniciVar, setKullaniciVar] = useState(false);
  const [oturumKontrolEdiliyor, setOturumKontrolEdiliyor] = useState(true);

  useEffect(() => {
    async function oturumuKontrolEt() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setKullaniciVar(Boolean(session?.user));
      setOturumKontrolEdiliyor(false);
    }

    oturumuKontrolEt();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setKullaniciVar(Boolean(session?.user));
      setOturumKontrolEdiliyor(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function cikisYap() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Çıkış yapılamadı: " + error.message);
      return;
    }

    setKullaniciVar(false);
    window.location.href = "/";
  }

  return (
    <>
      <main>
        <header className="header">
          <div className="container header-content">
            <Link href="/" className="logo">
              <span className="logo-icon">AI</span>
              <span>AL-SAT AI</span>
            </Link>

            <nav className="nav">
              <a href="#kategoriler">Kategoriler</a>
              <Link href="/ilan">İlanlar</Link>
              <a href="#yapay-zeka">Yapay Zekâ</a>
            </nav>

            <div className="header-buttons">
              {!oturumKontrolEdiliyor && kullaniciVar ? (
                <>
                  <Link href="/ilanlarim" className="login-button">
                    Benim İlanlarım
                  </Link>

                  <button
                    type="button"
                    onClick={cikisYap}
                    className="logout-button"
                  >
                    Çıkış Yap
                  </button>
                </>
              ) : !oturumKontrolEdiliyor ? (
                <Link href="/giris" className="login-button">
                  Giriş Yap
                </Link>
              ) : null}

              <Link href="/ilan-ver" className="create-button">
                + Ücretsiz İlan Ver
              </Link>
            </div>
          </div>
        </header>

        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-content">
              <div className="hero-badge">
                ✨ Türkiye’nin yapay zekâ destekli ilan platformu
              </div>

              <h1>
                Aradığını bul,
                <span> elindekini kolayca sat.</span>
              </h1>

              <p>
                Ev, araç, arsa, ikinci el ürün ve iş ilanlarını tek platformda
                keşfet. Yapay zekâ desteğiyle ilanını saniyeler içinde hazırla.
              </p>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="Ev, araç, arsa veya ürün ara..."
                />

                <select defaultValue="">
                  <option value="" disabled>
                    Tüm Türkiye
                  </option>
                  <option>İstanbul</option>
                  <option>Ankara</option>
                  <option>İzmir</option>
                  <option>Bursa</option>
                  <option>Antalya</option>
                </select>

                <Link href="/ilan" className="search-button">
                  🔍 İlan Ara
                </Link>
              </div>

              <div className="hero-features">
                <span>✓ Güvenli ilanlar</span>
                <span>✓ Akıllı öneriler</span>
                <span>✓ Ücretsiz başlangıç</span>
              </div>
            </div>

            <div className="ai-card">
              <div className="robot">🤖</div>
              <div className="ai-label">AL-SAT AI ASİSTANI</div>

              <h2>İlanını saniyeler içinde hazırla</h2>

              <p>
                Fotoğrafları yükle; yapay zekâ ürünü tanısın, uygun kategoriyi
                seçsin ve güçlü bir ilan metni hazırlasın.
              </p>

              <div className="upload-area">
                <span>📷</span>
                <strong>Fotoğrafları buraya yükle</strong>
                <small>JPG, PNG veya WEBP</small>
              </div>

              <Link href="/ilan-ver" className="ai-button">
                ✨ Yapay Zekâ ile İlan Oluştur
              </Link>
            </div>
          </div>
        </section>

        <section className="stats">
          <div className="container stats-grid">
            <div>
              <strong>1.248</strong>
              <span>Bugün eklenen ilan</span>
            </div>

            <div>
              <strong>120.000+</strong>
              <span>Aktif ilan</span>
            </div>

            <div>
              <strong>75.000+</strong>
              <span>Kullanıcı</span>
            </div>

            <div>
              <strong>81</strong>
              <span>Şehir</span>
            </div>

            <div>
              <strong>7/24</strong>
              <span>Akıllı destek</span>
            </div>
          </div>
        </section>

        <section id="kategoriler" className="section categories-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">KATEGORİLER</span>
                <h2>Ne arıyorsunuz?</h2>
                <p>Binlerce ilan arasından ihtiyacınız olanı kolayca bulun.</p>
              </div>

              <button type="button" className="outline-button">
                Tüm kategoriler →
              </button>
            </div>

            <div className="category-grid">
              {categories.map((category) => (
                <article className="category-card" key={category.title}>
                  <div className="category-icon">{category.icon}</div>

                  <div>
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                    <span>{category.count}</span>
                  </div>

                  <div className="arrow">→</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="ilanlar" className="section listings-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ÖNE ÇIKAN İLANLAR</span>
                <h2>Sizin için seçtiklerimiz</h2>
                <p>Yeni ve dikkat çeken ilanları hemen inceleyin.</p>
              </div>

              <Link href="/ilan" className="outline-button">
                Tüm ilanlar →
              </Link>
            </div>

            <div className="listing-grid">
              {featuredListings.map((listing) => (
                <article className="listing-card" key={listing.title}>
                  <div className="listing-image">
                    <span>{listing.image}</span>
                    <button type="button" aria-label="Favorilere ekle">
                      ♡
                    </button>
                    <small>{listing.category}</small>
                  </div>

                  <div className="listing-content">
                    <h3>{listing.title}</h3>
                    <p>📍 {listing.location}</p>
                    <strong>{listing.price}</strong>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="yapay-zeka" className="ai-section">
          <div className="container ai-section-content">
            <div>
              <span className="eyebrow light">AL-SAT AI TEKNOLOJİSİ</span>

              <h2>Fotoğrafını yükle, ilanını yapay zekâ hazırlasın.</h2>

              <p>
                Yapay zekâ görselleri analiz eder, ürünün kategorisini belirler
                ve etkileyici başlık ile açıklama önerileri oluşturur.
              </p>

              <div className="ai-benefits">
                <span>✓ Otomatik kategori seçimi</span>
                <span>✓ Profesyonel ilan açıklaması</span>
                <span>✓ Daha hızlı ilan oluşturma</span>
              </div>
            </div>

            <Link href="/ilan-ver" className="white-button">
              Hemen İlan Oluştur →
            </Link>
          </div>
        </section>

        <footer className="footer">
          <div className="container footer-grid">
            <div>
              <Link href="/" className="logo footer-logo">
                <span className="logo-icon">AI</span>
                <span>AL-SAT AI</span>
              </Link>

              <p>
                Türkiye’nin yeni nesil yapay zekâ destekli ilan platformu.
              </p>
            </div>

            <div>
              <h3>Hızlı bağlantılar</h3>
              <a href="#kategoriler">Kategoriler</a>
              <a href="#ilanlar">Öne çıkan ilanlar</a>
              <Link href="/ilan-ver">İlan ver</Link>
            </div>

            <div>
              <h3>Hesabım</h3>
              <Link href="/giris">Giriş yap</Link>
              <Link href="/kayit">Kayıt ol</Link>
              <Link href="/ilanlarim">Benim ilanlarım</Link>
              <a href="#">Favorilerim</a>
            </div>

            <div>
              <h3>Destek</h3>
              <a href="#">Yardım merkezi</a>
              <a href="#">Güvenli alışveriş</a>
              <a href="#">İletişim</a>
            </div>
          </div>

          <div className="container footer-bottom">
            <span>© 2026 AL-SAT AI. Tüm hakları saklıdır.</span>
            <span>Gizlilik · Kullanım Koşulları</span>
          </div>
        </footer>
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          color: #12212f;
          background: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button,
        input,
        select {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .container {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.95);
          border-bottom: 1px solid #e4eceb;
          backdrop-filter: blur(14px);
        }

        .header-content {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 22px;
          font-weight: 900;
          color: #12364d;
        }

        .logo-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          color: white;
          font-size: 15px;
          border-radius: 13px;
          background: linear-gradient(135deg, #08a88a, #1674ce);
          box-shadow: 0 8px 22px rgba(16, 139, 157, 0.25);
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 28px;
          color: #4f626d;
          font-size: 15px;
          font-weight: 700;
        }

        .nav a:hover {
          color: #078f78;
        }

        .header-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .login-button,
        .logout-button,
        .create-button {
          padding: 12px 17px;
          border-radius: 12px;
          font-weight: 800;
        }

        .login-button {
          color: #31505e;
        }

        .logout-button {
          color: #b42318;
          background: #fff;
          border: 1px solid #fecaca;
        }

        .logout-button:hover {
          background: #fff1f2;
        }

        .create-button {
          color: white;
          background: linear-gradient(135deg, #079b80, #1676cc);
          box-shadow: 0 9px 22px rgba(19, 123, 154, 0.22);
        }

        .hero {
          position: relative;
          overflow: hidden;
          padding: 80px 0;
          background:
            radial-gradient(circle at 15% 20%, rgba(31, 192, 158, 0.15), transparent 32%),
            radial-gradient(circle at 90% 10%, rgba(26, 118, 206, 0.14), transparent 30%),
            linear-gradient(135deg, #f2fffb 0%, #f5f9ff 100%);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          align-items: center;
          gap: 54px;
        }

        .hero-badge {
          display: inline-flex;
          padding: 9px 14px;
          color: #087d6a;
          background: #e0f7f0;
          border: 1px solid #bfeade;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 800;
        }

        .hero h1 {
          max-width: 720px;
          margin: 24px 0 20px;
          color: #102f42;
          font-size: clamp(44px, 6vw, 72px);
          line-height: 1.05;
          letter-spacing: -3px;
        }

        .hero h1 span {
          display: block;
          color: #098e79;
        }

        .hero-content > p {
          max-width: 680px;
          margin: 0;
          color: #58707c;
          font-size: 19px;
          line-height: 1.75;
        }

        .search-box {
          margin-top: 32px;
          padding: 8px;
          display: grid;
          grid-template-columns: 1fr 180px auto;
          gap: 8px;
          background: white;
          border: 1px solid #dbe8e6;
          border-radius: 18px;
          box-shadow: 0 16px 45px rgba(38, 85, 98, 0.13);
        }

        .search-box input,
        .search-box select {
          min-width: 0;
          padding: 15px;
          color: #263e49;
          background: white;
          border: none;
          outline: none;
        }

        .search-box select {
          border-left: 1px solid #dce6e8;
        }

        .search-box .search-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px 22px;
          color: white;
          background: linear-gradient(135deg, #069a80, #1676ca);
          border: none;
          border-radius: 12px;
          font-weight: 900;
          text-decoration: none;
        }

        .hero-features {
          margin-top: 23px;
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          color: #49616d;
          font-size: 14px;
          font-weight: 700;
        }

        .hero-features span::first-letter {
          color: #07927a;
        }

        .ai-card {
          padding: 30px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #d8e9e6;
          border-radius: 28px;
          box-shadow: 0 25px 65px rgba(34, 81, 93, 0.16);
        }

        .robot {
          width: 65px;
          height: 65px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #dff8f0, #e3efff);
          border-radius: 20px;
          font-size: 34px;
        }

        .ai-label {
          margin-top: 22px;
          color: #078a75;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .ai-card h2 {
          margin: 10px 0 13px;
          color: #17394a;
          font-size: 28px;
          line-height: 1.25;
        }

        .ai-card p {
          margin: 0;
          color: #667d88;
          line-height: 1.7;
        }

        .upload-area {
          margin: 24px 0 16px;
          padding: 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: #47616d;
          background: #f7fbfb;
          border: 2px dashed #b8d9d2;
          border-radius: 17px;
          text-align: center;
        }

        .upload-area span {
          font-size: 32px;
        }

        .upload-area small {
          color: #82949c;
        }

        .ai-button {
          width: 100%;
          padding: 16px;
          display: block;
          color: white;
          background: linear-gradient(135deg, #079b80, #1774c9);
          border-radius: 14px;
          text-align: center;
          font-weight: 900;
        }

        .stats {
          background: #103b4e;
        }

        .stats-grid {
          min-height: 125px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          align-items: center;
        }

        .stats-grid div {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          color: white;
          text-align: center;
          border-right: 1px solid rgba(255, 255, 255, 0.13);
        }

        .stats-grid div:last-child {
          border-right: none;
        }

        .stats-grid strong {
          font-size: 25px;
        }

        .stats-grid span {
          color: #bcd2d9;
          font-size: 13px;
        }

        .section {
          padding: 85px 0;
        }

        .categories-section {
          background: #ffffff;
        }

        .listings-section {
          background: #f5f9fa;
        }

        .section-heading {
          margin-bottom: 35px;
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 25px;
        }

        .eyebrow {
          color: #088d76;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .eyebrow.light {
          color: #b8fff0;
        }

        .section-heading h2 {
          margin: 9px 0 8px;
          color: #17394a;
          font-size: 38px;
          letter-spacing: -1.4px;
        }

        .section-heading p {
          margin: 0;
          color: #71848c;
          line-height: 1.6;
        }

        .outline-button {
          padding: 12px 17px;
          color: #0a806e;
          background: white;
          border: 1px solid #bedbd5;
          border-radius: 12px;
          font-weight: 800;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .category-card {
          position: relative;
          min-height: 205px;
          padding: 25px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: white;
          border: 1px solid #e1ecea;
          border-radius: 20px;
          transition: 0.25s ease;
        }

        .category-card:hover {
          transform: translateY(-6px);
          border-color: #8bcfc0;
          box-shadow: 0 18px 35px rgba(35, 89, 99, 0.12);
        }

        .category-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          background: #eaf8f5;
          border-radius: 16px;
          font-size: 27px;
        }

        .category-card h3 {
          margin: 20px 0 7px;
          color: #183b4b;
          font-size: 19px;
        }

        .category-card p {
          margin: 0 0 12px;
          color: #74878e;
          font-size: 14px;
          line-height: 1.5;
        }

        .category-card span {
          color: #0a8c76;
          font-size: 13px;
          font-weight: 800;
        }

        .arrow {
          position: absolute;
          top: 26px;
          right: 24px;
          color: #8aa1a7;
          font-size: 20px;
        }

        .listing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }

        .listing-card {
          overflow: hidden;
          background: white;
          border: 1px solid #deebea;
          border-radius: 21px;
          transition: 0.25s ease;
        }

        .listing-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 38px rgba(29, 77, 88, 0.13);
        }

        .listing-image {
          position: relative;
          height: 230px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #dff4ef, #e7f0fb);
        }

        .listing-image > span {
          font-size: 86px;
        }

        .listing-image button {
          position: absolute;
          top: 15px;
          right: 15px;
          width: 43px;
          height: 43px;
          color: #2e5664;
          background: white;
          border: none;
          border-radius: 50%;
          font-size: 24px;
          box-shadow: 0 6px 18px rgba(28, 72, 84, 0.15);
        }

        .listing-image small {
          position: absolute;
          bottom: 15px;
          left: 15px;
          padding: 7px 10px;
          color: #087a68;
          background: white;
          border-radius: 8px;
          font-weight: 800;
        }

        .listing-content {
          padding: 21px;
        }

        .listing-content h3 {
          margin: 0 0 10px;
          color: #193b4b;
          font-size: 18px;
        }

        .listing-content p {
          margin: 0 0 18px;
          color: #788b92;
          font-size: 14px;
        }

        .listing-content strong {
          color: #078873;
          font-size: 21px;
        }

        .ai-section {
          padding: 70px 0;
          color: white;
          background:
            radial-gradient(circle at 80% 20%, rgba(31, 208, 181, 0.3), transparent 32%),
            linear-gradient(135deg, #0d4454, #087c78);
        }

        .ai-section-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 50px;
        }

        .ai-section-content > div {
          max-width: 760px;
        }

        .ai-section h2 {
          margin: 13px 0 15px;
          font-size: 39px;
          line-height: 1.2;
          letter-spacing: -1px;
        }

        .ai-section p {
          margin: 0;
          color: #cae6e7;
          font-size: 17px;
          line-height: 1.7;
        }

        .ai-benefits {
          margin-top: 23px;
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          color: #e1f7f3;
          font-size: 14px;
          font-weight: 700;
        }

        .white-button {
          flex-shrink: 0;
          padding: 16px 21px;
          color: #08766d;
          background: white;
          border-radius: 13px;
          font-weight: 900;
        }

        .footer {
          padding: 65px 0 25px;
          color: #c3d3d8;
          background: #0d2835;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 45px;
        }

        .footer-logo {
          color: white;
        }

        .footer-grid p {
          max-width: 340px;
          line-height: 1.7;
        }

        .footer-grid h3 {
          margin: 6px 0 18px;
          color: white;
          font-size: 15px;
        }

        .footer-grid > div:not(:first-child) {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-grid a:hover {
          color: white;
        }

        .footer-bottom {
          margin-top: 45px;
          padding-top: 22px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 13px;
        }

        @media (max-width: 980px) {
          .nav {
            display: none;
          }

          .hero-grid {
            grid-template-columns: 1fr;
          }

          .category-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .listing-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .stats-grid div {
            border-right: none;
          }

          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .container {
            width: min(100% - 24px, 1180px);
          }

          .header-content {
            min-height: 68px;
          }

          .header-buttons .login-button {
            display: none;
          }

          .create-button {
            padding: 10px 12px;
            font-size: 13px;
          }

          .hero {
            padding: 55px 0;
          }

          .hero h1 {
            font-size: 44px;
            letter-spacing: -2px;
          }

          .hero-content > p {
            font-size: 16px;
          }

          .search-box {
            grid-template-columns: 1fr;
          }

          .search-box select {
            border-top: 1px solid #dce6e8;
            border-left: none;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .section {
            padding: 60px 0;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .section-heading h2 {
            font-size: 31px;
          }

          .category-grid,
          .listing-grid {
            grid-template-columns: 1fr;
          }

          .ai-section-content {
            align-items: flex-start;
            flex-direction: column;
          }

          .ai-section h2 {
            font-size: 32px;
          }

          .footer-grid {
            grid-template-columns: 1fr;
          }

          .footer-bottom {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}