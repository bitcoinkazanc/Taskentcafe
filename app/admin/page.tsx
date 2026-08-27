"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type StaffUser = {
  id: string;
  auth_user_id: string;
  name: string | null;
  username: string;
  role: string;
  created_at: string;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [staff, setStaff] = useState<StaffUser | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setAuthorized(false);
        return;
      }

      const { data: staffUser, error: staffError } =
        await supabase
          .from("staff_users")
          .select(
            "id, auth_user_id, name, username, role, created_at"
          )
          .eq(
            "auth_user_id",
            session.user.id
          )
          .maybeSingle();

      if (staffError) {
        console.error(
          "STAFF SESSION CHECK ERROR:",
          staffError
        );

        setAuthorized(false);
        return;
      }

      if (!staffUser) {
        await supabase.auth.signOut();
        setAuthorized(false);
        return;
      }

      setStaff(staffUser as StaffUser);
      setAuthorized(true);
    } catch (err) {
      console.error(
        "SESSION CHECK ERROR:",
        err
      );

      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    setError("");

    const cleanUsername =
      username.trim();

    if (!cleanUsername) {
      setError(
        "Kullanıcı adını girin."
      );
      return;
    }

    if (!password) {
      setError(
        "Şifrenizi girin."
      );
      return;
    }

    try {
      setLoginLoading(true);

      const response = await fetch(
        "/api/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            username:
              cleanUsername,
            password,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Giriş yapılamadı."
        );
      }

      if (
        !result?.session
          ?.access_token ||
        !result?.session
          ?.refresh_token
      ) {
        throw new Error(
          "Giriş oturumu oluşturulamadı."
        );
      }

      const {
        error: sessionError,
      } = await supabase.auth.setSession({
        access_token:
          result.session
            .access_token,
        refresh_token:
          result.session
            .refresh_token,
      });

      if (sessionError) {
        throw new Error(
          `Oturum oluşturulamadı: ${sessionError.message}`
        );
      }

      setStaff(
        result.staff as StaffUser
      );

      setAuthorized(true);
      setPassword("");
    } catch (err) {
      console.error(
        "ADMIN LOGIN ERROR:",
        err
      );

      setAuthorized(false);

      setError(
        err instanceof Error
          ? err.message
          : "Kullanıcı adı veya şifre hatalı."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();

    setStaff(null);
    setAuthorized(false);
    setUsername("");
    setPassword("");
    setError("");
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    login();
  };

  if (loading) {
    return (
      <main className="site">
        <section className="section">
          <div className="admin-loading">
            <div className="admin-loading-icon">
              ☕
            </div>

            <strong>
              Yönetim paneli yükleniyor...
            </strong>
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

          <a
            href="/"
            className="icon-button"
            aria-label="Ana sayfa"
          >
            ←
          </a>
        </header>

        <section className="section admin-login-section">
          <div className="admin-login-box">
            <div className="admin-login-icon">
              🔐
            </div>

            <span className="eyebrow">
              YÖNETİCİ GİRİŞİ
            </span>

            <h2>
              Yönetim Paneli
            </h2>

            <p className="admin-login-description">
              Taşkent Cafe yönetim
              işlemlerine devam etmek
              için giriş yapın.
            </p>

            <form
              onSubmit={handleSubmit}
              className="admin-login-form"
            >
              <label>
                Kullanıcı adı

                <input
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                    )
                  }
                  placeholder="Kullanıcı adınız"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={
                    loginLoading
                  }
                />
              </label>

              <label>
                Şifre

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Şifreniz"
                  autoComplete="current-password"
                  disabled={
                    loginLoading
                  }
                />
              </label>

              {error && (
                <div className="admin-login-error">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                className="loyalty-button admin-login-button"
                disabled={
                  loginLoading
                }
              >
                {loginLoading
                  ? "Giriş yapılıyor..."
                  : "Giriş Yap"}
              </button>
            </form>

            <a
              href="/"
              className="admin-back-home"
            >
              ← Ana Sayfaya Dön
            </a>
          </div>
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
            Hoş geldiniz
            {staff?.name
              ? `, ${staff.name}`
              : ""}{" "}
            👋
          </h2>

          <p>
            Taşkent Cafe yönetim
            işlemlerini buradan
            gerçekleştirebilirsiniz.
          </p>

          {staff && (
            <div className="admin-role">
              Kullanıcı:{" "}
              <strong>
                {staff.username}
              </strong>

              <span className="role-separator">
                •
              </span>

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
                Personel ekle, kullanıcı
                adı, şifre ve rol yönet.
              </span>
            </div>

            <div className="admin-card-arrow">
              →
            </div>
          </a>

          <div className="admin-card admin-card-disabled">
            <div className="admin-card-icon">
              ⚙️
            </div>

            <div className="admin-card-content">
              <strong>
                Sistem Ayarları
              </strong>

              <span>
                Cafe ve yönetim sistemi
                ayarları.
              </span>
            </div>

            <div className="admin-card-badge">
              Yakında
            </div>
          </div>
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
              ürünler ana sayfadaki
              menüde otomatik olarak
              görüntülenir.
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
        .admin-loading {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #66584d;
          text-align: center;
        }

        .admin-loading-icon {
          width: 62px;
          height: 62px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f7eee7;
          font-size: 27px;
        }

        .admin-login-section {
          padding-top: 35px;
          padding-bottom: 45px;
        }

        .admin-login-box {
          max-width: 410px;
          margin: 0 auto;
          padding: 30px 22px;
          border: 1px solid #eee4da;
          border-radius: 24px;
          background: #ffffff;
          box-shadow:
            0 10px 35px
              rgba(60, 39, 25, 0.07);
          text-align: center;
        }

        .admin-login-icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f7eee7;
          font-size: 31px;
        }

        .admin-login-box h2 {
          margin-top: 6px;
          color: #392a20;
          font-size: 24px;
          font-weight: 800;
        }

        .admin-login-description {
          max-width: 310px;
          margin: 8px auto 23px;
          color: #998c81;
          font-size: 11px;
          line-height: 1.6;
        }

        .admin-login-form {
          display: grid;
          gap: 15px;
          text-align: left;
        }

        .admin-login-form label {
          display: grid;
          gap: 7px;
          color: #493a30;
          font-size: 11px;
          font-weight: 800;
        }

        .admin-login-form input {
          width: 100%;
          height: 45px;
          padding: 0 13px;
          border: 1px solid #e5d9ce;
          border-radius: 12px;
          background: #fffaf5;
          color: #30261f;
          outline: none;
          font-size: 13px;
        }

        .admin-login-form input:focus {
          border-color: #b96f38;
          background: #ffffff;
        }

        .admin-login-form input:disabled {
          opacity: 0.6;
        }

        .admin-login-error {
          padding: 11px 12px;
          border-radius: 11px;
          background: #fff3f0;
          border: 1px solid #f0d5cf;
          color: #9a4c3d;
          font-size: 10px;
          line-height: 1.5;
        }

        .admin-login-button {
          width: 100%;
          margin-top: 2px;
        }

        .admin-back-home {
          display: inline-block;
          margin-top: 20px;
          color: #8b6b55;
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
        }

        .admin-back-home:hover {
          text-decoration: underline;
        }

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
          display: inline-flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 12px;
          padding: 7px 11px;
          border-radius: 20px;
          background: #f5ebe2;
          color: #8b5e3c;
          font-size: 10px;
        }

        .role-separator {
          opacity: 0.45;
          margin: 0 2px;
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

        .admin-card:not(
            .admin-card-disabled
          ):hover {
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

        .admin-card-disabled {
          cursor: default;
          opacity: 0.65;
        }

        .admin-card-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 7px;
          border-radius: 10px;
          background: #eee8e2;
          color: #8e8177;
          font-size: 7px;
          font-weight: 800;
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

        @media (max-width: 600px) {
          .admin-grid {
            grid-template-columns: 1fr;
          }

          .admin-card {
            min-height: 92px;
          }

          .admin-login-box {
            padding: 27px 18px;
          }
        }
      `}</style>
    </main>
  );
}