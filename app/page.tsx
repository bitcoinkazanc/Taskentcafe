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

const mardinImageUrl =
  "https://raw.githubusercontent.com/bitcoinkazanc/Taskentcafe/main/mardin-1.jpeg";

export default function HomePage() {
  const [category, setCategory] = useState("Tümü");
  const [table, setTable] = useState<CafeTable | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [waiterLoading, setWaiterLoading] = useState(false);
  const [waiterMessage, setWaiterMessage] = useState("");
  const [waiterError, setWaiterError] = useState("");
  const [waiterOpen, setWaiterOpen] = useState(false);

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

          setWaiterError(
            "Masa bilgisi alınamadı."
          );

          return;
        }

        setTable(data as CafeTable);
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
        "Garson çağırmak için masanıza ait QR koddan giriş yapmalısınız."
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

          const { error } = await supabase.rpc(
            "create_waiter_call",
            {
              requested_table_id: table.id,
              user_latitude: latitude,
              user_longitude: longitude,
            }
          );

          if (error) {
            throw new Error(error.message);
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
            <h1>Taşkent Cafe</h1>

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

      {(waiterMessage || waiterError) && (
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
            rgba(25, 18, 13, 0.18) 0%,
            rgba(25, 18, 13, 0.82) 100%
          ), url("${mardinImageUrl}")`,
        }}
      >

        <div className="hero-overlay">

          <h2
            style={{
              fontSize: "37px",
              lineHeight: "1.08",
              whiteSpace: "nowrap",
              letterSpacing: "-1px",
              marginTop: 0,
            }}
          >
            Mardin Taşkent Cafe'ye Hoşgeldiniz
          </h2>

          <p>
            Mardin’in tarihi dokusuyla iç içe,
            eşsiz bir atmosferde hizmet veren
            Taşkent Cafe, misafirlerine hem
            geleneksel hem de modern lezzetleri
            bir arada sunar.
          </p>

          <p>
            Şehrin büyüleyici manzarasına karşı
            keyifli vakit geçirebileceğiniz
            mekanımız, sıcak ortamı ve güler
            yüzlü hizmetiyle öne çıkar.
          </p>

          <p>
            Özenle hazırlanan kahvelerimiz,
            taze içeceklerimiz ve lezzetli
            menümüzle ister arkadaşlarınızla
            buluşun ister tek başınıza huzurlu
            bir mola verin.
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

          {categories.map((item) => (
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
          ))}

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

            <span>📍</span>

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

            <span>🕐</span>

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

            <span>📞</span>

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

      <div className="waiter-widget">

        {waiterOpen && (
          <div className="waiter-panel">

            <div className="waiter-panel-header">

              <div className="waiter-avatar-small">
                👩🏻‍🍳
              </div>

              <div>

                <strong>
                  Garson Hizmeti
                </strong>

                <span>
                  Size nasıl yardımcı olabiliriz?
                </span>

              </div>

              <button
                type="button"
                className="waiter-close"
                onClick={() =>
                  setWaiterOpen(false)
                }
                aria-label="Kapat"
              >
                ×
              </button>

            </div>

            <div className="waiter-panel-body">

              {table ? (
                <>

                  <div className="waiter-table-info">

                    <span>
                      Masanız
                    </span>

                    <strong>
                      Masa {table.table_number}
                    </strong>

                  </div>

                  {waiterMessage ? (

                    <div className="waiter-success-box">

                      <div className="waiter-success-icon">
                        ✓
                      </div>

                      <div>

                        <strong>
                          Garsonunuz geliyor
                        </strong>

                        <p>
                          Masa{" "}
                          {table.table_number}{" "}
                          için çağrınız
                          alındı.
                        </p>

                      </div>

                    </div>

                  ) : (

                    <>

                      <p className="waiter-panel-text">
                        Masanıza bir garson
                        göndermemizi ister
                        misiniz?
                      </p>

                      {waiterError && (
                        <div className="waiter-error-box">
                          ⚠️ {waiterError}
                        </div>
                      )}

                      <button
                        type="button"
                        className="waiter-call-button"
                        onClick={callWaiter}
                        disabled={waiterLoading}
                      >

                        <span>
                          {waiterLoading
                            ? "Konum kontrol ediliyor..."
                            : "📣 Garson Çağır"}
                        </span>

                        {!waiterLoading && (
                          <span>→</span>
                        )}

                      </button>

                      <small className="waiter-location-note">
                        📍 Cafe içinde
                        olduğunuz konum
                        kontrolüyle
                        doğrulanır.
                      </small>

                    </>

                  )}

                </>

              ) : (

                <>

                  <div className="waiter-panel-empty">

                    <div className="waiter-empty-icon">
                      📱
                    </div>

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
                    <div className="waiter-error-box">
                      ⚠️ {waiterError}
                    </div>
                  )}

                </>

              )}

            </div>

          </div>
        )}

        <button
          type="button"
          className={
            waiterMessage
              ? "waiter-floating-button success"
              : "waiter-floating-button"
          }
          onClick={() =>
            setWaiterOpen(!waiterOpen)
          }
          aria-label="Garson çağır"
        >

          <span className="waiter-floating-icon">
            {waiterMessage
              ? "✓"
              : "👩🏻‍🍳"}
          </span>

          <span className="waiter-floating-label">
            {waiterMessage
              ? "Garson geliyor"
              : "Garson"}
          </span>

          {!waiterOpen &&
            !waiterMessage && (
              <span className="waiter-pulse" />
            )}

        </button>

      </div>

    </main>
  );
}