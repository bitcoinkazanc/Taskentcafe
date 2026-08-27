"use client";

import { useState } from "react";

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const setupPassword = async () => {
    try {
      setLoading(true);
      setMessage("");
      setSuccess(false);

      const response = await fetch(
        "/api/admin/set-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error ||
            "Şifre kurulumu başarısız."
        );
      }

      setSuccess(true);

      setMessage(
        "✅ Yönetici hesabının şifresi başarıyla ayarlandı."
      );
    } catch (error) {
      console.error(
        "ADMIN SETUP ERROR:",
        error
      );

      setMessage(
        error instanceof Error
          ? `⚠️ ${error.message}`
          : "⚠️ Şifre kurulumu başarısız."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="setup-page">
      <section className="setup-card">
        <div className="setup-icon">
          🔐
        </div>

        <span className="eyebrow">
          TEK SEFERLİK KURULUM
        </span>

        <h1>
          Yönetici Hesabı
        </h1>

        <p className="description">
          Mevcut Sezai yönetici hesabının
          Supabase Auth şifresini ayarlamak
          için aşağıdaki butonu kullanın.
        </p>

        <div className="account-box">
          <div>
            <span>Ad</span>
            <strong>Sezai</strong>
          </div>

          <div>
            <span>Kullanıcı adı</span>
            <strong>sezai47</strong>
          </div>

          <div>
            <span>E-posta</span>
            <strong>
              sezai_atli@msn.com
            </strong>
          </div>

          <div>
            <span>Rol</span>
            <strong>admin</strong>
          </div>
        </div>

        <button
          type="button"
          className="setup-button"
          onClick={setupPassword}
          disabled={loading || success}
        >
          {loading
            ? "Şifre ayarlanıyor..."
            : success
            ? "✓ Şifre Ayarlandı"
            : "🔑 Şifreyi Ayarla"}
        </button>

        {message && (
          <div
            className={
              success
                ? "success-message"
                : "error-message"
            }
          >
            {message}
          </div>
        )}

        {success && (
          <div className="next-box">
            <strong>
              Sonraki adım
            </strong>

            <p>
              Artık yönetici giriş sayfasından
              kullanıcı adı ve şifrenizle giriş
              yapabilirsiniz.
            </p>

            <a href="/admin">
              Yönetim Paneline Git →
            </a>
          </div>
        )}

        <a
          href="/"
          className="back-link"
        >
          ← Ana Sayfaya Dön
        </a>
      </section>

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

        .setup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .setup-card {
          width: 100%;
          max-width: 430px;
          padding: 30px 24px;
          border-radius: 24px;
          background: #ffffff;
          border: 1px solid #eee4da;
          box-shadow:
            0 12px 40px
              rgba(60, 39, 25, 0.08);
          text-align: center;
        }

        .setup-icon {
          width: 68px;
          height: 68px;
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f7eee7;
          font-size: 30px;
        }

        .eyebrow {
          display: block;
          color: #b56d38;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        h1 {
          margin: 7px 0 0;
          font-size: 25px;
          font-weight: 900;
        }

        .description {
          margin: 10px auto 20px;
          max-width: 340px;
          color: #998c81;
          font-size: 11px;
          line-height: 1.6;
        }

        .account-box {
          display: grid;
          gap: 9px;
          margin-bottom: 18px;
          padding: 15px;
          border-radius: 17px;
          background: #fffaf5;
          border: 1px solid #eee1d5;
          text-align: left;
        }

        .account-box div {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .account-box span {
          color: #998c81;
          font-size: 10px;
        }

        .account-box strong {
          color: #493a30;
          font-size: 10px;
          text-align: right;
          word-break: break-word;
        }

        .setup-button {
          width: 100%;
          height: 48px;
          border: 0;
          border-radius: 14px;
          background: #8b5e3c;
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .setup-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success-message,
        .error-message {
          margin-top: 14px;
          padding: 12px;
          border-radius: 12px;
          font-size: 10px;
          line-height: 1.5;
        }

        .success-message {
          background: #edf8ef;
          color: #28733b;
          border: 1px solid #cde8d2;
        }

        .error-message {
          background: #fff1f0;
          color: #a33d35;
          border: 1px solid #f0d0cc;
        }

        .next-box {
          margin-top: 15px;
          padding: 15px;
          border-radius: 15px;
          background: #f7eee7;
          text-align: left;
        }

        .next-box strong {
          display: block;
          font-size: 11px;
        }

        .next-box p {
          margin: 5px 0 10px;
          color: #8e8177;
          font-size: 9px;
          line-height: 1.5;
        }

        .next-box a {
          color: #8b5e3c;
          font-size: 10px;
          font-weight: 900;
          text-decoration: none;
        }

        .back-link {
          display: inline-block;
          margin-top: 20px;
          color: #8e8177;
          font-size: 10px;
          font-weight: 700;
          text-decoration: none;
        }

        @media (max-width: 480px) {
          .setup-page {
            padding: 14px;
          }

          .setup-card {
            padding: 25px 18px;
          }
        }
      `}</style>
    </main>
  );
}