"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../../../lib/supabase";

type CafeTable = {
  id: string;
  table_number: string;
  qr_token: string;
  active: boolean;
};

export default function TablesAdminPage() {
  const [tables, setTables] =
    useState<CafeTable[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [siteUrl, setSiteUrl] =
    useState("");

  useEffect(() => {
    setSiteUrl(
      window.location.origin
    );

    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        throw new Error(
          "Bu sayfayı görmek için giriş yapmalısınız."
        );
      }

      const {
        data,
        error: tableError,
      } = await supabase.rpc(
        "get_all_cafe_tables"
      );

      if (tableError) {
        throw new Error(
          tableError.message
        );
      }

      setTables(
        (data ?? []) as CafeTable[]
      );
    } catch (err) {
      console.error(
        "TABLE ADMIN ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Masalar yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  };

  const getTableUrl = (
    qrToken: string
  ) => {
    if (!siteUrl) {
      return "";
    }

    return `${siteUrl}/?table=${encodeURIComponent(
      qrToken
    )}`;
  };

  const printTables = () => {
    window.print();
  };

  if (loading) {
    return (
      <main className="site">
        <section className="section">
          <div className="loyalty-message">
            Masalar yükleniyor...
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="site">
        <section className="section">

          <div className="loyalty-message">
            ⚠️ {error}
          </div>

          <button
            type="button"
            className="loyalty-button"
            onClick={loadTables}
          >
            Tekrar Dene
          </button>

        </section>
      </main>
    );
  }

  return (
    <main className="site">

      <header className="header">

        <div className="brand">

          <div className="logo">
            ☕
          </div>

          <div>
            <h1>
              Taşkent Cafe
            </h1>

            <span>
              Masa QR Yönetimi
            </span>
          </div>

        </div>

        <a
          href="/"
          className="icon-button"
          aria-label="Ana sayfa"
        >
          ←
        </a>

      </header>

      <section className="section">

        <div className="section-heading">

          <div>

            <span className="eyebrow">
              YÖNETİM
            </span>

            <h2>
              Masa QR Kodları
            </h2>

          </div>

          <span className="menu-count">
            {tables.length} masa
          </span>

        </div>

        <div
          style={{
            marginBottom: "24px",
          }}
        >
          <button
            type="button"
            className="loyalty-button"
            onClick={printTables}
          >
            🖨️ QR Kodlarını Yazdır
          </button>
        </div>

        <div
          className="table-qr-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >

          {tables.map((table) => {

            const tableUrl =
              getTableUrl(
                table.qr_token
              );

            return (
              <article
                key={table.id}
                className="info-card"
                style={{
                  textAlign: "center",
                  padding: "24px",
                }}
              >

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    marginBottom: "16px",
                  }}
                >
                  Masa{" "}
                  {table.table_number}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "center",
                    marginBottom: "16px",
                  }}
                >
                  {tableUrl && (
                    <QRCodeSVG
                      value={tableUrl}
                      size={180}
                      level="H"
                      includeMargin
                    />
                  )}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    wordBreak:
                      "break-all",
                    opacity: 0.7,
                    marginBottom: "12px",
                  }}
                >
                  {tableUrl}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {table.active
                    ? "🟢 Aktif"
                    : "🔴 Pasif"}
                </div>

              </article>
            );
          })}

        </div>

      </section>

      <footer className="footer">

        <div className="footer-logo">
          ☕ Taşkent Cafe
        </div>

        <p>
          Masa QR yönetimi
        </p>

        <small>
          © 2026 Taşkent Cafe
        </small>

      </footer>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .header,
          .footer,
          .bottom-nav,
          button {
            display: none !important;
          }

          .site {
            padding: 0 !important;
          }

          .section {
            padding: 0 !important;
          }

          .table-qr-grid {
            grid-template-columns:
              repeat(3, 1fr) !important;
            gap: 12px !important;
          }

          .info-card {
            break-inside: avoid;
            border: 1px solid #ddd !important;
          }
        }
      `}</style>

    </main>
  );
}