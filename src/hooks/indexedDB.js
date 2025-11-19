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
    const request = indexedDB.open("imageDBReusifi", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("imagesReusifi")) {
        db.createObjectStore("imagesReusifi", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = reject;
  });
}

export function useIndexedDBImages() {
  const save = useCallback(async (imageArray) => {
    const db = await openDB();
    const tx = db.transaction("imagesReusifi", "readwrite");
    const store = tx.objectStore("imagesReusifi");

    // Save only the File/Blob itself
    const filesToSave = imageArray.map((f) => f.originFileObj || f);

    store.put({ id: "imageListReusifi", files: filesToSave });

    return new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
  }, []);

  const load = useCallback(async () => {
    const db = await openDB();
    const tx = db.transaction("imagesReusifi", "readonly");
    const store = tx.objectStore("imagesReusifi");

    return new Promise((resolve) => {
      const req = store.get("imageListReusifi");
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

  const clear = useCallback(async () => {
    const db = await openDB();
    const tx = db.transaction("imagesReusifi", "readwrite");
    const store = tx.objectStore("imagesReusifi");
    store.delete("imageListReusifi");

    return new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
  }, []);

  return { save, load, clear };
}
