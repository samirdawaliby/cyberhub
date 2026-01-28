-- =============================================
-- CYBERHUB - DONNÉES INITIALES
-- =============================================

-- =============================================
-- THÉMATIQUES PRINCIPALES
-- =============================================

-- Red Team (Offensive)
INSERT INTO themes (id, name, description, icon, color, team_type, order_index) VALUES
('red-team', 'Red Team', 'Techniques offensives : pentesting, exploitation, cryptographie et social engineering.', 'sword', '#DC2626', 'red', 1);

-- Blue Team (Défensive)
INSERT INTO themes (id, name, description, icon, color, team_type, order_index) VALUES
('blue-team', 'Blue Team', 'Techniques défensives : OSINT, SIEM, forensics, SOC et incident response.', 'shield', '#2563EB', 'blue', 2);

-- =============================================
-- SOUS-THÉMATIQUES RED TEAM
-- =============================================

INSERT INTO themes (id, name, description, icon, color, team_type, parent_id, order_index) VALUES
('pentesting', 'Pentesting', 'Tests d''intrusion avec Nmap, Metasploit, Burp Suite et plus.', 'target', '#EF4444', 'red', 'red-team', 1),
('cryptographie', 'Cryptographie', 'Hashage, chiffrement, cracking et analyse cryptographique.', 'key', '#F97316', 'red', 'red-team', 2),
('exploitation', 'Exploitation', 'Buffer overflow, injections SQL/XSS, RCE et élévation de privilèges.', 'bug', '#DC2626', 'red', 'red-team', 3),
('social-engineering', 'Social Engineering', 'Phishing, pretexting, manipulation et ingénierie sociale.', 'users', '#B91C1C', 'red', 'red-team', 4);

-- =============================================
-- SOUS-THÉMATIQUES BLUE TEAM
-- =============================================

INSERT INTO themes (id, name, description, icon, color, team_type, parent_id, order_index) VALUES
('osint', 'OSINT', 'Open Source Intelligence : recherche, analyse et collecte d''informations.', 'search', '#3B82F6', 'blue', 'blue-team', 1),
('siem', 'SIEM', 'Security Information and Event Management : Splunk, ELK, Wazuh.', 'activity', '#1D4ED8', 'blue', 'blue-team', 2),
('firewall', 'Firewall & Réseau', 'Configuration pfSense, Snort, IDS/IPS et sécurité réseau.', 'shield-check', '#2563EB', 'blue', 'blue-team', 3),
('forensics', 'Forensics', 'Analyse mémoire, disque, réseau et investigation numérique.', 'microscope', '#1E40AF', 'blue', 'blue-team', 4),
('soc', 'SOC & Incident Response', 'Centre opérationnel de sécurité et réponse aux incidents.', 'alert-triangle', '#1E3A8A', 'blue', 'blue-team', 5);

-- =============================================
-- TEMPLATES DE CONTAINERS
-- =============================================

INSERT INTO container_templates (id, name, description, image_tag, team_type, vnc_port, resources) VALUES
('kali-full', 'Kali Linux Full', 'Kali Linux avec tous les outils de pentesting', 'cyberhub/kali-full:latest', 'red', 5900, '{"cpu": "2", "memory": "4Gi", "timeout": 7200}'),
('kali-light', 'Kali Linux Light', 'Kali Linux avec outils essentiels', 'cyberhub/kali-light:latest', 'red', 5900, '{"cpu": "1", "memory": "2Gi", "timeout": 7200}'),
('metasploit', 'Metasploit Lab', 'Environnement Metasploit avec cibles vulnérables', 'cyberhub/metasploit:latest', 'red', 5900, '{"cpu": "2", "memory": "4Gi", "timeout": 7200}'),
('crypto-lab', 'Crypto Lab', 'Outils de cryptographie : hashcat, john, openssl', 'cyberhub/crypto:latest', 'red', 5900, '{"cpu": "2", "memory": "2Gi", "timeout": 7200}'),
('siem-elk', 'SIEM ELK Stack', 'Elasticsearch, Logstash, Kibana pour analyse de logs', 'cyberhub/elk:latest', 'blue', 5900, '{"cpu": "2", "memory": "4Gi", "timeout": 7200}'),
('splunk-lab', 'Splunk Lab', 'Splunk Enterprise pour analyse SIEM', 'cyberhub/splunk:latest', 'blue', 5900, '{"cpu": "2", "memory": "4Gi", "timeout": 7200}'),
('forensics-lab', 'Forensics Lab', 'Autopsy, Volatility, Wireshark pour investigation', 'cyberhub/forensics:latest', 'blue', 5900, '{"cpu": "2", "memory": "4Gi", "timeout": 7200}'),
('pfsense-lab', 'pfSense Lab', 'Firewall pfSense avec réseau virtuel', 'cyberhub/pfsense:latest', 'blue', 5900, '{"cpu": "1", "memory": "2Gi", "timeout": 7200}');

