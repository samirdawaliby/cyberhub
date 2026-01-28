-- =============================================
-- EXERCICE COMPLET : Reconnaissance avec Nmap
-- Avec container lab et questions
-- =============================================

-- 1. Ajouter le template de container
INSERT OR REPLACE INTO container_templates (id, name, description, image_tag, team_type, vnc_port, resources) VALUES
('nmap-basics-lab', 'Nmap Basics Lab', 'Environnement d''entraînement Nmap avec services vulnérables et flags cachés', 'cyberhub/nmap-basics-lab:latest', 'red', 5900, '{"cpu": "1", "memory": "2Gi", "timeout": 7200}');

-- 2. Mettre à jour l'exercice existant pour lier le container
UPDATE exercises
SET container_template_id = 'nmap-basics-lab',
    course_content = '# Reconnaissance avec Nmap

## 🎯 Objectifs
- Comprendre les différents types de scans Nmap
- Identifier les ports et services ouverts
- Détecter les versions des services
- Trouver des informations cachées

---

## 📚 Introduction

**Nmap** (Network Mapper) est l''outil de reconnaissance le plus utilisé en pentesting. Il permet de :
- Scanner des réseaux et hôtes
- Découvrir les ports ouverts
- Identifier les services et leurs versions
- Détecter le système d''exploitation

---

## 🔍 Types de Scans

### Scan TCP Connect (-sT)
Le scan le plus basique, établit une connexion TCP complète.
```bash
nmap -sT 192.168.1.1
```

### Scan SYN "Stealth" (-sS)
Plus discret, n''établit pas de connexion complète.
```bash
nmap -sS 192.168.1.1
```
⚠️ Nécessite les privilèges root.

### Scan UDP (-sU)
Pour scanner les services UDP.
```bash
nmap -sU 192.168.1.1
```

---

## 🛠️ Options Importantes

### Détection de version (-sV)
Identifie les versions des services.
```bash
nmap -sV 192.168.1.1
```

### Détection OS (-O)
Tente d''identifier le système d''exploitation.
```bash
nmap -O 192.168.1.1
```

### Scanner tous les ports (-p-)
Par défaut, Nmap scanne les 1000 ports les plus courants.
```bash
nmap -p- 192.168.1.1      # Tous les ports
nmap -p 1-1000 192.168.1.1 # Ports 1 à 1000
nmap -p 22,80,443 192.168.1.1 # Ports spécifiques
```

### Scripts NSE (-sC)
Utilise les scripts par défaut pour plus d''informations.
```bash
nmap -sC 192.168.1.1
```

---

## 📋 Commande Complète Recommandée

```bash
nmap -sV -sC -O -p- target.com
```

Cette commande effectue :
- Détection de version des services
- Exécution des scripts par défaut
- Détection du système d''exploitation
- Scan de tous les ports

---

## 🚨 Éthique et Légalité

> ⚠️ **IMPORTANT** : Ne scannez JAMAIS un système sans autorisation écrite !
>
> Le scan non autorisé est **illégal** dans la plupart des pays.

---

## 🎮 Exercice Pratique

### Mission
Lancez le lab et scannez la machine cible pour :

1. **Identifier tous les ports ouverts**
2. **Déterminer les services qui tournent**
3. **Trouver les 4 flags cachés**

### Indices
- Certains flags sont dans le code source des pages web
- Un service secret écoute sur un port non standard
- Utilisez `curl` ou `netcat` pour interagir avec les services

### Accès au Lab
- **User** : student
- **Password** : cyberhub2024

Bonne chance ! 🍀
'
WHERE id = 'pentest-nmap-basics';

-- 3. Supprimer les anciennes questions si elles existent
DELETE FROM questions WHERE exercise_id = 'pentest-nmap-basics';

-- 4. Ajouter les nouvelles questions complètes
INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES

