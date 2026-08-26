"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

type CafeTable = {
  id: string;
  table_number: string;
  qr_token: string;
  active: boolean;
};

const logoUrl =
  "https://raw.githubusercontent.com/bitcoinkazanc/Taskentcafe/main/taskent-logo.png";

const mardinImageUrl =
  "https://raw.githubusercontent.com/bitcoinkazanc/Taskentcafe/main/mardin-1.jpeg";

export default function HomePage() {
  const [category, setCategory] =
    useState("Sıcak İçecekler");

  const [table, setTable] =
    useState<CafeTable | null>(null);

  const [tableLoading, setTableLoading] =
    useState(false);

  const [waiterLoading, setWaiterLoading] =
    useState(false);

  const [waiterMessage, setWaiterMessage] =
    useState("");

  const [waiterError, setWaiterError] =
    useState("");

  const filteredProducts =
    products.filter(
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

        setTableLoading(true);

        const {
          data,
          error,
        } = await supabase.rpc(
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
      } finally {
        setTableLoading(false);
      }
    };

    loadTable();
  }, []);

  const callWaiter = () => {
    if (!table) {
      setWaiterError(
        "Garson çağırmak için masaya ait QR koddan giriş yapmalısınız."
      );

      setWaiterMessage("");
      return;
    }

    if (!navigator.geolocation) {
      setWaiterError(
        "Cihazınız konum özelliğini desteklemiyor."
      );

      setWaiterMessage("");
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

          const {
            error,
          } = await supabase.rpc(
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
            `Garson çağrınız alındı. Masa ${table.table_number} için personel bilgilendirildi.`
          );
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
        } finally {
          setWaiterLoading(false);
        }
      },
      (error) => {
        console.error(
          "LOCATION ERROR:",
          error
        );

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
    <main className="site">

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
              Taşkent Cafe
            </h1>

            <span>
              Keyif burada başlar
            </span>
          </div>

        </div>

      </header>

      {table && (
        <section className="waiter-bar">

          <div>
            <span>MASA</span>

            <strong>
              {table.table_number}
            </strong>
          </div>

          <button
            type="button"
            onClick={callWaiter}
            disabled={waiterLoading}
          >
            {waiterLoading
              ? "Konum kontrol ediliyor..."
              : "📣 Garson Çağır"}
          </button>

        </section>
      )}

      {(waiterMessage ||
        waiterError) && (
        <section className="waiter-status">

          {waiterMessage && (
            <div className="waiter-success">
              ✅ {waiterMessage}
            </div>
          )}

          {waiterError && (
            <div className="waiter-error">
              ⚠️ {waiterError}
            </div>
          )}

        </section>
      )}

      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(
            180deg,
            rgba(25, 18, 13, 0.18) 10%,
            rgba(25, 18, 13, 0.88) 100%
          ), url("${mardinImageUrl}")`,
        }}
      >

        <div className="hero-overlay">

          <span className="location-label">
            📍 Mardin Kale
          </span>

          <h2>
            Taşkent Cafe
          </h2>

          <p>
            Mardin’in tarihi dokusuyla iç içe,
            eşsiz bir atmosferde geleneksel ve
            modern lezzetleri bir arada sunuyoruz.
            Şehrin büyüleyici manzarasına karşı
            kahvenizi yudumlayıp güzel sohbetlerin
            tadını çıkarabileceğiniz sıcak bir
            ortam sizi bekliyor.
          </p>

          <p>
            Özenle hazırlanan kahvelerimiz,
            taze içeceklerimiz ve lezzetli
            menümüzle Taşkent Cafe,
            Mardin’de lezzet ve samimiyetin
            buluştuğu özel bir noktadır.
          </p>

        </div>

      </section>

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

        <div className="categories">

          {categories.map(
            (item) => (
              <button
                key={item}
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

      <section className="social-section">

        <div className="social-logo">

          <img
            src={logoUrl}
            alt="Taşkent Cafe"
          />

        </div>

        <h2>
          Taşkent Cafe
        </h2>

        <p>
          Kahve, lezzet ve güzel sohbet.
        </p>

        <div className="social-links">

          <a
            href="#"
            className="social-link"
            aria-label="Instagram"
          >
            ◎
          </a>

          <a
            href="#"
            className="social-link"
            aria-label="Facebook"
          >
            f
          </a>

          <a
            href="#"
            className="social-link"
            aria-label="WhatsApp"
          >
            ☎
          </a>

        </div>

        <a
          href="#contact"
          className="contact-link"
        >
          İletişim
        </a>

      </section>

      <footer className="footer">

        <div className="footer-brand">

          <img
            src={logoUrl}
            alt="Taşkent Cafe"
          />

          <strong>
            Taşkent Cafe
          </strong>

        </div>

        <small>
          © 2026 Taşkent Cafe
        </small>

      </footer>

      <nav className="bottom-nav">

        <a
          href="#"
          className="nav-item active"
        >
          <span>
            ⌂
          </span>
          Ana Sayfa
        </a>

        <a
          href="#menu"
          className="nav-item"
        >
          <span>
            ☕
          </span>
          Menü
        </a>

        <a
          href="/loyalty"
          className="nav-item"
        >
          <span>
            ⭐
          </span>
          Sadakat
        </a>

        <a
          href="#contact"
          className="nav-item"
        >
          <span>
            ☎
          </span>
          İletişim
        </a>

      </nav>

    </main>
  );
}