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
      setRedeeming(
        rewardPoints
      );

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
        <section className="loyalty-page">
          <div className="loyalty-message">
            Sadakat bilgileri yükleniyor...
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
                src="/taskent-logo.png"
                alt="Taşkent Cafe"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "inherit",
                }}
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
            className="icon-button"
            aria-label="Ana sayfaya dön"
          >
            <span
              style={{
                fontSize: "24px",
                lineHeight: 1,
                transform: "translateX(-1px)",
              }}
            >
              ‹
            </span>
          </a>

        </header>

        <section className="loyalty-page">

          <div className="loyalty-message">
            {error}
          </div>

          <a
            href="/"
            className="hero-button"
          >
            Ana Sayfaya Dön
          </a>

        </section>

      </main>
    );
  }

  if (!customer) {
    return null;
  }

  const points =
    customer.points;

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

  const currentLevel =
    points >= 2000
      ? "Altın"
      : points >= 1000
        ? "Gümüş"
        : "Bronz";

  return (
    <main className="site">

      <header className="header">

        <a
          href="/"
          className="brand"
        >
          <div className="logo">
            <img
              src="/taskent-logo.png"
              alt="Taşkent Cafe"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "inherit",
              }}
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
          className="icon-button"
          aria-label="Ana sayfaya dön"
        >
          <span
            style={{
              fontSize: "24px",
              lineHeight: 1,
              transform: "translateX(-1px)",
            }}
          >
            ‹
          </span>
        </a>

      </header>

      <section className="loyalty-page">

        <div className="loyalty-profile">

          <div className="profile-avatar">
            {(
              customer.name ||
              "M"
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>

            <span className="eyebrow">
              HOŞ GELDİN
            </span>

            <h2>
              {customer.name ||
                "Misafir"}{" "}
              👋
            </h2>

            <p>
              Sadakat Kulübü üyesi
            </p>

          </div>

        </div>

        <div className="points-card">

          <div className="points-top">

            <div>

              <span>
                TOPLAM PUAN
              </span>

              <strong>
                {points}
              </strong>

            </div>

            <div className="level">
              ⭐ {customer.level}
            </div>

          </div>

          <div className="progress-area">

            <div className="progress-label">

              <span>
                {currentLevel}
              </span>

              <span>
                {remaining > 0
                  ? `${remaining} puan kaldı`
                  : "En yüksek seviyedesin!"}
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

            <div className="progress-levels">

              <span>
                0
              </span>

              <span>
                1.000
              </span>

              <span>
                2.000
              </span>

            </div>

          </div>

        </div>

        {message && (
          <div className="loyalty-message">
            {message}
          </div>
        )}

        {error && (
          <div className="loyalty-message">
            {error}
          </div>
        )}

        <section className="loyalty-section">

          <div className="loyalty-heading">

            <div>

              <span className="eyebrow">
                ÖDÜLLER
              </span>

              <h2>
                Puanlarını kullan
              </h2>

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
                  reward.points;

                return (
                  <article
                    className="reward-card"
                    key={reward.id}
                  >

                    <div className="reward-icon">
                      {reward.icon}
                    </div>

                    <div className="reward-content">

                      <h3>
                        {reward.name}
                      </h3>

                      <p>
                        {
                          reward.description
                        }
                      </p>

                      <div className="reward-bottom">

                        <strong>
                          {
                            reward.points
                          }{" "}
                          puan
                        </strong>

                        <button
                          onClick={() =>
                            redeemReward(
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
                              ? "Kullan"
                              : "Yetersiz Puan"}
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

          <div className="loyalty-heading">

            <div>

              <span className="eyebrow">
                HAREKETLER
              </span>

              <h2>
                Puan geçmişi
              </h2>

            </div>

          </div>

          <div className="history-card">

            {transactions.length ===
            0 ? (

              <div className="history-row">

                <div>
                  Henüz puan hareketi yok.
                </div>

              </div>

            ) : (

              transactions.map(
                (transaction) => (
                  <div
                    className="history-row"
                    key={
                      transaction.id
                    }
                  >

                    <div className="history-icon">
                      {transaction.points <
                      0
                        ? "🎁"
                        : transaction.type ===
                            "welcome"
                          ? "⭐"
                          : "☕"}
                    </div>

                    <div>

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
                      style={{
                        color:
                          transaction.points <
                          0
                            ? "#b45b4f"
                            : "#4f8a55",
                      }}
                    >
                      {transaction.points >
                      0
                        ? "+"
                        : ""}
                      {
                        transaction.points
                      }
                    </b>

                  </div>
                )
              )

            )}

          </div>

        </section>

        <section className="loyalty-info">

          <div className="loyalty-info-icon">
            ⭐
          </div>

          <div>

            <strong>
              Daha fazla puan kazan
            </strong>

            <p>
              Her alışverişinde
              puan biriktir,
              özel ödüllerin
              kilidini aç.
            </p>

          </div>

        </section>

      </section>

      <footer className="footer">

        <div className="footer-logo">
          Taşkent Cafe
        </div>

        <p>
          Kahve, lezzet ve güzel sohbet.
        </p>

        <div className="footer-links">

          <a href="/">
            Ana Sayfa
          </a>

          <a href="/menu">
            Menü
          </a>

          <a href="/loyalty">
            Sadakat
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
          <span>
            ⌂
          </span>
          Ana Sayfa
        </a>

        <a
          href="/menu"
          className="nav-item"
        >
          <span>
            ☕
          </span>
          Menü
        </a>

        <a
          href="/loyalty"
          className="nav-item active"
        >
          <span>
            ⭐
          </span>
          Sadakat
        </a>

        <a
          href="/#location"
          className="nav-item"
        >
          <span>
            📍
          </span>
          Konum
        </a>

      </nav>

    </main>
  );
}