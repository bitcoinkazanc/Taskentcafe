"use client";

import { FormEvent, useEffect, useState } from "react";
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
  const [loggingIn, setLoggingIn] = useState(false);

  const [user, setUser] = useState<StaffUser | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (!session?.user) {
        setUser(null);
        return;
      }

      await loadStaff(session.user.id);
    } catch (err) {
      console.error("ADMIN SESSION ERROR:", err);

      setUser(null);

      setError(
        err instanceof Error
          ? err.message
          : "Oturum kontrol edilemedi."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async (authUserId: string) => {
    const {
      data,
      error: staffError,
    } = await supabase
      .from("staff_users")
      .select(
        "id, auth_user_id, name, username, role, created_at"
      )
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (staffError) {
      throw new Error(
        `Personel bilgisi alınamadı: ${staffError.message}`
      );
    }

    if (!data) {
      await supabase.auth.signOut();

      setUser(null);

      throw new Error(
        "Bu hesap personel olarak tanımlanmamış."
      );
    }

    setUser(data as StaffUser);
  };

  const login = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanUsername = username
      .trim()
      .toLowerCase();

    if (!cleanUsername) {
      setError("Kullanıcı adı girin.");
      return;
    }

    if (!password) {
      setError("Şifre girin.");
      return;
    }

    try {
      setLoggingIn(true);

      /*
       * Supabase Auth e-posta ile giriş yaptığı için
       * kullanıcı adını staff_users üzerinden buluyoruz.
       */
      const {
        data: staff,
        error: staffError,
      } = await supabase
        .from("staff_users")
        .select(
          "id, auth_user_id, name, username, role, created_at"
        )
        .ilike("username", cleanUsername)
        .maybeSingle();

      if (staffError) {
        throw new Error(
          `Kullanıcı kontrolü başarısız: ${staffError.message}`
        );
      }

      if (!staff) {
        throw new Error(
          "Kullanıcı adı veya şifre hatalı."
        );
      }

      /*
       * Auth hesabının e-posta adresini frontend'e
       * çıkarmıyoruz.
       *
       * Bu yapı için Supabase Auth hesabının e-posta
       * adresini staff_users içine ayrıca koymamız gerekiyor.
       *
       * Şimdilik auth_user_id üzerinden mevcut oturum
       * kontrol ediliyor.
       */

      const {
        data: currentSession,
      } = await supabase.auth.getSession();

      if (currentSession.session?.user) {
        const currentUser =
          currentSession.session.user;

        if (
          currentUser.id !==
          staff.auth_user_id
        ) {
          await supabase.auth.signOut();
        } else {
          setUser(staff as StaffUser);
          setMessage(
            "Zaten giriş yapılmış."
          );
          return;
        }
      }

      /*
       * Kullanıcı adıyla doğrudan Supabase Auth
       * signIn yapılamaz.
       *
       * Bu nedenle burada bilerek anlaşılır hata
       * gösteriyoruz. Bir sonraki SQL/API adımında
       * username → Auth email eşlemesini güvenli
       * şekilde kuracağız.
       */
      throw new Error(
        "Kullanıcı adı giriş sistemi için Auth eşlemesi henüz tamamlanmadı."
      );
    } catch (err) {
      console.error("ADMIN LOGIN ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Giriş yapılamadı."
      );
    } finally {
      setLoggingIn(false);
    }
  };

  const signOut = async () => {
    setError("");
    setMessage("");

    await supabase.auth.signOut();

    setUser(null);
    setUsername("");
    setPassword("");
  };

  if (loading) {
    return (
      <main className="site">
        <section className="section">
          <div className="admin-loading">
            <div className="admin-loading-icon">
              ☕
            </div>

            <p>
              Yönetim paneli kontrol ediliyor...
            </p>
          </div>
        </section>
      </main>
    );
  }

  /*
   * GİRİŞ YAPILMAMIŞSA
   */
  if (!user) {
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
          <div className="admin-login-card">
            <div className="admin-login-icon">
              🔐
            </div>

            <span className="eyebrow">
              YÖNETİM
            </span>

            <h2>
              Yönetim Paneli
            </h2>

            <p className="admin-login-description">
              Yetkili personel hesabınızla
              giriş yapın.
            </p>

            {error && (
              <div className="admin-error">
                ⚠️ {error}
              </div>
            )}

            {message && (
              <div className="admin-success">
                ✅ {message}
              </div>
            )}

            <form
              onSubmit={login}
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
                  placeholder="Örn. sezai47"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
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
                />
              </label>

              <button
                type="submit"
                className="admin-login-button"
                disabled={loggingIn}
              >
                {loggingIn
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

        <style jsx global>{`
          .admin-login-section {
            min-height: 65vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .admin-login-card {
            width: 100%;
            max-width: 390px;
            padding: 30px 22px;
            border-radius: 24px;
            background: #ffffff;
            border: 1px solid #eee4da;
            box-shadow:
              0 12px 35px
                rgba(60, 39, 25, 0.08);
            text-align: center;
          }

          .admin-login-icon {
            width: 70px;
            height: 70px;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 22px;
            background: #f7eee7;
            font-size: 30px;
          }

          .admin-login-card h2 {
            margin-top: 7px;
            color: #392a20;
            font-size: 23px;
          }

          .admin-login-description {
            margin-top: 8px;
            color: #998c81;
            font-size: 11px;
            line-height: 1.5;
          }

          .admin-login-form {
            display: grid;
            gap: 14px;
            margin-top: 23px;
            text-align: left;
          }

          .admin-login-form label {
            display: grid;
            gap: 7px;
            color: #493a30;
            font-size: 10px;
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
            font-size: 12px;
          }

          .admin-login-form input:focus {
            border-color: #b96f38;
          }

          .admin-login-button {
            width: 100%;
            height: 46px;
            margin-top: 5px;
            border: 0;
            border-radius: 13px;
            background: #b56d38;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
          }

          .admin-login-button:disabled {
            opacity: 0.6;
            cursor: wait;
          }

          .admin-error,
          .admin-success {
            margin-top: 17px;
            padding: 11px 12px;
            border-radius: 11px;
            font-size: 10px;
            line-height: 1.5;
            text-align: left;
          }

          .admin-error {
            background: #fff1ef;
            color: #a34b3e;
            border: 1px solid #f0d4d0;
          }

          .admin-success {
            background: #eff8ef;
            color: #4f7b50;
            border: 1px solid #d7e9d7;
          }

          .admin-back-home {
            display: inline-block;
            margin-top: 20px;
            color: #8b6a54;
            font-size: 10px;
            font-weight: 700;
            text-decoration: none;
          }

          .admin-loading {
            min-height: 50vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #998c81;
            text-align: center;
          }

          .admin-loading-icon {
            font-size: 35px;
            margin-bottom: 10px;
          }

          .admin-loading p {
            font-size: 11px;
          }
        `}</style>
      </main>
    );
  }

  /*
   * GİRİŞ YAPILMIŞSA
   */
  return (
    <main className="site">
      <header className="header">
        <div className="brand">
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
        </div>

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
            {user.name
              ? `, ${user.name}`
              : ""}{" "}
            👋
          </h2>

          <p>
            Taşkent Cafe yönetim
            işlemlerini buradan
            gerçekleştirebilirsiniz.
          </p>

          <div className="admin-role">
            Kullanıcı:{" "}
            <strong>
              {user.username}
            </strong>

            {" • "}

            Yetki:{" "}
            <strong>
              {user.role}
            </strong>
          </div>
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
                fiyat ve resimleri yönet.
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

          {user.role === "admin" && (
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
                  adı, şifre ve rollerini
                  yönet.
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