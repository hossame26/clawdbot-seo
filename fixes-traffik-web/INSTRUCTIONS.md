# Guide d'installation SEO - Traffik Web

## Score actuel: 84/100 → Objectif: 95+/100

---

## ÉTAPE 1: Intégration Divi (5 min)

### Méthode simple (recommandée)

1. Va dans **WordPress Admin** → **Divi** → **Options du thème**
2. Clique sur l'onglet **Intégration**
3. Dans le champ **"Ajouter du code au <head>"**, colle tout le contenu du fichier `head-divi-integration.html`
4. Clique **Enregistrer les modifications**

---

## ÉTAPE 2: Image Open Graph (2 min)

Crée une image pour le partage sur les réseaux sociaux:

- **Dimensions**: 1200 x 630 pixels
- **Format**: JPG ou PNG
- **Nom**: `og-image.jpg`
- **Upload**: Médiathèque WordPress → copie l'URL

Puis remplace dans le code:
```
https://traffik-web.fr/wp-content/uploads/og-image.jpg
```
par l'URL réelle de ton image.

---

## ÉTAPE 3: .htaccess (3 min)

1. Connecte-toi en FTP ou via le gestionnaire de fichiers de ton hébergeur
2. Ouvre le fichier `.htaccess` à la racine de ton site
3. **GARDE** les règles WordPress existantes (entre `# BEGIN WordPress` et `# END WordPress`)
4. **AJOUTE** le contenu du fichier `.htaccess-additions` **APRÈS** les règles WordPress
5. Sauvegarde

⚠️ **IMPORTANT**: Fais une sauvegarde du .htaccess original avant modification!

---

## ÉTAPE 4: robots.txt (1 min)

1. Remplace le fichier `robots.txt` à la racine de ton site par celui fourni
2. Ou va dans **Yoast SEO** → **Outils** → **Éditeur de fichiers** → **robots.txt**

---

## ÉTAPE 5: Corriger les images (5-10 min)

### Dans Divi Builder, pour chaque image:

1. Clique sur l'image
2. Va dans **Design** → **Dimensionnement**
3. Définis **Largeur** et **Hauteur** explicites
4. Exemple: `width: 200px, height: 150px`

### Images à corriger:
- shopify-removebg-preview.png
- wordpress-removebg-preview.png
- Et les 5 autres mentionnées dans l'audit

---

## ÉTAPE 6: Corriger le lien WhatsApp (2 min)

Trouve le lien WhatsApp dans ta page et ajoute du texte visible:

**Avant:**
```html
<a href="https://wa.me/33635505374"></a>
```

**Après:**
```html
<a href="https://wa.me/33635505374">
  <img src="whatsapp-icon.png" alt="WhatsApp">
  Contactez-nous sur WhatsApp
</a>
```

---

## ÉTAPE 7: Ajouter du contenu (15+ min)

Tu as **353 mots**, vise **600+ mots**.

### Suggestions de sections à ajouter:

1. **FAQ** - Questions fréquentes sur vos services
2. **Pourquoi nous choisir** - 3-4 avantages
3. **Témoignages clients**
4. **Processus de commande** - Comment ça marche

---

## ÉTAPE 8: Plugin SEO (optionnel mais recommandé)

Installe **Rank Math** ou **Yoast SEO** pour:
- Gérer automatiquement les meta tags par page
- Sitemap XML automatique
- Analyse SEO en temps réel

---

## VÉRIFICATION FINALE

Après installation, relance l'audit:
```bash
node packages/cli/dist/index.js page https://traffik-web.fr -v
```

### Checklist:
- [ ] Meta description présente
- [ ] Canonical URL présente
- [ ] Open Graph configuré
- [ ] JSON-LD structured data présent
- [ ] Compression GZIP activée
- [ ] Headers de sécurité actifs
- [ ] Images avec dimensions
- [ ] Lien WhatsApp avec texte

---

## Support

En cas de problème, vérifie:
1. Cache vidé (plugin cache + navigateur)
2. Pas d'erreurs dans la console développeur (F12)
3. .htaccess pas corrompu (erreur 500 = problème .htaccess)

---

## Fichiers fournis

| Fichier | Description |
|---------|-------------|
| `head-divi-integration.html` | Code à coller dans Divi |
| `seo-functions.php` | Code PHP avancé (optionnel) |
| `.htaccess-additions` | Optimisations serveur |
| `robots.txt` | Fichier robots optimisé |
