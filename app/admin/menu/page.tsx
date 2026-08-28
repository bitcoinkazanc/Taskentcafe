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
          throw new Error(updateError.message);
        }

        setMessage("Ürün başarıyla güncellendi.");
      } else {
        const { error: insertError } =
          await supabase
            .from("menu_items")
            .insert(payload);

        if (insertError) {
          throw new Error(insertError.message);
        }

        setMessage("Ürün başarıyla menüye eklendi.");
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
          <div className="menu-state-card">
            <div className="menu-state-icon">☕</div>
            <strong>Menü yükleniyor</strong>
            <span>Lütfen bekleyin...</span>
          </div>
        </section>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="site">
        <section className="section">
          <div className="menu-access-card">
            <div className="menu-access-icon">🔒</div>

            <span className="eyebrow">
              YETKİ GEREKLİ
            </span>

            <h2>Yetkisiz erişim</h2>

            <p>
              Menü yönetimine yalnızca yetkili
              personel erişebilir.
            </p>

            {error && (
              <div className="menu-alert menu-alert-error">
                ⚠️ {error}
              </div>
            )}

            <a
              href="/admin"
              className="menu-back-main"
            >
              <span>←</span>
              Yönetim Paneline Dön
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="site">
      <header className="menu-admin-header">
        <div className="menu-admin-title">
          <div className="menu-admin-icon">
            ☕
          </div>

          <div>
            <span>ADMİN PANELİ</span>
            <h1>Menü Yönetimi</h1>
          </div>
        </div>

        <a
          href="/admin"
          className="menu-back-button"
          aria-label="Yönetim paneline dön"
        >
          <span>←</span>
          <strong>Geri</strong>
        </a>
      </header>

      <section className="section admin-menu-page">
        <div className="menu-page-intro">
          <div>
            <span className="eyebrow">
              {editingId ? "DÜZENLEME" : "MENÜ"}
            </span>

            <h2>
              {editingId
                ? "Ürünü Düzenle"
                : "Yeni Ürün Ekle"}
            </h2>

            <p>
              Menü ürünlerini buradan ekleyebilir,
              düzenleyebilir ve yönetebilirsiniz.
            </p>
          </div>

          <div className="menu-total-badge">
            <strong>{items.length}</strong>
            <span>ürün</span>
          </div>
        </div>

        {message && (
          <div className="menu-alert menu-alert-success">
            <span>✓</span>
            {message}
          </div>
        )}

        {error && (
          <div className="menu-alert menu-alert-error">
            <span>!</span>
            {error}
          </div>
        )}

        <div
          className={`admin-menu-form-card ${
            editingId ? "is-editing" : ""
          }`}
        >
          <div className="form-card-header">
            <div className="form-card-icon">
              {editingId ? "✎" : "+"}
            </div>

            <div>
              <strong>
                {editingId
                  ? "Ürün Bilgilerini Düzenle"
                  : "Yeni Menü Ürünü"}
              </strong>

              <span>
                {editingId
                  ? "Mevcut ürün bilgilerini güncelleyin."
                  : "Menünüze yeni bir ürün ekleyin."}
              </span>
            </div>
          </div>

          <div className="admin-menu-form">
            <div className="form-grid">
              <label>
                <span>Ürün adı</span>

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
                <span>Kategori</span>

                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value,
                    })
                  }
                >
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              <span>Açıklama</span>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
                placeholder="Ürün hakkında kısa bilgi..."
                rows={3}
              />
            </label>

            <div className="form-grid form-grid-three">
              <label>
                <span>Fiyat</span>

                <div className="price-input">
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

                  <b>₺</b>
                </div>
              </label>

              <label>
                <span>Sıralama</span>

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

              <label>
                <span>Görsel URL</span>

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
            </div>

            {form.image_url && (
              <div className="image-preview-card">
                <img
                  src={form.image_url}
                  alt="Ürün önizleme"
                />

                <div>
                  <strong>Görsel önizleme</strong>
                  <span>
                    Ürünün menüdeki görünümü
                  </span>
                </div>
              </div>
            )}

            <label className="active-switch">
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

              <span className="switch-ui"></span>

              <div>
                <strong>
                  Ana menüde göster
                </strong>

                <small>
                  Ürün müşterilerin görebileceği
                  menüde yayınlansın.
                </small>
              </div>
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="menu-save-button"
                onClick={saveItem}
                disabled={saving}
              >
                <span>
                  {saving
                    ? "..."
                    : editingId
                      ? "✓"
                      : "+"}
                </span>

                {saving
                  ? "Kaydediliyor..."
                  : editingId
                    ? "Değişiklikleri Kaydet"
                    : "Menüye Ekle"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="menu-cancel-button"
                  onClick={resetForm}
                >
                  İptal
                </button>
              )}
            </div>
          </div>
        </div>

        <section className="admin-menu-list">
          <div className="list-header">
            <div>
              <span className="eyebrow">
                MENÜ ÜRÜNLERİ
              </span>

              <h2>Ürün Listesi</h2>
            </div>

            <span className="list-count">
              {items.length} ürün
            </span>
          </div>

          <div className="admin-menu-items">
            {items.length === 0 ? (
              <div className="empty-menu-card">
                <div>☕</div>
                <strong>Henüz ürün yok</strong>
                <span>
                  İlk ürününüzü yukarıdaki formdan
                  ekleyebilirsiniz.
                </span>
              </div>
            ) : (
              items.map((item) => (
                <article
                  className={`admin-menu-item ${
                    !item.active
                      ? "menu-item-passive"
                      : ""
                  }`}
                  key={item.id}
                >
                  <div className="admin-menu-image">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                      />
                    ) : (
                      <span>☕</span>
                    )}
                  </div>

                  <div className="admin-menu-content">
                    <div className="product-topline">
                      <span className="product-category">
                        {item.category}
                      </span>

                      <span
                        className={`product-status ${
                          item.active
                            ? "status-active"
                            : "status-passive"
                        }`}
                      >
                        <i></i>
                        {item.active
                          ? "Aktif"
                          : "Pasif"}
                      </span>
                    </div>

                    <strong>{item.name}</strong>

                    <p>
                      {item.description ||
                        "Açıklama eklenmemiş."}
                    </p>

                    <div className="product-bottom">
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

                      <span>
                        Sıra: {item.sort_order}
                      </span>
                    </div>
                  </div>

                  <div className="admin-menu-item-actions">
                    <button
                      type="button"
                      className={
                        item.active
                          ? "action-status active"
                          : "action-status passive"
                      }
                      onClick={() =>
                        toggleActive(item)
                      }
                    >
                      <span>
                        {item.active ? "✓" : "○"}
                      </span>

                      {item.active
                        ? "Aktif"
                        : "Pasif"}
                    </button>

                    <button
                      type="button"
                      className="action-edit"
                      onClick={() =>
                        editItem(item)
                      }
                    >
                      <span>✎</span>
                      Düzenle
                    </button>

                    <button
                      type="button"
                      className="action-delete"
                      onClick={() =>
                        deleteItem(item)
                      }
                    >
                      <span>×</span>
                      Sil
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          ☕ Taşkent Cafe
        </div>

        <p>Menü Yönetimi</p>

        <small>© 2026 Taşkent Cafe</small>
      </footer>

      <style jsx global>{`
        .admin-menu-page {
          padding-top: 24px;
          padding-bottom: 45px;
        }

        .menu-admin-header {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          padding: 15px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid #eee4da;
          background: rgba(255, 252, 248, 0.96);
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(12px);
        }

        .menu-admin-title {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .menu-admin-icon {
          width: 43px;
          height: 43px;
          flex: 0 0 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #f4e9df;
          color: #9d6031;
          font-size: 19px;
          box-shadow: inset 0 0 0 1px #eadbce;
        }

        .menu-admin-title > div:last-child {
          min-width: 0;
        }

        .menu-admin-title span {
          display: block;
          margin-bottom: 2px;
          color: #ad7043;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .menu-admin-title h1 {
          margin: 0;
          color: #352820;
          font-size: 16px;
          font-weight: 850;
          letter-spacing: -0.2px;
        }

        .menu-back-button {
          height: 38px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #e5d8cc;
          border-radius: 11px;
          background: #ffffff;
          color: #5f5148;
          text-decoration: none;
          box-shadow: 0 3px 10px rgba(60, 39, 25, 0.04);
          transition:
            transform 0.15s ease,
            background 0.15s ease;
        }

        .menu-back-button:hover {
          background: #fffaf5;
          transform: translateY(-1px);
        }

        .menu-back-button span {
          font-size: 17px;
          line-height: 1;
        }

        .menu-back-button strong {
          font-size: 9px;
          font-weight: 850;
        }

        .menu-page-intro {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .menu-page-intro h2 {
          margin: 5px 0 4px;
          color: #382a21;
          font-size: 23px;
          line-height: 1.1;
          letter-spacing: -0.5px;
        }

        .menu-page-intro p {
          margin: 0;
          max-width: 430px;
          color: #988a80;
          font-size: 9px;
          line-height: 1.5;
        }

        .menu-total-badge {
          min-width: 61px;
          padding: 9px 11px;
          display: grid;
          justify-items: center;
          border: 1px solid #eaded3;
          border-radius: 13px;
          background: #fffaf5;
        }

        .menu-total-badge strong {
          color: #a46232;
          font-size: 17px;
          line-height: 1;
        }

        .menu-total-badge span {
          margin-top: 3px;
          color: #a3968d;
          font-size: 7px;
          font-weight: 700;
        }

        .menu-alert {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 13px;
          padding: 11px 13px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 700;
        }

        .menu-alert span {
          width: 20px;
          height: 20px;
          flex: 0 0 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
          font-size: 10px;
        }

        .menu-alert-success {
          border: 1px solid #dfe8dd;
          background: #f5f9f3;
          color: #55704f;
        }

        .menu-alert-error {
          border: 1px solid #eadbd6;
          background: #fff7f4;
          color: #986256;
        }

        .admin-menu-form-card {
          overflow: hidden;
          border: 1px solid #e9ddd2;
          border-radius: 22px;
          background: #ffffff;
          box-shadow:
            0 10px 30px rgba(60, 39, 25, 0.055);
        }

        .admin-menu-form-card.is-editing {
          border-color: #d9b79d;
        }

        .form-card-header {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 16px 17px;
          border-bottom: 1px solid #f0e8e1;
          background: linear-gradient(
            135deg,
            #fffaf6,
            #ffffff
          );
        }

        .form-card-icon {
          width: 39px;
          height: 39px;
          flex: 0 0 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f4e9df;
          color: #9f6031;
          font-size: 19px;
          font-weight: 700;
        }

        .form-card-header strong {
          display: block;
          color: #3a2b22;
          font-size: 12px;
          font-weight: 850;
        }

        .form-card-header span {
          display: block;
          margin-top: 3px;
          color: #9d9086;
          font-size: 8px;
        }

        .admin-menu-form {
          display: grid;
          gap: 15px;
          padding: 17px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
        }

        .form-grid-three {
          grid-template-columns: 0.8fr 0.65fr 1.55fr;
        }

        .admin-menu-form label:not(.active-switch) {
          display: grid;
          gap: 7px;
          color: #4b3c32;
          font-size: 9px;
          font-weight: 850;
        }

        .admin-menu-form label:not(.active-switch) > span {
          color: #4c3c32;
        }

        .admin-menu-form input,
        .admin-menu-form select,
        .admin-menu-form textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #e4d8ce;
          border-radius: 11px;
          background: #fffaf6;
          color: #30261f;
          outline: none;
          font-family: inherit;
          font-size: 10px;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .admin-menu-form input,
        .admin-menu-form select {
          height: 42px;
          padding: 0 12px;
        }

        .admin-menu-form textarea {
          min-height: 75px;
          padding: 11px 12px;
          resize: vertical;
          line-height: 1.45;
        }

        .admin-menu-form input::placeholder,
        .admin-menu-form textarea::placeholder {
          color: #b5aaa2;
        }

        .admin-menu-form input:focus,
        .admin-menu-form select:focus,
        .admin-menu-form textarea:focus {
          border-color: #bb7543;
          box-shadow:
            0 0 0 3px rgba(187, 117, 67, 0.08);
        }

        .price-input {
          position: relative;
        }

        .price-input input {
          padding-right: 30px;
        }

        .price-input b {
          position: absolute;
          right: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #a76638;
          font-size: 10px;
        }

        .image-preview-card {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px;
          border: 1px solid #eee2d8;
          border-radius: 13px;
          background: #fffaf5;
        }

        .image-preview-card img {
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          object-fit: cover;
          border-radius: 10px;
          background: #eee2d6;
        }

        .image-preview-card strong {
          display: block;
          color: #4b3a30;
          font-size: 9px;
        }

        .image-preview-card span {
          display: block;
          margin-top: 3px;
          color: #a0948a;
          font-size: 7px;
        }

        .active-switch {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border: 1px solid #eee3da;
          border-radius: 12px;
          background: #fffaf6;
          cursor: pointer;
        }

        .active-switch input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .switch-ui {
          width: 35px;
          height: 20px;
          flex: 0 0 35px;
          position: relative;
          border-radius: 20px;
          background: #d9d0c9;
          transition: background 0.2s ease;
        }

        .switch-ui::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s ease;
        }

        .active-switch input:checked + .switch-ui {
          background: #b86f3d;
        }

        .active-switch
          input:checked
          + .switch-ui::after {
          transform: translateX(15px);
        }

        .active-switch div {
          min-width: 0;
        }

        .active-switch strong {
          display: block;
          color: #4a392f;
          font-size: 9px;
          font-weight: 850;
        }

        .active-switch small {
          display: block;
          margin-top: 3px;
          color: #9d9086;
          font-size: 7px;
          font-weight: 500;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .menu-save-button {
          min-height: 41px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 0;
          border-radius: 11px;
          background: #a96435;
          color: #ffffff;
          cursor: pointer;
          font-family: inherit;
          font-size: 9px;
          font-weight: 850;
          box-shadow:
            0 5px 13px rgba(139, 83, 44, 0.17);
        }

        .menu-save-button span {
          font-size: 13px;
        }

        .menu-save-button:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .menu-cancel-button {
          min-height: 41px;
          padding: 0 15px;
          border: 1px solid #e1d5ca;
          border-radius: 11px;
          background: #ffffff;
          color: #66584d;
          cursor: pointer;
          font-family: inherit;
          font-size: 9px;
          font-weight: 800;
        }

        .admin-menu-list {
          margin-top: 31px;
        }

        .list-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 13px;
        }

        .list-header h2 {
          margin: 5px 0 0;
          color: #382a21;
          font-size: 20px;
          letter-spacing: -0.3px;
        }

        .list-count {
          padding: 6px 9px;
          border-radius: 8px;
          background: #f4ece5;
          color: #8f6548;
          font-size: 8px;
          font-weight: 850;
        }

        .admin-menu-items {
          display: grid;
          gap: 9px;
        }

        .admin-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px;
          border: 1px solid #e9ded4;
          border-radius: 17px;
          background: #ffffff;
          box-shadow:
            0 5px 18px rgba(60, 39, 25, 0.035);
          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease;
        }

        .admin-menu-item:hover {
          transform: translateY(-1px);
          box-shadow:
            0 8px 22px rgba(60, 39, 25, 0.055);
        }

        .menu-item-passive {
          opacity: 0.72;
          background: #fcfbfa;
        }

        .admin-menu-image {
          width: 78px;
          height: 78px;
          flex: 0 0 78px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 14px;
          background: #f3e9df;
          color: #a66a3e;
          font-size: 25px;
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

        .product-topline {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .product-category {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #ae6b3c;
          font-size: 7px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .product-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 6px;
          border-radius: 6px;
          font-size: 6px;
          font-weight: 850;
          white-space: nowrap;
        }

        .product-status i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          display: block;
        }

        .status-active {
          background: #edf5ec;
          color: #5f7659;
        }

        .status-active i {
          background: #6f9468;
        }

        .status-passive {
          background: #f1eeeb;
          color: #84776e;
        }

        .status-passive i {
          background: #9d928a;
        }

        .admin-menu-content > strong {
          display: block;
          overflow: hidden;
          color: #382a21;
          font-size: 13px;
          font-weight: 850;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-menu-content p {
          margin: 4px 0 0;
          overflow: hidden;
          color: #9b8e84;
          font-size: 8px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .product-bottom {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
        }

        .product-bottom b {
          color: #a96435;
          font-size: 12px;
        }

        .product-bottom span {
          color: #b0a49b;
          font-size: 7px;
        }

        .admin-menu-item-actions {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 0 0 72px;
        }

        .admin-menu-item-actions button {
          width: 100%;
          min-height: 29px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border: 1px solid #e5dbd2;
          border-radius: 8px;
          background: #fffaf6;
          color: #67594f;
          cursor: pointer;
          font-family: inherit;
          font-size: 7px;
          font-weight: 800;
        }

        .admin-menu-item-actions button span {
          font-size: 10px;
        }

        .action-status.active {
          background: #f5f9f3;
          border-color: #dfe8dc;
          color: #61785a;
        }

        .action-status.passive {
          color: #84766d;
        }

        .action-edit:hover {
          border-color: #d6b79f;
          color: #9c5f34;
        }

        .action-delete {
          color: #9b655d !important;
        }

        .action-delete:hover {
          background: #fff6f4 !important;
          border-color: #ead5d0 !important;
        }

        .empty-menu-card {
          display: grid;
          justify-items: center;
          padding: 35px 20px;
          border: 1px dashed #dfd2c7;
          border-radius: 18px;
          background: #fffaf6;
          text-align: center;
        }

        .empty-menu-card > div {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          border-radius: 15px;
          background: #f3e9df;
          color: #a66a3e;
          font-size: 22px;
        }

        .empty-menu-card strong {
          color: #493a30;
          font-size: 11px;
        }

        .empty-menu-card span {
          margin-top: 4px;
          color: #9d9086;
          font-size: 8px;
        }

        .menu-state-card {
          display: grid;
          justify-items: center;
          padding: 35px 20px;
          border: 1px solid #eee4da;
          border-radius: 20px;
          background: #ffffff;
          text-align: center;
        }

        .menu-state-icon {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          border-radius: 16px;
          background: #f4e9df;
          font-size: 23px;
        }

        .menu-state-card strong {
          color: #403127;
          font-size: 12px;
        }

        .menu-state-card span {
          margin-top: 4px;
          color: #a0958c;
          font-size: 8px;
        }

        .menu-access-card {
          padding: 35px 20px;
          border: 1px solid #eee4da;
          border-radius: 22px;
          background: #ffffff;
          text-align: center;
          box-shadow:
            0 8px 25px rgba(60, 39, 25, 0.045);
        }

        .menu-access-icon {
          width: 65px;
          height: 65px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          border-radius: 50%;
          background: #f4e9df;
          font-size: 27px;
        }

        .menu-access-card h2 {
          margin: 5px 0 7px;
          color: #382a21;
          font-size: 20px;
        }

        .menu-access-card p {
          max-width: 320px;
          margin: 0 auto 18px;
          color: #998c81;
          font-size: 10px;
          line-height: 1.6;
        }

        .menu-access-card .menu-alert {
          justify-content: flex-start;
          text-align: left;
        }

        .menu-back-main {
          min-height: 40px;
          padding: 0 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 10px;
          background: #a96435;
          color: #ffffff;
          text-decoration: none;
          font-size: 9px;
          font-weight: 850;
        }

        .menu-back-main span {
          font-size: 15px;
        }

        @media (max-width: 600px) {
          .menu-admin-header {
            padding: 13px 14px;
          }

          .menu-admin-icon {
            width: 39px;
            height: 39px;
            flex-basis: 39px;
          }

          .menu-admin-title h1 {
            font-size: 14px;
          }

          .menu-back-button {
            height: 36px;
            padding: 0 10px;
          }

          .menu-page-intro h2 {
            font-size: 21px;
          }

          .form-grid,
          .form-grid-three {
            grid-template-columns: 1fr;
          }

          .admin-menu-item {
            align-items: flex-start;
          }

          .admin-menu-image {
            width: 64px;
            height: 64px;
            flex-basis: 64px;
          }

          .admin-menu-item-actions {
            flex-basis: 68px;
          }

          .admin-menu-item-actions button {
            font-size: 6.5px;
          }
        }

        @media (max-width: 420px) {
          .menu-admin-title span {
            font-size: 6px;
          }

          .menu-admin-title h1 {
            font-size: 13px;
          }

          .menu-back-button strong {
            display: none;
          }

          .menu-back-button {
            width: 36px;
            padding: 0;
          }

          .menu-page-intro {
            align-items: center;
          }

          .menu-page-intro p {
            font-size: 8px;
          }

          .admin-menu-item {
            gap: 8px;
            padding: 9px;
          }

          .admin-menu-image {
            width: 58px;
            height: 58px;
            flex-basis: 58px;
          }

          .admin-menu-content > strong {
            font-size: 11px;
          }

          .admin-menu-content p {
            font-size: 7px;
          }

          .admin-menu-item-actions {
            flex-basis: 61px;
          }

          .admin-menu-item-actions button {
            min-height: 27px;
            font-size: 6px;
          }
        }
      `}</style>
    </main>
  );
}