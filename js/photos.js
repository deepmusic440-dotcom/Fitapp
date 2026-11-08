// Progress photos, kept on this device in IndexedDB (too large for localStorage and
// left out of backups). Every call fails soft: no IndexedDB means no photos, not an error.
const DB = 'wezza-photos', STORE = 'photos';

let dbPromise;
function db() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function run(mode, fn) {
  return db().then(d => new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, mode);
    const out = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(out?.result ?? out);
    tx.onerror = () => reject(tx.error);
  }));
}

/** All photos, newest first, without the full image: [{ id, t, thumb, note }]. */
export async function listPhotos() {
  try {
    const all = await run('readonly', s => s.getAll());
    return all.map(({ id, t, thumb, note }) => ({ id, t, thumb, note })).sort((a, b) => b.t - a.t);
  } catch { return []; }
}

/** Save a prepared photo ({ blob, thumb }) taken at time t. */
export function addPhoto({ blob, thumb }, t = Date.now(), note = '') {
  const id = Math.random().toString(36).slice(2, 10);
  return run('readwrite', s => s.put({ id, t, blob, thumb, note })).then(() => id);
}

/** The full photo record, including its blob. */
export const getPhoto = id => run('readonly', s => s.get(id));

export const deletePhoto = id => run('readwrite', s => s.delete(id));
