"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type HeroSettings = {
  id: number;
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
};

type SectionType =
  | "menu"
  | "loyalty"
  | "about"
  | "image"
  | "text"
  | "button";

type Section = {
  id: string;
  type: SectionType;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  enabled: boolean;
  sortOrder: number;
};

const defaultHero: HeroSettings = {
  id: 1,
  enabled: true,
  title: "Taşkent Cafe",
  subtitle: "Mardin Kale",
  description: "Keyfinize keyif katıyoruz.",
  buttonText: "Menüyü İncele",
  buttonLink: "#menu",
  imageUrl:
    "https://raw.githubusercontent.com/bitcoinkazanc/Taskentcafe/main/taskent-logo.png",
};

const defaultSections: Section[] = [
  {
    id: "default-1",
    type: "menu",
    title: "Menümüz",
    description: "Lezzetli seçeneklerimizi keşfedin.",
    imageUrl: "",
    buttonText: "",
    buttonLink: "",
    enabled: true,
    sortOrder: 1,
  },
  {
    id: "default-2",
    type: "loyalty",
    title: "Sadakat Kulübü",
    description:
      "Alışverişlerinden puan kazan, avantajları kaçırma.",
    imageUrl: "",
    buttonText: "Kulübe Katıl",
    buttonLink: "/loyalty",
    enabled: true,
    sortOrder: 2,
  },
  {
    id: "default-3",
    type: "about",
    title: "Taşkent Cafe",
    description:
      "Mardin Kalesi'nde keyifli anlar için sizleri bekliyoruz.",
    imageUrl: "",
    buttonText: "",
    buttonLink: "",
    enabled: true,
    sortOrder: 3,
  },
];

