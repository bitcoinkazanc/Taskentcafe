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
            Yetki kontrol ediliyor...
          </div>
        </section>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="site">
        <section className="loyalty-page">

          <div className="loyalty-message">
            <strong>
              Yetkisiz erişim
            </strong>

            <p>
              Bu sayfaya yalnızca
              yetkili personel
              erişebilir.
            </p>
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
          className="icon-button"
          aria-label="Ana sayfa"
        >
          ←
        </a>

      </header>

      <section className="loyalty-page">

        <div className="loyalty-heading">

          <div>

            <span className="eyebrow">
              PERSONEL
            </span>

            <h2>
              Alışveriş puanı ekle
            </h2>

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

        <div className="info-card">

          <div className="info-row">

            <span>
              👤
            </span>

            <div>

              <strong>
                Müşteri
              </strong>

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

          </div>

          <div className="info-row">

            <span>
              ₺
            </span>

            <div>

              <strong>
                Alışveriş tutarı
              </strong>

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

          </div>

          <div className="info-row">

            <span>
              ⭐
            </span>

            <div>

              <strong>
                Kazanılacak puan
              </strong>

              <p>
                {previewPoints > 0
                  ? `${previewPoints} puan`
                  : "Alışveriş tutarını girin"}
              </p>

            </div>

          </div>

          <div className="info-row">

            <span>
              📝
            </span>

            <div>

              <strong>
                Açıklama
              </strong>

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

          </div>

        </div>

        <button
          className="loyalty-button"
          onClick={
            addPurchasePoints
          }
          disabled={
            !selectedCustomer ||
            previewPoints <= 0
          }
        >
          ⭐ {previewPoints > 0
            ? `${previewPoints} Puan Ekle`
            : "Puan Ekle"}
        </button>

        <section className="history">

          <div className="loyalty-heading">

            <div>

              <span className="eyebrow">
                MÜŞTERİLER
              </span>

              <h2>
                Müşteri listesi
              </h2>

            </div>

          </div>

          <div className="history-card">

            {customers.length === 0 ? (

              <div className="history-row">

                <div>
                  Henüz müşteri yok.
                </div>

              </div>

            ) : (

              customers.map(
                (customer) => (
                  <div
                    className="history-row"
                    key={
                      customer.id
                    }
                  >

                    <div className="history-icon">
                      👤
                    </div>

                    <div>

                      <strong>
                        {customer.name ||
                          "Misafir"}
                      </strong>

                      <small>
                        {customer.level}
                      </small>

                    </div>

                    <b>
                      {customer.points}
                    </b>

                  </div>
                )
              )

            )}

          </div>

        </section>

      </section>

      <footer className="footer">

        <div className="footer-logo">
          ☕ Taşkent Cafe
        </div>

        <p>
          Personel yönetim paneli.
        </p>

        <small>
          © 2026 Taşkent Cafe
        </small>

      </footer>

    </main>
  );
}