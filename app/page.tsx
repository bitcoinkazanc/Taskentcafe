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

type Customer = {
  id: string;
  name: string | null;
  points: number;
  level: string;
};

const logoUrl =
  "https://raw.githubusercontent.com/bitcoinkazanc/Taskentcafe/main/taskent-logo.png";

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
  const [category, setCategory] = useState("Sıcak İçecekler");

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);

  const [table, setTable] = useState<CafeTable | null>(null);
  const [tableLoading, setTableLoading] = useState(false);

  const [waiterOpen, setWaiterOpen] = useState(false);
  const [waiterLoading, setWaiterLoading] = useState(false);
  const [waiterMessage, setWaiterMessage] = useState("");
  const [waiterError, setWaiterError] = useState("");

  useEffect(() => {
    loadProducts();
    loadLoyalty();
    loadTable();
  }, []);

  async function loadProducts() {
    try {
      setProductsLoading(true);
      setProductsError("");

      const { data, error } = await supabase
        .from("products")
        .select(
          "id,name,category,description,price,image_url,active,sort_order"
        )
        .eq("active", true)
        .order("sort_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("PRODUCTS ERROR:", error);
        setProductsError("Menü ürünleri yüklenemedi.");
        return;
      }

      setProducts((data ?? []) as Product[]);
    } catch (error) {
      console.error("PRODUCTS ERROR:", error);
      setProductsError("Menü ürünleri yüklenemedi.");
    } finally {
      setProductsLoading(false);
    }
  }

  async function loadLoyalty() {
    try {
      setLoyaltyLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCustomer(null);
        return;
      }

      const { data, error } = await supabase
        .from("customers")
        .select("id,name,points,level")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("LOYALTY ERROR:", error);
        setCustomer(null);
        return;
      }

      setCustomer(data as Customer | null);
    } catch (error) {
      console.error("LOYALTY ERROR:", error);
      setCustomer(null);
    } finally {
      setLoyaltyLoading(false);
    }
  }

  async function loadTable() {
    try {
      const params = new URLSearchParams(window.location.search);
      const qrToken = params.get("table");

      if (!qrToken) {
        setTable(null);
        return;
      }

      setTableLoading(true);
      setWaiterError("");

      const { data, error } = await supabase.rpc("get_cafe_table", {
        requested_qr_token: qrToken,
      });

      if (error) {
        console.error("TABLE ERROR:", error);
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
  }

  const filteredProducts = products.filter(
    (product) => product.category === category
  );

  function callWaiter() {
    if (!table) {
      setWaiterError(
        "Garson çağırmak için masanızdaki QR koddan giriş yapmalısınız."
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
            `Masa ${table.table_number} için garson çağrıldı.`
          );
        } catch (error) {
          console.error("WAITER CALL ERROR:", error);

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
        console.error("GEOLOCATION ERROR:", error);

        if (error.code === error.PERMISSION_DENIED) {
          setWaiterError(
            "Garson çağırmak için konum izni vermelisiniz."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setWaiterError("Konumunuz belirlenemedi.");
        } else if (error.code === error.TIMEOUT) {
          setWaiterError(
            "Konum alınırken zaman aşımı oluştu."
          );
        } else {
          setWaiterError("Konumunuz alınamadı.");
        }

        setWaiterMessage("");
        setWaiterLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  return (
    <main className="site">
      <header className="header">
        <div className="brand">
          <div className="logo">
            <img src={logoUrl} alt="Taşkent Cafe" />
          </div>

          <div className="brand-text">
            <h1>Taşkent Cafe</h1>

            <span>📍 Mardin Kale</span>
          </div>
        </div>
      </header>

      <section className="loyalty-card">
        <div className="loyalty-card-glow" />

        <div className="loyalty-top">
          <div className="loyalty-icon">⭐</div>

          <div className="loyalty-title">
            <span>SADAKAT KULÜBÜ</span>

            <strong>
              {customer
                ? `Merhaba, ${customer.name || "Misafir"}`
                : "Taşkent Cafe"}
            </strong>
          </div>
        </div>

        {loyaltyLoading ? (
          <div className="loyalty-loading">
            Bilgiler yükleniyor...
          </div>
        ) : customer ? (
          <div className="loyalty-stats">
            <div className="loyalty-stat">
              <span>PUANINIZ</span>

              <strong>{customer.points}</strong>
            </div>

            <div className="loyalty-divider" />

            <div className="loyalty-stat">
              <span>SEVİYE</span>

              <strong>{customer.level || "Başlangıç"}</strong>
            </div>
          </div>
        ) : (
          <div className="loyalty-guest">
            <p>
              Alışverişlerinden puan kazan,
              avantajları kaçırma.
            </p>

            <a href="/loyalty" className="loyalty-login">
              <span>Giriş</span>

              <span className="login-arrow">→</span>
            </a>
          </div>
        )}
      </section>

      <section className="menu-section">
        <div className="section-header">
          <div>
            <span className="eyebrow">MENÜ</span>
          </div>

          <span className="product-count">
            {productsLoading
              ? "..."
              : `${filteredProducts.length} ürün`}
          </span>
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
          <div className="loading">
            <div className="spinner" />
          </div>
        )}

        {!productsLoading && productsError && (
          <div className="error">{productsError}</div>
        )}

        {!productsLoading &&
          !productsError &&
          filteredProducts.length === 0 && (
            <div className="empty">
              <span>🍽️</span>

              <strong>
                Bu kategoride ürün bulunmuyor.
              </strong>
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
                      <strong className="price">
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
                        className="add-order-button"
                        onClick={() => {
                          // Sipariş sistemi
                          // sonraki aşamada
                          // buraya bağlanacak.
                        }}
                      >
                        <span className="add-icon">+</span>

                        <span>Siparişe Ekle</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
      </section>

      <div className="waiter-widget">
        {waiterOpen && (
          <div className="waiter-panel">
            <div className="waiter-header">
              <div className="waiter-avatar">👩🏻‍🍳</div>

              <div className="waiter-header-info">
                <strong>Garson Çağır</strong>

                {table ? (
                  <span>
                    Masa {table.table_number}
                  </span>
                ) : (
                  <span>Taşkent Cafe</span>
                )}
              </div>

              <button
                type="button"
                className="close"
                onClick={() => setWaiterOpen(false)}
                aria-label="Kapat"
              >
                ×
              </button>
            </div>

            <div className="waiter-body">
              {waiterMessage ? (
                <div className="success">
                  <div className="success-icon">✓</div>

                  <strong>Garson çağrınız alındı.</strong>

                  <span>{waiterMessage}</span>
                </div>
              ) : table ? (
                <>
                  {waiterError && (
                    <div className="error">
                      {waiterError}
                    </div>
                  )}

                  <button
                    type="button"
                    className="call-button"
                    onClick={callWaiter}
                    disabled={
                      waiterLoading || tableLoading
                    }
                  >
                    {waiterLoading
                      ? "📍 Konum kontrol ediliyor..."
                      : "📣 Garson Çağır"}
                  </button>
                </>
              ) : (
                <>
                  <div className="no-table">
                    <span>📱</span>

                    <strong>Masa bulunamadı</strong>

                    <p>
                      Garson çağırmak için
                      masanızdaki QR kodu okutun.
                    </p>
                  </div>

                  {waiterError && (
                    <div className="error">
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
          className={
            waiterMessage
              ? "waiter-button success-button"
              : "waiter-button"
          }
          onClick={() =>
            setWaiterOpen((open) => !open)
          }
          aria-label="Garson çağır"
        >
          <span className="waiter-icon">
            {waiterMessage ? "✓" : "👩🏻‍🍳"}
          </span>

          <small className="waiter-label">
            {waiterMessage ? "Çağrıldı" : "Garson"}
          </small>

          {!waiterMessage && (
            <>
              <i className="signal signal-one" />
              <i className="signal signal-two" />
              <i className="signal signal-three" />
            </>
          )}
        </button>
      </div>

      <footer className="footer">
        <div className="footer-brand">
          <div className="footer-logo">
            <img
              src={logoUrl}
              alt="Taşkent Cafe"
            />
          </div>

          <div>
            <strong>Taşkent Cafe</strong>

            <span>Mardin Kale</span>
          </div>
        </div>

        <p>Keyfinize keyif katıyoruz.</p>

        <div className="social-media">
          <a
            href="#"
            className="social-link"
            aria-label="Instagram"
            onClick={(event) => event.preventDefault()}
          >
            <span>◎</span>
          </a>

          <a
            href="#"
            className="social-link"
            aria-label="Facebook"
            onClick={(event) => event.preventDefault()}
          >
            <span>f</span>
          </a>

          <a
            href="#"
            className="social-link"
            aria-label="WhatsApp"
            onClick={(event) => event.preventDefault()}
          >
            <span>◔</span>
          </a>
        </div>

        <small>© 2026 Taşkent Cafe</small>
      </footer>

      <style jsx global>{`
        :root {
          --brown-dark: #382a21;
          --brown: #8b5e3c;
          --brown-light: #b96f38;
          --cream: #fffaf5;
          --page: #f8f2ec;
          --text: #33271f;
          --muted: #8f8176;
          --border: #eadfd5;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: var(--page);
          color: var(--text);
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button,
        input,
        select,
        textarea {
          font-family: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        .site {
          width: 100%;
          max-width: 620px;
          min-height: 100vh;
          margin: 0 auto;
          padding: 0 18px 130px;
        }

        .header {
          display: flex;
          align-items: center;
          padding: 20px 2px 17px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo {
          width: 62px;
          height: 62px;
          flex: 0 0 62px;
          overflow: hidden;
          border-radius: 50%;
          background: #fff;
          border: 2px solid
            rgba(91, 57, 35, 0.1);
          box-shadow:
            0 5px 18px
              rgba(45, 28, 18, 0.13);
        }

        .logo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .brand-text h1 {
          margin: 0;
          color: var(--brown-dark);
          font-size: 22px;
          line-height: 1.1;
          font-weight: 850;
          letter-spacing: -0.6px;
        }

        .brand-text span {
          display: block;
          margin-top: 5px;
          color: var(--muted);
          font-size: 11px;
          font-weight: 650;
        }

        .loyalty-card {
          position: relative;
          overflow: hidden;
          margin: 5px 0 28px;
          padding: 18px;
          border-radius: 22px;
          background:
            linear-gradient(
              135deg,
              #4a3428 0%,
              #382a21 55%,
              #2c211a 100%
            );
          color: #fff;
          box-shadow:
            0 12px 28px
              rgba(55, 34, 21, 0.19);
        }

        .loyalty-card-glow {
          position: absolute;
          width: 150px;
          height: 150px;
          right: -65px;
          top: -75px;
          border-radius: 50%;
          background: rgba(
            255,
            255,
            255,
            0.08
          );
        }

        .loyalty-top {
          position: relative;
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .loyalty-icon {
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(
            255,
            255,
            255,
            0.1
          );
          font-size: 22px;
        }

        .loyalty-title span {
          display: block;
          color: #d6c4b6;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 1.4px;
        }

        .loyalty-title strong {
          display: block;
          margin-top: 4px;
          font-size: 15px;
          font-weight: 800;
        }

        .loyalty-loading {
          position: relative;
          margin-top: 17px;
          padding-top: 15px;
          border-top: 1px solid
            rgba(255, 255, 255, 0.1);
          color: #cdbeb3;
          font-size: 10px;
        }

        .loyalty-stats {
          position: relative;
          display: flex;
          align-items: center;
          margin-top: 18px;
          padding-top: 15px;
          border-top: 1px solid
            rgba(255, 255, 255, 0.1);
        }

        .loyalty-stat {
          flex: 1;
        }

        .loyalty-stat span {
          display: block;
          color: #bfaea1;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .loyalty-stat strong {
          display: block;
          margin-top: 4px;
          color: #fff;
          font-size: 19px;
          font-weight: 850;
        }

        .loyalty-divider {
          width: 1px;
          height: 31px;
          margin: 0 18px;
          background: rgba(
            255,
            255,
            255,
            0.12
          );
        }

        .loyalty-guest {
          position: relative;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid
            rgba(255, 255, 255, 0.1);
        }

        .loyalty-guest p {
          margin: 0;
          color: #d6c7bd;
          font-size: 10px;
          line-height: 1.5;
        }

        .loyalty-login {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 86px;
          height: 34px;
          margin-top: 11px;
          padding: 0 14px;
          border: 1px solid
            rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          background: rgba(
            255,
            255,
            255,
            0.11
          );
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
          box-shadow:
            0 5px 14px
              rgba(0, 0, 0, 0.12);
          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }

        .loyalty-login:hover {
          background: rgba(
            255,
            255,
            255,
            0.18
          );
        }

        .loyalty-login:active {
          transform: scale(0.97);
        }

        .login-arrow {
          font-size: 13px;
          line-height: 1;
        }

        .menu-section {
          margin-top: 0;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .eyebrow {
          display: block;
          color: var(--brown);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 1.8px;
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
          padding: 2px 1px 12px;
          margin-bottom: 10px;
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
          background: #fffdfb;
          color: #77665a;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .category.active {
          background: var(--brown-dark);
          border-color: var(--brown-dark);
          color: #fff;
          box-shadow:
            0 5px 13px
              rgba(56, 42, 33, 0.18);
        }

        .products {
          display: grid;
          gap: 13px;
        }

        .product-card {
          display: flex;
          min-height: 140px;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: #fffdfb;
          box-shadow:
            0 5px 17px
              rgba(59, 38, 24, 0.06);
        }

        .product-image {
          width: 116px;
          min-width: 116px;
          min-height: 140px;
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
          font-size: 40px;
        }

        .product-content {
          flex: 1;
          min-width: 0;
          padding: 14px 13px 13px 15px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .product-info {
          min-width: 0;
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

        .product-content h3 {
          margin: 0;
          color: #3d3028;
          font-size: 15px;
          line-height: 1.25;
          font-weight: 800;
        }

        .product-content p {
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
          gap: 8px;
          margin-top: 10px;
        }

        .price {
          display: block;
          color: var(--brown);
          font-size: 16px;
          font-weight: 850;
          white-space: nowrap;
        }

        .add-order-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          min-height: 32px;
          padding: 0 9px;
          border: 1px solid
            rgba(139, 94, 60, 0.2);
          border-radius: 9px;
          background: #f7eee7;
          color: var(--brown-dark);
          font-size: 8px;
          font-weight: 850;
          white-space: nowrap;
          cursor: pointer;
          transition:
            background 0.2s ease,
            transform 0.15s ease;
        }

        .add-order-button:hover {
          background: #eee0d4;
        }

        .add-order-button:active {
          transform: scale(0.96);
        }

        .add-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--brown-dark);
          color: #fff;
          font-size: 14px;
          line-height: 1;
        }

        .loading {
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 31px;
          height: 31px;
          border-radius: 50%;
          border: 3px solid #e9ddd3;
          border-top-color: var(--brown);
          animation:
            spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .empty {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--muted);
          text-align: center;
        }

        .empty span {
          font-size: 38px;
        }

        .empty strong {
          color: #493a30;
          font-size: 13px;
        }

        .error {
          margin-top: 10px;
          padding: 11px;
          border-radius: 11px;
          background: #f6e7df;
          color: #8a5135;
          font-size: 10px;
          line-height: 1.45;
        }

        .waiter-widget {
          position: fixed;
          left: 18px;
          bottom: 40px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .waiter-button {
          position: relative;
          width: 64px;
          height: 64px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background:
            linear-gradient(
              145deg,
              #9a6844,
              #5d3823
            );
          color: #fff;
          box-shadow:
            0 8px 25px
              rgba(55, 31, 17, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          cursor: pointer;
          isolation: isolate;
        }

        /*
          GARSON BUTONU:
          İçerik üstte, halkalar arkada.
          Önceki sürümde signal z-index:-1 olduğu
          için halka bazı cihazlarda tamamen
          görünmez olabiliyordu.
        */

        .waiter-icon {
          position: relative;
          z-index: 3;
          display: block;
          font-size: 25px;
          line-height: 1;
        }

        .waiter-label {
          position: relative;
          z-index: 3;
          display: block;
          color: #fff;
          font-size: 8px;
          line-height: 1;
          font-weight: 800;
          opacity: 1;
          visibility: visible;
        }

        .success-button {
          background:
            linear-gradient(
              145deg,
              #4d9364,
              #28633c
            );
        }

        .signal {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 64px;
          height: 64px;
          border: 2px solid
            rgba(139, 94, 60, 0.6);
          border-radius: 50%;
          transform: translate(
            -50%,
            -50%
          );
          pointer-events: none;
          z-index: 1;
          opacity: 0;
          animation:
            signalPulse 2.4s
              ease-out infinite;
        }

        .signal-two {
          animation-delay: 0.8s;
        }

        .signal-three {
          animation-delay: 1.6s;
        }

        @keyframes signalPulse {
          0% {
            width: 64px;
            height: 64px;
            opacity: 0.65;
          }

          70% {
            width: 105px;
            height: 105px;
            opacity: 0;
          }

          100% {
            width: 105px;
            height: 105px;
            opacity: 0;
          }
        }

        .waiter-panel {
          width: 310px;
          max-width: calc(100vw - 36px);
          overflow: hidden;
          border: 1px solid #eee2d7;
          border-radius: 20px;
          background: var(--cream);
          box-shadow:
            0 18px 50px
              rgba(43, 28, 18, 0.2);
        }

        .waiter-header {
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--brown-dark);
          color: #fff;
        }

        .waiter-avatar {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: rgba(
            255,
            255,
            255,
            0.1
          );
          font-size: 20px;
        }

        .waiter-header-info {
          flex: 1;
          min-width: 0;
        }

        .waiter-header-info strong {
          display: block;
          font-size: 12px;
        }

        .waiter-header-info span {
          display: block;
          margin-top: 3px;
          color: #cdbfb4;
          font-size: 9px;
        }

        .close {
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
          color: #fff;
          font-size: 20px;
          cursor: pointer;
        }

        .waiter-body {
          padding: 15px;
        }

        .call-button {
          width: 100%;
          height: 43px;
          margin-top: 10px;
          border: 0;
          border-radius: 11px;
          background: #b96f38;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .call-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 10px;
          text-align: center;
          color: #47704b;
        }

        .success-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 3px;
          border-radius: 50%;
          background: #4d9364;
          color: #fff;
          font-size: 20px;
          font-weight: 800;
        }

        .success strong {
          font-size: 12px;
        }

        .success span {
          font-size: 9px;
        }

        .no-table {
          padding: 8px 5px;
          text-align: center;
        }

        .no-table > span {
          display: block;
          margin-bottom: 8px;
          font-size: 30px;
        }

        .no-table strong {
          display: block;
          font-size: 12px;
        }

        .no-table p {
          margin: 6px 0 0;
          color: #998c81;
          font-size: 9px;
          line-height: 1.5;
        }

        .footer {
          margin-top: 50px;
          padding: 24px 4px 0;
          border-top: 1px solid
            var(--border);
          text-align: center;
        }

        .footer-brand {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          text-align: left;
        }

        .footer-logo {
          width: 39px;
          height: 39px;
          overflow: hidden;
          border-radius: 50%;
          background: #fff;
        }

        .footer-logo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .footer-brand strong {
          display: block;
          color: var(--brown-dark);
          font-size: 11px;
        }

        .footer-brand span {
          display: block;
          margin-top: 2px;
          color: var(--muted);
          font-size: 8px;
        }

        .footer p {
          margin: 12px 0 9px;
          color: var(--muted);
          font-size: 9px;
        }

        /*
          SOSYAL MEDYA
          Alt bölüm geri getirildi.
          Link adresleri şimdilik placeholder;
          gerçek hesap adreslerini daha sonra
          değiştirebiliriz.
        */

        .social-media {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 0 0 10px;
        }

        .social-link {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: 50%;
          background: #fffdfb;
          color: var(--brown-dark);
          text-decoration: none;
          box-shadow:
            0 3px 10px
              rgba(59, 38, 24, 0.05);
          transition:
            transform 0.18s ease,
            background 0.18s ease;
        }

        .social-link:hover {
          background: #f4e9df;
          transform: translateY(-2px);
        }

        .social-link:active {
          transform: scale(0.94);
        }

        .social-link span {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          line-height: 1;
          font-weight: 850;
        }

        .footer small {
          color: #aa9d92;
          font-size: 8px;
        }

        @media (max-width: 480px) {
          .site {
            padding-left: 15px;
            padding-right: 15px;
          }

          .header {
            padding-top: 18px;
          }

          .product-image {
            width: 105px;
            min-width: 105px;
          }

          .waiter-widget {
            left: 15px;
            bottom: 34px;
          }

          .product-bottom {
            gap: 6px;
          }

          .add-order-button {
            padding-left: 8px;
            padding-right: 8px;
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

          .product-content h3 {
            font-size: 14px;
          }

          .waiter-widget {
            left: 14px;
            bottom: 32px;
          }

          .loyalty-card {
            padding: 15px;
          }

          .add-order-button span:last-child {
            display: none;
          }

          .add-order-button {
            width: 32px;
            padding: 0;
          }
        }
      `}</style>
    </main>
  );
}