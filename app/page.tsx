"use client";

import { useState } from "react";

const categories = [
  "Sıcak İçecekler",
  "Soğuk İçecekler",
  "Kahvaltı",
  "Yemek",
  "Tatlı",
  "Çerez",
];

const products = [
  {
    name: "Türk Kahvesi",
    category: "Sıcak İçecekler",
    description: "Geleneksel Türk kahvesi.",
    price: "120 ₺",
    icon: "☕",
  },
  {
    name: "Latte",
    category: "Sıcak İçecekler",
    description: "Espresso ve yumuşak süt köpüğü.",
    price: "150 ₺",
    icon: "☕",
  },
  {
    name: "Soğuk Kahve",
    category: "Soğuk İçecekler",
    description: "Serinletici buzlu kahve.",
    price: "160 ₺",
    icon: "🧊",
  },
  {
    name: "Serpme Kahvaltı",
    category: "Kahvaltı",
    description: "Zengin kahvaltı tabağı.",
    price: "450 ₺",
    icon: "🍳",
  },
  {
    name: "Çikolatalı Pasta",
    category: "Tatlı",
    description: "Günlük hazırlanan özel pasta.",
    price: "180 ₺",
    icon: "🍰",
  },
  {
    name: "Karışık Çerez",
    category: "Çerez",
    description: "Günün seçme çerezleri.",
    price: "150 ₺",
    icon: "🥜",
  },
];

const logoUrl =
  "https://raw.githubusercontent.com/bitcoinkazanc/Taskentcafe/main/taskent-logo.png";

const waiterImageUrl =
  "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=300&q=85";

