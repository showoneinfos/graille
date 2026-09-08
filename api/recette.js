// /api/recette.js
// Page recette multilingue (EN/ES/PT/DE) generee a la volee depuis Supabase.
// Aucune dependance npm : fetch natif (Node 18+ sur Vercel).
// Ne touche a rien d'existant : les pages FR statiques restent telles quelles.

const SUPABASE_URL = "https://fnihfhmonlofekgjmijv.supabase.co";
const SUPABASE_KEY = "sb_publishable_c_TPxt08UpPt7KSX_0sA9g_Z6MUbXYI";
const SITE = "https://www.graillelight.com";
const LANGS = ["en", "es", "pt", "de"];

// ---------- libelles d'interface par langue (repris du vocabulaire deja utilise sur le site) ----------
const UI = {
  en: {
    ing: "Ingredients", prep: "Method", kcal: "kcal", prot: "Protein", carb: "Carbs", fat: "Fat",
    back: "← All recipes", also: "You might also like",
    cta: "Calculate my calories and build my menu →",
    tagline: "Eat what you love, reach your goal.",
    portion: "serving", portions: "servings",
    notFoundTitle: "Recipe not found", notFoundBody: "This recipe doesn't exist or has been removed.",
    locale: "en_US", htmlLang: "en", jsonldLang: "en-US",
  },
  es: {
    ing: "Ingredientes", prep: "Preparación", kcal: "kcal", prot: "Proteínas", carb: "Carbohidratos", fat: "Grasas",
    back: "← Todas las recetas", also: "También te puede interesar",
    cta: "Calcular mis calorías y crear mi menú →",
    tagline: "Come lo que te gusta, alcanza tu objetivo.",
    portion: "porción", portions: "porciones",
    notFoundTitle: "Receta no encontrada", notFoundBody: "Esta receta no existe o ha sido eliminada.",
    locale: "es_ES", htmlLang: "es", jsonldLang: "es-ES",
  },
  pt: {
    ing: "Ingredientes", prep: "Modo de preparo", kcal: "kcal", prot: "Proteínas", carb: "Carboidratos", fat: "Gorduras",
    back: "← Todas as receitas", also: "Você também pode gostar",
    cta: "Calcular minhas calorias e montar meu menu →",
    tagline: "Coma o que você ama, alcance seu objetivo.",
    portion: "porção", portions: "porções",
    notFoundTitle: "Receita não encontrada", notFoundBody: "Esta receita não existe ou foi removida.",
    locale: "pt_PT", htmlLang: "pt", jsonldLang: "pt-PT",
  },
  de: {
    ing: "Zutaten", prep: "Zubereitung", kcal: "kcal", prot: "Protein", carb: "Kohlenhydrate", fat: "Fett",
    back: "← Alle Rezepte", also: "Das könnte dir auch gefallen",
    cta: "Meine Kalorien berechnen und Menü erstellen →",
    tagline: "Iss, was du liebst, erreiche dein Ziel.",
    portion: "Portion", portions: "Portionen",
    notFoundTitle: "Rezept nicht gefunden", notFoundBody: "Dieses Rezept existiert nicht oder wurde entfernt.",
    locale: "de_DE", htmlLang: "de", jsonldLang: "de-DE",
  },
};

