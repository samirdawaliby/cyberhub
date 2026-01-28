-- Questions pour l'exercice Nmap
INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES
('nmap-q1', 'pentest-nmap-basics', 'Quelle option Nmap permet de faire un scan SYN (stealth) ?', 'qcm', '["-sT", "-sS", "-sU", "-sV"]', '-sS', 10, 'S comme SYN', 1);

INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES
('nmap-q2', 'pentest-nmap-basics', 'Quelle commande permet de détecter la version des services ?', 'qcm', '["nmap -O target", "nmap -sV target", "nmap -sC target", "nmap -p- target"]', 'nmap -sV target', 10, 'V comme Version', 2);

INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES
('nmap-q3', 'pentest-nmap-basics', 'Quelle option permet de scanner TOUS les ports TCP ?', 'text', NULL, '-p-', 15, 'Deux tirets', 3);

INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES
('nmap-q4', 'pentest-nmap-basics', 'Combien de ports sont ouverts sur la cible du lab ?', 'text', NULL, '5', 15, 'Lancez le lab et scannez', 4);

INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES
('nmap-q5', 'pentest-nmap-basics', 'Trouvez le flag dans le code source Apache (port 80)', 'flag', NULL, 'FLAG{apache_found_80}', 20, 'curl et regardez le HTML', 5);

INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES
('nmap-q6', 'pentest-nmap-basics', 'Trouvez le flag dans /secret/flag.txt', 'flag', NULL, 'FLAG{hidden_directory_found}', 25, 'Accédez au répertoire secret', 6);

INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES
('nmap-q7', 'pentest-nmap-basics', 'Trouvez le flag sur Nginx (port 8080)', 'flag', NULL, 'FLAG{nginx_8080_secret}', 20, 'curl sur le bon port', 7);

INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES
('nmap-q8', 'pentest-nmap-basics', 'Trouvez le flag du service secret (port 9999)', 'flag', NULL, 'FLAG{secret_port_9999}', 30, 'Utilisez netcat', 8);

INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES
('nmap-q9', 'pentest-nmap-basics', 'Pourquoi le scan SYN est stealth ?', 'qcm', '["Plus rapide", "Ne complete pas la connexion TCP", "Utilise UDP", "Chiffre les paquets"]', 'Ne complete pas la connexion TCP', 10, 'Connexion incomplète', 9);

INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES
('nmap-q10', 'pentest-nmap-basics', 'Quel port standard utilise SSH ?', 'text', NULL, '22', 5, 'Port très connu', 10);
