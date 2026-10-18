
(() => {
  const cfg = window.INVITE_CONFIG || {};
  const $ = (id) => document.getElementById(id);

  const gate = $("gate");
  const invitation = $("invitation");
  let countdownInterval = null;

  // Supabase client
  const configured =
    typeof cfg.supabaseUrl === "string" &&
    cfg.supabaseUrl.startsWith("https://") &&
    typeof cfg.supabaseAnonKey === "string" &&
    cfg.supabaseAnonKey.length > 0 &&
    !cfg.supabaseAnonKey.startsWith("PASTE_");

  const supabase =
    configured && window.supabase
      ? window.supabase.createClient(
          cfg.supabaseUrl,
          cfg.supabaseAnonKey
        )
      : null;

  // Wedding details
  if ($("bridegroom")) {
    $("bridegroom").textContent = cfg.bridegroomName || "أحمد";
  }

  if ($("bride")) {
    $("bride").textContent = cfg.brideName || "حنين";
  }

  if ($("deceased-father")) {
    $("deceased-father").textContent =
      `يتشرّف أبناء ${cfg.deceasedFatherName || "المرحوم الحاج محمد السلطان"}`;
  }

  if ($("invitation-opening")) {
    $("invitation-opening").textContent =
      "بدعوتكم لحضور حفل زفاف";
  }

  if ($("invitation-relation")) {
    $("invitation-relation").textContent = "أخيهم";
  }

  if ($("bride-father")) {
    $("bride-father").textContent =
      `السيد ${cfg.brideFatherName || "عايد الحلو"}`;
  }

  if ($("venue-name")) {
    $("venue-name").textContent =
      cfg.venueName || "نقابة المهندسين الأردنيين";
  }

  if ($("venue-address")) {
    $("venue-address").textContent = cfg.venueAddress || "العقبة";
  }

  if ($("couple-video") && cfg.coupleVideoUrl) {
    $("couple-video").src = cfg.coupleVideoUrl;
  }

  if ($("couple-photo") && cfg.couplePhotoUrl) {
    $("couple-photo").src = cfg.couplePhotoUrl;
  }

  if ($("music")) {
    $("music").src = cfg.musicUrl || "assets/music.mp3";
  }

  // Map link
  if (cfg.mapUrl && $("map-link")) {
    $("map-link").href = cfg.mapUrl;
    $("map-link").hidden = false;
  }

  // WhatsApp RSVP
  if (cfg.rsvpWhatsAppNumber && $("rsvp-link")) {
    const message = encodeURIComponent(
      "مرحبًا، أود تأكيد حضوري لحفل زفاف أحمد وحنين."
    );

    $("rsvp-link").href =
      `https://wa.me/${cfg.rsvpWhatsAppNumber}?text=${message}`;

    $("rsvp-link").hidden = false;
  }

  // Show the invitation only when opened with a private token.
  // This does NOT mark the invitation as used at the door.
  const token = new URLSearchParams(
    window.location.search
  ).get("t");

  if (gate) gate.hidden = true;

  if (invitation) {
    if (token && token.length >= 32) {
      invitation.hidden = false;
      startCountdown();
    } else {
      invitation.hidden = true;

      const message = document.createElement("p");
      message.className = "error";
      message.textContent =
        "افتح رابط الدعوة الخاص الذي وصلك لعرض تفاصيل المناسبة.";

      if (gate && gate.parentNode) {
        gate.hidden = false;
        gate.replaceChildren(message);
      }
    }
  }

  // Music playback
  const musicButton = $("music-button");

  if (musicButton) {
    musicButton.addEventListener("click", async () => {
      const audio = $("music");
      if (!audio) return;

      if (audio.paused) {
        try {
          await audio.play();
          musicButton.textContent = "❚❚ إيقاف الموسيقى";
        } catch (exception) {
          console.error("Audio playback error:", exception);
          musicButton.textContent = "تعذّر التشغيل؛ جرّب مرة أخرى";
        }
      } else {
        audio.pause();
        musicButton.textContent = "▶ تشغيل الموسيقى";
      }
    });
  }

  // Countdown
  function startCountdown() {
    const countdown = $("countdown");
    if (!countdown) return;

    const target = new Date(
      cfg.weddingDateISO || "2026-11-27T19:00:00+03:00"
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

      const units = [
        ["يوم", Math.floor(difference / 86400000)],
        ["ساعة", Math.floor(difference / 3600000) % 24],
        ["دقيقة", Math.floor(difference / 60000) % 60],
        ["ثانية", Math.floor(difference / 1000) % 60],
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
