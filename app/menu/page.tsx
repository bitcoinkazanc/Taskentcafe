"use client";

import { useState } from "react";

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
    id: 1,
    name: "Türk Kahvesi",
    category: "Sıcak İçecekler",
    description: "Geleneksel Türk kahvesi.",
    price: "120 ₺",
    icon: "☕",
  },
  {
    id: 2,
    name: "Latte",
    category: "Sıcak İçecekler",
    description: "Espresso ve yumuşak süt köpüğü.",
    price: "150 ₺",
    icon: "☕",
  },
  {
    id: 3,
    name: "Cappuccino",
    category: "Sıcak İçecekler",
    description: "Yoğun espresso ve süt köpüğü.",
    price: "150 ₺",
    icon: "☕",
  },
  {
    id: 4,
    name: "Çay",
    category: "Sıcak İçecekler",
    description: "Taze demlenmiş çay.",
    price: "60 ₺",
    icon: "🍵",
  },
  {
    id: 5,
    name: "Soğuk Kahve",
    category: "Soğuk İçecekler",
    description: "Serinletici buzlu kahve.",
    price: "160 ₺",
    icon: "🧊",
  },
  {
    id: 6,
    name: "Limonata",
    category: "Soğuk İçecekler",
    description: "Ev yapımı taze limonata.",
    price: "120 ₺",
    icon: "🍋",
  },
  {
    id: 7,
    name: "Serpme Kahvaltı",
    category: "Kahvaltı",
    description: "Zengin kahvaltı tabağı.",
    price: "450 ₺",
    icon: "🍳",
  },
  {
    id: 8,
    name: "Kahvaltı Tabağı",
    category: "Kahvaltı",
    description: "Günün özel kahvaltı tabağı.",
    price: "300 ₺",
    icon: "🥚",
  },
  {
    id: 9,
    name: "Günün Yemeği",
    category: "Yemek",
    description: "Günün taze hazırlanan yemeği.",
    price: "250 ₺",
    icon: "🍽️",
  },
  {
    id: 10,
    name: "Çikolatalı Pasta",
    category: "Tatlı",
    description: "Günlük hazırlanan özel pasta.",
    price: "180 ₺",
    icon: "🍰",
  },
  {
    id: 11,
    name: "Cheesecake",
    category: "Tatlı",
    description: "Yumuşak ve kremalı cheesecake.",
    price: "180 ₺",
    icon: "🍰",
  },
  {
    id: 12,
    name: "Karışık Çerez",
    category: "Çerez",
    description: "Günün seçme çerezleri.",
    price: "150 ₺",
    icon: "🥜",
  },
];

export default function MenuPage() {
  const [category, setCategory] = useState("Tümü");

  const filteredProducts =
    category === "Tümü"
      ? products
      : products.filter((product) => product.category === category);

  return (
    <main className="site">

      <header className="header">
        <a href="/" className="brand">
          <div className="logo">☕</div>

          <div>
            <h1>Taşkent Cafe</h1>
            <span>Keyif burada başlar</span>
          </div>
        </a>

        <a href="/" className="icon-button" aria-label="Ana sayfa">
          ←
        </a>
      </header>

      <section className="section menu-page">

        <div className="section-heading">
          <div>
            <span className="eyebrow">TAŞKENT CAFE</span>
            <h2>Menümüz</h2>
          </div>

          <span className="menu-count">
            {filteredProducts.length} ürün
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

        <div className="products">

          {filteredProducts.map((product) => (
            <article
              className="product-card"
              key={product.id}
            >
              <div className="product-image">
                {product.icon}
              </div>

              <div className="product-content">

                <div>
                  <h3>{product.name}</h3>

                  <p>
                    {product.description}
                  </p>
                </div>

                <div className="product-bottom">
                  <strong>{product.price}</strong>

                  <button
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

      </section>

      <footer className="footer">
        <div className="footer-logo">
          ☕ Taşkent Cafe
        </div>

        <p>
          Kahve, lezzet ve güzel sohbet.
        </p>

        <div className="footer-links">
          <a href="/">Ana Sayfa</a>
          <a href="/menu">Menü</a>
          <a href="/#loyalty">Sadakat</a>
        </div>

        <small>
          © 2026 Taşkent Cafe
        </small>
      </footer>

      <nav className="bottom-nav">

        <a href="/" className="nav-item">
          <span>⌂</span>
          Ana Sayfa
        </a>

        <a href="/menu" className="nav-item active">
          <span>☕</span>
          Menü
        </a>

        <a href="/#loyalty" className="nav-item">
          <span>⭐</span>
          Sadakat
        </a>

        <a href="/#location" className="nav-item">
          <span>📍</span>
          Konum
        </a>

      </nav>

    </main>
  );
}