/** i18n maison — étendu en BUILD-001 (persistance + hook). Toute string UI passe par t(). */

export type Lang = "fr" | "en";

const dict = {
  fr: {
    app_title: "RSPIR Agent OS",
    bootstrap_marker: "Amorce du pipeline — en attente de BUILD-000",
  },
  en: {
    app_title: "RSPIR Agent OS",
    bootstrap_marker: "Pipeline bootstrap — waiting for BUILD-000",
  },
} as const;

export type TKey = keyof (typeof dict)["fr"];

let current: Lang = "fr";

export function setLang(l: Lang): void {
  current = l;
}

export function getLang(): Lang {
  return current;
}

export function t(key: TKey, lang: Lang = current): string {
  return dict[lang][key];
}
