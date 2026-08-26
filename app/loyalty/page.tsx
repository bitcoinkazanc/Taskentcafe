"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Customer = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  points: number;
  level: string;
};

type Transaction = {
  id: string;
  points: number;
  type: string;
  description: string;
  created_at: string;
};

const rewards = [
  {
    id: 1,
    name: "Ücretsiz Türk Kahvesi",
    description: "Bir adet Türk kahvesi.",
    points: 500,
    icon: "☕",
  },
  {
    id: 2,
    name: "Ücretsiz Çay",
    description: "Bir adet çay.",
    points: 300,
    icon: "🍵",
  },
  {
    id: 3,
    name: "Tatlı İndirimi",
    description: "Bir tatlıda %20 indirim.",
    points: 700,
    icon: "🍰",
  },
];

const logoUrl =
  "https://raw.githubusercontent.com/bitcoinkazanc/Taskentcafe/main/taskent-logo.png";

export default function LoyaltyPage() {
  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [redeeming, setRedeeming] =
    useState<number | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadLoyalty();
  }, []);

  const loadLoyalty = async () => {
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
        throw new Error(
          "Sadakat hesabınız bulunamadı. Lütfen giriş yapın."
        );
      }

      const {
        data: customerData,
        error: customerError,
      } = await supabase
        .from("customers")
        .select(
          "id, name, phone, email, points, level"
        )
        .eq(
          "auth_user_id",
          user.id
        )
        .maybeSingle();

      if (customerError) {
        throw new Error(
          `Müşteri bilgisi alınamadı: ${customerError.message}`
        );
      }

      if (!customerData) {
        throw new Error(
          "Sadakat hesabınız bulunamadı."
        );
      }

      setCustomer(
        customerData as Customer
      );

      const {
        data: transactionData,
        error: transactionError,
      } = await supabase
        .from("loyalty_transactions")
        .select(
          "id, points, type, description, created_at"
        )
        .eq(
          "customer_id",
          customerData.id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (transactionError) {
        throw new Error(
          `Puan geçmişi alınamadı: ${transactionError.message}`
        );
      }

      setTransactions(
        (transactionData ??
          []) as Transaction[]
      );
    } catch (err) {
      console.error(
        "LOYALTY LOAD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Sadakat bilgileri yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (
    rewardId: number,
    rewardName: string,
    rewardPoints: number
  ) => {
    if (!customer) {
      setError(
        "Müşteri hesabı bulunamadı."
      );
      return;
    }

    if (
      customer.points <
      rewardPoints
    ) {
      setError(
        `${rewardName} için ${
          rewardPoints -
          customer.points
        } puan daha gerekiyor.`
      );
      return;
    }

    try {
      setRedeeming(rewardId);
      setMessage("");
      setError("");

      const {
        data,
        error: rpcError,
      } = await supabase.rpc(
        "redeem_loyalty_reward",
        {
          target_customer_id:
            customer.id,

          reward_points:
            rewardPoints,

          reward_description:
            rewardName,
        }
      );

      if (rpcError) {
        throw new Error(
          rpcError.message
        );
      }

      if (!data) {
        throw new Error(
          "Ödül kullanıldı ancak müşteri bilgisi alınamadı."
        );
      }

      setCustomer(
        data as Customer
      );

      setMessage(
        `${rewardName} başarıyla kullanıldı.`
      );

      await loadLoyalty();
    } catch (err) {
      console.error(
        "REDEEM REWARD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Ödül kullanılamadı."
      );
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <main className="site">
        <header className="header">
          <a
            href="/"
            className="brand"
          >
            <div className="logo">
              <img
                src={logoUrl}
                alt="Taşkent Cafe"
              />
            </div>

            <div>
              <h1>
                Taşkent Cafe
              </h1>

              <span>
                Sadakat Kulübü
              </span>
            </div>
          </a>
        </header>

        <section className="loyalty-page">
          <div className="loading-card">
            <div className="loading-logo">
              <img
                src={logoUrl}
                alt=""
              />
            </div>

            <strong>
              Sadakat kartınız
              hazırlanıyor
            </strong>

            <span>
              Lütfen bekleyin...
            </span>
          </div>
        </section>
      </main>
    );
  }

  if (error && !customer) {
    return (
      <main className="site">
        <header className="header">
          <a
            href="/"
            className="brand"
          >
            <div className="logo">
              <img
                src={logoUrl}
                alt="Taşkent Cafe"
              />
            </div>

            <div>
              <h1>
                Taşkent Cafe
              </h1>

              <span>
                Sadakat Kulübü
              </span>
            </div>
          </a>

          <a
            href="/"
            className="back-button"
            aria-label="Ana sayfa"
          >
            ←
          </a>
        </header>

        <section className="loyalty-page">
          <div className="error-card">
            <div className="error-icon">
              !
            </div>

            <h2>
              Bir sorun oluştu
            </h2>

            <p>
              {error}
            </p>

            <a
              href="/"
              className="primary-button"
            >
              Ana Sayfaya Dön
            </a>
          </div>
        </section>
      </main>
    );
  }

  if (!customer) {
    return null;
  }

  const points =
    customer.points;

  const currentLevel =
    points >= 2000
      ? "Altın"
      : points >= 1000
        ? "Gümüş"
        : "Bronz";

  const nextLevel =
    points < 1000
      ? 1000
      : points < 2000
        ? 2000
        : 2000;

  const previousLevel =
    points < 1000
      ? 0
      : 1000;

  const progress =
    points >= 2000
      ? 100
      : Math.min(
          ((points -
            previousLevel) /
            (nextLevel -
              previousLevel)) *
            100,
          100
        );

  const remaining =
    points >= 2000
      ? 0
      : nextLevel - points;

  const availableRewards =
    rewards.filter(
      (reward) =>
        points >= reward.points
    ).length;

  return (
    <main className="site">
      <header className="header">
        <a
          href="/"
          className="brand"
        >
          <div className="logo">
            <img
              src={logoUrl}
              alt="Taşkent Cafe"
            />
          </div>

          <div>
            <h1>
              Taşkent Cafe
            </h1>

            <span>
              Sadakat Kulübü
            </span>
          </div>
        </a>

        <a
          href="/"
          className="back-button"
          aria-label="Ana sayfa"
        >
          ←
        </a>
      </header>

      <section className="loyalty-page">
        <div className="welcome">
          <div>
            <span className="eyebrow">
              SADAKAT KULÜBÜ
            </span>

            <h2>
              Hoş geldin,{" "}
              {customer.name ||
                "Misafir"}!
            </h2>

            <p>
              Taşkent Cafe
              ayrıcalıkların
              burada.
            </p>
          </div>

          <div className="welcome-avatar">
            {(
              customer.name ||
              "M"
            )
              .charAt(0)
              .toUpperCase()}
          </div>
        </div>

        <div className="loyalty-card">
          <div className="card-glow" />

          <div className="card-top">
            <div className="card-brand">
              <img
                src={logoUrl}
                alt="Taşkent Cafe"
              />

              <div>
                <strong>
                  TAŞKENT CAFE
                </strong>

                <span>
                  SADAKAT KARTI
                </span>
              </div>
            </div>

            <div className="member-badge">
              ÜYE
            </div>
          </div>

          <div className="card-middle">
            <span>
              MEVCUT PUAN
            </span>

            <strong>
              {points.toLocaleString(
                "tr-TR"
              )}
            </strong>

            <small>
              puan
            </small>
          </div>

          <div className="card-bottom">
            <div>
              <span>
                SEVİYE
              </span>

              <strong>
                {currentLevel}
              </strong>
            </div>

            <div className="card-number">
              #{customer.id.slice(
                0,
                8
              ).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-icon">
              ⭐
            </div>

            <div>
              <strong>
                {points}
              </strong>

              <span>
                Toplam Puan
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              🎁
            </div>

            <div>
              <strong>
                {availableRewards}
              </strong>

              <span>
                Hazır Ödül
              </span>
            </div>
          </div>
        </div>

        <section className="level-card">
          <div className="level-header">
            <div>
              <span className="eyebrow">
                SEVİYE İLERLEMESİ
              </span>

              <h3>
                {currentLevel} Üye
              </h3>
            </div>

            <div className="level-star">
              ⭐
            </div>
          </div>

          <div className="level-progress-text">
            <span>
              {points.toLocaleString(
                "tr-TR"
              )}{" "}
              puan
            </span>

            <span>
              {remaining > 0
                ? `${remaining.toLocaleString(
                    "tr-TR"
                  )} puan kaldı`
                : "Maksimum seviyedesin"}
            </span>
          </div>

          <div className="progress">
            <div
              className="progress-value"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="level-points">
            <span>
              Bronz
              <small>
                0
              </small>
            </span>

            <span>
              Gümüş
              <small>
                1.000
              </small>
            </span>

            <span>
              Altın
              <small>
                2.000
              </small>
            </span>
          </div>
        </section>

        {message && (
          <div className="success-message">
            <div>✓</div>

            <span>
              {message}
            </span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <div>!</div>

            <span>
              {error}
            </span>
          </div>
        )}

        <section className="loyalty-section">
          <div className="section-title">
            <div>
              <span className="eyebrow">
                ÖDÜLLER
              </span>

              <h2>
                Puanlarını kullan
              </h2>

              <p>
                Biriktirdiğin
                puanlarla
                lezzetli
                ödüllerin
                sahibi ol.
              </p>
            </div>
          </div>

          <div className="rewards">
            {rewards.map(
              (reward) => {
                const canRedeem =
                  points >=
                  reward.points;

                const isRedeeming =
                  redeeming ===
                  reward.id;

                return (
                  <article
                    className={
                      canRedeem
                        ? "reward-card available"
                        : "reward-card"
                    }
                    key={
                      reward.id
                    }
                  >
                    <div className="reward-icon">
                      {reward.icon}
                    </div>

                    <div className="reward-content">
                      <div className="reward-title">
                        <h3>
                          {
                            reward.name
                          }
                        </h3>

                        {canRedeem && (
                          <span>
                            Hazır
                          </span>
                        )}
                      </div>

                      <p>
                        {
                          reward.description
                        }
                      </p>

                      <div className="reward-bottom">
                        <strong>
                          {reward.points.toLocaleString(
                            "tr-TR"
                          )}{" "}
                          puan
                        </strong>

                        <button
                          type="button"
                          onClick={() =>
                            redeemReward(
                              reward.id,
                              reward.name,
                              reward.points
                            )
                          }
                          disabled={
                            !canRedeem ||
                            isRedeeming
                          }
                        >
                          {isRedeeming
                            ? "Kullanılıyor..."
                            : canRedeem
                              ? "Ödülü Kullan"
                              : `${(
                                  reward.points -
                                  points
                                ).toLocaleString(
                                  "tr-TR"
                                )} puan eksik`}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </section>

        <section className="history">
          <div className="section-title">
            <div>
              <span className="eyebrow">
                HESAP HAREKETLERİ
              </span>

              <h2>
                Puan geçmişi
              </h2>
            </div>
          </div>

          <div className="history-card">
            {transactions.length ===
            0 ? (
              <div className="empty-history">
                <div>
                  ✨
                </div>

                <strong>
                  Henüz hareket yok
                </strong>

                <p>
                  İlk puan
                  hareketiniz
                  burada
                  görünecek.
                </p>
              </div>
            ) : (
              transactions.map(
                (transaction) => {
                  const positive =
                    transaction.points >
                    0;

                  return (
                    <div
                      className="history-row"
                      key={
                        transaction.id
                      }
                    >
                      <div
                        className={
                          positive
                            ? "history-icon positive"
                            : "history-icon negative"
                        }
                      >
                        {positive
                          ? "+"
                          : "−"}
                      </div>

                      <div className="history-info">
                        <strong>
                          {
                            transaction.description
                          }
                        </strong>

                        <small>
                          {new Date(
                            transaction.created_at
                          ).toLocaleDateString(
                            "tr-TR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </small>
                      </div>

                      <b
                        className={
                          positive
                            ? "points-positive"
                            : "points-negative"
                        }
                      >
                        {positive
                          ? "+"
                          : ""}
                        {
                          transaction.points
                        }
                      </b>
                    </div>
                  );
                }
              )
            )}
          </div>
        </section>

        <section className="loyalty-tip">
          <div className="tip-icon">
            💡
          </div>

          <div>
            <strong>
              Puanlarını
              biriktirmeye
              devam et
            </strong>

            <p>
              Her alışveriş
              seni bir sonraki
              ödüle biraz daha
              yaklaştırır.
            </p>
          </div>
        </section>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          <img
            src={logoUrl}
            alt="Taşkent Cafe"
          />

          <span>
            Taşkent Cafe
          </span>
        </div>

        <p>
          Kahve, lezzet ve güzel
          sohbet.
        </p>

        <div className="footer-links">
          <a href="/">
            Ana Sayfa
          </a>

          <a href="/loyalty">
            Sadakat
          </a>

          <a href="/#location">
            Konum
          </a>
        </div>

        <small>
          © 2026 Taşkent Cafe
        </small>
      </footer>

      <nav className="bottom-nav">
        <a
          href="/"
          className="nav-item"
        >
          <span>⌂</span>
          Ana Sayfa
        </a>

        <a
          href="/#menu"
          className="nav-item"
        >
          <span>☕</span>
          Menü
        </a>

        <a
          href="/loyalty"
          className="nav-item active"
        >
          <span>⭐</span>
          Sadakat
        </a>

        <a
          href="/#location"
          className="nav-item"
        >
          <span>📍</span>
          Konum
        </a>
      </nav>

      <style jsx global>{`
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .logo {
          width: 52px;
          height: 52px;
          min-width: 52px;
          overflow: hidden;
          border-radius: 50%;
          background: #fff;
          border: 2px solid
            rgba(91, 57, 35, 0.12);
          box-shadow:
            0 4px 14px
              rgba(45, 28, 18, 0.12);
        }

        .logo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          border-radius: 50%;
        }

        .back-button {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          background: #f5eee8;
          color: #5b3924;
          font-size: 22px;
          transition: 0.2s ease;
        }

        .back-button:hover {
          transform: translateX(-2px);
        }

        .loyalty-page {
          max-width: 620px;
          margin: 0 auto;
          padding: 28px 18px 120px;
        }

        .welcome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }

        .welcome h2 {
          margin: 5px 0;
          font-size: 28px;
          line-height: 1.1;
          color: #3f2a1d;
        }

        .welcome p {
          margin: 0;
          color: #85766c;
          font-size: 13px;
        }

        .eyebrow {
          color: #9a6b48;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .welcome-avatar {
          width: 54px;
          height: 54px;
          min-width: 54px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eee2d7;
          color: #6b432b;
          font-size: 22px;
          font-weight: 800;
          border: 3px solid #fff;
          box-shadow:
            0 5px 18px
              rgba(61, 37, 22, 0.12);
        }

        .loyalty-card {
          position: relative;
          min-height: 245px;
          overflow: hidden;
          border-radius: 26px;
          padding: 24px;
          color: #fff;
          background:
            linear-gradient(
              135deg,
              #6e472f 0%,
              #4a2d1d 55%,
              #2f1b12 100%
            );
          box-shadow:
            0 18px 38px
              rgba(67, 39, 22, 0.28);
        }

        .card-glow {
          position: absolute;
          width: 220px;
          height: 220px;
          right: -75px;
          top: -85px;
          border-radius: 50%;
          background:
            rgba(255, 255, 255, 0.09);
        }

        .card-glow::after {
          content: "";
          position: absolute;
          width: 150px;
          height: 150px;
          left: -190px;
          top: 135px;
          border-radius: 50%;
          background:
            rgba(255, 255, 255, 0.05);
        }

        .card-top {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .card-brand img {
          width: 46px;
          height: 46px;
          object-fit: cover;
          border-radius: 50%;
          background: #fff;
          border: 2px solid
            rgba(255, 255, 255, 0.8);
        }

        .card-brand strong,
        .card-brand span {
          display: block;
        }

        .card-brand strong {
          font-size: 13px;
          letter-spacing: 1.1px;
        }

        .card-brand span {
          margin-top: 3px;
          font-size: 8px;
          letter-spacing: 1.7px;
          opacity: 0.65;
        }

        .member-badge {
          padding: 6px 10px;
          border: 1px solid
            rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          font-size: 8px;
          letter-spacing: 1.4px;
          background:
            rgba(255, 255, 255, 0.08);
        }

        .card-middle {
          position: relative;
          margin-top: 38px;
        }

        .card-middle span {
          display: block;
          font-size: 9px;
          letter-spacing: 1.5px;
          opacity: 0.62;
        }

        .card-middle strong {
          display: inline-block;
          margin-top: 2px;
          font-size: 52px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -2px;
        }

        .card-middle small {
          margin-left: 8px;
          font-size: 12px;
          opacity: 0.65;
        }

        .card-bottom {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-top: 27px;
        }

        .card-bottom span,
        .card-bottom strong {
          display: block;
        }

        .card-bottom span {
          font-size: 8px;
          letter-spacing: 1.3px;
          opacity: 0.55;
        }

        .card-bottom strong {
          margin-top: 3px;
          font-size: 13px;
        }

        .card-number {
          font-size: 8px;
          letter-spacing: 1.4px;
          opacity: 0.45;
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin: 14px 0;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 15px;
          border-radius: 17px;
          background: #fff;
          border: 1px solid #eee5df;
          box-shadow:
            0 4px 15px
              rgba(56, 35, 22, 0.05);
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7eee7;
          font-size: 20px;
        }

        .stat-card strong,
        .stat-card span {
          display: block;
        }

        .stat-card strong {
          font-size: 17px;
          color: #4c3020;
        }

        .stat-card span {
          margin-top: 2px;
          font-size: 10px;
          color: #8a7a70;
        }

        .level-card {
          padding: 19px;
          border-radius: 19px;
          background: #fff;
          border: 1px solid #eee5df;
          box-shadow:
            0 4px 15px
              rgba(56, 35, 22, 0.05);
        }

        .level-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .level-header h3 {
          margin: 4px 0 0;
          color: #4b3021;
          font-size: 19px;
        }

        .level-star {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7eee7;
          font-size: 20px;
        }

        .level-progress-text {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 18px;
          margin-bottom: 8px;
          color: #78695f;
          font-size: 10px;
        }

        .progress {
          width: 100%;
          height: 8px;
          overflow: hidden;
          border-radius: 20px;
          background: #eee7e1;
        }

        .progress-value {
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #9b6a46,
              #d0a16e
            );
          transition: width 0.5s ease;
        }

        .level-points {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          color: #806f64;
          font-size: 9px;
        }

        .level-points span {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .level-points span:nth-child(2) {
          text-align: center;
        }

        .level-points span:last-child {
          text-align: right;
        }

        .level-points small {
          font-size: 8px;
          color: #a09288;
        }

        .success-message,
        .error-message {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 14px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 600;
        }

        .success-message {
          background: #edf8f0;
          color: #326744;
        }

        .error-message {
          background: #fff1ef;
          color: #9c3d32;
        }

        .success-message div,
        .error-message div {
          width: 27px;
          height: 27px;
          min-width: 27px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .success-message div {
          background: #4d9364;
          color: #fff;
        }

        .error-message div {
          background: #d76a5b;
          color: #fff;
        }

        .loyalty-section {
          margin-top: 30px;
        }

        .section-title h2 {
          margin: 4px 0;
          color: #3f2a1d;
          font-size: 24px;
        }

        .section-title p {
          margin: 0;
          color: #887970;
          font-size: 12px;
          line-height: 1.5;
        }

        .rewards {
          display: flex;
          flex-direction: column;
          gap: 11px;
          margin-top: 15px;
        }

        .reward-card {
          display: flex;
          gap: 13px;
          padding: 14px;
          border-radius: 18px;
          background: #fff;
          border: 1px solid #eee5df;
          box-shadow:
            0 4px 15px
              rgba(56, 35, 22, 0.045);
        }

        .reward-card.available {
          border-color: #ddc6b3;
          box-shadow:
            0 5px 18px
              rgba(100, 62, 37, 0.08);
        }

        .reward-icon {
          width: 54px;
          height: 54px;
          min-width: 54px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f0e9;
          font-size: 26px;
        }

        .reward-content {
          flex: 1;
          min-width: 0;
        }

        .reward-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .reward-title h3 {
          margin: 0;
          color: #493025;
          font-size: 14px;
        }

        .reward-title span {
          padding: 4px 7px;
          border-radius: 8px;
          background: #edf8f0;
          color: #397049;
          font-size: 8px;
          font-weight: 800;
        }

        .reward-content p {
          margin: 4px 0 11px;
          color: #887a71;
          font-size: 10px;
        }

        .reward-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .reward-bottom strong {
          color: #8c5d3d;
          font-size: 11px;
          white-space: nowrap;
        }

        .reward-bottom button {
          border: 0;
          border-radius: 10px;
          padding: 8px 10px;
          background: #654027;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .reward-bottom button:disabled {
          background: #e7dfda;
          color: #94877e;
          cursor: not-allowed;
        }

        .history {
          margin-top: 31px;
        }

        .history-card {
          margin-top: 15px;
          overflow: hidden;
          border-radius: 18px;
          background: #fff;
          border: 1px solid #eee5df;
        }

        .history-row {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 14px;
          border-bottom: 1px solid #f0eae5;
        }

        .history-row:last-child {
          border-bottom: 0;
        }

        .history-icon {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 800;
        }

        .history-icon.positive {
          background: #edf8f0;
          color: #4a8c5f;
        }

        .history-icon.negative {
          background: #fff0ed;
          color: #c35d4e;
        }

        .history-info {
          flex: 1;
          min-width: 0;
        }

        .history-info strong,
        .history-info small {
          display: block;
        }

        .history-info strong {
          overflow: hidden;
          color: #4d3529;
          font-size: 12px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-info small {
          margin-top: 3px;
          color: #9a8c83;
          font-size: 9px;
        }

        .points-positive,
        .points-negative {
          font-size: 12px;
        }

        .points-positive {
          color: #438052;
        }

        .points-negative {
          color: #bd594b;
        }

        .empty-history {
          padding: 32px 18px;
          text-align: center;
        }

        .empty-history > div {
          font-size: 30px;
        }

        .empty-history strong {
          display: block;
          margin-top: 7px;
          color: #4d3529;
          font-size: 13px;
        }

        .empty-history p {
          margin: 5px 0 0;
          color: #94867d;
          font-size: 10px;
        }

        .loyalty-tip {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 18px;
          padding: 15px;
          border-radius: 17px;
          background: #f8f1eb;
        }

        .tip-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #fff;
          font-size: 20px;
        }

        .loyalty-tip strong {
          display: block;
          color: #513526;
          font-size: 12px;
        }

        .loyalty-tip p {
          margin: 3px 0 0;
          color: #88796f;
          font-size: 10px;
          line-height: 1.4;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .footer-logo img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
        }

        .loading-card,
        .error-card {
          margin-top: 70px;
          padding: 35px 20px;
          border-radius: 22px;
          background: #fff;
          text-align: center;
          border: 1px solid #eee5df;
          box-shadow:
            0 8px 25px
              rgba(56, 35, 22, 0.07);
        }

        .loading-logo {
          width: 70px;
          height: 70px;
          margin: 0 auto 16px;
          overflow: hidden;
          border-radius: 50%;
        }

        .loading-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .loading-card strong {
          display: block;
          color: #4c3020;
          font-size: 15px;
        }

        .loading-card span {
          display: block;
          margin-top: 5px;
          color: #95867c;
          font-size: 11px;
        }

        .error-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 12px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff0ed;
          color: #b95043;
          font-size: 22px;
          font-weight: 800;
        }

        .error-card h2 {
          margin: 0;
          color: #4c3020;
          font-size: 19px;
        }

        .error-card p {
          margin: 8px 0 20px;
          color: #887970;
          font-size: 12px;
          line-height: 1.5;
        }

        .primary-button {
          display: inline-flex;
          padding: 11px 17px;
          border-radius: 11px;
          background: #654027;
          color: #fff;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
        }

        @media (max-width: 480px) {
          .loyalty-page {
            padding-left: 14px;
            padding-right: 14px;
          }

          .welcome h2 {
            font-size: 24px;
          }

          .loyalty-card {
            min-height: 225px;
            padding: 20px;
          }

          .card-middle {
            margin-top: 30px;
          }

          .card-middle strong {
            font-size: 45px;
          }

          .reward-card {
            padding: 12px;
          }

          .reward-icon {
            width: 48px;
            height: 48px;
            min-width: 48px;
          }

          .reward-bottom {
            align-items: flex-end;
          }

          .reward-bottom button {
            padding: 8px;
          }
        }
      `}</style>
    </main>
  );
}