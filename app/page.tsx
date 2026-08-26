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

export default function HomePage() {
  const [category, setCategory] = useState("Tümü");
  const [table, setTable] = useState<CafeTable | null>(null);
  const [tableLoading, setTableLoading] = useState(false);

  const filteredProducts =
    category === "Tümü"
      ? products
      : products.filter(
          (product) => product.category === category
        );

  useEffect(() => {
    const loadTable = async () => {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const qrToken = params.get("table");

        if (!qrToken) {
          return;
        }

        setTableLoading(true);

        const { data, error } = await supabase.rpc(
          "get_cafe_table",
          {
            requested_qr_token: qrToken,
          }
        );

        if (error) {
          console.error(
            "TABLE LOAD ERROR:",
            error
          );
          return;
        }

        setTable(data as CafeTable);
      } catch (error) {
        console.error(
          "TABLE ERROR:",
          error
        );
      } finally {
        setTableLoading(false);
      }
    };

    loadTable();
  }, []);

  return (
    <main className="site">

      {/* HEADER */}

      <header className="header">
        <div className="brand">

          <div className="logo">
            <img
              src={logoUrl}
              alt="Taşkent Cafe"
            />
          </div>

          <div>
            <h1>Taşkent Cafe</h1>

            <span>
              Keyif burada başlar
            </span>
          </div>

        </div>
      </header>


      {/* SADAKAT KARTI - MENÜNÜN ÜSTÜNDE */}

      <section
        className="loyalty"
        id="loyalty"
      >

        <div className="loyalty-content">

          <span className="eyebrow light">
            SADAKAT KULÜBÜ
          </span>

          <h2>
            Her kahvede
            <br />
            daha fazla kazanın.
          </h2>

          <p>
            Alışverişlerinden puan
            biriktir, özel ödüllerin ve
            avantajların tadını çıkar.
          </p>

          <a
            href="/loyalty"
            className="loyalty-button"
          >
            Sadakat Kulübüne Katıl
          </a>

        </div>

        <div className="loyalty-icon">
          ⭐
        </div>

      </section>


      {/* MENÜ */}

      <section
        className="section"
        id="menu"
      >

        <div className="section-heading">

          <div>
            <span className="eyebrow">
              TAŞKENT CAFE
            </span>

            <h2>
              Menümüz
            </h2>
          </div>

          <span className="menu-count">
            {filteredProducts.length} ürün
          </span>

        </div>


        {/* KATEGORİLER */}

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
              onClick={() =>
                setCategory(item)
              }
            >
              {item}
            </button>

          ))}

        </div>


        {/* ÜRÜNLER */}

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

                  <div>

                    <h3>
                      {product.name}
                    </h3>

                    <p>
                      {product.description}
                    </p>

                  </div>

                  <div className="product-bottom">

                    <strong>
                      {product.price}
                    </strong>

                    <button
                      type="button"
                      className="plus-button"
                      aria-label={`${product.name} detay`}
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


      {/* KONUM */}

      <section
        className="info-section"
        id="location"
      >

        <div className="section-heading">

          <div>

            <span className="eyebrow">
              BİZİ ZİYARET ET
            </span>

            <h2>
              Taşkent Cafe
            </h2>

          </div>

        </div>


        <div className="info-card">

          <div className="info-row">

            <span>
              📍
            </span>

            <div>

              <strong>
                Konum
              </strong>

              <p>
                Mardin Kale
              </p>

            </div>

          </div>


          <div className="info-row">

            <span>
              🕐
            </span>

            <div>

              <strong>
                Çalışma Saatleri
              </strong>

              <p>
                Her gün 09:00 – 00:00
              </p>

            </div>

          </div>


          <div className="info-row">

            <span>
              📞
            </span>

            <div>

              <strong>
                İletişim
              </strong>

              <p>
                05XX XXX XX XX
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* FOOTER */}

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

        <p>
          Kahve, lezzet ve güzel sohbet.
        </p>

        <small>
          © 2026 Taşkent Cafe
        </small>

      </footer>


      {/* ALT SABİT MENÜ */}

      <nav className="bottom-nav">

        <a
          href="#"
          className="nav-item active"
        >
          <span>
            ⌂
          </span>

          <small>
            Ana Sayfa
          </small>
        </a>


        <a
          href="#menu"
          className="nav-item"
        >
          <span>
            ☕
          </span>

          <small>
            Menü
          </small>
        </a>


        <a
          href="/loyalty"
          className="nav-item"
        >
          <span>
            ⭐
          </span>

          <small>
            Sadakat
          </small>
        </a>


        <a
          href="#location"
          className="nav-item"
        >
          <span>
            📍
          </span>

          <small>
            Konum
          </small>
        </a>

      </nav>

    </main>
  );
}