// ---------- traduction des categories / bases / moments (valeurs FR fixes du catalogue) ----------
const CAT_DICT = {
  en: {
    "Petit-déj": "Breakfast", "Petit-déjeuner": "Breakfast", "Encas 10h": "Morning snack", "Encas": "Snack",
    "Déjeuner": "Lunch", "Post-training": "Post-workout", "Encas 16h": "Afternoon snack", "Dîner": "Dinner",
    "Saveurs du monde": "World flavours", "Fast food": "Fast food", "Bowls": "Bowls", "Salades": "Salads",
    "Salade": "Salad", "Express": "Quick", "Snacking": "Snacks", "Végé": "Veggie", "Végétarien": "Vegetarian",
    "Légumes": "Vegetables", "Desserts": "Desserts", "Dessert": "Dessert", "Sauces": "Sauces", "Sauce": "Sauce",
    "Monde": "World", "Poulet": "Chicken", "Dinde": "Turkey", "Bœuf": "Beef", "Saumon": "Salmon",
    "Poisson": "Fish", "Œuf": "Egg", "Porc": "Pork", "Barres protéinées": "Protein bars",
    "Pâtes & pains maison": "Homemade pasta & bread", "Repas 4€": "€4 meals",
  },
  es: {
    "Petit-déj": "Desayuno", "Petit-déjeuner": "Desayuno", "Encas 10h": "Tentempié 10h", "Encas": "Tentempié",
    "Déjeuner": "Almuerzo", "Post-training": "Post-entreno", "Encas 16h": "Merienda", "Dîner": "Cena",
    "Saveurs du monde": "Sabores del mundo", "Fast food": "Comida rápida", "Bowls": "Bowls", "Salades": "Ensaladas",
    "Salade": "Ensalada", "Express": "Exprés", "Snacking": "Snacks", "Végé": "Vegetariano", "Végétarien": "Vegetariano",
    "Légumes": "Verduras", "Desserts": "Postres", "Dessert": "Postre", "Sauces": "Salsas", "Sauce": "Salsa",
    "Monde": "Mundo", "Poulet": "Pollo", "Dinde": "Pavo", "Bœuf": "Ternera", "Saumon": "Salmón",
    "Poisson": "Pescado", "Œuf": "Huevo", "Porc": "Cerdo", "Barres protéinées": "Barras proteicas",
    "Pâtes & pains maison": "Pasta y pan casero", "Repas 4€": "Comidas a 4€",
  },
  pt: {
    "Petit-déj": "Café da manhã", "Petit-déjeuner": "Café da manhã", "Encas 10h": "Lanche da manhã", "Encas": "Lanche",
    "Déjeuner": "Almoço", "Post-training": "Pós-treino", "Encas 16h": "Lanche da tarde", "Dîner": "Jantar",
    "Saveurs du monde": "Sabores do mundo", "Fast food": "Fast food", "Bowls": "Bowls", "Salades": "Saladas",
    "Salade": "Salada", "Express": "Rápido", "Snacking": "Lanches", "Végé": "Vegetariano", "Végétarien": "Vegetariano",
    "Légumes": "Legumes", "Desserts": "Sobremesas", "Dessert": "Sobremesa", "Sauces": "Molhos", "Sauce": "Molho",
    "Monde": "Mundo", "Poulet": "Frango", "Dinde": "Peru", "Bœuf": "Carne bovina", "Saumon": "Salmão",
    "Poisson": "Peixe", "Œuf": "Ovo", "Porc": "Porco", "Barres protéinées": "Barras proteicas",
    "Pâtes & pains maison": "Massa e pão caseiro", "Repas 4€": "Refeições a 4€",
  },
  de: {
    "Petit-déj": "Frühstück", "Petit-déjeuner": "Frühstück", "Encas 10h": "Snack 10 Uhr", "Encas": "Snack",
    "Déjeuner": "Mittagessen", "Post-training": "Nach dem Training", "Encas 16h": "Snack 16 Uhr", "Dîner": "Abendessen",
    "Saveurs du monde": "Weltküche", "Fast food": "Fast Food", "Bowls": "Bowls", "Salades": "Salate",
    "Salade": "Salat", "Express": "Schnell", "Snacking": "Snacks", "Végé": "Vegetarisch", "Végétarien": "Vegetarisch",
    "Légumes": "Gemüse", "Desserts": "Desserts", "Dessert": "Dessert", "Sauces": "Saucen", "Sauce": "Sauce",
    "Monde": "Welt", "Poulet": "Hähnchen", "Dinde": "Pute", "Bœuf": "Rind", "Saumon": "Lachs",
    "Poisson": "Fisch", "Œuf": "Ei", "Porc": "Schwein", "Barres protéinées": "Proteinriegel",
    "Pâtes & pains maison": "Hausgemachte Nudeln & Brot", "Repas 4€": "Mahlzeiten für 4€",
  },
};

