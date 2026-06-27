const fs = require('fs');
const path = require('path');

const p1 = require('./seo_data_part1.json');
const p2 = require('./seo_data_part2.json');
const p3 = require('./seo_data_part3.json');
const data = { ...p1, ...p2, ...p3 };

for (const [folder, seo] of Object.entries(data)) {
  const filePath = path.join(__dirname, folder, 'index.html');
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${folder}, not found`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace Title
  content = content.replace(/<title>.*?<\/title>/s, `<title>${seo.title}</title>`);
  
  // Replace Meta Description
  content = content.replace(/<meta name="description"[^>]*>/is, `<meta name="description"\n    content="${seo.desc}" />`);
  
  // Remove existing FAQ schema if present
  content = content.replace(/<!-- Structured Data: FAQ -->[\s\S]*?<\/script>/, '');

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": seo.faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  const schemaHtml = `<!-- Structured Data: FAQ -->\n  <script type="application/ld+json">\n  ${JSON.stringify(faqSchema, null, 2)}\n  </script>`;
  
  // Inject schema before </head> if possible
  if (content.includes('</head>')) {
    content = content.replace('</head>', schemaHtml + '\n</head>');
  }

  const seoSection = `
  <!-- SEO Content -->
  <section class="seo-content" aria-label="About this tool">
    <div class="seo-content__inner">
      <h1 class="seo-content__title">${seo.h1}</h1>
      <p class="seo-content__intro">${seo.intro}</p>
      
      <h2 class="seo-content__h2">${seo.howToTitle}</h2>
      <ol class="seo-content__list">
        <li><strong>${seo.howTo[0].t}:</strong> ${seo.howTo[0].d}</li>
        <li><strong>${seo.howTo[1].t}:</strong> ${seo.howTo[1].d}</li>
        <li><strong>${seo.howTo[2].t}:</strong> ${seo.howTo[2].d}</li>
      </ol>

      <h2 class="seo-content__h2">${seo.whyTitle}</h2>
      <p class="seo-content__desc">${seo.whyDesc}</p>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="faq" id="faqSection" aria-label="Frequently Asked Questions">
    <h2 class="faq__title">Frequently Asked Questions</h2>
    <details>
      <summary>${seo.faqs[0].q}</summary>
      <p class="faq__answer">${seo.faqs[0].a}</p>
    </details>
    <details>
      <summary>${seo.faqs[1].q}</summary>
      <p class="faq__answer">${seo.faqs[1].a}</p>
    </details>
    <details>
      <summary>${seo.faqs[2].q}</summary>
      <p class="faq__answer">${seo.faqs[2].a}</p>
    </details>
  </section>`;

  // Replace existing FAQ section or append before footer
  if (content.includes('<!-- FAQ Section -->')) {
    content = content.replace(/<!-- FAQ Section -->[\s\S]*?<\/section>/, seoSection);
  } else if (content.includes('<!-- Footer -->')) {
    content = content.replace('<!-- Footer -->', seoSection + '\n\n  <!-- Footer -->');
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated SEO for ${folder}`);
}
