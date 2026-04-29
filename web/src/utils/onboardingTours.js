import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_COMPLETED_PREFIX = "tcv2:onboarding:completed";
const TOUR_SEED_PREFIX = "tcv2:onboarding:seed";

const TOUR_META = {
  library: {
    title: "Welcome to your Library",
    description: "This is where your chord sheets live. We'll show you the main actions you need to add, find, and manage songs.",
  },
  setlists: {
    title: "Welcome to Set Lists",
    description: "This is where you organize songs for services and rehearsals. We'll show you how to create and manage set lists.",
  },
};

const getUserKey = (profile) =>
  profile?.auth0UserId ||
  profile?.Auth0UserId ||
  profile?.user?.sub ||
  profile?.sub ||
  profile?.id ||
  profile?.Id ||
  null;

const getTourStorageKey = (prefix, tourName, profile) => {
  const userKey = getUserKey(profile);
  if (!userKey) return null;
  return `${prefix}:${tourName}:${userKey}`;
};

const hasWindow = () => typeof window !== "undefined" && typeof document !== "undefined";

const isSelectorAvailable = (selector) => {
  if (!hasWindow()) return false;
  const element = document.querySelector(selector);
  if (!element) return false;

  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
};

const resolveSelector = (selectors) => selectors.find((selector) => isSelectorAvailable(selector));

const isTourCompleted = (tourName, profile) => {
  if (!hasWindow()) return false;
  const key = getTourStorageKey(TOUR_COMPLETED_PREFIX, tourName, profile);
  return key ? window.localStorage.getItem(key) === "1" : false;
};

const markTourCompleted = (tourName, profile) => {
  if (!hasWindow()) return;
  const key = getTourStorageKey(TOUR_COMPLETED_PREFIX, tourName, profile);
  if (key) {
    window.localStorage.setItem(key, "1");
  }
};

const clearTourSeed = (tourName, profile) => {
  if (!hasWindow()) return;
  const key = getTourStorageKey(TOUR_SEED_PREFIX, tourName, profile);
  if (key) {
    window.localStorage.removeItem(key);
  }
};

const seedTour = (tourName, profile) => {
  if (!hasWindow()) return;
  const key = getTourStorageKey(TOUR_SEED_PREFIX, tourName, profile);
  if (key) {
    window.localStorage.setItem(key, "1");
  }
};

const consumeTourSeed = (tourName, profile) => {
  if (!hasWindow()) return false;
  const key = getTourStorageKey(TOUR_SEED_PREFIX, tourName, profile);
  if (!key) return false;
  const seeded = window.localStorage.getItem(key) === "1";
  if (seeded) {
    window.localStorage.removeItem(key);
  }
  return seeded;
};

const hasOrgMembership = (profile) => {
  const orgs = profile?.organizations || profile?.Organizations || [];
  return orgs.length > 0;
};

const canStartTour = (tourName, profile, { force = false } = {}) => {
  if (!profile || !hasWindow()) return false;
  if (force) return true;
  if (consumeTourSeed(tourName, profile)) return true;
  if (!hasOrgMembership(profile)) return false;
  return !isTourCompleted(tourName, profile);
};

