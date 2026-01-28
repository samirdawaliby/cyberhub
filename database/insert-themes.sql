-- =============================================
-- CYBERHUB - THÉMATIQUES RED & BLUE TEAM
-- =============================================

-- RED TEAM (Offensive)
INSERT OR REPLACE INTO themes (id, name, description, icon, team_type, order_index, is_active) VALUES
('theme-pentesting', 'Pentesting', 'Tests d''intrusion, exploitation de vulnérabilités, méthodologies offensives', '⚔️', 'red', 1, 1);

INSERT OR REPLACE INTO themes (id, name, description, icon, team_type, order_index, is_active) VALUES
('theme-osint', 'OSINT', 'Open Source Intelligence - Collecte d''informations en sources ouvertes', '🔍', 'red', 2, 1);

INSERT OR REPLACE INTO themes (id, name, description, icon, team_type, order_index, is_active) VALUES
('theme-maltego', 'OSINT - Maltego', 'Analyse de liens et visualisation de données avec Maltego', '🕸️', 'red', 3, 1);

INSERT OR REPLACE INTO themes (id, name, description, icon, team_type, order_index, is_active) VALUES
('theme-crypto-python', 'Cryptographie Python', 'TPs de cryptographie avec Python - Chiffrement, déchiffrement, hashing', '🐍', 'red', 4, 1);

INSERT OR REPLACE INTO themes (id, name, description, icon, team_type, order_index, is_active) VALUES
('theme-cyberchef', 'CyberChef', 'Encodage, décodage, analyse de données avec CyberChef', '👨‍🍳', 'red', 5, 1);

INSERT OR REPLACE INTO themes (id, name, description, icon, team_type, order_index, is_active) VALUES
('theme-blockchain', 'Blockchain & Crypto', 'Blockchain, cryptomonnaies, smart contracts, sécurité Web3', '⛓️', 'red', 6, 1);

-- BLUE TEAM (Defensive)
INSERT OR REPLACE INTO themes (id, name, description, icon, team_type, order_index, is_active) VALUES
('theme-wazuh', 'Wazuh SIEM', 'Détection d''intrusion, analyse de logs, monitoring avec Wazuh', '🛡️', 'blue', 1, 1);

INSERT OR REPLACE INTO themes (id, name, description, icon, team_type, order_index, is_active) VALUES
('theme-elasticsearch', 'ElasticSearch / ELK', 'Stack ELK - Elasticsearch, Logstash, Kibana pour l''analyse de logs', '📊', 'blue', 2, 1);

INSERT OR REPLACE INTO themes (id, name, description, icon, team_type, order_index, is_active) VALUES
('theme-monitoring', 'Zabbix & Nagios', 'Monitoring infrastructure, alerting, supervision réseau', '📡', 'blue', 3, 1);

INSERT OR REPLACE INTO themes (id, name, description, icon, team_type, order_index, is_active) VALUES
('theme-frameworks', 'NIST, CISO, EBIOS', 'Frameworks de sécurité, gestion des risques, conformité', '📋', 'blue', 4, 1);

INSERT OR REPLACE INTO themes (id, name, description, icon, team_type, order_index, is_active) VALUES
('theme-comptia', 'CompTIA Security+', 'Formations et certifications CompTIA - Security+, CySA+, PenTest+', '🎓', 'blue', 5, 1);
