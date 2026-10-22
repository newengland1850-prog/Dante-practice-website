// Front page (#/): "All Points Towards Progress" — a picture banner, a box for each
// tab, and a button to see (or install) the mobile version.

// Banner pictures. These are placeholders for now (free photos from Wikimedia Commons):
// replace them with your own. `src` can be any image address or a file in this folder,
// e.g. "images/banner-1.jpg".
const FRONT_COMMONS = "https://upload.wikimedia.org/wikipedia/commons/thumb/";
const FRONT_BANNER = [
  { src: `${FRONT_COMMONS}1/13/Tunnel_View%2C_Yosemite_Valley%2C_Yosemite_NP_-_Diliff.jpg/1920px-Tunnel_View%2C_Yosemite_Valley%2C_Yosemite_NP_-_Diliff.jpg`,
    caption: "Yosemite Valley", credit: "https://commons.wikimedia.org/wiki/File:Tunnel_View,_Yosemite_Valley,_Yosemite_NP_-_Diliff.jpg" },
  { src: `${FRONT_COMMONS}4/4b/Long_Room_Interior%2C_Trinity_College_Dublin%2C_Ireland_-_Diliff.jpg/1920px-Long_Room_Interior%2C_Trinity_College_Dublin%2C_Ireland_-_Diliff.jpg`,
    caption: "The Long Room, Trinity College Dublin", credit: "https://commons.wikimedia.org/wiki/File:Long_Room_Interior,_Trinity_College_Dublin,_Ireland_-_Diliff.jpg" },
  { src: `${FRONT_COMMONS}c/c5/Moraine_Lake_17092005.jpg/1920px-Moraine_Lake_17092005.jpg`,
    caption: "Moraine Lake, Banff National Park", credit: "https://commons.wikimedia.org/wiki/File:Moraine_Lake_17092005.jpg" },
  { src: `${FRONT_COMMONS}4/43/ESO-VLT-Laser-phot-33a-07.jpg/1920px-ESO-VLT-Laser-phot-33a-07.jpg`,
    caption: "Very Large Telescope under the Milky Way", credit: "https://commons.wikimedia.org/wiki/File:ESO-VLT-Laser-phot-33a-07.jpg" },
  { src: `${FRONT_COMMONS}a/a8/LOC_Main_Reading_Room_Highsmith.jpg/1920px-LOC_Main_Reading_Room_Highsmith.jpg`,
    caption: "Library of Congress Reading Room", credit: "https://commons.wikimedia.org/wiki/File:LOC_Main_Reading_Room_Highsmith.jpg" },
  { src: `${FRONT_COMMONS}d/d3/Aurora_borealis_over_Eielson_Air_Force_Base%2C_Alaska.jpg/1920px-Aurora_borealis_over_Eielson_Air_Force_Base%2C_Alaska.jpg`,
    caption: "Aurora borealis, Alaska", credit: "https://commons.wikimedia.org/wiki/File:Aurora_borealis_over_Eielson_Air_Force_Base,_Alaska.jpg" },
];

// One box per tab.
const FRONT_TABS = [
  { href: "#/stacks", title: "Stacks", text: "Search the encyclopedia and read any Wikipedia article.",
    img: `${FRONT_COMMONS}4/4b/Long_Room_Interior%2C_Trinity_College_Dublin%2C_Ireland_-_Diliff.jpg/500px-Long_Room_Interior%2C_Trinity_College_Dublin%2C_Ireland_-_Diliff.jpg` },
  { href: "#/weather", title: "Weather", text: "Forecasts, city photos and a 36-hour weather map.",
    img: `${FRONT_COMMONS}c/c5/Moraine_Lake_17092005.jpg/500px-Moraine_Lake_17092005.jpg` },
  { href: "#/news", title: "Worldwide National Movement", text: "News from five countries, translated into English, with live stocks.",
    img: "news-logo.svg", logo: true },
];

const front = { slide: 0, timer: 0, ready: false, installPrompt: null };

// ---- Banner ----

function frontShowSlide(n) {
  const slides = document.querySelectorAll("#front-slides .front-slide");
  const dots = document.querySelectorAll("#front-dots button");
  front.slide = (n + slides.length) % slides.length;
  slides.forEach((s, i) => s.classList.toggle("active", i === front.slide));
  dots.forEach((d, i) => d.setAttribute("aria-selected", String(i === front.slide)));
  const p = FRONT_BANNER[front.slide];
  const credit = document.getElementById("front-credit");
  credit.textContent = p.caption;
  if (p.credit) credit.href = p.credit;
  else credit.removeAttribute("href");
}

function frontAutoplay() {
  clearInterval(front.timer);
  front.timer = setInterval(() => {
    if (!document.getElementById("front-view").hidden) frontShowSlide(front.slide + 1);
  }, 6000);
}

