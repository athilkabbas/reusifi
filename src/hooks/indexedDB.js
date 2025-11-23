import { useCallback } from "react";

// Helper to convert File to base64 for preview
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!(file instanceof Blob)) {
      reject(new Error("Not a Blob or File"));
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("draftDBReusifi", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("draftReusifi")) {
        db.createObjectStore("draftReusifi", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = reject;
  });
}

export function useIndexedDBImages() {
  const saveImage = useCallback(async (imageArray, id) => {
    const db = await openDB();
    const tx = db.transaction("draftReusifi", "readwrite");
    const store = tx.objectStore("draftReusifi");

    // Save only the File/Blob itself
    const filesToSave = imageArray.map((f) => f.originFileObj || f);

    store.put({ id, files: filesToSave });

    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  }, []);

  const loadImage = useCallback(async (id) => {
    const db = await openDB();
    const tx = db.transaction("draftReusifi", "readonly");
    const store = tx.objectStore("draftReusifi");

    return new Promise((resolve) => {
      const req = store.get(id);
      req.onsuccess = async () => {
        const files = req.result?.files || [];

        // Convert loaded files into Ant Design Upload format
        const uploadFiles = await Promise.all(
          files.map(async (file, index) => ({
            uid: `id-${index}`,
            name: file.name || `image-${index}`,
            status: "done",
            originFileObj: file,
            preview: await getBase64(file),
          }))
        );

        resolve(uploadFiles);
      };
      req.onerror = () => resolve([]);
    });
  }, []);

  const saveForm = useCallback(async (form, id) => {
    const db = await openDB();
    const tx = db.transaction("draftReusifi", "readwrite");
    const store = tx.objectStore("draftReusifi");

    store.put({ id, form: form });

    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  }, []);

  const loadForm = useCallback(async (id) => {
    const db = await openDB();
    const tx = db.transaction("draftReusifi", "readonly");
    const store = tx.objectStore("draftReusifi");

    return new Promise((resolve) => {
      const req = store.get(id);
      req.onsuccess = async () => {
        const form = req.result?.form || {};

        resolve(form);
      };
      req.onerror = () => resolve({});
    });
  }, []);

  const clearIdInStore = useCallback(async (id) => {
    const db = await openDB();
    const tx = db.transaction("draftReusifi", "readwrite");
    const store = tx.objectStore("draftReusifi");
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  }, []);

  const clearStore = useCallback(async () => {
    const db = await openDB();
    const tx = db.transaction("draftReusifi", "readwrite");
    const store = tx.objectStore("draftReusifi");
    store.clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  }, []);

  const deleteDB = useCallback(async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase("draftDBReusifi");

      request.onsuccess = () => resolve();
      request.onerror = reject;
      request.onblocked = () => {};
    });
  }, []);

  return {
    saveImage,
    loadImage,
    clearIdInStore,
    clearStore,
    saveForm,
    loadForm,
    deleteDB,
  };
}
