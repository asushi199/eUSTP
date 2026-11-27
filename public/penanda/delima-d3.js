/* Penanda DELIMa d3 → NEXa. Jalankan dalam tab d3.delima.edu.my selepas log masuk.
 * Membaca ringkasan PPD + setiap sekolah (1 Jan → hari ini) melalui API d3 dengan sesi pengguna,
 * kemudian membuka NEXa (/penanda/delima-d3) untuk semakan dan simpanan. Bilangan sahaja — tiada
 * nama/e-mel individu dibaca. Token d3 hanya dihantar ke API d3, tidak pernah ke NEXa.
 * Tiada alert()/confirm() (Chrome menyekatnya pada tab latar). Ubah fail ini = naikkan VERSI_PENANDA. */
(async function () {
  var VERSI_PENANDA = 1;
  var NEXA = "__NEXA_ORIGIN__";
  var PPD = "PPD MANJUNG";
  var SPP = "https://d3-spp-api.delima.edu.my/options/organization-units";
  var ANALITIK = "https://d3-api.delima.edu.my/analytics/active-teacher-student";
  var ID = "nexa-delima-d3";
  if (document.getElementById(ID)) return;

  var kotak = document.createElement("div");
  kotak.id = ID;
  kotak.setAttribute("role", "status");
  kotak.style.cssText =
    "position:fixed;z-index:2147483647;right:16px;bottom:16px;max-width:340px;padding:14px 16px;" +
    "background:#1a1a1a;color:#fff;font:14px/1.45 system-ui,sans-serif;border-radius:8px;" +
    "box-shadow:0 8px 24px rgba(0,0,0,.3)";
  document.body.appendChild(kotak);
  function papar(teks, akhir) {
    kotak.textContent = "NEXa · DELIMa: " + teks;
    if (akhir) {
      var tutup = document.createElement("button");
      tutup.textContent = "Tutup";
      tutup.style.cssText =
        "display:block;margin-top:10px;padding:6px 12px;border:1px solid #fff;border-radius:4px;" +
        "background:transparent;color:#fff;font:inherit;cursor:pointer";
      tutup.onclick = function () {
        kotak.remove();
      };
      kotak.appendChild(tutup);
    }
  }

  try {
    if (location.hostname !== "d3.delima.edu.my") {
      throw new Error("Buka d3.delima.edu.my dan log masuk dahulu, kemudian klik penanda ini semula.");
    }
    var token = "";
    try {
      var k = document.cookie.match(/(?:^|;\s*)AUTH_CRED=([^;]+)/);
      token = k ? JSON.parse(decodeURIComponent(k[1])).token || "" : "";
    } catch (e) {
      token = "";
    }
    if (!token) throw new Error("Sila log masuk ke DELIMa dahulu, kemudian klik penanda ini semula.");

    var tunggu = function (ms) {
      return new Promise(function (r) {
        setTimeout(r, ms);
      });
    };
    var dapat = async function (url) {
      var ralat;
      for (var cuba = 0; cuba < 3; cuba++) {
        try {
          var r = await fetch(url, { headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
          if (r.status === 401 || r.status === 403) {
            throw Object.assign(new Error("Sesi DELIMa tamat. Log masuk semula, kemudian klik penanda ini."), {
              muktamad: true,
            });
          }
          if (!r.ok) throw new Error("DELIMa menjawab " + r.status);
          var j = await r.json();
          // Sesetengah API membungkus jawapan dalam { data: … }.
          return j && j.data && !j.options && !j.teacher ? j.data : j;
        } catch (e) {
          if (e && e.muktamad) throw e;
          ralat = e;
          await tunggu(800 * (cuba + 1));
        }
      }
      throw ralat || new Error("DELIMa tidak menjawab.");
    };
    var pilihan = async function (id) {
      var j = await dapat(id ? SPP + "/" + encodeURIComponent(id) : SPP);
      var senarai = (j && j.options) || (Array.isArray(j) ? j : []);
      return senarai
        .map(function (x) {
          return { id: String((x && x.value) || ""), nama: String((x && (x.label || x.name)) || "").trim() };
        })
        .filter(function (x) {
          return x.id && x.nama && x.id.indexOf("*") < 0;
        });
    };
    var samaPpd = function (nama) {
      return nama.toUpperCase().replace(/\s+/g, " ").indexOf(PPD) >= 0;
    };

    // Cari unit PPD: turun dari unit teratas pengguna (cth. JPN → PPD), paling dalam 3 aras.
    papar("mencari " + PPD + "…");
    var ppd = null;
    var aras = await pilihan();
    for (var d = 0; d < 3 && !ppd && aras.length; d++) {
      ppd = aras.filter(function (x) {
        return samaPpd(x.nama);
      })[0];
      if (ppd) break;
      if (aras.length > 20) break;
      var bawah = [];
      for (var a = 0; a < aras.length; a++) bawah = bawah.concat(await pilihan(aras[a].id));
      aras = bawah;
    }
    if (!ppd) throw new Error("Unit " + PPD + " tidak dijumpai dalam akaun ini.");
    var sekolah = await pilihan(ppd.id);
    if (!sekolah.length) throw new Error("Tiada sekolah di bawah " + PPD + ".");

    var tarikh = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(new Date());
    var mula = tarikh.slice(0, 4) + "-01-01";
    var angka = async function (unit) {
      var j = await dapat(
        ANALITIK + "?orgUnitId=" + encodeURIComponent(unit.id) + "&startDate=" + mula + "&endDate=" + tarikh,
      );
      var g = j && j.teacher;
      var m = j && j.student;
      var n = [g && g.totalActiveUsers, g && g.totalUsers, m && m.totalActiveUsers, m && m.totalUsers];
      for (var i = 0; i < 4; i++) {
        if (typeof n[i] !== "number" || !isFinite(n[i])) throw new Error("Data " + unit.nama + " tidak lengkap.");
      }
      return [unit.nama].concat(n);
    };

    var daerah = await angka(ppd);
    var baris = new Array(sekolah.length);
    var seterusnya = 0;
    var siap = 0;
    var pekerja = async function () {
      while (seterusnya < sekolah.length) {
        var i = seterusnya++;
        baris[i] = await angka(sekolah[i]);
        siap++;
        papar("membaca sekolah " + siap + " / " + sekolah.length + "…");
      }
    };
    await Promise.all([pekerja(), pekerja(), pekerja(), pekerja()]);

    papar("selesai. Membuka NEXa…");
    var muatan = { v: VERSI_PENANDA, tarikh: tarikh, mula: mula, daerah: daerah, sekolah: baris };
    location.assign(NEXA + "/penanda/delima-d3#d=" + encodeURIComponent(JSON.stringify(muatan)));
  } catch (e) {
    papar((e && e.message) || "Ralat tidak dijangka.", true);
  }
})();