function frontBuild() {
  document.getElementById("front-slides").innerHTML = FRONT_BANNER.map((p, i) =>
    `<div class="front-slide${i === 0 ? " active" : ""}" style="background-image:url('${p.src}')" role="img" aria-label="${escapeHtml(p.caption)}"></div>`).join("");
  document.getElementById("front-dots").innerHTML = FRONT_BANNER.map((p, i) =>
    `<button type="button" role="tab" aria-label="Picture ${i + 1}: ${escapeHtml(p.caption)}" aria-selected="${i === 0}" data-i="${i}"></button>`).join("");
  document.getElementById("front-tabs").innerHTML = FRONT_TABS.map(t => `
    <a class="front-tab" href="${t.href}">
      <span class="front-tab-img${t.logo ? " logo" : ""}" style="background-image:url('${t.img}')"></span>
      <span class="front-tab-body">
        <span class="front-tab-title">${escapeHtml(t.title)}</span>
        <span class="front-tab-text">${escapeHtml(t.text)}</span>
      </span>
    </a>`).join("");

  document.getElementById("front-prev").addEventListener("click", () => { frontShowSlide(front.slide - 1); frontAutoplay(); });
  document.getElementById("front-next").addEventListener("click", () => { frontShowSlide(front.slide + 1); frontAutoplay(); });
  document.getElementById("front-dots").addEventListener("click", e => {
    const dot = e.target.closest("[data-i]");
    if (dot) { frontShowSlide(Number(dot.dataset.i)); frontAutoplay(); }
  });
  // Swipe the banner on touch screens.
  let startX = null;
  const banner = document.querySelector(".front-banner");
  banner.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
  banner.addEventListener("touchend", e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { frontShowSlide(front.slide + (dx < 0 ? 1 : -1)); frontAutoplay(); }
    startX = null;
  });
  frontShowSlide(0);
  frontAutoplay();
  frontSetupMobile();
}

// ---- Mobile version ----

const frontIsPhone = () => matchMedia("(max-width: 760px), (pointer: coarse)").matches;

// The browser offers installation (Android Chrome, desktop Chrome/Edge) when the site is
// served from http(s); keep the offer so a button can trigger it.
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  front.installPrompt = e;
  document.getElementById("phone-install").hidden = false;
  if (frontIsPhone()) document.getElementById("front-mobile-label").textContent = "Install the app";
});

async function frontInstall() {
  if (!front.installPrompt) return false;
  front.installPrompt.prompt();
  await front.installPrompt.userChoice;
  front.installPrompt = null;
  document.getElementById("phone-install").hidden = true;
  return true;
}

function frontSizePhone() {
  // Fit the 390 × 844 phone into the window.
  const stage = document.getElementById("phone-stage");
  const scale = Math.min(1, (stage.clientHeight - 16) / 860, (stage.clientWidth - 16) / 410);
  document.getElementById("phone-frame").style.setProperty("--s", scale.toFixed(3));
}

function frontOpenPreview(page = "#/") {
  const dialog = document.getElementById("phone-preview");
  const frame = document.getElementById("phone-iframe");
  frame.src = location.href.split("#")[0] + page;
  dialog.showModal();
  frontSizePhone();
}

function frontSetupMobile() {
  const btn = document.getElementById("front-mobile-btn");
  if (frontIsPhone()) {
    // Already on a phone: the button is about getting the app instead of a preview.
    document.getElementById("front-mobile-label").textContent = front.installPrompt ? "Install the app" : "Get the app";
    document.getElementById("front-mobile-note").textContent = "Add this site to your home screen to use it like an app.";
  }
  btn.addEventListener("click", async () => {
    if (frontIsPhone()) {
      if (await frontInstall()) return;
      const note = document.getElementById("front-mobile-note");
      note.textContent = /iPhone|iPad/.test(navigator.userAgent)
        ? "In Safari, tap Share, then “Add to Home Screen”."
        : "Open your browser's menu and choose “Install app” or “Add to Home screen”.";
      return;
    }
    frontOpenPreview("#/");
  });
  const dialog = document.getElementById("phone-preview");
  document.getElementById("phone-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => { document.getElementById("phone-iframe").src = "about:blank"; });
  document.getElementById("phone-pages").addEventListener("click", e => {
    const b = e.target.closest("[data-page]");
    if (b) document.getElementById("phone-iframe").src = location.href.split("#")[0] + b.dataset.page;
  });
  document.getElementById("phone-install").addEventListener("click", frontInstall);
  window.addEventListener("resize", () => { if (dialog.open) frontSizePhone(); });
}

// Inside the preview, don't offer the preview again.
if (window.top !== window.self) document.documentElement.classList.add("in-preview");

function showFront() {
  document.title = "All Points Towards Progress";
  if (!front.ready) {
    front.ready = true;
    frontBuild();
  }
}
