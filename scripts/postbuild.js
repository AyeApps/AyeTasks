const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  const seoTags = `
    <!-- SEO & Social Meta Tags -->
    <meta name="keywords" content="gestor de tareas, app de proyectos, tickets de trabajo, registro de horas, subtareas, AyeTasks">
    <link rel="canonical" href="https://tasks.ayeapps.com">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://tasks.ayeapps.com">
    <meta property="og:title" content="AyeTasks — Gestor de Tareas y Proyectos">
    <meta property="og:description" content="Organiza tus pendientes y proyectos en tickets con subtareas y registro de tiempo. Funciona en web y móvil.">
    <meta property="og:site_name" content="AyeApps">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="AyeTasks — Gestor de Tareas y Proyectos">
    <meta name="twitter:description" content="Organiza tus pendientes y proyectos en tickets con subtareas y registro de tiempo.">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "AyeTasks",
      "operatingSystem": "Web, iOS, Android",
      "applicationCategory": "BusinessApplication",
      "description": "Organiza tus pendientes y proyectos en tickets con subtareas y registro de tiempo.",
      "url": "https://tasks.ayeapps.com",
      "author": {
        "@type": "Organization",
        "name": "AyeApps",
        "url": "https://ayeapps.com"
      }
    }
    </script>
  </head>`;

  html = html.replace('</head>', seoTags);
  html = html.replace('<html lang="en">', '<html lang="es">');
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✓ AyeTasks SEO injected into dist/index.html');

  // Create sitemap.xml
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tasks.ayeapps.com</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  fs.writeFileSync(path.join(distPath, 'sitemap.xml'), sitemap, 'utf8');
  console.log('✓ AyeTasks sitemap.xml generated');

  // Create robots.txt
  const robots = `User-Agent: *
Allow: /

Host: https://tasks.ayeapps.com
Sitemap: https://tasks.ayeapps.com/sitemap.xml
`;
  fs.writeFileSync(path.join(distPath, 'robots.txt'), robots, 'utf8');
  console.log('✓ AyeTasks robots.txt generated');
}