const buildTourSteps = (tourName) => {
  if (tourName === "library") {
    const firstRowSelector = resolveSelector([
      '[data-tour="library-first-row"]',
      '[data-tour="library-empty"]',
    ]);
    const createSelector = resolveSelector([
      '[data-tour="library-create"]',
    ]);
    const uploadSelector = resolveSelector([
      '[data-tour="library-upload"]',
    ]);
    const mobileMenuSelector = resolveSelector([
      '[data-tour="library-mobile-menu"]',
    ]);

    const baseSteps = [
      {
        element: resolveSelector([
          '[data-tour="sidebar-library"]',
          '[data-tour="mobile-sidebar-library"]',
          '[data-tour="library-title"]',
        ]),
        popover: {
          title: TOUR_META.library.title,
          description: TOUR_META.library.description,
          side: "right",
          align: "start",
        },
      },
    ];

    if (createSelector && uploadSelector) {
      baseSteps.push(
        {
          element: createSelector,
          popover: {
            title: "Create a song",
            description: "Start a new chord sheet from scratch when you want to add original material or a new song.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: uploadSelector,
          popover: {
            title: "Upload ChordPro files",
            description: "Import existing chord sheets in bulk so your library fills up quickly.",
            side: "bottom",
            align: "start",
          },
        }
      );
    } else if (mobileMenuSelector) {
      baseSteps.push({
        element: mobileMenuSelector,
        popover: {
          title: "Library actions",
          description: "Open this menu on mobile to create or upload songs.",
          side: "bottom",
          align: "start",
        },
      });
    }

    baseSteps.push({
        element: '[data-tour="library-search"]',
        popover: {
          title: "Search your library",
          description: "Filter by title or artist to find a song fast during rehearsals or live sets.",
          side: "bottom",
          align: "start",
        },
      });

    baseSteps.push({
        element: firstRowSelector,
        popover: {
          title: firstRowSelector === '[data-tour="library-empty"]' ? "Nothing in the library yet" : "Open a song",
          description:
            firstRowSelector === '[data-tour="library-empty"]'
              ? "Use Create or Upload to get your first chord sheet into the library."
              : "Click a song row to open the editor and start refining chords, keys, and content.",
          side: "top",
          align: "start",
        },
    });

    return baseSteps.filter((step) => step.element);
  }

  if (tourName === "setlists") {
    const firstRowSelector = resolveSelector([
      '[data-tour="setlists-first-row"]',
      '[data-tour="setlists-empty"]',
    ]);

    return [
      {
        element: resolveSelector([
          '[data-tour="sidebar-setlists"]',
          '[data-tour="mobile-sidebar-setlists"]',
          '[data-tour="setlists-title"]',
        ]),
        popover: {
          title: TOUR_META.setlists.title,
          description: TOUR_META.setlists.description,
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="setlists-create"]',
        popover: {
          title: "Create a set list",
          description: "Use this button to build a new set list for a service, rehearsal, or event.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="setlists-search"]',
        popover: {
          title: "Search set lists",
          description: "Find the set list you need by name before a rehearsal or performance.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: firstRowSelector,
        popover: {
          title: firstRowSelector === '[data-tour="setlists-empty"]' ? "No set lists yet" : "Open a set list",
          description:
            firstRowSelector === '[data-tour="setlists-empty"]'
              ? "Create your first set list to start organizing songs by service or event."
              : "Click a set list row to edit it, or use the quick actions to preview, copy a share link, or delete it.",
          side: "top",
          align: "start",
        },
      },
      {
        element: '[data-tour="setlists-row-actions"]',
        popover: {
          title: "Quick actions",
          description: "Preview, share, or delete a set list from the action buttons on the right.",
          side: "left",
          align: "start",
        },
      },
    ].filter((step) => step.element);
  }

  return [];
};

const startTour = async (tourName, profile, { force = false } = {}) => {
  if (!canStartTour(tourName, profile, { force })) return false;

  const steps = buildTourSteps(tourName);
  if (!steps.length) return false;

  const tour = driver({
    allowClose: true,
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    popoverClass: "tcv2-onboarding-popover",
    steps,
    onDestroyed: () => {
      markTourCompleted(tourName, profile);
    },
  });

  tour.drive();
  return true;
};

const startLibraryTour = (profile, options = {}) => startTour("library", profile, options);
const startSetListsTour = (profile, options = {}) => startTour("setlists", profile, options);

const requestLibraryTourReplay = (profile) => {
  seedTour("library", profile);
  clearTourSeed("setlists", profile);
};

const requestSetListsTourReplay = (profile) => {
  seedTour("setlists", profile);
  clearTourSeed("library", profile);
};

export {
  startLibraryTour,
  startSetListsTour,
  requestLibraryTourReplay,
  requestSetListsTourReplay,
  seedTour,
  markTourCompleted,
  isTourCompleted,
  hasOrgMembership,
};


