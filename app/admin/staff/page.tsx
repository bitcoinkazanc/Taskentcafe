"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type StaffUser = {
  id: string;
  auth_user_id: string;
  role: "admin" | "staff";
  created_at: string;
};

export default function StaffAdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);

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

      const { data: adminCheck, error: adminError } =
        await supabase.rpc("is_admin");

      if (adminError) {
        throw new Error(
          `Admin kontrolü başarısız: ${adminError.message}`
        );
      }

      if (!adminCheck) {
        setAuthorized(false);
        return;
      }

      setAuthorized(true);

      await loadStaff();
    } catch (err) {
      console.error("STAFF ADMIN ERROR:", err);

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
    const { data, error: staffError } =
      await supabase
        .from("staff_users")
        .select(
          "id, auth_user_id, role, created_at"
        )
        .order("created_at", {
          ascending: true,
        });

    if (staffError) {
      throw new Error(
        `Personeller alınamadı: ${staffError.message}`
      );
    }

    setStaffUsers(
      (data ?? []) as StaffUser[]
    );
  };

  const changeRole = async (
    staffUser: StaffUser
  ) => {
    if (staffUser.auth_user_id === currentUserId) {
      setError(
        "Kendi admin yetkinizi buradan değiştiremezsiniz."
      );
      return;
    }

    const newRole =
      staffUser.role === "admin"
        ? "staff"
        : "admin";

    const confirmed = window.confirm(
      `${staffUser.role === "admin" ? "Admin" : "Staff"} rolündeki bu personeli "${newRole}" rolüne geçirmek istediğinize emin misiniz?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setWorkingId(staffUser.id);
      setError("");
      setMessage("");

      const { error: rpcError } =
        await supabase.rpc(
          "update_staff_role",
          {
            target_staff_id:
              staffUser.id,
            new_role: newRole,
          }
        );

      if (rpcError) {
        throw new Error(
          rpcError.message
        );
      }

      setMessage(
        `Personel rolü "${newRole}" olarak güncellendi.`
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
          : "Personel rolü değiştirilemedi."
      );
    } finally {
      setWorkingId(null);
    }
  };

  const removeStaff = async (
    staffUser: StaffUser
  ) => {
    if (staffUser.auth_user_id === currentUserId) {
      setError(
        "Kendi admin yetkinizi kaldıramazsınız."
      );
      return;
    }

    const confirmed = window.confirm(
      "Bu personelin yönetim yetkisini kaldırmak istediğinize emin misiniz?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setWorkingId(staffUser.id);
      setError("");
      setMessage("");

      const { error: rpcError } =
        await supabase.rpc(
          "remove_staff",
          {
            target_staff_id:
              staffUser.id,
          }
        );

      if (rpcError) {
        throw new Error(
          rpcError.message
        );
      }

      setMessage(
        "Personelin yönetim yetkisi kaldırıldı."
      );

      await loadStaff();
    } catch (err) {
      console.error(
        "REMOVE STAFF ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Personel yetkisi kaldırılamadı."
      );
    } finally {
      setWorkingId(null);
    }
  };

  const formatDate = (
    date: string
  ) => {
    return new Date(
      date
    ).toLocaleDateString(
      "tr-TR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
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
              Bu bölüme yalnızca admin
              yetkisine sahip kullanıcılar
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
              YÖNETİM
            </span>

            <h2>
              Personel Yönetimi
            </h2>
          </div>

          <span className="menu-count">
            {staffUsers.length} kişi
          </span>
        </div>

        <div className="staff-info-card">
          <div className="staff-info-icon">
            🔐
          </div>

          <div>
            <strong>
              Admin yetkisi
            </strong>

            <p>
              Buradan personellerin rollerini
              yönetebilir ve yönetim erişimlerini
              kaldırabilirsiniz.
            </p>
          </div>
        </div>

        {message && (
          <div className="loyalty-message staff-success">
            ✅ {message}
          </div>
        )}

        {error && (
          <div className="loyalty-message staff-error">
            ⚠️ {error}
          </div>
        )}

        <div className="staff-list">
          {staffUsers.length === 0 ? (
            <div className="loyalty-message">
              Henüz personel bulunmuyor.
            </div>
          ) : (
            staffUsers.map(
              (staffUser) => {
                const isMe =
                  staffUser.auth_user_id ===
                  currentUserId;

                const isWorking =
                  workingId ===
                  staffUser.id;

                return (
                  <article
                    className="staff-card"
                    key={staffUser.id}
                  >
                    <div className="staff-avatar">
                      {staffUser.role ===
                      "admin"
                        ? "👑"
                        : "👨‍🍳"}
                    </div>

                    <div className="staff-content">
                      <div className="staff-name">
                        {isMe
                          ? "Siz"
                          : "Personel"}
                      </div>

                      <div className="staff-id">
                        {staffUser.auth_user_id}
                      </div>

                      <div className="staff-date">
                        Eklenme:{" "}
                        {formatDate(
                          staffUser.created_at
                        )}
                      </div>
                    </div>

                    <div className="staff-actions">
                      <span
                        className={
                          staffUser.role ===
                          "admin"
                            ? "staff-role staff-role-admin"
                            : "staff-role staff-role-staff"
                        }
                      >
                        {staffUser.role ===
                        "admin"
                          ? "ADMIN"
                          : "STAFF"}
                      </span>

                      {!isMe && (
                        <>
                          <button
                            type="button"
                            className="staff-action-button"
                            disabled={
                              isWorking
                            }
                            onClick={() =>
                              changeRole(
                                staffUser
                              )
                            }
                          >
                            {isWorking
                              ? "..."
                              : staffUser.role ===
                                "admin"
                              ? "Staff Yap"
                              : "Admin Yap"}
                          </button>

                          <button
                            type="button"
                            className="staff-remove-button"
                            disabled={
                              isWorking
                            }
                            onClick={() =>
                              removeStaff(
                                staffUser
                              )
                            }
                          >
                            Yetkiyi Kaldır
                          </button>
                        </>
                      )}

                      {isMe && (
                        <span className="staff-you">
                          Aktif hesabınız
                        </span>
                      )}
                    </div>
                  </article>
                );
              }
            )
          )}
        </div>

        <div className="staff-coming-card">
          <div className="staff-coming-icon">
            ➕
          </div>

          <div>
            <strong>
              Yeni personel ekleme
            </strong>

            <p>
              Personel oluşturma bölümünü
              bir sonraki adımda ekleyeceğiz.
              Burada yeni personelin e-posta
              adresini girerek hesap oluşturma
              sistemi olacak.
            </p>
          </div>
        </div>

        <a
          href="/admin"
          className="staff-back-button"
        >
          ← Yönetim Paneline Dön
        </a>
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

        .staff-info-card {
          display: flex;
          gap: 12px;
          margin-bottom: 18px;
          padding: 15px;
          border-radius: 17px;
          background: #fffaf5;
          border: 1px solid #eee1d5;
        }

        .staff-info-icon {
          font-size: 21px;
        }

        .staff-info-card strong {
          display: block;
          color: #493a30;
          font-size: 11px;
        }

        .staff-info-card p {
          margin-top: 4px;
          color: #998c81;
          font-size: 9px;
          line-height: 1.5;
        }

        .staff-success {
          margin-bottom: 12px;
        }

        .staff-error {
          margin-bottom: 12px;
        }

        .staff-list {
          display: grid;
          gap: 11px;
        }

        .staff-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border: 1px solid #eee4da;
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 5px 18px
              rgba(60, 39, 25, 0.05);
        }

        .staff-avatar {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: #f7eee7;
          font-size: 23px;
        }

        .staff-content {
          flex: 1;
          min-width: 0;
        }

        .staff-name {
          color: #392a20;
          font-size: 13px;
          font-weight: 800;
        }

        .staff-id {
          margin-top: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #998c81;
          font-size: 8px;
        }

        .staff-date {
          margin-top: 4px;
          color: #b3a69c;
          font-size: 8px;
        }

        .staff-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          flex: 0 0 auto;
        }

        .staff-role {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 58px;
          padding: 5px 8px;
          border-radius: 9px;
          font-size: 8px;
          font-weight: 900;
        }

        .staff-role-admin {
          background: #f7eadc;
          color: #9a5e2f;
        }

        .staff-role-staff {
          background: #eeeae6;
          color: #75685d;
        }

        .staff-action-button,
        .staff-remove-button {
          min-width: 105px;
          padding: 7px 9px;
          border-radius: 9px;
          font-size: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        .staff-action-button {
          border: 1px solid #e2d4c8;
          background: #fffaf5;
          color: #805a3e;
        }

        .staff-remove-button {
          border: 1px solid #ead8d2;
          background: #fff7f5;
          color: #a35e50;
        }

        .staff-action-button:disabled,
        .staff-remove-button:disabled {
          opacity: 0.5;
          cursor: wait;
        }

        .staff-you {
          color: #998c81;
          font-size: 8px;
        }

        .staff-coming-card {
          display: flex;
          gap: 12px;
          margin-top: 18px;
          padding: 16px;
          border: 1px dashed #dfd1c5;
          border-radius: 18px;
          background: #fffaf5;
        }

        .staff-coming-icon {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f3e7dd;
          color: #a5673c;
          font-size: 18px;
          font-weight: 800;
        }

        .staff-coming-card strong {
          display: block;
          color: #493a30;
          font-size: 11px;
        }

        .staff-coming-card p {
          margin-top: 5px;
          color: #998c81;
          font-size: 9px;
          line-height: 1.5;
        }

        .staff-back-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 44px;
          margin-top: 18px;
          border: 1px solid #e5d8cd;
          border-radius: 13px;
          background: #ffffff;
          color: #795d49;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
        }

        @media (max-width: 600px) {
          .staff-card {
            align-items: flex-start;
          }

          .staff-actions {
            min-width: 105px;
          }

          .staff-id {
            max-width: 150px;
          }
        }
      `}</style>
    </main>
  );
}