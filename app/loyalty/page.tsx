"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Reward = {
  id: string;
  name: string;
  description: string | null;
  points: number;
  icon: string | null;
};

type Customer = {
  id: string;
  points: number;
  level: string;
};

type Transaction = {
  id: string;
  points: number;
  type: "earn" | "redeem" | "adjustment";
  description: string | null;
  created_at: string;
};

function getLevel(points: number) {
  if (points >= 2000) return "Altın";
  if (points >= 1000) return "Gümüş";
  return "Bronz";
}

function getNextLevel(points: number) {
  if (points < 1000) return 1000;
  if (points < 2000) return 2000;
  return 2000;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function LoyaltyPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    loadLoyalty();
  }, []);

  async function loadLoyalty() {
    try {
      setLoading(true);
      setMessage("");

      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const { data, error } =
          await supabase.auth.signInAnonymously();

        if (error) {
          throw error;
        }

        session = data.session;
      }

      if (!session?.user) {
        throw new Error("Anonim kullanıcı oluşturulamadı.");
      }

      const userId = session.user.id;

      let { data: existingCustomer, error: customerError } =
        await supabase
          .from("customers")
          .select("id, points, level")
          .eq("auth_user_id", userId)
          .maybeSingle();

      if (customerError) {
        throw customerError;
      }

      if (!existingCustomer) {
        const { data: newCustomer, error: createError } =
          await supabase
            .from("customers")
            .insert({
              auth_user_id: userId,
              points: 0,
              level: "Bronz",
            })
            .select("id, points, level")
            .single();

        if (createError) {
          throw createError;
        }

        existingCustomer = newCustomer;
      }

      setCustomer(existingCustomer);

      const { data: rewardData, error: rewardError } =
        await supabase
          .from("rewards")
          .select("id, name, description, points, icon")
          .eq("active", true)
          .order("points", { ascending: true });

      if (rewardError) {
        throw rewardError;
      }

      setRewards(rewardData || []);

      const { data: transactionData, error: transactionError } =
        await supabase
          .from("point_transactions")
          .select(
            "id, points, type, description, created_at"
          )
          .eq("customer_id", existingCustomer.id)
          .order("created_at", { ascending: false })
          .limit(20);

      if (transactionError) {
        throw transactionError;
      }

      setTransactions(transactionData || []);
    } catch (error) {
      console.error(error);

      setMessage(
        "Sadakat bilgileri yüklenirken bir sorun oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  async function redeemReward(reward: Reward) {
    if (!customer) return;

    if (customer.points < reward.points) {
      setMessage(
        `${reward.name} için ${
          reward.points - customer.points
        } puan daha gerekiyor.`
      );
      return;
    }

    try {
      setRedeeming(reward.id);
      setMessage("");

      const { data, error } = await supabase.rpc(
        "redeem_reward",
        {
          p_reward_id: reward.id,
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error("Ödül kullanılamadı.");
      }

      setMessage(
        `${reward.name} ödülü başarıyla kullanıldı.`
      );

      await loadLoyalty();
    } catch (error) {
      console.error(error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ödül kullanılamadı.";

      setMessage(errorMessage);
    } finally {
      setRedeeming(null);
    }
  }

  if (loading) {
    return (
      <main className="site">
        <header className="header">
          <a href="/" className="brand">
            <div className="logo">☕</div>

            <div>
              <h1>Taşkent Cafe</h1>
              <span>Sadakat Kulübü</span>
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

        <section className="loyalty-page">
          <div className="loyalty-message">
            Sadakat kartınız hazırlanıyor...
          </div>
        </section>
      </main>
    );
  }

  const points = customer?.points || 0;
  const level = getLevel(points);
  const nextLevel = getNextLevel(points);

  const progress =
    nextLevel > 0
      ? Math.min((points / nextLevel) * 100, 100)
      : 100;

  const remaining = Math.max(nextLevel - points, 0);

  return (
    <main className="site">
      <header className="header">
        <a href="/" className="brand">
          <div className="logo">☕</div>

          <div>
            <h1>Taşkent Cafe</h1>
            <span>Sadakat Kulübü</span>
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

      <section className="loyalty-page">
        <div className="loyalty-profile">
          <div className="profile-avatar">
            ⭐
          </div>

          <div>
            <span className="eyebrow">
              HOŞ GELDİN
            </span>

            <h2>Sadakat Kartın 👋</h2>

            <p>
              Anonim Sadakat Kulübü üyesi
            </p>
          </div>
        </div>

        <div className="points-card">
          <div className="points-top">
            <div>
              <span>TOPLAM PUAN</span>
              <strong>{points}</strong>
            </div>

            <div className="level">
              ⭐ {level}
            </div>
          </div>

          <div className="progress-area">
            <div className="progress-label">
              <span>{level}</span>

              <span>
                {remaining > 0
                  ? `${remaining} puan kaldı`
                  : "Yeni seviyeye ulaştın!"}
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
              <span>0</span>
              <span>1.000</span>
              <span>2.000</span>
            </div>
          </div>
        </div>

        {message && (
          <div className="loyalty-message">
            {message}
          </div>
        )}

        <section className="loyalty-section">
          <div className="loyalty-heading">
            <div>
              <span className="eyebrow">
                ÖDÜLLER
              </span>

              <h2>Puanlarını kullan</h2>
            </div>
          </div>

          <div className="rewards">
            {rewards.map((reward) => (
              <article
                className="reward-card"
                key={reward.id}
              >
                <div className="reward-icon">
                  {reward.icon || "🎁"}
                </div>

                <div className="reward-content">
                  <h3>{reward.name}</h3>

                  <p>
                    {reward.description ||
                      "Sadakat ödülü"}
                  </p>

                  <div className="reward-bottom">
                    <strong>
                      {reward.points} puan
                    </strong>

                    <button
                      onClick={() =>
                        redeemReward(reward)
                      }
                      disabled={
                        redeeming === reward.id ||
                        points < reward.points
                      }
                    >
                      {redeeming === reward.id
                        ? "..."
                        : points >= reward.points
                          ? "Kullan"
                          : "Yetersiz"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="history">
          <div className="loyalty-heading">
            <div>
              <span className="eyebrow">
                HAREKETLER
              </span>

              <h2>Puan geçmişi</h2>
            </div>
          </div>

          <div className="history-card">
            {transactions.length === 0 ? (
              <div className="history-row">
                <div className="history-icon">
                  ⭐
                </div>

                <div>
                  <strong>
                    Henüz puan hareketi yok
                  </strong>

                  <small>
                    İlk puanını kazandığında burada
                    görünecek.
                  </small>
                </div>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  className="history-row"
                  key={transaction.id}
                >
                  <div className="history-icon">
                    {transaction.type === "redeem"
                      ? "🎁"
                      : transaction.type === "earn"
                        ? "☕"
                        : "⭐"}
                  </div>

                  <div>
                    <strong>
                      {transaction.description ||
                        "Puan hareketi"}
                    </strong>

                    <small>
                      {formatDate(
                        transaction.created_at
                      )}
                    </small>
                  </div>

                  <b
                    style={{
                      color:
                        transaction.points >= 0
                          ? "#4f8a55"
                          : "#b45145",
                    }}
                  >
                    {transaction.points > 0
                      ? `+${transaction.points}`
                      : transaction.points}
                  </b>
                </div>
              ))
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
              Her alışverişinde puan biriktir,
              özel ödüllerin kilidini aç.
            </p>
          </div>
        </section>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          ☕ Taşkent Cafe
        </div>

        <p>
          Kahve, lezzet ve güzel sohbet.
        </p>

        <div className="footer-links">
          <a href="/">Ana Sayfa</a>
          <a href="/menu">Menü</a>
          <a href="/loyalty">Sadakat</a>
        </div>

        <small>
          © 2026 Taşkent Cafe
        </small>
      </footer>

      <nav className="bottom-nav">
        <a href="/" className="nav-item">
          <span>⌂</span>
          Ana Sayfa
        </a>

        <a href="/menu" className="nav-item">
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
    </main>
  );
}