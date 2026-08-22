// Fonction serveur : reçoit les textes, appelle DeepL, renvoie les traductions.
// La clé DeepL reste ici, côté serveur — elle n'apparaît jamais dans le navigateur.
//
// À configurer dans Vercel → Settings → Environment Variables :
//   DEEPL_KEY    = ta clé DeepL (celle qui finit par :fx)
//   TRAD_SECRET  = un mot de passe de ton choix, pour que toi seul puisses l'utiliser

export default async function handler(req, res) {
  // autoriser l'appel depuis l'outil ouvert en local
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-trad-secret');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const CLE = process.env.DEEPL_KEY;
  const SECRET = process.env.TRAD_SECRET;

  if (!CLE) return res.status(500).json({ error: "DEEPL_KEY n'est pas configurée dans Vercel." });
  if (SECRET && req.headers['x-trad-secret'] !== SECRET) {
    return res.status(401).json({ error: 'Mot de passe incorrect.' });
  }

  // demande du quota restant
  if (req.method === 'GET' || req.query.usage === '1') {
    const u = CLE.trim().endsWith(':fx')
      ? 'https://api-free.deepl.com/v2/usage'
      : 'https://api.deepl.com/v2/usage';
    try {
      const r = await fetch(u, { headers: { Authorization: 'DeepL-Auth-Key ' + CLE.trim() } });
      return res.status(r.status).json(await r.json());
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { text, target_lang } = req.body || {};
  if (!Array.isArray(text) || !text.length) return res.status(400).json({ error: 'Aucun texte reçu.' });
  if (!target_lang) return res.status(400).json({ error: 'Langue manquante.' });

  const url = CLE.trim().endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'DeepL-Auth-Key ' + CLE.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        source_lang: 'FR',
        target_lang,
        tag_handling: 'xml',
        ignore_tags: ['x'],
        context: 'Recette de cuisine : nom du plat, ingrédients et étapes de préparation.'
      })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ error: data.message || 'DeepL ' + r.status });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
