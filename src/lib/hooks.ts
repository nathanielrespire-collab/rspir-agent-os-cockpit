import { t, type TKey } from "@/lib/i18n";
import { useUIStore } from "@/lib/store";

export function useT(): (key: TKey) => string {
  const lang = useUIStore((s) => s.lang);
  return (key: TKey) => t(key, lang);
}
