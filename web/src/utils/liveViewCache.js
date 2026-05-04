const SNAPSHOT_PREFIX = 'teamchords:live-view:snapshot:';
const OVERRIDES_PREFIX = 'teamchords:live-view:overrides:';

const getStorage = (type) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window[type] ?? null;
  } catch {
    return null;
  }
};

const readJson = (storage, key, fallback) => {
  if (!storage) {
    return fallback;
  }

  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJson = (storage, key, value) => {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / privacy mode errors.
  }
};

export const loadLiveViewSnapshot = (setListId) => {
  if (!setListId) {
    return null;
  }

  const storage = getStorage('localStorage');
  return readJson(storage, `${SNAPSHOT_PREFIX}${setListId}`, null);
};

export const saveLiveViewSnapshot = (setListId, snapshot) => {
  if (!setListId) {
    return;
  }

  const storage = getStorage('localStorage');
  writeJson(storage, `${SNAPSHOT_PREFIX}${setListId}`, snapshot);
};

export const clearLiveViewSnapshot = (setListId) => {
  if (!setListId) {
    return;
  }

  const storage = getStorage('localStorage');
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(`${SNAPSHOT_PREFIX}${setListId}`);
  } catch {
    // Ignore storage failures.
  }
};

export const loadLiveViewOverrides = (setListId) => {
  if (!setListId) {
    return {};
  }

  const storage = getStorage('sessionStorage');
  return readJson(storage, `${OVERRIDES_PREFIX}${setListId}`, {}) ?? {};
};

export const saveLiveViewOverrides = (setListId, overrides) => {
  if (!setListId) {
    return;
  }

  const storage = getStorage('sessionStorage');
  writeJson(storage, `${OVERRIDES_PREFIX}${setListId}`, overrides ?? {});
};

export const clearLiveViewOverrides = (setListId) => {
  if (!setListId) {
    return;
  }

  const storage = getStorage('sessionStorage');
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(`${OVERRIDES_PREFIX}${setListId}`);
  } catch {
    // Ignore storage failures.
  }
};


