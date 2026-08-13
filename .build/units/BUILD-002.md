# BUILD-002 — Store, persistance locale, fixtures démo complètes

## Objectif

Le monde de données du cockpit: état canonique typé + jeu démo crédible en français.

## Scope IN

- `src/lib/store.ts`: zustand + persist(localStorage), hydraté depuis les fixtures au premier run,
  bouton "Réinitialiser la démo" dans Settings. Sélecteurs par workspace (isolation client).
- `src/lib/fixtures/`: implémentation COMPLÈTE de types.ts, en FR, clients fictifs
  (Gestion Bellerive, Films Casseau, Boutique 1867), équipe (Nathaniel, Manny, Antoine), 6 agents,
  ~30 work items sur tous les statuts, 4 projets (dont un "tasks 100% / transferable NO"),
  blockers locaux+1 global résolu, 5 approvals, 8 exécutions avec evidence complète
  (SELECT→CLAIM→EXECUTE→VERIFY→UPDATE), meetings avec transcripts mock, deals CRM, automations,
  websites, knowledge (3 couches), decisions journal, providers RSPIR (MOCK), features, policies,
  workspace B Microsoft (pré-généré, désactivé). Cohérence croisée des IDs obligatoire.
- Actions du store: create/update work item, assign, approve/reject, create blocker, resolve,
  toggle feature, swap provider — avec écriture d'Event + Evidence à chaque mutation conséquente.
- **Signature des entrées append-only** via `src/lib/signature.ts` (livré, ne pas réécrire):
  toute `Decision` et toute `Evidence` est signée À L'ÉCRITURE et chaînée sur la dernière entrée
  signée DU WORKSPACE (une seule chaîne par workspace, partagée par les deux types, ordonnée par
  `seq`). Utiliser `chainTip()` / `append()`; ne jamais fabriquer `seq`/`prevHash`/`hash` à la main.
  Les `ExecutionStep` d'une exécution sont signés de la même façon, sur la chaîne de leur workspace.
- **Fixtures non signées, scellées à l'hydratation**: les fixtures déclarent le contenu et sont
  typées `Unsigned<Decision>` / `Unsigned<Evidence>` (helper exporté par `signature.ts`); le store
  les scelle en chaîne au premier run, dans un ordre déterministe et documenté. Aucun hash écrit
  en dur dans les fixtures — un hash figé dans un fichier se désynchronise du contenu au premier
  edit et donne une fausse preuve.
- **Conséquence async assumée**: `crypto.subtle` est asynchrone, donc les actions qui écrivent une
  Decision/Evidence sont `async` et l'hydratation est `async`. Ne pas contourner avec une implé
  synchrone maison: la sérialisation canonique et SHA-256 sont le contrat, la commodité ne l'est pas.
- Le reset démo repart des fixtures et re-scelle une chaîne neuve.

## Scope OUT

Aucun écran (les zones consomment le store dans les unités suivantes). Aucune UI de vérification
de chaîne (c'est BUILD-009 et BUILD-016).

## Acceptance

`store.test.ts` (vitest): hydratation, isolation par workspace, chaque action mutante produit son Event;
reset démo restaure l'état initial. Typecheck strict sans any.
Signature: après hydratation, `verifyChain()` sur la chaîne de chaque workspace retourne `null`;
après une suite d'actions mutantes, elle retourne encore `null`; une entrée modifiée à la main dans
l'état retourne son index. Chaînes des workspaces indépendantes (aucun `prevHash` croisé).

## Evidence

Tests verts dans les gates; taille et cohérence des fixtures décrites dans la PR; la PR indique le
nombre d'entrées scellées par workspace et le `hash` court de la tête de chaîne.