// ---------- traduction des unites d'ingredients (le champ "unite" reste en FR meme dans les lignes traduites) ----------
const UNIT_DICT = {
  en: { "branche": "sprig", "c. à café": "tsp", "c. à soupe": "tbsp", "cube": "cube", "feuille": "leaf",
    "feuilles": "leaves", "gourde": "pouch", "gousse": "clove", "gousses": "cloves", "pièce": "piece",
    "pièces": "pieces", "pincée": "pinch", "poignée": "handful", "poignées": "handfuls",
    "rondelles": "slices", "sachet": "sachet", "tige": "stalk", "tranche": "slice", "tranche épaisse": "thick slice",
    "tranches": "slices" },
  es: { "branche": "ramita", "c. à café": "cdta", "c. à soupe": "cda", "cube": "cubo", "feuille": "hoja",
    "feuilles": "hojas", "gourde": "bolsita", "gousse": "diente", "gousses": "dientes", "pièce": "pieza",
    "pièces": "piezas", "pincée": "pizca", "poignée": "puñado", "poignées": "puñados",
    "rondelles": "rodajas", "sachet": "sobre", "tige": "tallo", "tranche": "rebanada", "tranche épaisse": "rebanada gruesa",
    "tranches": "rebanadas" },
  pt: { "branche": "raminho", "c. à café": "colher de chá", "c. à soupe": "colher de sopa", "cube": "cubo",
    "feuille": "folha", "feuilles": "folhas", "gourde": "saqueta", "gousse": "dente", "gousses": "dentes",
    "pièce": "unidade", "pièces": "unidades", "pincée": "pitada", "poignée": "punhado", "poignées": "punhados",
    "rondelles": "rodelas", "sachet": "pacotinho", "tige": "talo", "tranche": "fatia", "tranche épaisse": "fatia grossa",
    "tranches": "fatias" },
  de: { "branche": "Zweig", "c. à café": "TL", "c. à soupe": "EL", "cube": "Würfel", "feuille": "Blatt",
    "feuilles": "Blätter", "gourde": "Beutel", "gousse": "Zehe", "gousses": "Zehen", "pièce": "Stück",
    "pièces": "Stück", "pincée": "Prise", "poignée": "Handvoll", "poignées": "Handvoll",
    "rondelles": "Scheiben", "sachet": "Beutel", "tige": "Stängel", "tranche": "Scheibe", "tranche épaisse": "dicke Scheibe",
    "tranches": "Scheiben" },
};

