
(() => {
  const cfg = window.INVITE_CONFIG || {};
  const $ = (id) => document.getElementById(id);

  const form = $("code-form");
  const gate = $("gate");
  const invitation = $("invitation");
  const error = $("error");

  let supabase = null;
  let countdownInterval = null;

  // Check Supabase configuration
  const configured =
    typeof cfg.supabaseUrl === "string" &&
    typeof cfg.supabaseAnonKey === "string" &&
    cfg.supabaseUrl.startsWith("https://") &&
    !cfg.supabaseUrl.startsWith("PASTE_") &&
    !cfg.supabaseAnonKey.startsWith("PASTE_");

  if (configured && window.supabase) {
    supabase = window.supabase.createClient(
      cfg.supabaseUrl,
      cfg.supabaseAnonKey
    );
  }

  // Invitation details
  $("bridegroom").textContent = cfg.bridegroomName || "أحمد";
  $("bride").textContent = cfg.brideName || "حنين";

  $("venue-name").textContent =
    cfg.venueName || "نقابة المهندسين الأردنيين – العقبة";

  $("venue-address").textContent =
    cfg.venueAddress || "مقابل السفارة المصرية";

  $("couple-photo").src =
    cfg.couplePhotoUrl || "assets/couple.jpg";

  $("music").src = cfg.musicUrl || "assets/music.mp3";

  // Map link
  if (cfg.mapUrl) {
    $("map-link").href = cfg.mapUrl;
    $("map-link").hidden = false;
  }

  // WhatsApp RSVP link
  if (cfg.rsvpWhatsAppNumber) {
    const message = encodeURIComponent(
      "مرحبًا، أود تأكيد حضوري لحفل زفاف أحمد وحنين."
    );

    $("rsvp-link").href =
      `https://wa.me/${cfg.rsvpWhatsAppNumber}?text=${message}`;

    $("rsvp-link").hidden = false;
  }

  // Invitation code verification
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    error.textContent = "";

    const code = $("code").value.trim();

    if (!/^\d{6}$/.test(code)) {
      error.textContent = "أدخل رمزًا مكوّنًا من 6 أرقام.";
      return;
    }

    if (!supabase) {
      console.error("Supabase is not configured correctly.");

      error.textContent =
        "تعذّر إعداد خدمة التحقق. يرجى المحاولة لاحقًا.";

      return;
    }

    const token = new URLSearchParams(
      window.location.search
    ).get("t");

    if (!token) {
      error.textContent =
        "رابط الدعوة غير مكتمل. افتح الرابط الخاص الذي وصلك.";

      return;
    }

    const submitButton = form.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "redeem_invitation",
        {
          p_token: token,
          p_code: code,
        }
      );

      if (rpcError) {
        // Diagnostic details are kept in the browser console.
        console.error("Supabase RPC error:", rpcError);

        error.textContent =
          "تعذّر الاتصال بخدمة التحقق. حاول مرة أخرى لاحقًا.";

        return;
      }

      if (!data || data.ok !== true) {
        error.textContent =
          "الرمز غير صحيح أو استُخدم العدد المسموح من المرات.";

        return;
      }

      // Reveal the invitation only after successful verification.
      gate.hidden = true;
      invitation.hidden = false;

      startCountdown();
    } catch (exception) {
      console.error("Unexpected verification error:", exception);

      error.textContent =
        "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });

  // Music playback
  $("music-button").addEventListener("click", async () => {
    const audio = $("music");
    const button = $("music-button");

    if (audio.paused) {
      try {
        await audio.play();
        button.textContent = "❚❚ إيقاف الموسيقى";
      } catch (exception) {
        console.error("Audio playback error:", exception);

        button.textContent =
          "تعذّر التشغيل؛ جرّب مرة أخرى";
      }
    } else {
      audio.pause();
      button.textContent = "▶ تشغيل الموسيقى";
    }
  });

  // Wedding countdown
  function startCountdown() {
    const countdown = $("countdown");

    if (!countdown) {
      console.error("Countdown element was not found.");
      return;
    }

    const target = new Date(
      cfg.weddingDateISO || "2026-11-27T20:00:00+03:00"
    ).getTime();

    if (Number.isNaN(target)) {
      console.error("Invalid wedding date.");
      return;
    }

    if (countdownInterval !== null) {
      clearInterval(countdownInterval);
    }

    const render = () => {
      const difference = Math.max(0, target - Date.now());

      const days = Math.floor(difference / 86400000);
      const hours = Math.floor(difference / 3600000) % 24;
      const minutes = Math.floor(difference / 60000) % 60;
      const seconds = Math.floor(difference / 1000) % 60;

      const units = [
        ["يوم", days],
        ["ساعة", hours],
        ["دقيقة", minutes],
        ["ثانية", seconds],
      ];

      countdown.replaceChildren();

      units.forEach(([label, value]) => {
        const unit = document.createElement("div");
        unit.className = "time-unit";

        const number = document.createElement("strong");
        number.textContent = String(value);

        const caption = document.createElement("span");
        caption.textContent = label;

        unit.append(number, caption);
        countdown.appendChild(unit);
      });
    };

    render();
    countdownInterval = setInterval(render, 1000);
  }
})();
