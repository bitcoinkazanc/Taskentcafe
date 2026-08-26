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
          width: "50%",
          minWidth: "320px",
          marginLeft: "auto",
          marginRight: "auto",
          backgroundImage: `linear-gradient(
            180deg,
            rgba(25, 18, 13, 0.12) 10%,
            rgba(25, 18, 13, 0.88) 100%
          ), url("${mardinImageUrl}")`,
        }}
      >

        <div
          className="hero-overlay"
          style={{
            top: "22px",
            bottom: "auto",
          }}
        >

          <div
            className="antique-welcome-frame"
            style={{
              position: "relative",
              padding: "18px 22px",
              border: "2px solid rgba(218, 177, 130, 0.9)",
              outline:
                "1px solid rgba(218, 177, 130, 0.45)",
              outlineOffset: "-7px",
              background:
                "rgba(38, 25, 16, 0.28)",
              boxShadow:
                "0 5px 18px rgba(0, 0, 0, 0.18)",
            }}
          >

            <span
              style={{
                position: "absolute",
                top: "-10px",
                left: "10px",
                fontSize: "22px",
                color: "#dfb98d",
              }}
            >
              ❦
            </span>

            <span
              style={{
                position: "absolute",
                top: "-10px",
                right: "10px",
                fontSize: "22px",
                color: "#dfb98d",
              }}
            >
              ❦
            </span>

            <span
              style={{
                position: "absolute",
                bottom: "-10px",
                left: "10px",
                fontSize: "22px",
                color: "#dfb98d",
              }}
            >
              ❦
            </span>

            <span
              style={{
                position: "absolute",
                bottom: "-10px",
                right: "10px",
                fontSize: "22px",
                color: "#dfb98d",
              }}
            >
              ❦
            </span>

            <h2
              style={{
                margin: 0,
                color: "#fff8ef",
                fontSize: "8px",
                lineHeight: "1.2",
                textAlign: "center",
              }}
            >
              Mardin Taşkent Cafe’ye
              <br />
              Hoşgeldiniz
            </h2>

          </div>

          <p>
            Mardin’in tarihi dokusuyla
            iç içe, eşsiz bir atmosferde
            hizmet veren Taşkent Cafe,
            misafirlerine hem geleneksel
            hem de modern lezzetleri bir
            arada sunar.
          </p>

          <p>
            Şehrin büyüleyici manzarasına
            karşı keyifli vakit
            geçirebileceğiniz mekanımız,
            sıcak ortamı ve güler yüzlü
            hizmetiyle öne çıkar. Özenle
            hazırlanan kahvelerimiz, taze
            içeceklerimiz ve lezzetli
            menümüzle ister
            arkadaşlarınızla buluşun ister
            tek başınıza huzurlu bir mola
            verin.
          </p>

          <p>
            Taşkent Cafe, Mardin’de lezzet
            ve samimiyetin buluştuğu özel
            bir noktadır. Her ziyaretinizde
            kendinizi evinizde hissedeceğiniz
            Taşkent Cafe’ye bekliyoruz.
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

      <section
        className="contact-section"
        id="contact"
      >

        <span className="eyebrow">
          İLETİŞİM
        </span>

        <h2>
          Taşkent Cafe
        </h2>

        <p>
          Bize ulaşmak ve daha fazla
          bilgi almak için iletişim
          bilgilerimizi kullanabilirsiniz.
        </p>

        <a
          href="tel:+905XXXXXXXXX"
          className="contact-button"
        >
          📞 İletişim
        </a>

      </section>

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

    </main>
  );
}