function esc(s) {
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function tr(dict, lang, val) {
  if (!val) return val;
  return (dict[lang] && dict[lang][val]) || val;
}

function fmtQty(q) {
  if (typeof q === "number" && Number.isInteger(q)) return String(q);
  return q === undefined || q === null ? "" : String(q);
}

function ingredientLine(it, lang) {
  if (typeof it === "string") return esc(it);
  const q = fmtQty(it.quantite);
  const u = tr(UNIT_DICT, lang, it.unite || "");
  const n = it.nom || "";
  return esc(`${q} ${u} ${n}`.replace(/\s+/g, " ").trim());
}

function ingredientJsonld(it, lang) {
  if (typeof it === "string") return it;
  const q = fmtQty(it.quantite);
  const u = tr(UNIT_DICT, lang, it.unite || "");
  const n = it.nom || "";
  return `${q} ${u} ${n}`.replace(/\s+/g, " ").trim();
}

async function sbFetch(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
}

function renderNotFound(lang) {
  const u = UI[lang];
  return `<!DOCTYPE html>
<html lang="${u.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(u.notFoundTitle)} | GrailleLight</title>
<meta name="robots" content="noindex,follow">
<style>body{font-family:system-ui,sans-serif;background:#F5F1E8;color:#232016;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px}
a{color:#BB5028;font-weight:700;text-decoration:none}</style>
</head>
<body><div><h1>${esc(u.notFoundTitle)}</h1><p>${esc(u.notFoundBody)}</p><p><a href="/">${esc(u.back)}</a></p></div></body>
</html>`;
}

function buildPage(lang, row, related) {
  const u = UI[lang];
  const hasTranslation = !!row[`nom_${lang}`];

  const nom = row[`nom_${lang}`] || row.nom;
  const description = row[`description_${lang}`] || row.description;
  const ingredients = row[`ingredients_${lang}`] || row.ingredients || [];
  const etapes = row[`etapes_${lang}`] || row.etapes || [];

  const categorie = tr(CAT_DICT, lang, row.categorie);
  const base = tr(CAT_DICT, lang, row.base);
  const moment = (row.moment || []).map((m) => tr(CAT_DICT, lang, m));

  const portions = row.portions;
  const calories = row.calories;
  const proteines = row.proteines;
  const glucides = row.glucides;
  const lipides = row.lipides;
  const tprep = row.temps_preparation || 0;
  const tcuis = row.temps_cuisson || 0;
  const ttotal = tprep + tcuis;

  const url = `${SITE}/${lang}/recette/${row.id}`;
  const urlFr = `${SITE}/recette/${row.id}`;

  const descFull = description && nom && description.trim().startsWith(nom.trim())
    ? description : `${nom}. ${description || ""}`.trim();
  const title = `${nom} — ${calories} kcal | GrailleLight`;
  const metaDesc = `${descFull} · ${calories} kcal · ${proteines} g ${u.prot.toLowerCase()} · ${ttotal} min. GrailleLight.`;

  const tags = [
    `<span class="tag">⏱ ${ttotal} min</span>`,
    `<span class="tag">🍽 ${portions} ${portions == 1 ? u.portion : u.portions}</span>`,
    `<span class="tag">${esc(categorie)}</span>`,
  ];
  if (row.base && row.base !== "Sans") tags.push(`<span class="tag">${esc(base)}</span>`);
  moment.forEach((m) => tags.push(`<span class="tag">${esc(m)}</span>`));
  if (row.mode_cuisson === "Airfryer") tags.push(`<span class="tag">Airfryer</span>`);

  const ingHtml = ingredients.map((it) => `<li>${ingredientLine(it, lang)}</li>`).join("");
  const stepsHtml = etapes.map((s) => `<li>${esc(s)}</li>`).join("");

  const ingJsonld = JSON.stringify(ingredients.map((it) => ingredientJsonld(it, lang)));
  const stepsJsonld = JSON.stringify(
    etapes.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s }))
  );

  const alsoHtml = related
    .map((r) => `<a href="/${lang}/recette/${r.id}">${esc(r[`nom_${lang}`] || r.nom)} · ${r.calories} kcal</a>`)
    .join("");

  // hreflang uniquement si cette langue a une vraie traduction (sinon page en noindex, exclue du cluster)
  let hreflangHtml = "";
  if (hasTranslation) {
    const alt = [`<link rel="alternate" hreflang="fr" href="${urlFr}">`,
      `<link rel="alternate" hreflang="x-default" href="${urlFr}">`];
    LANGS.forEach((l) => {
      if (l === lang || row[`nom_${l}`]) {
        alt.push(`<link rel="alternate" hreflang="${l}" href="${SITE}/${l}/recette/${row.id}">`);
      }
    });
    hreflangHtml = alt.join("\n");
  }

  const robots = hasTranslation ? "index,follow" : "noindex,follow";
  const prepIso = `PT${tprep}M`, cookIso = `PT${tcuis}M`, totalIso = `PT${ttotal}M`;

  return `<!DOCTYPE html>
<html lang="${u.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#BB5028">
<meta property="og:type" content="article">
<meta property="og:site_name" content="GrailleLight">
<meta property="og:locale" content="${u.locale}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(nom)} — ${calories} kcal">
<meta property="og:description" content="${esc(metaDesc)}">
<meta name="twitter:card" content="summary">
${hreflangHtml}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet">
<style>:root{--ink:#232016;--ink2:#5C5648;--paper:#F5F1E8;--card:#FCFAF4;--line:#E5DDCC;--rust:#BB5028;--olive:#57683F}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',system-ui,sans-serif;background:var(--paper);color:var(--ink);line-height:1.6}
.wrap{max-width:760px;margin:0 auto;padding:20px 18px 60px}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--line);margin-bottom:22px}
.logo{font-family:'Fraunces',serif;font-weight:900;font-size:26px;color:var(--ink);text-decoration:none;letter-spacing:-.4px}
.logo b{color:var(--rust)} .logo span{color:var(--olive)}
.back{font-size:13px;font-weight:700;color:var(--rust);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:8px 14px;white-space:nowrap}
.eyebrow{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--rust);font-weight:700;margin-bottom:8px}
h1{font-family:'Fraunces',serif;font-weight:900;font-size:clamp(28px,7vw,44px);line-height:1.05;letter-spacing:-.5px;margin-bottom:12px}
.lede{color:var(--ink2);font-size:17px;margin-bottom:20px}
.ph{width:100%;aspect-ratio:16/10;border-radius:16px;margin-bottom:22px;background:linear-gradient(140deg,#EAE1CE,#DBCEB4)}
.macros{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:26px}
.macro{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:11px 8px;text-align:center}
.macro b{display:block;font-family:'Fraunces',serif;font-size:21px;font-weight:600;line-height:1.1}
.macro span{font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--ink2);font-weight:700}
.meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:26px}
.tag{font-size:12.5px;font-weight:700;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:7px 13px;color:var(--ink2)}
h2{font-family:'Fraunces',serif;font-size:23px;font-weight:600;margin:30px 0 12px}
ul.ing{list-style:none} ul.ing li{padding:11px 2px;border-bottom:1px solid var(--line);font-size:15.5px}
ol.steps{padding-left:22px} ol.steps li{margin-bottom:13px;font-size:15.5px}
.also{margin-top:40px;padding-top:22px;border-top:1px solid var(--line)}
.also a{display:block;padding:11px 2px;border-bottom:1px solid var(--line);color:var(--ink);text-decoration:none;font-weight:500;font-size:15px}
.also a:hover{color:var(--rust)}
.cta{display:block;text-align:center;background:var(--rust);color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:16px;margin-top:32px}
footer{margin-top:34px;padding-top:18px;border-top:1px solid var(--line);font-size:13px;color:var(--ink2)}
footer a{color:var(--ink2)}</style>
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Recipe",
  name: nom,
  url: url,
  description: metaDesc,
  inLanguage: u.jsonldLang,
  author: { "@type": "Organization", name: "GrailleLight" },
  recipeYield: `${portions} ${portions == 1 ? u.portion : u.portions}`,
  recipeCategory: categorie,
  prepTime: prepIso, cookTime: cookIso, totalTime: totalIso,
  recipeIngredient: JSON.parse(ingJsonld),
  recipeInstructions: JSON.parse(stepsJsonld),
  nutrition: {
    "@type": "NutritionInformation",
    servingSize: `${portions} ${portions == 1 ? u.portion : u.portions}`,
    calories: `${calories} kcal`,
    proteinContent: `${proteines} g`,
    carbohydrateContent: `${glucides} g`,
    fatContent: `${lipides} g`,
  },
})}
</script>
</head>
<body>
<div class="wrap">
  <div class="top">
    <a class="logo" href="/">GRAI<b>LL</b>E<span>LIGHT</span></a>
    <a class="back" href="/">${esc(u.back)}</a>
  </div>
  <div class="eyebrow">${esc(categorie)}</div>
  <h1>${esc(nom)}</h1>
  <p class="lede">${esc(descFull)}</p>
  ${row.image_url
    ? `<img src="${row.image_url}" alt="${esc(nom)}" loading="lazy" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:16px;margin-bottom:22px;background:#EAE1CE" onerror="this.outerHTML='<div class=&quot;ph&quot;></div>'">`
    : `<div class="ph"></div>`}
  <div class="macros">
    <div class="macro"><b>${calories}</b><span>${esc(u.kcal)}</span></div>
    <div class="macro"><b>${proteines}g</b><span>${esc(u.prot)}</span></div>
    <div class="macro"><b>${glucides}g</b><span>${esc(u.carb)}</span></div>
    <div class="macro"><b>${lipides}g</b><span>${esc(u.fat)}</span></div>
  </div>
  <div class="meta">${tags.join("")}</div>
  <h2>${esc(u.ing)}</h2><ul class="ing">${ingHtml}</ul>
  <h2>${esc(u.prep)}</h2><ol class="steps">${stepsHtml}</ol>
  <a class="cta" href="/">${esc(u.cta)}</a>
  <div class="also"><h2>${esc(u.also)}</h2>${alsoHtml}</div>
  <footer>
    <a href="/">GrailleLight</a> — ${esc(u.tagline)}
  </footer>
</div>
</body>
</html>`;
}

module.exports = async (req, res) => {
  try {
    const lang = req.query && req.query.lang;
    const slug = req.query && req.query.slug;

    if (!LANGS.includes(lang) || !slug || !/^[a-z0-9-]+$/.test(String(slug))) {
      res.status(404).send(renderNotFound(LANGS.includes(lang) ? lang : "en"));
      return;
    }

    const rows = await sbFetch(`recettes?id=eq.${encodeURIComponent(slug)}&select=*`);
    if (!rows || !rows.length) {
      res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(404).send(renderNotFound(lang));
      return;
    }
    const row = rows[0];

    let related = [];
    try {
      const cands = await sbFetch(
        `recettes?categorie=eq.${encodeURIComponent(row.categorie)}&id=neq.${encodeURIComponent(slug)}&select=id,nom,nom_en,nom_es,nom_pt,nom_de,calories&limit=40`
      );
      related = cands
        .sort((a, b) => Math.abs((a.calories || 0) - (row.calories || 0)) - Math.abs((b.calories || 0) - (row.calories || 0)))
        .slice(0, 6);
    } catch (e) {
      related = [];
    }

    const html = buildPage(lang, row, related);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send("Erreur serveur. Reessaie dans un instant.");
  }
};
