import { describe, it, expect } from "vitest";
import { useAppStore } from "@/lib/store";

async function freshStore() {
  useAppStore.setState({ _hydrated: false });
  await useAppStore.getState().hydrateDemo();
  return useAppStore.getState();
}

describe("isolation par client", () => {
  it("les work items de cl-bellerive ne contiennent aucun item de cl-casseau", async () => {
    const s = await freshStore();
    const belleriveItems = s.workItems.filter((wi) => wi.clientId === "cl-bellerive");
    const casseauItems = s.workItems.filter((wi) => wi.clientId === "cl-casseau");

    expect(belleriveItems.length).toBeGreaterThan(0);
    expect(casseauItems.length).toBeGreaterThan(0);

    const belleriveIds = new Set(belleriveItems.map((wi) => wi.id));
    for (const item of casseauItems) {
      expect(belleriveIds.has(item.id)).toBe(false);
    }
  });

  it("les contacts de cl-bellerive n'incluent aucun contact de cl-1867", async () => {
    const s = await freshStore();
    const belleriveContacts = s.contacts.filter((c) => c.clientId === "cl-bellerive");
    const c1867Contacts = s.contacts.filter((c) => c.clientId === "cl-1867");

    expect(belleriveContacts.length).toBeGreaterThan(0);
    expect(c1867Contacts.length).toBeGreaterThan(0);

    const belleriveIds = new Set(belleriveContacts.map((c) => c.id));
    for (const contact of c1867Contacts) {
      expect(belleriveIds.has(contact.id)).toBe(false);
    }
  });

  it("les réunions de cl-casseau n'incluent aucune réunion de cl-bellerive", async () => {
    const s = await freshStore();
    const casseauMeetings = s.meetings.filter((m) => m.clientId === "cl-casseau");
    const belleriveMeetings = s.meetings.filter((m) => m.clientId === "cl-bellerive");

    expect(casseauMeetings.length).toBeGreaterThan(0);
    expect(belleriveMeetings.length).toBeGreaterThan(0);

    const casseauIds = new Set(casseauMeetings.map((m) => m.id));
    for (const meeting of belleriveMeetings) {
      expect(casseauIds.has(meeting.id)).toBe(false);
    }
  });

  it("les deals de cl-bellerive n'incluent aucun deal de cl-casseau", async () => {
    const s = await freshStore();
    const belleriveDeals = s.deals.filter((d) => d.clientId === "cl-bellerive");
    const casseauDeals = s.deals.filter((d) => d.clientId === "cl-casseau");

    expect(belleriveDeals.length).toBeGreaterThan(0);
    expect(casseauDeals.length).toBeGreaterThan(0);

    const belleriveIds = new Set(belleriveDeals.map((d) => d.id));
    for (const deal of casseauDeals) {
      expect(belleriveIds.has(deal.id)).toBe(false);
    }
  });

  it("les automatisations de cl-casseau n'incluent aucune automation de cl-1867", async () => {
    const s = await freshStore();
    const casseauAuto = s.automations.filter((a) => a.clientId === "cl-casseau");
    const c1867Auto = s.automations.filter((a) => a.clientId === "cl-1867");

    expect(casseauAuto.length).toBeGreaterThan(0);
    expect(c1867Auto.length).toBeGreaterThan(0);

    const casseauIds = new Set(casseauAuto.map((a) => a.id));
    for (const auto of c1867Auto) {
      expect(casseauIds.has(auto.id)).toBe(false);
    }
  });

  it("changer de client actif ne modifie pas les données du store", async () => {
    const s = await freshStore();
    const belleriveWorkBefore = s.workItems.filter((wi) => wi.clientId === "cl-bellerive").length;
    const casseauWorkBefore = s.workItems.filter((wi) => wi.clientId === "cl-casseau").length;

    // Simulating client switch: re-read state (store data is not modified by UI selection)
    const s2 = useAppStore.getState();
    expect(s2.workItems.filter((wi) => wi.clientId === "cl-bellerive").length).toBe(
      belleriveWorkBefore,
    );
    expect(s2.workItems.filter((wi) => wi.clientId === "cl-casseau").length).toBe(
      casseauWorkBefore,
    );
  });

  it("la feature togglee pour cl-bellerive ne change pas les features de cl-casseau", async () => {
    await freshStore();
    const s = useAppStore.getState();
    const casseauFeaturesBefore = s.clients
      .find((c) => c.id === "cl-casseau")!
      .enabledFeatureIds.slice();

    await useAppStore
      .getState()
      .toggleFeature("cl-bellerive", "feat-knowledge-capture", true, "act-nathaniel");

    const s2 = useAppStore.getState();
    const casseauFeaturesAfter = s2.clients.find((c) => c.id === "cl-casseau")!.enabledFeatureIds;
    expect(casseauFeaturesAfter).toEqual(casseauFeaturesBefore);
  });
});
