-- =============================================
-- CYBERHUB - DONNÉES INITIALES UTILISATEURS
-- SuperAdmin + Éditeurs
-- =============================================

-- Créer le compte SuperAdmin
-- Mot de passe: CyberAdmin@2024!
INSERT OR REPLACE INTO users (id, username, password_hash, display_name, email, role, is_active) VALUES
('user-superadmin', 'admin', '$2a$10$superadmin_hash_placeholder', 'Super Admin', 'admin@cyberhub.local', 'superadmin', 1);

-- Créer les comptes éditeurs (équipe dev)
INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-mehdi', 'mehdi.morhaoui', '$2a$10$hash_mehdi', 'Mehdi MORHAOUI', 'editor', 1, 'user-superadmin'),
('user-imed', 'imed.benzemmouri', '$2a$10$hash_imed', 'Imed BENZEMMOURI', 'editor', 1, 'user-superadmin'),
('user-imadeddine', 'imadeddine.tallah', '$2a$10$hash_imadeddine', 'Imadeddine TALLAH', 'editor', 1, 'user-superadmin'),
('user-yasmine', 'yasmine.regragui', '$2a$10$hash_yasmine', 'Yasmine REGRAGUI', 'editor', 1, 'user-superadmin'),
('user-fawaz', 'fawaz.alsaad', '$2a$10$hash_fawaz', 'Fawaz AL SAAD', 'editor', 1, 'user-superadmin'),
('user-ethan', 'ethan.adato', '$2a$10$hash_ethan', 'Ethan ADATO', 'editor', 1, 'user-superadmin'),
('user-elliot', 'elliot.cardon', '$2a$10$hash_elliot', 'Elliot CARDON', 'editor', 1, 'user-superadmin'),
('user-laid', 'laid.fodil', '$2a$10$hash_laid', 'Laïd FODIL', 'editor', 1, 'user-superadmin'),
('user-jennie', 'jennie.nkwedjan', '$2a$10$hash_jennie', 'Jennie NKWEDJAN', 'editor', 1, 'user-superadmin'),
('user-salimata', 'salimata.fomba', '$2a$10$hash_salimata', 'Salimata FOMBA', 'editor', 1, 'user-superadmin'),
('user-fabrice', 'fabrice.matongo', '$2a$10$hash_fabrice', 'Fabrice MATONGO', 'editor', 1, 'user-superadmin'),
('user-dorice', 'dorice.tchamda', '$2a$10$hash_dorice', 'Dorice Linda TCHAMDA', 'editor', 1, 'user-superadmin'),
('user-souleymane', 'souleymane.coulibaly', '$2a$10$hash_souleymane', 'Souleymane COULIBALY', 'editor', 1, 'user-superadmin'),
('user-henri', 'henri.dabenor', '$2a$10$hash_henri', 'Henri DA BENOR MARCELLIN', 'editor', 1, 'user-superadmin'),
('user-abdulaziz', 'abdulaziz.ouedraogo', '$2a$10$hash_abdulaziz', 'Abdul-Aziz OUEDRAOGO', 'editor', 1, 'user-superadmin'),
('user-bovalus', 'bovalus.nougbodohoue', '$2a$10$hash_bovalus', 'Bovalus NOUGBODOHOUE', 'editor', 1, 'user-superadmin'),
('user-chedi', 'chedi.benkhaled', '$2a$10$hash_chedi', 'Chedi BENKHALED', 'editor', 1, 'user-superadmin'),
('user-titouan', 'titouan.cornelouz', '$2a$10$hash_titouan', 'Titouan CORNELOUZ', 'editor', 1, 'user-superadmin'),
('user-stanislas', 'stanislas.faure', '$2a$10$hash_stanislas', 'Stanislas FAURE', 'editor', 1, 'user-superadmin'),
('user-korentin', 'korentin.jaffredo', '$2a$10$hash_korentin', 'Korentin JAFFREDO', 'editor', 1, 'user-superadmin');