-- Question 1 : QCM basique
('nmap-q1', 'pentest-nmap-basics',
 'Quelle option Nmap permet de faire un scan SYN (stealth) ?',
 'qcm',
 '["-sT", "-sS", "-sU", "-sV"]',
 '-sS',
 10,
 'S comme SYN, le scan le plus discret',
 1),

-- Question 2 : QCM
('nmap-q2', 'pentest-nmap-basics',
 'Quelle commande permet de détecter la version des services ?',
 'qcm',
 '["nmap -O target", "nmap -sV target", "nmap -sC target", "nmap -p- target"]',
 'nmap -sV target',
 10,
 'V comme Version',
 2),

-- Question 3 : Texte
('nmap-q3', 'pentest-nmap-basics',
 'Quelle option permet de scanner TOUS les ports TCP (65535) ?',
 'text',
 NULL,
 '-p-',
 15,
 'Un tiret suivi d''un autre tiret',
 3),

-- Question 4 : Texte - Résultat du scan
('nmap-q4', 'pentest-nmap-basics',
 'Combien de ports TCP sont ouverts sur la cible ? (lancez le lab et scannez)',
 'text',
 NULL,
 '5',
 'Utilisez nmap -p- pour scanner tous les ports',
 4),

-- Question 5 : FLAG - Apache
('nmap-q5', 'pentest-nmap-basics',
 'Trouvez le flag caché dans le code source de la page Apache (port 80)',
 'flag',
 NULL,
 'FLAG{apache_found_80}',
 20,
 'Utilisez curl et regardez le code source HTML',
 5),

-- Question 6 : FLAG - Répertoire caché
('nmap-q6', 'pentest-nmap-basics',
 'Trouvez le flag dans le répertoire secret sur le serveur web (indice: /secret/)',
 'flag',
 NULL,
 'FLAG{hidden_directory_found}',
 25,
 'Essayez d''accéder à /secret/flag.txt',
 6),

-- Question 7 : FLAG - Nginx
('nmap-q7', 'pentest-nmap-basics',
 'Trouvez le flag sur le serveur Nginx (port 8080)',
 'flag',
 NULL,
 'FLAG{nginx_8080_secret}',
 20,
 'Scannez d''abord pour trouver le port, puis curl',
 7),

-- Question 8 : FLAG - Service secret
('nmap-q8', 'pentest-nmap-basics',
 'Trouvez le flag du service secret (indice: port > 9000)',
 'flag',
 NULL,
 'FLAG{secret_port_9999}',
 30,
 'Utilisez netcat (nc) pour vous connecter au port',
 8),

-- Question 9 : QCM compréhension
('nmap-q9', 'pentest-nmap-basics',
 'Pourquoi le scan SYN (-sS) est-il appelé "stealth" ?',
 'qcm',
 '["Il est plus rapide", "Il ne complète pas la connexion TCP", "Il utilise UDP", "Il chiffre les paquets"]',
 'Il ne complète pas la connexion TCP',
 10,
 'Le scan SYN envoie SYN mais ne répond pas au SYN-ACK',
 9),

-- Question 10 : Code/Commande
('nmap-q10', 'pentest-nmap-basics',
 'Écrivez la commande Nmap complète pour : scanner les ports 1-10000, détecter les versions, sur la cible 10.0.0.1',
 'text',
 NULL,
 'nmap -sV -p1-10000 10.0.0.1',
 20,
 'Combinez -sV pour les versions et -p pour les ports',
 10);

-- 5. Vérification
SELECT
    e.id,
    e.title,
    e.difficulty,
    e.points_max,
    ct.name as lab_name,
    COUNT(q.id) as question_count,
    SUM(q.points) as total_points
FROM exercises e
LEFT JOIN container_templates ct ON e.container_template_id = ct.id
LEFT JOIN questions q ON q.exercise_id = e.id
WHERE e.id = 'pentest-nmap-basics'
GROUP BY e.id;