export default function HomePage() {
  const [category, setCategory] = useState("Sıcak İçecekler");

  const filteredProducts = products.filter(
    (product) => product.category === category
  );

  return (
    <>
      <main className="site">
        <header className="header">
          <div className="brand">
            <div className="logo">
              <img src={logoUrl} alt="Taşkent Cafe" />
            </div>

            <div>
              <h1>Taşkent Cafe</h1>
              <span>Cafe & Restaurant</span>
            </div>
          </div>
        </header>

        <section className="loyalty">
          <div className="loyalty-content">
            <span className="loyalty-label">
              TAŞKENT SADAKAT KULÜBÜ
            </span>

            <h2>
              Her ziyaretiniz
              <br />
              size kazandırsın.
            </h2>

            <p>
              Sadakat kulübüne katılın, alışverişlerinizden
              puan kazanın ve özel fırsatlardan yararlanın.
            </p>

            <button className="loyalty-button">
              Sadakat Kulübüne Katıl
            </button>
          </div>

          <div className="loyalty-icon">★</div>
        </section>

        <section className="menu-section" id="menu">
          <div className="menu-title">
            <span>LEZZETLERİMİZ</span>
            <h2>Menü</h2>
          </div>

          <div className="categories">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={
                  category === item
                    ? "category active"
                    : "category"
                }
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="products">
            {filteredProducts.map((product) => (
              <article
                className="product-card"
                key={product.name}
              >
                <div className="product-image">
                  <span>{product.icon}</span>
                </div>

                <div className="product-content">
                  <h3>{product.name}</h3>

                  <p>{product.description}</p>

                  <div className="product-bottom">
                    <strong>{product.price}</strong>

                    <button
                      type="button"
                      className="plus-button"
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="contact" id="contact">
          <span>BİZE ULAŞIN</span>

          <h2>Taşkent Cafe</h2>

          <p>
            Bizi sosyal medyada takip edin.
          </p>

          <div className="socials">
            <a href="#" aria-label="Facebook">
              f
            </a>

            <a href="#" aria-label="Instagram">
              ◎
            </a>

            <a href="#" aria-label="YouTube">
              ▶
            </a>

            <a href="#" aria-label="TikTok">
              ♪
            </a>
          </div>
        </section>

        <footer className="footer">
          <div className="footer-logo">
            <img src={logoUrl} alt="Taşkent Cafe" />
          </div>

          <strong>Taşkent Cafe</strong>

          <small>© 2026 Taşkent Cafe</small>
        </footer>
      </main>

      {/* SOL ALT GARSON ÇAĞIRMA */}
      <button
        type="button"
        className="waiter-button"
        aria-label="Garson Çağır"
      >
        <span className="waiter-pulse" />

        <span className="waiter-image">
          <img
            src={waiterImageUrl}
            alt="Garson"
          />
        </span>

        <span className="waiter-text">
          Garson Çağır
        </span>
      </button>

      {/* ALT SABİT MENÜ */}
      <nav className="bottom-nav">
        <a href="#" className="nav-item active">
          <span>⌂</span>
          <small>Ana Sayfa</small>
        </a>

        <a href="#menu" className="nav-item">
          <span>☕</span>
          <small>Menü</small>
        </a>

        <a href="#" className="nav-item">
          <span>★</span>
          <small>Sadakat</small>
        </a>

        <a href="#contact" className="nav-item">
          <span>☎</span>
          <small>İletişim</small>
        </a>
      </nav>

      <style jsx>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
          scroll-padding-bottom: 80px;
        }

        body {
          background: #f5efe8;
          color: #30261f;
          font-family: Arial, Helvetica, sans-serif;
        }

        button,
        a {
          font: inherit;
          cursor: pointer;
        }

        a {
          text-decoration: none;
          color: inherit;
        }

        .site {
          width: 100%;
          max-width: 560px;
          min-height: 100vh;
          margin: 0 auto;
          background: #fffaf5;
          padding-bottom: 82px;
          overflow-x: hidden;
        }

        .header {
          height: 76px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          background: rgba(255, 250, 245, 0.97);
          border-bottom: 1px solid #f1e8df;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo {
          width: 45px;
          height: 45px;
          min-width: 45px;
          border-radius: 50%;
          overflow: hidden;
          background: #b96f38;
          box-shadow: 0 7px 18px rgba(185, 111, 56, 0.22);
        }

        .logo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .brand h1 {
          font-size: 17px;
          font-weight: 700;
        }

        .brand span {
          display: block;
          margin-top: 3px;
          color: #9a8b7d;
          font-size: 10px;
        }

        /* SADAKAT KARTI */

        .loyalty {
          min-height: 230px;
          margin: 18px 17px 0;
          padding: 25px;
          border-radius: 25px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 90% 15%,
              rgba(255, 255, 255, 0.14),
              transparent 32%
            ),
            linear-gradient(
              145deg,
              #382a21,
              #241b16
            );
          color: white;
        }

        .loyalty::after {
          content: "";
          position: absolute;
          width: 180px;
          height: 180px;
          right: -85px;
          bottom: -95px;
          border-radius: 50%;
          border: 35px solid rgba(255, 255, 255, 0.05);
        }

        .loyalty-content {
          position: relative;
          z-index: 2;
        }

        .loyalty-label {
          color: #d49a6b;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .loyalty h2 {
          margin-top: 9px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 26px;
          line-height: 1.08;
        }

        .loyalty p {
          max-width: 290px;
          margin-top: 10px;
          color: #c9bdb3;
          font-size: 11px;
          line-height: 1.55;
        }

        .loyalty-button {
          height: 39px;
          margin-top: 17px;
          padding: 0 15px;
          border: 0;
          border-radius: 11px;
          background: #c17a41;
          color: white;
          font-size: 10px;
          font-weight: 700;
        }

        .loyalty-icon {
          position: absolute;
          right: 20px;
          top: 22px;
          width: 54px;
          height: 54px;
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
        }

        /* MENÜ */

        .menu-section {
          padding: 0 17px;
          margin-top: 28px;
        }

        .menu-title {
          margin-bottom: 14px;
        }

        .menu-title span {
          color: #b56d38;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .menu-title h2 {
          margin-top: 4px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 25px;
        }

        .categories {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none;
        }

        .categories::-webkit-scrollbar {
          display: none;
        }

        .category {
          flex: 0 0 auto;
          height: 35px;
          padding: 0 13px;
          border: 1px solid #eee4da;
          border-radius: 20px;
          background: white;
          color: #74675d;
          font-size: 10px;
        }

        .category.active {
          border-color: #b96f38;
          background: #b96f38;
          color: white;
        }

        .products {
          display: grid;
          gap: 10px;
          margin-top: 10px;
        }

        .product-card {
          min-height: 106px;
          padding: 10px;
          display: flex;
          gap: 12px;
          background: white;
          border: 1px solid #f2ebe4;
          border-radius: 19px;
          box-shadow: 0 5px 18px rgba(67, 44, 26, 0.045);
        }

        .product-image {
          width: 86px;
          height: 86px;
          flex: 0 0 86px;
          border-radius: 15px;
          background: #eee1d4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }

        .product-content {
          flex: 1;
          min-width: 0;
          padding: 4px 2px;
        }

        .product-content h3 {
          font-size: 14px;
        }

        .product-content p {
          margin-top: 4px;
          color: #998c81;
          font-size: 10px;
          line-height: 1.4;
        }

        .product-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 7px;
        }

        .product-bottom strong {
          color: #b56d38;
          font-size: 14px;
        }

        .plus-button {
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 10px;
          background: #b96f38;
          color: white;
          font-size: 20px;
        }

        /* İLETİŞİM */

        .contact {
          margin: 28px 17px 0;
          padding: 20px 15px;
          text-align: center;
          border-radius: 20px;
          background: #f3e8dd;
        }

        .contact > span {
          color: #b56d38;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .contact h2 {
          margin-top: 5px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 21px;
        }

        .contact p {
          margin-top: 6px;
          color: #8f8176;
          font-size: 9px;
        }

        .socials {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 13px;
        }

        .socials a {
          width: 39px;
          height: 39px;
          border: 1px solid #e5d8cc;
          border-radius: 11px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6c5b4f;
          font-size: 11px;
          font-weight: 700;
        }

        /* FOOTER */

        .footer {
          padding: 25px 20px 20px;
          text-align: center;
        }

        .footer-logo {
          width: 42px;
          height: 42px;
          margin: 0 auto 7px;
          border-radius: 50%;
          overflow: hidden;
        }

        .footer-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .footer > strong {
          display: block;
          font-size: 14px;
        }

        .footer small {
          display: block;
          margin-top: 12px;
          color: #b0a39a;
          font-size: 9px;
        }

        /* ALT SABİT MENÜ */

        .bottom-nav {
          position: fixed;
          left: 50%;
          bottom: 0;
          z-index: 900;
          width: min(560px, 100%);
          height: 64px;
          transform: translateX(-50%);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          padding: 6px 8px;
          padding-bottom: calc(
            6px + env(safe-area-inset-bottom)
          );
          background: rgba(255, 250, 245, 0.97);
          border-top: 1px solid #eadfd5;
          box-shadow: 0 -6px 25px rgba(67, 44, 26, 0.08);
          backdrop-filter: blur(16px);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: #9b8d82;
          font-size: 9px;
          font-weight: 600;
        }

        .nav-item span {
          height: 23px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .nav-item small {
          font-size: 9px;
        }

        .nav-item.active {
          color: #b96f38;
        }

        /* SOL ALT GARSON */

        .waiter-button {
          position: fixed;
          left: 15px;
          bottom: 80px;
          z-index: 1000;
          height: 66px;
          padding: 4px 15px 4px 4px;
          display: flex;
          align-items: center;
          gap: 9px;
          border: 2px solid white;
          border-radius: 36px;
          background: white;
          color: #382a21;
          box-shadow:
            0 8px 25px rgba(55, 31, 17, 0.22),
            0 2px 7px rgba(0, 0, 0, 0.12);
        }

        .waiter-image {
          position: relative;
          width: 56px;
          height: 56px;
          flex: 0 0 56px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #b96f38;
        }

        .waiter-image img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .waiter-text {
          padding-right: 2px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .waiter-pulse {
          position: absolute;
          inset: -6px;
          border: 2px solid rgba(185, 111, 56, 0.45);
          border-radius: 50%;
          animation: pulse 1.8s infinite;
          pointer-events: none;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.9);
            opacity: 0.8;
          }

          70% {
            transform: scale(1.08);
            opacity: 0;
          }

          100% {
            transform: scale(1.08);
            opacity: 0;
          }
        }

        @media (min-width: 700px) {
          body {
            padding: 20px 0;
          }

          .site {
            border-radius: 30px;
            box-shadow: 0 15px 60px rgba(50, 35, 25, 0.1);
          }

          .bottom-nav {
            width: 560px;
            bottom: 20px;
            border-radius: 18px;
          }

          .waiter-button {
            left: calc(50% - 265px);
            bottom: 96px;
          }
        }

        @media (max-width: 380px) {
          .loyalty {
            margin-left: 14px;
            margin-right: 14px;
          }

          .menu-section {
            padding-left: 14px;
            padding-right: 14px;
          }

          .waiter-button {
            left: 12px;
            bottom: 74px;
          }
        }
      `}</style>
    </>
  );
}