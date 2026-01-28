# CyberHub - Accès Équipe Développement

## 🔐 Accès Cloudflare (Partagé)

| | |
|---|---|
| **URL** | https://dash.cloudflare.com |
| **Email** | cyberhub@caplogy.com |
| **Mot de passe** | CyberP@ss123 |

---

## 🔗 Liens du Projet

| Service | URL |
|---------|-----|
| **GitHub** | https://github.com/samirdawaliby/cyberhub |
| **Site Étudiants** | https://cyberhub-egk.pages.dev |
| **Interface Admin** | https://cyberhub-egk.pages.dev/admin.html |
| **API** | https://cyberhub-api.cyberhub-e83.workers.dev |
| **Guide Dev** | https://github.com/samirdawaliby/cyberhub/blob/main/docs/GUIDE_DEVELOPPEURS.md |

---

## 🎨 Interface Admin - Éditeur Visuel

L'interface admin permet de créer des exercices **sans coder** :

1. Connectez-vous sur https://cyberhub-egk.pages.dev/admin.html
2. Cliquez sur "📚 Exercices" puis "➕ Nouvel exercice"
3. Utilisez l'éditeur drag & drop pour créer votre contenu :
   - 📌 **Titres** - Différents niveaux (H1, H2, H3)
   - 📝 **Texte** - Paragraphes avec Markdown
   - 💻 **Code** - Blocs de code avec coloration syntaxique
   - 🖼️ **Images** - URLs ou upload
   - ⚠️ **Alertes** - Info, Warning, Danger, Tips
   - 📋 **Listes** - Puces ou numérotées
   - 🖥️ **Terminal** - Commandes avec style terminal
   - 📂 **Accordéon** - Sections dépliables

4. Ajoutez vos questions :
   - 🔘 **QCM** - Choix unique
   - ☑️ **QCM Multiple** - Plusieurs réponses
   - ✏️ **Texte** - Réponse libre
   - 🚩 **Flag** - Format CTF (FLAG{...})
   - 💻 **Code** - Réponse code
   - 🔢 **Nombre** - Réponse numérique

5. Sauvegardez en brouillon ou publiez directement

---

## 👥 Comptes Éditeurs

> ⚠️ **IMPORTANT** : Connectez-vous sur l'interface admin avec vos identifiants ci-dessous.

| Nom | Prénom | Username | Mot de passe |
|-----|--------|----------|--------------|
| MORHAOUI | Mehdi | mehdi.morhaoui | Cyber#Mehdi2024! |
| BENZEMMOURI | Imed | imed.benzemmouri | Cyber#Imed2024! |
| TALLAH | Imadeddine | imadeddine.tallah | Cyber#Imad2024! |
| REGRAGUI | Yasmine | yasmine.regragui | Cyber#Yasmine2024! |
| AL SAAD | Fawaz | fawaz.alsaad | Cyber#Fawaz2024! |
| ADATO | Ethan | ethan.adato | Cyber#Ethan2024! |
| CARDON | Elliot | elliot.cardon | Cyber#Elliot2024! |
| FODIL | Laïd | laid.fodil | Cyber#Laid2024! |
| NKWEDJAN | Jennie | jennie.nkwedjan | Cyber#Jennie2024! |
| FOMBA | Salimata | salimata.fomba | Cyber#Salimata2024! |
| MATONGO | Fabrice | fabrice.matongo | Cyber#Fabrice2024! |
| TCHAMDA | Dorice Linda | dorice.tchamda | Cyber#Dorice2024! |
| COULIBALY | Souleymane | souleymane.coulibaly | Cyber#Souleymane2024! |
| DA BENOR MARCELLIN | Henri | henri.dabenor | Cyber#Henri2024! |
| OUEDRAOGO | Abdul-Aziz | abdulaziz.ouedraogo | Cyber#Abdul2024! |
| NOUGBODOHOUE | Bovalus | bovalus.nougbodohoue | Cyber#Bovalus2024! |
| BENKHALED | Chedi | chedi.benkhaled | Cyber#Chedi2024! |
| CORNELOUZ | Titouan | titouan.cornelouz | Cyber#Titouan2024! |
| FAURE | Stanislas | stanislas.faure | Cyber#Stanislas2024! |
| JAFFREDO | Korentin | korentin.jaffredo | Cyber#Korentin2024! |

---

## 📋 Instructions de démarrage (développement local)

1. **Cloner le projet**
```bash
git clone https://github.com/samirdawaliby/cyberhub.git
cd cyberhub
```

2. **Créer votre branche**
```bash
git checkout -b dev/votre-prenom
```

3. **Installer les dépendances**
```bash
cd workers && npm install
```

4. **Se connecter à Cloudflare**
```bash
npm install -g wrangler
wrangler login
# → Utiliser cyberhub@caplogy.com / CyberP@ss123
```

5. **Lancer en local**
```bash
npm run dev
```

---

## 📖 Documentation

Consultez le guide complet : [GUIDE_DEVELOPPEURS.md](./GUIDE_DEVELOPPEURS.md)

---

*Document confidentiel - Ne pas partager publiquement*
