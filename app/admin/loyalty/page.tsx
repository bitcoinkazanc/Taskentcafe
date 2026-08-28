"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Customer = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  points: number;
  level: string;
};

export default function AdminLoyaltyPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [description, setDescription] =
    useState("Alışveriş puanı");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    checkStaff();
  }, []);

  const checkStaff = async () => {
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
        setAuthorized(false);
        return;
      }

      const {
        data: staff,
        error: staffError,
      } = await supabase
        .from("staff_users")
        .select("id, auth_user_id, role")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (staffError) {
        throw new Error(
          `Yetki kontrolü başarısız: ${staffError.message}`
        );
      }

      if (!staff) {
        setAuthorized(false);
        return;
      }

      setAuthorized(true);

      await loadCustomers();
    } catch (err) {
      console.error("STAFF CHECK ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Yetki kontrolü başarısız."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    const {
      data,
      error: customersError,
    } = await supabase
      .from("customers")
      .select(
        "id, name, phone, email, points, level"
      )
      .order("created_at", {
        ascending: false,
      });

    if (customersError) {
      throw new Error(
        `Müşteriler alınamadı: ${customersError.message}`
      );
    }

    setCustomers(
      (data ?? []) as Customer[]
    );
  };

  const calculatePoints = () => {
    const amount = Number(
      purchaseAmount.replace(",", ".")
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return 0;
    }

    return Math.floor(amount / 10);
  };

  const addPurchasePoints = async () => {
    setMessage("");
    setError("");

    if (!selectedCustomer) {
      setError(
        "Lütfen bir müşteri seçin."
      );
      return;
    }

    const amount = Number(
      purchaseAmount.replace(",", ".")
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Geçerli bir alışveriş tutarı girin."
      );
      return;
    }

    const calculatedPoints =
      calculatePoints();

    if (calculatedPoints <= 0) {
      setError(
        "Bu alışveriş için kazanılacak puan 0."
      );
      return;
    }

    if (!description.trim()) {
      setError(
        "Açıklama girin."
      );
      return;
    }

    try {
      const {
        error: rpcError,
      } = await supabase.rpc(
        "add_purchase_points",
        {
          target_customer_id:
            selectedCustomer,

          purchase_amount: amount,

          purchase_description:
            description.trim(),
        }
      );

      if (rpcError) {
        throw new Error(
          rpcError.message
        );
      }

      setMessage(
        `${amount.toFixed(
          2
        )} ₺ alışveriş için ${calculatedPoints} puan eklendi.`
      );

      setPurchaseAmount("");
      setDescription(
        "Alışveriş puanı"
      );

      await loadCustomers();
    } catch (err) {
      console.error(
        "ADD PURCHASE POINTS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Puan eklenirken hata oluştu."
      );
    }
  };

  if (loading) {
    return (
      <main className="site">
        <section className="loyalty-page">
          <div className="loyalty-message">
            <div className="panel-loading-icon">
              ☕
            </div>

            <strong>
              Personel paneli yükleniyor
            </strong>

            <span>
              Lütfen bekleyin...
            </span>
          </div>
        </section>

        <style jsx global>{`
          .loyalty-message {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 120px;
            text-align: center;
          }

          .panel-loading-icon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 4px;
            border-radius: 15px;
            background: #f7eee7;
            font-size: 21px;
          }

          .loyalty-message strong {
            color: #392a20;
            font-size: 13px;
          }

          .loyalty-message span {
            color: #998c81;
            font-size: 9px;
          }
        `}</style>
      </main>
    );
  }

  if (!authorized) {
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
                Personel Paneli
              </span>
            </div>
          </a>

          <a
            href="/"
            className="panel-back-button"
            aria-label="Geri dön"
          >
            <span>←</span>
          </a>
        </header>

        <section className="loyalty-page">
          <div className="access-card">
            <div className="access-icon">
              🔒
            </div>

            <span className="access-eyebrow">
              PERSONEL PANELİ
            </span>

            <h2>
              Yetkisiz erişim
            </h2>

            <p>
              Bu sayfaya yalnızca yetkili
              personel erişebilir.
            </p>

            {error && (
              <div className="panel-alert error">
                ⚠️ {error}
              </div>
            )}

            <a
              href="/"
              className="panel-primary-button"
            >
              Ana Sayfaya Dön
            </a>
          </div>
        </section>

        <style jsx global>{`
          .panel-back-button {
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #e8ddd4;
            border-radius: 13px;
            background: #ffffff;
            color: #493a30;
            text-decoration: none;
            box-shadow: 0 5px 16px rgba(60, 39, 25, 0.06);
            transition: 0.2s ease;
          }

          .panel-back-button span {
            font-size: 20px;
            line-height: 1;
          }

          .panel-back-button:hover {
            transform: translateY(-1px);
            border-color: #c88a5a;
          }

          .access-card {
            padding: 34px 22px;
            border: 1px solid #eee4da;
            border-radius: 24px;
            background: #ffffff;
            text-align: center;
            box-shadow: 0 10px 30px rgba(60, 39, 25, 0.06);
          }

          .access-icon {
            width: 66px;
            height: 66px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            border-radius: 20px;
            background: #f7eee7;
            font-size: 28px;
          }

          .access-eyebrow {
            color: #b56d38;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 1.4px;
          }

          .access-card h2 {
            margin: 7px 0 0;
            color: #392a20;
            font-size: 21px;
          }

          .access-card p {
            max-width: 310px;
            margin: 9px auto 20px;
            color: #998c81;
            font-size: 10px;
            line-height: 1.6;
          }

          .panel-alert {
            margin-bottom: 14px;
            padding: 11px 13px;
            border-radius: 11px;
            font-size: 9px;
            line-height: 1.5;
          }

          .panel-alert.error {
            background: #fff3f1;
            border: 1px solid #f0d7d2;
            color: #9b5c53;
          }

          .panel-primary-button {
            min-height: 43px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 18px;
            border-radius: 12px;
            background: #b96f38;
            color: #ffffff;
            text-decoration: none;
            font-size: 10px;
            font-weight: 800;
          }
        `}</style>
      </main>
    );
  }

  const previewPoints =
    calculatePoints();

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
              Personel Paneli
            </span>
          </div>
        </a>

        <a
          href="/"
          className="panel-back-button"
          aria-label="Personel paneline dön"
        >
          <span>←</span>
        </a>
      </header>

      <section className="loyalty-page staff-loyalty-page">

        <div className="panel-title">
          <div>
            <span className="panel-eyebrow">
              PERSONEL
            </span>

            <h2>
              Sadakat Yönetimi
            </h2>

            <p>
              Müşteri alışverişlerini ve puanlarını yönetin.
            </p>
          </div>

          <div className="customer-total">
            <strong>
              {customers.length}
            </strong>

            <span>
              müşteri
            </span>
          </div>
        </div>

        {message && (
          <div className="panel-alert success">
            <span className="alert-icon">
              ✓
            </span>

            <span>
              {message}
            </span>
          </div>
        )}

        {error && (
          <div className="panel-alert error">
            <span className="alert-icon">
              !
            </span>

            <span>
              {error}
            </span>
          </div>
        )}

        <div className="points-card">

          <div className="card-top">
            <div className="card-icon">
              ⭐
            </div>

            <div>
              <strong>
                Alışveriş Puanı Ekle
              </strong>

              <span>
                Müşterinin alışverişinden puan kazandırın.
              </span>
            </div>
          </div>

          <div className="form-grid">

            <label className="panel-field">
              <span>
                MÜŞTERİ
              </span>

              <div className="field-wrap">
                <span className="field-icon">
                  👤
                </span>

                <select
                  value={
                    selectedCustomer
                  }
                  onChange={(event) =>
                    setSelectedCustomer(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Müşteri seçin
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name ||
                          "Misafir"}{" "}
                        —{" "}
                        {customer.points} puan
                      </option>
                    )
                  )}
                </select>
              </div>
            </label>

            <label className="panel-field">
              <span>
                ALIŞVERİŞ TUTARI
              </span>

              <div className="field-wrap">
                <span className="field-icon currency-icon">
                  ₺
                </span>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={
                    purchaseAmount
                  }
                  onChange={(event) =>
                    setPurchaseAmount(
                      event.target.value
                    )
                  }
                  placeholder="Örn. 450"
                />
              </div>
            </label>

            <div className="points-preview">
              <div className="preview-left">
                <div className="preview-icon">
                  ⭐
                </div>

                <div>
                  <span>
                    KAZANILACAK PUAN
                  </span>

                  <strong>
                    {previewPoints > 0
                      ? `${previewPoints} puan`
                      : "—"}
                  </strong>
                </div>
              </div>

              <small>
                Her 10 ₺ = 1 puan
              </small>
            </div>

            <label className="panel-field">
              <span>
                AÇIKLAMA
              </span>

              <div className="field-wrap">
                <span className="field-icon">
                  📝
                </span>

                <input
                  type="text"
                  value={
                    description
                  }
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Alışveriş puanı"
                />
              </div>
            </label>

          </div>

          <button
            type="button"
            className="points-submit"
            onClick={
              addPurchasePoints
            }
            disabled={
              !selectedCustomer ||
              previewPoints <= 0
            }
          >
            <span>
              ⭐
            </span>

            {previewPoints > 0
              ? `${previewPoints} Puan Ekle`
              : "Puan Ekle"}
          </button>

        </div>

        <section className="customer-section">

          <div className="customer-section-heading">
            <div>
              <span className="panel-eyebrow">
                SADAKAT
              </span>

              <h2>
                Müşteri Listesi
              </h2>
            </div>

            <span className="customer-count">
              {customers.length} kayıt
            </span>
          </div>

          <div className="customer-list">

            {customers.length === 0 ? (

              <div className="empty-customers">
                <div className="empty-icon">
                  👤
                </div>

                <strong>
                  Henüz müşteri yok
                </strong>

                <span>
                  Sadakat sistemine müşteri eklendiğinde
                  burada görünecek.
                </span>
              </div>

            ) : (

              customers.map(
                (customer) => (
                  <article
                    className="customer-card"
                    key={
                      customer.id
                    }
                  >

                    <div className="customer-avatar">
                      {customer.name
                        ? customer.name
                            .charAt(0)
                            .toUpperCase()
                        : "M"}
                    </div>

                    <div className="customer-info">

                      <strong>
                        {customer.name ||
                          "Misafir"}
                      </strong>

                      <span>
                        {customer.phone ||
                          customer.email ||
                          "İletişim bilgisi yok"}
                      </span>

                      <small>
                        {customer.level ||
                          "Standart"}
                      </small>

                    </div>

                    <div className="customer-points">
                      <strong>
                        {customer.points}
                      </strong>

                      <span>
                        puan
                      </span>
                    </div>

                    <button
                      type="button"
                      className="customer-select-button"
                      onClick={() =>
                        setSelectedCustomer(
                          customer.id
                        )
                      }
                    >
                      Seç
                    </button>

                  </article>
                )
              )

            )}

          </div>

        </section>

        <div className="points-rule-card">
          <div className="rule-icon">
            💡
          </div>

          <div>
            <strong>
              Puan sistemi
            </strong>

            <p>
              Her 10 ₺ alışveriş için müşteriye
              1 sadakat puanı eklenir.
            </p>
          </div>
        </div>

      </section>

      <footer className="footer">

        <div className="footer-logo">
          ☕ Taşkent Cafe
        </div>

        <p>
          Personel yönetim paneli
        </p>

        <small>
          © 2026 Taşkent Cafe
        </small>

      </footer>

      <style jsx global>{`
        .staff-loyalty-page {
          padding-bottom: 40px;
        }

        .panel-back-button {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 42px;
          border: 1px solid #e8ddd4;
          border-radius: 13px;
          background: #ffffff;
          color: #493a30;
          text-decoration: none;
          box-shadow: 0 5px 16px rgba(60, 39, 25, 0.06);
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .panel-back-button:hover {
          transform: translateY(-1px);
          border-color: #c88a5a;
          box-shadow: 0 7px 20px rgba(60, 39, 25, 0.09);
        }

        .panel-back-button span {
          font-size: 20px;
          line-height: 1;
        }

        .panel-title {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .panel-eyebrow {
          display: block;
          color: #b56d38;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .panel-title h2,
        .customer-section-heading h2 {
          margin: 5px 0 0;
          color: #392a20;
          font-size: 22px;
          line-height: 1.2;
          letter-spacing: -0.3px;
        }

        .panel-title p {
          margin: 7px 0 0;
          color: #998c81;
          font-size: 9px;
          line-height: 1.5;
        }

        .customer-total {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 62px;
          min-height: 62px;
          padding: 8px;
          border: 1px solid #eee1d5;
          border-radius: 16px;
          background: #fffaf5;
        }

        .customer-total strong {
          color: #a96534;
          font-size: 18px;
          line-height: 1;
        }

        .customer-total span {
          margin-top: 4px;
          color: #998c81;
          font-size: 7px;
          font-weight: 700;
        }

        .panel-alert {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 12px;
          padding: 11px 13px;
          border-radius: 12px;
          font-size: 9px;
          line-height: 1.5;
        }

        .panel-alert.success {
          border: 1px solid #dce9df;
          background: #f3f9f4;
          color: #52745b;
        }

        .panel-alert.error {
          border: 1px solid #efd8d3;
          background: #fff5f3;
          color: #9b5c53;
        }

        .alert-icon {
          width: 21px;
          height: 21px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 21px;
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.75);
          font-size: 10px;
          font-weight: 900;
        }

        .points-card {
          padding: 18px;
          border: 1px solid #eee3da;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(60, 39, 25, 0.055);
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 11px;
          padding-bottom: 16px;
          margin-bottom: 16px;
          border-bottom: 1px solid #f0e8e1;
        }

        .card-icon {
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 43px;
          border-radius: 13px;
          background: #f7eee7;
          font-size: 19px;
        }

        .card-top strong {
          display: block;
          color: #392a20;
          font-size: 13px;
        }

        .card-top span {
          display: block;
          margin-top: 3px;
          color: #998c81;
          font-size: 8px;
        }

        .form-grid {
          display: grid;
          gap: 14px;
        }

        .panel-field {
          display: grid;
          gap: 7px;
        }

        .panel-field > span {
          color: #75675d;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.8px;
        }

        .field-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 12px;
          z-index: 1;
          width: 20px;
          color: #a58f80;
          font-size: 13px;
          text-align: center;
          pointer-events: none;
        }

        .currency-icon {
          font-weight: 900;
          color: #b56d38;
        }

        .field-wrap input,
        .field-wrap select {
          width: 100%;
          height: 44px;
          padding: 0 12px 0 40px;
          border: 1px solid #e4d9cf;
          border-radius: 11px;
          outline: none;
          background: #fffaf5;
          color: #30261f;
          font-family: inherit;
          font-size: 10px;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .field-wrap input:focus,
        .field-wrap select:focus {
          border-color: #b96f38;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(185, 111, 56, 0.08);
        }

        .field-wrap select {
          appearance: auto;
        }

        .points-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-height: 64px;
          padding: 11px 13px;
          border: 1px solid #eadbc9;
          border-radius: 13px;
          background: linear-gradient(
            135deg,
            #fffaf5 0%,
            #f8eee4 100%
          );
        }

        .preview-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .preview-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #ffffff;
          font-size: 16px;
          box-shadow: 0 3px 10px rgba(60, 39, 25, 0.06);
        }

        .preview-left span {
          display: block;
          color: #998c81;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.7px;
        }

        .preview-left strong {
          display: block;
          margin-top: 3px;
          color: #a96534;
          font-size: 14px;
        }

        .points-preview small {
          color: #998c81;
          font-size: 7px;
          text-align: right;
        }

        .points-submit {
          width: 100%;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 17px;
          border: 0;
          border-radius: 12px;
          background: #b96f38;
          color: #ffffff;
          cursor: pointer;
          font-family: inherit;
          font-size: 10px;
          font-weight: 900;
          box-shadow: 0 7px 18px rgba(185, 111, 56, 0.18);
          transition:
            transform 0.2s ease,
            opacity 0.2s ease,
            box-shadow 0.2s ease;
        }

        .points-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 9px 22px rgba(185, 111, 56, 0.23);
        }

        .points-submit:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .customer-section {
          margin-top: 31px;
        }

        .customer-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .customer-count {
          padding: 6px 9px;
          border-radius: 8px;
          background: #f7eee7;
          color: #8b674d;
          font-size: 7px;
          font-weight: 800;
        }

        .customer-list {
          display: grid;
          gap: 9px;
        }

        .customer-card {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px;
          border: 1px solid #eee4da;
          border-radius: 17px;
          background: #ffffff;
          box-shadow: 0 5px 17px rgba(60, 39, 25, 0.035);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .customer-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(60, 39, 25, 0.065);
        }

        .customer-avatar {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 42px;
          border-radius: 13px;
          background: #f7eee7;
          color: #9a633d;
          font-size: 14px;
          font-weight: 900;
        }

        .customer-info {
          flex: 1;
          min-width: 0;
        }

        .customer-info strong {
          display: block;
          overflow: hidden;
          color: #392a20;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .customer-info span {
          display: block;
          margin-top: 3px;
          overflow: hidden;
          color: #a09287;
          font-size: 7px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .customer-info small {
          display: inline-block;
          margin-top: 4px;
          padding: 3px 6px;
          border-radius: 6px;
          background: #f3eee9;
          color: #776a60;
          font-size: 6px;
          font-weight: 800;
        }

        .customer-points {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex: 0 0 auto;
        }

        .customer-points strong {
          color: #a96534;
          font-size: 16px;
          line-height: 1;
        }

        .customer-points span {
          margin-top: 3px;
          color: #998c81;
          font-size: 6px;
        }

        .customer-select-button {
          min-width: 43px;
          height: 29px;
          padding: 0 8px;
          border: 1px solid #e3d6ca;
          border-radius: 8px;
          background: #fffaf5;
          color: #8f603f;
          cursor: pointer;
          font-family: inherit;
          font-size: 7px;
          font-weight: 800;
        }

        .customer-select-button:hover {
          border-color: #c58a60;
          background: #f9efe7;
        }

        .empty-customers {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 35px 20px;
          border: 1px dashed #dfd2c7;
          border-radius: 18px;
          background: #fffaf5;
          text-align: center;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 9px;
          border-radius: 15px;
          background: #f7eee7;
          font-size: 19px;
        }

        .empty-customers strong {
          color: #493a30;
          font-size: 11px;
        }

        .empty-customers span {
          max-width: 260px;
          margin-top: 5px;
          color: #998c81;
          font-size: 8px;
          line-height: 1.5;
        }

        .points-rule-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 18px;
          padding: 13px;
          border: 1px solid #eee1d5;
          border-radius: 16px;
          background: #fffaf5;
        }

        .rule-icon {
          font-size: 18px;
        }

        .points-rule-card strong {
          display: block;
          color: #493a30;
          font-size: 9px;
        }

        .points-rule-card p {
          margin: 4px 0 0;
          color: #998c81;
          font-size: 7px;
          line-height: 1.5;
        }

        @media (max-width: 480px) {
          .panel-title h2,
          .customer-section-heading h2 {
            font-size: 20px;
          }

          .points-card {
            padding: 15px;
          }

          .customer-card {
            gap: 8px;
            padding: 10px;
          }

          .customer-avatar {
            width: 38px;
            height: 38px;
            flex-basis: 38px;
          }

          .customer-points strong {
            font-size: 14px;
          }

          .customer-select-button {
            min-width: 39px;
            padding: 0 6px;
          }
        }
      `}</style>
    </main>
  );
}