ELVEX TECHNOLOGIES — WEBSITE
=============================

WHAT'S INSIDE
  index.html      Home page (hero, categories, featured products, about, industries, process)
  products.html   Full product catalogue with category filters + search
  product.html    Product detail page (opens as product.html?id=...)
  about.html      About the company
  contact.html    Contact details + enquiry / quote form
  careers.html    Careers page: job openings + application form with resume upload
  admin.html      YOUR CONTENT MANAGER (add / edit / delete products and everything else)
  data/site-data.js   All website content lives in this one file
  assets/         CSS, JavaScript, logo and product images


1) VIEW THE SITE
  Unzip the folder and double-click index.html. No installation needed.


2) ADD / CHANGE / REMOVE PRODUCTS (and everything else)
  1. Open admin.html in your browser (Chrome, Edge, Safari or Firefox).
  2. Use the tabs:
       Products         add, edit, delete, duplicate, re-order, mark as "Featured",
                        upload photos, gallery images, specs, features, applications, datasheet link
       Categories       add / rename / delete product categories
       Industries       the "Industries" section on the home page
       Company details  name, hero text, about text, stats, email, phone, WhatsApp,
                        address, Google map, social links, contact-form endpoint
  3. Your edits are saved automatically in this browser.
  4. Go to "Publish / Backup":
       - "Turn on preview & open website" to see your changes before publishing.
       - "Download site-data.js".
  5. Replace data/site-data.js on your web host with the downloaded file. Done!

  PRODUCT PHOTOS: the site ships with studio renders of each product type in
  assets/img/products/. Replace them with real photos of your products in admin
  (product > Main image) for the best result.

  Tip: For best quality and a smaller data file, put product photos in
  assets/img/products/ and type the path (e.g. assets/img/products/relay.jpg)
  instead of uploading. Uploads also work — they are auto-resized.

  Tip: Upload PDF datasheets to a folder such as assets/docs/ and paste the
  path (assets/docs/ex-pi.pdf) into the product's "Datasheet link".


3) PUT IT ONLINE
  Upload the whole folder to any web host:
    - cPanel / Hostinger / GoDaddy: upload the files into public_html
    - Netlify: drag-and-drop the folder at app.netlify.com/drop
    - GitHub Pages, Vercel, Cloudflare Pages also work
  It's a static site — no database or PHP needed.

  SECURITY NOTE: admin.html cannot change your live website on its own — it only
  edits a copy in your browser. The live site only changes when YOU upload the new
  site-data.js, so visitors cannot alter anything. You may still delete admin.html
  from the server and keep it only on your computer if you prefer.


4) CONTACT FORM
  By default the form opens the visitor's email app addressed to your email.
  To receive enquiries directly in your inbox instead, create a free form at
  formspree.io, copy its URL (https://formspree.io/f/xxxx) and paste it into
  Admin → Company details → "Contact form endpoint".


4b) CAREERS PAGE
  Openings: Admin → Careers → "+ Add opening". With no openings the page says
  there are currently no advertised openings.
  Applications: the form needs a form service that accepts FILE UPLOADS (for the
  resume). Create a form with such a service, copy its URL and paste it into
  Admin → Company details → "Careers form endpoint". Until this is set, the form
  opens the applicant's email app with their details and asks them to attach
  their resume (resumes can't be attached automatically that way).

5) BRAND COLOURS & FONTS
  Edit the variables at the top of assets/css/style.css (--copper, --bg, etc.).


BEFORE GOING LIVE — replace the placeholders
  Admin → Company details: email, phone, address, WhatsApp, social links, stats.
  The sample products are examples — edit or delete them and add your real ones.
