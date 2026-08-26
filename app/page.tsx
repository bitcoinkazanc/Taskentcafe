"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const categories = [
  "Tümü",
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

type CafeTable = {
  id: string;
  table_number: string;
  qr_token: string;
  active: boolean;
};

const logoUrl =
  "https://raw.githubusercontent.com/bitcoinkazanc/Taskentcafe/main/taskent-logo.png";

const waiterImageUrl =
  "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=300&q=85";

export default function HomePage() {
  const [category, setCategory] = useState("Tümü");

  const [table, setTable] =
    useState<CafeTable | null>(null);

  const [waiterOpen, setWaiterOpen] =
    useState(false);

  const [waiterLoading, setWaiterLoading] =
    useState(false);

  const [waiterMessage, setWaiterMessage] =
    useState("");

  const [waiterError, setWaiterError] =
    useState("");

  const filteredProducts =
    category === "Tümü"
      ? products
      : products.filter(
          (product) =>
            product.category === category
        );

  useEffect(() => {
    const loadTable = async () => {
      try {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const qrToken =
          params.get("table");

        if (!qrToken) {
          return;
        }

        const { data, error } =
          await supabase.rpc(
            "get_cafe_table",
            {
              requested_qr_token:
                qrToken,
            }
          );

        if (error) {
          console.error(
            "TABLE LOAD ERROR:",
            error
          );

          setWaiterError(
            "Masa bilgisi alınamadı."
          );

          return;
        }

        setTable(
          data as CafeTable
        );
      } catch (error) {
        console.error(
          "TABLE ERROR:",
          error
        );

        setWaiterError(
          "Masa bilgisi alınamadı."
        );
      }
    };

    loadTable();
  }, []);

  const callWaiter = () => {
    if (!table) {
      setWaiterError(
        "Garson çağırmak için masanıza ait QR koddan giriş yapmalısınız."
      );

      setWaiterMessage("");

      return;
    }

    if (!navigator.geolocation) {
      setWaiterError(
        "Cihazınız konum özelliğini desteklemiyor."
      );

      return;
    }

    setWaiterLoading(true);
    setWaiterMessage("");
    setWaiterError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          const { error } =
            await supabase.rpc(
              "create_waiter_call",
              {
                requested_table_id:
                  table.id,

                user_latitude:
                  latitude,

                user_longitude:
                  longitude,
              }
            );

          if (error) {
            throw new Error(
              error.message
            );
          }

          setWaiterMessage(
            `Garsonunuz Masa ${table.table_number} için çağrıldı.`
          );

          setWaiterError("");
        } catch (error) {
          console.error(
            "WAITER CALL ERROR:",
            error
          );

          setWaiterError(
            error instanceof Error
              ? error.message
              : "Garson çağrısı gönderilemedi."
          );

          setWaiterMessage("");
        } finally {
          setWaiterLoading(false);
        }
      },
      (error) => {
        let message =
          "Konumunuz alınamadı.";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          message =
            "Garson çağırmak için konum izni vermelisiniz.";
        }

        if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          message =
            "Konumunuz belirlenemedi. Lütfen GPS'i açıp tekrar deneyin.";
        }

        if (
          error.code ===
          error.TIMEOUT
        ) {
          message =
            "Konum alınırken zaman aşımı oluştu. Lütfen tekrar deneyin.";
        }

        setWaiterError(message);
        setWaiterMessage("");
        setWaiterLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          scroll-padding-bottom: 80px;
        }

        body {
          margin: 0;
          background: #f3eee8;
          color: #30261f;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button {
          font: inherit;
          cursor: pointer;
        }

        .tc-site {
          width: 100%;
          max-width: 560px;
          min-height: 100vh;
          margin: 0 auto;
          padding-bottom: 85px;
          background: #fffaf5;
          overflow: hidden;
        }

        /* ÜST */

        .tc-header {
          height: 82px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          background: #fffaf5;
          border-bottom: 1px solid #eee4db;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(14px);
        }

        .tc-brand {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .tc-logo {
          width: 50px;
          height: 50px;
          flex: 0 0 50px;
          border-radius: 50%;
          overflow: hidden;
          background: #b96f38;
          box-shadow:
            0 6px 18px
            rgba(75, 45, 25, 0.16);
        }

        .tc-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .tc-brand h1 {
          margin: 0;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-size: 20px;
          line-height: 1.1;
        }

        .tc-brand p {
          margin: 4px 0 0;
          color: #9a8b7d;
          font-size: 9px;
          letter-spacing: 1px;
        }

        /* ANA SAYFA */

        .tc-home {
          padding: 25px 17px 0;
        }

        .tc-home-card {
          padding: 24px 20px;
          border-radius: 23px;
          background:
            linear-gradient(
              145deg,
              #f4e7da,
              #fffaf5
            );
          border: 1px solid #eaded2;
        }

        .tc-home-label {
          color: #b56d38;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .tc-home-card h2 {
          margin: 9px 0 0;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-size: 29px;
          line-height: 1.08;
        }

        .tc-home-card p {
          margin: 12px 0 0;
          color: #796b60;
          font-size: 11px;
          line-height: 1.6;
        }

        /* SADAKAT */

        .tc-loyalty {
          position: relative;
          overflow: hidden;
          margin: 25px 17px 0;
          min-height: 220px;
          padding: 25px;
          border-radius: 25px;
          color: white;
          background:
            radial-gradient(
              circle at 90% 10%,
              rgba(255,255,255,.13),
              transparent 30%
            ),
            linear-gradient(
              145deg,
              #3a2b21,
              #211813
            );
          box-shadow:
            0 10px 30px
            rgba(50,34,24,.12);
        }

        .tc-loyalty::after {
          content: "";
          position: absolute;
          width: 170px;
          height: 170px;
          right: -90px;
          bottom: -90px;
          border-radius: 50%;
          border: 30px solid
            rgba(255,255,255,.05);
        }

        .tc-loyalty-content {
          position: relative;
          z-index: 2;
        }

        .tc-loyalty-label {
          color: #d49a6b;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .tc-loyalty h2 {
          margin: 9px 0 0;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-size: 27px;
          line-height: 1.08;
        }

        .tc-loyalty p {
          max-width: 310px;
          margin: 10px 0 0;
          color: #c9bdb3;
          font-size: 10px;
          line-height: 1.55;
        }

        .tc-loyalty-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 40px;
          margin-top: 17px;
          padding: 0 16px;
          border-radius: 11px;
          background: #c17a41;
          color: white;
          font-size: 10px;
          font-weight: 700;
        }

        .tc-loyalty-icon {
          position: absolute;
          top: 21px;
          right: 20px;
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            rgba(255,255,255,.09);
          font-size: 25px;
        }

        /* MENÜ */

        .tc-menu {
          padding: 28px 17px 0;
        }

        .tc-heading {
          margin-bottom: 14px;
        }

        .tc-heading-label {
          color: #b56d38;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .tc-heading h2 {
          margin: 5px 0 0;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-size: 25px;
        }

        .tc-categories {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 7px;
          scrollbar-width: none;
        }

        .tc-categories::-webkit-scrollbar {
          display: none;
        }

        .tc-category {
          flex: 0 0 auto;
          height: 35px;
          padding: 0 13px;
          border: 1px solid #eaded2;
          border-radius: 19px;
          background: white;
          color: #74675d;
          font-size: 10px;
        }

        .tc-category.active {
          border-color: #b96f38;
          background: #b96f38;
          color: white;
        }

        .tc-products {
          display: grid;
          gap: 10px;
          margin-top: 12px;
        }

        .tc-product {
          min-height: 98px;
          padding: 10px;
          display: flex;
          gap: 12px;
          background: white;
          border: 1px solid #f0e7df;
          border-radius: 18px;
          box-shadow:
            0 5px 18px
            rgba(67,44,26,.045);
        }

        .tc-product-image {
          width: 78px;
          height: 78px;
          flex: 0 0 78px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #f0e4d8;
          font-size: 30px;
        }

        .tc-product-content {
          min-width: 0;
          flex: 1;
        }

        .tc-product h3 {
          margin: 2px 0 0;
          font-size: 13px;
        }

        .tc-product p {
          margin: 5px 0 0;
          color: #998c81;
          font-size: 9px;
          line-height: 1.4;
        }

        .tc-product-bottom {
          margin-top: 7px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .tc-product-price {
          color: #b56d38;
          font-size: 13px;
          font-weight: 700;
        }

        .tc-plus {
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 9px;
          background: #b96f38;
          color: white;
          font-size: 18px;
        }

        /* İLETİŞİM */

        .tc-contact {
          margin: 28px 17px 0;
          padding: 21px 15px;
          text-align: center;
          border-radius: 21px;
          background: #f3e8dd;
        }

        .tc-contact-label {
          color: #b56d38;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .tc-contact h2 {
          margin: 6px 0 0;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-size: 22px;
        }

        .tc-contact p {
          margin: 6px 0 0;
          color: #8f8176;
          font-size: 9px;
        }

        .tc-socials {
          margin-top: 14px;
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .tc-social {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5d8cc;
          border-radius: 11px;
          background: white;
          color: #66574d;
          font-size: 12px;
          font-weight: 700;
        }

        /* ALT MENÜ */

        .tc-bottom-nav {
          position: fixed;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          z-index: 900;
          width: min(560px, 100%);
          height: 65px;
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          padding:
            5px 8px
            calc(5px + env(safe-area-inset-bottom));
          background:
            rgba(255,250,245,.97);
          border-top: 1px solid #eadfd5;
          box-shadow:
            0 -7px 25px
            rgba(67,44,26,.08);
          backdrop-filter: blur(15px);
        }

        .tc-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: #9b8d82;
          font-size: 9px;
          font-weight: 600;
        }

        .tc-nav-icon {
          height: 24px;
          display: flex;
          align-items: center;
          font-size: 20px;
        }

        .tc-nav-item.active {
          color: #b96f38;
        }

        /* GARSON */

        .tc-waiter {
          position: fixed;
          left: 17px;
          bottom: 82px;
          z-index: 1000;
        }

        .tc-waiter-button {
          position: relative;
          width: 64px;
          height: 64px;
          padding: 0;
          border: 3px solid #fffaf5;
          border-radius: 50%;
          overflow: visible;
          background: white;
          box-shadow:
            0 8px 25px
            rgba(55,31,17,.28);
        }

        .tc-waiter-photo {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }

        .tc-waiter-photo::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            rgba(65,38,22,.08);
        }

        .tc-waiter-ring {
          position: absolute;
          inset: -7px;
          border: 2px solid
            rgba(185,111,56,.65);
          border-radius: 50%;
          animation:
            tcPulse 1.8s infinite;
        }

        .tc-waiter-ring.second {
          inset: -13px;
          border-width: 1px;
          border-color:
            rgba(185,111,56,.35);
          animation-delay: .35s;
        }

        @keyframes tcPulse {
          0% {
            transform: scale(.88);
            opacity: .9;
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

        .tc-waiter-label {
          position: absolute;
          left: 74px;
          top: 50%;
          transform:
            translateY(-50%);
          white-space: nowrap;
          padding: 9px 13px;
          border: 1px solid #eaded2;
          border-radius: 20px;
          background: white;
          color: #3a291f;
          font-size: 11px;
          font-weight: 700;
          box-shadow:
            0 5px 18px
            rgba(0,0,0,.13);
        }

        .tc-waiter-panel {
          position: absolute;
          left: 0;
          bottom: 78px;
          width: 300px;
          max-width:
            calc(100vw - 34px);
          overflow: hidden;
          border: 1px solid #eee2d7;
          border-radius: 20px;
          background: #fffaf5;
          box-shadow:
            0 18px 50px
            rgba(43,28,18,.20);
        }

        .tc-waiter-panel-header {
          padding: 13px;
          display: flex;
          align-items: center;
          gap: 9px;
          background: #382a21;
          color: white;
        }

        .tc-waiter-avatar {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border-radius: 12px;
          background-size: cover;
          background-position: center;
        }

        .tc-waiter-header-text {
          flex: 1;
          min-width: 0;
        }

        .tc-waiter-header-text strong {
          display: block;
          font-size: 12px;
        }

        .tc-waiter-header-text span {
          display: block;
          margin-top: 3px;
          color: #cdbfb4;
          font-size: 9px;
        }

        .tc-waiter-close {
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 9px;
          background:
            rgba(255,255,255,.1);
          color: white;
          font-size: 20px;
        }

        .tc-waiter-body {
          padding: 15px;
        }

        .tc-table {
          padding: 11px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 12px;
          background: #f3e8dd;
        }

        .tc-table span {
          color: #8f8176;
          font-size: 9px;
        }

        .tc-table strong {
          color: #493a30;
          font-size: 12px;
        }

        .tc-waiter-text {
          margin: 13px 0 0;
          color: #74675d;
          font-size: 10px;
          line-height: 1.5;
        }

        .tc-call {
          width: 100%;
          height: 40px;
          margin-top: 12px;
          border: 0;
          border-radius: 11px;
          background: #b96f38;
          color: white;
          font-size: 10px;
          font-weight: 700;
        }

        .tc-call:disabled {
          opacity: .65;
        }

        .tc-error {
          margin-top: 10px;
          padding: 10px;
          border-radius: 11px;
          background: #f6e7df;
          color: #8a5135;
          font-size: 9px;
          line-height: 1.4;
        }

        .tc-success {
          padding: 12px;
          border-radius: 13px;
          background: #e8f3e8;
          color: #47704b;
          font-size: 10px;
          line-height: 1.5;
        }

        .tc-empty {
          padding: 10px 3px;
          text-align: center;
        }

        .tc-empty-photo {
          width: 55px;
          height: 55px;
          margin: 0 auto 9px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
        }

        .tc-empty strong {
          display: block;
          font-size: 12px;
        }

        .tc-empty p {
          margin: 6px 0 0;
          color: #998c81;
          font-size: 9px;
          line-height: 1.5;
        }

        @media (min-width: 700px) {
          body {
            padding: 20px 0;
          }

          .tc-site {
            border-radius: 28px;
            box-shadow:
              0 15px 55px
              rgba(50,35,25,.12);
          }

          .tc-bottom-nav {
            bottom: 20px;
            width: 560px;
            border: 1px solid #eadfd5;
            border-radius: 18px;
          }

          .tc-waiter {
            left:
              calc(50% - 263px);
            bottom: 96px;
          }
        }

        @media (max-width: 380px) {
          .tc-home-card h2 {
            font-size: 26px;
          }

          .tc-loyalty {
            padding: 22px;
          }

          .tc-loyalty h2 {
            font-size: 24px;
          }

          .tc-waiter {
            left: 14px;
            bottom: 76px;
          }
        }
      `}</style>

      <main className="tc-site">

        {/* ÜST */}

        <header className="tc-header">
          <div className="tc-brand">

            <div className="tc-logo">
              <img
                src={logoUrl}
                alt="Taşkent Cafe"
              />
            </div>

            <div>
              <h1>
                Taşkent Cafe
              </h1>

              <p>
                CAFE & RESTAURANT
              </p>
            </div>

          </div>
        </header>

        {/* ANA SAYFA */}

        <section
          className="tc-home"
          id="home"
        >
          <div className="tc-home-card">

            <span className="tc-home-label">
              TAŞKENT CAFE
            </span>

            <h2>
              Lezzetin,
              <br />
              samimiyetin adresi.
            </h2>

            <p>
              Kahvenizi yudumlarken
              güzel sohbetlere ve
              keyifli anlara eşlik
              ediyoruz.
            </p>

          </div>
        </section>

        {/* SADAKAT */}

        <section
          className="tc-loyalty"
          id="loyalty"
        >
          <div className="tc-loyalty-content">

            <span className="tc-loyalty-label">
              TAŞKENT SADAKAT KULÜBÜ
            </span>

            <h2>
              Her ziyaretiniz
              <br />
              size kazandırsın.
            </h2>

            <p>
              Sadakat kulübüne katılın,
              puan kazanın ve özel
              fırsatlardan yararlanın.
            </p>

            <a
              href="/loyalty"
              className="tc-loyalty-button"
            >
              Sadakat Kulübüne Katıl
            </a>

          </div>

          <div className="tc-loyalty-icon">
            ★
          </div>
        </section>

        {/* MENÜ */}

        <section
          className="tc-menu"
          id="menu"
        >
          <div className="tc-heading">

            <span className="tc-heading-label">
              LEZZETLERİMİZ
            </span>

            <h2>
              Menü
            </h2>

          </div>

          <div className="tc-categories">

            {categories.map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    category === item
                      ? "tc-category active"
                      : "tc-category"
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

          <div className="tc-products">

            {filteredProducts.map(
              (product) => (
                <article
                  className="tc-product"
                  key={product.name}
                >

                  <div className="tc-product-image">
                    {product.icon}
                  </div>

                  <div className="tc-product-content">

                    <h3>
                      {product.name}
                    </h3>

                    <p>
                      {product.description}
                    </p>

                    <div className="tc-product-bottom">

                      <span className="tc-product-price">
                        {product.price}
                      </span>

                      <button
                        type="button"
                        className="tc-plus"
                        aria-label={
                          product.name
                        }
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

        {/* İLETİŞİM */}

        <section
          className="tc-contact"
          id="location"
        >

          <span className="tc-contact-label">
            BİZE ULAŞIN
          </span>

          <h2>
            Taşkent Cafe
          </h2>

          <p>
            Bizi sosyal medyada takip edin.
          </p>

          <div className="tc-socials">

            <button
              type="button"
              className="tc-social"
              aria-label="Facebook"
            >
              f
            </button>

            <button
              type="button"
              className="tc-social"
              aria-label="Instagram"
            >
              ◎
            </button>

            <button
              type="button"
              className="tc-social"
              aria-label="YouTube"
            >
              ▶
            </button>

            <button
              type="button"
              className="tc-social"
              aria-label="TikTok"
            >
              ♪
            </button>

          </div>

        </section>

        {/* ALT SABİT MENÜ */}

        <nav className="tc-bottom-nav">

          <a
            href="#home"
            className="tc-nav-item active"
          >
            <span className="tc-nav-icon">
              ⌂
            </span>

            <small>
              Ana Sayfa
            </small>
          </a>

          <a
            href="#menu"
            className="tc-nav-item"
          >
            <span className="tc-nav-icon">
              ☕
            </span>

            <small>
              Menü
            </small>
          </a>

          <a
            href="/loyalty"
            className="tc-nav-item"
          >
            <span className="tc-nav-icon">
              ★
            </span>

            <small>
              Sadakat
            </small>
          </a>

          <a
            href="#location"
            className="tc-nav-item"
          >
            <span className="tc-nav-icon">
              ●
            </span>

            <small>
              Konum
            </small>
          </a>

        </nav>

        {/* GARSON ÇAĞIR */}

        <div className="tc-waiter">

          {waiterOpen && (
            <div className="tc-waiter-panel">

              <div className="tc-waiter-panel-header">

                <div
                  className="tc-waiter-avatar"
                  style={{
                    backgroundImage:
                      `url(${waiterImageUrl})`,
                  }}
                />

                <div className="tc-waiter-header-text">

                  <strong>
                    Garson Hizmeti
                  </strong>

                  <span>
                    Size nasıl yardımcı
                    olabiliriz?
                  </span>

                </div>

                <button
                  type="button"
                  className="tc-waiter-close"
                  onClick={() =>
                    setWaiterOpen(false)
                  }
                  aria-label="Kapat"
                >
                  ×
                </button>

              </div>

              <div className="tc-waiter-body">

                {table ? (
                  <>
                    <div className="tc-table">

                      <span>
                        Masanız
                      </span>

                      <strong>
                        Masa{" "}
                        {table.table_number}
                      </strong>

                    </div>

                    {waiterMessage ? (
                      <div className="tc-success">
                        ✓ {waiterMessage}
                      </div>
                    ) : (
                      <>
                        <p className="tc-waiter-text">
                          Masanıza bir garson
                          göndermemizi ister
                          misiniz?
                        </p>

                        {waiterError && (
                          <div className="tc-error">
                            ⚠️{" "}
                            {waiterError}
                          </div>
                        )}

                        <button
                          type="button"
                          className="tc-call"
                          onClick={callWaiter}
                          disabled={
                            waiterLoading
                          }
                        >
                          {waiterLoading
                            ? "Konum kontrol ediliyor..."
                            : "📣 Garsonu Çağır"}
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="tc-empty">

                      <div
                        className="tc-empty-photo"
                        style={{
                          backgroundImage:
                            `url(${waiterImageUrl})`,
                        }}
                      />

                      <strong>
                        Masanızı tanıyamadık
                      </strong>

                      <p>
                        Garson çağırabilmek
                        için masanızdaki QR
                        kodu okutmanız
                        gerekiyor.
                      </p>

                    </div>

                    {waiterError && (
                      <div className="tc-error">
                        ⚠️{" "}
                        {waiterError}
                      </div>
                    )}
                  </>
                )}

              </div>

            </div>
          )}

          <button
            type="button"
            className="tc-waiter-button"
            onClick={() =>
              setWaiterOpen(
                !waiterOpen
              )
            }
            aria-label="Garsonu Çağır"
          >

            <span
              className="tc-waiter-photo"
              style={{
                backgroundImage:
                  `url(${waiterImageUrl})`,
              }}
            />

            {!waiterOpen && (
              <>
                <span className="tc-waiter-ring" />
                <span className="tc-waiter-ring second" />
              </>
            )}

            <span className="tc-waiter-label">
              {waiterMessage
                ? "Garson geliyor"
                : "Garsonu Çağır"}
            </span>

          </button>

        </div>

      </main>
    </>
  );
}