-- =============================================
-- EXERCICES RED TEAM - PENTESTING
-- =============================================

INSERT INTO exercises (id, theme_id, title, description, difficulty, duration_minutes, points_max, course_content, container_template_id, order_index) VALUES
('pentest-nmap-basics', 'pentesting', 'Reconnaissance avec Nmap', 'Maîtrisez les bases du scan réseau avec Nmap.', 'débutant', 45, 100,
'# Reconnaissance avec Nmap

## Objectifs
- Comprendre les différents types de scans
- Identifier les ports et services ouverts
- Détecter les versions et OS

## Introduction
Nmap (Network Mapper) est l''outil de reconnaissance le plus utilisé en pentesting.

## Types de Scans

### Scan TCP Connect
```bash
nmap -sT 192.168.1.1
```

### Scan SYN (Stealth)
```bash
nmap -sS 192.168.1.1
```

### Scan de Services
```bash
nmap -sV 192.168.1.1
```

### Scan OS Detection
```bash
nmap -O 192.168.1.1
```

## Scan Complet
```bash
nmap -sV -sC -O -p- target.com
```

## ⚠️ Éthique
Ne scannez que des systèmes pour lesquels vous avez une autorisation écrite !
', 'kali-light', 1),

('pentest-metasploit-intro', 'pentesting', 'Introduction à Metasploit', 'Découvrez le framework Metasploit pour les tests d''intrusion.', 'intermédiaire', 60, 150,
'# Introduction à Metasploit

## Objectifs
- Comprendre l''architecture de Metasploit
- Utiliser msfconsole
- Lancer un premier exploit

## Démarrage
```bash
msfconsole
```

## Commandes de Base
```bash
search type:exploit platform:windows
use exploit/windows/smb/ms17_010_eternalblue
show options
set RHOSTS 192.168.1.100
exploit
```

## Modules
- **Exploits** : Code d''exploitation
- **Payloads** : Code exécuté après exploitation
- **Auxiliary** : Scanners, fuzzers
- **Post** : Post-exploitation
', 'metasploit', 2);

-- =============================================
-- EXERCICES RED TEAM - CRYPTOGRAPHIE
-- =============================================

INSERT INTO exercises (id, theme_id, title, description, difficulty, duration_minutes, points_max, course_content, container_template_id, order_index) VALUES
('crypto-hash-basics', 'cryptographie', 'Fondamentaux du Hashage', 'Comprendre MD5, SHA et leurs faiblesses.', 'débutant', 30, 80,
'# Fondamentaux du Hashage

## Objectifs
- Comprendre les fonctions de hashage
- Identifier les différents algorithmes
- Reconnaître leurs faiblesses

## Algorithmes Courants

| Algorithme | Longueur | Sécurité |
|------------|----------|----------|
| MD5 | 128 bits | ❌ Cassé |
| SHA-1 | 160 bits | ❌ Cassé |
| SHA-256 | 256 bits | ✅ Sûr |
| SHA-512 | 512 bits | ✅ Sûr |

## Exemples
```bash
echo -n "password" | md5sum
echo -n "password" | sha256sum
```

## Identifier un Hash
- 32 caractères → MD5
- 40 caractères → SHA-1
- 64 caractères → SHA-256
', 'crypto-lab', 1),

('crypto-password-cracking', 'cryptographie', 'Cracking de Mots de Passe', 'Techniques de cracking avec Hashcat et John.', 'intermédiaire', 60, 120,
'# Cracking de Mots de Passe

## Outils
- **Hashcat** : GPU-based, très rapide
- **John the Ripper** : CPU-based, polyvalent

## Hashcat - Attaque Dictionnaire
```bash
hashcat -m 0 -a 0 hash.txt wordlist.txt
```

## John the Ripper
```bash
john --wordlist=rockyou.txt hash.txt
john --show hash.txt
```

## Modes d''Attaque
- **Dictionnaire** : Liste de mots
- **Brute-force** : Toutes combinaisons
- **Rules** : Mutations de mots
- **Hybrid** : Combinaison
', 'crypto-lab', 2);

-- =============================================
-- EXERCICES BLUE TEAM - OSINT
-- =============================================

INSERT INTO exercises (id, theme_id, title, description, difficulty, duration_minutes, points_max, course_content, container_template_id, order_index) VALUES
('osint-recon-basics', 'osint', 'OSINT - Reconnaissance Passive', 'Techniques de collecte d''informations sans interaction directe.', 'débutant', 45, 100,
'# OSINT - Reconnaissance Passive

## Objectifs
- Collecter des informations publiques
- Utiliser les outils OSINT
- Analyser les données trouvées

## Sources d''Information

### Moteurs de Recherche
- Google Dorks : `site:target.com filetype:pdf`
- Shodan : Recherche d''appareils connectés
- Censys : Certificats et services

### Réseaux Sociaux
- LinkedIn : Employés, technologies
- Twitter : Communications, incidents
- GitHub : Code source, secrets

## Outils
```bash
# theHarvester
theHarvester -d target.com -b google

# Recon-ng
recon-ng
marketplace install all
```
', NULL, 1),

('osint-shodan', 'osint', 'Recherche avec Shodan', 'Utilisez Shodan pour découvrir les assets exposés.', 'intermédiaire', 45, 100,
'# Recherche avec Shodan

## Qu''est-ce que Shodan ?
Shodan est un moteur de recherche pour les appareils connectés à Internet.

## Recherches de Base
```
hostname:target.com
port:22
country:FR
```

## Filtres Avancés
```
product:Apache
os:Windows
vuln:CVE-2021-44228
```

## API Shodan
```python
import shodan
api = shodan.Shodan("API_KEY")
results = api.search("apache")
```
', NULL, 2);

-- =============================================
-- EXERCICES BLUE TEAM - SIEM
-- =============================================

INSERT INTO exercises (id, theme_id, title, description, difficulty, duration_minutes, points_max, course_content, container_template_id, order_index) VALUES
('siem-elk-intro', 'siem', 'Introduction à ELK Stack', 'Déployez et configurez Elasticsearch, Logstash et Kibana.', 'intermédiaire', 90, 150,
'# Introduction à ELK Stack

## Composants
- **Elasticsearch** : Stockage et recherche
- **Logstash** : Collecte et transformation
- **Kibana** : Visualisation

## Architecture
```
Logs → Logstash → Elasticsearch → Kibana
```

## Configuration Logstash
```ruby
input {
  file {
    path => "/var/log/auth.log"
    type => "auth"
  }
}
filter {
  grok {
    match => { "message" => "%{SYSLOGTIMESTAMP:timestamp}" }
  }
}
output {
  elasticsearch {
    hosts => ["localhost:9200"]
  }
}
```
', 'siem-elk', 1),

('siem-detection-rules', 'siem', 'Création de Règles de Détection', 'Écrivez des règles pour détecter les menaces.', 'avancé', 60, 120,
'# Création de Règles de Détection

## Types de Détection
- **Signature** : Pattern connu
- **Anomalie** : Comportement inhabituel
- **Heuristique** : Règles logiques

## Exemple KQL (Kibana)
```
event.category: "authentication" AND event.outcome: "failure" AND event.count > 5
```

## Cas d''Usage
1. Brute-force SSH
2. Scan de ports
3. Exfiltration de données
4. Mouvement latéral
', 'siem-elk', 2);

-- =============================================
-- EXERCICES BLUE TEAM - FORENSICS
-- =============================================

INSERT INTO exercises (id, theme_id, title, description, difficulty, duration_minutes, points_max, course_content, container_template_id, order_index) VALUES
('forensics-memory', 'forensics', 'Analyse Mémoire avec Volatility', 'Analysez des dumps mémoire pour trouver des preuves.', 'avancé', 90, 150,
'# Analyse Mémoire avec Volatility

## Installation
```bash
pip install volatility3
```

## Commandes de Base
```bash
# Identifier le profil
vol -f memory.dmp windows.info

# Lister les processus
vol -f memory.dmp windows.pslist

# Connexions réseau
vol -f memory.dmp windows.netscan

# Extraire des fichiers
vol -f memory.dmp windows.dumpfiles
```

## Artefacts Recherchés
- Processus suspects
- Connexions réseau
- Clés de registre
- Mots de passe en mémoire
', 'forensics-lab', 1);

-- =============================================
-- QUESTIONS POUR L'EXERCICE NMAP
-- =============================================

INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES
('q-nmap-1', 'pentest-nmap-basics', 'Quelle option Nmap permet de faire un scan SYN (stealth) ?', 'qcm', '["-sT", "-sS", "-sU", "-sV"]', '-sS', 10, 'C''est le scan le plus discret', 1),
('q-nmap-2', 'pentest-nmap-basics', 'Quelle commande permet de détecter la version des services ?', 'qcm', '["nmap -O", "nmap -sV", "nmap -sC", "nmap -p-"]', 'nmap -sV', 10, 'V comme Version', 2),
('q-nmap-3', 'pentest-nmap-basics', 'Quel port est généralement utilisé par SSH ?', 'text', NULL, '22', 10, 'C''est un port bien connu', 3),
('q-nmap-4', 'pentest-nmap-basics', 'Scannez la cible et trouvez le flag dans le service HTTP.', 'flag', NULL, 'FLAG{nmap_master_2024}', 30, 'Regardez la bannière du serveur web', 4),
('q-nmap-5', 'pentest-nmap-basics', 'Combien de ports TCP sont ouverts sur la cible ? (nombre)', 'text', NULL, '5', 20, 'Utilisez nmap -p-', 5),
('q-nmap-6', 'pentest-nmap-basics', 'Quel est le système d''exploitation de la cible ?', 'qcm', '["Windows Server 2019", "Ubuntu 22.04", "CentOS 7", "Debian 11"]', 'Ubuntu 22.04', 20, 'Utilisez l''option -O', 6);

-- =============================================
-- QUESTIONS POUR L'EXERCICE HASH
-- =============================================

INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES
('q-hash-1', 'crypto-hash-basics', 'Quelle est la longueur d''un hash MD5 en caractères hexadécimaux ?', 'qcm', '["16", "32", "40", "64"]', '32', 10, '128 bits = ? caractères hex', 1),
('q-hash-2', 'crypto-hash-basics', 'Quel algorithme de hashage est encore considéré comme sûr ?', 'qcm', '["MD5", "SHA-1", "SHA-256", "LM Hash"]', 'SHA-256', 10, 'Les deux premiers sont cassés', 2),
('q-hash-3', 'crypto-hash-basics', 'Identifiez cet algorithme : 5d41402abc4b2a76b9719d911017c592', 'text', NULL, 'MD5', 15, 'Comptez les caractères', 3),
('q-hash-4', 'crypto-hash-basics', 'Quel est le hash MD5 du mot "cyber" ? (minuscules)', 'text', NULL, 'a]86134a5bbe818bff4d4db6e2916c6ad', 25, 'Utilisez echo -n "cyber" | md5sum', 4),
('q-hash-5', 'crypto-hash-basics', 'Pourquoi MD5 n''est plus recommandé pour les mots de passe ?', 'qcm', '["Trop lent", "Collisions trouvées", "Trop long", "Non supporté"]', 'Collisions trouvées', 20, 'Deux entrées différentes peuvent donner le même hash', 5);

-- =============================================
-- QUESTIONS POUR L'EXERCICE OSINT
-- =============================================

INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES
('q-osint-1', 'osint-recon-basics', 'Quel Google Dork permet de trouver des fichiers PDF sur un site ?', 'qcm', '["inurl:pdf", "filetype:pdf site:target.com", "ext:pdf", "type:pdf"]', 'filetype:pdf site:target.com', 10, 'Combinaison de deux opérateurs', 1),
('q-osint-2', 'osint-recon-basics', 'Quel outil permet de collecter des emails à partir d''un domaine ?', 'qcm', '["Nmap", "theHarvester", "Wireshark", "Metasploit"]', 'theHarvester', 10, 'Nom en rapport avec la récolte', 2),
('q-osint-3', 'osint-recon-basics', 'Quelle plateforme est la meilleure pour trouver des employés d''une entreprise ?', 'text', NULL, 'LinkedIn', 15, 'Réseau social professionnel', 3),
('q-osint-4', 'osint-recon-basics', 'Qu''est-ce que Shodan indexe principalement ?', 'qcm', '["Pages web", "Réseaux sociaux", "Appareils connectés", "Dark web"]', 'Appareils connectés', 15, 'IoT, serveurs, caméras...', 4);

-- =============================================
-- ÉTUDIANTS DE TEST
-- =============================================

INSERT INTO students (id, student_code, display_name, total_points) VALUES
('student-1', 'STU001', 'Alice Martin', 450),
('student-2', 'STU002', 'Bob Dupont', 380),
('student-3', 'STU003', 'Charlie Durand', 520),
('student-4', 'STU004', 'Diana Moreau', 290),
('student-5', 'STU005', 'Eve Lambert', 610);

-- =============================================
-- SCOREBOARD INITIAL
-- =============================================

INSERT INTO scoreboard (student_id, display_name, total_points, red_team_points, blue_team_points, exercises_completed, rank) VALUES
('student-5', 'Eve Lambert', 610, 350, 260, 8, 1),
('student-3', 'Charlie Durand', 520, 280, 240, 7, 2),
('student-1', 'Alice Martin', 450, 200, 250, 6, 3),
('student-2', 'Bob Dupont', 380, 220, 160, 5, 4),
('student-4', 'Diana Moreau', 290, 150, 140, 4, 5);
