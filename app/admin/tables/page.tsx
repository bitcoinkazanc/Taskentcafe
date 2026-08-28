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
        <section className="tables-page-state">
          <div className="state-icon">▦</div>
          <strong>Masalar yükleniyor</strong>
        </section>

        <style jsx global>{`
          .tables-page-state {
            min-height: 65vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: #392a20;
          }

          .state-icon {
            width: 58px;
            height: 58px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 14px;
            border-radius: 17px;
            background: #f7eee7;
            color: #a96334;
            font-size: 26px;
          }

          .tables-page-state strong {
            font-size: 15px;
            font-weight: 900;
          }
        `}</style>
      </main>
    );
  }

  if (error) {
    return (
      <main className="site">
        <section className="tables-error-page">
          <div className="tables-error-card">
            <div className="error-icon">!</div>

            <h2>İşlem gerçekleştirilemedi</h2>

            <p>{error}</p>

            <button
              type="button"
              className="retry-button"
              onClick={loadTables}
            >
              Tekrar Dene
            </button>
          </div>
        </section>

        <style jsx global>{`
          .tables-error-page {
            min-height: 65vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }

          .tables-error-card {
            width: 100%;
            max-width: 390px;
            padding: 30px 22px;
            border: 1px solid #eadfd7;
            border-radius: 22px;
            background: #ffffff;
            text-align: center;
            box-shadow: 0 10px 30px rgba(55, 38, 25, 0.06);
          }

          .error-icon {
            width: 52px;
            height: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 14px;
            border-radius: 16px;
            background: #fff1ed;
            color: #a35e50;
            font-size: 22px;
            font-weight: 900;
          }

          .tables-error-card h2 {
            margin: 0;
            color: #392a20;
            font-size: 17px;
            font-weight: 900;
          }

          .tables-error-card p {
            margin: 8px 0 20px;
            color: #8f8176;
            font-size: 10px;
            line-height: 1.5;
          }

          .retry-button {
            min-height: 43px;
            padding: 0 20px;
            border: 0;
            border-radius: 11px;
            background: #b66d36;
            color: #ffffff;
            font-size: 10px;
            font-weight: 900;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="site">
      <header className="tables-header">
        <div className="tables-header-title">
          <span>YÖNETİM</span>

          <h1>Masa QR Kodları</h1>
        </div>

        <a
          href="/admin"
          className="tables-back-button"
          aria-label="Yönetim paneline dön"
        >
          <span>←</span>
        </a>
      </header>

      <section className="tables-section">
        <div className="tables-toolbar">
          <div className="tables-summary">
            <strong>{tables.length}</strong>
            <span>Masa</span>
          </div>

          <button
            type="button"
            className="print-button"
            onClick={printTables}
          >
            <span>▣</span>
            QR Yazdır
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
                <div className="table-card-top">
                  <div className="table-number">
                    {table.table_number}
                  </div>

                  <div
                    className={
                      table.active
                        ? "table-status active"
                        : "table-status passive"
                    }
                  >
                    <i />
                    {table.active
                      ? "Aktif"
                      : "Pasif"}
                  </div>
                </div>

                <div className="table-qr-image">
                  <img
                    src={qrImageUrl}
                    alt={`Masa ${table.table_number} QR kodu`}
                  />
                </div>

                <div className="table-card-footer">
                  <span>MASA</span>

                  <strong>
                    {table.table_number}
                  </strong>
                </div>

                <div className="table-qr-url">
                  {tableUrl}
                </div>
              </article>
            );
          })}
        </div>

        {tables.length === 0 && (
          <div className="empty-tables">
            <div>▦</div>
            <strong>Henüz masa bulunmuyor</strong>
          </div>
        )}
      </section>

      <style jsx global>{`
        .tables-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 18px 17px;
          border-bottom: 1px solid #eee5dd;
          background: #ffffff;
        }

        .tables-header-title span {
          display: block;
          margin-bottom: 4px;
          color: #b66d36;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .tables-header-title h1 {
          margin: 0;
          color: #33251c;
          font-size: 21px;
          line-height: 1.15;
          font-weight: 900;
          letter-spacing: -0.4px;
        }

        .tables-back-button {
          width: 43px;
          height: 43px;
          flex: 0 0 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e4d8cd;
          border-radius: 13px;
          background: #fffaf6;
          color: #4a382c;
          text-decoration: none;
          box-shadow: 0 4px 13px rgba(55, 38, 25, 0.06);
        }

        .tables-back-button span {
          font-size: 22px;
          line-height: 1;
        }

        .tables-section {
          padding: 20px 18px 42px;
        }

        .tables-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 17px;
        }

        .tables-summary {
          display: flex;
          align-items: baseline;
          gap: 5px;
        }

        .tables-summary strong {
          color: #392a20;
          font-size: 19px;
          font-weight: 900;
        }

        .tables-summary span {
          color: #91847a;
          font-size: 10px;
          font-weight: 700;
        }

        .print-button {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 14px;
          border: 1px solid #dccabc;
          border-radius: 11px;
          background: #fffaf6;
          color: #5b4231;
          font-size: 9px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(55, 38, 25, 0.04);
        }

        .print-button span {
          font-size: 13px;
        }

        .table-qr-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(220px, 1fr)
          );
          gap: 16px;
        }

        .table-qr-card {
          overflow: hidden;
          border: 1px solid #e8ddd4;
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 7px 24px rgba(60, 39, 25, 0.055);
        }

        .table-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 15px 15px 12px;
        }

        .table-number {
          color: #35271f;
          font-size: 18px;
          font-weight: 900;
        }

        .table-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 8px;
          font-size: 8px;
          font-weight: 900;
        }

        .table-status i {
          width: 6px;
          height: 6px;
          display: block;
          border-radius: 50%;
        }

        .table-status.active {
          background: #edf7ef;
          color: #477451;
        }

        .table-status.active i {
          background: #4e965d;
        }

        .table-status.passive {
          background: #f8eeee;
          color: #985c53;
        }

        .table-status.passive i {
          background: #a9685d;
        }

        .table-qr-image {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 12px;
          padding: 13px;
          border-radius: 15px;
          background: #ffffff;
          border: 1px solid #f0e8e2;
        }

        .table-qr-image img {
          display: block;
          width: 180px;
          height: 180px;
          max-width: 100%;
          object-fit: contain;
        }

        .table-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 15px;
          border-top: 1px solid #f0e8e2;
        }

        .table-card-footer span {
          color: #a08f82;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.1px;
        }

        .table-card-footer strong {
          color: #b66d36;
          font-size: 10px;
          font-weight: 900;
        }

        .table-qr-url {
          display: none;
        }

        .empty-tables {
          padding: 45px 20px;
          border: 1px dashed #ded1c6;
          border-radius: 18px;
          background: #fffdfb;
          text-align: center;
        }

        .empty-tables > div {
          margin-bottom: 8px;
          color: #b98258;
          font-size: 28px;
        }

        .empty-tables strong {
          color: #4a392e;
          font-size: 11px;
        }

        @media (max-width: 600px) {
          .tables-header {
            padding: 17px 15px 15px;
          }

          .tables-header-title h1 {
            font-size: 19px;
          }

          .tables-section {
            padding: 17px 15px 35px;
          }

          .table-qr-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .table-qr-card {
            border-radius: 16px;
          }

          .table-card-top {
            padding: 11px 11px 9px;
          }

          .table-number {
            font-size: 15px;
          }

          .table-status {
            padding: 4px 6px;
            font-size: 7px;
          }

          .table-qr-image {
            margin: 0 8px;
            padding: 8px;
            border-radius: 11px;
          }

          .table-qr-image img {
            width: 135px;
            height: 135px;
          }

          .table-card-footer {
            padding: 9px 11px;
          }

          .table-card-footer span {
            font-size: 6px;
          }

          .table-card-footer strong {
            font-size: 9px;
          }

          .print-button {
            min-height: 37px;
            padding: 0 11px;
          }
        }

        @media print {
          body {
            background: #ffffff !important;
          }

          .tables-header,
          .tables-toolbar,
          .bottom-nav,
          button {
            display: none !important;
          }

          .site {
            padding: 0 !important;
          }

          .tables-section {
            padding: 10px !important;
          }

          .table-qr-grid {
            grid-template-columns: repeat(3, 1fr) !important;
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

          .table-qr-url {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}