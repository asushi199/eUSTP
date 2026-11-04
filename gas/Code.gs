/**
 * eUSTP Manjung — Muat naik gambar Laporan (DPD/PSS) ke Google Drive
 * Folder akar dicadangkan: "eUSTP Laporan Gambar" (subfolder auto Tahun/Bulan/Modul)
 *
 * 1. Salin skrip ini ke https://script.google.com (projek baharu)
 * 2. Jalankan sekali: setupScriptProperties() — isi FOLDER_ID & UPLOAD_SECRET di bawah
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Salin URL /exec ke GAS_WEB_APP_URL dalam .env.local
 */

/** Tukar nilai ini, kemudian jalankan setupScriptProperties() sekali dari editor */
var SETUP_FOLDER_ID = "ISI_FOLDER_ID_DRIVE_DI_SINI";
var SETUP_UPLOAD_SECRET = "ISI_RENTETAN_RAWAK_PANJANG_DI_SINI";

function setupScriptProperties() {
  if (
    SETUP_FOLDER_ID.indexOf("ISI_") === 0 ||
    SETUP_UPLOAD_SECRET.indexOf("ISI_") === 0
  ) {
    throw new Error("Sila edit SETUP_FOLDER_ID dan SETUP_UPLOAD_SECRET dalam Code.gs dahulu.");
  }
  PropertiesService.getScriptProperties().setProperties({
    FOLDER_ID: SETUP_FOLDER_ID,
    UPLOAD_SECRET: SETUP_UPLOAD_SECRET,
  });
  Logger.log("OK — Script Properties disimpan.");
}

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty("FOLDER_ID");
  var secret = props.getProperty("UPLOAD_SECRET");
  if (!folderId || !secret) {
    throw new Error("Jalankan setupScriptProperties() dahulu.");
  }
  return { folderId: folderId, secret: secret };
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * Cari/cipta folder anak mengikut laluan (cth ["2026","2026-06","USTP"]).
 * folderId di-cache (CacheService) supaya muat naik berulang tidak perlu
 * mencari/mencipta folder semula — kekalkan kelajuan.
 */
function resolveFolderPath_(rootId, segments) {
  if (!segments || !segments.length) return DriveApp.getFolderById(rootId);

  var cache = CacheService.getScriptCache();
  var cacheKey = "folder:" + rootId + "/" + segments.join("/");
  var cachedId = cache.get(cacheKey);
  if (cachedId) {
    try {
      var cachedFolder = DriveApp.getFolderById(cachedId);
      // PENTING: getFolderById MASIH memulangkan folder yang berada dalam Trash
      // (tak melontar ralat). Tanpa semakan ini, fail akan dicipta di dalam folder
      // yang sudah dibuang → masuk Trash. Sahkan ia belum dibuang dahulu.
      if (!cachedFolder.isTrashed()) {
        return cachedFolder;
      }
      cache.remove(cacheKey); // ID lapuk (folder dalam Trash) — bina semula di bawah
    } catch (ignore) {
      // folder dipadam kekal — bina semula di bawah
    }
  }

  var folder = DriveApp.getFolderById(rootId);
  for (var i = 0; i < segments.length; i++) {
    var name = String(segments[i]).replace(/[\\/]/g, "-");
    if (!name) continue;
    var it = folder.getFoldersByName(name);
    folder = it.hasNext() ? it.next() : folder.createFolder(name);
  }
  cache.put(cacheKey, folder.getId(), 21600); // 6 jam
  return folder;
}

/**
 * Diagnostik: laporkan folder akar sebenar + folder sasaran subPath (nama, URL,
 * bilangan fail). Guna untuk sahkan DI MANA fail sebenarnya disimpan.
 * Panggil: { secret, action:"info", subPath:["Khidmat-Bantu","2026","2026-07"] }
 */
function handleInfo_(config, payload) {
  var root = DriveApp.getFolderById(config.folderId);
  var target = resolveFolderPath_(config.folderId, payload.subPath);

  var files = [];
  var it = target.getFiles();
  while (it.hasNext() && files.length < 20) {
    var f = it.next();
    files.push({ id: f.getId(), name: f.getName() });
  }

  return jsonResponse_({
    ok: true,
    rootFolderId: root.getId(),
    rootFolderName: root.getName(),
    rootFolderUrl: root.getUrl(),
    targetFolderId: target.getId(),
    targetFolderUrl: target.getUrl(),
    targetFolderPath: (payload.subPath || []).join("/"),
    fileCount: files.length,
    files: files,
  });
}

function handleDelete_(payload) {
  if (!payload.fileId) {
    return jsonResponse_({ ok: false, error: "fileId diperlukan" });
  }
  try {
    DriveApp.getFileById(payload.fileId).setTrashed(true);
    return jsonResponse_({ ok: true, fileId: payload.fileId });
  } catch (err) {
    // fail mungkin sudah tiada — anggap selesai supaya pemanggil tidak gagal
    return jsonResponse_({ ok: true, fileId: payload.fileId, note: "not-found-or-removed" });
  }
}

/** Perkongsian pautan best-effort (lihat komen dalam doPost). */
function shareBestEffort_(file) {
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    try {
      file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr2) {
      // Dasar domain sekat perkongsian — fail kekal peribadi.
    }
  }
}

