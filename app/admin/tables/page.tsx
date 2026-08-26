 "use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type CafeTable = {
  id: string;
  table_number: string;
  qr_token: string;
  active: boolean;
};

export default function TablesAdminPage() {
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    setSiteUrl(window.location.origin);
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error(
          "Bu sayfayı görmek için giriş yapmalısınız."
        );
      }

      const {
        data,
        error: tableError,
      } = await supabase.rpc("get_all_cafe_tables");

      if (tableError) {
        throw new Error(tableError.message);
      }

      setTables((data ?? []) as CafeTable[]);
    } catch (err) {
      console.error("TABLE ADMIN ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Masalar yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  };

  const getTableUrl = (qrToken: string) => {
    if (!siteUrl) {
      return "";
    }

    return `${siteUrl}/?table=${encodeURIComponent(qrToken)}`;
  };

  const getQrImageUrl = (tableUrl: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(
      tableUrl
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
          <div className="logo">☕</div>

          <div>
            <h1>Taşkent Cafe</h1>
            <span>Masa QR Yönetimi</span>
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

            <h2>Masa QR Kodları</h2>
          </div>

          <span className="menu-count">
            {tables.length} masa
          </span>
        </div>

        <div className="qr-actions">
          <button
            type="button"
            className="loyalty-button"
            onClick={printTables}
          >
            🖨️ QR Kodlarını Yazdır
          </button>
        </div>

        <div className="table-qr-grid">
          {tables.map((table) => {
            const tableUrl = getTableUrl(
              table.qr_token
            );

            const qrImageUrl =
              getQrImageUrl(tableUrl);

            return (
              <article
                key={table.id}
                className="table-qr-card"
              >
                <div className="table-qr-title">
                  Masa {table.table_number}
                </div>

                <div className="table-qr-image">
                  <img
                    src={qrImageUrl}
                    alt={`Masa ${table.table_number} QR kodu`}
                  />
                </div>

                <div className="table-qr-status">
                  {table.active
                    ? "🟢 Aktif"
                    : "🔴 Pasif"}
                </div>

                <div className="table-qr-url">
                  {tableUrl}
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

        <p>Masa QR yönetimi</p>

        <small>
          © 2026 Taşkent Cafe
        </small>
      </footer>

      <style jsx global>{`
        .qr-actions {
          margin-bottom: 24px;
        }

        .table-qr-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .table-qr-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 22px;
          text-align: center;
          box-shadow:
            0 8px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .table-qr-title {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 16px;
        }

        .table-qr-image {
          display: flex;
          justify-content: center;
          align-items: center;
          background: #ffffff;
          border-radius: 14px;
          padding: 10px;
          margin-bottom: 14px;
        }

        .table-qr-image img {
          display: block;
          width: 180px;
          height: 180px;
          max-width: 100%;
        }

        .table-qr-status {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .table-qr-url {
          font-size: 11px;
          line-height: 1.4;
          opacity: 0.55;
          word-break: break-all;
        }

        @media (max-width: 600px) {
          .table-qr-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .table-qr-card {
            padding: 14px;
            border-radius: 16px;
          }

          .table-qr-title {
            font-size: 18px;
          }

          .table-qr-image img {
            width: 140px;
            height: 140px;
          }

          .table-qr-url {
            display: none;
          }
        }

        @media print {
          body {
            background: #ffffff !important;
          }

          .header,
          .footer,
          .bottom-nav,
          .qr-actions,
          button {
            display: none !important;
          }

          .site {
            padding: 0 !important;
          }

          .section {
            padding: 10px !important;
          }

          .table-qr-grid {
            grid-template-columns:
              repeat(3, 1fr) !important;
            gap: 12px !important;
          }

          .table-qr-card {
            break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid #cccccc !important;
          }

          .table-qr-image img {
            width: 160px !important;
            height: 160px !important;
          }
        }
      `}</style>
    </main>
  );
}