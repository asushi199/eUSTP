/* eslint-disable */
/* Semak Rekod AINS — penanda (bookmarklet).
 * Fail ini dijana menjadi pautan javascript: oleh /tools/semak-ains/pasang
 * (__NEXA_ORIGIN__ diganti dengan asal NEXa). Kendiri: tidak memuat skrip luar.
 * Hanya menerima arahan daripada __NEXA_ORIGIN__ dan hanya untuk ID rekod yang
 * dibaca dalam sesi ini. Ubah fail ini = naikkan VERSI_PENANDA. */
(function () {
  "use strict";
  var VERSI_PENANDA = 1;
  var NEXA = "__NEXA_ORIGIN__";
  var SUMBER = "semak-ains";
  var J = {
    sedia: "sedia",
    sekolah: "sekolah",
    mula: "mula",
    rekod: "rekod",
    selesaiBaca: "selesai-baca",
    laksana: "laksana",
    kemajuan: "kemajuan",
    henti: "henti",
    selesaiLaksana: "selesai-laksana"
  };

  if (location.hostname !== "ains.moe.gov.my") {
    alert("Semak Rekod AINS: sila klik penanda ini semasa berada di laman AINS (ains.moe.gov.my) selepas log masuk sebagai guru.");
    return;
  }
  if (window.__semakAins && window.__semakAins.tetingkap && !window.__semakAins.tetingkap.closed) {
    window.__semakAins.tetingkap.focus();
    return;
  }

  var baris = (document.body.innerText || "")
    .split("\n")
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
  var iPortal = baris.indexOf("PORTAL GURU");
  if (iPortal < 0) {
    alert("Semak Rekod AINS: sila buka Papan Pemuka guru AINS (Portal Guru) dahulu, kemudian klik penanda ini sekali lagi.");
    return;
  }
  var namaSekolah = baris[iPortal + 1] || "";
  var idGpm = baris.find(function (s) { return /^gpm@[A-Za-z]{3}\d{4}$/i.test(s); }) || "";
  var kodSekolah = idGpm ? idGpm.split("@")[1].toUpperCase() : null;

  var keadaan = { tetingkap: null, idDibaca: new Set(), henti: false, sibuk: false, tapisan: {} };
  window.__semakAins = keadaan;

  function tidur(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function hantar(mesej) {
    if (!keadaan.tetingkap || keadaan.tetingkap.closed) return false;
    mesej.sumber = SUMBER;
    keadaan.tetingkap.postMessage(mesej, NEXA);
    return true;
  }
  async function ambilDokumen(url) {
    var res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return new DOMParser().parseFromString(await res.text(), "text/html");
  }
  function teks(el, pemilih) {
    var x = el.querySelector(pemilih);
    return x ? (x.textContent || "").trim() : "";
  }
  function huraiSenarai(doc) {
    var senarai = doc.querySelector("#rsList");
    if (!senarai) return null;
    var hasil = [];
    senarai.querySelectorAll("[data-key] a.rec").forEach(function (a) {
      var m = (a.getAttribute("href") || "").match(/[?&]id=([^&#]+)/);
      if (!m) return;
      var r = {
        id: decodeURIComponent(m[1]),
        tajuk: teks(a, ".rec-title"),
        meta: teks(a, ".rec-meta").replace(/\s+/g, " "),
        rumusan: "",
        pengajaran: "",
        murid: teks(a, ".rec-murid b"),
        kelas: teks(a, ".rec-murid small")
      };
      a.querySelectorAll("p.rec-sum").forEach(function (p) {
        var b = p.querySelector("b");
        var label = b ? (b.textContent || "").trim().toLowerCase() : "";
        var c = p.cloneNode(true);
        var cb = c.querySelector("b");
        if (cb) cb.remove();
        var isi = (c.textContent || "").trim();
        if (label === "rumusan") r.rumusan = isi;
        else if (label === "pengajaran") r.pengajaran = isi;
      });
      hasil.push(r);
    });
    return hasil;
  }
  function jumlahHalaman(doc) {
    var maks = 1;
    doc.querySelectorAll('a[href*="page="]').forEach(function (a) {
      var m = (a.getAttribute("href") || "").match(/[?&]page=(\d+)/);
      if (m) maks = Math.max(maks, Number(m[1]));
    });
    return maks;
  }
  function urlSenarai(halaman) {
    var q = new URLSearchParams({ search_status: "pending", page: String(halaman) });
    if (keadaan.tapisan.tahun) q.set("search_class_year", keadaan.tapisan.tahun);
    if (keadaan.tapisan.kelas) q.set("search_class_name", keadaan.tapisan.kelas);
    return "/web/teacher-record-list?" + q.toString();
  }
  var RALAT_SESI = "Sesi AINS tamat atau halaman berubah. Sila log masuk semula dan cuba lagi.";
  async function ambilHalaman(h) {
    var ralatAkhir = null;
    for (var cuba = 0; cuba < 3; cuba++) {
      if (cuba > 0) await tidur(1000);
      var doc;
      try { doc = await ambilDokumen(urlSenarai(h)); } catch (e) { ralatAkhir = e; continue; }
      var rekod = huraiSenarai(doc);
      if (!rekod) throw new Error(RALAT_SESI);
      return { doc: doc, rekod: rekod };
    }
    throw ralatAkhir || new Error("Gagal membaca halaman " + h + ".");
  }
  async function bacaSemua(lapor) {
    var p1 = await ambilHalaman(1);
    var jumlah = p1.rekod.length ? jumlahHalaman(p1.doc) : 0;
    var semua = p1.rekod.slice();
    var gagal = [];
    var dihentikan = false;
    if (lapor) lapor(p1.rekod, 1, jumlah);
    for (var h = 2; h <= jumlah; h++) {
      if (keadaan.henti) { dihentikan = true; break; }
      await tidur(100);
      var hasil;
      try { hasil = await ambilHalaman(h); }
      catch (e) { if (e && e.message === RALAT_SESI) throw e; gagal.push(h); continue; }
      semua = semua.concat(hasil.rekod);
      if (lapor) lapor(hasil.rekod, h, jumlah);
    }
    return { rekod: semua, gagal: gagal, dihentikan: dihentikan };
  }
  function tolakLaksana(ralat) {
    hantar({ jenis: J.selesaiLaksana, berjaya: 0, gagal: 0, masihMenunggu: [], dihentikan: true, ralat: ralat });
  }
  async function mula(tapisan) {
    if (keadaan.sibuk) {
      hantar({ jenis: J.selesaiBaca, bilangan: 0, ralat: "Penanda sedang sibuk. Tunggu proses semasa selesai.", halamanGagal: [] });
      return;
    }
    keadaan.sibuk = true;
    keadaan.henti = false;
    keadaan.tapisan = {
      tahun: tapisan && tapisan.tahun ? String(tapisan.tahun) : "",
      kelas: tapisan && tapisan.kelas ? String(tapisan.kelas) : ""
    };
    keadaan.idDibaca = new Set();
    try {
      var hasil = await bacaSemua(function (rekod, h, jumlah) {
        rekod.forEach(function (r) { keadaan.idDibaca.add(r.id); });
        hantar({ jenis: J.rekod, rekod: rekod, halaman: h, jumlahHalaman: jumlah });
      });
      hantar({
        jenis: J.selesaiBaca,
        bilangan: hasil.rekod.length,
        ralat: hasil.dihentikan ? "Bacaan dihentikan sebelum selesai — hanya sebahagian rekod disemak." : null,
        halamanGagal: hasil.gagal
      });
    } catch (e) {
      hantar({ jenis: J.selesaiBaca, bilangan: keadaan.idDibaca.size, ralat: String((e && e.message) || e), halamanGagal: [] });
    } finally {
      keadaan.sibuk = false;
    }
  }
  async function laksana(arahan) {
    if (keadaan.sibuk) { tolakLaksana("Penanda sedang sibuk."); return; }
    var tindakan = arahan.tindakan;
    if (tindakan !== "approved" && tindakan !== "rejected") { tolakLaksana("Tindakan tidak sah."); return; }
    var dilihat = new Set();
    var item = (Array.isArray(arahan.item) ? arahan.item : []).filter(function (x) {
      if (!x || typeof x.id !== "string" || !keadaan.idDibaca.has(x.id) || dilihat.has(x.id)) return false;
      dilihat.add(x.id);
      return true;
    });
    if (!item.length) { tolakLaksana("Tiada rekod sah untuk tindakan. Baca semula senarai."); return; }
    var label = tindakan === "approved" ? "MELULUSKAN" : "MENOLAK";
    if (!confirm("Semak Rekod AINS\n\nAnda akan " + label + " " + item.length + " rekod bacaan murid atas nama akaun anda.\n\nTeruskan?")) {
      tolakLaksana("Dibatalkan oleh pengguna.");
      return;
    }
    keadaan.sibuk = true;
    keadaan.henti = false;
    var jeda = Math.min(2000, Math.max(300, Number(arahan.jedaMs) || 500));
    var berjaya = 0, gagal = 0, gagalBerturut = 0, ralat = null, selesai = [];
    var dihentikan = false;
    var masihMenunggu = [];
    try {
      for (var i = 0; i < item.length; i++) {
        if (keadaan.henti || !keadaan.tetingkap || keadaan.tetingkap.closed) break;
        var x = item[i];
        var ok = false, jawapan = null;
        try {
          var q = new URLSearchParams({ id: x.id, comment: String(x.komen || "").slice(0, 500), status: tindakan });
          var res = await fetch("/reading-record/updatestatus?" + q.toString(), {
            credentials: "same-origin",
            headers: { "X-Requested-With": "XMLHttpRequest" }
          });
          jawapan = (await res.text()).trim().slice(0, 80);
          ok = res.ok && jawapan === "success";
        } catch (e) {
          jawapan = String((e && e.message) || e).slice(0, 80);
        }
        if (ok) { berjaya++; gagalBerturut = 0; selesai.push(x.id); keadaan.idDibaca.delete(x.id); }
        else { gagal++; gagalBerturut++; }
        hantar({ jenis: J.kemajuan, id: x.id, berjaya: ok, jawapan: ok ? null : jawapan });
        if (gagalBerturut >= 3) { ralat = "3 kegagalan berturut-turut — dihentikan. Sesi AINS mungkin tamat."; break; }
        await tidur(jeda);
      }
      dihentikan = keadaan.henti || ralat !== null || berjaya + gagal < item.length;
      if (selesai.length && keadaan.tetingkap && !keadaan.tetingkap.closed) {
        keadaan.henti = false;
        try {
          var semakan = await bacaSemua(null);
          var ada = new Set(semakan.rekod.map(function (r) { return r.id; }));
          masihMenunggu = selesai.filter(function (id) { return ada.has(id); });
          if (semakan.gagal.length || semakan.dihentikan) {
            ralat = (ralat ? ralat + " " : "") + "Pengesahan selepas tindakan tidak lengkap; semak AINS secara manual.";
          }
        } catch (e) {
          ralat = (ralat ? ralat + " " : "") + "Pengesahan selepas tindakan tidak dapat dibuat; semak AINS secara manual.";
        }
      }
    } catch (e) {
      dihentikan = true;
      ralat = "Ralat tidak dijangka: " + String((e && e.message) || e).slice(0, 120);
    } finally {
      keadaan.sibuk = false;
      hantar({ jenis: J.selesaiLaksana, berjaya: berjaya, gagal: gagal, masihMenunggu: masihMenunggu, dihentikan: dihentikan, ralat: ralat });
    }
  }

  window.addEventListener("message", function (e) {
    if (e.origin !== NEXA || !e.data || e.data.sumber !== SUMBER) return;
    if (!keadaan.tetingkap || e.source !== keadaan.tetingkap) return;
    var d = e.data;
    if (d.jenis === J.sedia) {
      hantar({ jenis: J.sekolah, nama: namaSekolah, kod: kodSekolah, versiPenanda: VERSI_PENANDA });
    } else if (d.jenis === J.mula) {
      mula(d.tapisan || {});
    } else if (d.jenis === J.laksana) {
      laksana(d);
    } else if (d.jenis === J.henti) {
      keadaan.henti = true;
    }
  });

  keadaan.tetingkap = window.open(NEXA + "/tools/semak-ains", "semak-ains");
  if (!keadaan.tetingkap) {
    alert("Semak Rekod AINS: tetingkap baharu disekat. Sila benarkan pop-up untuk ains.moe.gov.my dan cuba lagi.");
    window.__semakAins = null;
  }
})();
