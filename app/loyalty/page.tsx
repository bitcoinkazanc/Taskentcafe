"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

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

type Customer = {
  id: string;
  name: string | null;
  auth_user_id: string | null;
  points: number;
  level: string;
  created_at: string;
  updated_at: string;
};

export default function LoyaltyPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [points, setPoints] = useState(0);
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

      const {
        data: existingCustomer,
        error: customerSelectError,
      } = await supabase
        .from("customers")
        .select(
          "id, name, auth_user_id, points, level, created_at, updated_at"
        )
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (customerSelectError) {
        throw new Error(
          `Müşteri bilgisi alınamadı: ${customerSelectError.message}`
        );
      }

      if (existingCustomer) {
        setCustomer(existingCustomer as Customer);
        setPoints(existingCustomer.points ?? 0);
        return;
      }

      const {
        data: newCustomer,
        error: customerInsertError,
      } = await supabase
        .from("customers")
        .insert({
          name: "Misafir",
          auth_user_id: userId,
          points: 0,
          level: "Bronz",
        })
        .select(
          "id, name, auth_user_id, points, level, created_at, updated_at"
        )
        .single();

      if (customerInsertError) {
        throw new Error(
          `Müşteri kaydı oluşturulamadı: ${customerInsertError.message}`
        );
      }

      if (!newCustomer) {
        throw new Error(
          "Müşteri kaydı oluşturuldu ancak bilgiler alınamadı."
        );
      }

      setCustomer(newCustomer as Customer);
      setPoints(newCustomer.points ?? 0);
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

  const nextLevel = 1000;

  const progress = Math.min(
    (points / nextLevel) * 100,
    100
  );

  const remaining = Math.max(
    nextLevel - points,
    0
  );

  const level =
    points >= 2000
      ? "Altın"
      : points >= 1000
        ? "Gümüş"
        : "Bronz";

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

    const newPoints = points - rewardPoints;

    const {
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
      .eq("id", customer.id);

    if (updateError) {
      setMessage(
        `Ödül kullanılamadı: ${updateError.message}`
      );
      return;
    }

    setPoints(newPoints);

    setCustomer({
      ...customer,
      points: newPoints,
      level:
        newPoints >= 2000
          ? "Altın"
          : newPoints >= 1000
            ? "Gümüş"
            : "Bronz",
    });

    setMessage(
      `${rewardName} ödülü başarıyla kullanıldı.`
    );
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

  return (
    <main className="site">

      <header className="header">

        <a href="/" className="brand">
          <div className="logo">
            ☕
          </div>

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

        {error && (
          <div className="loyalty-message">
            <strong>
              Sadakat hesabı oluşturulamadı
            </strong>

            <p>{error}</p>
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
              <span>TOPLAM PUAN</span>
              <strong>{points}</strong>
            </div>

            <div className="level">
              ⭐ {level}
            </div>

          </div>

          <div className="progress-area">

            <div className="progress-label">

              <span>
                Bronz
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
                      disabled={!customer}
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

            <div className="history-row">

              <div className="history-icon">
                ☕
              </div>

              <div>
                <strong>
                  Kahve alışverişi
                </strong>

                <small>
                  Bugün
                </small>
              </div>

              <b>
                +80
              </b>

            </div>

            <div className="history-row">

              <div className="history-icon">
                🍰
              </div>

              <div>
                <strong>
                  Tatlı alışverişi
                </strong>

                <small>
                  Dün
                </small>
              </div>

              <b>
                +120
              </b>

            </div>

            <div className="history-row">

              <div className="history-icon">
                ⭐
              </div>

              <div>
                <strong>
                  Hoş geldin puanı
                </strong>

                <small>
                  25 Ağustos 2026
                </small>
              </div>

              <b>
                +500
              </b>

            </div>

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