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
  const [selectedCustomer, setSelectedCustomer] =
    useState("");

  const [purchaseAmount, setPurchaseAmount] =
    useState("");

  const [description, setDescription] =
    useState("Alışveriş puanı");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
      setError("Lütfen bir müşteri seçin.");
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
      setError("Açıklama girin.");
      return;
    }

    try {
      setSaving(true);

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
        `${amount.toLocaleString(
          "tr-TR",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
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
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="site">
        <section className="loyalty-page">
          <div className="admin-loading-card">
            <div className="admin-loading-icon">
              ⭐
            </div>

            <strong>
              Sadakat sistemi yükleniyor
            </strong>

            <span>
              Lütfen bekleyin...
            </span>
          </div>
        </section>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="site">
        <section className="loyalty-page">
          <div className="admin-access-card">
            <div className="admin-access-icon">
              🔒
            </div>

            <h2>
              Yetkisiz erişim
            </h2>

            <p>
              Bu bölüme yalnızca yetkili
              personel erişebilir.
            </p>

            {error && (
              <div className="admin-alert error">
                ⚠️ {error}
              </div>
            )}

            <a
              href="/admin"
              className="admin-back-button"
            >
              Yönetim Paneline Dön
            </a>
          </div>
        </section>
      </main>
    );
  }

  const previewPoints =
    calculatePoints();

  const selectedCustomerData =
    customers.find(
      (customer) =>
        customer.id === selectedCustomer
    );

  return (
    <main className="site">

      <header className="admin-page-header">
        <div>
          <span className="admin-page-kicker">
            SADAKAT
          </span>

          <h1>
            Puan Yönetimi
          </h1>

          <p>
            Müşteri puanlarını yönetin
          </p>
        </div>

        <a
          href="/admin"
          className="admin-header-back"
          aria-label="Yönetim paneline dön"
        >
          <span>←</span>
        </a>
      </header>

      <section className="loyalty-page admin-loyalty-page">

        {message && (
          <div className="admin-alert success">
            <span>✓</span>

            <div>
              <strong>
                İşlem başarılı
              </strong>

              <p>
                {message}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="admin-alert error">
            <span>!</span>

            <div>
              <strong>
                İşlem gerçekleştirilemedi
              </strong>

              <p>
                {error}
              </p>
            </div>
          </div>
        )}

        <section className="points-card">

          <div className="points-card-header">

            <div className="points-icon">
              ⭐
            </div>

            <div>
              <span>
                PUAN İŞLEMİ
              </span>

              <h2>
                Alışveriş puanı ekle
              </h2>

              <p>
                Müşterinin alışveriş tutarına
                göre puan hesabı yapılır.
              </p>
            </div>

          </div>

          <div className="points-form">

            <div className="form-field">

              <label>
                Müşteri
              </label>

              <select
                value={selectedCustomer}
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
                      •{" "}
                      {customer.points} puan
                    </option>
                  )
                )}
              </select>

              {selectedCustomerData && (
                <div className="selected-customer">

                  <div className="selected-customer-avatar">
                    👤
                  </div>

                  <div>
                    <strong>
                      {selectedCustomerData.name ||
                        "Misafir"}
                    </strong>

                    <span>
                      Mevcut puan:{" "}
                      {
                        selectedCustomerData.points
                      }
                    </span>
                  </div>

                </div>
              )}

            </div>

            <div className="form-field">

              <label>
                Alışveriş tutarı
              </label>

              <div className="money-input">

                <span>
                  ₺
                </span>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={purchaseAmount}
                  onChange={(event) =>
                    setPurchaseAmount(
                      event.target.value
                    )
                  }
                  placeholder="450"
                />

              </div>

              <small>
                Her 10 ₺ alışveriş için 1
                puan kazanılır.
              </small>

            </div>

            <div className="points-preview">

              <div className="points-preview-icon">
                ⭐
              </div>

              <div>

                <span>
                  KAZANILACAK PUAN
                </span>

                <strong>
                  {previewPoints}
                </strong>

                <small>
                  puan
                </small>

              </div>

            </div>

            <div className="form-field">

              <label>
                İşlem açıklaması
              </label>

              <input
                type="text"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Alışveriş puanı"
              />

            </div>

            <button
              type="button"
              className="add-points-button"
              onClick={
                addPurchasePoints
              }
              disabled={
                saving ||
                !selectedCustomer ||
                previewPoints <= 0
              }
            >

              <span>
                ⭐
              </span>

              {saving
                ? "Puan ekleniyor..."
                : previewPoints > 0
                  ? `${previewPoints} Puan Ekle`
                  : "Puan Ekle"}

            </button>

          </div>

        </section>

        <section className="customer-section">

          <div className="section-title">

            <div>

              <span>
                MÜŞTERİLER
              </span>

              <h2>
                Müşteri bakiyeleri
              </h2>

            </div>

            <strong>
              {customers.length}
            </strong>

          </div>

          <div className="customer-list">

            {customers.length === 0 ? (

              <div className="empty-card">

                <div>
                  👤
                </div>

                <strong>
                  Henüz müşteri yok
                </strong>

                <p>
                  Sisteme müşteri
                  eklendiğinde burada
                  görünecek.
                </p>

              </div>

            ) : (

              customers.map(
                (customer) => (
                  <article
                    className="customer-card"
                    key={customer.id}
                  >

                    <div className="customer-avatar">
                      👤
                    </div>

                    <div className="customer-info">

                      <strong>
                        {customer.name ||
                          "Misafir"}
                      </strong>

                      <span>
                        {customer.level ||
                          "Standart"}
                      </span>

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
                      className="remove-points-button"
                      onClick={() => {
                        setSelectedCustomer(
                          customer.id
                        );

                        setError(
                          "Puan silme işlemi için mevcut Supabase puan silme fonksiyonunu bağlamamız gerekiyor. Çalışan sistemi bozmamak için burada varsayımsal bir RPC kullanılmadı."
                        );
                      }}
                    >
                      − Puan Sil
                    </button>

                  </article>
                )
              )

            )}

          </div>

        </section>

      </section>

      <style jsx global>{`

        .admin-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 18px 18px;
          border-bottom: 1px solid #eee4da;
          background: #ffffff;
        }

        .admin-page-kicker {
          display: block;
          margin-bottom: 5px;
          color: #b66d36;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .admin-page-header h1 {
          margin: 0;
          color: #33251c;
          font-size: 21px;
          font-weight: 900;
          letter-spacing: -0.3px;
        }

        .admin-page-header p {
          margin: 4px 0 0;
          color: #998c81;
          font-size: 10px;
        }

        .admin-header-back {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e4d8cd;
          border-radius: 13px;
          background: #fffaf5;
          color: #4b382b;
          text-decoration: none;
          box-shadow:
            0 4px 12px
              rgba(55, 38, 25, 0.06);
        }

        .admin-header-back span {
          font-size: 21px;
          line-height: 1;
        }

        .admin-loyalty-page {
          padding-top: 22px;
          padding-bottom: 40px;
        }

        .admin-loading-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 240px;
          padding: 30px;
          border: 1px solid #eee4da;
          border-radius: 22px;
          background: #ffffff;
          text-align: center;
        }

        .admin-loading-icon {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 13px;
          border-radius: 18px;
          background: #f8eee6;
          font-size: 25px;
        }

        .admin-loading-card strong {
          color: #392a20;
          font-size: 14px;
        }

        .admin-loading-card span {
          margin-top: 5px;
          color: #998c81;
          font-size: 10px;
        }

        .admin-access-card {
          padding: 34px 20px;
          border: 1px solid #eee4da;
          border-radius: 22px;
          background: #ffffff;
          text-align: center;
        }

        .admin-access-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          border-radius: 20px;
          background: #f8eee6;
          font-size: 27px;
        }

        .admin-access-card h2 {
          margin: 0;
          color: #392a20;
          font-size: 20px;
          font-weight: 900;
        }

        .admin-access-card p {
          margin: 8px auto 20px;
          max-width: 300px;
          color: #998c81;
          font-size: 11px;
          line-height: 1.55;
        }

        .admin-back-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0 18px;
          border-radius: 11px;
          background: #b66d36;
          color: #ffffff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
        }

        .admin-alert {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 14px;
          padding: 13px 14px;
          border-radius: 14px;
        }

        .admin-alert > span {
          width: 25px;
          height: 25px;
          flex: 0 0 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 900;
        }

        .admin-alert strong {
          display: block;
          font-size: 10px;
          font-weight: 900;
        }

        .admin-alert p {
          margin: 3px 0 0;
          font-size: 9px;
          line-height: 1.5;
        }

        .admin-alert.success {
          border: 1px solid #dce9df;
          background: #f4faf5;
          color: #42624a;
        }

        .admin-alert.success > span {
          background: #dcefe0;
        }

        .admin-alert.error {
          border: 1px solid #eadbd6;
          background: #fff8f5;
          color: #8c5146;
        }

        .admin-alert.error > span {
          background: #f1dfd9;
        }

        .points-card {
          overflow: hidden;
          border: 1px solid #eadfd5;
          border-radius: 22px;
          background: #ffffff;
          box-shadow:
            0 9px 28px
              rgba(60, 39, 25, 0.06);
        }

        .points-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px;
          border-bottom: 1px solid #f0e7df;
          background: #fffaf5;
        }

        .points-icon {
          width: 45px;
          height: 45px;
          flex: 0 0 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #f4e5d7;
          font-size: 20px;
        }

        .points-card-header span {
          display: block;
          color: #b66d36;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .points-card-header h2 {
          margin: 3px 0 0;
          color: #392a20;
          font-size: 16px;
          font-weight: 900;
        }

        .points-card-header p {
          margin: 4px 0 0;
          color: #998c81;
          font-size: 9px;
          line-height: 1.45;
        }

        .points-form {
          display: grid;
          gap: 15px;
          padding: 18px;
        }

        .form-field {
          display: grid;
          gap: 7px;
        }

        .form-field label {
          color: #493a30;
          font-size: 10px;
          font-weight: 900;
        }

        .form-field input,
        .form-field select {
          width: 100%;
          min-height: 44px;
          box-sizing: border-box;
          padding: 0 13px;
          border: 1px solid #e2d7cd;
          border-radius: 11px;
          outline: none;
          background: #fffdfb;
          color: #30261f;
          font-size: 11px;
        }

        .form-field input:focus,
        .form-field select:focus {
          border-color: #b66d36;
          box-shadow:
            0 0 0 3px
              rgba(182, 109, 54, 0.08);
        }

        .form-field small {
          color: #9d9187;
          font-size: 8px;
        }

        .money-input {
          position: relative;
        }

        .money-input span {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #a66a3d;
          font-size: 13px;
          font-weight: 900;
          pointer-events: none;
        }

        .money-input input {
          padding-left: 32px;
        }

        .selected-customer {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border-radius: 11px;
          background: #faf5f0;
          border: 1px solid #eee3da;
        }

        .selected-customer-avatar {
          width: 31px;
          height: 31px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #f0e2d7;
          font-size: 14px;
        }

        .selected-customer strong {
          display: block;
          color: #493a30;
          font-size: 9px;
        }

        .selected-customer span {
          display: block;
          margin-top: 2px;
          color: #998c81;
          font-size: 8px;
        }

        .points-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border: 1px solid #eadaca;
          border-radius: 14px;
          background: #fff8ef;
        }

        .points-preview-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #f2dfc8;
          font-size: 19px;
        }

        .points-preview span {
          display: block;
          color: #a66a3d;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .points-preview strong {
          display: inline-block;
          margin-top: 1px;
          color: #392a20;
          font-size: 24px;
          line-height: 1;
          font-weight: 900;
        }

        .points-preview small {
          margin-left: 4px;
          color: #8f8176;
          font-size: 9px;
          font-weight: 700;
        }

        .add-points-button {
          min-height: 46px;
          border: 0;
          border-radius: 12px;
          background: #b66d36;
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          box-shadow:
            0 6px 16px
              rgba(182, 109, 54, 0.18);
        }

        .add-points-button span {
          margin-right: 5px;
        }

        .add-points-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .customer-section {
          margin-top: 30px;
        }

        .section-title {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .section-title span {
          display: block;
          margin-bottom: 3px;
          color: #b66d36;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.3px;
        }

        .section-title h2 {
          margin: 0;
          color: #392a20;
          font-size: 17px;
          font-weight: 900;
        }

        .section-title > strong {
          min-width: 27px;
          height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #f4ebe4;
          color: #87644b;
          font-size: 9px;
        }

        .customer-list {
          display: grid;
          gap: 9px;
        }

        .customer-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 1px solid #eee4da;
          border-radius: 16px;
          background: #ffffff;
          box-shadow:
            0 4px 14px
              rgba(60, 39, 25, 0.035);
        }

        .customer-avatar {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f6eee8;
          font-size: 17px;
        }

        .customer-info {
          min-width: 0;
          flex: 1;
        }

        .customer-info strong {
          display: block;
          overflow: hidden;
          color: #392a20;
          font-size: 11px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .customer-info span {
          display: block;
          margin-top: 3px;
          color: #998c81;
          font-size: 8px;
        }

        .customer-points {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-right: 2px;
        }

        .customer-points strong {
          color: #b66d36;
          font-size: 16px;
          font-weight: 900;
          line-height: 1;
        }

        .customer-points span {
          margin-top: 3px;
          color: #a3978e;
          font-size: 7px;
        }

        .remove-points-button {
          min-height: 31px;
          padding: 0 8px;
          border: 1px solid #eadbd6;
          border-radius: 9px;
          background: #fff8f5;
          color: #a35e50;
          font-size: 7px;
          font-weight: 900;
          cursor: pointer;
        }

        .empty-card {
          padding: 30px 18px;
          border: 1px dashed #dfd2c7;
          border-radius: 17px;
          background: #fffdfb;
          text-align: center;
        }

        .empty-card > div {
          font-size: 25px;
        }

        .empty-card strong {
          display: block;
          margin-top: 7px;
          color: #493a30;
          font-size: 11px;
        }

        .empty-card p {
          margin: 4px 0 0;
          color: #998c81;
          font-size: 8px;
        }

        @media (max-width: 430px) {
          .admin-page-header {
            padding: 18px 15px 15px;
          }

          .admin-page-header h1 {
            font-size: 19px;
          }

          .admin-loyalty-page {
            padding-left: 15px;
            padding-right: 15px;
          }

          .points-card-header,
          .points-form {
            padding: 15px;
          }

          .customer-card {
            gap: 7px;
          }

          .customer-avatar {
            width: 36px;
            height: 36px;
            flex-basis: 36px;
          }

          .remove-points-button {
            padding: 0 6px;
          }
        }

      `}</style>

    </main>
  );
}