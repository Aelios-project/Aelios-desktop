// The two contest paths. A card needs the owner; a step is one check → do → verify behind the cards.
// Requirement 11: an existing resident needs 2 cards, a fresh install with the defaults 4. A test holds the numbers.
export const PATHS = {
  existing: {
    cards: ["resident", "helpers"],
    steps: ["pair"],
  },
  fresh: {
    cards: ["resident", "aelios", "assistant", "helpers"],
    steps: [
      "auth", "d1", "migrations", "vectorize", "queue", "aelios-secret",
      "aelios-deploy", "aelios-health", "gateway",
      "resident-secret", "resident-deploy", "resident-health", "pair",
    ],
  },
};

export const countCards = (path) => PATHS[path]?.cards.length ?? 0;

/** True while a path is one the wizard knows. */
export const isPath = (path) => Object.hasOwn(PATHS, path);
