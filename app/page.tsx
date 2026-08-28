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

type Product = {
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

function getCategoryIcon(category: string) {
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
      return "🍴";
  }
}

export default function HomePage() {
  const [category, setCategory] = useState("Tümü");

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [table, setTable] = useState<CafeTable | null>(null);
  const [tableLoading, setTableLoading] = useState(false);

  const [waiterLoading, setWaiterLoading] = useState(false);
  const [waiterMessage, setWaiterMessage] = useState("");
  const [waiterError, setWaiterError] = useState("");
  const [waiterOpen, setWaiterOpen] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError("");

        const { data, error } = await supabase
          .from("products")
          .select(
            "id,name,category,description,price,image_url,active,sort_order"
          )
          .eq("active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("PRODUCT LOAD ERROR:", error);
          setProductsError("Menü ürünleri yüklenemedi.");
          return;
        }

        setProducts((data || []) as Product[]);
      } catch (error) {
        console.error("PRODUCT ERROR:", error);
        setProductsError("Menü ürünleri yüklenemedi.");
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts =
    category === "Tümü"
      ? products
      : products.filter((product) => product.category === category);

  useEffect(() => {
    const loadTable = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const qrToken = params.get("table");

        if (!qrToken) {
          return;
        }

        setTableLoading(true);

        const { data, error } = await supabase.rpc("get_cafe_table", {
          requested_qr_token: qrToken,
        });

        if (error) {
          console.error("TABLE LOAD ERROR:", error);
          setWaiterError("Masa bilgisi alınamadı.");
          return;
        }

        setTable(data as CafeTable);
      } catch (error) {
        console.error("TABLE ERROR:", error);
        setWaiterError("Masa bilgisi alınamadı.");
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
          const { error } = await supabase.rpc("create_waiter_call", {
            requested_table_id: table.id,
            user_latitude: position.coords.latitude,
            user_longitude: position.coords.longitude,
          });

          if (error) {
            throw new Error(error.message);
          }

          setWaiterMessage(
            `Garsonunuz Masa ${table.table_number} için çağrıldı.`
          );
          setWaiterError("");
        } catch (error) {
          console.error("WAITER CALL ERROR:", error);

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
        console.error("LOCATION ERROR:", error);

        let message = "Konumunuz alınamadı.";

        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Garson çağırmak için konum izni vermelisiniz.";
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          message =
            "Konumunuz belirlenemedi. Lütfen GPS'i açıp tekrar deneyin.";
        }

        if (error.code === error.TIMEOUT) {
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
      <header className="hero-header">
        <div className="brand">
          <div className="logo">
            <img src={logoUrl} alt="Taşkent Cafe" />
          </div>

          <div className="brand-text">
            <h1>Taşkent Cafe</h1>
            <span>Keyif burada başlar</span>
          </div>
        </div>

        <div className="hero-location">
          <span>📍</span>
          <span>Mardin Kale</span>
        </div>
      </header>

      <section className="welcome">
        <span className="welcome-eyebrow">
          HOŞ GELDİNİZ
        </span>

        <h2>
          Kahvenizi seçin,
          <br />
          keyfinize bakın.
        </h2>

        <p>
          Taze kahveler, lezzetli atıştırmalıklar
          ve güzel sohbetler için doğru yerdesiniz.
        </p>
      </section>

      <section className="loyalty-card" id="loyalty">
        <div className="loyalty-card-content">
          <span className="loyalty-label">
            ⭐ SADAKAT KULÜBÜ
          </span>

          <h2>
            Her kahvede
            <br />
            daha fazla kazanın.
          </h2>

          <p>
            Puan biriktirin, özel ödüllerin ve
            avantajların tadını çıkarın.
          </p>

          <a
            href="/loyalty"
            className="loyalty-button"
          >
            Sadakat Kulübüne Katıl
            <span>→</span>
          </a>
        </div>

        <div className="loyalty-decoration">
          ⭐
        </div>
      </section>

      <section className="menu-section" id="menu">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">
              TAŞKENT CAFE
            </span>

            <h2>Menümüz</h2>

            <p>
              Size özel hazırlanan lezzetler
            </p>
          </div>

          <div className="product-count">
            {productsLoading
              ? "..."
              : `${filteredProducts.length} ürün`}
          </div>
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

        {productsLoading && (
          <div className="menu-loading">
            <div className="loading-spinner" />
            <strong>Menümüz hazırlanıyor...</strong>
          </div>
        )}

        {!productsLoading && productsError && (
          <div className="menu-error">
            ⚠️ {productsError}
          </div>
        )}

        {!productsLoading &&
          !productsError &&
          filteredProducts.length === 0 && (
            <div className="menu-empty">
              <div>🍽️</div>
              <strong>
                Bu kategoride ürün bulunmuyor.
              </strong>
              <span>
                Yakında yeni ürünler eklenecek.
              </span>
            </div>
          )}

        {!productsLoading &&
          !productsError &&
          filteredProducts.length > 0 && (
            <div className="products">
              {filteredProducts.map((product) => (
                <article
                  className="product-card"
                  key={product.id}
                >
                  <div className="product-image">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                      />
                    ) : (
                      <span>
                        {getCategoryIcon(product.category)}
                      </span>
                    )}
                  </div>

                  <div className="product-content">
                    <div className="product-info">
                      <span className="product-category">
                        {product.category}
                      </span>

                      <h3>{product.name}</h3>

                      {product.description && (
                        <p>{product.description}</p>
                      )}
                    </div>

                    <div className="product-bottom">
                      <strong>
                        {Number(product.price).toLocaleString(
                          "tr-TR",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          }
                        )}{" "}
                        ₺
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
              ))}
            </div>
          )}
      </section>

      <section className="location-section" id="location">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">
              BİZİ ZİYARET ET
            </span>

            <h2>Taşkent Cafe</h2>

            <p>
              Mardin'in kalbinde sizi bekliyoruz.
            </p>
          </div>
        </div>

        <div className="location-card">
          <div className="location-icon">
            📍
          </div>

          <div>
            <span>ADRES</span>
            <strong>Mardin Kale</strong>
            <p>
              Taşkent Cafe
            </p>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <span>🕐</span>
            <div>
              <strong>Çalışma Saatleri</strong>
              <p>Her gün 09:00 – 00:00</p>
            </div>
          </div>

          <div className="info-card">
            <span>📞</span>
            <div>
              <strong>İletişim</strong>
              <p>05XX XXX XX XX</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          <img src={logoUrl} alt="Taşkent Cafe" />
        </div>

        <strong>Taşkent Cafe</strong>

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

              <div className="waiter-header-text">
                <strong>Garson Hizmeti</strong>
                <span>
                  Size nasıl yardımcı olabiliriz?
                </span>
              </div>

              <button
                type="button"
                className="waiter-close"
                onClick={() => setWaiterOpen(false)}
                aria-label="Kapat"
              >
                ×
              </button>
            </div>

            <div className="waiter-panel-body">
              {table ? (
                <>
                  <div className="waiter-table-info">
                    <span>Masanız</span>
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
                          Masa {table.table_number} için
                          çağrınız alındı.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="waiter-panel-text">
                        Masanıza bir garson
                        göndermemizi ister misiniz?
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
                          waiterLoading ||
                          tableLoading
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
                        📍 Cafe içinde olduğunuz
                        konum kontrolüyle doğrulanır.
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
                      Garson çağırabilmek için
                      masanızdaki QR kodu
                      okutmanız gerekiyor.
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
            {waiterMessage ? "✓" : "👩🏻‍🍳"}
          </span>

          <span className="waiter-floating-label">
            {waiterMessage
              ? "Garson geliyor"
              : "Garson"}
          </span>

          {!waiterOpen && !waiterMessage && (
            <span className="waiter-pulse" />
          )}
        </button>
      </div>

      <style jsx global>{`
        :root {
          --brown-dark: #382a21;
          --brown: #8b5e3c;
          --brown-light: #b96f38;
          --cream: #fffaf5;
          --cream-dark: #f4e9df;
          --text: #33271f;
          --muted: #8f8176;
          --border: #eadfd5;
        }

        html {
          scroll-behavior: smooth;
          scroll-padding-top: 20px;
        }

        body {
          margin: 0;
          background: #f8f2ec;
          color: var(--text);
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .site {
          width: 100%;
          max-width: 620px;
          margin: 0 auto;
          min-height: 100vh;
          padding: 0 18px 110px;
          box-sizing: border-box;
        }

        .hero-header {
          padding: 24px 2px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo {
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          overflow: hidden;
          border-radius: 50%;
          background: #fff;
          border: 2px solid rgba(91, 57, 35, 0.12);
          box-shadow:
            0 5px 18px rgba(45, 28, 18, 0.13);
        }

        .logo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          border-radius: 50%;
        }

        .brand-text h1 {
          margin: 0;
          color: var(--brown-dark);
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .brand-text span {
          display: block;
          margin-top: 4px;
          color: var(--muted);
          font-size: 11px;
          font-weight: 500;
        }

        .hero-location {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #806f62;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .welcome {
          padding: 25px 4px 23px;
        }

        .welcome-eyebrow,
        .section-eyebrow {
          display: block;
          color: var(--brown);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.6px;
        }

        .welcome h2 {
          margin: 9px 0 11px;
          color: var(--brown-dark);
          font-size: 32px;
          line-height: 1.08;
          letter-spacing: -1.2px;
          font-weight: 850;
        }

        .welcome p {
          max-width: 450px;
          margin: 0;
          color: #806f62;
          font-size: 13px;
          line-height: 1.65;
        }

        .loyalty-card {
          position: relative;
          overflow: hidden;
          min-height: 230px;
          margin: 6px 0 38px;
          padding: 25px;
          border-radius: 24px;
          background:
            radial-gradient(
              circle at 90% 15%,
              rgba(255, 255, 255, 0.18),
              transparent 28%
            ),
            linear-gradient(
              135deg,
              #70492f,
              #3d2a20
            );
          color: #fff;
          box-shadow:
            0 14px 35px rgba(65, 38, 22, 0.2);
          box-sizing: border-box;
        }

        .loyalty-card-content {
          position: relative;
          z-index: 2;
        }

        .loyalty-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          color: #e8c8ad;
        }

        .loyalty-card h2 {
          margin: 12px 0 10px;
          font-size: 25px;
          line-height: 1.1;
          letter-spacing: -0.7px;
        }

        .loyalty-card p {
          max-width: 320px;
          margin: 0 0 18px;
          color: #d8c6b8;
          font-size: 11px;
          line-height: 1.55;
        }

        .loyalty-button {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 12px;
          background: #fff;
          color: #4b3325;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
          box-shadow:
            0 6px 18px rgba(0, 0, 0, 0.12);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .loyalty-button:active {
          transform: scale(0.97);
        }

        .loyalty-button span {
          font-size: 16px;
        }

        .loyalty-decoration {
          position: absolute;
          right: -12px;
          bottom: -32px;
          width: 145px;
          height: 145px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 70px;
          background: rgba(255, 255, 255, 0.07);
          transform: rotate(-8deg);
        }

        .menu-section,
        .location-section {
          scroll-margin-top: 15px;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 19px;
        }

        .section-heading h2 {
          margin: 5px 0 4px;
          color: var(--brown-dark);
          font-size: 28px;
          line-height: 1.1;
          letter-spacing: -0.8px;
        }

        .section-heading p {
          margin: 0;
          color: var(--muted);
          font-size: 11px;
        }

        .product-count {
          padding: 7px 10px;
          border-radius: 20px;
          background: #eee2d8;
          color: #765e4e;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .categories {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 3px 1px 12px;
          margin-bottom: 12px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .categories::-webkit-scrollbar {
          display: none;
        }

        .category {
          flex: 0 0 auto;
          min-height: 38px;
          padding: 0 14px;
          border: 1px solid var(--border);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.78);
          color: #77665a;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition:
            background 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
        }

        .category.active {
          background: var(--brown-dark);
          border-color: var(--brown-dark);
          color: #fff;
          box-shadow:
            0 5px 13px rgba(56, 42, 33, 0.18);
        }

        .category:active {
          transform: scale(0.96);
        }

        .products {
          display: grid;
          gap: 13px;
        }

        .product-card {
          display: flex;
          min-height: 128px;
          overflow: hidden;
          border: 1px solid #eadfd6;
          border-radius: 18px;
          background: #fffdfb;
          box-shadow:
            0 5px 17px rgba(59, 38, 24, 0.06);
        }

        .product-image {
          width: 118px;
          min-width: 118px;
          min-height: 128px;
          overflow: hidden;
          background: #f1e6dc;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .product-image span {
          display: flex;
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
          font-size: 42px;
        }

        .product-content {
          flex: 1;
          min-width: 0;
          padding: 15px 15px 13px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .product-category {
          display: block;
          margin-bottom: 5px;
          color: #a18169;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .product-info h3 {
          margin: 0;
          color: #3d3028;
          font-size: 15px;
          line-height: 1.25;
          font-weight: 800;
        }

        .product-info p {
          margin: 5px 0 0;
          color: #918177;
          font-size: 10px;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 9px;
        }

        .product-bottom strong {
          color: var(--brown);
          font-size: 16px;
          font-weight: 850;
        }

        .plus-button {
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 50%;
          background: #f0e2d6;
          color: #6f4a33;
          font-size: 19px;
          line-height: 1;
          cursor: pointer;
        }

        .menu-loading {
          min-height: 210px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #7d6c60;
          font-size: 11px;
        }

        .loading-spinner {
          width: 31px;
          height: 31px;
          border-radius: 50%;
          border: 3px solid #e9ddd3;
          border-top-color: var(--brown);
          animation: menuSpinner 0.8s linear infinite;
        }

        @keyframes menuSpinner {
          to {
            transform: rotate(360deg);
          }
        }

        .menu-error {
          padding: 15px;
          border-radius: 14px;
          background: #f5e5dd;
          color: #8b5034;
          text-align: center;
          font-size: 11px;
        }

        .menu-empty {
          min-height: 190px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 8px;
          color: #8f8176;
        }

        .menu-empty > div {
          font-size: 38px;
        }

        .menu-empty strong {
          color: #493a30;
          font-size: 13px;
        }

        .menu-empty span {
          font-size: 10px;
        }

        .location-section {
          margin-top: 48px;
        }

        .location-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 20px;
          border-radius: 20px;
          background: #fffdfb;
          border: 1px solid var(--border);
          box-shadow:
            0 5px 18px rgba(59, 38, 24, 0.05);
        }

        .location-icon {
          width: 52px;
          height: 52px;
          flex: 0 0 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: #f1e3d7;
          font-size: 25px;
        }

        .location-card span {
          display: block;
          color: #a18169;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .location-card strong {
          display: block;
          margin-top: 5px;
          color: #493a30;
          font-size: 15px;
        }

        .location-card p {
          margin: 3px 0 0;
          color: #8f8176;
          font-size: 10px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        .info-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 15px;
          border-radius: 16px;
          background: #fffdfb;
          border: 1px solid var(--border);
        }

        .info-card > span {
          font-size: 19px;
        }

        .info-card strong {
          display: block;
          color: #4d3b30;
          font-size: 10px;
        }

        .info-card p {
          margin: 4px 0 0;
          color: #8f8176;
          font-size: 9px;
          line-height: 1.4;
        }

        .footer {
          margin-top: 45px;
          padding: 30px 10px 10px;
          text-align: center;
          border-top: 1px solid #e6d9ce;
        }

        .footer-logo {
          width: 48px;
          height: 48px;
          margin: 0 auto 10px;
          overflow: hidden;
          border-radius: 50%;
          border: 2px solid rgba(91, 57, 35, 0.1);
        }

        .footer-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .footer strong {
          display: block;
          color: var(--brown-dark);
          font-size: 14px;
        }

        .footer p {
          margin: 5px 0 14px;
          color: #918177;
          font-size: 10px;
        }

        .footer small {
          color: #aa9a8d;
          font-size: 9px;
        }

        .waiter-widget {
          position: fixed;
          left: 18px;
          bottom: 82px;
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
          width: 62px;
          height: 62px;
          border: 0;
          border-radius: 50%;
          background: linear-gradient(
            145deg,
            #8b5e3c,
            #5d3823
          );
          color: #fff;
          box-shadow:
            0 8px 25px rgba(55, 31, 17, 0.28);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .waiter-floating-button.success {
          background: linear-gradient(
            145deg,
            #4d9364,
            #28633c
          );
        }

        .waiter-floating-icon {
          font-size: 28px;
          line-height: 1;
        }

        .waiter-floating-label {
          position: absolute;
          left: 70px;
          white-space: nowrap;
          padding: 7px 10px;
          border-radius: 18px;
          background: #fff;
          color: #3a291f;
          font-size: 11px;
          font-weight: 800;
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.12);
          opacity: 0;
          transform: translateX(-5px);
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
          border: 2px solid rgba(139, 94, 60, 0.3);
          animation: waiterPulse 1.8s infinite;
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
          max-width: calc(100vw - 36px);
          overflow: hidden;
          border: 1px solid #eee2d7;
          border-radius: 20px;
          background: #fffaf5;
          box-shadow:
            0 18px 50px rgba(43, 28, 18, 0.2);
        }

        .waiter-panel-header {
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #382a21;
          color: #fff;
        }

        .waiter-avatar-small {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.1);
          font-size: 20px;
        }

        .waiter-header-text {
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
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        .waiter-panel-body {
          padding: 15px;
        }

        .waiter-table-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
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
          margin: 13px 0 0;
          color: #74675d;
          font-size: 10px;
          line-height: 1.5;
        }

        .waiter-call-button {
          width: 100%;
          height: 42px;
          margin-top: 12px;
          padding: 0 13px;
          border: 0;
          border-radius: 11px;
          background: #b96f38;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 800;
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
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #4d9364;
          color: #fff;
          font-weight: 800;
        }

        .waiter-success-box strong {
          display: block;
          font-size: 11px;
        }

        .waiter-success-box p {
          margin: 3px 0 0;
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
          padding: 10px 5px 4px;
          text-align: center;
        }

        .waiter-empty-icon {
          margin-bottom: 8px;
          font-size: 30px;
        }

        .waiter-panel-empty strong {
          display: block;
          font-size: 12px;
        }

        .waiter-panel-empty p {
          margin: 6px 0 0;
          color: #998c81;
          font-size: 9px;
          line-height: 1.5;
        }

        @media (max-width: 480px) {
          .site {
            padding-left: 15px;
            padding-right: 15px;
          }

          .hero-header {
            padding-top: 18px;
          }

          .hero-location {
            display: none;
          }

          .welcome h2 {
            font-size: 30px;
          }

          .loyalty-card {
            padding: 22px;
          }

          .product-image {
            width: 105px;
            min-width: 105px;
          }
        }

        @media (max-width: 360px) {
          .product-image {
            width: 92px;
            min-width: 92px;
          }

          .product-content {
            padding: 12px;
          }

          .product-info h3 {
            font-size: 14px;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .waiter-widget {
            left: 14px;
          }
        }
      `}</style>
    </main>
  );
}