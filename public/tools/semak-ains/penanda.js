/* eslint-disable */
/* SahPantas AINS — penanda (bookmarklet).
 * Fail ini dijana menjadi pautan javascript: oleh /tools/semak-ains (ButangPenanda)
 * (__NEXA_ORIGIN__ diganti dengan asal NEXa). Kendiri: tidak memuat skrip luar.
 * Hanya menerima arahan daripada __NEXA_ORIGIN__ dan hanya untuk ID rekod yang
 * dibaca dalam sesi ini. Ubah fail ini = naikkan VERSI_PENANDA. */
(function utama() {
  "use strict";
  var VERSI_PENANDA = 8;
  var NEXA = "__NEXA_ORIGIN__";
  /* Mod tetingkap (pilihan, ?mod=tetingkap): jambatan ini + halaman SahPantas (iframe
   * /tools/semak-ains/tetingkap) berjalan dalam tetingkap berasingan berasal AINS, supaya tab AINS
   * asal boleh dimuat semula/dinavigasi tanpa memutuskan sambungan. Kod ini berjalan dalam 3 peranan:
   *   A. tab AINS, klik penanda  → buka/pulihkan tetingkap + pasang penjaga.
   *   B. DALAM tetingkap         → jambatan (baca/lulus/tolak) + suntik semula penjaga ke tab AINS.
   *   C. JAGA: tab AINS selepas dimuat semula (disuntik oleh B) → penjaga sahaja.
   * Penjaga menulis semula tetingkap jika ia dimuat semula (halamannya about:blank, jadi muat semula
   * mengosongkannya). MOD "tab" (LALAI semula sejak 2026-11-27; tetingkap = ?mod=tetingkap) = jambatan dalam tab AINS,
   * SahPantas dalam tab baharu — putus apabila tab AINS dimuat semula. */
  var MOD = "__SAHPANTAS_MOD__";
  var ASAL = "https://ains.moe.gov.my";
  var NAMA_TETINGKAP = "sahpantas-tetingkap";
  var DALAM = window.name === NAMA_TETINGKAP && !!window.__sahpantasInfo;
  var JAGA = !DALAM && !!window.__sahpantasJaga;
  var SUMBER = "semak-ains";
  var J = {
    sedia: "sedia",
    sekolah: "sekolah",
    mula: "mula",
    rekod: "rekod",
    selesaiBaca: "selesai-baca",
    laksana: "laksana",
    kemajuan: "kemajuan",
    mengesahkan: "mengesahkan",
    henti: "henti",
    selesaiLaksana: "selesai-laksana"
  };

  function sihat(w) {
    try { return !!(w.__semakAins && w.document.getElementById("bingkai")); } catch (e) { return false; }
  }
  /* Tulis halaman pembalut (iframe SahPantas) ke dalam tetingkap w, kemudian jalankan kod ini
   * semula DI DALAM w sebagai jambatan (peranan B). */
  function tulisTetingkap(w, info) {
    w.document.open();
    w.document.write(
      '<!doctype html><html lang="ms"><head><meta charset="utf-8"><title>SahPantas AINS</title>' +
      "<style>html,body{margin:0;height:100%;overflow:hidden;background:#fff}iframe{display:block;border:0;width:100%;height:100%}</style>" +
      '</head><body><iframe id="bingkai" title="SahPantas AINS" allow="clipboard-write" src="' + NEXA +
      '/tools/semak-ains/tetingkap"></iframe></body></html>'
    );
    w.document.close();
    /* document.open() memadam pendengar lama tetapi objek window kekal — buang jambatan lama
     * supaya peranan B membina yang baharu (bukan menganggap ia sudah ada). */
    w.__semakAins = null;
    w.__sahpantasInfo = info;
    w.eval("(" + utama.toString() + ")()");
  }
  /* Penjaga (tab AINS): pulihkan tetingkap jika ia dimuat semula. Berhenti apabila tetingkap
   * ditutup atau selepas 3 percubaan pulih berturut-turut gagal. */
  function jaga(w, info) {
    if (window.__sahpantasPenjaga) clearInterval(window.__sahpantasPenjaga);
    var cubaan = 0;
    window.__sahpantasPenjaga = setInterval(function () {
      try {
        if (w.closed || cubaan >= 3) {
          clearInterval(window.__sahpantasPenjaga);
          window.__sahpantasPenjaga = 0;
          return;
        }
        if (sihat(w)) { cubaan = 0; return; }
        if (w.document.readyState !== "complete") return;
        cubaan++;
        tulisTetingkap(w, info);
      } catch (e) {}
    }, 1500);
  }

  var namaSekolah = "", kodSekolah = null;
  if (JAGA) {
    var j = window.__sahpantasJaga;
    window.__sahpantasJaga = null;
    jaga(j.w, { nama: j.nama, kod: j.kod });
    return;
  }
  if (DALAM) {
    /* Penanda diklik di dalam tetingkap SahPantas sendiri: jambatan sudah ada — jangan gandakan. */
    if (window.__semakAins) { window.__semakAins.hantarSekolah(); return; }
    namaSekolah = String(window.__sahpantasInfo.nama || "");
    kodSekolah = window.__sahpantasInfo.kod || null;
  } else {
  if (location.hostname !== "ains.moe.gov.my") {
    alert("SahPantas AINS: sila klik penanda ini semasa berada di laman AINS (ains.moe.gov.my) selepas log masuk sebagai guru.");
    return;
  }
  if (MOD === "tab" && window.__semakAins && window.__semakAins.tetingkap && !window.__semakAins.tetingkap.closed) {
    window.__semakAins.hantarSekolah();
    window.__semakAins.tetingkap.focus();
    return;
  }

  var baris = (document.body.innerText || "")
    .split("\n")
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
  /* Portal Guru dikenal pasti melalui pautan senarai rekod guru (kepala "PORTAL GURU"
   * tersembunyi pada tetingkap sempit). Nama sekolah = baris sebelum ID pengguna
   * (x@y) dalam menu profil; jika tiada, baris pertama yang bermula "SEKOLAH ". */
  if (!document.querySelector('a[href*="teacher-record-list"]')) {
    alert("SahPantas AINS: sila buka Papan Pemuka guru AINS (Portal Guru) dahulu, kemudian klik penanda ini sekali lagi.");
    return;
  }
  var iId = baris.findIndex(function (s) { return /^[\w.-]+@[\w.-]+$/.test(s); });
  namaSekolah = (iId > 0 && /^SEKOLAH\s/i.test(baris[iId - 1]) ? baris[iId - 1] : "") ||
    baris.find(function (s) { return /^SEKOLAH\s/i.test(s); }) || "";
  var idGpm = baris.find(function (s) { return /^gpm@[A-Za-z]{3}\d{4}$/i.test(s); }) || "";
  kodSekolah = idGpm ? idGpm.split("@")[1].toUpperCase() : null;

  if (MOD !== "tab") {
    var info = { nama: namaSekolah, kod: kodSekolah };
    var w = window.open("", NAMA_TETINGKAP);
    if (!w) {
      alert("SahPantas AINS: tetingkap baharu disekat. Sila benarkan pop-up untuk ains.moe.gov.my dan cuba lagi.");
      return;
    }
    var samaSekolah = false;
    try { samaSekolah = sihat(w) && !!w.__sahpantasInfo && w.__sahpantasInfo.nama === info.nama; } catch (e) {}
    if (samaSekolah) {
      try { w.__semakAins.hantarSekolah(); } catch (e) {}
    } else {
      try { tulisTetingkap(w, info); }
      catch (e) {
        alert("SahPantas AINS: tetingkap SahPantas tidak dapat disediakan. Tutup tetingkap itu, kemudian klik penanda ini sekali lagi.");
        return;
      }
    }
    jaga(w, info);
    w.focus();
    return;
  }
  }

  var keadaan = {
    tetingkap: null, idDibaca: new Set(), kunciData: new Map(), henti: false, sibuk: false, tapisan: {},
    mod: null, berjaya: 0, gagal: 0, giliran: 0, hantarSekolah: null
  };
  window.__semakAins = keadaan;

  function tidur(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function hantar(mesej) {
    if (!keadaan.tetingkap || keadaan.tetingkap.closed) return false;
    mesej.sumber = SUMBER;
    keadaan.tetingkap.postMessage(mesej, NEXA);
    return true;
  }
  function hantarSekolah() {
    hantar({ jenis: J.sekolah, nama: namaSekolah, kod: kodSekolah, versiPenanda: VERSI_PENANDA });
  }
  keadaan.hantarSekolah = hantarSekolah;
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
      /* updatestatus memerlukan ID dalaman berangka (= data-key baris = #data_id halaman butiran),
       * BUKAN UUID pautan. UUID dihantar ke NEXa (pautan "Buka dalam AINS"); kunci kekal di sini. */
      var baris = a.closest("[data-key]");
      var kunci = baris ? (baris.getAttribute("data-key") || "").trim() : "";
      if (/^\d+$/.test(kunci)) keadaan.kunciData.set(decodeURIComponent(m[1]), kunci);
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
    return ASAL + "/web/teacher-record-list?" + q.toString();
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
  /* giliran (pilihan): bacaan ini berhenti senyap jika giliran berubah (bacaan baharu bermula). */
  async function bacaSemua(lapor, kemajuanHalaman, giliran) {
    function basi() { return giliran != null && giliran !== keadaan.giliran; }
    var p1 = await ambilHalaman(1);
    if (basi()) return { rekod: [], gagal: [], dihentikan: true };
    var jumlah = p1.rekod.length ? jumlahHalaman(p1.doc) : 0;
    var semua = p1.rekod.slice();
    var gagal = [];
    var dihentikan = false;
    if (lapor) lapor(p1.rekod, 1, jumlah);
    if (kemajuanHalaman) kemajuanHalaman(1, jumlah);
    for (var h = 2; h <= jumlah; h++) {
      if (keadaan.henti || basi()) { dihentikan = true; break; }
      await tidur(100);
      var hasil;
      try { hasil = await ambilHalaman(h); }
      catch (e) { if (e && e.message === RALAT_SESI) throw e; gagal.push(h); continue; }
      if (basi()) { dihentikan = true; break; }
      semua = semua.concat(hasil.rekod);
      jumlah = Math.max(jumlah, jumlahHalaman(hasil.doc));
      if (lapor) lapor(hasil.rekod, h, jumlah);
      if (kemajuanHalaman) kemajuanHalaman(h, jumlah);
    }
    return { rekod: semua, gagal: gagal, dihentikan: dihentikan };
  }
  function tolakLaksana(ralat) {
    hantar({ jenis: J.selesaiLaksana, berjaya: 0, gagal: 0, masihMenunggu: [], dihentikan: true, ralat: ralat });
  }
  async function mula(tapisan) {
    if (keadaan.sibuk && keadaan.mod === "baca") {
      /* Tab SahPantas dimuat semula semasa membaca lalu meminta bacaan baharu: tinggalkan bacaan
       * lama (giliran berubah → ia berhenti tanpa melapor) dan mula semula. */
      keadaan.giliran++;
      keadaan.sibuk = false;
      keadaan.mod = null;
    }
    if (keadaan.sibuk) {
      hantar({ jenis: J.selesaiBaca, bilangan: 0, ralat: "Penanda sedang sibuk. Tunggu proses semasa selesai.", halamanGagal: [] });
      return;
    }
    keadaan.sibuk = true;
    keadaan.mod = "baca";
    keadaan.henti = false;
    keadaan.giliran++;
    var giliran = keadaan.giliran;
    keadaan.tapisan = {
      tahun: tapisan && tapisan.tahun ? String(tapisan.tahun) : "",
      kelas: tapisan && tapisan.kelas ? String(tapisan.kelas) : ""
    };
    keadaan.idDibaca = new Set();
    keadaan.kunciData = new Map();
    try {
      var hasil = await bacaSemua(function (rekod, h, jumlah) {
        rekod.forEach(function (r) { keadaan.idDibaca.add(r.id); });
        hantar({ jenis: J.rekod, rekod: rekod, halaman: h, jumlahHalaman: jumlah });
      }, null, giliran);
      if (giliran !== keadaan.giliran) return;
      keadaan.sibuk = false;
      keadaan.mod = null;
      hantar({
        jenis: J.selesaiBaca,
        bilangan: hasil.rekod.length,
        ralat: hasil.dihentikan ? "Bacaan dihentikan sebelum selesai — hanya sebahagian rekod disemak." : null,
        halamanGagal: hasil.gagal
      });
    } catch (e) {
      if (giliran !== keadaan.giliran) return;
      keadaan.sibuk = false;
      keadaan.mod = null;
      hantar({ jenis: J.selesaiBaca, bilangan: keadaan.idDibaca.size, ralat: String((e && e.message) || e), halamanGagal: [] });
    } finally {
      if (giliran === keadaan.giliran) {
        keadaan.sibuk = false;
        keadaan.mod = null;
      }
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
    /* Tiada confirm() di sini: tab AINS sentiasa di latar belakang semasa arahan tiba dan Chrome
     * menyekat confirm() tab latar belakang (terus pulang false). Pengesahan GPM dibuat dalam
     * dialog "Luluskan/Tolak N rekod?" di tab SahPantas. Had kekal: asal NEXa + tetingkap yang
     * dibuka penanda ini + ID yang dibaca dalam sesi ini sahaja. */
    keadaan.sibuk = true;
    keadaan.mod = "laksana";
    keadaan.berjaya = 0;
    keadaan.gagal = 0;
    keadaan.henti = false;
    keadaan.giliran++;
    var giliran = keadaan.giliran;
    var jeda = Math.min(2000, Math.max(300, Number(arahan.jedaMs) || 500));
    var berjaya = 0, gagal = 0, gagalBerturut = 0, ralat = null, selesai = [];
    var dihentikan = false;
    var masihMenunggu = [];
    try {
      for (var i = 0; i < item.length; i++) {
        if (giliran !== keadaan.giliran || keadaan.henti || !keadaan.tetingkap || keadaan.tetingkap.closed) break;
        var x = item[i];
        var ok = false, jawapan = null;
        try {
          /* Sama seperti updatestatus() halaman butiran AINS: id = #data_id (berangka), bukan UUID.
           * Dengan UUID, AINS tetap menjawab "success" tetapi tiada rekod berubah. */
          var kunci = keadaan.kunciData.get(x.id);
          if (!kunci) throw new Error("ID dalaman rekod tiada — baca semula senarai.");
          var q = new URLSearchParams({ id: kunci, comment: String(x.komen || "").slice(0, 500), status: tindakan });
          var res = await fetch(ASAL + "/reading-record/updatestatus?" + q.toString(), {
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
        keadaan.berjaya = berjaya;
        keadaan.gagal = gagal;
        hantar({ jenis: J.kemajuan, id: x.id, berjaya: ok, jawapan: ok ? null : jawapan });
        if (gagalBerturut >= 3) { ralat = "3 kegagalan berturut-turut — dihentikan. Sesi AINS mungkin tamat."; break; }
        await tidur(jeda);
      }
      dihentikan = keadaan.henti || ralat !== null || berjaya + gagal < item.length;
      if (giliran === keadaan.giliran && selesai.length && keadaan.tetingkap && !keadaan.tetingkap.closed) {
        keadaan.henti = false;
        try {
          hantar({ jenis: J.mengesahkan, halaman: 0, jumlahHalaman: 0 });
          var semakan = await bacaSemua(null, function (h, jumlah) {
            hantar({ jenis: J.mengesahkan, halaman: h, jumlahHalaman: jumlah });
          });
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
      if (giliran === keadaan.giliran) {
        keadaan.sibuk = false;
        keadaan.mod = null;
        hantar({ jenis: J.selesaiLaksana, berjaya: berjaya, gagal: gagal, masihMenunggu: masihMenunggu, dihentikan: dihentikan, ralat: ralat });
      }
    }
  }

  window.addEventListener("message", function (e) {
    if (e.origin !== NEXA || !e.data || e.data.sumber !== SUMBER) return;
    if (!keadaan.tetingkap || e.source !== keadaan.tetingkap) return;
    var d = e.data;
    if (d.jenis === J.sedia) {
      hantarSekolah();
    } else if (d.jenis === J.mula) {
      mula(d.tapisan || {});
    } else if (d.jenis === J.laksana) {
      laksana(d);
    } else if (d.jenis === J.henti) {
      keadaan.henti = true;
    }
  });

  /* Muat semula/navigasi tab AINS memadam penanda ini. Selagi tab SahPantas masih terbuka,
   * minta pelayar mengesahkan dahulu ("Leave site?") supaya GPM tidak memutuskan sambungan
   * secara tidak sengaja. (Dialog pelayar sahaja — tiada confirm()/alert().) */
  window.addEventListener("beforeunload", function (e) {
    /* Mod tetingkap: hanya semasa membaca/melaksana (penjaga memulihkan tetingkap selepas muat semula). */
    if (DALAM ? !keadaan.sibuk : (!keadaan.tetingkap || keadaan.tetingkap.closed)) return;
    e.preventDefault();
    e.returnValue = "";
  });

  window.addEventListener("pagehide", function () {
    if (!keadaan.sibuk) return;
    var mod = keadaan.mod;
    keadaan.sibuk = false;
    keadaan.mod = null;
    keadaan.henti = true;
    keadaan.giliran++;
    if (mod === "baca") {
      hantar({ jenis: J.selesaiBaca, bilangan: keadaan.idDibaca.size, ralat: "Halaman AINS ditutup atau dimuat semula semasa membaca.", halamanGagal: [] });
    } else if (mod === "laksana") {
      hantar({
        jenis: J.selesaiLaksana, berjaya: keadaan.berjaya, gagal: keadaan.gagal, masihMenunggu: [],
        dihentikan: true, ralat: "Halaman AINS ditutup atau dimuat semula semasa tindakan. Semak AINS secara manual."
      });
    }
  });

  if (DALAM) {
    /* Mod tetingkap: rakan = iframe SahPantas dalam tetingkap ini (WindowProxy kekal walaupun iframe dimuat semula). */
    var bingkai = document.getElementById("bingkai");
    keadaan.tetingkap = bingkai ? bingkai.contentWindow : null;
    /* Tab AINS dimuat semula = penjaganya hilang. Suntik semula penjaga sahaja (peranan C) supaya
     * tetingkap ini masih dipulihkan jika ia pula dimuat semula kemudian. */
    setInterval(function () {
      try {
        var o = window.opener;
        if (!o || o === window || o.closed) return;
        if (o.location.origin !== ASAL || o.document.readyState !== "complete" || o.__sahpantasPenjaga) return;
        o.__sahpantasJaga = { w: window, nama: namaSekolah, kod: kodSekolah };
        o.eval("(" + utama.toString() + ")()");
      } catch (e) {}
    }, 3000);
    return;
  }
  keadaan.tetingkap = window.open(NEXA + "/tools/semak-ains", "semak-ains");
  if (!keadaan.tetingkap) {
    alert("SahPantas AINS: tetingkap baharu disekat. Sila benarkan pop-up untuk ains.moe.gov.my dan cuba lagi.");
    window.__semakAins = null;
  }
})();
