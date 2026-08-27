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

type MenuItem = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  image_url: string | null;
  active: boolean;
  sort_order: number;
};

type CafeTable = {
  id: string;
  table_number: string;
  qr_token: string;
  active: boolean;
};

const logoUrl =
  "https://raw.githubusercontent.com/bitcoinkazanc/Taskentcafe/main/Taskent-logo.jpg";

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Sıcak İçecekler":
      return "☕";

    case "Soğuk İçecekler":
      return "🧊";

    case "Kahvaltı":
      return "🍳";

    case "Yemek":
      return "🍽️";

    case "Tatlı":
      return "🍰";

    case "Çerez":
      return "🥜";

    default:
      return "☕";
  }
};

export default function HomePage() {
  const [category, setCategory] = useState("Tümü");

  const [products, setProducts] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

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

  const [waiterOpen, setWaiterOpen] =
    useState(false);

  /*
   * =========================
   * MENÜYÜ SUPABASE'DEN AL
   * =========================
   */

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setMenuLoading(true);
        setMenuError("");

        const { data, error } = await supabase
          .from("menu_items")
          .select(
            `
              id,
              name,
              category,
              description,
              price,
              image_url,
              active,
              sort_order
            `
          )
          .eq("active", true)
          .order("sort_order", {
            ascending: true,
          })
          .order("created_at", {
            ascending: true,
          });

        if (error) {
          console.error(
            "MENU LOAD ERROR:",
            error
          );

          throw new Error(
            error.message
          );
        }

        setProducts(
          (data ?? []) as MenuItem[]
        );
      } catch (error) {
        console.error(
          "MENU ERROR:",
          error
        );

        setMenuError(
          error instanceof Error
            ? error.message
            : "Menü yüklenemedi."
        );
      } finally {
        setMenuLoading(false);
      }
    };

    loadMenu();
  }, []);

  /*
   * =========================
   * KATEGORİ FİLTRESİ
   * =========================
   */

  const filteredProducts =
    category === "Tümü"
      ? products
      : products.filter(
          (product) =>
            product.category === category
        );

  /*
   * =========================
   * MASA / QR KONTROLÜ
   * =========================
   */

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

        /*
         * RPC tek kayıt veya dizi
         * döndürebileceği için ikisini
         * de güvenli şekilde ele alıyoruz.
         */

        const tableData =
          Array.isArray(data)
            ? data[0]
            : data;

        if (!tableData) {
          setWaiterError(
            "Masa bilgisi bulunamadı."
          );

          return;
        }

        setTable(
          tableData as CafeTable
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

  /*
   * =========================
   * GARSON ÇAĞIR
   * =========================
   */

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

      {/* =========================
          ÜST LOGO
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
              Taşkent Cafe
            </h1>

            <span>
              Keyif burada başlar
            </span>

          </div>

        </div>

      </header>


      {/* =========================
          SADAKAT KULÜBÜ
      ========================= */}

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


      {/* =========================
          MENÜ
      ========================= */}

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


        {/* MENÜ YÜKLENİYOR */}

        {menuLoading && (

          <div className="menu-state">

            <div className="menu-state-icon">
              ☕
            </div>

            <strong>
              Menü yükleniyor...
            </strong>

            <p>
              Güncel ürünler getiriliyor.
            </p>

          </div>

        )}


        {/* MENÜ HATASI */}

        {!menuLoading &&
          menuError && (

            <div className="menu-state error">

              <div className="menu-state-icon">
                ⚠️
              </div>

              <strong>
                Menü yüklenemedi
              </strong>

              <p>
                {menuError}
              </p>

            </div>

          )}


        {/* ÜRÜNLER */}

        {!menuLoading &&
          !menuError &&
          filteredProducts.length > 0 && (

            <div className="products">

              {filteredProducts.map(
                (product) => (

                  <article
                    className="product-card"
                    key={product.id}
                  >

                    <div className="product-image">

                      {product.image_url ? (

                        <img
                          src={
                            product.image_url
                          }
                          alt={
                            product.name
                          }
                          loading="lazy"
                        />

                      ) : (

                        getCategoryIcon(
                          product.category
                        )

                      )}

                    </div>


                    <div className="product-content">

                      <div>

                        <h3>
                          {product.name}
                        </h3>

                        <p>
                          {product.description ||
                            "Taşkent Cafe'nin özel lezzetlerinden."}
                        </p>

                      </div>


                      <div className="product-bottom">

                        <strong>

                          {Number(
                            product.price
                          ).toLocaleString(
                            "tr-TR",
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            }
                          )}{" "}
                          ₺

                        </strong>


                        <button
                          className="plus-button"
                          aria-label={`${product.name} detay`}
                          type="button"
                        >
                          +
                        </button>

                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          )}


        {/* KATEGORİDE ÜRÜN YOK */}

        {!menuLoading &&
          !menuError &&
          filteredProducts.length === 0 && (

            <div className="menu-state">

              <div className="menu-state-icon">
                ☕
              </div>

              <strong>
                Bu kategoride ürün yok
              </strong>

              <p>
                Yakında yeni ürünler
                eklenecek.
              </p>

            </div>

          )}

      </section>


      {/* =========================
          KONUM
      ========================= */}

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

        <p>
          Kahve, lezzet ve güzel sohbet.
        </p>

        <small>
          © 2026 Taşkent Cafe
        </small>

      </footer>


      {/* =========================
          GARSON ÇAĞIRMA
      ========================= */}

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
                      Masa{" "}
                      {table.table_number}
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
                        onClick={
                          callWaiter
                        }
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
                          <span>
                            →
                          </span>
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


      {/* =========================
          STİLLER
      ========================= */}

      <style jsx global>{`

        .header {
          display: flex;
          align-items: center;
          justify-content: flex-start;
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
          border: 2px solid rgba(
            91,
            57,
            35,
            0.12
          );
          box-shadow:
            0 4px 14px
              rgba(
                45,
                28,
                18,
                0.12
              );
        }

        .logo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          border-radius: 50%;
        }


        /* =========================
           MENÜ DURUMLARI
        ========================= */

        .menu-state {
          margin-top: 18px;
          padding: 30px 20px;
          border-radius: 18px;
          border: 1px solid #eee4da;
          background: #ffffff;
          text-align: center;
        }

        .menu-state.error {
          background: #fff8f4;
          border-color: #ead7ca;
        }

        .menu-state-icon {
          width: 52px;
          height: 52px;
          margin: 0 auto 10px;
          border-radius: 50%;
          background: #f3e8dd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
        }

        .menu-state strong {
          display: block;
          color: #493a30;
          font-size: 13px;
        }

        .menu-state p {
          margin-top: 6px;
          color: #998c81;
          font-size: 10px;
          line-height: 1.5;
        }


        /* =========================
           ÜRÜN RESMİ
        ========================= */

        .product-image {
          overflow: hidden;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }


        /* =========================
           GARSON
        ========================= */

        .waiter-widget {
          position: fixed;
          left: 18px;
          right: auto;
          bottom: 24px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
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
              rgba(
                55,
                31,
                17,
                0.30
              ),
            0 2px 6px
              rgba(
                0,
                0,
                0,
                0.15
              );
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
          left: 74px;
          white-space: nowrap;
          background: #ffffff;
          color: #3a291f;
          font-size: 12px;
          font-weight: 700;
          padding: 7px 11px;
          border-radius: 20px;
          box-shadow:
            0 4px 16px
              rgba(
                0,
                0,
                0,
                0.12
              );
          opacity: 0;
          transform: translateX(-6px);
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
            rgba(
              139,
              94,
              60,
              0.35
            );
          animation:
            waiterPulse 1.8s infinite;
        }

        @keyframes waiterPulse {
          0% {
            transform: scale(0.92);
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

        .waiter-panel {
          width: 310px;
          max-width: calc(
            100vw - 36px
          );
          border-radius: 20px;
          overflow: hidden;
          background: #fffaf5;
          box-shadow:
            0 18px 50px
              rgba(
                43,
                28,
                18,
                0.20
              ),
            0 4px 14px
              rgba(
                0,
                0,
                0,
                0.08
              );
          border: 1px solid #eee2d7;
        }

        .waiter-panel-header {
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #382a21;
          color: white;
        }

        .waiter-avatar-small {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border-radius: 13px;
          background: rgba(
            255,
            255,
            255,
            0.1
          );
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .waiter-panel-header
          > div:nth-child(2) {
          flex: 1;
          min-width: 0;
        }

        .waiter-panel-header strong {
          display: block;
          font-size: 12px;
        }

        .waiter-panel-header span {
          display: block;
          margin-top: 3px;
          color: #cdbfb4;
          font-size: 9px;
        }

        .waiter-close {
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 9px;
          background: rgba(
            255,
            255,
            255,
            0.1
          );
          color: white;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        .waiter-panel-body {
          padding: 15px;
        }

        .waiter-table-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 11px 12px;
          border-radius: 12px;
          background: #f3e8dd;
        }

        .waiter-table-info span {
          color: #8f8176;
          font-size: 9px;
        }

        .waiter-table-info strong {
          color: #493a30;
          font-size: 12px;
        }

        .waiter-panel-text {
          margin-top: 13px;
          color: #74675d;
          font-size: 10px;
          line-height: 1.5;
        }

        .waiter-call-button {
          width: 100%;
          height: 40px;
          margin-top: 12px;
          padding: 0 13px;
          border: 0;
          border-radius: 11px;
          background: #b96f38;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .waiter-call-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .waiter-location-note {
          display: block;
          margin-top: 9px;
          color: #9a8b7d;
          font-size: 8px;
          line-height: 1.4;
        }

        .waiter-success-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 13px;
          background: #e8f3e8;
          color: #47704b;
        }

        .waiter-success-icon {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border-radius: 50%;
          background: #4d9364;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .waiter-success-box strong {
          display: block;
          font-size: 11px;
        }

        .waiter-success-box p {
          margin-top: 3px;
          font-size: 9px;
        }

        .waiter-error-box {
          margin-top: 10px;
          padding: 10px 11px;
          border-radius: 11px;
          background: #f6e7df;
          color: #8a5135;
          font-size: 9px;
          line-height: 1.4;
        }

        .waiter-panel-empty {
          text-align: center;
          padding: 10px 5px 4px;
        }

        .waiter-empty-icon {
          font-size: 30px;
          margin-bottom: 8px;
        }

        .waiter-panel-empty strong {
          display: block;
          font-size: 12px;
        }

        .waiter-panel-empty p {
          margin-top: 6px;
          color: #998c81;
          font-size: 9px;
          line-height: 1.5;
        }

        @media (min-width: 700px) {
          .waiter-widget {
            left: calc(
              50% - 280px
            );
            right: auto;
            bottom: 36px;
          }
        }

        @media (max-width: 380px) {
          .waiter-widget {
            left: 14px;
            bottom: 18px;
          }

          .waiter-panel {
            width: 290px;
          }
        }

      `}</style>

    </main>
  );
}