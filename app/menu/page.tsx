"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

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

const categories = [
  "Tümü",
  "Sıcak İçecekler",
  "Soğuk İçecekler",
  "Kahvaltı",
  "Yemek",
  "Tatlı",
  "Çerez",
];

export default function MenuPage() {
  const [category, setCategory] = useState("Tümü");
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: menuError } = await supabase
        .from("menu_items")
        .select(
          "id, name, category, description, price, image_url, active, sort_order"
        )
        .eq("active", true)
        .order("sort_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: true,
        });

      if (menuError) {
        console.error("MENU LOAD ERROR:", menuError);
        throw new Error(
          "Menü ürünleri yüklenemedi."
        );
      }

      setProducts((data ?? []) as MenuItem[]);
    } catch (err) {
      console.error("MENU ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Menü yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts =
    category === "Tümü"
      ? products
      : products.filter(
          (product) =>
            product.category === category
        );

  const formatPrice = (price: number) => {
    return `${Number(price).toLocaleString(
      "tr-TR",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )} ₺`;
  };

  return (
    <main className="site">

      <header className="header">
        <a
          href="/"
          className="brand"
        >
          <div className="logo">
            ☕
          </div>

          <div>
            <h1>
              Taşkent Cafe
            </h1>

            <span>
              Keyif burada başlar
            </span>
          </div>
        </a>

        <a
          href="/"
          className="icon-button"
          aria-label="Ana sayfa"
        >
          ←
        </a>
      </header>

      <section className="section menu-page">

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
            {loading
              ? "..."
              : `${filteredProducts.length} ürün`}
          </span>
        </div>

        <p className="menu-description">
          Kahvelerimizden tatlılarımıza kadar
          Taşkent Cafe'nin lezzetlerini keşfedin.
        </p>

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

        {loading && (
          <div className="menu-status">
            <div className="menu-spinner">
              ☕
            </div>

            <p>
              Menü yükleniyor...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="menu-status menu-error">
            <div className="menu-status-icon">
              ⚠️
            </div>

            <strong>
              Menü yüklenemedi
            </strong>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="menu-retry"
              onClick={loadMenu}
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          filteredProducts.length === 0 && (
            <div className="menu-status">
              <div className="menu-status-icon">
                ☕
              </div>

              <strong>
                Bu kategoride ürün yok
              </strong>

              <p>
                Şu anda bu kategoride
                gösterilecek ürün bulunmuyor.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
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
                          ☕
                        </span>
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
                          {formatPrice(
                            product.price
                          )}
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
          )}

      </section>

      <footer className="footer">

        <div className="footer-logo">
          ☕ Taşkent Cafe
        </div>

        <p>
          Kahve, lezzet ve güzel sohbet.
        </p>

        <div className="footer-links">

          <a href="/">
            Ana Sayfa
          </a>

          <a href="/menü">
            Menü
          </a>

          <a href="/#loyalty">
            Sadakat
          </a>

        </div>

        <small>
          © 2026 Taşkent Cafe
        </small>

      </footer>

      <nav className="bottom-nav">

        <a
          href="/"
          className="nav-item"
        >
          <span>⌂</span>
          Ana Sayfa
        </a>

        <a
          href="/menü"
          className="nav-item active"
        >
          <span>☕</span>
          Menü
        </a>

        <a
          href="/#loyalty"
          className="nav-item"
        >
          <span>⭐</span>
          Sadakat
        </a>

        <a
          href="/#location"
          className="nav-item"
        >
          <span>📍</span>
          Konum
        </a>

      </nav>

      <style jsx global>{`

        .menu-status {
          margin-top: 25px;
          padding: 35px 20px;
          border: 1px solid #eee4da;
          border-radius: 20px;
          background: #ffffff;
          text-align: center;
          color: #77695e;
        }

        .menu-spinner {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 54px;
          margin-bottom: 12px;
          border-radius: 50%;
          background: #f5e9dc;
          font-size: 24px;
          animation: menuPulse 1.2s ease-in-out infinite;
        }

        .menu-status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 54px;
          margin: 0 auto 12px;
          border-radius: 50%;
          background: #f5e9dc;
          font-size: 23px;
        }

        .menu-status strong {
          display: block;
          color: #493a30;
          font-size: 14px;
        }

        .menu-status p {
          margin: 7px 0 0;
          color: #998c81;
          font-size: 11px;
          line-height: 1.5;
        }

        .menu-error {
          border-color: #ead7ca;
        }

        .menu-retry {
          margin-top: 15px;
          padding: 10px 17px;
          border: 0;
          border-radius: 10px;
          background: #b96f38;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .menu-retry:active {
          transform: scale(0.98);
        }

        .product-image {
          overflow: hidden;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        @keyframes menuPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.7;
          }

          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

      `}</style>

    </main>
  );
}