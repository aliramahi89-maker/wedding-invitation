(() => {
  const cfg = window.INVITE_CONFIG || {};
  const $ = id => document.getElementById(id);
  const form = $("code-form"), gate = $("gate"), invitation = $("invitation");
  const error = $("error");
  let supabase = null;

  const configured = cfg.supabaseUrl && cfg.supabaseAnonKey &&
    !cfg.supabaseUrl.startsWith("PASTE_") && !cfg.supabaseAnonKey.startsWith("PASTE_");
  if (configured && window.supabase) {
    supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  }

  $("bridegroom").textContent = cfg.bridegroomName || "العريس";
  $("bride").textContent = cfg.brideName || "العروس";
  $("venue-name").textContent = cfg.venueName || "";
  $("venue-address").textContent = cfg.venueAddress || "";
  $("couple-photo").src = cfg.couplePhotoUrl || "assets/couple.jpg";
  $("music").src = cfg.musicUrl || "assets/music.mp3";
  if (cfg.mapUrl) { $("map-link").href = cfg.mapUrl; $("map-link").hidden = false; }
  if (cfg.rsvpWhatsAppNumber) {
    const msg = encodeURIComponent("مرحبًا، أود تأكيد حضوري لحفل الزفاف.");
    $("rsvp-link").href = `https://wa.me/${cfg.rsvpWhatsAppNumber}?text=${msg}`;
    $("rsvp-link").hidden = false;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    error.textContent = "";
    const code = $("code").value.trim();
    if (!/^\d{6}$/.test(code)) { error.textContent = "أدخل رمزًا مكوّنًا من 6 أرقام."; return; }
    if (!supabase) {
      error.textContent = "لم يتم إعداد قاعدة البيانات بعد. اتبع خطوات README أولًا.";
      return;
    }
    const token = new URLSearchParams(location.search).get("t");
    if (!token) { error.textContent = "رابط الدعوة غير مكتمل. افتح الرابط الخاص الذي وصلك."; return; }
    const { data, error: rpcError } = await supabase.rpc("redeem_invitation", {
      p_token: token, p_code: code
    });
    if (rpcError || !data || data.ok !== true) {
    error.textContent = "الرمز غير صحيح أو استُخدم العدد المسموح من المرات.";
    return;
    }
    // Keep returned guest data only in this page's memory; don't save access codes in browser storage.
    gate.hidden = true;
    invitation.hidden = false;
    startCountdown();
  });

  $("music-button").addEventListener("click", async () => {
    const audio = $("music"), button = $("music-button");
    if (audio.paused) {
      try { await audio.play(); button.textContent = "❚❚ إيقاف الموسيقى"; }
      catch { button.textContent = "تعذّر التشغيل؛ جرّب مرة أخرى"; }
    } else { audio.pause(); button.textContent = "▶ تشغيل الموسيقى"; }
  });

  function startCountdown() {
    const target = new Date(cfg.weddingDateISO || "2026-11-27T18:00:00+03:00").getTime();
    const render = () => {
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor(diff / 3600000) % 24;
      const mins = Math.floor(diff / 60000) % 60;
      const secs = Math.floor(diff / 1000) % 60;
      $("countdown").innerHTML = [
        ["يوم",days],["ساعة",hours],["دقيقة",mins],["ثانية",secs]
      ].map(([label,n]) => `<div class="time-unit"><strong>${n}</strong><span>${label}</span></div>`).join("");
    };
    render(); setInterval(render, 1000);
  }
})();
