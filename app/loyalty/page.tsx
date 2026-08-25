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
  created_at: string;
  updated_at: string;
  auth_user_id: string | null;
};

type LoyaltyTransaction = {
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
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState<
    LoyaltyTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadLoyalty();
  }, []);

  const loadLoyalty = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      let {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(
          `Oturum kontrolü başarısız: ${sessionError.message}`
        );
      }

      if (!session) {
        const {
          data: anonymousData,
          error: anonymousError,
        } = await supabase.auth.signInAnonymously();

        if (anonymousError) {
          throw new Error(
            `Anonim giriş başarısız: ${anonymousError.message}`
          );
        }

        session = anonymousData.session;

        if (!session) {
          throw new Error(
            "Anonim giriş yapıldı ancak oturum oluşturulamadı."
          );
        }
      }

      const userId = session.user.id;

      let {
        data: existingCustomer,
        error: customerError,
      } = await supabase
        .from("customers")
        .select(
          "id, name, phone, email, points, level, created_at, updated_at, auth_user_id"
        )
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (customerError) {
        throw new Error(
          `Müşteri bilgisi alınamadı: ${customerError.message}`
        );
      }

      if (!existingCustomer) {
        const {
          data: newCustomer,
          error: insertError,
        } = await supabase
          .from("customers")
          .insert({
            name: "Misafir",
            auth_user_id: userId,
            points: 0,
            level: "Bronz",
          })
          .select(
            "id, name, phone, email, points, level, created_at, updated_at, auth_user_id"
          )
          .single();

        if (insertError) {
          throw new Error(
            `Müşteri kaydı oluşturulamadı: ${insertError.message}`
          );
        }

        existingCustomer = newCustomer;
      }

      if (!existingCustomer) {
        throw new Error(
          "Müşteri kaydı oluşturulamadı."
        );
      }

      setCustomer(existingCustomer as Customer);
      setPoints(existingCustomer.points ?? 0);

      const {
        data: existingTransactions,
        error: transactionsError,
      } = await supabase
        .from("loyalty_transactions")
        .select(
          "id, points, type, description, created_at"
        )
        .eq("customer_id", existingCustomer.id)
        .order("created_at", {
          ascending: false,
        });

      if (transactionsError) {
        throw new Error(
          `Puan geçmişi alınamadı: ${transactionsError.message}`
        );
      }

      const loadedTransactions =
        (existingTransactions ?? []) as LoyaltyTransaction[];

      setTransactions(loadedTransactions);

      const hasWelcomeTransaction =
        loadedTransactions.some(
          (transaction) =>
            transaction.type === "welcome"
        );

      if (!hasWelcomeTransaction) {
        const welcomePoints = 500;

        const {
          error: welcomeInsertError,
        } = await supabase
          .from("loyalty_transactions")
          .insert({
            customer_id: existingCustomer.id,
            points: welcomePoints,
            type: "welcome",
            description: "Hoş geldin puanı",
          });

        if (welcomeInsertError) {
          throw new Error(
            `Hoş geldin puanı eklenemedi: ${welcomeInsertError.message}`
          );
        }

        const newTotal =
          (existingCustomer.points ?? 0) +
          welcomePoints;

        const {
          data: updatedCustomer,
          error: updateError,
        } = await supabase
          .from("customers")
          .update({
            points: newTotal,
            level:
              newTotal >= 2000
                ? "Altın"
                : newTotal >= 1000
                  ? "Gümüş"
                  : "Bronz",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCustomer.id)
          .select(
            "id, name, phone, email, points, level, created_at, updated_at, auth_user_id"
          )
          .single();

        if (updateError) {
          throw new Error(
            `Puan güncellenemedi: ${updateError.message}`
          );
        }

        setCustomer(updatedCustomer as Customer);
        setPoints(newTotal);

        setTransactions([
          {
            id: crypto.randomUUID(),
            points: welcomePoints,
            type: "welcome",
            description: "Hoş geldin puanı",
            created_at: new Date().toISOString(),
          },
          ...loadedTransactions,
        ]);
      }
    } catch (err) {
      console.error("LOYALTY ERROR:", err);

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Bilinmeyen bir hata oluştu.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (
    rewardName: string,
    rewardPoints: number
  ) => {
    if (!customer) {
      setMessage(
        "Sadakat hesabınız henüz hazır değil."
      );
      return;
    }

    if (points < rewardPoints) {
      setMessage(
        `${rewardName} için ${
          rewardPoints - points
        } puan daha gerekiyor.`
      );
      return;
    }

    try {
      setMessage("");

      const newPoints =
        points - rewardPoints;

      const {
        error: transactionError,
      } = await supabase
        .from("loyalty_transactions")
        .insert({
          customer_id: customer.id,
          points: -rewardPoints,
          type: "reward",
          description: rewardName,
        });

      if (transactionError) {
        throw new Error(
          `Ödül işlemi kaydedilemedi: ${transactionError.message}`
        );
      }

      const {
        data: updatedCustomer,
        error: updateError,
      } = await supabase
        .from("customers")
        .update({
          points: newPoints,
          level:
            newPoints >= 2000
              ? "Altın"
              : newPoints >= 1000
                ? "Gümüş"
                : "Bronz",
          updated_at: new Date().toISOString(),
        })
        .eq("id", customer.id)
        .select(
          "id, name, phone, email, points, level, created_at, updated_at, auth_user_id"
        )
        .single();

      if (updateError) {
        throw new Error(
          `Puan güncellenemedi: ${updateError.message}`
        );
      }

      setCustomer(updatedCustomer as Customer);
      setPoints(newPoints);

      setTransactions((current) => [
        {
          id: crypto.randomUUID(),
          points: -rewardPoints,
          type: "reward",
          description: rewardName,
          created_at: new Date().toISOString(),
        },
        ...current,
      ]);

      setMessage(
        `${rewardName} ödülü başarıyla kullanıldı.`
      );
    } catch (err) {
      console.error("REWARD ERROR:", err);

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ödül kullanılırken bir hata oluştu.";

      setMessage(errorMessage);
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(
      "tr-TR",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(new Date(date));
  };

  const formatShortDate = (date: string) => {
    const today = new Date();

    const transactionDate =
      new Date(date);

    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const transactionStart = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      transactionDate.getDate()
    );

    const difference =
      todayStart.getTime() -
      transactionStart.getTime();

    if (difference === 0) {
      return "Bugün";
    }

    if (difference === 86400000) {
      return "Dün";
    }

    return formatDate(date);
  };

  const level =
    points >= 2000
      ? "Altın"
      : points >= 1000
        ? "Gümüş"
        : "Bronz";

  const nextLevel =
    points >= 2000
      ? 2000
      : points >= 1000
        ? 2000
        : 1000;

  const previousLevel =
    points >= 2000
      ? 1000
      : points >= 1000
        ? 1000
        : 0;

  const progress =
    nextLevel === previousLevel
      ? 100
      : Math.min(
          ((points - previousLevel) /
            (nextLevel - previousLevel)) *
            100,
          100
        );

  const remaining =
    Math.max(
      nextLevel - points,
      0
    );

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
              Sadakat Kulübü
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

      <section className="loyalty-page">

        {error && (
          <div className="loyalty-message">
            <strong>
              Sadakat hesabı oluşturulamadı
            </strong>

            <p>
              {error}
            </p>
          </div>
        )}

        <div className="loyalty-profile">

          <div className="profile-avatar">
            C
          </div>

          <div>

            <span className="eyebrow">
              HOŞ GELDİN
            </span>

            <h2>
              {customer?.name || "Misafir"} 👋
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
              ⭐ {level}
            </div>

          </div>

          <div className="progress-area">

            <div className="progress-label">

              <span>
                {level}
              </span>

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

              <span>
                {previousLevel}
              </span>

              <span>
                {nextLevel}
              </span>

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

              <h2>
                Puanlarını kullan
              </h2>

            </div>

          </div>

          <div className="rewards">

            {rewards.map((reward) => (
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
                    {reward.description}
                  </p>

                  <div className="reward-bottom">

                    <strong>
                      {reward.points} puan
                    </strong>

                    <button
                      onClick={() =>
                        redeemReward(
                          reward.name,
                          reward.points
                        )
                      }
                      disabled={
                        !customer ||
                        points <
                          reward.points
                      }
                    >
                      Kullan
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

              <h2>
                Puan geçmişi
              </h2>

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
                    Puan kazandıkça burada görünecek.
                  </small>
                </div>

              </div>

            ) : (

              transactions.map(
                (transaction) => (
                  <div
                    className="history-row"
                    key={transaction.id}
                  >

                    <div className="history-icon">
                      {transaction.type ===
                      "reward"
                        ? "🎁"
                        : "⭐"}
                    </div>

                    <div>

                      <strong>
                        {transaction.description}
                      </strong>

                      <small>
                        {formatShortDate(
                          transaction.created_at
                        )}
                      </small>

                    </div>

                    <b>
                      {transaction.points > 0
                        ? `+${transaction.points}`
                        : transaction.points}
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
          <span>⌂</span>
          Ana Sayfa
        </a>

        <a
          href="/menu"
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

    </main>
  );
}