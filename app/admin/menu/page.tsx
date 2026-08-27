"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

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
  "Sıcak İçecekler",
  "Soğuk İçecekler",
  "Kahvaltı",
  "Yemek",
  "Tatlı",
  "Çerez",
];

const emptyForm = {
  name: "",
  category: "Sıcak İçecekler",
  description: "",
  price: "",
  image_url: "",
  active: true,
  sort_order: "0",
};

export default function AdminMenuPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkStaff();
  }, []);

  const checkStaff = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        setAuthorized(false);
        return;
      }

      const { data: staff, error: staffError } =
        await supabase
          .from("staff_users")
          .select("id, auth_user_id, role")
          .eq("auth_user_id", user.id)
          .maybeSingle();

      if (staffError) {
        throw new Error(
          `Yetki kontrolü başarısız: ${staffError.message}`
        );
      }

      if (!staff) {
        setAuthorized(false);
        return;
      }

      setAuthorized(true);
      await loadItems();
    } catch (err) {
      console.error("MENU STAFF CHECK ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Yetki kontrolü başarısız."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    const { data, error: itemsError } =
      await supabase
        .from("menu_items")
        .select(
          "id, name, category, description, price, image_url, active, sort_order"
        )
        .order("sort_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: true,
        });

    if (itemsError) {
      throw new Error(
        `Menü ürünleri alınamadı: ${itemsError.message}`
      );
    }

    setItems((data ?? []) as MenuItem[]);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveItem = async () => {
    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("Ürün adı girin.");
      return;
    }

    if (!form.category) {
      setError("Kategori seçin.");
      return;
    }

    const price = Number(
      form.price.replace(",", ".")
    );

    if (!Number.isFinite(price) || price < 0) {
      setError("Geçerli bir fiyat girin.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        category: form.category,
        description:
          form.description.trim() || null,
        price,
        image_url:
          form.image_url.trim() || null,
        active: form.active,
        sort_order:
          Number(form.sort_order) || 0,
      };

      if (editingId) {
        const { error: updateError } =
          await supabase
            .from("menu_items")
            .update(payload)
            .eq("id", editingId);

        if (updateError) {
          throw new Error(
            updateError.message
          );
        }

        setMessage(
          "Ürün başarıyla güncellendi."
        );
      } else {
        const { error: insertError } =
          await supabase
            .from("menu_items")
            .insert(payload);

        if (insertError) {
          throw new Error(
            insertError.message
          );
        }

        setMessage(
          "Ürün başarıyla menüye eklendi."
        );
      }

      resetForm();
      await loadItems();
    } catch (err) {
      console.error("MENU SAVE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Ürün kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  const editItem = (item: MenuItem) => {
    setMessage("");
    setError("");

    setEditingId(item.id);

    setForm({
      name: item.name,
      category: item.category,
      description: item.description ?? "",
      price: String(item.price),
      image_url: item.image_url ?? "",
      active: item.active,
      sort_order: String(item.sort_order),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const toggleActive = async (item: MenuItem) => {
    setMessage("");
    setError("");

    const { error: updateError } =
      await supabase
        .from("menu_items")
        .update({
          active: !item.active,
        })
        .eq("id", item.id);

    if (updateError) {
      setError(
        `Durum değiştirilemedi: ${updateError.message}`
      );
      return;
    }

    await loadItems();
  };

  const deleteItem = async (item: MenuItem) => {
    const confirmed = window.confirm(
      `"${item.name}" ürününü silmek istediğinize emin misiniz?`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    const { error: deleteError } =
      await supabase
        .from("menu_items")
        .delete()
        .eq("id", item.id);

    if (deleteError) {
      setError(
        `Ürün silinemedi: ${deleteError.message}`
      );
      return;
    }

    setMessage("Ürün silindi.");

    if (editingId === item.id) {
      resetForm();
    }

    await loadItems();
  };

  if (loading) {
    return (
      <main className="site">
        <section className="section">
          <div className="loyalty-message">
            Menü yönetimi yükleniyor...
          </div>
        </section>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="site">
        <section className="section">
          <div className="loyalty-message">
            <strong>
              Yetkisiz erişim
            </strong>

            <p>
              Bu sayfaya yalnızca yetkili
              personel erişebilir.
            </p>
          </div>

          <a
            href="/"
            className="loyalty-button"
          >
            Ana Sayfaya Dön
          </a>
        </section>
      </main>
    );
  }

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
              Menü Yönetimi
            </span>
          </div>
        </a>

        <a
          href="/"
          className="icon-button"
        >
          ←
        </a>
      </header>

      <section className="section admin-menu-page">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              YÖNETİM
            </span>

            <h2>
              {editingId
                ? "Ürünü Düzenle"
                : "Yeni Ürün Ekle"}
            </h2>
          </div>
        </div>

        {message && (
          <div className="loyalty-message">
            {message}
          </div>
        )}

        {error && (
          <div className="loyalty-message">
            ⚠️ {error}
          </div>
        )}

        <div className="admin-menu-form">
          <label>
            Ürün adı
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value,
                })
              }
              placeholder="Örn. Türk Kahvesi"
            />
          </label>

          <label>
            Kategori
            <select
              value={form.category}
              onChange={(event) =>
                setForm({
                  ...form,
                  category: event.target.value,
                })
              }
            >
              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Açıklama / Bilgi
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description:
                    event.target.value,
                })
              }
              placeholder="Ürün hakkında kısa bilgi"
              rows={3}
            />
          </label>

          <label>
            Fiyat
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) =>
                setForm({
                  ...form,
                  price: event.target.value,
                })
              }
              placeholder="120"
            />
          </label>

          <label>
            Ürün resmi URL'si
            <input
              type="url"
              value={form.image_url}
              onChange={(event) =>
                setForm({
                  ...form,
                  image_url:
                    event.target.value,
                })
              }
              placeholder="https://..."
            />
          </label>

          {form.image_url && (
            <div className="admin-menu-preview">
              <img
                src={form.image_url}
                alt="Ürün önizleme"
              />
            </div>
          )}

          <label>
            Sıralama
            <input
              type="number"
              min="0"
              value={form.sort_order}
              onChange={(event) =>
                setForm({
                  ...form,
                  sort_order:
                    event.target.value,
                })
              }
            />
          </label>

          <label className="admin-menu-check">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                setForm({
                  ...form,
                  active:
                    event.target.checked,
                })
              }
            />

            <span>
              Ana menüde göster
            </span>
          </label>

          <div className="admin-menu-actions">
            <button
              type="button"
              className="loyalty-button"
              onClick={saveItem}
              disabled={saving}
            >
              {saving
                ? "Kaydediliyor..."
                : editingId
                  ? "Ürünü Güncelle"
                  : "Menüye Ekle"}
            </button>

            {editingId && (
              <button
                type="button"
                className="admin-menu-cancel"
                onClick={resetForm}
              >
                İptal
              </button>
            )}
          </div>
        </div>

        <section className="admin-menu-list">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                MENÜ
              </span>

              <h2>
                Ürünler
              </h2>
            </div>

            <span className="menu-count">
              {items.length} ürün
            </span>
          </div>

          <div className="admin-menu-items">
            {items.length === 0 ? (
              <div className="loyalty-message">
                Henüz menü ürünü eklenmedi.
              </div>
            ) : (
              items.map((item) => (
                <article
                  className="admin-menu-item"
                  key={item.id}
                >
                  <div className="admin-menu-image">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                      />
                    ) : (
                      <span>
                        ☕
                      </span>
                    )}
                  </div>

                  <div className="admin-menu-content">
                    <strong>
                      {item.name}
                    </strong>

                    <small>
                      {item.category}
                    </small>

                    <p>
                      {item.description ||
                        "Açıklama yok."}
                    </p>

                    <b>
                      {Number(
                        item.price
                      ).toLocaleString(
                        "tr-TR",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}{" "}
                      ₺
                    </b>
                  </div>

                  <div className="admin-menu-item-actions">
                    <button
                      type="button"
                      onClick={() =>
                        toggleActive(item)
                      }
                    >
                      {item.active
                        ? "Aktif"
                        : "Pasif"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        editItem(item)
                      }
                    >
                      Düzenle
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteItem(item)
                      }
                    >
                      Sil
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      <style jsx global>{`
        .admin-menu-page {
          padding-bottom: 40px;
        }

        .admin-menu-form {
          display: grid;
          gap: 15px;
          padding: 18px;
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid #eee4da;
        }

        .admin-menu-form label {
          display: grid;
          gap: 7px;
          color: #493a30;
          font-size: 11px;
          font-weight: 700;
        }

        .admin-menu-form input,
        .admin-menu-form select,
        .admin-menu-form textarea {
          width: 100%;
          padding: 12px 13px;
          border: 1px solid #e5d9ce;
          border-radius: 11px;
          background: #fffaf5;
          color: #30261f;
          outline: none;
        }

        .admin-menu-form textarea {
          resize: vertical;
        }

        .admin-menu-form input:focus,
        .admin-menu-form select:focus,
        .admin-menu-form textarea:focus {
          border-color: #b96f38;
        }

        .admin-menu-preview {
          width: 120px;
          height: 120px;
          border-radius: 16px;
          overflow: hidden;
          background: #eee1d4;
        }

        .admin-menu-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .admin-menu-check {
          display: flex !important;
          grid-template-columns: none;
          align-items: center;
          gap: 9px !important;
        }

        .admin-menu-check input {
          width: 18px;
          height: 18px;
        }

        .admin-menu-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .admin-menu-cancel {
          height: 39px;
          padding: 0 15px;
          border: 1px solid #e1d5ca;
          border-radius: 11px;
          background: #ffffff;
          color: #66584d;
          font-size: 10px;
          font-weight: 700;
        }

        .admin-menu-list {
          margin-top: 30px;
        }

        .admin-menu-items {
          display: grid;
          gap: 10px;
        }

        .admin-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px;
          border: 1px solid #eee4da;
          border-radius: 17px;
          background: #ffffff;
        }

        .admin-menu-image {
          width: 75px;
          height: 75px;
          flex: 0 0 75px;
          border-radius: 13px;
          overflow: hidden;
          background: #eee1d4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
        }

        .admin-menu-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .admin-menu-content {
          flex: 1;
          min-width: 0;
        }

        .admin-menu-content strong {
          display: block;
          font-size: 13px;
        }

        .admin-menu-content small {
          display: block;
          margin-top: 3px;
          color: #b56d38;
          font-size: 9px;
        }

        .admin-menu-content p {
          margin-top: 5px;
          color: #998c81;
          font-size: 9px;
          line-height: 1.4;
        }

        .admin-menu-content b {
          display: block;
          margin-top: 5px;
          color: #b56d38;
          font-size: 12px;
        }

        .admin-menu-item-actions {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .admin-menu-item-actions button {
          min-width: 65px;
          padding: 7px 8px;
          border: 1px solid #e6dbd1;
          border-radius: 8px;
          background: #fffaf5;
          color: #66584d;
          font-size: 8px;
          font-weight: 700;
        }

        @media (max-width: 480px) {
          .admin-menu-item {
            align-items: flex-start;
          }

          .admin-menu-item-actions {
            flex: 0 0 auto;
          }

          .admin-menu-image {
            width: 62px;
            height: 62px;
            flex-basis: 62px;
          }
        }
      `}</style>
    </main>
  );
}