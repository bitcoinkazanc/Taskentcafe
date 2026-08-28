"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type HeroSettings = {
  id: number;
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  image_url: string;
  updated_at: string;
};

type HomeSection = {
  id: string;
  section_type:
    | "menu"
    | "loyalty"
    | "about"
    | "image"
    | "text"
    | "button"
    | string;
  title: string;
  description: string;
  image_url: string;
  button_text: string;
  button_link: string;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function getSectionIcon(type: string) {
  switch (type) {
    case "menu":
      return "🍽️";

    case "loyalty":
      return "⭐";

    case "about":
      return "☕";

    case "image":
      return "🖼️";

    case "text":
      return "📝";

    case "button":
      return "🔘";

    default:
      return "📦";
  }
}

export default function HomePage() {
  const [hero, setHero] =
    useState<HeroSettings | null>(null);

  const [sections, setSections] =
    useState<HomeSection[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadHomePage();
  }, []);

  async function loadHomePage() {
    try {
      setLoading(true);
      setError("");

      const [
        heroResult,
        sectionsResult,
      ] = await Promise.all([
        supabase
          .from("home_hero")
          .select(
            `
              id,
              enabled,
              title,
              subtitle,
              description,
              button_text,
              button_link,
              image_url,
              updated_at
            `
          )
          .order("id", {
            ascending: true,
          })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("home_sections")
          .select(
            `
              id,
              section_type,
              title,
              description,
              image_url,
              button_text,
              button_link,
              enabled,
              sort_order,
              created_at,
              updated_at
            `
          )
          .eq("enabled", true)
          .order("sort_order", {
            ascending: true,
          })
          .order("created_at", {
            ascending: true,
          }),
      ]);

      if (heroResult.error) {
        console.error(
          "HOME HERO ERROR:",
          heroResult.error
        );

        throw new Error(
          "Ana sayfa üst alanı yüklenemedi: " +
            heroResult.error.message
        );
      }

      if (sectionsResult.error) {
        console.error(
          "HOME SECTIONS ERROR:",
          sectionsResult.error
        );

        throw new Error(
          "Ana sayfa bölümleri yüklenemedi: " +
            sectionsResult.error.message
        );
      }

      setHero(
        heroResult.data as HeroSettings | null
      );

      setSections(
        (sectionsResult.data ||
          []) as HomeSection[]
      );
    } catch (err) {
      console.error(
        "HOME PAGE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Ana sayfa yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="home-page loading-page">
        <div className="loading-card">
          <div className="loading-logo">
            ☕
          </div>

          <strong>
            Taşkent Cafe
          </strong>

          <span>
            Ana sayfa yükleniyor...
          </span>

          <div className="loading-spinner" />
        </div>

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #f7f2ed;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .loading-page {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: #f7f2ed;
          }

          .loading-card {
            width: 100%;
            max-width: 330px;
            padding: 35px 20px;
            border: 1px solid #eadfd5;
            border-radius: 23px;
            background: #ffffff;
            text-align: center;
            box-shadow:
              0 15px 45px
                rgba(61, 42, 29, 0.08);
          }

          .loading-logo {
            width: 62px;
            height: 62px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 19px;
            background: #8b5e3c;
            color: #ffffff;
            font-size: 27px;
          }

          .loading-card strong {
            display: block;
            color: #392a20;
            font-size: 15px;
          }

          .loading-card span {
            display: block;
            margin-top: 6px;
            color: #9b8d82;
            font-size: 10px;
          }

          .loading-spinner {
            width: 22px;
            height: 22px;
            margin: 18px auto 0;
            border: 2px solid #eadfd5;
            border-top-color: #8b5e3c;
            border-radius: 50%;
            animation:
              home-spin 0.8s linear infinite;
          }

          @keyframes home-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  if (error) {
    return (
      <main className="home-page error-page">
        <div className="error-card">
          <div className="error-icon">
            ⚠️
          </div>

          <h1>
            Ana sayfa yüklenemedi
          </h1>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={loadHomePage}
          >
            Tekrar Dene
          </button>
        </div>

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #f7f2ed;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .error-page {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: #f7f2ed;
          }

          .error-card {
            width: 100%;
            max-width: 400px;
            padding: 30px 22px;
            border: 1px solid #eadfd5;
            border-radius: 22px;
            background: #ffffff;
            text-align: center;
            box-shadow:
              0 15px 45px
                rgba(61, 42, 29, 0.08);
          }

          .error-icon {
            width: 58px;
            height: 58px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 17px;
            background: #fff3f1;
            font-size: 25px;
          }

          .error-card h1 {
            margin: 0;
            color: #392a20;
            font-size: 18px;
          }

          .error-card p {
            margin: 9px 0 18px;
            color: #8f8177;
            font-size: 11px;
            line-height: 1.55;
          }

          .error-card button {
            height: 43px;
            padding: 0 20px;
            border: 0;
            border-radius: 12px;
            background: #8b5e3c;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="home-page">

      {hero?.enabled && (
        <section className="hero">

          <div className="hero-content">

            <div className="hero-logo">
              {hero.image_url ? (
                <img
                  src={hero.image_url}
                  alt={
                    hero.title ||
                    "Taşkent Cafe"
                  }
                />
              ) : (
                <span>
                  ☕
                </span>
              )}
            </div>

            {hero.subtitle && (
              <span className="hero-subtitle">
                {hero.subtitle}
              </span>
            )}

            <h1>
              {hero.title ||
                "Taşkent Cafe"}
            </h1>

            {hero.description && (
              <p>
                {hero.description}
              </p>
            )}

            {hero.button_text &&
              hero.button_link && (
                <a
                  href={
                    hero.button_link
                  }
                  className="hero-button"
                >
                  {hero.button_text}

                  <span>
                    →
                  </span>
                </a>
              )}

          </div>

        </section>
      )}

      <div className="content">

        {sections.map(
          (section) => (
            <section
              key={section.id}
              className={
                "content-section section-" +
                section.section_type
              }
              id={
                section.section_type ===
                "menu"
                  ? "menu"
                  : undefined
              }
            >

              {section.section_type ===
                "image" &&
                section.image_url && (
                  <div className="image-section">
                    <img
                      src={
                        section.image_url
                      }
                      alt={
                        section.title ||
                        "Taşkent Cafe"
                      }
                    />

                    {(section.title ||
                      section.description) && (
                      <div className="image-overlay">
                        {section.title && (
                          <h2>
                            {
                              section.title
                            }
                          </h2>
                        )}

                        {section.description && (
                          <p>
                            {
                              section.description
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

              {section.section_type !==
                "image" && (
                <>
                  <div className="section-heading">

                    <div className="section-icon">
                      {getSectionIcon(
                        section.section_type
                      )}
                    </div>

                    <div>
                      {section.title && (
                        <h2>
                          {
                            section.title
                          }
                        </h2>
                      )}

                      <span>
                        {section.section_type ===
                        "menu"
                          ? "MENÜ"
                          : section.section_type ===
                            "loyalty"
                          ? "SADAKAT KULÜBÜ"
                          : section.section_type ===
                            "about"
                          ? "HAKKIMIZDA"
                          : section.section_type ===
                            "button"
                          ? "BAĞLANTI"
                          : "TAŞKENT CAFE"}
                      </span>
                    </div>

                  </div>

                  {section.description && (
                    <p className="section-description">
                      {
                        section.description
                      }
                    </p>
                  )}

                  {section.section_type ===
                    "menu" && (
                    <a
                      href="/menu"
                      className="section-action primary"
                    >
                      {section.button_text ||
                        "Menüyü İncele"}

                      <span>
                        →
                      </span>
                    </a>
                  )}

                  {section.section_type ===
                    "loyalty" &&
                    section.button_text &&
                    section.button_link && (
                      <a
                        href={
                          section.button_link
                        }
                        className="section-action"
                      >
                        {
                          section.button_text
                        }

                        <span>
                          →
                        </span>
                      </a>
                    )}

                  {section.section_type ===
                    "button" &&
                    section.button_text &&
                    section.button_link && (
                      <a
                        href={
                          section.button_link
                        }
                        className="section-action"
                      >
                        {
                          section.button_text
                        }

                        <span>
                          →
                        </span>
                      </a>
                    )}

                  {section.section_type ===
                    "about" &&
                    section.image_url && (
                      <div className="about-image">
                        <img
                          src={
                            section.image_url
                          }
                          alt={
                            section.title ||
                            "Taşkent Cafe"
                          }
                        />
                      </div>
                    )}
                </>
              )}

            </section>
          )
        )}

        {!hero?.enabled &&
          sections.length === 0 && (
            <section className="empty-home">
              <div>
                ☕
              </div>

              <h1>
                Taşkent Cafe
              </h1>

              <p>
                Ana sayfa henüz
                oluşturulmadı.
              </p>
            </section>
          )}

      </div>

      <footer className="home-footer">

        <strong>
          ☕ Taşkent Cafe
        </strong>

        <span>
          Mardin Kale
        </span>

        <small>
          © 2026 Taşkent Cafe
        </small>

      </footer>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #f7f2ed;
          color: #392a20;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;
        }

        a {
          -webkit-tap-highlight-color: transparent;
        }

        .home-page {
          min-height: 100vh;
          min-height: 100dvh;
          background:
            linear-gradient(
              180deg,
              #fffaf5 0%,
              #f7f2ed 38%,
              #f7f2ed 100%
            );
        }

        .hero {
          position: relative;
          min-height: 430px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 55px 20px;
          background:
            radial-gradient(
              circle at 50% 0%,
              #fffdfb 0%,
              #f7eee7 55%,
              #eaded3 100%
            );
          border-bottom:
            1px solid #eadfd5;
        }

        .hero::before {
          content: "";
          position: absolute;
          width: 300px;
          height: 300px;
          top: -160px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 50%;
          background: rgba(
            139,
            94,
            60,
            0.08
          );
        }

        .hero-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 520px;
          text-align: center;
        }

        .hero-logo {
          width: 104px;
          height: 104px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 5px solid #ffffff;
          border-radius: 30px;
          background: #8b5e3c;
          box-shadow:
            0 15px 35px
              rgba(82, 53, 34, 0.16);
        }

        .hero-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #ffffff;
        }

        .hero-logo span {
          color: #ffffff;
          font-size: 43px;
        }

        .hero-subtitle {
          display: block;
          margin-bottom: 7px;
          color: #b56d38;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .hero h1 {
          margin: 0;
          color: #392a20;
          font-size: 36px;
          line-height: 1.08;
          font-weight: 950;
          letter-spacing: -1px;
        }

        .hero p {
          max-width: 390px;
          margin: 12px auto 0;
          color: #8f8177;
          font-size: 12px;
          line-height: 1.65;
        }

        .hero-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 46px;
          margin-top: 21px;
          padding: 0 20px;
          border-radius: 13px;
          background: #8b5e3c;
          color: #ffffff;
          text-decoration: none;
          font-size: 11px;
          font-weight: 900;
          box-shadow:
            0 9px 22px
              rgba(139, 94, 60, 0.2);
        }

        .hero-button span {
          font-size: 17px;
        }

        .content {
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          padding: 25px 17px 35px;
        }

        .content-section {
          margin-bottom: 15px;
          padding: 21px;
          border: 1px solid #e9ded5;
          border-radius: 20px;
          background: #ffffff;
          box-shadow:
            0 6px 22px
              rgba(61, 42, 29, 0.045);
        }

        .section-heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-icon {
          width: 47px;
          height: 47px;
          flex: 0 0 47px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: #f6ebe2;
          font-size: 22px;
        }

        .section-heading h2 {
          margin: 0;
          color: #392a20;
          font-size: 18px;
          font-weight: 900;
        }

        .section-heading span {
          display: block;
          margin-top: 4px;
          color: #b08060;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.3px;
        }

        .section-description {
          margin: 14px 0 0;
          color: #8f8177;
          font-size: 11px;
          line-height: 1.65;
        }

        .section-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 43px;
          margin-top: 16px;
          padding: 0 14px;
          border: 1px solid #e5d8ce;
          border-radius: 12px;
          background: #fffaf6;
          color: #76563f;
          text-decoration: none;
          font-size: 10px;
          font-weight: 850;
        }

        .section-action.primary {
          border-color: #8b5e3c;
          background: #8b5e3c;
          color: #ffffff;
        }

        .section-action span {
          font-size: 16px;
        }

        .image-section {
          position: relative;
          min-height: 230px;
          margin: -21px;
          overflow: hidden;
          border-radius: 20px;
        }

        .image-section img {
          width: 100%;
          height: 100%;
          min-height: 230px;
          display: block;
          object-fit: cover;
        }

        .image-overlay {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          padding: 45px 20px 20px;
          background:
            linear-gradient(
              transparent,
              rgba(30, 20, 14, 0.76)
            );
          color: #ffffff;
        }

        .image-overlay h2 {
          margin: 0;
          font-size: 19px;
          font-weight: 900;
        }

        .image-overlay p {
          margin: 5px 0 0;
          color: rgba(
            255,
            255,
            255,
            0.86
          );
          font-size: 10px;
          line-height: 1.5;
        }

        .about-image {
          margin-top: 15px;
          overflow: hidden;
          border-radius: 14px;
        }

        .about-image img {
          width: 100%;
          max-height: 260px;
          display: block;
          object-fit: cover;
        }

        .empty-home {
          padding: 70px 20px;
          text-align: center;
        }

        .empty-home > div {
          font-size: 45px;
        }

        .empty-home h1 {
          margin: 12px 0 0;
          color: #392a20;
          font-size: 22px;
        }

        .empty-home p {
          margin: 7px 0 0;
          color: #96887d;
          font-size: 11px;
        }

        .home-footer {
          padding: 15px 18px 30px;
          text-align: center;
        }

        .home-footer strong,
        .home-footer span,
        .home-footer small {
          display: block;
        }

        .home-footer strong {
          color: #80644f;
          font-size: 11px;
        }

        .home-footer span {
          margin-top: 4px;
          color: #a4968a;
          font-size: 9px;
        }

        .home-footer small {
          margin-top: 5px;
          color: #b1a59b;
          font-size: 8px;
        }

        @media (max-width: 600px) {
          .hero {
            min-height: 390px;
            padding:
              45px
              18px;
          }

          .hero-logo {
            width: 90px;
            height: 90px;
            border-radius: 26px;
          }

          .hero h1 {
            font-size: 31px;
          }

          .content {
            padding:
              20px
              13px
              30px;
          }

          .content-section {
            padding: 18px;
            border-radius: 18px;
          }

          .image-section {
            margin: -18px;
            border-radius: 18px;
          }
        }
      `}</style>
    </main>
  );
}