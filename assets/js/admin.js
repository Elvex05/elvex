/* ==========================================================================
   ELVEX TECHNOLOGIES — ADMIN CONTENT MANAGER
   Edits a working copy of the site data in your browser, then lets you
   download a new data/site-data.js to upload to your web host.
   ========================================================================== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-") || "item";
  const lines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);

  const PUBLISHED = clone(window.ELVEX_DATA || { settings: {}, categories: [], products: [], industries: [] });
  let D;
  let dirty = false;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  };
  try { D = JSON.parse(store.get("elvex_draft") || "null"); } catch (e) { D = null; }
  if (!D || !D.products) D = clone(PUBLISHED);
  else dirty = store.get("elvex_dirty") === "1";
  D.settings = D.settings || {}; D.categories = D.categories || []; D.products = D.products || []; D.industries = D.industries || [];
  D.settings.stats = D.settings.stats || []; D.settings.social = D.settings.social || {};
  D.careers = D.careers || { intro: "", jobs: [] }; D.careers.jobs = D.careers.jobs || [];

  function save(markDirty = true) {
    if (markDirty) dirty = true;
    const ok = store.set("elvex_draft", JSON.stringify(D));
    store.set("elvex_dirty", dirty ? "1" : "0");
    $("#dot").classList.toggle("dirty", dirty);
    $("#status").textContent = !ok ? "⚠ Browser storage full — download now!" : dirty ? "Unpublished changes — download site-data.js" : "Matches published site";
    renderTabs();
  }
  function ask(msg, yes) {
    const m = document.createElement("div"); m.className = "ask";
    m.innerHTML = `<div class="ask-box"><p>${esc(msg)}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-no>Cancel</button><button class="btn pri" data-yes>Yes, continue</button></div></div>`;
    document.body.append(m);
    m.onclick = (e) => { if (e.target.closest("[data-yes]")) { m.remove(); yes(); } else if (e.target === m || e.target.closest("[data-no]")) m.remove(); };
    $("[data-yes]", m).focus();
  }
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2600); }

  /* ---------- Tabs ---------- */
  const TABS = [
    ["products", "Products", () => D.products.length],
    ["categories", "Categories", () => D.categories.length],
    ["industries", "Industries", () => D.industries.length],
    ["careers", "Careers", () => D.careers.jobs.length],
    ["settings", "Company details", null],
    ["publish", "Publish / Backup", null]
  ];
  let current = location.hash.slice(1) || "products";
  function renderTabs() {
    const html = TABS.map(([id, name, n]) => `<button class="tab ${id === current ? "active" : ""}" data-tab="${id}">${name}${n ? `<span class="n">${n()}</span>` : ""}</button>`).join("");
    $("#tabs").innerHTML = html; $("#mtabs").innerHTML = html;
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) { current = b.dataset.tab; location.hash = current; render(); } });

  function render() {
    renderTabs();
    ({ products: viewProducts, categories: viewCategories, industries: viewIndustries, careers: viewCareers, settings: viewSettings, publish: viewPublish }[current] || viewProducts)();
    $("#dot").classList.toggle("dirty", dirty);
    $("#status").textContent = dirty ? "Unpublished changes — download site-data.js" : "Matches published site";
  }

  const help = `<div class="help">Changes are saved <b>in this browser</b> as you work. To make them live, go to <b>Publish / Backup</b>, download <b>site-data.js</b> and replace the file in the <b>data</b> folder on your web host.</div>`;
  const moveBtns = (i) => `<div class="move"><button data-up="${i}" title="Move up">▲</button><button data-down="${i}" title="Move down">▼</button></div>`;
  function swap(arr, i, j) { if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; save(); render(); }

  const MODEL_LABELS = (window.Elvex3D && window.Elvex3D.LABELS) || {};
  const modelSelect = (id, val) => `<select id="${id}"><option value="">None (use photo)</option>${Object.entries(MODEL_LABELS).map(([k, v]) => `<option value="${k}" ${k === val ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>`;

  /* ---------- Products ---------- */
  let pFilter = "";
  function viewProducts() {
    const catName = (id) => (D.categories.find((c) => c.id === id) || {}).name || "— no category —";
    $("#main").innerHTML = `
      <div class="top"><h1>Products</h1><div class="row"><input class="search" id="pq" placeholder="Search…" value="${esc(pFilter)}"><button class="btn pri" id="add">+ Add product</button></div></div>
      ${help}<div class="list" id="plist"></div>`;
    const draw = () => {
      const t = pFilter.toLowerCase();
      const rows = D.products.map((p, i) => [p, i]).filter(([p]) => !t || (p.name + " " + catName(p.category)).toLowerCase().includes(t));
      $("#plist").innerHTML = rows.length ? rows.map(([p, i]) => `
        <div class="item">
          ${moveBtns(i)}
          <img src="${esc(p.image)}" alt="" onerror="this.style.visibility='hidden'">
          <div class="t"><b>${esc(p.name)}${p.featured ? '<span class="badge">Featured</span>' : ""}</b><span>${esc(catName(p.category))} · ${esc(p.tagline || "")}</span></div>
          <div class="acts">
            <button class="btn sm" data-edit="${i}">Edit</button>
            <button class="btn sm" data-feat="${i}">${p.featured ? "Unfeature" : "Feature"}</button>
            <button class="btn sm" data-dup="${i}">Duplicate</button>
            <a class="btn sm" href="product.html?id=${encodeURIComponent(p.id)}" target="_blank" data-prev>View</a>
            <button class="btn sm danger" data-del="${i}">Delete</button>
          </div>
        </div>`).join("") : `<div class="empty">No products yet. Click “Add product”.</div>`;
    };
    draw();
    $("#pq").oninput = (e) => { pFilter = e.target.value; draw(); };
    $("#add").onclick = () => editProduct(-1);
    $("#plist").onclick = (e) => {
      const b = e.target.closest("button,[data-prev]"); if (!b) return;
      const d = b.dataset;
      if (d.edit) editProduct(+d.edit);
      if (d.feat) { D.products[+d.feat].featured = !D.products[+d.feat].featured; save(); draw(); }
      if (d.dup) { const c = clone(D.products[+d.dup]); c.name += " (copy)"; c.id = uniqueId(slug(c.name), D.products); D.products.splice(+d.dup + 1, 0, c); save(); draw(); toast("Product duplicated"); }
      if (d.del) ask(`Delete “${D.products[+d.del].name}”? This cannot be undone.`, () => { D.products.splice(+d.del, 1); save(); draw(); toast("Product deleted"); });
      if (d.up) swap(D.products, +d.up, +d.up - 1);
      if (d.down) swap(D.products, +d.down, +d.down + 1);
      if ("prev" in d) enablePreview();
    };
  }
  function uniqueId(base, arr, self) { let id = base, n = 2; while (arr.some((x) => x.id === id && x !== self)) id = base + "-" + n++; return id; }

  function editProduct(i) {
    const isNew = i < 0;
    const p = isNew ? { id: "", name: "", category: (D.categories[0] || {}).id || "", tagline: "", description: "", image: "", gallery: [], featured: false, specs: [{ label: "", value: "" }], features: [], applications: [], datasheet: "" } : clone(D.products[i]);
    p.gallery = p.gallery || []; p.specs = p.specs || [];
    openDrawer(isNew ? "Add product" : "Edit product", `
      <label class="f"><span>Product name *</span><input id="p-name" value="${esc(p.name)}"></label>
      <div class="grid2">
        <label class="f"><span>Category</span><select id="p-cat">${D.categories.map((c) => `<option value="${esc(c.id)}" ${c.id === p.category ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>
        <label class="f"><span>Web address (ID) <small>— auto from name</small></span><input id="p-id" value="${esc(p.id)}" placeholder="auto"></label>
      </div>
      <label class="f"><span>Short tagline</span><input id="p-tag" value="${esc(p.tagline)}"></label>
      <label class="f"><span>Description</span><textarea id="p-desc" rows="5">${esc(p.description)}</textarea></label>
      <div class="f"><span style="display:block;font-size:13px;color:var(--muted);margin-bottom:6px">Main image</span>
        <div class="imgbox"><img class="pv" id="p-pv" src="${esc(p.image)}" alt="">
          <div><input id="p-img" value="${p.image && p.image.startsWith("data:") ? "(uploaded image)" : esc(p.image)}" placeholder="assets/img/products/my-photo.jpg or https://…">
          <div class="row" style="margin-top:8px"><label class="btn sm">Upload image<input type="file" accept="image/*" id="p-up" class="hidden"></label><small style="color:var(--muted)">JPG/PNG/WebP — auto-resized</small></div></div>
        </div>
      </div>
      <div class="f" style="margin:16px 0"><span style="display:block;font-size:13px;color:var(--muted);margin-bottom:6px">Extra gallery images</span>
        <label class="btn sm">+ Add images<input type="file" accept="image/*" multiple id="g-up" class="hidden"></label>
        <div class="gal" id="gal"></div>
      </div>
      <div class="check"><input type="checkbox" id="p-feat" ${p.featured ? "checked" : ""}><label for="p-feat">Show in “Featured products” on the home page</label></div>
      <h2>Specifications</h2><div class="pairs" id="specs"></div><button class="btn sm" id="add-spec">+ Add specification</button>
      <div class="grid2" style="margin-top:20px">
        <label class="f"><span>Key features <small>(one per line)</small></span><textarea id="p-feats" rows="6">${esc((p.features || []).join("\n"))}</textarea></label>
        <label class="f"><span>Applications <small>(one per line)</small></span><textarea id="p-apps" rows="6">${esc((p.applications || []).join("\n"))}</textarea></label>
      </div>
      <label class="f"><span>Datasheet link (PDF) <small>— optional, e.g. assets/docs/ex-pi.pdf</small></span><input id="p-ds" value="${esc(p.datasheet)}"></label>
    `, () => {
      const name = $("#p-name").value.trim();
      if (!name) { toast("Please enter a product name"); return false; }
      p.name = name;
      p.category = $("#p-cat").value;
      p.id = uniqueId(slug($("#p-id").value.trim() || name), D.products, isNew ? null : D.products[i]);
      p.tagline = $("#p-tag").value.trim();
      p.description = $("#p-desc").value.trim();
      const iv = $("#p-img").value.trim(); if (iv !== "(uploaded image)") p.image = iv;
      p.featured = $("#p-feat").checked;
      p.specs = readPairs("#specs");
      p.features = lines($("#p-feats").value);
      p.applications = lines($("#p-apps").value);
      p.datasheet = $("#p-ds").value.trim();
      if (!p.gallery.length) delete p.gallery;
      if (isNew) D.products.unshift(p); else D.products[i] = p;
      save(); render(); toast(isNew ? "Product added" : "Product saved");
    });
    const drawGal = () => { $("#gal").innerHTML = p.gallery.map((src, k) => `<div><img src="${esc(src)}" alt=""><button data-k="${k}" title="Remove">✕</button></div>`).join(""); };
    drawGal();
    $("#gal").onclick = (e) => { const b = e.target.closest("button"); if (b) { p.gallery.splice(+b.dataset.k, 1); drawGal(); } };
    $("#g-up").onchange = async (e) => { for (const f of e.target.files) p.gallery.push(await compress(f)); drawGal(); e.target.value = ""; };
    $("#p-up").onchange = async (e) => { const f = e.target.files[0]; if (!f) return; p.image = await compress(f); $("#p-pv").src = p.image; $("#p-img").value = "(uploaded image)"; };
    $("#p-img").oninput = (e) => { $("#p-pv").src = e.target.value; };
    drawPairs("#specs", p.specs, "Label (e.g. Voltage)", "Value (e.g. 12 VDC)");
    $("#add-spec").onclick = () => addPair("#specs", "", "", "Label", "Value");
  }

  function drawPairs(sel, arr, ph1, ph2) { $(sel).innerHTML = ""; (arr.length ? arr : [{ label: "", value: "" }]).forEach((s) => addPair(sel, s.label, s.value, ph1, ph2)); }
  function addPair(sel, a, b, ph1, ph2) {
    const d = document.createElement("div"); d.className = "pair";
    d.innerHTML = `<input value="${esc(a)}" placeholder="${esc(ph1)}"><input value="${esc(b)}" placeholder="${esc(ph2)}"><button title="Remove">✕</button>`;
    $("button", d).onclick = () => d.remove();
    $(sel).append(d);
  }
  function readPairs(sel) { return $$(".pair", $(sel)).map((r) => { const [a, b] = $$("input", r); return { label: a.value.trim(), value: b.value.trim() }; }).filter((x) => x.label || x.value); }

  /* Image compression to keep site-data.js small */
  function compress(file, max = 1400, q = 0.82) {
    return new Promise((res, rej) => {
      if (file.type === "image/svg+xml") { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); return; }
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        const ctx = c.getContext("2d"); ctx.fillStyle = "#16191d"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        let out = c.toDataURL("image/webp", q); if (!out.startsWith("data:image/webp")) out = c.toDataURL("image/jpeg", q);
        res(out);
      };
      img.onerror = () => { toast("Could not read that image"); rej(); };
      img.src = url;
    });
  }

  /* ---------- Categories ---------- */
  function viewCategories() {
    $("#main").innerHTML = `<div class="top"><h1>Categories</h1><button class="btn pri" id="add">+ Add category</button></div>${help}
      <div class="list">${D.categories.map((c, i) => `
        <div class="item">${moveBtns(i)}<img src="${esc(c.image)}" alt="" onerror="this.style.visibility='hidden'">
          <div class="t"><b>${esc(c.name)}</b><span>${D.products.filter((p) => p.category === c.id).length} products · ${esc(c.description)}</span></div>
          <div class="acts"><button class="btn sm" data-edit="${i}">Edit</button><button class="btn sm danger" data-del="${i}">Delete</button></div>
        </div>`).join("") || `<div class="empty">No categories yet.</div>`}</div>`;
    $("#add").onclick = () => editCategory(-1);
    $(".list").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return; const d = b.dataset;
      if (d.edit) editCategory(+d.edit);
      if (d.up) swap(D.categories, +d.up, +d.up - 1);
      if (d.down) swap(D.categories, +d.down, +d.down + 1);
      if (d.del) {
        const c = D.categories[+d.del], n = D.products.filter((p) => p.category === c.id).length;
        ask(`Delete category “${c.name}”?` + (n ? ` ${n} product(s) use it. They will stay but have no category until you reassign them.` : ""), () => { D.categories.splice(+d.del, 1); save(); render(); });
      }
    };
  }
  function editCategory(i) {
    const isNew = i < 0;
    const c = isNew ? { id: "", name: "", description: "", image: "", model: "", headline: "" } : clone(D.categories[i]);
    const oldId = c.id;
    openDrawer(isNew ? "Add category" : "Edit category", `
      <label class="f"><span>Category name *</span><input id="c-name" value="${esc(c.name)}"></label>
      <label class="f"><span>Big headline on home page <small>— e.g. "Magnetics that waste nothing"</small></span><input id="c-head" value="${esc(c.headline)}"></label>
      <label class="f"><span>Short description</span><textarea id="c-desc">${esc(c.description)}</textarea></label>
      <span style="display:block;font-size:13px;color:var(--muted);margin:6px 0">Category image</span>
      <div class="imgbox"><img class="pv" id="c-pv" src="${esc(c.image)}" alt="">
        <div><input id="c-img" value="${c.image && c.image.startsWith("data:") ? "(uploaded image)" : esc(c.image)}" placeholder="assets/img/…">
        <label class="btn sm" style="margin-top:8px">Upload image<input type="file" accept="image/*" id="c-up" class="hidden"></label></div></div>`,
    () => {
      const name = $("#c-name").value.trim(); if (!name) { toast("Please enter a name"); return false; }
      c.name = name; c.description = $("#c-desc").value.trim(); c.headline = $("#c-head").value.trim();

      const iv = $("#c-img").value.trim(); if (iv !== "(uploaded image)") c.image = iv;
      if (isNew) { c.id = uniqueId(slug(name), D.categories); D.categories.push(c); }
      else { D.categories[i] = c; c.id = oldId; }
      save(); render(); toast("Category saved");
    });
    $("#c-up").onchange = async (e) => { const f = e.target.files[0]; if (!f) return; c.image = await compress(f); $("#c-pv").src = c.image; $("#c-img").value = "(uploaded image)"; };
    $("#c-img").oninput = (e) => { $("#c-pv").src = e.target.value; };

  }

  /* ---------- Industries ---------- */
  function viewIndustries() {
    $("#main").innerHTML = `<div class="top"><h1>Industries</h1><button class="btn pri" id="add">+ Add industry</button></div>${help}
      <div class="list">${D.industries.map((d, i) => `
        <div class="item" style="grid-template-columns:28px 1fr auto">${moveBtns(i)}
          <div class="t"><b>${esc(d.name)}</b><span>${esc(d.description)}</span></div>
          <div class="acts"><button class="btn sm" data-edit="${i}">Edit</button><button class="btn sm danger" data-del="${i}">Delete</button></div>
        </div>`).join("") || `<div class="empty">No industries yet.</div>`}</div>`;
    const edit = (i) => {
      const d = i < 0 ? { name: "", description: "" } : D.industries[i];
      openDrawer(i < 0 ? "Add industry" : "Edit industry", `<label class="f"><span>Name *</span><input id="i-name" value="${esc(d.name)}"></label><label class="f"><span>Description</span><textarea id="i-desc">${esc(d.description)}</textarea></label>`, () => {
        const n = $("#i-name").value.trim(); if (!n) { toast("Please enter a name"); return false; }
        const v = { name: n, description: $("#i-desc").value.trim() };
        i < 0 ? D.industries.push(v) : (D.industries[i] = v); save(); render(); toast("Saved");
      });
    };
    $("#add").onclick = () => edit(-1);
    $(".list").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return; const d = b.dataset;
      if (d.edit) edit(+d.edit);
      if (d.up) swap(D.industries, +d.up, +d.up - 1);
      if (d.down) swap(D.industries, +d.down, +d.down + 1);
      if (d.del) ask("Delete this industry?", () => { D.industries.splice(+d.del, 1); save(); render(); });
    };
  }

  /* ---------- Careers ---------- */
  function viewCareers() {
    const C = D.careers;
    $("#main").innerHTML = `<div class="top"><h1>Careers</h1><button class="btn pri" id="add">+ Add opening</button></div>${help}
      <div class="card" style="margin-bottom:18px"><label class="f"><span>Careers page introduction <small>— leave empty to use the default text</small></span><textarea id="cr-intro" rows="3">${esc(C.intro)}</textarea></label><button class="btn sm" id="save-intro">Save introduction</button>
      <p style="margin:12px 0 0;color:var(--muted);font-size:13px">Applications are sent to the <b>Careers form endpoint</b> in Company details. Until it is set, the form opens the applicant's email app and asks them to attach their resume.</p></div>
      <div class="list">${C.jobs.map((j, i) => `
        <div class="item" style="grid-template-columns:28px 1fr auto">${moveBtns(i)}
          <div class="t"><b>${esc(j.title)}</b><span>${esc([j.location, j.type].filter(Boolean).join(" · "))}</span></div>
          <div class="acts"><button class="btn sm" data-edit="${i}">Edit</button><button class="btn sm danger" data-del="${i}">Delete</button></div>
        </div>`).join("") || `<div class="empty">No openings. The Careers page shows "There are currently no advertised openings".</div>`}</div>`;
    $("#save-intro").onclick = () => { C.intro = $("#cr-intro").value.trim(); save(); toast("Introduction saved"); };
    const edit = (i) => {
      const j = i < 0 ? { title: "", location: "", type: "", description: "" } : C.jobs[i];
      openDrawer(i < 0 ? "Add opening" : "Edit opening", `<label class="f"><span>Job title *</span><input id="j-title" value="${esc(j.title)}"></label>
        <label class="f"><span>Location</span><input id="j-loc" value="${esc(j.location)}"></label>
        <label class="f"><span>Employment type <small>— e.g. Full-time</small></span><input id="j-type" value="${esc(j.type)}"></label>
        <label class="f"><span>Short description</span><textarea id="j-desc" rows="4">${esc(j.description)}</textarea></label>`, () => {
        const t = $("#j-title").value.trim(); if (!t) { toast("Please enter a job title"); return false; }
        const v = { title: t, location: $("#j-loc").value.trim(), type: $("#j-type").value.trim(), description: $("#j-desc").value.trim() };
        i < 0 ? C.jobs.push(v) : (C.jobs[i] = v); save(); render(); toast("Saved");
      });
    };
    $("#add").onclick = () => edit(-1);
    $(".list").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return; const d = b.dataset;
      if (d.edit) edit(+d.edit);
      if (d.up) swap(C.jobs, +d.up, +d.up - 1);
      if (d.down) swap(C.jobs, +d.down, +d.down + 1);
      if (d.del) ask("Delete this opening?", () => { C.jobs.splice(+d.del, 1); save(); render(); });
    };
  }

  /* ---------- Settings ---------- */
  function viewSettings() {
    const s = D.settings, so = s.social;
    const f = (k, label, hint = "", ta = false) => `<label class="f"><span>${label} ${hint ? `<small>— ${hint}</small>` : ""}</span>${ta ? `<textarea data-k="${k}" rows="${ta}">${esc(s[k])}</textarea>` : `<input data-k="${k}" value="${esc(s[k])}">`}</label>`;
    $("#main").innerHTML = `<div class="top"><h1>Company details</h1><button class="btn pri" id="save-s">Save changes</button></div>${help}
      <div class="card"><h2 style="margin-top:0">Company</h2>
        <div class="grid2">${f("companyName", "Company name")}${f("tagline", "Tagline", "shown in footer & menu")}</div>
        <h2>Home page hero</h2>
        ${f("heroEyebrow", "Small heading above title")}
        ${f("heroTitle", "Big title", "text after the first full stop appears in copper")}
        ${f("heroSubtitle", "Subtitle", "", 3)}
        <h2>About</h2>
        ${f("aboutTitle", "About heading")}
        ${f("aboutText", "About text", "leave a blank line between paragraphs", 7)}
        <h2>Specification sheet <small style="font-family:Inter;font-size:13px;text-transform:none;color:var(--muted)">(About section)</small></h2><div class="pairs" id="sheet"></div><button class="btn sm" id="add-sheet">+ Add row</button>
        <h2>Certifications / standards <small style="font-family:Inter;font-size:13px;text-transform:none;color:var(--muted)">(Quality section; leave empty to hide)</small></h2><div class="pairs" id="certs"></div><button class="btn sm" id="add-cert">+ Add certification</button>
        <h2>Numbers / stats</h2><div class="pairs" id="stats"></div><button class="btn sm" id="add-stat">+ Add stat</button>
        <h2>Contact</h2>
        <div class="grid2">${f("email", "Email")}${f("phone", "Phone")}${f("whatsapp", "WhatsApp number", "with country code, e.g. +91 98xxxxxxx — shows a chat button")}${f("hours", "Opening hours")}</div>
        ${f("address", "Address", "", 2)}
        ${f("mapEmbedUrl", "Google Maps embed URL", "Google Maps → Share → Embed a map → copy the src=\"…\" link")}
        ${f("formEndpoint", "Contact form endpoint", "optional — e.g. a free Formspree.io form URL. If empty, the form opens the visitor's email app")}
        ${f("careersEndpoint", "Careers form endpoint", "a form service URL that accepts file uploads (for resumes). If empty, the form opens the applicant's email app instead")}
        <h2>Social links</h2>
        <div class="grid2">${["linkedin", "instagram", "facebook", "youtube", "x"].map((k) => `<label class="f"><span>${k === "x" ? "X / Twitter" : k[0].toUpperCase() + k.slice(1)} <small>— leave empty to hide</small></span><input data-soc="${k}" value="${esc(so[k])}"></label>`).join("")}</div>
      </div>`;
    drawPairs("#stats", s.stats.map((x) => ({ label: x.value, value: x.label })), "Value (e.g. 500+)", "Label");
    $("#add-stat").onclick = () => addPair("#stats", "", "", "Value", "Label");
    drawPairs("#sheet", s.specSheet || [], "Label (e.g. BASE)", "Value (e.g. Bengaluru, India)");
    drawPairs("#certs", (s.certifications || []).map((c) => ({ label: c.name, value: c.note })), "Name (e.g. ISO 9001:2015)", "Short note");
    $("#add-cert").onclick = () => addPair("#certs", "", "", "Name", "Note");
    $("#add-sheet").onclick = () => addPair("#sheet", "", "", "Label", "Value");
    $("#save-s").onclick = () => {
      $$("[data-k]").forEach((el) => s[el.dataset.k] = el.value.trim());
      $$("[data-soc]").forEach((el) => so[el.dataset.soc] = el.value.trim());
      s.stats = readPairs("#stats").map((x) => ({ value: x.label, label: x.value }));
      s.specSheet = readPairs("#sheet");
      s.certifications = readPairs("#certs").map((x) => ({ name: x.label, note: x.value }));
      save(); toast("Company details saved");
    };
  }

  /* ---------- Publish ---------- */
  function dataFile() {
    return `/* ==========================================================================
   ELVEX TECHNOLOGIES — SITE DATA
   Generated by admin.html on ${new Date().toLocaleString()}
   Replace data/site-data.js on your web host with this file to publish.
   ========================================================================== */
window.ELVEX_DATA = ${JSON.stringify(D, null, 2)};
`;
  }
  function download(name, text, type) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
  function enablePreview() { store.set("elvex_draft", JSON.stringify(D)); store.set("elvex_preview", "on"); }

  function viewPublish() {
    const size = new Blob([dataFile()]).size;
    const previewOn = store.get("elvex_preview") === "on";
    $("#main").innerHTML = `<div class="top"><h1>Publish / Backup</h1></div>
      <div class="card">
        <h2 style="margin-top:0">Make your changes live</h2>
        <ol class="steps">
          <li><b>Preview</b> your changes on the website in this browser (only you can see them).<div class="row" style="margin-top:8px"><button class="btn" id="pv">${previewOn ? "Preview is ON — open website" : "Turn on preview & open website"}</button>${previewOn ? `<button class="btn" id="pv-off">Turn preview off</button>` : ""}</div></li>
          <li><b>Download</b> the updated data file.<div class="row" style="margin-top:8px"><button class="btn pri" id="dl">⬇ Download site-data.js</button><button class="btn" id="cp">Copy file contents</button><small style="color:var(--muted)">${(size / 1024).toFixed(0)} KB${size > 3e6 ? " — large! Consider using image paths instead of uploads." : ""}</small></div></li>
          <li><b>Upload</b> it to your web host, replacing <code>data/site-data.js</code> (cPanel File Manager, FTP, Netlify drag-and-drop, GitHub, etc.). Refresh your site — done.</li>
        </ol>
      </div>
      <div class="card" style="margin-top:18px">
        <h2 style="margin-top:0">Backup & restore</h2>
        <div class="row">
          <button class="btn" id="bk">Download backup (.json)</button>
          <button class="btn" id="im">Import site-data.js / backup</button>
          <button class="btn danger" id="rs">Discard changes & reload published data</button>
        </div>
        <p style="color:var(--muted);font-size:13px;margin:12px 0 0">Working on another computer? Import your latest site-data.js there first.</p>
      </div>`;
    $("#pv").onclick = () => { enablePreview(); window.open("index.html", "_blank"); viewPublish(); };
    if ($("#pv-off")) $("#pv-off").onclick = () => { store.set("elvex_preview", "off"); viewPublish(); toast("Preview off"); };
    $("#dl").onclick = () => { download("site-data.js", dataFile(), "text/javascript"); dirty = false; save(false); toast("Downloaded — now upload it to data/ on your host"); };
    $("#cp").onclick = () => {
      const txt = dataFile();
      const done = () => { dirty = false; save(false); toast("Copied. Paste it into data/site-data.js and save."); };
      const fallback = () => { openDrawer("site-data.js", `<p style="color:var(--muted);margin-top:0">Select all (Ctrl+A), copy, and paste into data/site-data.js.</p><textarea id="cp-ta" style="min-height:60vh;font:12px monospace">${esc(txt)}</textarea>`, () => true); setTimeout(() => $("#cp-ta").select(), 320); };
      try { navigator.clipboard.writeText(txt).then(done, fallback); } catch (e) { fallback(); }
    };
    $("#bk").onclick = () => download(`elvex-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(D, null, 2), "application/json");
    $("#im").onclick = () => $("#import-file").click();
    $("#rs").onclick = () => ask("Discard all unpublished changes in this browser?", () => { D = clone(PUBLISHED); dirty = false; save(false); render(); toast("Reset to published data"); });
  }
  $("#import-file").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        let txt = String(r.result).trim();
        const m = txt.match(/ELVEX_DATA\s*=\s*([\s\S]*?);?\s*$/);
        if (m) txt = m[1];
        const obj = JSON.parse(txt);
        if (!obj.products) throw 0;
        D = obj; D.settings = D.settings || {}; D.settings.stats = D.settings.stats || []; D.settings.social = D.settings.social || {}; D.industries = D.industries || []; D.categories = D.categories || [];
        save(); render(); toast("Imported successfully");
      } catch (err) { toast("That file doesn't look like Elvex site data"); }
      e.target.value = "";
    };
    r.readAsText(f);
  };

  /* ---------- Drawer ---------- */
  let onSave = null;
  function openDrawer(title, html, saveFn) { $("#d-title").textContent = title; $("#d-body").innerHTML = html; onSave = saveFn; $("#drawer-wrap").classList.add("open"); $("#d-body").scrollTop = 0; setTimeout(() => { const i = $("#d-body input"); i && i.focus(); }, 300); }
  function closeDrawer() { $("#drawer-wrap").classList.remove("open"); onSave = null; }
  $("#d-save").onclick = () => { if (onSave && onSave() !== false) closeDrawer(); };
  $("#d-cancel").onclick = closeDrawer; $("#d-close").onclick = closeDrawer; $("#drawer-bg").onclick = closeDrawer;
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
  addEventListener("beforeunload", (e) => { if ($("#drawer-wrap").classList.contains("open")) { e.preventDefault(); e.returnValue = ""; } });

  render();
})();
