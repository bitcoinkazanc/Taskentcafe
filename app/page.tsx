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
  const [category, setCategory] =
    useState("Sıcak İçecekler");

  const [waiterOpen, setWaiterOpen] =
    useState(false);

  const filteredProducts =
    products.filter(
      (product) =>
        product.category === category
    );

  return (
    <main className="site">

      {/* =========================
          ÜST ALAN
      ========================= */}

      <header className="header">

        <div className="brand">

          <div className="logo">
            <img
              src={logoUrl}
              alt="Taşkent Cafe"
            />
          </div>

          <div>
            <h1>
              TAŞKENT CAFE
            </h1>

            <span>
              Lezzetin, samimiyetin adresi.
            </span>
          </div>

        </div>

      </header>


      {/* =========================
          SADAKAT KULÜBÜ
      ========================= */}

      <section className="loyalty">

        <div className="loyalty-content">

          <span className="eyebrow">
            TAŞKENT SADAKAT KULÜBÜ
          </span>

          <h2>
            Her ziyaretiniz
            <br />
            size kazandırsın.
          </h2>

          <p>
            Sadakat kulübüne katılın,
            alışverişlerinizden puan
            kazanın ve özel fırsatlardan
            yararlanın.
          </p>

          <button
            type="button"
            className="loyalty-button"
          >
            Sadakat Kulübüne Katıl
          </button>

        </div>

        <div className="loyalty-icon">
          ★
        </div>

      </section>


      {/* =========================
          MENÜ
      ========================= */}

      <section
        className="menu-section"
        id="menu"
      >

        <div className="section-heading">

          <div>

            <span className="eyebrow">
              LEZZETLERİMİZ
            </span>

            <h2>
              Menü
            </h2>

          </div>

        </div>


        <div className="categories">

          {categories.map(
            (item) => (
              <button
                key={item}
                type="button"
                className={
                  category === item
                    ? "category active"
                    : "category"
                }
                onClick={() =>
                  setCategory(item)
                }
              >
                {item}
              </button>
            )
          )}

        </div>


        <div className="products">

          {filteredProducts.map(
            (product) => (
              <article
                className="product-card"
                key={product.name}
              >

                <div className="product-image">
                  {product.icon}
                </div>

                <div className="product-content">

                  <h3>
                    {product.name}
                  </h3>

                  <p>
                    {product.description}
                  </p>

                  <div className="product-bottom">

                    <strong>
                      {product.price}
                    </strong>

                    <button
                      type="button"
                      className="plus"
                    >
                      +
                    </button>

                  </div>

                </div>

              </article>
            )
          )}

        </div>

      </section>


      {/* =========================
          İLETİŞİM / SOSYAL MEDYA
      ========================= */}

      <section className="contact">

        <span className="eyebrow">
          BİZİ TAKİP EDİN
        </span>

        <h2>
          Taşkent Cafe
        </h2>

        <p>
          Sosyal medya hesaplarımız
        </p>

        <div className="socials">

          <a
            href="#"
            className="social"
            aria-label="Facebook"
          >
            f
          </a>

          <a
            href="#"
            className="social"
            aria-label="Instagram"
          >
            ◎
          </a>

          <a
            href="#"
            className="social"
            aria-label="YouTube"
          >
            ▶
          </a>

          <a
            href="#"
            className="social"
            aria-label="TikTok"
          >
            ♪
          </a>

        </div>

      </section>


      {/* =========================
          ALT BİLGİ
      ========================= */}

      <footer className="footer">

        <div className="footer-logo">
          <img
            src={logoUrl}
            alt="Taşkent Cafe"
          />
        </div>

        <strong>
          Taşkent Cafe
        </strong>

        <small>
          © 2026 Taşkent Cafe
        </small>

      </footer>


      {/* =========================
          ALT SABİT MENÜ
      ========================= */}

      <nav className="bottom-nav">

        <a
          href="#"
          className="nav-item active"
        >
          <span>⌂</span>
          <small>
            Ana Sayfa
          </small>
        </a>

        <a
          href="#menu"
          className="nav-item"
        >
          <span>☕</span>
          <small>
            Menü
          </small>
        </a>

        <a
          href="#loyalty"
          className="nav-item"
        >
          <span>★</span>
          <small>
            Sadakat
          </small>
        </a>

        <a
          href="#contact"
          className="nav-item"
        >
          <span>☎</span>
          <small>
            İletişim
          </small>
        </a>

      </nav>


      {/* =========================
          GARSON ÇAĞIR
      ========================= */}

      <div className="waiter-widget">

        {waiterOpen && (
          <div className="waiter-label-box">
            Garsonu Çağır
          </div>
        )}

        <button
          type="button"
          className="waiter-button"
          onClick={() =>
            setWaiterOpen(!waiterOpen)
          }
          aria-label="Garsonu Çağır"
        >

          <span className="waiter-ring"></span>

          <img
            src={waiterImageUrl}
            alt="Garson"
          />

        </button>

      </div>


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
          color: inherit;
          text-decoration: none;
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


        /* HEADER */

        .header {
          height: 76px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          background: #fffaf5;
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
          box-shadow:
            0 7px 18px rgba(185,111,56,0.22);
        }

        .logo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          border-radius: 50%;
        }

        .brand h1 {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }

        .brand span {
          display: block;
          margin-top: 4px;
          color: #9a8b7d;
          font-size: 10px;
        }


        /* SADAKAT */

        .loyalty {
          min-height: 205px;
          margin: 20px 17px 0;
          padding: 23px;
          border-radius: 23px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 90% 15%,
              rgba(255,255,255,0.14),
              transparent 32%
            ),
            linear-gradient(
              145deg,
              #382a21,
              #241b16
            );
          color: white;
          box-shadow:
            0 10px 28px rgba(50,34,24,0.12);
        }

        .loyalty-content {
          position: relative;
          z-index: 2;
        }

        .eyebrow {
          color: #b56d38;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .loyalty .eyebrow {
          color: #d49a6b;
        }

        .loyalty h2 {
          margin-top: 8px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 25px;
          line-height: 1.1;
        }

        .loyalty p {
          max-width: 300px;
          margin-top: 9px;
          color: #c9bdb3;
          font-size: 10px;
          line-height: 1.5;
        }

        .loyalty-button {
          height: 37px;
          margin-top: 15px;
          padding: 0 14px;
          border: 0;
          border-radius: 10px;
          background: #c17a41;
          color: white;
          font-size: 10px;
          font-weight: 700;
        }

        .loyalty-icon {
          position: absolute;
          top: 20px;
          right: 19px;
          width: 48px;
          height: 48px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.09);
          font-size: 24px;
        }


        /* MENÜ */

        .menu-section {
          padding: 0 17px;
          margin-top: 28px;
        }

        .section-heading {
          margin-bottom: 14px;
        }

        .section-heading h2 {
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
          border: 1px solid #eaded2;
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


        /* ÜRÜNLER */

        .products {
          display: grid;
          gap: 10px;
          margin-top: 12px;
        }

        .product-card {
          min-height: 100px;
          padding: 10px;
          display: flex;
          gap: 12px;
          background: white;
          border: 1px solid #f0e7de;
          border-radius: 18px;
          box-shadow:
            0 5px 18px rgba(67,44,26,0.045);
        }

        .product-image {
          width: 80px;
          height: 80px;
          flex: 0 0 80px;
          border-radius: 14px;
          background: #eee1d4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
        }

        .product-content {
          flex: 1;
          min-width: 0;
          padding: 3px 1px;
        }

        .product-content h3 {
          font-size: 14px;
        }

        .product-content p {
          margin-top: 5px;
          color: #998c81;
          font-size: 10px;
          line-height: 1.4;
        }

        .product-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }

        .product-bottom strong {
          color: #b56d38;
          font-size: 14px;
        }

        .plus {
          width: 29px;
          height: 29px;
          border: 0;
          border-radius: 9px;
          background: #b96f38;
          color: white;
          font-size: 19px;
        }


        /* İLETİŞİM */

        .contact {
          margin: 28px 17px 0;
          padding: 21px 15px;
          text-align: center;
          border-radius: 20px;
          background: #f3e8dd;
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

        .social {
          width: 39px;
          height: 39px;
          border: 1px solid #e5d8cc;
          border-radius: 11px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6c5b4f;
          font-size: 12px;
          font-weight: 700;
        }


        /* FOOTER */

        .footer {
          padding: 20px 15px 8px;
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

        .footer strong {
          display: block;
          font-size: 14px;
        }

        .footer small {
          display: block;
          margin-top: 7px;
          color: #aaa098;
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
          background: rgba(255,250,245,0.97);
          border-top: 1px solid #eadfd5;
          box-shadow:
            0 -6px 25px rgba(67,44,26,0.08);
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


        /* GARSON */

        .waiter-widget {
          position: fixed;
          left: 18px;
          bottom: 78px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .waiter-button {
          position: relative;
          width: 62px;
          height: 62px;
          border: 3px solid white;
          border-radius: 50%;
          overflow: visible;
          padding: 0;
          background: #8b5e3c;
          box-shadow:
            0 8px 25px rgba(55,31,17,0.30),
            0 2px 6px rgba(0,0,0,0.15);
        }

        .waiter-button img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          border-radius: 50%;
        }

        .waiter-ring {
          position: absolute;
          inset: -7px;
          border: 2px solid rgba(185,111,56,0.65);
          border-radius: 50%;
          animation: pulse 1.8s infinite;
          pointer-events: none;
        }

        .waiter-label-box {
          padding: 9px 13px;
          border-radius: 20px;
          background: white;
          color: #3a291f;
          font-size: 11px;
          font-weight: 700;
          box-shadow:
            0 5px 18px rgba(0,0,0,0.13);
        }

        @keyframes pulse {
          0% {
            transform: scale(0.88);
            opacity: 0.9;
          }

          70% {
            transform: scale(1.12);
            opacity: 0;
          }

          100% {
            transform: scale(1.12);
            opacity: 0;
          }
        }


        /* TELEFON */

        @media (max-width: 380px) {

          .loyalty {
            margin-left: 14px;
            margin-right: 14px;
          }

          .menu-section {
            padding-left: 14px;
            padding-right: 14px;
          }

          .contact {
            margin-left: 14px;
            margin-right: 14px;
          }

          .waiter-widget {
            left: 14px;
          }

        }


        /* MASAÜSTÜ */

        @media (min-width: 700px) {

          body {
            padding: 20px 0;
          }

          .site {
            border-radius: 30px;
            box-shadow:
              0 15px 60px rgba(50,35,25,0.10);
          }

          .bottom-nav {
            width: 560px;
            bottom: 20px;
            border-radius: 18px;
            border: 1px solid #eadfd5;
          }

          .waiter-widget {
            left: calc(50% - 262px);
            bottom: 96px;
          }

        }

      `}</style>

    </main>
  );
}