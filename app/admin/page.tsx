"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type StaffUser = {
  id: string;
  auth_user_id: string;
  role: string;
  created_at: string;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [staff, setStaff] = useState<StaffUser | null>(null);
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

      const { data: staffUser, error: staffError } =
        await supabase
          .from("staff_users")
          .select(
            "id, auth_user_id, role, created_at"
          )
          .eq("auth_user_id", user.id)
          .maybeSingle();

      if (staffError) {
        throw new Error(
          `Yetki kontrolü başarısız: ${staffError.message}`
        );
      }

      if (!staffUser) {
        setAuthorized(false);
        return;
      }

      setStaff(staffUser as StaffUser);
      setAuthorized(true);
    } catch (err) {
      console.error(
        "ADMIN ACCESS ERROR:",
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

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <main className="site">
        <section className="section">
          <div className="loyalty-message">
            Yönetim paneli yükleniyor...
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
                Yönetim Paneli
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
              Bu yönetim paneline yalnızca
              yetkili personel erişebilir.
            </p>

            {error && (
              <div className="loyalty-message">
                ⚠️ {error}
              </div>
            )}

            <a
              href="/"
              className="loyalty-button"
            >
              Ana Sayfaya Dön
            </a>
          </div>
        </section>
      </main>
    );
  }

  const isAdmin =
    staff?.role === "admin";

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
              Yönetim Paneli
            </span>
          </div>
        </a>

        <button
          type="button"
          className="icon-button"
          onClick={signOut}
          aria-label="Çıkış yap"
          title="Çıkış yap"
        >
          ↪
        </button>
      </header>

      <section className="section admin-dashboard">
        <div className="admin-welcome">
          <span className="eyebrow">
            YÖNETİM
          </span>

          <h2>
            Hoş geldiniz 👋
          </h2>

          <p>
            Taşkent Cafe yönetim işlemlerini
            buradan gerçekleştirebilirsiniz.
          </p>

          {staff && (
            <div className="admin-role">
              Yetki:{" "}
              <strong>
                {staff.role}
              </strong>
            </div>
          )}
        </div>

        <div className="admin-grid">
          <a
            href="/admin/menu"
            className="admin-card"
          >
            <div className="admin-card-icon">
              🍽️
            </div>

            <div className="admin-card-content">
              <strong>
                Menü Yönetimi
              </strong>

              <span>
                Ürün ekle, düzenle, sil,
                fiyat ve resimlerini yönet.
              </span>
            </div>

            <div className="admin-card-arrow">
              →
            </div>
          </a>

          <a
            href="/admin/loyalty"
            className="admin-card"
          >
            <div className="admin-card-icon">
              ⭐
            </div>

            <div className="admin-card-content">
              <strong>
                Sadakat & Müşteriler
              </strong>

              <span>
                Müşterileri görüntüle ve
                alışveriş puanı ekle.
              </span>
            </div>

            <div className="admin-card-arrow">
              →
            </div>
          </a>

          <a
            href="/admin/tables"
            className="admin-card"
          >
            <div className="admin-card-icon">
              🪑
            </div>

            <div className="admin-card-content">
              <strong>
                Masa QR Kodları
              </strong>

              <span>
                Masaları görüntüle ve QR
                kodlarını yazdır.
              </span>
            </div>

            <div className="admin-card-arrow">
              →
            </div>
          </a>

          {isAdmin && (
            <a
              href="/admin/staff"
              className="admin-card"
            >
              <div className="admin-card-icon">
                👨‍🍳
              </div>

              <div className="admin-card-content">
                <strong>
                  Personel Yönetimi
                </strong>

                <span>
                  Garson ve personel ekle,
                  rollerini ve yetkilerini yönet.
                </span>
              </div>

              <div className="admin-card-arrow">
                →
              </div>
            </a>
          )}

          {isAdmin && (
            <a
              href="/admin/staff"
              className="admin-card"
            >
              <div className="admin-card-icon">
                🔑
              </div>

              <div className="admin-card-content">
                <strong>
                  Yetki Yönetimi
                </strong>

                <span>
                  Personellere admin veya staff
                  rolü ver.
                </span>
              </div>

              <div className="admin-card-arrow">
                →
              </div>
            </a>
          )}
        </div>

        <div className="admin-info-card">
          <div className="admin-info-icon">
            💡
          </div>

          <div>
            <strong>
              Yönetim paneli
            </strong>

            <p>
              Menüye eklediğiniz aktif
              ürünler ana sayfadaki menüde
              otomatik olarak görüntülenir.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="admin-logout-button"
          onClick={signOut}
        >
          Çıkış Yap
        </button>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          ☕ Taşkent Cafe
        </div>

        <p>
          Yönetim paneli
        </p>

        <small>
          © 2026 Taşkent Cafe
        </small>
      </footer>

      <style jsx global>{`
        .admin-dashboard {
          padding-bottom: 40px;
        }

        .admin-welcome {
          margin-bottom: 24px;
        }

        .admin-welcome h2 {
          margin-top: 5px;
        }

        .admin-welcome p {
          margin-top: 7px;
          color: #8e8177;
          font-size: 12px;
          line-height: 1.6;
        }

        .admin-role {
          display: inline-block;
          margin-top: 12px;
          padding: 7px 11px;
          border-radius: 20px;
          background: #f5ebe2;
          color: #8b5e3c;
          font-size: 10px;
        }

        .admin-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .admin-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 105px;
          padding: 16px;
          border: 1px solid #eee4da;
          border-radius: 19px;
          background: #ffffff;
          color: inherit;
          text-decoration: none;
          box-shadow:
            0 5px 18px
              rgba(60, 39, 25, 0.05);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .admin-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 9px 25px
              rgba(60, 39, 25, 0.09);
        }

        .admin-card-icon {
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

        .admin-card-content {
          flex: 1;
          min-width: 0;
        }

        .admin-card-content strong {
          display: block;
          color: #392a20;
          font-size: 13px;
          font-weight: 800;
        }

        .admin-card-content span {
          display: block;
          margin-top: 5px;
          color: #998c81;
          font-size: 9px;
          line-height: 1.45;
        }

        .admin-card-arrow {
          color: #b56d38;
          font-size: 19px;
          font-weight: 700;
        }

        .admin-info-card {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          padding: 15px;
          border-radius: 17px;
          background: #fffaf5;
          border: 1px solid #eee1d5;
        }

        .admin-info-icon {
          font-size: 20px;
        }

        .admin-info-card strong {
          display: block;
          color: #493a30;
          font-size: 11px;
        }

        .admin-info-card p {
          margin-top: 4px;
          color: #998c81;
          font-size: 9px;
          line-height: 1.5;
        }

        .admin-logout-button {
          width: 100%;
          margin-top: 18px;
          height: 44px;
          border: 1px solid #e5d8cd;
          border-radius: 13px;
          background: #ffffff;
          color: #795d49;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
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
          .admin-grid {
            grid-template-columns: 1fr;
          }

          .admin-card {
            min-height: 92px;
          }
        }
      `}</style>
    </main>
  );
}