"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type StaffUser = {
  id: string;
  auth_user_id: string;
  name: string | null;
  username: string | null;
  role: string;
  active: boolean;
  created_at: string;
};

const roles = [
  {
    value: "staff",
    label: "Personel",
    description: "Günlük personel işlemleri",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Tüm yönetim işlemleri",
  },
];

const emptyForm = {
  name: "",
  username: "",
  password: "",
  role: "staff",
};

export default function StaffAdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [staff, setStaff] = useState<
    StaffUser[]
  >([]);

  const [form, setForm] =
    useState(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(
          `Kullanıcı bilgisi alınamadı: ${userError.message}`
        );
      }

      if (!user) {
        setAuthorized(false);
        return;
      }

      setCurrentUserId(user.id);

      const {
        data: adminUser,
        error: adminError,
      } = await supabase
        .from("staff_users")
        .select(
          "id, auth_user_id, name, username, role, active, created_at"
        )
        .eq("auth_user_id", user.id)
        .eq("role", "admin")
        .eq("active", true)
        .maybeSingle();

      if (adminError) {
        throw new Error(
          `Admin yetkisi kontrol edilemedi: ${adminError.message}`
        );
      }

      if (!adminUser) {
        setAuthorized(false);
        return;
      }

      setAuthorized(true);

      await loadStaff();
    } catch (err) {
      console.error(
        "STAFF ADMIN ACCESS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Yetki kontrolü başarısız."
      );

      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    const {
      data,
      error: staffError,
    } = await supabase
      .from("staff_users")
      .select(
        "id, auth_user_id, name, username, role, active, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (staffError) {
      throw new Error(
        `Personeller alınamadı: ${staffError.message}`
      );
    }

    setStaff(
      (data ?? []) as StaffUser[]
    );
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  const createStaff = async () => {
    setMessage("");
    setError("");

    const name = form.name.trim();
    const username =
      form.username.trim().toLowerCase();
    const password = form.password;

    if (!name) {
      setError("Personel adı girin.");
      return;
    }

    if (!username) {
      setError("Kullanıcı adı girin.");
      return;
    }

    if (!/^[a-z0-9._-]+$/.test(username)) {
      setError(
        "Kullanıcı adı yalnızca küçük harf, rakam, nokta, alt çizgi ve tire içerebilir."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Şifre en az 6 karakter olmalıdır."
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data,
        error: rpcError,
      } = await supabase.rpc(
        "create_staff_user",
        {
          staff_name: name,
          staff_username: username,
          staff_password: password,
          staff_role: form.role,
        }
      );

      if (rpcError) {
        throw new Error(
          rpcError.message
        );
      }

      if (
        data &&
        typeof data === "object" &&
        "success" in data &&
        data.success === false
      ) {
        throw new Error(
          "Personel oluşturulamadı."
        );
      }

      setMessage(
        `${name} adlı personel başarıyla oluşturuldu.`
      );

      resetForm();

      await loadStaff();
    } catch (err) {
      console.error(
        "CREATE STAFF ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Personel oluşturulamadı."
      );
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (
    person: StaffUser,
    newRole: string
  ) => {
    if (person.role === newRole) {
      return;
    }

    if (
      person.auth_user_id ===
        currentUserId &&
      newRole !== "admin"
    ) {
      setError(
        "Kendi admin yetkinizi bu ekrandan kaldıramazsınız."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `${person.name || person.username || "Bu personel"} rolü "${newRole}" olarak değiştirilsin mi?`
      );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const {
        error: rpcError,
      } = await supabase.rpc(
        "update_staff_role",
        {
          target_staff_id:
            person.id,
          new_role: newRole,
        }
      );

      if (rpcError) {
        throw new Error(
          rpcError.message
        );
      }

      setMessage(
        "Personel rolü başarıyla güncellendi."
      );

      await loadStaff();
    } catch (err) {
      console.error(
        "CHANGE ROLE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Rol değiştirilemedi."
      );
    }
  };

  const toggleStaff = async (
    person: StaffUser
  ) => {
    if (
      person.auth_user_id ===
        currentUserId &&
      person.active
    ) {
      setError(
        "Kendi hesabınızı bu ekrandan pasifleştiremezsiniz."
      );
      return;
    }

    const actionText = person.active
      ? "pasifleştirilecek"
      : "aktif hale getirilecek";

    const confirmed =
      window.confirm(
        `${person.name || person.username || "Bu personel"} ${actionText}. Devam edilsin mi?`
      );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const {
        error: rpcError,
      } = await supabase.rpc(
        "toggle_staff_user",
        {
          target_staff_id:
            person.id,
          new_active:
            !person.active,
        }
      );

      if (rpcError) {
        throw new Error(
          rpcError.message
        );
      }

      setMessage(
        person.active
          ? "Personel pasifleştirildi."
          : "Personel tekrar aktif edildi."
      );

      await loadStaff();
    } catch (err) {
      console.error(
        "TOGGLE STAFF ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Personel durumu değiştirilemedi."
      );
    }
  };

  if (loading) {
    return (
      <main className="site">
        <section className="section">
          <div className="loyalty-message">
            Personel yönetimi yükleniyor...
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
                Personel Yönetimi
              </span>
            </div>
          </a>
        </header>

        <section className="section">
          <div className="admin-access-box">
            <div className="admin-access-icon">
              🔒
            </div>

            <h2>
              Yetkisiz erişim
            </h2>

            <p>
              Personel yönetimine yalnızca
              admin yetkisine sahip kullanıcılar
              erişebilir.
            </p>

            {error && (
              <div className="loyalty-message">
                ⚠️ {error}
              </div>
            )}

            <a
              href="/admin"
              className="loyalty-button"
            >
              Yönetim Paneline Dön
            </a>
          </div>
        </section>
      </main>
    );
  }

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
              Personel Yönetimi
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

      <section className="section staff-admin-page">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              ADMİN
            </span>

            <h2>
              Personel Yönetimi
            </h2>
          </div>

          <span className="menu-count">
            {staff.length} kişi
          </span>
        </div>

        {message && (
          <div className="loyalty-message">
            ✅ {message}
          </div>
        )}

        {error && (
          <div className="loyalty-message">
            ⚠️ {error}
          </div>
        )}

        <div className="staff-form-card">
          <div className="staff-form-heading">
            <div className="staff-form-icon">
              ➕
            </div>

            <div>
              <strong>
                Yeni Personel Ekle
              </strong>

              <span>
                E-posta gerektirmez.
              </span>
            </div>
          </div>

          <div className="staff-form">
            <label>
              Personel adı
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                placeholder="Örn. Ahmet Yılmaz"
                autoComplete="off"
              />
            </label>

            <label>
              Kullanıcı adı
              <input
                type="text"
                value={form.username}
                onChange={(event) =>
                  setForm({
                    ...form,
                    username:
                      event.target.value
                        .toLowerCase()
                        .replace(
                          /\s/g,
                          ""
                        ),
                  })
                }
                placeholder="Örn. ahmet"
                autoComplete="off"
              />

              <small>
                Giriş sırasında bu kullanıcı adı
                kullanılacak.
              </small>
            </label>

            <label>
              Şifre
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({
                    ...form,
                    password:
                      event.target.value,
                  })
                }
                placeholder="En az 6 karakter"
                autoComplete="new-password"
              />
            </label>

            <label>
              Rol
              <select
                value={form.role}
                onChange={(event) =>
                  setForm({
                    ...form,
                    role: event.target.value,
                  })
                }
              >
                {roles.map((role) => (
                  <option
                    key={role.value}
                    value={role.value}
                  >
                    {role.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="selected-role-info">
              <strong>
                {
                  roles.find(
                    (role) =>
                      role.value ===
                      form.role
                  )?.label
                }
              </strong>

              <span>
                {
                  roles.find(
                    (role) =>
                      role.value ===
                      form.role
                  )?.description
                }
              </span>
            </div>

            <button
              type="button"
              className="loyalty-button"
              onClick={createStaff}
              disabled={saving}
            >
              {saving
                ? "Personel oluşturuluyor..."
                : "Personel Oluştur"}
            </button>
          </div>
        </div>

        <section className="staff-list-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                PERSONELLER
              </span>

              <h2>
                Personel Listesi
              </h2>
            </div>
          </div>

          {staff.length === 0 ? (
            <div className="loyalty-message">
              Henüz personel bulunmuyor.
            </div>
          ) : (
            <div className="staff-list">
              {staff.map((person) => (
                <article
                  className={`staff-card ${
                    person.active
                      ? ""
                      : "staff-card-inactive"
                  }`}
                  key={person.id}
                >
                  <div className="staff-avatar">
                    {person.name
                      ? person.name
                          .charAt(0)
                          .toUpperCase()
                      : "👤"}
                  </div>

                  <div className="staff-content">
                    <strong>
                      {person.name ||
                        "İsimsiz Personel"}
                    </strong>

                    <span className="staff-username">
                      @{person.username ||
                        "kullanıcı adı yok"}
                    </span>

                    <span
                      className={`staff-status ${
                        person.active
                          ? "staff-status-active"
                          : "staff-status-inactive"
                      }`}
                    >
                      {person.active
                        ? "● Aktif"
                        : "● Pasif"}
                    </span>
                  </div>

                  <div className="staff-actions">
                    <select
                      value={person.role}
                      onChange={(event) =>
                        changeRole(
                          person,
                          event.target
                            .value
                        )
                      }
                      disabled={
                        person.auth_user_id ===
                          currentUserId
                      }
                    >
                      {roles.map(
                        (role) => (
                          <option
                            key={
                              role.value
                            }
                            value={
                              role.value
                            }
                          >
                            {role.label}
                          </option>
                        )
                      )}
                    </select>

                    <button
                      type="button"
                      className={
                        person.active
                          ? "staff-disable-button"
                          : "staff-enable-button"
                      }
                      onClick={() =>
                        toggleStaff(
                          person
                        )
                      }
                      disabled={
                        person.auth_user_id ===
                        currentUserId
                      }
                    >
                      {person.active
                        ? "Pasifleştir"
                        : "Aktifleştir"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="staff-security-card">
          <div className="staff-security-icon">
            🔐
          </div>

          <div>
            <strong>
              Güvenlik
            </strong>

            <p>
              Personel yönetimi yalnızca admin
              rolündeki hesaplara açıktır.
              Kullanıcı adı ve şifre bilgileri
              istemci tarafında yöneticiye
              gösterilmez.
            </p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          ☕ Taşkent Cafe
        </div>

        <p>
          Personel yönetimi
        </p>

        <small>
          © 2026 Taşkent Cafe
        </small>
      </footer>

      <style jsx global>{`
        .staff-admin-page {
          padding-bottom: 40px;
        }

        .staff-form-card {
          padding: 18px;
          border: 1px solid #eee4da;
          border-radius: 21px;
          background: #ffffff;
          box-shadow:
            0 7px 24px
              rgba(60, 39, 25, 0.05);
        }

        .staff-form-heading {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 18px;
        }

        .staff-form-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #f7eee7;
          font-size: 20px;
        }

        .staff-form-heading strong {
          display: block;
          color: #392a20;
          font-size: 13px;
        }

        .staff-form-heading span {
          display: block;
          margin-top: 3px;
          color: #998c81;
          font-size: 9px;
        }

        .staff-form {
          display: grid;
          gap: 14px;
        }

        .staff-form label {
          display: grid;
          gap: 7px;
          color: #493a30;
          font-size: 10px;
          font-weight: 800;
        }

        .staff-form input,
        .staff-form select {
          width: 100%;
          height: 43px;
          padding: 0 13px;
          border: 1px solid #e5d9ce;
          border-radius: 11px;
          background: #fffaf5;
          color: #30261f;
          outline: none;
          font-size: 11px;
        }

        .staff-form input:focus,
        .staff-form select:focus {
          border-color: #b96f38;
        }

        .staff-form label small {
          margin-top: -2px;
          color: #998c81;
          font-size: 8px;
          font-weight: 500;
        }

        .selected-role-info {
          display: grid;
          gap: 3px;
          padding: 11px 13px;
          border-radius: 11px;
          background: #fffaf5;
          border: 1px solid #eee1d5;
        }

        .selected-role-info strong {
          color: #8b5e3c;
          font-size: 10px;
        }

        .selected-role-info span {
          color: #998c81;
          font-size: 8px;
        }

        .staff-list-section {
          margin-top: 30px;
        }

        .staff-list {
          display: grid;
          gap: 10px;
        }

        .staff-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border: 1px solid #eee4da;
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 5px 18px
              rgba(60, 39, 25, 0.04);
        }

        .staff-card-inactive {
          opacity: 0.62;
        }

        .staff-avatar {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #f7eee7;
          color: #8b5e3c;
          font-size: 18px;
          font-weight: 800;
        }

        .staff-content {
          flex: 1;
          min-width: 0;
        }

        .staff-content strong {
          display: block;
          color: #392a20;
          font-size: 12px;
        }

        .staff-username {
          display: block;
          margin-top: 3px;
          color: #998c81;
          font-size: 9px;
        }

        .staff-status {
          display: inline-block;
          margin-top: 5px;
          font-size: 8px;
          font-weight: 800;
        }

        .staff-status-active {
          color: #4f8a55;
        }

        .staff-status-inactive {
          color: #a46d60;
        }

        .staff-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 0 0 95px;
        }

        .staff-actions select,
        .staff-actions button {
          width: 100%;
          min-height: 32px;
          border: 1px solid #e5d9ce;
          border-radius: 9px;
          background: #fffaf5;
          color: #66584d;
          font-size: 8px;
          font-weight: 800;
        }

        .staff-actions select {
          padding: 0 5px;
        }

        .staff-actions button {
          cursor: pointer;
        }

        .staff-disable-button {
          color: #9a6255 !important;
        }

        .staff-enable-button {
          color: #4f8054 !important;
        }

        .staff-actions button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .staff-security-card {
          display: flex;
          gap: 11px;
          margin-top: 20px;
          padding: 14px;
          border: 1px solid #eee1d5;
          border-radius: 17px;
          background: #fffaf5;
        }

        .staff-security-icon {
          font-size: 19px;
        }

        .staff-security-card strong {
          display: block;
          color: #493a30;
          font-size: 10px;
        }

        .staff-security-card p {
          margin-top: 4px;
          color: #998c81;
          font-size: 8px;
          line-height: 1.55;
        }

        .admin-access-box {
          padding: 30px 20px;
          border-radius: 22px;
          background: #ffffff;
          border: 1px solid #eee4da;
          text-align: center;
        }

        .admin-access-icon {
          width: 65px;
          height: 65px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f7eee7;
          font-size: 28px;
        }

        .admin-access-box h2 {
          margin: 0;
          color: #392a20;
          font-size: 20px;
        }

        .admin-access-box p {
          margin: 8px auto 20px;
          max-width: 320px;
          color: #998c81;
          font-size: 11px;
          line-height: 1.6;
        }

        .admin-access-box
          .loyalty-message {
          margin-bottom: 15px;
        }

        @media (max-width: 600px) {
          .staff-card {
            align-items: flex-start;
          }

          .staff-actions {
            flex: 0 0 82px;
          }

          .staff-actions select,
          .staff-actions button {
            font-size: 7px;
          }
        }
      `}</style>
    </main>
  );
}