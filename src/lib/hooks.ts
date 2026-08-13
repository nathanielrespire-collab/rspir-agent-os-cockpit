import { useMemo } from "react";
import { t, type TKey } from "@/lib/i18n";
import { useAppStore, useUIStore } from "@/lib/store";
import type { CapabilityId, Feature, Integration, Provider, Id } from "@/lib/types";

export function useT(): (key: TKey) => string {
  const lang = useUIStore((s) => s.lang);
  return (key: TKey) => t(key, lang);
}

// ── Feature status (shared: une seule source pour READY/MISSING) ───────────

export type FeatureStatus = {
  feature: Feature;
  missingCaps: CapabilityId[];
};

/**
 * Pure: covered capabilities from non-disabled workspace integrations.
 * Same logic as the Doctor tab in Integrations — this is the single source of truth.
 */
export function computeCoveredCaps(
  integrations: Integration[],
  providers: Provider[],
  activeWorkspaceId: Id,
  disabledIntegrationIds: Id[],
): Set<CapabilityId> {
  const providerMap = new Map(providers.map((p) => [p.id, p]));
  const caps = new Set<CapabilityId>();
  integrations
    .filter((i) => i.workspaceId === activeWorkspaceId && !disabledIntegrationIds.includes(i.id))
    .forEach((i) => {
      providerMap.get(i.providerId)?.capabilities.forEach((c) => caps.add(c));
    });
  return caps;
}

/** Reactive hook: feature READY/MISSING status derived from store. */
export function useFeatureStatus(): FeatureStatus[] {
  const { integrations, providers, features, activeWorkspaceId, disabledIntegrationIds } =
    useAppStore();

  const coveredCaps = useMemo(
    () => computeCoveredCaps(integrations, providers, activeWorkspaceId, disabledIntegrationIds),
    [integrations, providers, activeWorkspaceId, disabledIntegrationIds],
  );

  return useMemo(
    () =>
      features.map((f) => ({
        feature: f,
        missingCaps: f.requires.filter((c) => !coveredCaps.has(c)),
      })),
    [features, coveredCaps],
  );
}
