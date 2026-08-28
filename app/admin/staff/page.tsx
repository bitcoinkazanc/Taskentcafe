"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type StaffUser = {
  id: string;
  auth_user_id: string;
  role: string;
  created_at: string;
};

const roles = [
  {
    value: "staff",
    label: "Personel",
    description: "Personel işlemleri",
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
  const [currentUserId, setCurrentUserId] = useState("");
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

      const { data: adminUser, error: adminError } =
        await supabase
          .from("staff_users")
          .select("id, auth_user_id, role, created_at")
          .eq("auth_user_id", user.id)
          .eq("role", "admin")
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
      console.error("STAFF ADMIN ACCESS ERROR:", err);

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
    const { data, error: staffError } = await supabase
      .from("staff_users")
      .select("id, auth_user_id, role, created_at")
      .order("created_at", {
        ascending: false,
      });

    if (staffError) {
      throw new Error(
        `Personeller alınamadı: ${staffError.message}`
      );
    }

    setStaff((data ?? []) as StaffUser[]);
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  const createStaff = async () => {
    setMessage("");
    setError("");

    const name = form.name.trim();
    const username = form.username.trim().toLowerCase();
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
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    try {
      setSaving(true);

      const { error: rpcError } = await supabase.rpc(
        "create_staff_user",
        {
          staff_name: name,
          staff_username: username,
          staff_password: password,
          staff_role: form.role,
        }
      );

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setMessage(
        `${name} adlı personel başarıyla oluşturuldu.`
      );

      resetForm();
      await loadStaff();
    } catch (err) {
      console.error("CREATE STAFF ERROR:", err);

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
      person.auth_user_id === currentUserId &&
      newRole !== "admin"
    ) {
      setError(
        "Kendi admin yetkinizi kaldıramazsınız."
      );
      return;
    }

    const confirmed = window.confirm(
      `Bu personelin rolü "${newRole === "admin" ? "Admin" : "Personel"}" olarak değiştirilsin mi?`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const { error: rpcError } = await supabase.rpc(
        "update_staff_role",
        {
          target_staff_id: person.id,
          new_role: newRole,
        }
      );

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setMessage(
        "Personel rolü başarıyla güncellendi."
      );

      await loadStaff();
    } catch (err) {
      console.error("CHANGE ROLE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Rol değiştirilemedi."
      );
    }
  };

  const deleteStaff = async (person: StaffUser) => {
    if (person.auth_user_id === currentUserId) {
      setError(
        "Kendi admin hesabınızı silemezsiniz."
      );
      return;
    }

    const confirmed = window.confirm(
      "Bu personeli silmek istediğinize emin misiniz?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const { error: rpcError } = await supabase.rpc(
        "delete_staff_user",
        {
          target_staff_id: person.id,
        }
      );

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setMessage("Personel başarıyla silindi.");
      await loadStaff();
    } catch (err) {
      console.error("DELETE STAFF ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Personel silinemedi."
      );
    }
  };

  const adminCount = useMemo(
    () =>
      staff.filter(
        (person) => person.role === "admin"
      ).length,
    [staff]
  );

  const staffCount = useMemo(
    () =>
      staff.filter(
        (person) => person.role === "staff"
      ).length,
    [staff]
  );

  if (loading) {
    return (
      <main className="staff-page">
        <div className="staff-loading">
          <div className="loading-spinner" />
          <strong>Personel yönetimi</strong>
          <span>Yükleniyor...</span>
        </div>

        <style jsx global>{`
          .staff-page {
            min-height: 100vh;
            background: #f8f5f1;
          }

          .staff-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #4a382c;
          }

          .staff-loading strong {
            font-size: 16px;
          }

          .staff-loading span {
            color: #9b8c80;
            font-size: 11px;
          }

          .loading-spinner {
            width: 34px;
            height: 34px;
            margin-bottom: 8px;
            border: 3px solid #eadfd5;
            border-top-color: #a9693b;
            border-radius: 50%;
            animation: staffSpin 0.8s linear infinite;
          }

          @keyframes staffSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="staff-page">
        <header className="staff-header">
          <a href="/" className="staff-brand">
            <div className="staff-logo">☕</div>

            <div>
              <strong>Taşkent Cafe</strong>
              <span>Yönetim Sistemi</span>
            </div>
          </a>
        </header>

        <section className="staff-access-section">
          <div className="access-card">
            <div className="access-icon">🔒</div>

            <span className="access-label">
              GÜVENLİK
            </span>

            <h1>Yetkisiz erişim</h1>

            <p>
              Personel yönetimi yalnızca admin
              yetkisine sahip kullanıcılar tarafından
              kullanılabilir.
            </p>

            {error && (
              <div className="error-box">
                <span>⚠️</span>
                <div>{error}</div>
              </div>
            )}

            <a href="/admin" className="back-button">
              <span>←</span>
              Yönetim Paneline Dön
            </a>
          </div>
        </section>

        <style jsx global>{`
          .staff-page {
            min-height: 100vh;
            background:
              radial-gradient(
                circle at top right,
                #f4e9df 0,
                transparent 34%
              ),
              #f8f5f1;
            color: #392a20;
          }

          .staff-header {
            height: 76px;
            display: flex;
            align-items: center;
            padding: 0 22px;
            background: rgba(255, 255, 255, 0.9);
            border-bottom: 1px solid #eee5dd;
            backdrop-filter: blur(14px);
          }

          .staff-brand {
            display: flex;
            align-items: center;
            gap: 11px;
            color: inherit;
            text-decoration: none;
          }

          .staff-logo {
            width: 43px;
            height: 43px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            background: #f5e8dd;
            font-size: 21px;
          }

          .staff-brand strong {
            display: block;
            font-size: 14px;
          }

          .staff-brand span {
            display: block;
            margin-top: 2px;
            color: #a08f82;
            font-size: 9px;
          }

          .staff-access-section {
            max-width: 480px;
            margin: 0 auto;
            padding: 70px 18px;
          }

          .access-card {
            padding: 38px 25px;
            border: 1px solid #eee3da;
            border-radius: 26px;
            background: #fff;
            box-shadow: 0 18px 50px rgba(65, 43, 29, 0.07);
            text-align: center;
          }

          .access-icon {
            width: 70px;
            height: 70px;
            margin: 0 auto 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 22px;
            background: #f7eee7;
            font-size: 29px;
          }

          .access-label {
            color: #a9693b;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 1.5px;
          }

          .access-card h1 {
            margin: 7px 0 8px;
            font-size: 24px;
          }

          .access-card p {
            max-width: 340px;
            margin: 0 auto 22px;
            color: #95877d;
            font-size: 11px;
            line-height: 1.65;
          }

          .error-box {
            display: flex;
            gap: 9px;
            align-items: flex-start;
            margin-bottom: 16px;
            padding: 11px 13px;
            border: 1px solid #ead9d4;
            border-radius: 12px;
            background: #fff7f5;
            color: #8f5148;
            text-align: left;
            font-size: 9px;
            line-height: 1.5;
          }

          .back-button {
            min-height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: 12px;
            background: #3d2c21;
            color: white;
            text-decoration: none;
            font-size: 11px;
            font-weight: 800;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="staff-page">
      <header className="staff-header">
        <a href="/admin" className="staff-brand">
          <div className="staff-logo">☕</div>

          <div>
            <strong>Taşkent Cafe</strong>
            <span>Yönetim Sistemi</span>
          </div>
        </a>

        <a
          href="/admin"
          className="header-back"
          aria-label="Yönetim paneline dön"
        >
          <span>←</span>
          <span className="desktop-back-text">
            Yönetim Paneli
          </span>
        </a>
      </header>

      <div className="staff-container">
        <div className="staff-topbar">
          <div>
            <span className="page-eyebrow">
              ADMİN PANELİ
            </span>

            <h1>Personel Yönetimi</h1>

            <p>
              Personel hesaplarını ve yetkilerini
              buradan yönetin.
            </p>
          </div>

          <div className="secure-badge">
            <span>🔐</span>
            Güvenli Alan
          </div>
        </div>

        {message && (
          <div className="success-alert">
            <span>✓</span>
            <div>{message}</div>
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Mesajı kapat"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="error-alert">
            <span>!</span>
            <div>{error}</div>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Mesajı kapat"
            >
              ×
            </button>
          </div>
        )}

        <div className="staff-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>

            <div>
              <span>Toplam</span>
              <strong>{staff.length}</strong>
              <small>personel</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon admin">👑</div>

            <div>
              <span>Admin</span>
              <strong>{adminCount}</strong>
              <small>yetkili</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon staff">✓</div>

            <div>
              <span>Personel</span>
              <strong>{staffCount}</strong>
              <small>standart</small>
            </div>
          </div>
        </div>

        <div className="management-grid">
          <section className="panel create-panel">
            <div className="panel-heading">
              <div className="panel-heading-icon">
                +
              </div>

              <div>
                <span>HESAP OLUŞTUR</span>
                <h2>Yeni Personel</h2>
              </div>
            </div>

            <p className="panel-description">
              Sisteme giriş yapacak yeni bir personel
              hesabı oluşturun.
            </p>

            <div className="staff-form">
              <label>
                <span>Personel adı</span>

                <div className="input-wrap">
                  <span>👤</span>

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
                </div>
              </label>

              <label>
                <span>Kullanıcı adı</span>

                <div className="input-wrap">
                  <span>@</span>

                  <input
                    type="text"
                    value={form.username}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        username: event.target.value
                          .toLowerCase()
                          .replace(/\s/g, ""),
                      })
                    }
                    placeholder="Örn. ahmet"
                    autoComplete="off"
                  />
                </div>

                <small>
                  Giriş sırasında kullanılacak kullanıcı
                  adı.
                </small>
              </label>

              <label>
                <span>Şifre</span>

                <div className="input-wrap">
                  <span>•••</span>

                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        password: event.target.value,
                      })
                    }
                    placeholder="En az 6 karakter"
                    autoComplete="new-password"
                  />
                </div>
              </label>

              <label>
                <span>Rol</span>

                <div className="input-wrap select-wrap">
                  <span>🛡️</span>

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
                </div>
              </label>

              <div className="selected-role">
                <div>
                  <span className="selected-role-icon">
                    {form.role === "admin"
                      ? "👑"
                      : "👤"}
                  </span>

                  <div>
                    <strong>
                      {
                        roles.find(
                          (role) =>
                            role.value === form.role
                        )?.label
                      }
                    </strong>

                    <span>
                      {
                        roles.find(
                          (role) =>
                            role.value === form.role
                        )?.description
                      }
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="create-button"
                onClick={createStaff}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="button-spinner" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <span>+</span>
                    Personel Oluştur
                  </>
                )}
              </button>
            </div>
          </section>

          <section className="panel list-panel">
            <div className="panel-heading list-heading">
              <div className="panel-heading-icon list">
                👥
              </div>

              <div>
                <span>HESAPLAR</span>
                <h2>Personel Listesi</h2>
              </div>

              <div className="list-count">
                {staff.length}
              </div>
            </div>

            {staff.length === 0 ? (
              <div className="empty-staff">
                <div>👤</div>
                <strong>Henüz personel yok</strong>
                <span>
                  İlk personel hesabını sol taraftaki
                  formdan oluşturabilirsiniz.
                </span>
              </div>
            ) : (
              <div className="staff-list">
                {staff.map((person) => {
                  const isCurrentUser =
                    person.auth_user_id ===
                    currentUserId;

                  const isAdmin =
                    person.role === "admin";

                  return (
                    <article
                      className="staff-card"
                      key={person.id}
                    >
                      <div
                        className={`person-avatar ${
                          isAdmin ? "is-admin" : ""
                        }`}
                      >
                        {isAdmin ? "👑" : "👤"}
                      </div>

                      <div className="person-main">
                        <div className="person-name-row">
                          <strong>
                            {isCurrentUser
                              ? "Siz"
                              : "Personel"}
                          </strong>

                          {isCurrentUser && (
                            <span className="you-badge">
                              AKTİF HESABINIZ
                            </span>
                          )}
                        </div>

                        <span className="person-id">
                          ID · {person.id.slice(0, 8)}
                        </span>

                        <div className="person-meta">
                          <span
                            className={`role-badge ${
                              isAdmin
                                ? "admin"
                                : "staff"
                            }`}
                          >
                            {isAdmin
                              ? "👑 Admin"
                              : "👤 Personel"}
                          </span>

                          <span className="date-badge">
                            {new Date(
                              person.created_at
                            ).toLocaleDateString(
                              "tr-TR"
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="person-actions">
                        <select
                          value={person.role}
                          onChange={(event) =>
                            changeRole(
                              person,
                              event.target.value
                            )
                          }
                          aria-label="Personel rolü"
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

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() =>
                            deleteStaff(person)
                          }
                          disabled={isCurrentUser}
                        >
                          <span>×</span>
                          Sil
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="security-panel">
          <div className="security-icon">🔐</div>

          <div className="security-content">
            <strong>Admin güvenliği</strong>

            <p>
              Bu sayfaya yalnızca{" "}
              <b>staff_users</b> tablosunda admin
              rolüne sahip kullanıcılar erişebilir.
              Kendi hesabınızın admin yetkisini
              kaldıramaz veya hesabınızı silemezsiniz.
            </p>
          </div>

          <div className="security-status">
            <span />
            Korumalı
          </div>
        </div>
      </div>

      <footer className="staff-footer">
        <span>☕ Taşkent Cafe</span>
        <small>Personel Yönetimi · 2026</small>
      </footer>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        .staff-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 90% 0%,
              rgba(228, 207, 191, 0.36),
              transparent 30%
            ),
            #f8f5f1;
          color: #392a20;
        }

        .staff-header {
          position: sticky;
          top: 0;
          z-index: 20;
          height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 max(20px, calc((100vw - 1180px) / 2));
          background: rgba(255, 255, 255, 0.92);
          border-bottom: 1px solid #eee5dd;
          backdrop-filter: blur(16px);
        }

        .staff-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: inherit;
          text-decoration: none;
        }

        .staff-logo {
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #f4e8de;
          font-size: 21px;
        }

        .staff-brand strong {
          display: block;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: -0.2px;
        }

        .staff-brand span {
          display: block;
          margin-top: 2px;
          color: #9e9085;
          font-size: 9px;
        }

        .header-back {
          min-height: 38px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 13px;
          border: 1px solid #e8ddd4;
          border-radius: 11px;
          background: #fff;
          color: #6c5b4f;
          text-decoration: none;
          font-size: 9px;
          font-weight: 800;
          transition: 0.2s ease;
        }

        .header-back:hover {
          border-color: #c99b77;
          background: #fffaf6;
          transform: translateY(-1px);
        }

        .staff-container {
          width: min(1180px, calc(100% - 36px));
          margin: 0 auto;
          padding: 42px 0 55px;
        }

        .staff-topbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .page-eyebrow {
          display: block;
          margin-bottom: 7px;
          color: #a9693b;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .staff-topbar h1 {
          margin: 0;
          color: #34271f;
          font-size: clamp(25px, 4vw, 32px);
          font-weight: 900;
          letter-spacing: -1px;
        }

        .staff-topbar p {
          margin: 7px 0 0;
          color: #97887d;
          font-size: 11px;
        }

        .secure-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px;
          border: 1px solid #e8ddd4;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.7);
          color: #75665c;
          font-size: 8px;
          font-weight: 800;
          white-space: nowrap;
        }

        .success-alert,
        .error-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 46px;
          margin-bottom: 12px;
          padding: 10px 13px;
          border-radius: 12px;
          font-size: 9px;
          line-height: 1.4;
        }

        .success-alert {
          border: 1px solid #dce7d8;
          background: #f5faf3;
          color: #55734e;
        }

        .error-alert {
          border: 1px solid #ead8d3;
          background: #fff7f5;
          color: #91564e;
        }

        .success-alert > span,
        .error-alert > span {
          width: 23px;
          height: 23px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 23px;
          border-radius: 8px;
          font-weight: 900;
        }

        .success-alert > span {
          background: #e4f0df;
        }

        .error-alert > span {
          background: #f4dfdb;
        }

        .success-alert button,
        .error-alert button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 17px;
          cursor: pointer;
          opacity: 0.6;
        }

        .staff-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 13px;
          min-height: 84px;
          padding: 14px 16px;
          border: 1px solid #eee4db;
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 6px 22px rgba(60, 39, 25, 0.035);
        }

        .stat-icon {
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #f3e9e0;
          font-size: 18px;
        }

        .stat-icon.admin {
          background: #f7eadb;
        }

        .stat-icon.staff {
          background: #eee9e4;
        }

        .stat-card span {
          display: inline-block;
          color: #9c8e84;
          font-size: 8px;
          font-weight: 700;
        }

        .stat-card strong {
          display: inline-block;
          margin-left: 7px;
          color: #3c2d23;
          font-size: 20px;
          line-height: 1;
        }

        .stat-card small {
          display: block;
          margin-top: 3px;
          color: #b0a49b;
          font-size: 7px;
        }

        .management-grid {
          display: grid;
          grid-template-columns: 380px minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }

        .panel {
          border: 1px solid #ece2d9;
          border-radius: 21px;
          background: #fff;
          box-shadow: 0 9px 30px rgba(61, 40, 27, 0.045);
          overflow: hidden;
        }

        .create-panel {
          padding: 21px;
        }

        .list-panel {
          min-height: 100%;
        }

        .panel-heading {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .panel-heading-icon {
          width: 39px;
          height: 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f5e9df;
          color: #9c6239;
          font-size: 21px;
          font-weight: 500;
        }

        .panel-heading-icon.list {
          font-size: 17px;
        }

        .panel-heading > div:last-child {
          min-width: 0;
        }

        .panel-heading span {
          display: block;
          color: #b0927c;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .panel-heading h2 {
          margin: 3px 0 0;
          color: #392b22;
          font-size: 16px;
          font-weight: 900;
        }

        .panel-description {
          margin: 13px 0 19px;
          color: #988a80;
          font-size: 9px;
          line-height: 1.6;
        }

        .staff-form {
          display: grid;
          gap: 13px;
        }

        .staff-form label {
          display: grid;
          gap: 6px;
        }

        .staff-form label > span {
          color: #5a493d;
          font-size: 9px;
          font-weight: 900;
        }

        .input-wrap {
          height: 42px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 11px;
          border: 1px solid #e7dcd2;
          border-radius: 11px;
          background: #fffaf6;
          transition: 0.2s ease;
        }

        .input-wrap:focus-within {
          border-color: #bf8256;
          box-shadow: 0 0 0 3px rgba(191, 130, 86, 0.08);
        }

        .input-wrap > span {
          width: 19px;
          color: #ae907c;
          font-size: 11px;
          text-align: center;
        }

        .input-wrap input,
        .input-wrap select {
          width: 100%;
          min-width: 0;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #3d2f26;
          font-size: 10px;
          font-family: inherit;
        }

        .input-wrap input::placeholder {
          color: #b7aaa1;
        }

        .select-wrap {
          padding-right: 7px;
        }

        .staff-form label small {
          margin-top: -1px;
          color: #a99b91;
          font-size: 7px;
          line-height: 1.4;
        }

        .selected-role {
          padding: 11px;
          border: 1px solid #eee1d7;
          border-radius: 11px;
          background: #fcf8f4;
        }

        .selected-role > div {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .selected-role-icon {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #f4e7dc;
          font-size: 13px;
        }

        .selected-role strong {
          display: block;
          color: #604a3b;
          font-size: 9px;
        }

        .selected-role div div span {
          display: block;
          margin-top: 2px;
          color: #a99a90;
          font-size: 7px;
        }

        .create-button {
          min-height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 0;
          border-radius: 11px;
          background: #3d2c21;
          color: #fff;
          font-family: inherit;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .create-button:hover:not(:disabled) {
          background: #4c3729;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(61, 44, 33, 0.14);
        }

        .create-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .create-button > span:first-child {
          font-size: 17px;
          font-weight: 400;
        }

        .button-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: staffSpin 0.7s linear infinite;
        }

        .list-heading {
          min-height: 82px;
          padding: 20px;
          border-bottom: 1px solid #f0e8e1;
        }

        .list-count {
          min-width: 31px;
          height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          padding: 0 8px;
          border-radius: 9px;
          background: #f6eee8;
          color: #8e6548;
          font-size: 9px;
          font-weight: 900;
        }

        .staff-list {
          display: grid;
        }

        .staff-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 20px;
          border-bottom: 1px solid #f1eae4;
          transition: 0.2s ease;
        }

        .staff-card:last-child {
          border-bottom: 0;
        }

        .staff-card:hover {
          background: #fdfaf7;
        }

        .person-avatar {
          width: 43px;
          height: 43px;
          flex: 0 0 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #f1ebe6;
          font-size: 17px;
        }

        .person-avatar.is-admin {
          background: #f7eadb;
        }

        .person-main {
          min-width: 0;
          flex: 1;
        }

        .person-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .person-name-row strong {
          color: #3f3027;
          font-size: 11px;
          font-weight: 900;
        }

        .you-badge {
          padding: 3px 5px;
          border-radius: 5px;
          background: #e9f0e6;
          color: #64805b;
          font-size: 5px !important;
          font-weight: 900 !important;
          letter-spacing: 0.3px;
        }

        .person-id {
          display: block;
          margin-top: 3px;
          color: #aaa097;
          font-family: monospace;
          font-size: 7px;
        }

        .person-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
        }

        .role-badge,
        .date-badge {
          display: inline-flex;
          align-items: center;
          min-height: 20px;
          padding: 0 7px;
          border-radius: 6px;
          font-size: 7px;
          font-weight: 800;
        }

        .role-badge.admin {
          background: #f8eadb;
          color: #9a6339;
        }

        .role-badge.staff {
          background: #efebe7;
          color: #766960;
        }

        .date-badge {
          color: #a99d95;
          background: #faf8f6;
        }

        .person-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .person-actions select,
        .delete-button {
          height: 33px;
          border: 1px solid #e6dbd2;
          border-radius: 8px;
          background: #fffaf6;
          color: #66574d;
          font-family: inherit;
          font-size: 7px;
          font-weight: 800;
        }

        .person-actions select {
          width: 82px;
          padding: 0 5px;
          outline: none;
        }

        .delete-button {
          width: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: #a15e54;
          cursor: pointer;
        }

        .delete-button span {
          font-size: 13px;
          line-height: 1;
        }

        .delete-button:hover:not(:disabled) {
          border-color: #dfc5bf;
          background: #fff4f2;
        }

        .delete-button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .empty-staff {
          min-height: 260px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px;
          text-align: center;
        }

        .empty-staff > div {
          width: 57px;
          height: 57px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          border-radius: 17px;
          background: #f4eee9;
          font-size: 23px;
        }

        .empty-staff strong {
          color: #514137;
          font-size: 11px;
        }

        .empty-staff span {
          max-width: 240px;
          margin-top: 5px;
          color: #a79a91;
          font-size: 8px;
          line-height: 1.5;
        }

        .security-panel {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 18px;
          padding: 15px 17px;
          border: 1px solid #eadfd5;
          border-radius: 16px;
          background: #fffaf6;
        }

        .security-icon {
          width: 39px;
          height: 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 39px;
          border-radius: 12px;
          background: #f4e8de;
          font-size: 17px;
        }

        .security-content {
          flex: 1;
          min-width: 0;
        }

        .security-content strong {
          display: block;
          color: #554338;
          font-size: 9px;
          font-weight: 900;
        }

        .security-content p {
          max-width: 700px;
          margin: 4px 0 0;
          color: #9c8d83;
          font-size: 7px;
          line-height: 1.55;
        }

        .security-content b {
          color: #776254;
        }

        .security-status {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 9px;
          border-radius: 8px;
          background: #eef4eb;
          color: #66805f;
          font-size: 7px;
          font-weight: 900;
          white-space: nowrap;
        }

        .security-status span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #7c9c72;
        }

        .staff-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 25px 20px 35px;
          color: #a3968c;
        }

        .staff-footer span {
          color: #746155;
          font-size: 9px;
          font-weight: 900;
        }

        .staff-footer small {
          font-size: 7px;
        }

        @media (max-width: 850px) {
          .management-grid {
            grid-template-columns: 1fr;
          }

          .create-panel {
            max-width: none;
          }
        }

        @media (max-width: 620px) {
          .staff-header {
            height: 68px;
            padding: 0 15px;
          }

          .staff-container {
            width: calc(100% - 24px);
            padding-top: 27px;
          }

          .staff-topbar {
            align-items: flex-start;
            margin-bottom: 20px;
          }

          .staff-topbar h1 {
            font-size: 24px;
          }

          .staff-topbar p {
            max-width: 240px;
          }

          .secure-badge {
            display: none;
          }

          .staff-stats {
            gap: 7px;
          }

          .stat-card {
            min-height: 73px;
            padding: 10px;
            gap: 7px;
            border-radius: 13px;
          }

          .stat-icon {
            width: 34px;
            height: 34px;
            flex: 0 0 34px;
            border-radius: 10px;
            font-size: 14px;
          }

          .stat-card strong {
            display: block;
            margin: 3px 0 0;
            font-size: 17px;
          }

          .stat-card small {
            display: none;
          }

          .stat-card span {
            font-size: 7px;
          }

          .create-panel {
            padding: 17px;
          }

          .list-heading {
            padding: 16px;
          }

          .staff-card {
            align-items: flex-start;
            padding: 13px 14px;
            gap: 9px;
          }

          .person-avatar {
            width: 38px;
            height: 38px;
            flex-basis: 38px;
            border-radius: 11px;
            font-size: 15px;
          }

          .person-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 5px;
          }

          .person-actions select {
            width: 76px;
            height: 30px;
          }

          .delete-button {
            width: 76px;
            height: 29px;
          }

          .security-panel {
            align-items: flex-start;
          }

          .security-status {
            display: none;
          }

          .security-content p {
            font-size: 7px;
          }

          .desktop-back-text {
            display: none;
          }

          .header-back {
            width: 37px;
            justify-content: center;
            padding: 0;
          }
        }

        @media (max-width: 390px) {
          .staff-stats {
            grid-template-columns: 1fr;
          }

          .stat-card {
            min-height: 60px;
          }

          .person-meta {
            flex-wrap: wrap;
          }

          .person-actions select,
          .delete-button {
            width: 65px;
          }
        }

        @keyframes staffSpin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}