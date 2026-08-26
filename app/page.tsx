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

      <section className="hero">

        <div className="hero-overlay">

          <span className="location-label">
            📍 Mardin Kale
          </span>

          <h2 className="welcome-title">
            Mardin Taşkent Cafe’ye
            Hoşgeldiniz
          </h2>

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
            hizmetiyle öne çıkar.
            Özenle hazırlanan kahvelerimiz,
            taze içeceklerimiz ve lezzetli
            menümüzle ister arkadaşlarınızla
            buluşun ister tek başınıza
            huzurlu bir mola verin.
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
        className="quick-links"
      >

        <a
          href="#menu"
          className="quick-card"
        >
          <span>📖</span>

          <strong>Menü</strong>

          <small>
            Tüm ürünler
          </small>
        </a>

        <a
          href="#loyalty"
          className="quick-card"
        >
          <span>⭐</span>

          <strong>Sadakat</strong>

          <small>
            Puan kazan
          </small>
        </a>

        <a
          href="#location"
          className="quick-card"
        >
          <span>📍</span>

          <strong>Konum</strong>

          <small>
            Bizi bul
          </small>
        </a>

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

          <span>
            Taşkent Cafe
          </span>

        </div>

        <p>
          Kahve, lezzet ve güzel sohbet.
        </p>

        <div className="footer-links">

          <a href="#menu">
            Menü
          </a>

          <a href="#loyalty">
            Sadakat
          </a>

          <a href="#location">
            Konum
          </a>

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
          <span>⌂</span>
          Ana Sayfa
        </a>

        <a
          href="#menu"
          className="nav-item"
        >
          <span>☕</span>
          Menü
        </a>

        <a
          href="#loyalty"
          className="nav-item"
        >
          <span>⭐</span>
          Sadakat
        </a>

        <a
          href="#location"
          className="nav-item"
        >
          <span>📍</span>
          Konum
        </a>

      </nav>

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
                        disabled={
                          waiterLoading
                        }
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
            setWaiterOpen(
              !waiterOpen
            )
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

      <style jsx global>{`

        .hero {
          width: 50%;
          margin-left: auto;
          margin-right: auto;
        }

        .welcome-title {
          margin-top: 12px;
          font-size: 31px;
          line-height: 1.08;
          letter-spacing: -1px;
          white-space: nowrap;
        }

        .hero-overlay {
          left: 18px;
          right: 18px;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo {
          width: 52px;
          height: 52px;
          min-width: 52px;
          border-radius: 50%;
          overflow: hidden;
          background: #ffffff;
          border: 2px solid rgba(91, 57, 35, 0.12);
          box-shadow:
            0 4px 14px
              rgba(45, 28, 18, 0.12);
        }

        .logo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          border-radius: 50%;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .footer-logo img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        .waiter-widget {
          position: fixed;
          right: 18px;
          bottom: 82px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          pointer-events: none;
        }

        .waiter-floating-button,
        .waiter-panel {
          pointer-events: auto;
        }

        .waiter-floating-button {
          position: relative;
          width: 68px;
          height: 68px;
          border: 0;
          border-radius: 50%;
          background: linear-gradient(
            145deg,
            #8b5e3c,
            #5d3823
          );
          color: #ffffff;
          box-shadow:
            0 8px 25px
              rgba(55, 31, 17, 0.30),
            0 2px 6px
              rgba(0, 0, 0, 0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .waiter-floating-button:hover {
          transform: translateY(-2px);
          box-shadow:
            0 12px 30px
              rgba(55, 31, 17, 0.35),
            0 3px 8px
              rgba(0, 0, 0, 0.16);
        }

        .waiter-floating-button:active {
          transform: scale(0.94);
        }

        .waiter-floating-button.success {
          background: linear-gradient(
            145deg,
            #4d9364,
            #28633c
          );
        }

        .waiter-floating-icon {
          font-size: 30px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .waiter-floating-label {
          position: absolute;
          right: 74px;
          white-space: nowrap;
          background: #ffffff;
          color: #3a291f;
          font-size: 12px;
          font-weight: 700;
          padding: 7px 11px;
          border-radius: 20px;
          box-shadow:
            0 4px 16px
              rgba(0, 0, 0, 0.12);
          opacity: 0;
          transform: translateX(6px);
          transition:
            opacity 0.2s ease,
            transform 0.2s ease;
          pointer-events: none;
        }

        .waiter-floating-button:hover
          .waiter-floating-label {
          opacity: 1;
          transform: translateX(0);
        }

        .waiter-pulse {
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 2px solid
            rgba(139, 94, 60, 0.35);
          animation:
            waiterPulse 1.8s
            infinite;
        }

        @keyframes waiterPulse {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }

          70% {
            transform: scale(1.15);
            opacity: 0;
          }

          100% {
            transform: scale(0.95);
            opacity: 0;
          }
        }

        .waiter-panel {
          width: 320px;
          max-width: calc(100vw - 36px);
          overflow: hidden;
          border-radius: 22px;
          background: #fffaf5;
          box-shadow:
            0 15px 45px
              rgba(42, 26, 16, 0.22);
          border: 1px solid #eaded3;
        }

        .waiter-panel-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px;
          background: #f3e7db;
        }

        .waiter-avatar-small {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border-radius: 13px;
          background: #b96f38;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .waiter-panel-header > div:nth-child(2) {
          flex: 1;
        }

        .waiter-panel-header strong {
          display: block;
          font-size: 12px;
        }

        .waiter-panel-header span {
          display: block;
          margin-top: 3px;
          color: #8f8177;
          font-size: 9px;
        }

        .waiter-close {
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 9px;
          background: rgba(255,255,255,0.65);
          color: #5d4a3c;
          font-size: 20px;
        }

        .waiter-panel-body {
          padding: 17px;
        }

        .waiter-table-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 13px;
          border-radius: 12px;
          background: #f4e9df;
        }

        .waiter-table-info span {
          color: #8e7e71;
          font-size: 9px;
        }

        .waiter-table-info strong {
          color: #6a432c;
          font-size: 12px;
        }

        .waiter-panel-text {
          margin: 15px 0;
          color: #75675d;
          font-size: 11px;
          line-height: 1.5;
        }

        .waiter-call-button {
          width: 100%;
          height: 43px;
          border: 0;
          border-radius: 12px;
          background: #b96f38;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          font-size: 10px;
          font-weight: 700;
        }

        .waiter-call-button:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .waiter-location-note {
          display: block;
          margin-top: 10px;
          color: #a19489;
          font-size: 8px;
          line-height: 1.4;
        }

        .waiter-success-box {
          display: flex;
          gap: 11px;
          align-items: center;
          margin-top: 14px;
          padding: 13px;
          border-radius: 14px;
          background: #e8f2e9;
        }

        .waiter-success-icon {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          border-radius: 11px;
          background: #4d9364;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .waiter-success-box strong {
          display: block;
          color: #35613f;
          font-size: 11px;
        }

        .waiter-success-box p {
          margin-top: 3px;
          color: #66806d;
          font-size: 9px;
        }

        .waiter-error-box {
          margin: 10px 0;
          padding: 10px;
          border-radius: 10px;
          background: #f8e7e3;
          color: #9a4e42;
          font-size: 9px;
          line-height: 1.4;
        }

        .waiter-panel-empty {
          text-align: center;
          padding: 12px 5px 5px;
        }

        .waiter-empty-icon {
          width: 52px;
          height: 52px;
          margin: 0 auto 10px;
          border-radius: 16px;
          background: #f2e5d8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
        }

        .waiter-panel-empty strong {
          display: block;
          font-size: 12px;
        }

        .waiter-panel-empty p {
          margin-top: 6px;
          color: #95877c;
          font-size: 9px;
          line-height: 1.5;
        }

        @media (max-width: 699px) {

          .hero {
            width: 100%;
          }

          .welcome-title {
            font-size: 28px;
            white-space: normal;
          }

        }

      `}</style>

    </main>
  );
}