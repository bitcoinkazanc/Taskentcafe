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

    setMessage(
      item.active
        ? `"${item.name}" pasif yapıldı.`
        : `"${item.name}" aktif yapıldı.`
    );

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
          <div className="admin-loading-card">
            <div className="admin-loading-icon">
              ☕
            </div>

            <strong>
              Menü yönetimi yükleniyor
            </strong>

            <span>
              Lütfen bekleyin...
            </span>
          </div>
        </section>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="site">
        <header className="header">
          <a
            href="/admin"
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
        </header>

        <section className="section">
          <div className="admin-access-box">
            <div className="admin-access-icon">
              🔒
            </div>

            <span className="admin-access-eyebrow">
              ERİŞİM ENGELLENDİ
            </span>

            <h2>
              Yetkisiz erişim
            </h2>

            <p>
              Bu sayfaya yalnızca yetkili
              personel erişebilir.
            </p>

            {error && (
              <div className="admin-alert admin-alert-error">
                ⚠️ {error}
              </div>
            )}

            <a
              href="/admin"
              className="admin-primary-button"
            >
              Yönetim Paneline Dön
            </a>
          </div>
        </section>
      </main>
    );
  }

  const activeCount = items.filter(
    (item) => item.active
  ).length;

  const inactiveCount =
    items.length - activeCount;

  return (
    <main className="site">
      <header className="header">
        <a
          href="/admin"
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
          href="/admin"
          className="icon-button"
          aria-label="Yönetim paneline dön"
        >
          ←
        </a>
      </header>

      <section className="section admin-menu-page">
        <div className="admin-page-top">
          <div>
            <span className="admin-page-eyebrow">
              YÖNETİM PANELİ
            </span>

            <h2>
              Menü Yönetimi
            </h2>

            <p>
              Menü ürünlerini ekleyin,
              düzenleyin ve yayın durumlarını
              yönetin.
            </p>
          </div>

          <div className="admin-menu-total">
            <strong>
              {items.length}
            </strong>

            <span>
              toplam ürün
            </span>
          </div>
        </div>

        <div className="admin-menu-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              ☕
            </div>

            <div>
              <strong>
                {items.length}
              </strong>

              <span>
                Toplam Ürün
              </span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-active">
              ✓
            </div>

            <div>
              <strong>
                {activeCount}
              </strong>

              <span>
                Aktif
              </span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-passive">
              ○
            </div>

            <div>
              <strong>
                {inactiveCount}
              </strong>

              <span>
                Pasif
              </span>
            </div>
          </div>
        </div>

        {message && (
          <div className="admin-alert admin-alert-success">
            <span>
              ✓
            </span>

            <div>
              {message}
            </div>
          </div>
        )}

        {error && (
          <div className="admin-alert admin-alert-error">
            <span>
              ⚠️
            </span>

            <div>
              {error}
            </div>
          </div>
        )}

        <div
          className={`admin-editor-card ${
            editingId
              ? "admin-editor-editing"
              : ""
          }`}
        >
          <div className="admin-editor-header">
            <div className="admin-editor-title">
              <div className="admin-editor-icon">
                {editingId
                  ? "✎"
                  : "+"}
              </div>

              <div>
                <span>
                  {editingId
                    ? "ÜRÜN DÜZENLEME"
                    : "MENÜYE ÜRÜN EKLE"}
                </span>

                <strong>
                  {editingId
                    ? "Ürünü Düzenle"
                    : "Yeni Ürün Ekle"}
                </strong>
              </div>
            </div>

            {editingId && (
              <button
                type="button"
                className="admin-close-edit"
                onClick={resetForm}
              >
                İptal
              </button>
            )}
          </div>

          <div className="admin-editor-body">
            <div className="admin-form-grid">
              <label className="admin-field admin-field-full">
                <span>
                  Ürün adı
                </span>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name:
                        event.target.value,
                    })
                  }
                  placeholder="Örn. Türk Kahvesi"
                />
              </label>

              <label className="admin-field">
                <span>
                  Kategori
                </span>

                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category:
                        event.target.value,
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

              <label className="admin-field">
                <span>
                  Fiyat
                </span>

                <div className="admin-price-input">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        price:
                          event.target.value,
                      })
                    }
                    placeholder="120"
                  />

                  <b>
                    ₺
                  </b>
                </div>
              </label>

              <label className="admin-field admin-field-full">
                <span>
                  Açıklama / Bilgi
                </span>

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

              <label className="admin-field admin-field-full">
                <span>
                  Ürün resmi URL'si
                </span>

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
                <div className="admin-preview-card admin-field-full">
                  <div className="admin-preview-image">
                    <img
                      src={form.image_url}
                      alt="Ürün önizleme"
                    />
                  </div>

                  <div>
                    <span>
                      GÖRSEL ÖNİZLEME
                    </span>

                    <strong>
                      Ürün resmi
                    </strong>

                    <small>
                      Menüde bu görsel
                      kullanılacaktır.
                    </small>
                  </div>
                </div>
              )}

              <label className="admin-field">
                <span>
                  Sıralama
                </span>

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

              <label className="admin-active-toggle">
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

                <span className="admin-toggle-ui">
                  <span />
                </span>

                <span>
                  <strong>
                    Ana menüde göster
                  </strong>

                  <small>
                    Ürün müşterilere
                    gösterilsin
                  </small>
                </span>
              </label>
            </div>

            <div className="admin-editor-actions">
              <button
                type="button"
                className="admin-primary-button admin-save-button"
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
                    ? "Ürünü Güncelle"
                    : "Menüye Ekle"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={resetForm}
                >
                  Değişiklikleri İptal Et
                </button>
              )}
            </div>
          </div>
        </div>

        <section className="admin-menu-list">
          <div className="admin-list-header">
            <div>
              <span>
                MENÜ
              </span>

              <h2>
                Ürünler
              </h2>
            </div>

            <div className="admin-list-count">
              {items.length} ürün
            </div>
          </div>

          {items.length === 0 ? (
            <div className="admin-empty-card">
              <div>
                ☕
              </div>

              <strong>
                Henüz ürün yok
              </strong>

              <p>
                Yukarıdaki formu kullanarak
                ilk menü ürününüzü ekleyin.
              </p>
            </div>
          ) : (
            <div className="admin-menu-items">
              {items.map((item) => (
                <article
                  className={`admin-menu-item ${
                    item.active
                      ? ""
                      : "admin-menu-item-inactive"
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
                      <div className="admin-no-image">
                        ☕
                      </div>
                    )}

                    <span
                      className={`admin-status-dot ${
                        item.active
                          ? "admin-status-active"
                          : "admin-status-inactive"
                      }`}
                    />
                  </div>

                  <div className="admin-menu-content">
                    <div className="admin-menu-title-row">
                      <strong>
                        {item.name}
                      </strong>

                      <span
                        className={`admin-status-badge ${
                          item.active
                            ? "admin-badge-active"
                            : "admin-badge-inactive"
                        }`}
                      >
                        {item.active
                          ? "Aktif"
                          : "Pasif"}
                      </span>
                    </div>

                    <span className="admin-menu-category">
                      {item.category}
                    </span>

                    <p>
                      {item.description ||
                        "Bu ürün için açıklama eklenmemiş."}
                    </p>

                    <div className="admin-menu-meta">
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
                        Sıra:{" "}
                        {item.sort_order}
                      </span>
                    </div>
                  </div>

                  <div className="admin-menu-item-actions">
                    <button
                      type="button"
                      className={
                        item.active
                          ? "admin-action-status admin-action-active"
                          : "admin-action-status admin-action-inactive"
                      }
                      onClick={() =>
                        toggleActive(item)
                      }
                    >
                      <span>
                        {item.active
                          ? "✓"
                          : "○"}
                      </span>

                      {item.active
                        ? "Aktif"
                        : "Pasif"}
                    </button>

                    <button
                      type="button"
                      className="admin-action-edit"
                      onClick={() =>
                        editItem(item)
                      }
                    >
                      <span>
                        ✎
                      </span>

                      Düzenle
                    </button>

                    <button
                      type="button"
                      className="admin-action-delete"
                      onClick={() =>
                        deleteItem(item)
                      }
                    >
                      <span>
                        ×
                      </span>

                      Sil
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          ☕ Taşkent Cafe
        </div>

        <p>
          Menü yönetimi
        </p>

        <small>
          © 2026 Taşkent Cafe
        </small>
      </footer>

      <style jsx global>{`
        .admin-menu-page {
          padding-bottom: 45px;
        }

        .admin-page-top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .admin-page-eyebrow,
        .admin-list-header > div:first-child > span {
          display: block;
          color: #b36d37;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .admin-page-top h2 {
          margin: 5px 0 0;
          color: #34261e;
          font-size: 25px;
          line-height: 1.15;
          letter-spacing: -0.5px;
        }

        .admin-page-top p {
          max-width: 390px;
          margin: 7px 0 0;
          color: #998c81;
          font-size: 10px;
          line-height: 1.55;
        }

        .admin-menu-total {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          min-width: 70px;
        }

        .admin-menu-total strong {
          color: #b36d37;
          font-size: 23px;
          line-height: 1;
        }

        .admin-menu-total span {
          margin-top: 4px;
          color: #9b8d82;
          font-size: 8px;
          font-weight: 700;
        }

        .admin-menu-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
          margin-bottom: 15px;
        }

        .admin-stat-card {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          padding: 12px;
          border: 1px solid #eee4da;
          border-radius: 15px;
          background: #ffffff;
          box-shadow:
            0 5px 18px rgba(60, 39, 25, 0.035);
        }

        .admin-stat-icon {
          width: 35px;
          height: 35px;
          flex: 0 0 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #f7eee7;
          color: #a86635;
          font-size: 15px;
          font-weight: 900;
        }

        .admin-stat-active {
          background: #edf7ef;
          color: #4c8b5b;
        }

        .admin-stat-passive {
          background: #f1efed;
          color: #81766f;
        }

        .admin-stat-card strong {
          display: block;
          color: #3b2d24;
          font-size: 14px;
          line-height: 1;
        }

        .admin-stat-card span {
          display: block;
          margin-top: 4px;
          color: #9b8d82;
          font-size: 8px;
          font-weight: 700;
        }

        .admin-alert {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 13px;
          padding: 11px 13px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 700;
        }

        .admin-alert > span {
          font-size: 13px;
        }

        .admin-alert-success {
          border: 1px solid #dbeee0;
          background: #f3faf5;
          color: #4d8059;
        }

        .admin-alert-error {
          border: 1px solid #efd9d4;
          background: #fff7f5;
          color: #9b5c50;
        }

        .admin-editor-card {
          overflow: hidden;
          border: 1px solid #e9ded4;
          border-radius: 21px;
          background: #ffffff;
          box-shadow:
            0 9px 30px rgba(60, 39, 25, 0.055);
        }

        .admin-editor-editing {
          border-color: #dec4ad;
        }

        .admin-editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 16px 18px;
          border-bottom: 1px solid #f0e8e1;
          background: #fffdfa;
        }

        .admin-editor-title {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .admin-editor-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f7eee7;
          color: #a86432;
          font-size: 20px;
          font-weight: 800;
        }

        .admin-editor-title span {
          display: block;
          color: #b36d37;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.1px;
        }

        .admin-editor-title strong {
          display: block;
          margin-top: 3px;
          color: #392a20;
          font-size: 13px;
        }

        .admin-close-edit {
          min-height: 31px;
          padding: 0 11px;
          border: 1px solid #e4d8cd;
          border-radius: 9px;
          background: #ffffff;
          color: #75675d;
          font-size: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        .admin-editor-body {
          padding: 18px;
        }

        .admin-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .admin-field {
          display: grid;
          gap: 7px;
          min-width: 0;
        }

        .admin-field-full {
          grid-column: 1 / -1;
        }

        .admin-field > span {
          color: #4a3a30;
          font-size: 9px;
          font-weight: 900;
        }

        .admin-field input,
        .admin-field select,
        .admin-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #e5d9ce;
          border-radius: 11px;
          background: #fffaf6;
          color: #30261f;
          outline: none;
          font-family: inherit;
          font-size: 10px;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            background 0.15s ease;
        }

        .admin-field input,
        .admin-field select {
          height: 43px;
          padding: 0 13px;
        }

        .admin-field textarea {
          min-height: 82px;
          padding: 12px 13px;
          line-height: 1.5;
          resize: vertical;
        }

        .admin-field input:focus,
        .admin-field select:focus,
        .admin-field textarea:focus {
          border-color: #bd7944;
          background: #ffffff;
          box-shadow:
            0 0 0 3px rgba(189, 121, 68, 0.08);
        }

        .admin-price-input {
          position: relative;
        }

        .admin-price-input input {
          padding-right: 38px;
        }

        .admin-price-input b {
          position: absolute;
          top: 50%;
          right: 13px;
          transform: translateY(-50%);
          color: #b36d37;
          font-size: 11px;
        }

        .admin-preview-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border: 1px solid #eee1d5;
          border-radius: 13px;
          background: #fffaf5;
        }

        .admin-preview-image {
          width: 62px;
          height: 62px;
          flex: 0 0 62px;
          overflow: hidden;
          border-radius: 10px;
          background: #eee1d4;
        }

        .admin-preview-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .admin-preview-card span {
          display: block;
          color: #b36d37;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .admin-preview-card strong {
          display: block;
          margin-top: 3px;
          color: #4a3a30;
          font-size: 10px;
        }

        .admin-preview-card small {
          display: block;
          margin-top: 3px;
          color: #998c81;
          font-size: 8px;
        }

        .admin-active-toggle {
          display: flex;
          align-items: center;
          gap: 9px;
          align-self: end;
          min-height: 43px;
          padding: 8px 10px;
          border: 1px solid #e7ddd4;
          border-radius: 11px;
          background: #fffaf6;
          cursor: pointer;
        }

        .admin-active-toggle input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .admin-toggle-ui {
          position: relative;
          width: 31px;
          height: 18px;
          flex: 0 0 31px;
          border-radius: 20px;
          background: #d9d0c9;
          transition: background 0.15s ease;
        }

        .admin-toggle-ui span {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow:
            0 1px 4px rgba(0, 0, 0, 0.15);
          transition: transform 0.15s ease;
        }

        .admin-active-toggle input:checked + .admin-toggle-ui {
          background: #6e9c76;
        }

        .admin-active-toggle
          input:checked
          + .admin-toggle-ui
          span {
          transform: translateX(13px);
        }

        .admin-active-toggle > span:last-child {
          min-width: 0;
        }

        .admin-active-toggle strong {
          display: block;
          color: #493a30;
          font-size: 9px;
        }

        .admin-active-toggle small {
          display: block;
          margin-top: 2px;
          color: #998c81;
          font-size: 7px;
        }

        .admin-editor-actions {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
          margin-top: 17px;
          padding-top: 16px;
          border-top: 1px solid #f0e8e1;
        }

        .admin-primary-button,
        .admin-secondary-button {
          min-height: 40px;
          border-radius: 10px;
          padding: 0 16px;
          font-family: inherit;
          font-size: 9px;
          font-weight: 900;
          text-decoration: none;
          cursor: pointer;
          transition:
            transform 0.12s ease,
            opacity 0.12s ease,
            box-shadow 0.12s ease;
        }

        .admin-primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 0;
          background: #ad6734;
          color: #ffffff;
          box-shadow:
            0 6px 15px rgba(173, 103, 52, 0.18);
        }

        .admin-primary-button:hover {
          box-shadow:
            0 8px 18px rgba(173, 103, 52, 0.25);
        }

        .admin-primary-button:active,
        .admin-secondary-button:active,
        .admin-menu-item-actions button:active {
          transform: scale(0.98);
        }

        .admin-primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .admin-save-button {
          min-width: 145px;
        }

        .admin-save-button > span {
          font-size: 13px;
        }

        .admin-secondary-button {
          border: 1px solid #e1d5ca;
          background: #ffffff;
          color: #66584d;
        }

        .admin-menu-list {
          margin-top: 31px;
        }

        .admin-list-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 12px;
        }

        .admin-list-header h2 {
          margin: 5px 0 0;
          color: #392a20;
          font-size: 18px;
        }

        .admin-list-count {
          padding: 7px 10px;
          border-radius: 9px;
          background: #f7eee7;
          color: #9d6032;
          font-size: 8px;
          font-weight: 900;
        }

        .admin-menu-items {
          display: grid;
          gap: 9px;
        }

        .admin-menu-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 11px;
          border: 1px solid #eee4da;
          border-radius: 17px;
          background: #ffffff;
          box-shadow:
            0 4px 15px rgba(60, 39, 25, 0.035);
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .admin-menu-item:hover {
          border-color: #dfcdbd;
          box-shadow:
            0 7px 20px rgba(60, 39, 25, 0.055);
        }

        .admin-menu-item-inactive {
          opacity: 0.72;
          background: #fcfbfa;
        }

        .admin-menu-image {
          position: relative;
          width: 78px;
          height: 78px;
          flex: 0 0 78px;
          overflow: visible;
          border-radius: 14px;
          background: #eee1d4;
        }

        .admin-menu-image img,
        .admin-no-image {
          width: 100%;
          height: 100%;
          border-radius: 14px;
          object-fit: cover;
        }

        .admin-no-image {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a78f7d;
          font-size: 26px;
        }

        .admin-status-dot {
          position: absolute;
          right: -3px;
          bottom: -3px;
          width: 13px;
          height: 13px;
          border: 2px solid #ffffff;
          border-radius: 50%;
        }

        .admin-status-active {
          background: #6e9c76;
        }

        .admin-status-inactive {
          background: #aaa19b;
        }

        .admin-menu-content {
          flex: 1;
          min-width: 0;
        }

        .admin-menu-title-row {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }

        .admin-menu-title-row strong {
          min-width: 0;
          overflow: hidden;
          color: #392a20;
          font-size: 13px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-status-badge {
          flex: 0 0 auto;
          padding: 4px 6px;
          border-radius: 6px;
          font-size: 6px;
          font-weight: 900;
        }

        .admin-badge-active {
          background: #edf7ef;
          color: #51825a;
        }

        .admin-badge-inactive {
          background: #efedeb;
          color: #776e68;
        }

        .admin-menu-category {
          display: inline-block;
          margin-top: 4px;
          color: #b36d37;
          font-size: 8px;
          font-weight: 800;
        }

        .admin-menu-content p {
          display: -webkit-box;
          overflow: hidden;
          margin: 5px 0 0;
          color: #998c81;
          font-size: 8px;
          line-height: 1.45;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .admin-menu-meta {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 6px;
        }

        .admin-menu-meta b {
          color: #ad6734;
          font-size: 12px;
        }

        .admin-menu-meta span {
          color: #aaa097;
          font-size: 7px;
        }

        .admin-menu-item-actions {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 0 0 78px;
        }

        .admin-menu-item-actions button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          width: 100%;
          min-height: 30px;
          padding: 0 6px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 7px;
          font-weight: 900;
          cursor: pointer;
          transition:
            transform 0.12s ease,
            background 0.12s ease;
        }

        .admin-menu-item-actions button span {
          font-size: 10px;
        }

        .admin-action-status {
          border: 1px solid #dfe6df;
        }

        .admin-action-active {
          background: #f2faf4;
          color: #4e8258;
        }

        .admin-action-inactive {
          background: #f3f1ef;
          color: #756c66;
        }

        .admin-action-edit {
          border: 1px solid #e4d7cb;
          background: #fffaf5;
          color: #80634d;
        }

        .admin-action-delete {
          border: 1px solid #ead8d4;
          background: #fff8f7;
          color: #a06156;
        }

        .admin-empty-card {
          padding: 35px 20px;
          border: 1px dashed #ded1c6;
          border-radius: 18px;
          background: #fffdfb;
          text-align: center;
        }

        .admin-empty-card > div {
          width: 54px;
          height: 54px;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: #f7eee7;
          color: #a66a3d;
          font-size: 23px;
        }

        .admin-empty-card strong {
          color: #4a3a30;
          font-size: 12px;
        }

        .admin-empty-card p {
          max-width: 280px;
          margin: 6px auto 0;
          color: #998c81;
          font-size: 9px;
          line-height: 1.5;
        }

        .admin-access-box {
          padding: 35px 20px;
          border: 1px solid #eee4da;
          border-radius: 22px;
          background: #ffffff;
          text-align: center;
          box-shadow:
            0 8px 25px rgba(60, 39, 25, 0.04);
        }

        .admin-access-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f7eee7;
          font-size: 27px;
        }

        .admin-access-eyebrow {
          color: #b36d37;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .admin-access-box h2 {
          margin: 6px 0 0;
          color: #392a20;
          font-size: 20px;
        }

        .admin-access-box p {
          max-width: 320px;
          margin: 8px auto 18px;
          color: #998c81;
          font-size: 10px;
          line-height: 1.55;
        }

        .admin-access-box .admin-alert {
          justify-content: center;
          margin-bottom: 15px;
          text-align: left;
        }

        .admin-loading-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 230px;
          padding: 25px;
          border: 1px solid #eee4da;
          border-radius: 21px;
          background: #ffffff;
        }

        .admin-loading-icon {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 11px;
          border-radius: 16px;
          background: #f7eee7;
          font-size: 23px;
        }

        .admin-loading-card strong {
          color: #4a3a30;
          font-size: 12px;
        }

        .admin-loading-card span {
          margin-top: 4px;
          color: #998c81;
          font-size: 9px;
        }

        @media (max-width: 620px) {
          .admin-page-top {
            align-items: flex-start;
          }

          .admin-page-top h2 {
            font-size: 22px;
          }

          .admin-menu-total {
            padding-top: 4px;
          }

          .admin-menu-stats {
            gap: 7px;
          }

          .admin-stat-card {
            padding: 9px;
            gap: 7px;
          }

          .admin-stat-icon {
            width: 30px;
            height: 30px;
            flex-basis: 30px;
            border-radius: 9px;
            font-size: 12px;
          }

          .admin-stat-card strong {
            font-size: 12px;
          }

          .admin-stat-card span {
            font-size: 7px;
          }

          .admin-form-grid {
            grid-template-columns: 1fr;
          }

          .admin-field-full {
            grid-column: auto;
          }

          .admin-active-toggle {
            align-self: auto;
          }

          .admin-menu-item {
            align-items: flex-start;
            gap: 9px;
          }

          .admin-menu-image {
            width: 62px;
            height: 62px;
            flex-basis: 62px;
          }

          .admin-menu-title-row strong {
            font-size: 11px;
          }

          .admin-menu-content p {
            font-size: 7px;
          }

          .admin-menu-item-actions {
            flex-basis: 67px;
          }

          .admin-menu-item-actions button {
            min-height: 28px;
            font-size: 6px;
          }

          .admin-menu-item-actions button span {
            font-size: 8px;
          }

          .admin-status-badge {
            display: none;
          }
        }

        @media (max-width: 400px) {
          .admin-menu-stats {
            grid-template-columns: 1fr;
          }

          .admin-stat-card {
            min-height: 38px;
          }

          .admin-menu-item {
            display: grid;
            grid-template-columns: 54px 1fr;
          }

          .admin-menu-image {
            width: 54px;
            height: 54px;
            flex-basis: 54px;
            grid-row: span 2;
          }

          .admin-menu-item-actions {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            width: 100%;
          }

          .admin-menu-meta {
            margin-top: 4px;
          }

          .admin-editor-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .admin-save-button,
          .admin-secondary-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}