function getSectionIcon(type: SectionType) {
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

function getSectionName(type: SectionType) {
  switch (type) {
    case "menu":
      return "Menü";
    case "loyalty":
      return "Sadakat Kulübü";
    case "about":
      return "Hakkımızda";
    case "image":
      return "Görsel";
    case "text":
      return "Metin";
    case "button":
      return "Buton";
    default:
      return "Bölüm";
  }
}

export default function AdminHomePage() {
  const [hero, setHero] =
    useState<HeroSettings>(defaultHero);

  const [sections, setSections] =
    useState<Section[]>([]);

  const [editingSection, setEditingSection] =
    useState<Section | null>(null);

  const [showAddSection, setShowAddSection] =
    useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHomeSettings();
  }, []);

  async function loadHomeSettings() {
    try {
      setLoading(true);
      setError("");

      const {
        data: heroData,
        error: heroError,
      } = await supabase
        .from("home_hero")
        .select(
          "id, enabled, title, subtitle, description, button_text, button_link, image_url"
        )
        .eq("id", 1)
        .maybeSingle();

      if (heroError) {
        throw new Error(
          "Ana sayfa üst alanı yüklenemedi: " +
            heroError.message
        );
      }

      const {
        data: sectionData,
        error: sectionError,
      } = await supabase
        .from("home_sections")
        .select(
          "id, section_type, title, description, image_url, button_text, button_link, enabled, sort_order"
        )
        .order("sort_order", {
          ascending: true,
        });

      if (sectionError) {
        throw new Error(
          "Ana sayfa bölümleri yüklenemedi: " +
            sectionError.message
        );
      }

      if (heroData) {
        setHero({
          id: Number(heroData.id),
          enabled: Boolean(heroData.enabled),
          title: heroData.title ?? "",
          subtitle: heroData.subtitle ?? "",
          description:
            heroData.description ?? "",
          buttonText:
            heroData.button_text ?? "",
          buttonLink:
            heroData.button_link ?? "",
          imageUrl:
            heroData.image_url ?? "",
        });
      } else {
        setHero(defaultHero);
      }

      if (sectionData) {
        setSections(
          sectionData.map((section) => ({
            id: String(section.id),
            type: section.section_type as SectionType,
            title: section.title ?? "",
            description:
              section.description ?? "",
            imageUrl:
              section.image_url ?? "",
            buttonText:
              section.button_text ?? "",
            buttonLink:
              section.button_link ?? "",
            enabled: Boolean(section.enabled),
            sortOrder:
              Number(section.sort_order) || 0,
          }))
        );
      } else {
        setSections([]);
      }
    } catch (err) {
      console.error(
        "HOME SETTINGS LOAD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Ana sayfa ayarları yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const {
        error: heroError,
      } = await supabase
        .from("home_hero")
        .upsert(
          {
            id: 1,
            enabled: hero.enabled,
            title: hero.title,
            subtitle: hero.subtitle,
            description: hero.description,
            button_text: hero.buttonText,
            button_link: hero.buttonLink,
            image_url: hero.imageUrl,
          },
          {
            onConflict: "id",
          }
        );

      if (heroError) {
        throw new Error(
          "Üst alan kaydedilemedi: " +
            heroError.message
        );
      }

      const {
        data: existingSections,
        error: existingError,
      } = await supabase
        .from("home_sections")
        .select("id");

      if (existingError) {
        throw new Error(
          "Mevcut bölümler kontrol edilemedi: " +
            existingError.message
        );
      }

      const currentIds = new Set(
        sections.map((section) => section.id)
      );

      const idsToDelete =
        existingSections
          ?.map((section) => String(section.id))
          .filter(
            (id) => !currentIds.has(id)
          ) ?? [];

      if (idsToDelete.length > 0) {
        const {
          error: deleteError,
        } = await supabase
          .from("home_sections")
          .delete()
          .in("id", idsToDelete);

        if (deleteError) {
          throw new Error(
            "Silinen bölümler kaydedilemedi: " +
              deleteError.message
          );
        }
      }

      if (sections.length > 0) {
        const rows = sections.map(
          (section, index) => ({
            id: section.id,
            section_type: section.type,
            title: section.title,
            description:
              section.description,
            image_url:
              section.imageUrl,
            button_text:
              section.buttonText,
            button_link:
              section.buttonLink,
            enabled:
              section.enabled,
            sort_order: index + 1,
          })
        );

        const {
          error: sectionsError,
        } = await supabase
          .from("home_sections")
          .upsert(rows, {
            onConflict: "id",
          });

        if (sectionsError) {
          throw new Error(
            "Ana sayfa bölümleri kaydedilemedi: " +
              sectionsError.message
          );
        }
      }

      setSections((current) =>
        current.map((section, index) => ({
          ...section,
          sortOrder: index + 1,
        }))
      );

      setMessage(
        "Ana sayfa ayarları Supabase'e kaydedildi."
      );

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      console.error(
        "HOME SETTINGS SAVE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Ana sayfa ayarları kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  async function resetPage() {
    const confirmed = window.confirm(
      "Ana sayfa düzenini varsayılan hale getirmek istediğinize emin misiniz?"
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const {
        error: heroError,
      } = await supabase
        .from("home_hero")
        .upsert(
          {
            id: 1,
            enabled: defaultHero.enabled,
            title: defaultHero.title,
            subtitle:
              defaultHero.subtitle,
            description:
              defaultHero.description,
            button_text:
              defaultHero.buttonText,
            button_link:
              defaultHero.buttonLink,
            image_url:
              defaultHero.imageUrl,
          },
          {
            onConflict: "id",
          }
        );

      if (heroError) {
        throw new Error(
          "Üst alan sıfırlanamadı: " +
            heroError.message
        );
      }

      const {
        error: deleteError,
      } = await supabase
        .from("home_sections")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (deleteError) {
        throw new Error(
          "Bölümler sıfırlanamadı: " +
            deleteError.message
        );
      }

      const rows = defaultSections.map(
        (section, index) => ({
          section_type:
            section.type,
          title: section.title,
          description:
            section.description,
          image_url:
            section.imageUrl,
          button_text:
            section.buttonText,
          button_link:
            section.buttonLink,
          enabled:
            section.enabled,
          sort_order: index + 1,
        })
      );

      const {
        data: insertedSections,
        error: insertError,
      } = await supabase
        .from("home_sections")
        .insert(rows)
        .select(
          "id, section_type, title, description, image_url, button_text, button_link, enabled, sort_order"
        );

      if (insertError) {
        throw new Error(
          "Varsayılan bölümler oluşturulamadı: " +
            insertError.message
        );
      }

      setHero(defaultHero);

      setSections(
        (insertedSections ?? []).map(
          (section) => ({
            id: String(section.id),
            type: section.section_type as SectionType,
            title: section.title ?? "",
            description:
              section.description ?? "",
            imageUrl:
              section.image_url ?? "",
            buttonText:
              section.button_text ?? "",
            buttonLink:
              section.button_link ?? "",
            enabled: Boolean(
              section.enabled
            ),
            sortOrder:
              Number(
                section.sort_order
              ) || 0,
          })
        )
      );

      setEditingSection(null);

      setMessage(
        "Ana sayfa varsayılan hale getirildi."
      );

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      console.error(
        "HOME RESET ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Ana sayfa sıfırlanamadı."
      );
    } finally {
      setSaving(false);
    }
  }

  function moveSection(
    index: number,
    direction: "up" | "down"
  ) {
    const newSections = [...sections];

    const targetIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= newSections.length
    ) {
      return;
    }

    const current =
      newSections[index];

    newSections[index] =
      newSections[targetIndex];

    newSections[targetIndex] =
      current;

    setSections(
      newSections.map(
        (section, sectionIndex) => ({
          ...section,
          sortOrder:
            sectionIndex + 1,
        })
      )
    );
  }

  function toggleSection(id: string) {
    setSections((current) =>
      current.map((section) =>
        section.id === id
          ? {
              ...section,
              enabled:
                !section.enabled,
            }
          : section
      )
    );
  }

  function deleteSection(id: string) {
    const confirmed = window.confirm(
      "Bu bölümü ana sayfa yapısından kaldırmak istiyor musunuz?"
    );

    if (!confirmed) return;

    setSections((current) =>
      current
        .filter(
          (section) =>
            section.id !== id
        )
        .map(
          (section, index) => ({
            ...section,
            sortOrder: index + 1,
          })
        )
    );

    if (
      editingSection?.id === id
    ) {
      setEditingSection(null);
    }
  }

  function addSection(
    type: SectionType
  ) {
    const newSection: Section = {
      id:
        crypto.randomUUID(),
      type,
      title:
        type === "menu"
          ? "Menümüz"
          : type === "loyalty"
          ? "Sadakat Kulübü"
          : type === "about"
          ? "Hakkımızda"
          : type === "image"
          ? "Görsel"
          : type === "button"
          ? "Yeni Buton"
          : "Yeni Bölüm",
      description: "",
      imageUrl: "",
      buttonText:
        type === "button"
          ? "Detayları Gör"
          : type === "loyalty"
          ? "Kulübe Katıl"
          : "",
      buttonLink:
        type === "button"
          ? "#"
          : type === "loyalty"
          ? "/loyalty"
          : "",
      enabled: true,
      sortOrder:
        sections.length + 1,
    };

    setSections((current) => [
      ...current,
      newSection,
    ]);

    setShowAddSection(false);
    setEditingSection(newSection);
  }

  function updateEditingSection(
    field: keyof Section,
    value: string | boolean
  ) {
    if (!editingSection) return;

    const updated = {
      ...editingSection,
      [field]: value,
    };

    setEditingSection(updated);

    setSections((current) =>
      current.map((section) =>
        section.id === updated.id
          ? updated
          : section
      )
    );
  }

  if (loading) {
    return (
      <main className="loading-page">
        <div className="loading-card">
          <div className="loading-logo">
            ☕
          </div>

          <strong>
            Ana Sayfa Yönetimi
          </strong>

          <span>
            Ayarlar Supabase'den yükleniyor...
          </span>
        </div>

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #f6f1ec;
            font-family:
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          .loading-page {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: #f6f1ec;
          }

          .loading-card {
            width: 100%;
            max-width: 330px;
            padding: 34px 20px;
            border: 1px solid #e7dcd3;
            border-radius: 20px;
            background: #fffdfb;
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
            color: #fff;
            font-size: 27px;
          }

          .loading-card strong {
            display: block;
            color: #392a20;
            font-size: 14px;
          }

          .loading-card span {
            display: block;
            margin-top: 6px;
            color: #9b8d82;
            font-size: 10px;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">
            YÖNETİM PANELİ
          </span>

          <h1>
            Ana Sayfa Yönetimi
          </h1>

          <p>
            Ziyaretçilerin göreceği ana
            sayfanın yapısını buradan
            oluşturun ve düzenleyin.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="reset-button"
            onClick={resetPage}
            disabled={saving}
          >
            Sıfırla
          </button>

          <button
            type="button"
            className="save-button"
            onClick={saveChanges}
            disabled={saving}
          >
            {saving
              ? "Kaydediliyor..."
              : "Kaydet"}
          </button>
        </div>
      </div>

      {message && (
        <div className="success-message">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <section className="admin-card">
        <div className="card-header">
          <div>
            <span className="card-icon">
              🏠
            </span>

            <div>
              <h2>Üst Alan</h2>

              <p>
                Ana sayfanın en üstünde
                görünecek bölüm.
              </p>
            </div>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={hero.enabled}
              onChange={(event) =>
                setHero({
                  ...hero,
                  enabled:
                    event.target.checked,
                })
              }
            />

            <span />
          </label>
        </div>

        <div className="form-grid">
          <label>
            <span>Başlık</span>

            <input
              value={hero.title}
              onChange={(event) =>
                setHero({
                  ...hero,
                  title:
                    event.target.value,
                })
              }
              placeholder="Ana başlık"
            />
          </label>

          <label>
            <span>Alt başlık</span>

            <input
              value={hero.subtitle}
              onChange={(event) =>
                setHero({
                  ...hero,
                  subtitle:
                    event.target.value,
                })
              }
              placeholder="Alt başlık"
            />
          </label>

          <label className="full">
            <span>Açıklama</span>

            <textarea
              value={
                hero.description
              }
              onChange={(event) =>
                setHero({
                  ...hero,
                  description:
                    event.target.value,
                })
              }
              placeholder="Ana sayfa açıklaması"
            />
          </label>

          <label>
            <span>Buton yazısı</span>

            <input
              value={
                hero.buttonText
              }
              onChange={(event) =>
                setHero({
                  ...hero,
                  buttonText:
                    event.target.value,
                })
              }
              placeholder="Menüyü İncele"
            />
          </label>

          <label>
            <span>
              Buton bağlantısı
            </span>

            <input
              value={
                hero.buttonLink
              }
              onChange={(event) =>
                setHero({
                  ...hero,
                  buttonLink:
                    event.target.value,
                })
              }
              placeholder="#menu"
            />
          </label>

          <label className="full">
            <span>
              Logo / Görsel URL
            </span>

            <input
              value={hero.imageUrl}
              onChange={(event) =>
                setHero({
                  ...hero,
                  imageUrl:
                    event.target.value,
                })
              }
              placeholder="https://..."
            />
          </label>
        </div>
      </section>

      <section className="admin-card">
        <div className="card-title-row">
          <div>
            <span className="eyebrow">
              SAYFA YAPISI
            </span>

            <h2>
              Ana Sayfa Bölümleri
            </h2>

            <p>
              Bölümlerin sırasını
              değiştirin, açıp kapatın
              veya düzenleyin.
            </p>
          </div>

          <button
            type="button"
            className="add-button"
            onClick={() =>
              setShowAddSection(
                (value) => !value
              )
            }
          >
            + Bölüm Ekle
          </button>
        </div>

        {showAddSection && (
          <div className="add-section">
            <button
              type="button"
              onClick={() =>
                addSection("menu")
              }
            >
              🍽️ Menü
            </button>

            <button
              type="button"
              onClick={() =>
                addSection("loyalty")
              }
            >
              ⭐ Sadakat
            </button>

            <button
              type="button"
              onClick={() =>
                addSection("about")
              }
            >
              ☕ Hakkımızda
            </button>

            <button
              type="button"
              onClick={() =>
                addSection("image")
              }
            >
              🖼️ Görsel
            </button>

            <button
              type="button"
              onClick={() =>
                addSection("text")
              }
            >
              📝 Metin
            </button>

            <button
              type="button"
              onClick={() =>
                addSection("button")
              }
            >
              🔘 Buton
            </button>
          </div>
        )}

        <div className="sections">
          {sections.map(
            (section, index) => (
              <div
                className={
                  section.enabled
                    ? "section-item"
                    : "section-item disabled"
                }
                key={section.id}
              >
                <div className="section-number">
                  {index + 1}
                </div>

                <div className="section-icon">
                  {getSectionIcon(
                    section.type
                  )}
                </div>

                <div className="section-info">
                  <strong>
                    {section.title ||
                      "Adsız Bölüm"}
                  </strong>

                  <span>
                    {getSectionName(
                      section.type
                    )}
                  </span>
                </div>

                <div className="section-actions">
                  <button
                    type="button"
                    onClick={() =>
                      moveSection(
                        index,
                        "up"
                      )
                    }
                    disabled={
                      index === 0
                    }
                    aria-label="Yukarı taşı"
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      moveSection(
                        index,
                        "down"
                      )
                    }
                    disabled={
                      index ===
                      sections.length - 1
                    }
                    aria-label="Aşağı taşı"
                  >
                    ↓
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingSection(
                        section
                      )
                    }
                  >
                    Düzenle
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      deleteSection(
                        section.id
                      )
                    }
                  >
                    Sil
                  </button>
                </div>

                <label className="switch small">
                  <input
                    type="checkbox"
                    checked={
                      section.enabled
                    }
                    onChange={() =>
                      toggleSection(
                        section.id
                      )
                    }
                  />

                  <span />
                </label>
              </div>
            )
          )}
        </div>

        {sections.length === 0 && (
          <div className="empty">
            <span>🏠</span>

            <strong>
              Henüz bölüm eklenmedi.
            </strong>

            <p>
              Yukarıdaki "Bölüm Ekle"
              butonunu kullanarak ana
              sayfanızı oluşturmaya
              başlayın.
            </p>
          </div>
        )}
      </section>

      {editingSection && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setEditingSection(null)
          }
        >
          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span>
                  {getSectionIcon(
                    editingSection.type
                  )}{" "}
                  {getSectionName(
                    editingSection.type
                  )}
                </span>

                <h2>
                  Bölümü Düzenle
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditingSection(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <label>
                <span>Başlık</span>

                <input
                  value={
                    editingSection.title
                  }
                  onChange={(event) =>
                    updateEditingSection(
                      "title",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Açıklama
                </span>

                <textarea
                  value={
                    editingSection.description
                  }
                  onChange={(event) =>
                    updateEditingSection(
                      "description",
                      event.target.value
                    )
                  }
                />
              </label>

              {(editingSection.type ===
                "image" ||
                editingSection.type ===
                  "about") && (
                <label>
                  <span>
                    Görsel URL
                  </span>

                  <input
                    value={
                      editingSection.imageUrl
                    }
                    onChange={(event) =>
                      updateEditingSection(
                        "imageUrl",
                        event.target.value
                      )
                    }
                    placeholder="https://..."
                  />
                </label>
              )}

              {(editingSection.type ===
                "button" ||
                editingSection.type ===
                  "loyalty") && (
                <>
                  <label>
                    <span>
                      Buton yazısı
                    </span>

                    <input
                      value={
                        editingSection.buttonText
                      }
                      onChange={(event) =>
                        updateEditingSection(
                          "buttonText",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Buton bağlantısı
                    </span>

                    <input
                      value={
                        editingSection.buttonLink
                      }
                      onChange={(event) =>
                        updateEditingSection(
                          "buttonLink",
                          event.target.value
                        )
                      }
                      placeholder="/loyalty"
                    />
                  </label>
                </>
              )}

              <div className="preview-box">
                <span>
                  Önizleme
                </span>

                <strong>
                  {editingSection.title ||
                    "Adsız Bölüm"}
                </strong>

                {editingSection.description && (
                  <p>
                    {
                      editingSection.description
                    }
                  </p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="cancel-button"
                onClick={() =>
                  setEditingSection(
                    null
                  )
                }
              >
                Kapat
              </button>

              <button
                type="button"
                className="save-button"
                onClick={() => {
                  setEditingSection(
                    null
                  );

                  setMessage(
                    "Bölüm güncellendi. Değişiklikleri kalıcı yapmak için Kaydet'e basın."
                  );

                  setTimeout(() => {
                    setMessage("");
                  }, 2500);
                }}
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f6f1ec;
          color: #352920;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button,
        input,
        textarea {
          font-family: inherit;
        }

        button {
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .admin-page {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
          padding: 30px 22px 80px;
        }

        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .eyebrow {
          display: block;
          color: #9b6844;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.8px;
        }

        .page-header h1 {
          margin: 7px 0 6px;
          font-size: 29px;
          letter-spacing: -0.7px;
        }

        .page-header p,
        .card-title-row p,
        .card-header p {
          margin: 0;
          color: #95867b;
          font-size: 12px;
          line-height: 1.5;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .save-button,
        .reset-button,
        .add-button {
          min-height: 40px;
          padding: 0 16px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 850;
        }

        .save-button {
          border: 0;
          background: #3c2b21;
          color: #fff;
        }

        .reset-button {
          border: 1px solid #e2d7ce;
          background: #fff;
          color: #735e50;
        }

        .success-message {
          margin-bottom: 16px;
          padding: 12px 14px;
          border-radius: 11px;
          background: #e7f3e9;
          color: #39704a;
          font-size: 11px;
          font-weight: 750;
        }

        .error-message {
          margin-bottom: 16px;
          padding: 12px 14px;
          border: 1px solid #f0d2ce;
          border-radius: 11px;
          background: #fff3f1;
          color: #a34239;
          font-size: 11px;
          font-weight: 750;
        }

        .admin-card {
          margin-bottom: 18px;
          padding: 20px;
          border: 1px solid #e7dcd3;
          border-radius: 18px;
          background: #fffdfb;
          box-shadow:
            0 5px 20px
              rgba(62, 41, 27, 0.045);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
        }

        .card-header > div {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .card-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f4e9df;
          font-size: 19px;
        }

        .card-header h2,
        .card-title-row h2 {
          margin: 0 0 4px;
          font-size: 16px;
        }

        .form-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        label > span {
          display: block;
          margin-bottom: 6px;
          color: #665448;
          font-size: 10px;
          font-weight: 800;
        }

        input,
        textarea {
          width: 100%;
          border: 1px solid #e2d7ce;
          border-radius: 10px;
          outline: none;
          background: #fff;
          color: #352920;
          font-size: 11px;
        }

        input {
          height: 40px;
          padding: 0 12px;
        }

        textarea {
          min-height: 80px;
          padding: 11px 12px;
          resize: vertical;
        }

        input:focus,
        textarea:focus {
          border-color: #ae7b58;
          box-shadow:
            0 0 0 3px
              rgba(174, 123, 88, 0.1);
        }

        .full {
          grid-column: 1 / -1;
        }

        .switch {
          position: relative;
          display: inline-flex;
          width: 43px;
          height: 24px;
          flex: 0 0 43px;
        }

        .switch input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .switch span {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background: #d8cec6;
          transition: 0.2s;
        }

        .switch span::after {
          content: "";
          position: absolute;
          width: 18px;
          height: 18px;
          top: 3px;
          left: 3px;
          border-radius: 50%;
          background: #fff;
          box-shadow:
            0 1px 4px
              rgba(0, 0, 0, 0.18);
          transition: 0.2s;
        }

        .switch input:checked + span {
          background: #8b5e3c;
        }

        .switch input:checked + span::after {
          transform: translateX(19px);
        }

        .switch.small {
          width: 37px;
          height: 21px;
          flex-basis: 37px;
        }

        .switch.small span::after {
          width: 15px;
          height: 15px;
          top: 3px;
          left: 3px;
        }

        .switch.small
          input:checked
          + span::after {
          transform: translateX(16px);
        }

        .card-title-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .add-button {
          border: 0;
          background: #f0e3d8;
          color: #5b402f;
        }

        .add-section {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 15px;
          padding: 12px;
          border: 1px solid #eadfd6;
          border-radius: 12px;
          background: #faf5f0;
        }

        .add-section button {
          min-height: 40px;
          border: 1px solid #e4d8cf;
          border-radius: 9px;
          background: #fff;
          color: #604b3d;
          font-size: 10px;
          font-weight: 750;
        }

        .sections {
          display: grid;
          gap: 8px;
        }

        .section-item {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 65px;
          padding: 9px 10px;
          border: 1px solid #e7ddd5;
          border-radius: 12px;
          background: #fff;
        }

        .section-item.disabled {
          opacity: 0.5;
        }

        .section-number {
          width: 27px;
          height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #f1e7df;
          color: #755b49;
          font-size: 10px;
          font-weight: 850;
        }

        .section-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #faf3ed;
          font-size: 17px;
        }

        .section-info {
          flex: 1;
          min-width: 100px;
        }

        .section-info strong {
          display: block;
          color: #3c2d24;
          font-size: 11px;
        }

        .section-info span {
          display: block;
          margin-top: 3px;
          color: #9a897d;
          font-size: 8px;
        }

        .section-actions {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .section-actions button {
          min-width: 31px;
          height: 30px;
          padding: 0 7px;
          border: 1px solid #e5dad1;
          border-radius: 8px;
          background: #fff;
          color: #685345;
          font-size: 9px;
          font-weight: 750;
        }

        .section-actions button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .section-actions .danger {
          color: #a34e45;
        }

        .empty {
          padding: 35px 15px;
          text-align: center;
        }

        .empty span {
          display: block;
          margin-bottom: 8px;
          font-size: 32px;
        }

        .empty strong {
          display: block;
          font-size: 12px;
        }

        .empty p {
          margin: 6px 0 0;
          color: #998b81;
          font-size: 10px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(
            38,
            27,
            20,
            0.48
          );
        }

        .modal {
          width: 100%;
          max-width: 530px;
          max-height: 90vh;
          overflow: auto;
          border-radius: 18px;
          background: #fffdfb;
          box-shadow:
            0 25px 80px
              rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 18px;
          border-bottom: 1px solid #eadfd7;
        }

        .modal-header span {
          color: #9b6844;
          font-size: 9px;
          font-weight: 800;
        }

        .modal-header h2 {
          margin: 5px 0 0;
          font-size: 17px;
        }

        .modal-header button {
          width: 31px;
          height: 31px;
          border: 0;
          border-radius: 8px;
          background: #f2e8e0;
          color: #614c3d;
          font-size: 20px;
        }

        .modal-body {
          display: grid;
          gap: 14px;
          padding: 18px;
        }

        .preview-box {
          padding: 15px;
          border-radius: 12px;
          background: #f6eee8;
        }

        .preview-box > span {
          display: block;
          margin-bottom: 7px;
          color: #a17c62;
          font-size: 8px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .preview-box strong {
          display: block;
          font-size: 14px;
        }

        .preview-box p {
          margin: 5px 0 0;
          color: #8c7b70;
          font-size: 10px;
          line-height: 1.5;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 15px 18px;
          border-top: 1px solid #eadfd7;
        }

        .cancel-button {
          min-height: 38px;
          padding: 0 15px;
          border: 1px solid #dfd4cc;
          border-radius: 9px;
          background: #fff;
          color: #705c4e;
          font-size: 10px;
          font-weight: 750;
        }

        .modal-footer .save-button {
          min-height: 38px;
        }

        @media (max-width: 700px) {
          .admin-page {
            padding: 20px 14px 60px;
          }

          .page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions button {
            flex: 1;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .full {
            grid-column: auto;
          }

          .card-title-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .add-button {
            width: 100%;
          }

          .add-section {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .section-item {
            flex-wrap: wrap;
          }

          .section-actions {
            width: 100%;
            margin-left: 71px;
          }

          .section-actions button {
            flex: 1;
          }

          .switch.small {
            position: absolute;
            right: 25px;
          }
        }

        @media (max-width: 380px) {
          .add-section {
            grid-template-columns: 1fr;
          }

          .section-actions {
            margin-left: 0;
          }
        }
      `}</style>
    </main>
  );
}