/**
 * Muat naik BERKETUL (fail > 4.5 MB, had badan Vercel).
 * Langkah 1 — action:"initResumable": GAS cipta sesi resumable Drive (guna token
 * pemilik skrip) dan pulangkan sessionUri. Pelayan eUSTP kemudian PUT ketul terus
 * ke sessionUri (URI itu sendiri sudah mengesahkan — tiada token diperlukan).
 * Panggil: { secret, action:"initResumable", fileName, subPath, mimeType, size }
 */
function handleInitResumable_(config, payload) {
  if (!payload.fileName || !payload.size) {
    return jsonResponse_({ ok: false, error: "fileName dan size diperlukan" });
  }
  var mimeType = payload.mimeType || "application/octet-stream";
  var folder = resolveFolderPath_(config.folderId, payload.subPath);

  var res = UrlFetchApp.fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true",
    {
      method: "post",
      contentType: "application/json; charset=UTF-8",
      headers: {
        Authorization: "Bearer " + ScriptApp.getOAuthToken(),
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(payload.size),
      },
      payload: JSON.stringify({
        name: payload.fileName,
        parents: [folder.getId()],
        mimeType: mimeType,
      }),
      muteHttpExceptions: true,
    },
  );

  var code = res.getResponseCode();
  if (code !== 200) {
    return jsonResponse_({
      ok: false,
      error: "Drive menolak sesi muat naik (HTTP " + code + "): " + res.getContentText().slice(0, 300),
    });
  }
  var headers = res.getAllHeaders();
  var sessionUri = headers["Location"] || headers["location"];
  if (!sessionUri) {
    return jsonResponse_({ ok: false, error: "Drive tidak memulangkan sessionUri" });
  }
  return jsonResponse_({ ok: true, sessionUri: String(sessionUri) });
}

/**
 * Langkah 3 — action:"finalize": selepas ketul terakhir diterima, tetapkan perkongsian
 * dan pulangkan path/publicUrl. Panggil: { secret, action:"finalize", fileId }
 */
function handleFinalize_(payload) {
  if (!payload.fileId) {
    return jsonResponse_({ ok: false, error: "fileId diperlukan" });
  }
  var file = DriveApp.getFileById(payload.fileId);
  shareBestEffort_(file);
  var fileId = file.getId();
  return jsonResponse_({
    ok: true,
    fileId: fileId,
    path: "drive/" + fileId,
    publicUrl: "https://drive.google.com/thumbnail?id=" + encodeURIComponent(fileId) + "&sz=w1200",
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, error: "Bad request: tiada JSON body" });
    }

    var payload = JSON.parse(e.postData.contents);
    var config = getConfig_();

    if (payload.secret !== config.secret) {
      return jsonResponse_({ ok: false, error: "Unauthorized" });
    }

    if (payload.action === "delete") {
      return handleDelete_(payload);
    }

    if (payload.action === "info") {
      return handleInfo_(config, payload);
    }

    if (payload.action === "initResumable") {
      return handleInitResumable_(config, payload);
    }

    if (payload.action === "finalize") {
      return handleFinalize_(payload);
    }

    if (!payload.dataBase64 || !payload.fileName) {
      return jsonResponse_({ ok: false, error: "dataBase64 dan fileName diperlukan" });
    }

    var bytes = Utilities.base64Decode(payload.dataBase64);
    if (bytes.length > 8 * 1024 * 1024) {
      return jsonResponse_({ ok: false, error: "Fail melebihi 8 MB" });
    }

    var mimeType = payload.mimeType || "application/octet-stream";
    var blob = Utilities.newBlob(bytes, mimeType, payload.fileName);
    // Susun ke subfolder Tahun/Bulan/Sektor bila ada; jika tiada, folder akar.
    var folder = resolveFolderPath_(config.folderId, payload.subPath);
    var file = folder.createFile(blob);

    // Perkongsian "sesiapa yang ada pautan" kerap disekat oleh dasar domain
    // Google Workspace (cth. akaun MOE) → setSharing melontar "Access denied: DriveApp."
    // walaupun fail SUDAH berjaya disimpan. Jadikan ia best-effort: cuba pautan
    // awam, jika gagal cuba perkongsian dalam domain, dan jangan sekali-kali
    // gagalkan muat naik hanya kerana perkongsian ditolak.
    shareBestEffort_(file);

    var fileId = file.getId();
    // thumbnail URL — boleh dipapar dalam <img> (bukan uc?export=view)
    var publicUrl =
      "https://drive.google.com/thumbnail?id=" +
      encodeURIComponent(fileId) +
      "&sz=w1200";

    return jsonResponse_({
      ok: true,
      fileId: fileId,
      path: "drive/" + fileId,
      publicUrl: publicUrl,
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
}

/** Ujian manual dari editor: Run → testUpload */
function testUpload() {
  var config = getConfig_();
  var tiny =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  var e = {
    postData: {
      contents: JSON.stringify({
        secret: config.secret,
        oprId: 0,
        fileName: "test-pixel.png",
        mimeType: "image/png",
        dataBase64: tiny,
      }),
    },
  };
  var out = doPost(e);
  Logger.log(out.getContent());
}
