"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password) {
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
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username:
              username.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error ||
            "Giriş yapılamadı."
        );
      }

      /*
       * API tarafından doğrulanan Supabase
       * session'ını gerçek Supabase client'a aktar.
       */
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

      /*
       * Personel bilgisini de sakla.
       */
      if (data.staff) {
        localStorage.setItem(
          "taskent_admin_staff",
          JSON.stringify(data.staff)
        );
      }

      /*
       * Artık olmayan /admin/dashboard
       * yerine gerçek yönetim paneline gidiyoruz.
       */
      window.location.href =
        "/admin/panel";
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

  return (
    <main className="admin-login-page">
      <div className="admin-login-container">

        <div className="login-brand">
          <div className="login-logo">
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

          <div className="login-heading">
            <span className="login-eyebrow">
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
            <div className="form-field">
              <label htmlFor="username">
                Kullanıcı adı
              </label>

              <div className="input-wrapper">
                <span className="input-icon">
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

            <div className="form-field">
              <label htmlFor="password">
                Şifre
              </label>

              <div className="input-wrapper">
                <span className="input-icon">
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
              <div className="login-error">
                <span>⚠️</span>

                <p>{error}</p>
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
            <span>←</span>
            Ana Sayfaya Dön
          </a>
        </section>

        <footer className="login-footer">
          <div>
            ☕ Taşkent Cafe
          </div>

          <p>
            Yönetim paneli
          </p>

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

        .admin-login-page {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          justify-content: center;
          padding: 28px 16px 24px;
          background:
            radial-gradient(
              circle at top,
              #fffaf5 0,
              #f7f2ed 48%,
              #f2ebe4 100%
            );
        }

        .admin-login-container {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
        }

        .login-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 22px;
        }

        .login-logo {
          width: 50px;
          height: 50px;
          flex: 0 0 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: #8b5e3c;
          color: #ffffff;
          font-size: 24px;
          box-shadow:
            0 7px 18px
              rgba(139, 94, 60, 0.2);
        }

        .login-brand h1 {
          margin: 0;
          color: #392a20;
          font-size: 19px;
          line-height: 1.15;
          font-weight: 900;
        }

        .login-brand span {
          display: block;
          margin-top: 4px;
          color: #9b8d82;
          font-size: 10px;
          font-weight: 600;
        }

        .login-card {
          width: 100%;
          padding: 30px 27px 25px;
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
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: #f7eee7;
          border: 1px solid #eee1d6;
          font-size: 28px;
        }

        .login-heading {
          text-align: center;
        }

        .login-eyebrow {
          display: block;
          color: #b56d38;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.6px;
        }

        .login-heading h2 {
          margin: 8px 0 0;
          color: #34261d;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 900;
        }

        .login-heading p {
          max-width: 300px;
          margin: 9px auto 0;
          color: #988b80;
          font-size: 11px;
          line-height: 1.6;
        }

        .login-form {
          margin-top: 26px;
        }

        .form-field {
          margin-bottom: 17px;
        }

        .form-field label {
          display: block;
          margin-bottom: 7px;
          color: #4b3a2e;
          font-size: 11px;
          font-weight: 800;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          height: 50px;
          border: 1px solid #e4d8ce;
          border-radius: 14px;
          background: #fffdfb;
        }

        .input-wrapper:focus-within {
          border-color: #b98259;
          box-shadow:
            0 0 0 3px
              rgba(181, 109, 56, 0.1);
        }

        .input-icon {
          width: 48px;
          flex: 0 0 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
        }

        .input-wrapper input {
          width: 100%;
          height: 100%;
          min-width: 0;
          padding: 0 14px 0 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #392a20;
          font-size: 13px;
          font-weight: 600;
        }

        .input-wrapper input::placeholder {
          color: #b2a59a;
          font-weight: 400;
        }

        .login-error {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin: 4px 0 15px;
          padding: 12px 13px;
          border: 1px solid #f0d2ce;
          border-radius: 13px;
          background: #fff3f1;
        }

        .login-error p {
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

        .login-button:hover:not(
            :disabled
          ) {
          background: #795034;
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
            login-spin 0.7s linear
            infinite;
        }

        @keyframes login-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .home-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 21px;
          color: #8e8177;
          font-size: 10px;
          font-weight: 700;
          text-decoration: none;
        }

        .login-footer {
          padding-top: 22px;
          text-align: center;
        }

        .login-footer div {
          color: #80644f;
          font-size: 11px;
          font-weight: 900;
        }

        .login-footer p {
          margin: 5px 0 0;
          color: #a4968a;
          font-size: 9px;
        }

        .login-footer small {
          display: block;
          margin-top: 7px;
          color: #b1a59b;
          font-size: 8px;
        }

        @media (max-width: 480px) {
          .admin-login-page {
            padding:
              20px
              12px
              18px;
          }

          .login-card {
            padding:
              25px
              18px
              21px;
          }

          .login-heading h2 {
            font-size: 22px;
          }
        }
      `}</style>
    </main>
  );
}