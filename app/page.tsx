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

  const [table, setTable] = useState<CafeTable | null>(null);
  const [tableLoading, setTableLoading] = useState(false);

  const [waiterOpen, setWaiterOpen] = useState(false);
  const [waiterLoading, setWaiterLoading] = useState(false);
  const [waiterMessage, setWaiterMessage] = useState("");
  const [waiterError, setWaiterError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      setProductsLoading(true);
      setProductsError("");

      const { data, error } = await supabase
        .from("menu_items")
        .select(
          "id,name,category,description,price,image_url,active,sort_order"
        )
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("MENU LOAD ERROR:", error);
        setProductsError("Menü ürünleri yüklenemedi.");
      } else {
        setProducts((data || []) as Product[]);
      }

      setProductsLoading(false);
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function loadTable() {
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
        console.error("TABLE LOAD ERROR:", error);
        setWaiterError("Masa bilgisi alınamadı.");
      } finally {
        setTableLoading(false);
      }
    }

    loadTable();
  }, []);

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
          const { error } = await supabase.rpc(
            "create_waiter_call",
            {
              requested_table_id: table.id,
              user_latitude: position.coords.latitude,
              user_longitude: position.coords.longitude,
            }
          );

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
        } else if (
          error.code === error.POSITION_UNAVAILABLE
        ) {
          setWaiterError(
            "Konumunuz belirlenemedi."
          );
        } else if (error.code === error.TIMEOUT) {
          setWaiterError(
            "Konum alınırken zaman aşımı oluştu."
          );
        } else {
          setWaiterError(
            "Konumunuz alınamadı."
          );
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
            <img
              src={logoUrl}
              alt="Taşkent Cafe"
            />
          </div>

          <div>
            <h1>Taşkent Cafe</h1>
            <span>Mardin Kale</span>
          </div>
        </div>
      </header>

      <a
        href="/loyalty"
        className="loyalty-card"
      >
        <div className="loyalty-icon">
          ⭐
        </div>

        <div className="loyalty-content">
          <span>TAŞKENT CAFE</span>

          <strong>
            Sadakat Kartı
          </strong>

          <p>
            Alışverişlerinden puan kazan,
            avantajlardan yararlan.
          </p>
        </div>

        <div className="loyalty-login">
          Giriş
        </div>
      </a>

      <section className="menu-section">
        <div className="section-header">
          <div>
            <span className="eyebrow">
              MENÜ
            </span>
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
              onClick={() =>
                setCategory(item)
              }
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

        {!productsLoading &&
          productsError && (
            <div className="error">
              {productsError}
            </div>
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
              {filteredProducts.map(
                (product) => (
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
                          {getCategoryIcon(
                            product.category
                          )}
                        </span>
                      )}
                    </div>

                    <div className="product-content">
                      <div>
                        <span className="product-category">
                          {product.category}
                        </span>

                        <h3>
                          {product.name}
                        </h3>

                        {product.description && (
                          <p>
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="product-bottom">
                        <strong className="price">
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
                          type="button"
                          className="add-order-button"
                          onClick={() => {}}
                        >
                          <span>+</span>
                          Siparişe Ekle
                        </button>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
      </section>

      <div className="waiter-widget">
        {waiterOpen && (
          <div className="waiter-panel">
            <div className="waiter-header">
              <div className="waiter-avatar">
                👩🏻‍🍳
              </div>

              <div>
                <strong>
                  Garson
                </strong>

                {table && (
                  <span>
                    Masa{" "}
                    {table.table_number}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="close"
                onClick={() =>
                  setWaiterOpen(false)
                }
                aria-label="Kapat"
              >
                ×
              </button>
            </div>

            <div className="waiter-body">
              {waiterMessage ? (
                <div className="success">
                  <div className="success-icon">
                    ✓
                  </div>

                  <strong>
                    Garson çağrınız alındı.
                  </strong>

                  <span>
                    {waiterMessage}
                  </span>
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
                      waiterLoading ||
                      tableLoading
                    }
                  >
                    {waiterLoading
                      ? "Konum kontrol ediliyor..."
                      : "📣 Garson Çağır"}
                  </button>
                </>
              ) : (
                <>
                  <div className="no-table">
                    <span>📱</span>

                    <strong>
                      Masa bulunamadı
                    </strong>

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
            setWaiterOpen(
              (open) => !open
            )
          }
          aria-label="Garson çağır"
        >
          <span>
            {waiterMessage
              ? "✓"
              : "👩🏻‍🍳"}
          </span>

          <small>
            {waiterMessage
              ? "Çağrıldı"
              : "Garson"}
          </small>
        </button>
      </div>

      <style jsx global>{`
        :root {
          --brown-dark: #382a21;
          --brown: #8b5e3c;
          --cream: #fffaf5;
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
          background: #f8f2ec;
          color: var(--text);
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button {
          font-family: inherit;
        }

        a {
          text-decoration: none;
        }

        .site {
          width: 100%;
          max-width: 620px;
          min-height: 100vh;
          margin: 0 auto;
          padding: 0 18px 120px;
        }

        .header {
          display: flex;
          align-items: center;
          padding: 22px 2px 20px;
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
          border: 2px solid
            rgba(91, 57, 35, 0.1);
          box-shadow:
            0 5px 18px
            rgba(45, 28, 18, 0.12);
        }

        .logo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .brand h1 {
          margin: 0;
          color: var(--brown-dark);
          font-size: 21px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .brand span {
          display: block;
          margin-top: 5px;
          color: var(--muted);
          font-size: 11px;
          font-weight: 600;
        }

        .loyalty-card {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 2px 0 28px;
          padding: 16px;
          border-radius: 20px;
          background:
            linear-gradient(
              135deg,
              #4a3326 0%,
              #8b5e3c 100%
            );
          color: #fff;
          box-shadow:
            0 10px 25px
            rgba(72, 43, 25, 0.18);
        }

        .loyalty-icon {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: rgba(
            255,
            255,
            255,
            0.13
          );
          font-size: 23px;
        }

        .loyalty-content {
          flex: 1;
          min-width: 0;
        }

        .loyalty-content > span {
          display: block;
          margin-bottom: 3px;
          color: #d9c7b8;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .loyalty-content strong {
          display: block;
          font-size: 16px;
          font-weight: 800;
        }

        .loyalty-content p {
          margin: 4px 0 0;
          color: #eaded4;
          font-size: 9px;
          line-height: 1.35;
        }

        .loyalty-login {
          flex: 0 0 auto;
          min-width: 62px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 13px;
          border: 1px solid
            rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          background: rgba(
            255,
            255,
            255,
            0.13
          );
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1px;
          box-shadow:
            0 4px 12px
            rgba(0, 0, 0, 0.08);
        }

        .menu-section {
          margin-top: 4px;
        }

        .section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .eyebrow {
          display: block;
          color: var(--brown);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
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
          min-height: 126px;
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
          min-height: 126px;
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
          padding: 14px 15px;
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
          margin-top: 9px;
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
          border: 0;
          border-radius: 9px;
          background: #eee2d8;
          color: #654936;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
          cursor: pointer;
        }

        .add-order-button span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--brown);
          color: #fff;
          font-size: 15px;
          line-height: 1;
          font-weight: 700;
        }

        .add-order-button:active {
          transform: scale(0.97);
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
          animation: spin 0.8s linear infinite;
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
          bottom: 74px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .waiter-button {
          position: relative;
          width: 62px;
          height: 62px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background:
            linear-gradient(
              145deg,
              #8b5e3c,
              #5d3823
            );
          color: #fff;
          box-shadow:
            0 8px 25px
            rgba(55, 31, 17, 0.28);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          cursor: pointer;
        }

        .waiter-button > span {
          font-size: 25px;
          line-height: 1;
        }

        .waiter-button small {
          font-size: 8px;
          font-weight: 800;
        }

        .success-button {
          background:
            linear-gradient(
              145deg,
              #4d9364,
              #28633c
            );
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

        .waiter-header > div:nth-child(2) {
          flex: 1;
          min-width: 0;
        }

        .waiter-header strong {
          display: block;
          font-size: 12px;
        }

        .waiter-header span {
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

          .product-bottom {
            align-items: flex-end;
          }

          .add-order-button {
            min-height: 30px;
            padding: 0 8px;
            font-size: 8px;
          }

          .loyalty-login {
            min-width: 58px;
            padding: 0 11px;
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

          .product-bottom {
            gap: 5px;
          }

          .price {
            font-size: 14px;
          }

          .add-order-button {
            padding: 0 6px;
          }

          .add-order-button span {
            width: 16px;
            height: 16px;
            font-size: 13px;
          }

          .waiter-widget {
            left: 14px;
            bottom: 68px;
          }
        }
      `}</style>
    </main>
  );
}