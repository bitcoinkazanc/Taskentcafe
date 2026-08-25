"use client";

import { useState } from "react";

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
  const [points, setPoints] = useState(680);
  const [message, setMessage] = useState("");

  const nextLevel = 1000;
  const progress = Math.min((points / nextLevel) * 100, 100);
  const remaining = Math.max(nextLevel - points, 0);

  const level =
    points >= 2000
      ? "Altın"
      : points >= 1000
        ? "Gümüş"
        : "Bronz";

  const redeemReward = (rewardName: string, rewardPoints: number) => {
    if (points < rewardPoints) {
      setMessage(
        `${rewardName} için ${rewardPoints - points} puan daha gerekiyor.`
      );
      return;
    }

    setPoints((current) => current - rewardPoints);
    setMessage(`${rewardName} ödülü başarıyla kullanıldı.`);
  };

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

        <a href="/" className="icon-button" aria-label="Ana sayfa">
          ←
        </a>
      </header>

      <section className="loyalty-page">

        <div className="loyalty-profile">
          <div className="profile-avatar">
            C
          </div>

          <div>
            <span className="eyebrow">
              HOŞ GELDİN
            </span>

            <h2>Cenk 👋</h2>

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
              <span>Bronz</span>
              <span>
                {remaining > 0
                  ? `${remaining} puan kaldı`
                  : "Yeni seviyeye ulaştın!"}
              </span>
            </div>

            <div className="progress">
              <div
                className="progress-value"
                style={{ width: `${progress}%` }}
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
                  {reward.icon}
                </div>

                <div className="reward-content">

                  <h3>{reward.name}</h3>

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

              <h2>Puan geçmişi</h2>
            </div>
          </div>

          <div className="history-card">

            <div className="history-row">
              <div className="history-icon">
                ☕
              </div>

              <div>
                <strong>Kahve alışverişi</strong>
                <small>Bugün</small>
              </div>

              <b>+80</b>
            </div>

            <div className="history-row">
              <div className="history-icon">
                🍰
              </div>

              <div>
                <strong>Tatlı alışverişi</strong>
                <small>Dün</small>
              </div>

              <b>+120</b>
            </div>

            <div className="history-row">
              <div className="history-icon">
                ⭐
              </div>

              <div>
                <strong>Hoş geldin puanı</strong>
                <small>25 Ağustos 2026</small>
              </div>

              <b>+500</b>
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

        <a href="/loyalty" className="nav-item active">
          <span>⭐</span>
          Sadakat
        </a>

        <a href="/#location" className="nav-item">
          <span>📍</span>
          Konum
        </a>

      </nav>

    </main>
  );
}