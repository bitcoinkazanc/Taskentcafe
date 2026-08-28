"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type StaffUser = {
  id: string;
  auth_user_id: string;
  name: string;
  username: string;
  role: string;
  created_at: string;
};

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  const [staff, setStaff] =
    useState<StaffUser | null>(null);

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setChecking(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setStaff(null);
        return;
      }

      const {
        data: staffUser,
        error: staffError,
      } = await supabase
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
          "STAFF SESSION ERROR:",
          staffError
        );

        await supabase.auth.signOut();

        setStaff(null);
        return;
      }

      if (!staffUser) {
        await supabase.auth.signOut();

        setStaff(null);
        return;
      }

      if (
        String(staffUser.role).toLowerCase() !==
        "admin"
      ) {
        await supabase.auth.signOut();

        setStaff(null);
        setError(
          "Bu panele yalnızca admin yetkisine sahip kullanıcılar erişebilir."
        );

        return;
      }

      setStaff(
        staffUser as StaffUser
      );
    } catch (err) {
      console.error(
        "SESSION CHECK ERROR:",
        err
      );

      setStaff(null);
    } finally {
      setChecking(false);
    }
  };

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    const cleanUsername =
      username.trim().toLowerCase();

    if (!cleanUsername || !password) {
      setError(
        "Kullanıcı adı ve şifre gereklidir."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            username: cleanUsername,
            password,
          }),
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        );

      if (
        !contentType?.includes(
          "application/json"
        )
      ) {
        throw new Error(
          "Sunucudan geçersiz cevap alındı. API adresini ve Vercel deployment'ını kontrol edin."
        );
      }

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data?.error ||
            "Kullanıcı adı veya şifre hatalı."
        );
      }

      if (
        data.session?.access_token &&
        data.session?.refresh_token
      ) {
        const {
          error: sessionError,
        } = await supabase.auth.setSession({
          access_token:
            data.session.access_token,
          refresh_token:
            data.session.refresh_token,
        });

        if (sessionError) {
          throw new Error(
            "Oturum oluşturulamadı: " +
              sessionError.message
          );
        }
      }

      if (data.staff) {
        localStorage.setItem(
          "taskent_admin_staff",
          JSON.stringify(data.staff)
        );

        setStaff(
          data.staff as StaffUser
        );
      }

      setPassword("");
    } catch (err) {
      console.error(
        "ADMIN LOGIN ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Giriş sırasında bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();

    localStorage.removeItem(
      "taskent_admin_staff"
    );

    setStaff(null);
    setUsername("");
    setPassword("");
    setError("");
  };

  if (checking) {
    return (
      <main className="admin-page">
        <div className="loading-card">
          <div className="loading-logo">
            ☕
          </div>

          <strong>
            Yönetim paneli
          </strong>

          <span>
            Oturum kontrol ediliyor...
          </span>
        </div>

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #f7f2ed;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .admin-page {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: #f7f2ed;
          }

          .loading-card {
            width: 100%;
            max-width: 330px;
            padding: 34px 20px;
            border: 1px solid #eadfd5;
            border-radius: 22px;
            background: #ffffff;
            text-align: center;
            box-shadow:
              0 15px 45px
                rgba(61, 42, 29, 0.08);
          }

          .loading-logo {
            width: 62px;
            height: 62px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 19px;
            background: #8b5e3c;
            color: #ffffff;
            font-size: 27px;
          }

          .loading-card strong {
            display: block;
            color: #392a20;
            font-size: 14px;
          }

          .loading-card span {
            display: block;
            margin-top: 6px;
            color: #9b8d82;
            font-size: 10px;
          }
        `}</style>
      </main>
    );
  }

  if (!staff) {
    return (
      <main className="login-page">
        <div className="login-container">

          <div className="brand">
            <div className="brand-logo">
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
          </div>

          <section className="login-card">

            <div className="login-icon">
              🔐
            </div>

            <div className="login-title">
              <span>
                YÖNETİCİ GİRİŞİ
              </span>

              <h2>
                Yönetim Paneli
              </h2>

              <p>
                Taşkent Cafe yönetim
                işlemlerine devam etmek
                için giriş yapın.
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="login-form"
            >

              <div className="field">
                <label htmlFor="username">
                  Kullanıcı adı
                </label>

                <div className="input-box">
                  <span>
                    👤
                  </span>

                  <input
                    id="username"
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
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">
                  Şifre
                </label>

                <div className="input-box">
                  <span>
                    🔑
                  </span>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Şifreniz"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="error-box">
                  <span>
                    ⚠️
                  </span>

                  <p>
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  <>
                    Giriş Yap
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            <a
              href="/"
              className="home-link"
            >
              ← Ana Sayfaya Dön
            </a>

          </section>

          <footer className="footer">
            <strong>
              ☕ Taşkent Cafe
            </strong>

            <span>
              Yönetim paneli
            </span>

            <small>
              © 2026 Taşkent Cafe
            </small>
          </footer>

        </div>

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #f7f2ed;
            color: #392a20;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .login-page {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            justify-content: center;
            padding: 25px 14px;
            background:
              radial-gradient(
                circle at top,
                #fffaf5 0,
                #f7f2ed 50%,
                #f2ebe4 100%
              );
          }

          .login-container {
            width: 100%;
            max-width: 420px;
          }

          .brand {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 22px;
          }

          .brand-logo {
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 16px;
            background: #8b5e3c;
            color: #ffffff;
            font-size: 24px;
            box-shadow:
              0 8px 20px
                rgba(139, 94, 60, 0.2);
          }

          .brand h1 {
            margin: 0;
            color: #392a20;
            font-size: 19px;
            font-weight: 900;
          }

          .brand span {
            display: block;
            margin-top: 4px;
            color: #9b8d82;
            font-size: 10px;
          }

          .login-card {
            padding: 30px 25px 24px;
            border: 1px solid #eadfd5;
            border-radius: 25px;
            background: #ffffff;
            box-shadow:
              0 18px 50px
                rgba(61, 42, 29, 0.09);
          }

          .login-icon {
            width: 66px;
            height: 66px;
            margin: 0 auto 17px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 20px;
            background: #f7eee7;
            border: 1px solid #eee1d6;
            font-size: 28px;
          }

          .login-title {
            text-align: center;
          }

          .login-title > span {
            color: #b56d38;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 1.5px;
          }

          .login-title h2 {
            margin: 8px 0 0;
            color: #34261d;
            font-size: 24px;
            font-weight: 900;
          }

          .login-title p {
            max-width: 300px;
            margin: 9px auto 0;
            color: #988b80;
            font-size: 11px;
            line-height: 1.6;
          }

          .login-form {
            margin-top: 25px;
          }

          .field {
            margin-bottom: 16px;
          }

          .field label {
            display: block;
            margin-bottom: 7px;
            color: #4b3a2e;
            font-size: 11px;
            font-weight: 800;
          }

          .input-box {
            height: 50px;
            display: flex;
            align-items: center;
            border: 1px solid #e4d8ce;
            border-radius: 14px;
            background: #fffdfb;
          }

          .input-box:focus-within {
            border-color: #b98259;
            box-shadow:
              0 0 0 3px
                rgba(181, 109, 56, 0.1);
          }

          .input-box > span {
            width: 47px;
            flex: 0 0 47px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 17px;
          }

          .input-box input {
            width: 100%;
            height: 100%;
            min-width: 0;
            padding: 0 13px 0 0;
            border: 0;
            outline: 0;
            background: transparent;
            color: #392a20;
            font-size: 13px;
            font-weight: 600;
          }

          .input-box input::placeholder {
            color: #b2a59a;
            font-weight: 400;
          }

          .error-box {
            display: flex;
            gap: 9px;
            align-items: flex-start;
            margin: 4px 0 15px;
            padding: 12px;
            border: 1px solid #f0d2ce;
            border-radius: 13px;
            background: #fff3f1;
          }

          .error-box p {
            margin: 0;
            color: #a34239;
            font-size: 10px;
            line-height: 1.5;
            font-weight: 700;
          }

          .login-button {
            width: 100%;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border: 0;
            border-radius: 14px;
            background: #8b5e3c;
            color: #ffffff;
            font-size: 12px;
            font-weight: 900;
            cursor: pointer;
            box-shadow:
              0 8px 20px
                rgba(139, 94, 60, 0.18);
          }

          .login-button:disabled {
            opacity: 0.65;
            cursor: not-allowed;
          }

          .spinner {
            width: 15px;
            height: 15px;
            border: 2px solid
              rgba(255, 255, 255, 0.4);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation:
              spin 0.7s linear
              infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .home-link {
            display: block;
            margin-top: 20px;
            color: #8e8177;
            font-size: 10px;
            font-weight: 700;
            text-align: center;
            text-decoration: none;
          }

          .footer {
            padding-top: 21px;
            text-align: center;
          }

          .footer strong,
          .footer span,
          .footer small {
            display: block;
          }

          .footer strong {
            color: #80644f;
            font-size: 11px;
          }

          .footer span {
            margin-top: 5px;
            color: #a4968a;
            font-size: 9px;
          }

          .footer small {
            margin-top: 6px;
            color: #b1a59b;
            font-size: 8px;
          }

          @media (max-width: 430px) {
            .login-card {
              padding:
                26px
                18px
                22px;
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="dashboard-page">

      <header className="dashboard-header">

        <div className="dashboard-brand">
          <div className="dashboard-logo">
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
        </div>

        <button
          type="button"
          className="logout-small"
          onClick={handleLogout}
        >
          ↪
        </button>

      </header>

      <section className="dashboard-content">

        <div className="welcome">

          <span className="section-label">
            YÖNETİM
          </span>

          <h2>
            Hoş geldiniz
            {staff.name
              ? `, ${staff.name}`
              : ""} 👋
          </h2>

          <p>
            Taşkent Cafe yönetim
            işlemlerini buradan
            gerçekleştirebilirsiniz.
          </p>

          <div className="admin-badge">
            <span>
              Kullanıcı
            </span>

            <strong>
              @{staff.username}
            </strong>

            <i />

            <span>
              Yetki
            </span>

            <strong>
              {staff.role}
            </strong>
          </div>

        </div>

        <div className="menu-grid">

          <a
            href="/admin/staff"
            className="menu-card"
          >
            <div className="menu-icon">
              👥
            </div>

            <div className="menu-info">
              <strong>
                Personel Yönetimi
              </strong>

              <span>
                Personel ekle, kullanıcı
                adı ve rollerini yönet.
              </span>
            </div>

            <b>
              →
            </b>
          </a>

          <a
            href="/admin/menu"
            className="menu-card"
          >
            <div className="menu-icon">
              🍽️
            </div>

            <div className="menu-info">
              <strong>
                Menü Yönetimi
              </strong>

              <span>
                Ürünleri, fiyatları ve
                kategorileri yönet.
              </span>
            </div>

            <b>
              →
            </b>
          </a>

          <a
            href="/admin/loyalty"
            className="menu-card"
          >
            <div className="menu-icon">
              ⭐
            </div>

            <div className="menu-info">
              <strong>
                Sadakat Yönetimi
              </strong>

              <span>
                Müşterileri ve sadakat
                işlemlerini yönet.
              </span>
            </div>

            <b>
              →
            </b>
          </a>

          <a
            href="/admin/tables"
            className="menu-card"
          >
            <div className="menu-icon">
              🪑
            </div>

            <div className="menu-info">
              <strong>
                Masa & QR
              </strong>

              <span>
                Masaları ve QR kodlarını
                yönet.
              </span>
            </div>

            <b>
              →
            </b>
          </a>

        </div>

        <div className="quick-info">

          <div className="quick-icon">
            🔐
          </div>

          <div>
            <strong>
              Güvenli yönetim
            </strong>

            <p>
              Bu alan yalnızca admin
              yetkisine sahip personeller
              tarafından kullanılabilir.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Çıkış Yap
        </button>

      </section>

      <footer className="dashboard-footer">

        <strong>
          ☕ Taşkent Cafe
        </strong>

        <span>
          Yönetim paneli
        </span>

        <small>
          © 2026 Taşkent Cafe
        </small>

      </footer>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f7f2ed;
          color: #392a20;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .dashboard-page {
          min-height: 100vh;
          min-height: 100dvh;
          background: #f7f2ed;
        }

        .dashboard-header {
          min-height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding:
            12px
            max(
              18px,
              calc(
                (100% - 720px) / 2
              )
            );
          border-bottom: 1px solid #eadfd5;
          background: #ffffff;
        }

        .dashboard-brand {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .dashboard-logo {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #8b5e3c;
          color: #ffffff;
          font-size: 21px;
        }

        .dashboard-brand h1 {
          margin: 0;
          color: #392a20;
          font-size: 16px;
          font-weight: 900;
        }

        .dashboard-brand span {
          display: block;
          margin-top: 3px;
          color: #9b8d82;
          font-size: 9px;
        }

        .logout-small {
          width: 40px;
          height: 40px;
          border: 1px solid #eadfd5;
          border-radius: 12px;
          background: #ffffff;
          color: #795034;
          font-size: 18px;
          cursor: pointer;
        }

        .dashboard-content {
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          padding: 26px 18px 35px;
        }

        .welcome {
          margin-bottom: 21px;
        }

        .section-label {
          color: #b56d38;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .welcome h2 {
          margin: 7px 0 0;
          color: #392a20;
          font-size: 23px;
          font-weight: 900;
        }

        .welcome > p {
          margin: 7px 0 0;
          color: #94877c;
          font-size: 11px;
          line-height: 1.55;
        }

        .admin-badge {
          display: inline-flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 12px;
          padding: 8px 11px;
          border-radius: 20px;
          background: #f5ebe2;
          color: #8b5e3c;
          font-size: 9px;
        }

        .admin-badge strong {
          font-weight: 900;
        }

        .admin-badge i {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #bca99a;
        }

        .menu-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .menu-card {
          min-height: 116px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px;
          border: 1px solid #eadfd5;
          border-radius: 19px;
          background: #ffffff;
          color: inherit;
          text-decoration: none;
          box-shadow:
            0 5px 18px
              rgba(60, 39, 25, 0.05);
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .menu-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 10px 25px
              rgba(60, 39, 25, 0.09);
        }

        .menu-icon {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: #f7eee7;
          font-size: 22px;
        }

        .menu-info {
          flex: 1;
          min-width: 0;
        }

        .menu-info strong {
          display: block;
          color: #392a20;
          font-size: 12px;
          font-weight: 900;
        }

        .menu-info span {
          display: block;
          margin-top: 5px;
          color: #998c81;
          font-size: 9px;
          line-height: 1.45;
        }

        .menu-card b {
          color: #b56d38;
          font-size: 18px;
        }

        .quick-info {
          display: flex;
          gap: 11px;
          margin-top: 19px;
          padding: 14px;
          border: 1px solid #eee1d5;
          border-radius: 17px;
          background: #fffaf5;
        }

        .quick-icon {
          font-size: 20px;
        }

        .quick-info strong {
          display: block;
          color: #493a30;
          font-size: 11px;
        }

        .quick-info p {
          margin: 4px 0 0;
          color: #998c81;
          font-size: 9px;
          line-height: 1.5;
        }

        .logout-button {
          width: 100%;
          height: 45px;
          margin-top: 17px;
          border: 1px solid #e5d8cd;
          border-radius: 13px;
          background: #ffffff;
          color: #795d49;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .dashboard-footer {
          padding:
            0
            18px
            28px;
          text-align: center;
        }

        .dashboard-footer strong,
        .dashboard-footer span,
        .dashboard-footer small {
          display: block;
        }

        .dashboard-footer strong {
          color: #80644f;
          font-size: 11px;
        }

        .dashboard-footer span {
          margin-top: 5px;
          color: #a4968a;
          font-size: 9px;
        }

        .dashboard-footer small {
          margin-top: 6px;
          color: #b1a59b;
          font-size: 8px;
        }

        @media (max-width: 600px) {
          .menu-grid {
            grid-template-columns: 1fr;
          }

          .menu-card {
            min-height: 96px;
          }
        }
      `}</style>
    </main>
  );
}