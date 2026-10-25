/* ==========================================================================
   ELVEX TECHNOLOGIES — SITE SCRIPT
   Builds the header, footer and page content from data/site-data.js.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Data (with admin preview support) ---------- */
  let DATA = window.ELVEX_DATA;
  let previewing = false;
  try {
    if (localStorage.getItem("elvex_preview") === "on") {
      const draft = JSON.parse(localStorage.getItem("elvex_draft") || "null");
      if (draft && draft.products) { DATA = draft; previewing = true; }
    }
  } catch (e) { /* storage unavailable */ }
  if (!DATA) { document.body.innerHTML = "<p style='padding:40px'>data/site-data.js is missing.</p>"; return; }

  const S = DATA.settings || {};
  const CATS = DATA.categories || [];
  const PRODUCTS = DATA.products || [];
  const page = document.body.dataset.page;

  /* ---------- Helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const catName = (id) => (CATS.find((c) => c.id === id) || {}).name || "";
  const countIn = (id) => PRODUCTS.filter((p) => p.category === id).length;
  const plural = (n) => n + (n === 1 ? " product" : " products");
  const qs = (k) => new URLSearchParams(location.search).get(k);
  const isRender = (src) => /^assets\/img\/products\//.test(src || "");
  const svg = (d, fill) => `<svg viewBox="0 0 24 24" fill="${fill ? "currentColor" : "none"}" stroke="${fill ? "none" : "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = {
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>',
    up: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    phone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
    pin: svg('<path d="M12 22s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    download: svg('<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>'),
    shield: svg('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
    cog: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    factory: svg('<path d="M2 20V9l6 4V9l6 4V5h4l2 15z"/><path d="M6 17h2M11 17h2M16 17h2"/>'),
    truck: svg('<path d="M1 6h13v10H1zM14 10h4l3 3v3h-7z"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>'),
    chat: svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
    ruler: svg('<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>'),
    flask: svg('<path d="M9 3h6M10 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>'),
    target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    eye: svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    car: svg('<path d="M5 17h14v-5l-2-5H7l-2 5z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M5 12h14"/>'),
    heart: svg('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/><path d="M7 12h3l1-2 2 4 1-2h3"/>'),
    signal: svg('<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/>'),
    plane: svg('<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'),
    linkedin: svg('<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9z"/>', true),
    instagram: svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>'),
    facebook: svg('<path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6z"/>', true),
    youtube: svg('<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.8 3z"/>', true),
    x: svg('<path d="M18.2 2h3.4l-7.4 8.5L23 22h-6.8l-5.3-7-6.1 7H1.4l7.9-9L1 2h7l4.8 6.4zm-1.2 18h1.9L7.1 4H5.1z"/>', true),
    whatsapp: svg('<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.2.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.2z"/>', true)
  };
  const IND_ICONS = ["sun", "car", "cog", "heart", "signal", "plane"];
  const socials = () => { const soc = S.social || {}; return ["linkedin", "instagram", "facebook", "youtube", "x"].filter((k) => soc[k]).map((k) => `<a href="${esc(soc[k])}" target="_blank" rel="noopener" aria-label="${k}">${ICON[k]}</a>`).join(""); };
  const telHref = (n) => "tel:" + String(n || "").replace(/[^\d+]/g, "");

  /* ---------- Product image + card ---------- */
  const img = (item, alt) => `<img class="${isRender(item.image) ? "" : "photo"}" src="${esc(item.image || "")}" alt="${esc(alt || "")}" loading="lazy">`;
  const productCard = (p) => `
    <a class="p-card" href="product.html?id=${encodeURIComponent(p.id)}">
      <div class="thumb">${img(p, p.name)}</div>
      <div class="body">
        <span class="cat">${esc(catName(p.category))}</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.tagline)}</p>
      </div>
    </a>`;

  /* ---------- Header ---------- */
  function renderHeader() {
    const header = document.createElement("header");
    header.className = "site-header";
    const cur = (p) => (page === p ? ' aria-current="page"' : "");
    const brand = `<a class="brand" href="index.html" aria-label="${esc(S.companyName)} home"><img src="assets/img/mark.png" alt=""><b>${esc(S.companyName)}</b></a>`;
    header.innerHTML = `
      <div class="container nav">
        ${brand}
        <nav class="nav-links" aria-label="Main">
          <a href="index.html"${cur("home")}>Home</a>
          <a href="about.html"${cur("about")}>About</a>
          <div class="has-drop"><button aria-haspopup="true" class="${page === "products" || page === "product" ? "active" : ""}">Products ${ICON.chev}</button>
            <div class="dropdown">
              ${CATS.map((c) => `<a href="products.html?category=${encodeURIComponent(c.id)}">${esc(c.name)}<span>${countIn(c.id)}</span></a>`).join("")}
              <a class="all" href="products.html">All products</a>
            </div>
          </div>
          <a href="index.html#industries">Industries</a>
          <a href="careers.html"${cur("careers")}>Careers</a>
          <a href="contact.html"${cur("contact")}>Contact</a>
        </nav>
        <div class="nav-cta">
          ${S.phone ? `<a class="nav-phone" href="${telHref(S.phone)}">${ICON.phone}${esc(S.phone)}</a>` : ""}
          <a class="btn btn-primary btn-sm" href="contact.html">Request a quote</a>
          <button class="burger" aria-label="Open menu"><span></span><span></span></button>
        </div>
      </div>`;
    document.body.prepend(header);

    const mm = document.createElement("div"); mm.className = "mobile-menu"; mm.setAttribute("role", "dialog"); mm.setAttribute("aria-label", "Menu");
    mm.innerHTML = `<div class="mm-top">${brand}<button class="mm-close" aria-label="Close menu">×</button></div>
      <nav class="mm-links">
        <a href="index.html">Home</a><a href="about.html">About</a><a href="products.html">Products</a>
        <div class="sub">${CATS.map((c) => `<a href="products.html?category=${encodeURIComponent(c.id)}">${esc(c.name)}</a>`).join("")}</div>
        <a href="index.html#industries">Industries</a><a href="careers.html">Careers</a><a href="contact.html">Contact</a>
      </nav>
      <div class="mm-contact">
        ${S.phone ? `<a href="${telHref(S.phone)}">${ICON.phone}${esc(S.phone)}</a>` : ""}
        ${S.email ? `<a href="mailto:${esc(S.email)}">${ICON.mail}${esc(S.email)}</a>` : ""}
      </div>
      <a class="btn btn-primary" href="contact.html">Request a quote</a>`;
    document.body.append(mm);
    const close = () => document.body.classList.remove("menu-open");
    $(".burger", header).onclick = () => document.body.classList.add("menu-open");
    $(".mm-close", mm).onclick = close;
    $$("a", mm).forEach((a) => a.addEventListener("click", close));
    addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    const drop = $(".has-drop", header);
    $("button", drop).onclick = () => drop.classList.toggle("open");
    document.addEventListener("click", (e) => { if (!drop.contains(e.target)) drop.classList.remove("open"); });
  }

  /* ---------- Footer ---------- */
  function renderFooter() {
    const f = document.createElement("footer");
    f.className = "site-footer";
    f.innerHTML = `
      <div class="container foot-top">
        <div>
          <span class="foot-logo"><img src="assets/img/mark.png" alt=""><b>${esc(S.companyName)}</b></span>
          <p>${esc(S.tagline || "")}</p>
          <div class="f-soc">${socials()}</div>
        </div>
        <div><h4>Company</h4><ul class="fl">
          <li><a href="about.html">About</a></li><li><a href="index.html#industries">Industries</a></li><li><a href="careers.html">Careers</a></li><li><a href="contact.html">Contact</a></li></ul></div>
        <div><h4>Products</h4><ul class="fl">${CATS.map((c) => `<li><a href="products.html?category=${encodeURIComponent(c.id)}">${esc(c.name)}</a></li>`).join("")}</ul></div>
        <div><h4>Contact</h4><ul class="ci">
          ${S.address ? `<li>${ICON.pin}<span>${esc(S.address)}</span></li>` : ""}
          ${S.phone ? `<li>${ICON.phone}<a href="${telHref(S.phone)}">${esc(S.phone)}</a></li>` : ""}
          ${S.email ? `<li>${ICON.mail}<a href="mailto:${esc(S.email)}">${esc(S.email)}</a></li>` : ""}
          ${S.hours ? `<li>${ICON.clock}<span>${esc(S.hours)}</span></li>` : ""}
        </ul></div>
      </div>
      <div class="foot-bottom"><div class="container"><span>© ${new Date().getFullYear()} ${esc(S.companyName)}. All rights reserved.</span><span>Bengaluru, India</span></div></div>`;
    document.body.append(f);

    if (S.whatsapp) {
      const wa = document.createElement("a");
      wa.className = "wa-float"; wa.target = "_blank"; wa.rel = "noopener"; wa.setAttribute("aria-label", "Chat on WhatsApp");
      wa.href = "https://wa.me/" + S.whatsapp.replace(/[^\d]/g, ""); wa.innerHTML = ICON.whatsapp;
      document.body.append(wa);
    }
    const top = document.createElement("button");
    top.className = "to-top"; top.setAttribute("aria-label", "Back to top"); top.innerHTML = ICON.up;
    if (!S.whatsapp) top.style.bottom = "20px";
    top.onclick = () => scrollTo({ top: 0, behavior: "smooth" });
    document.body.append(top);
    addEventListener("scroll", () => top.classList.toggle("show", scrollY > 600), { passive: true });

    if (previewing) {
      const b = document.createElement("div");
      b.className = "preview-bar";
      b.innerHTML = `Preview mode: showing unsaved admin changes <button>Exit preview</button>`;
      $("button", b).onclick = () => { try { localStorage.setItem("elvex_preview", "off"); } catch (e) {} location.reload(); };
      document.body.append(b);
    }
  }

  /* ---------- Shared blocks ---------- */
  function aboutBlock() {
    $("#about-title").textContent = S.aboutTitle || "";
    $("#about-text").innerHTML = (S.aboutText || "").split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join("");
  }
  function industries() {
    const el = $("#ind-grid"); if (!el) return;
    el.innerHTML = (DATA.industries || []).map((d) => `<li class="reveal"><h3>${esc(d.name)}</h3><p>${esc(d.description)}</p></li>`).join("");
  }
  function ctaBlock() {
    const el = $("#cta"); if (!el) return;
    el.innerHTML = `<div><h2>Have a drawing? Send it to us.</h2><p>Tell us the part, the quantity and the deadline. We will reply with questions or a quote.</p>
      <div class="acts"><a class="btn btn-primary" href="contact.html">Request a quote</a><a class="btn btn-white" href="products.html">View products</a></div></div>
      <ul class="cta-contact">
        ${S.phone ? `<li>${ICON.phone}<div><b>Call</b><a href="${telHref(S.phone)}">${esc(S.phone)}</a></div></li>` : ""}
        ${S.email ? `<li>${ICON.mail}<div><b>Email</b><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></div></li>` : ""}
        ${S.address ? `<li>${ICON.pin}<div><b>Visit</b>${esc(S.address)}</div></li>` : ""}
      </ul>`;
  }

  /* ---------- Home ---------- */
  function homePage() {
    $("#hero-title").textContent = S.heroTitle || "";
    $("#hero-sub").textContent = S.heroSubtitle || "";
    const call = $("#hero-call");
    if (S.phone) { call.href = telHref(S.phone); call.innerHTML = `${ICON.phone}${esc(S.phone)} <span>Talk to an engineer</span>`; } else call.remove();
    aboutBlock();
    $("#cat-grid").innerHTML = CATS.map((c) => `
      <a class="cat-card" href="products.html?category=${encodeURIComponent(c.id)}">
        <div class="ph"><img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy"></div>
        <div class="tx"><h3>${esc(c.name)}</h3><p>${esc(c.description)}</p><span class="meta">${plural(countIn(c.id))}</span></div>
      </a>`).join("");
    const feat = PRODUCTS.filter((p) => p.featured);
    $("#featured-grid").innerHTML = (feat.length ? feat : PRODUCTS).slice(0, 8).map(productCard).join("");
    $("#pcount").textContent = `All ${PRODUCTS.length} products`;
    industries();
  }

  /* ---------- Products ---------- */
  function productsPage() {
    let active = qs("category") || "all";
    let term = qs("q") || "";
    const input = $("#search"); input.value = term;
    const items = [["all", "All Products", PRODUCTS.length]].concat(CATS.map((c) => [c.id, c.name, countIn(c.id)]));
    $("#cat-list").innerHTML = items.map(([id, n, k]) => `<li><button data-c="${esc(id)}">${esc(n)}<span>${k}</span></button></li>`).join("");
    $("#mobile-cats").innerHTML = items.map(([id, n]) => `<button data-c="${esc(id)}">${esc(n)}</button>`).join("");
    function draw() {
      $$("[data-c]").forEach((b) => b.classList.toggle("active", b.dataset.c === active));
      const t = term.trim().toLowerCase();
      const list = PRODUCTS.filter((p) => (active === "all" || p.category === active) &&
        (!t || [p.name, p.tagline, p.description, catName(p.category), ...(p.applications || [])].join(" ").toLowerCase().includes(t)));
      $("#grid").innerHTML = list.length ? list.map(productCard).join("") : `<div class="empty" style="grid-column:1/-1">No products match your search. <a class="link-more" href="contact.html">Ask us about a custom design </a></div>`;
      $("#count").innerHTML = `Showing <b>${list.length}</b> of ${PRODUCTS.length} products`;
      const cat = CATS.find((c) => c.id === active);
      $("#ph-title").textContent = cat ? cat.name : "Our Products";
      $("#ph-sub").textContent = cat ? cat.description : "Explore our complete range of electromagnetic and electronic components.";
      $("#ph-crumb").innerHTML = cat ? `<a href="products.html">Products</a><i>/</i>${esc(cat.name)}` : "Products";
      document.title = (cat ? cat.name : "Products") + " | " + S.companyName;
      try { const u = new URL(location); active === "all" ? u.searchParams.delete("category") : u.searchParams.set("category", active); t ? u.searchParams.set("q", term) : u.searchParams.delete("q"); history.replaceState(null, "", u); } catch (e) {}
    }
    document.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (b) { active = b.dataset.c; draw(); } });
    input.addEventListener("input", () => { term = input.value; draw(); });
    draw();
  }

  /* ---------- Product detail ---------- */
  function productPage() {
    const p = PRODUCTS.find((x) => x.id === qs("id"));
    const root = $("#pd");
    if (!p) { root.innerHTML = `<div class="empty" style="grid-column:1/-1">Product not found. <a class="link-more" href="products.html">Back to products </a></div>`; return; }
    document.title = p.name + " | " + S.companyName;
    const cat = CATS.find((c) => c.id === p.category);
    $("#ph-title").textContent = p.name;
    $("#ph-crumb").innerHTML = `<a href="products.html">Products</a><i>/</i>${cat ? `<a href="products.html?category=${encodeURIComponent(cat.id)}">${esc(cat.name)}</a><i>/</i>` : ""}${esc(p.name)}`;
    const pics = [p.image, ...(p.gallery || [])].filter(Boolean);
    root.innerHTML = `
      <div class="pd-gallery">
        <div class="main" id="pd-main">${img(p, p.name)}</div>
        ${pics.length > 1 ? `<div class="pd-thumbs">${pics.map((src, i) => `<button class="${i ? "" : "active"}" data-src="${esc(src)}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>` : ""}
      </div>
      <div class="pd-info">
        <span class="cat">${esc(catName(p.category))}</span>
        <h1>${esc(p.name)}</h1>
        <p class="tagline">${esc(p.tagline)}</p>
        <p class="desc">${esc(p.description)}</p>
        ${(p.specs || []).length ? `<div class="pd-quick">${p.specs.slice(0, 4).map((s) => `<div><span>${esc(s.label)}</span><b>${esc(s.value)}</b></div>`).join("")}</div>` : ""}
        <div class="pd-actions">
          <a class="btn btn-primary" href="contact.html?product=${encodeURIComponent(p.name)}" data-arrow>Request a quote </a>
          ${p.datasheet ? `<a class="btn btn-outline" href="${esc(p.datasheet)}" target="_blank" rel="noopener">${ICON.download} Datasheet</a>` : ""}
          ${S.whatsapp ? `<a class="btn btn-outline" href="https://wa.me/${esc(S.whatsapp.replace(/[^\d]/g, ""))}?text=${encodeURIComponent("Enquiry: " + p.name)}" target="_blank" rel="noopener">WhatsApp us</a>` : ""}
        </div>
      </div>`;
    $$(".pd-thumbs button").forEach((b) => b.onclick = () => {
      $$(".pd-thumbs button").forEach((x) => x.classList.toggle("active", x === b));
      const im = $("#pd-main img"); im.src = b.dataset.src; im.className = isRender(b.dataset.src) ? "" : "photo";
    });
    const tabs = [];
    if ((p.specs || []).length) tabs.push(["Specifications", `<div class="table-scroll"><table class="spec-table">${p.specs.map((s) => `<tr><th>${esc(s.label)}</th><td>${esc(s.value)}</td></tr>`).join("")}</table></div>`]);
    if ((p.features || []).length) tabs.push(["Features", `<ul class="bullets">${p.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`]);
    if ((p.applications || []).length) tabs.push(["Applications", `<ul class="bullets">${p.applications.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`]);
    if (tabs.length) {
      $("#pd-tabs").innerHTML = `<div class="tabs"><div class="tab-btns">${tabs.map((t, i) => `<button class="${i ? "" : "on"}" data-t="${i}">${t[0]}</button>`).join("")}</div>${tabs.map((t, i) => `<div class="tab-pane ${i ? "" : "on"}">${t[1]}</div>`).join("")}</div>`;
      $$(".tab-btns button").forEach((b) => b.onclick = () => { $$(".tab-btns button").forEach((x) => x.classList.toggle("on", x === b)); $$(".tab-pane").forEach((x, k) => x.classList.toggle("on", k === +b.dataset.t)); });
    }
    const rel = PRODUCTS.filter((x) => x.id !== p.id && x.category === p.category).concat(PRODUCTS.filter((x) => x.id !== p.id && x.category !== p.category)).slice(0, 4);
    $("#related").innerHTML = rel.map(productCard).join("");
  }

  /* ---------- About ---------- */
  function aboutPage() {
    aboutBlock();
    $("#spec-sheet").innerHTML = (S.specSheet || []).map((r) => `<div><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd></div>`).join("");
    industries();
  }

  /* ---------- Contact ---------- */
  function contactPage() {
    const cards = [
      ["pin", "Our Address", S.address && esc(S.address)],
      ["phone", "Call Us", S.phone && `<a href="${telHref(S.phone)}">${esc(S.phone)}</a>`],
      ["mail", "Email Us", S.email && `<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>`]
    ].filter((c) => c[2]);
    $("#info-cards").innerHTML = cards.map(([ic, t, v]) => `<div class="info-card"><div class="ic">${ICON[ic]}</div><h3>${t}</h3><p>${v}</p></div>`).join("");
    $("#contact-side").innerHTML = `<h3>Talk to our team</h3><p>Send your drawing or specification and tell us the quantity. We will reply by email or phone.</p>
      <ul>
        ${S.hours ? `<li>${ICON.clock}<span>${esc(S.hours)}</span></li>` : ""}
        ${S.whatsapp ? `<li>${ICON.whatsapp}<a href="https://wa.me/${esc(S.whatsapp.replace(/[^\d]/g, ""))}" target="_blank" rel="noopener">WhatsApp: ${esc(S.whatsapp)}</a></li>` : ""}
        
        
      </ul>`;
    if (S.mapEmbedUrl) $("#map").innerHTML = `<div class="map"><iframe src="${esc(S.mapEmbedUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map"></iframe></div>`;
    const sel = $("#f-product");
    sel.innerHTML = `<option value="">General enquiry</option>` + PRODUCTS.map((p) => `<option>${esc(p.name)}</option>`).join("") + `<option>Custom design</option>`;
    const pre = qs("product"); if (pre) sel.value = pre;
    $("#contact-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, msg = $("#form-msg"), fd = new FormData(f);
      if (S.formEndpoint) {
        msg.textContent = "Sending…"; msg.style.color = "var(--muted)";
        try {
          const r = await fetch(S.formEndpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } });
          if (!r.ok) throw 0;
          f.reset(); msg.textContent = "Thank you. We'll get back to you within one business day."; msg.style.color = "#1a8a4a";
        } catch (err) { msg.textContent = "The form could not be sent. Please email us at " + S.email; msg.style.color = "#c53030"; }
      } else {
        const body = [...fd.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
        location.href = `mailto:${S.email}?subject=${encodeURIComponent("Website enquiry" + (fd.get("product") ? " - " + fd.get("product") : ""))}&body=${encodeURIComponent(body)}`;
        msg.textContent = "Opening your email app. If nothing happens, email us at " + S.email; msg.style.color = "var(--muted)";
      }
    });
  }

  /* ---------- Careers ---------- */
  function careersPage() {
    const C = DATA.careers || {};
    const jobs = (C.jobs || []).filter((j) => j && j.title);
    const endpoint = (S.careersEndpoint || "").trim();
    $("#cr-company").textContent = S.companyName || "";
    if (C.intro) $("#cr-intro").textContent = C.intro;

    // Openings
    $("#jobs").innerHTML = jobs.length ? jobs.map((j, i) => `
      <div class="job reveal">
        <div class="job-main">
          <h3>${esc(j.title)}</h3>
          <div class="job-meta">
            ${j.location ? `<span>${ICON.pin}${esc(j.location)}</span>` : ""}
            ${j.type ? `<span>${ICON.clock}${esc(j.type)}</span>` : ""}
          </div>
          ${j.description ? `<p>${esc(j.description)}</p>` : ""}
        </div>
        <a class="btn btn-primary btn-sm" href="#apply" data-apply="${i}">Apply now</a>
      </div>`).join("")
      : `<div class="empty">There are currently no advertised openings. You are welcome to send a general application below and we will keep it on file for future roles.</div>`;

    // Position select
    const sel = $("#c-position");
    sel.innerHTML = `<option value="">Select a position</option>` + jobs.map((j) => `<option>${esc(j.title)}</option>`).join("") + `<option>General application</option>`;
    if (!jobs.length) sel.value = "General application";
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-apply]"); if (!b) return;
      sel.value = jobs[+b.dataset.apply].title;
      setTimeout(() => $("#c-name").focus({ preventScroll: true }), 400);
    });

    $("#careers-side").innerHTML = `<h3>How to apply</h3><p>Fill in the form with your details and attach your resume. Our team reviews every application and will contact shortlisted candidates.</p>
      <ul>
        <li>${ICON.shield}<span>Your details are used only for recruitment</span></li>
        <li>${ICON.download}<span>Resume formats: PDF, DOC or DOCX, up to 5 MB</span></li>
        ${S.hours ? `<li>${ICON.clock}<span>${esc(S.hours)}</span></li>` : ""}
      </ul>`;

    const form = $("#career-form"), msg = $("#c-form-msg"), btn = $("#c-submit");

    // Validation
    const MAX = 5 * 1024 * 1024;
    const OK_EXT = /\.(pdf|docx?)$/i;
    const OK_MIME = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ""];
    const rules = {
      "c-name": (v) => v.trim().length < 2 ? "Please enter your full name." : "",
      "c-email": (v) => !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "Please enter a valid email address." : "",
      "c-phone": (v) => { const d = v.replace(/[^\d]/g, ""); return !/^[+\d][\d\s()-]*$/.test(v.trim()) || d.length < 7 || d.length > 15 ? "Please enter a valid phone number." : ""; },
      "c-position": (v) => !v ? "Please choose a position." : "",
      "c-resume": () => {
        const f = $("#c-resume").files[0];
        if (!f) return "Please attach your resume.";
        if (!OK_EXT.test(f.name) || !OK_MIME.includes(f.type)) return "Resume must be a PDF, DOC or DOCX file.";
        if (f.size > MAX) return "Resume must be 5 MB or smaller.";
        if (f.size === 0) return "The selected file is empty.";
        return "";
      },
      "c-msg": (v) => v.length > 2000 ? "Message must be 2000 characters or fewer." : "",
    };
    const check = (id) => {
      const el = $("#" + id), err = rules[id](el.value || "");
      $(`.err[data-for="${id}"]`).textContent = err;
      el.toggleAttribute("aria-invalid", !!err);
      return !err;
    };
    Object.keys(rules).forEach((id) => {
      const el = $("#" + id);
      el.addEventListener(el.type === "file" || el.tagName === "SELECT" ? "change" : "blur", () => check(id));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = ""; msg.style.color = "";
      const bad = Object.keys(rules).filter((id) => !check(id));
      if (bad.length) { $("#" + bad[0]).focus(); msg.textContent = "Please correct the highlighted fields."; msg.style.color = "#c53030"; return; }
      if (!endpoint) {
        // No upload service configured: hand off to the applicant's email app (same as the contact form)
        const fdm = new FormData(form);
        const resume = $("#c-resume").files[0];
        const body = [
          "Full name: " + fdm.get("name"), "Email: " + fdm.get("email"), "Phone: " + fdm.get("phone"),
          "Position: " + fdm.get("position"), "", fdm.get("message") || "", "",
          "(Please attach your resume" + (resume ? ": " + resume.name : "") + ")"
        ].join("\n");
        location.href = `mailto:${S.email}?subject=${encodeURIComponent("Job application - " + fdm.get("position") + " - " + fdm.get("name"))}&body=${encodeURIComponent(body)}`;
        msg.innerHTML = `Your email app is opening with your details. <b>Attach your resume to that email and send it</b> to complete your application.` + (S.email ? ` If nothing opens, email your resume to ${esc(S.email)}.` : "");
        msg.style.color = "var(--text)"; return;
      }
      const fd = new FormData(form);
      fd.append("_subject", "Job application - " + fd.get("position") + " - " + fd.get("name"));
      btn.disabled = true; msg.textContent = "Submitting your application…"; msg.style.color = "var(--muted)";
      try {
        const r = await fetch(endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error("HTTP " + r.status);
        form.reset(); if (!jobs.length) sel.value = "General application";
        msg.textContent = "Thank you. Your application has been received."; msg.style.color = "#1a8a4a";
      } catch (err) {
        msg.textContent = "Your application could not be submitted. Please try again later." + (S.email ? " You can also contact us at " + S.email + "." : "");
        msg.style.color = "#c53030";
      } finally { btn.disabled = false; }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function reveal() {
    if (!("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.08 });
    $$(".reveal").forEach((el) => io.observe(el));
  }

  /* ---------- Init ---------- */
  try { history.scrollRestoration = "manual"; } catch (e) {}
  if (!location.hash) scrollTo(0, 0);
  renderHeader();
  ({ home: homePage, products: productsPage, product: productPage, about: aboutPage, contact: contactPage, careers: careersPage }[page] || (() => {}))();
  ctaBlock();
  renderFooter();
  if (page === "home") document.title = S.companyName + " | " + (S.tagline || "");
  reveal();
})();
