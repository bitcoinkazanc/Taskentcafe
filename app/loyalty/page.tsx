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
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

      const { data: customerData, error: customerError } =
        await supabase
          .from("customers")
          .select("id,name,phone,email,points,level")
          .eq("auth_user_id", user.id)
          .maybeSingle();

      if (customerError) {
        throw new Error(
          `Müşteri bilgisi alınamadı: ${customerError.message}`
        );
      }

      if (!customerData) {
        throw new Error("Sadakat hesabınız bulunamadı.");
      }

      setCustomer(customerData as Customer);

      const {
        data: transactionData,
        error: transactionError,
      } = await supabase
        .from("loyalty_transactions")
        .select("id,points,type,description,created_at")
        .eq("customer_id", customerData.id)
        .order("created_at", { ascending: false });

      if (transactionError) {
        throw new Error(
          `Puan geçmişi alınamadı: ${transactionError.message}`
        );
      }

      setTransactions((transactionData || []) as Transaction[]);
    } catch (err) {
      console.error("LOYALTY LOAD ERROR:", err);

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
      setError("Müşteri hesabı bulunamadı.");
      return;
    }

    if (customer.points < rewardPoints) {
      setError(
        `${rewardName} için ${
          rewardPoints - customer.points
        } puan daha gerekiyor.`
      );
      return;
    }

    try {
      setRedeeming(rewardPoints);
      setMessage("");
      setError("");

      const { data, error: rpcError } =
        await supabase.rpc("redeem_loyalty_reward", {
          target_customer_id: customer.id,
          reward_points: rewardPoints,
          reward_description: rewardName,
        });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      if (!data) {
        throw new Error(
          "Ödül kullanıldı ancak müşteri bilgisi alınamadı."
        );
      }

      setCustomer(data as Customer);

      setMessage(
        `${rewardName} başarıyla kullanıldı.`
      );

      await loadLoyalty();
    } catch (err) {
      console.error("REDEEM REWARD ERROR:", err);

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
      <main className="loyalty-site">
        <header className="loyalty-header">
          <a href="/" className="loyalty-brand">
            <div className="loyalty-logo">
              <img
                src={logoUrl}
                alt="Taşkent Cafe"
              />
            </div>

            <div>
              <strong>Taşkent Cafe</strong>
              <span>Sadakat Kulübü</span>
            </div>
          </a>
        </header>

        <section className="loyalty-loading">
          <div className="loyalty-spinner" />
          <strong>Sadakat bilgileri yükleniyor</strong>
          <span>Lütfen bekleyin...</span>
        </section>
      </main>
    );
  }

  if (error && !customer) {
    return (
      <main className="loyalty-site">
        <header className="loyalty-header">
          <a href="/" className="loyalty-brand">
            <div className="loyalty-logo">
              <img
                src={logoUrl}
                alt="Taşkent Cafe"
              />
            </div>

            <div>
              <strong>Taşkent Cafe</strong>
              <span>Sadakat Kulübü</span>
            </div>
          </a>

          <a href="/" className="loyalty-back">
            Ana Sayfa
          </a>
        </header>

        <section className="loyalty-error-page">
          <div className="error-icon">⭐</div>

          <h1>Sadakat hesabı bulunamadı</h1>

          <p>{error}</p>

          <a href="/" className="primary-button">
            Ana Sayfaya Dön
          </a>
        </section>
      </main>
    );
  }

  if (!customer) {
    return null;
  }

  const points = customer.points;

  const nextLevel =
    points < 1000
      ? 1000
      : points < 2000
        ? 2000
        : 2000;

  const previousLevel =
    points < 1000 ? 0 : 1000;

  const progress =
    points >= 2000
      ? 100
      : Math.min(
          ((points - previousLevel) /
            (nextLevel - previousLevel)) *
            100,
          100
        );

  const remaining =
    points >= 2000 ? 0 : nextLevel - points;

  const levelName =
    points >= 2000
      ? "Altın"
      : points >= 1000
        ? "Gümüş"
        : "Bronz";

  return (
    <main className="loyalty-site">

      <header className="loyalty-header">

        <a href="/" className="loyalty-brand">

          <div className="loyalty-logo">
            <img
              src={logoUrl}
              alt="Taşkent Cafe"
            />
          </div>

          <div>
            <strong>Taşkent Cafe</strong>
            <span>Sadakat Kulübü</span>
          </div>

        </a>

        <a
          href="/"
          className="loyalty-back"
        >
          Ana Sayfa
        </a>

      </header>


      <div className="loyalty-content">


        {/* PROFİL */}

        <section className="welcome-card">

          <div className="profile-avatar">
            {(customer.name || "M")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="welcome-text">

            <span className="loyalty-eyebrow">
              SADAKAT KULÜBÜ
            </span>

            <h1>
              Hoş geldin,{" "}
              {customer.name || "Misafir"} 👋
            </h1>

            <p>
              Sadakat Kulübü üyesisin.
              Puanlarını biriktir, özel
              ödüllerin tadını çıkar.
            </p>

          </div>

        </section>


        {/* PUAN KARTI */}

        <section className="points-card">

          <div className="points-card-top">

            <div>
              <span className="points-label">
                TOPLAM PUAN
              </span>

              <strong className="points-number">
                {points.toLocaleString("tr-TR")}
              </strong>

              <span className="points-caption">
                kullanılabilir puan
              </span>
            </div>

            <div className="level-badge">
              <span>⭐</span>
              <strong>
                {customer.level || levelName}
              </strong>
            </div>

          </div>


          <div className="progress-section">

            <div className="progress-top">

              <span>
                {levelName} Seviye
              </span>

              <strong>
                {remaining > 0
                  ? `${remaining.toLocaleString(
                      "tr-TR"
                    )} puan kaldı`
                  : "En yüksek seviyedesin!"}
              </strong>

            </div>

            <div className="progress-track">

              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

            <div className="progress-levels">
              <span>Bronz</span>
              <span>Gümüş</span>
              <span>Altın</span>
            </div>

          </div>

        </section>


        {/* MESAJLAR */}

        {message && (
          <div className="alert success-alert">
            <span>✓</span>
            <div>{message}</div>
          </div>
        )}

        {error && (
          <div className="alert error-alert">
            <span>!</span>
            <div>{error}</div>
          </div>
        )}


        {/* ÖDÜLLER */}

        <section className="loyalty-section">

          <div className="section-title">

            <div>
              <span className="loyalty-eyebrow">
                ÖDÜLLER
              </span>

              <h2>
                Puanlarını kullan
              </h2>

              <p>
                Biriktirdiğin puanlarla
                favori lezzetlerini kazan.
              </p>
            </div>

          </div>


          <div className="rewards-grid">

            {rewards.map((reward) => {

              const canRedeem =
                points >= reward.points;

              const isRedeeming =
                redeeming === reward.points;

              return (
                <article
                  className="reward-card"
                  key={reward.id}
                >

                  <div className="reward-icon">
                    {reward.icon}
                  </div>

                  <div className="reward-main">

                    <h3>
                      {reward.name}
                    </h3>

                    <p>
                      {reward.description}
                    </p>

                    <div className="reward-bottom">

                      <div className="reward-points">
                        <strong>
                          {reward.points.toLocaleString(
                            "tr-TR"
                          )}
                        </strong>
                        <span>puan</span>
                      </div>

                      <button
                        type="button"
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
                        className={
                          canRedeem
                            ? "reward-button"
                            : "reward-button disabled"
                        }
                      >
                        {isRedeeming
                          ? "Kullanılıyor..."
                          : canRedeem
                            ? "Ödülü Kullan"
                            : "Yetersiz Puan"}
                      </button>

                    </div>

                  </div>

                </article>
              );
            })}

          </div>

        </section>


        {/* PUAN GEÇMİŞİ */}

        <section className="loyalty-section">

          <div className="section-title">

            <div>
              <span className="loyalty-eyebrow">
                HAREKETLER
              </span>

              <h2>
                Puan geçmişi
              </h2>

              <p>
                Puan hesabındaki son hareketler.
              </p>
            </div>

          </div>


          <div className="history-card">

            {transactions.length === 0 ? (

              <div className="history-empty">
                <span>☕</span>
                <strong>
                  Henüz puan hareketi yok.
                </strong>
                <p>
                  İlk alışverişinden sonra
                  hareketlerin burada görünecek.
                </p>
              </div>

            ) : (

              transactions.map(
                (transaction) => {

                  const positive =
                    transaction.points > 0;

                  return (
                    <div
                      className="history-row"
                      key={transaction.id}
                    >

                      <div className="history-icon">
                        {transaction.points < 0
                          ? "🎁"
                          : transaction.type ===
                              "welcome"
                            ? "⭐"
                            : "☕"}
                      </div>

                      <div className="history-info">

                        <strong>
                          {transaction.description}
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
                        {positive ? "+" : ""}
                        {transaction.points}
                      </b>

                    </div>
                  );
                }
              )

            )}

          </div>

        </section>


        {/* BİLGİ KARTI */}

        <section className="loyalty-tip">

          <div className="tip-icon">
            ⭐
          </div>

          <div>
            <strong>
              Daha fazla puan kazan
            </strong>

            <p>
              Taşkent Cafe'deki
              alışverişlerinden puan
              biriktir ve özel ödüllerin
              kilidini aç.
            </p>
          </div>

        </section>


      </div>


      {/* FOOTER */}

      <footer className="loyalty-footer">

        <div className="footer-logo">
          <img
            src={logoUrl}
            alt="Taşkent Cafe"
          />
        </div>

        <strong>
          Taşkent Cafe
        </strong>

        <p>
          Kahve, lezzet ve güzel sohbet.
        </p>

        <small>
          © 2026 Taşkent Cafe
        </small>

      </footer>


      <style jsx global>{`

        .loyalty-site {
          width: 100%;
          max-width: 560px;
          min-height: 100vh;
          margin: 0 auto;
          padding-bottom: 90px;
          background: #fffaf5;
          color: #30261f;
          overflow-x: hidden;
        }

        .loyalty-header {
          height: 76px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,250,245,.96);
          border-bottom: 1px solid #eee4db;
          backdrop-filter: blur(16px);
        }

        .loyalty-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .loyalty-logo {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          overflow: hidden;
          border-radius: 50%;
          background: #fff;
          border: 2px solid #eadfd5;
          box-shadow: 0 5px 15px rgba(55,35,22,.12);
        }

        .loyalty-logo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          border-radius: 50%;
        }

        .loyalty-brand strong {
          display: block;
          color: #30261f;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -.3px;
        }

        .loyalty-brand span {
          display: block;
          margin-top: 3px;
          color: #9a8b7d;
          font-size: 10px;
        }

        .loyalty-back {
          height: 36px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2d4c8;
          border-radius: 11px;
          background: #fff;
          color: #654936;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 3px 10px rgba(55,35,22,.06);
          transition:
            background .2s ease,
            box-shadow .2s ease,
            transform .2s ease;
        }

        .loyalty-back:hover {
          background: #f8f0e9;
          box-shadow: 0 5px 14px rgba(55,35,22,.09);
        }

        .loyalty-back:active {
          transform: scale(.97);
        }

        .loyalty-content {
          padding: 22px 17px 0;
        }

        .welcome-card {
          padding: 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-radius: 24px;
          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(255,255,255,.13),
              transparent 34%
            ),
            linear-gradient(
              145deg,
              #3b2b22,
              #241b16
            );
          color: white;
          box-shadow: 0 12px 30px rgba(55,34,20,.13);
        }

        .profile-avatar {
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: linear-gradient(
            145deg,
            #d09a68,
            #a96535
          );
          color: white;
          font-size: 23px;
          font-weight: 800;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.25),
            0 8px 18px rgba(0,0,0,.18);
        }

        .welcome-text {
          min-width: 0;
        }

        .loyalty-eyebrow {
          display: block;
          color: #b96f38;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .welcome-card .loyalty-eyebrow {
          color: #dca372;
        }

        .welcome-text h1 {
          margin-top: 5px;
          color: #fffaf4;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 25px;
          line-height: 1.1;
          letter-spacing: -.6px;
        }

        .welcome-text p {
          margin-top: 7px;
          color: #cdbfb4;
          font-size: 11px;
          line-height: 1.5;
        }

        .points-card {
          margin-top: 15px;
          padding: 22px;
          border-radius: 24px;
          background: white;
          border: 1px solid #eee4da;
          box-shadow: 0 8px 25px rgba(67,44,26,.06);
        }

        .points-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .points-label {
          display: block;
          color: #9a8b7d;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.3px;
        }

        .points-number {
          display: block;
          margin-top: 5px;
          color: #382a21;
          font-size: 38px;
          line-height: 1;
          font-weight: 850;
          letter-spacing: -1.5px;
        }

        .points-caption {
          display: block;
          margin-top: 5px;
          color: #a29488;
          font-size: 9px;
        }

        .level-badge {
          min-width: 82px;
          padding: 10px 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border-radius: 13px;
          background: #f5e8da;
          color: #80532f;
          font-size: 10px;
          font-weight: 800;
        }

        .level-badge span {
          font-size: 14px;
        }

        .progress-section {
          margin-top: 24px;
        }

        .progress-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #8e7f73;
          font-size: 10px;
        }

        .progress-top strong {
          color: #b56d38;
          font-weight: 800;
        }

        .progress-track {
          height: 9px;
          margin-top: 9px;
          overflow: hidden;
          border-radius: 20px;
          background: #eee3d9;
        }

        .progress-fill {
          height: 100%;
          min-width: 4px;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            #a85f30,
            #d49a62
          );
          transition: width .5s ease;
        }

        .progress-levels {
          display: flex;
          justify-content: space-between;
          margin-top: 7px;
          color: #a29488;
          font-size: 8px;
        }

        .alert {
          margin-top: 14px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 13px;
          font-size: 10px;
          line-height: 1.4;
        }

        .alert > span {
          width: 25px;
          height: 25px;
          flex: 0 0 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: 800;
        }

        .success-alert {
          background: #e8f3e8;
          color: #47704b;
        }

        .success-alert > span {
          background: #4d9364;
          color: white;
        }

        .error-alert {
          background: #f7e7df;
          color: #8a5135;
        }

        .error-alert > span {
          background: #b96f38;
          color: white;
        }

        .loyalty-section {
          margin-top: 30px;
        }

        .section-title h2 {
          margin-top: 5px;
          color: #382a21;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 25px;
          line-height: 1.1;
          letter-spacing: -.5px;
        }

        .section-title p {
          margin-top: 7px;
          color: #978a7f;
          font-size: 10px;
          line-height: 1.5;
        }

        .rewards-grid {
          display: grid;
          gap: 12px;
          margin-top: 15px;
        }

        .reward-card {
          padding: 15px;
          display: flex;
          align-items: flex-start;
          gap: 13px;
          border: 1px solid #eee4da;
          border-radius: 20px;
          background: white;
          box-shadow: 0 6px 20px rgba(67,44,26,.045);
        }

        .reward-icon {
          width: 52px;
          height: 52px;
          flex: 0 0 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: #f5e9dc;
          font-size: 25px;
        }

        .reward-main {
          min-width: 0;
          flex: 1;
        }

        .reward-main h3 {
          color: #3d2e24;
          font-size: 14px;
          font-weight: 800;
        }

        .reward-main p {
          margin-top: 4px;
          color: #978a7f;
          font-size: 10px;
          line-height: 1.4;
        }

        .reward-bottom {
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .reward-points {
          display: flex;
          align-items: baseline;
          gap: 4px;
          white-space: nowrap;
        }

        .reward-points strong {
          color: #b56d38;
          font-size: 14px;
        }

        .reward-points span {
          color: #9a8b7d;
          font-size: 9px;
        }

        .reward-button {
          min-height: 34px;
          padding: 0 12px;
          border: 0;
          border-radius: 10px;
          background: #b96f38;
          color: white;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .reward-button:active {
          transform: scale(.97);
        }

        .reward-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .reward-button.disabled {
          background: #d9cec4;
          color: #806f62;
        }

        .history-card {
          margin-top: 15px;
          overflow: hidden;
          border: 1px solid #eee4da;
          border-radius: 20px;
          background: white;
          box-shadow: 0 6px 20px rgba(67,44,26,.045);
        }

        .history-row {
          min-height: 70px;
          padding: 11px 14px;
          display: flex;
          align-items: center;
          gap: 11px;
          border-bottom: 1px solid #f1e9e2;
        }

        .history-row:last-child {
          border-bottom: 0;
        }

        .history-icon {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f5e9dc;
          font-size: 17px;
        }

        .history-info {
          min-width: 0;
          flex: 1;
        }

        .history-info strong {
          display: block;
          overflow: hidden;
          color: #45362c;
          font-size: 11px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-info small {
          display: block;
          margin-top: 4px;
          color: #a09286;
          font-size: 8px;
        }

        .history-row b {
          font-size: 12px;
          font-weight: 800;
        }

        .points-positive {
          color: #4f8a55;
        }

        .points-negative {
          color: #b56d38;
        }

        .history-empty {
          padding: 34px 20px;
          text-align: center;
        }

        .history-empty > span {
          display: block;
          font-size: 30px;
        }

        .history-empty strong {
          display: block;
          margin-top: 9px;
          color: #493a30;
          font-size: 12px;
        }

        .history-empty p {
          margin-top: 5px;
          color: #9a8b7d;
          font-size: 9px;
        }

        .loyalty-tip {
          margin-top: 25px;
          padding: 17px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          border: 1px solid #eadbca;
          border-radius: 18px;
          background: linear-gradient(
            145deg,
            #fbf1e5,
            #f5e9dc
          );
        }

        .tip-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #fffaf5;
          font-size: 20px;
        }

        .loyalty-tip strong {
          display: block;
          color: #4a382c;
          font-size: 12px;
        }

        .loyalty-tip p {
          margin-top: 4px;
          color: #8e7f73;
          font-size: 9px;
          line-height: 1.5;
        }

        .loyalty-footer {
          padding: 32px 20px 20px;
          text-align: center;
        }

        .footer-logo {
          width: 44px;
          height: 44px;
          margin: 0 auto 8px;
          overflow: hidden;
          border-radius: 50%;
          background: white;
          box-shadow: 0 5px 15px rgba(67,44,26,.1);
        }

        .footer-logo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .loyalty-footer strong {
          display: block;
          color: #493a30;
          font-size: 14px;
        }

        .loyalty-footer p {
          margin-top: 5px;
          color: #9a8b7d;
          font-size: 10px;
        }

        .loyalty-footer small {
          display: block;
          margin-top: 12px;
          color: #b0a39a;
          font-size: 9px;
        }

        .loyalty-loading {
          min-height: 70vh;
          padding: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .loyalty-spinner {
          width: 34px;
          height: 34px;
          margin-bottom: 15px;
          border: 3px solid #eadfd5;
          border-top-color: #b96f38;
          border-radius: 50%;
          animation: loyaltySpin .8s linear infinite;
        }

        @keyframes loyaltySpin {
          to {
            transform: rotate(360deg);
          }
        }

        .loyalty-loading strong {
          color: #493a30;
          font-size: 13px;
        }

        .loyalty-loading span {
          margin-top: 5px;
          color: #9a8b7d;
          font-size: 10px;
        }

        .loyalty-error-page {
          min-height: 65vh;
          padding: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .error-icon {
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background: #f5e9dc;
          font-size: 34px;
        }

        .loyalty-error-page h1 {
          margin-top: 18px;
          color: #3d2e24;
          font-size: 21px;
        }

        .loyalty-error-page p {
          max-width: 360px;
          margin-top: 8px;
          color: #8f8176;
          font-size: 10px;
          line-height: 1.5;
        }

        .primary-button {
          height: 42px;
          margin-top: 18px;
          padding: 0 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #b96f38;
          color: white;
          font-size: 10px;
          font-weight: 800;
        }

        @media (max-width: 390px) {

          .loyalty-header {
            padding-left: 14px;
            padding-right: 14px;
          }

          .loyalty-content {
            padding-left: 14px;
            padding-right: 14px;
          }

          .welcome-card {
            padding: 18px;
          }

          .profile-avatar {
            width: 52px;
            height: 52px;
            flex-basis: 52px;
          }

          .welcome-text h1 {
            font-size: 22px;
          }

          .points-card {
            padding: 18px;
          }

          .points-number {
            font-size: 34px;
          }

          .reward-card {
            padding: 13px;
          }

          .reward-bottom {
            align-items: flex-end;
          }

          .reward-button {
            padding-left: 9px;
            padding-right: 9px;
          }
        }

      `}</style>

    </main>
  );
}