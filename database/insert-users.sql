-- Créer le compte SuperAdmin
INSERT OR REPLACE INTO users (id, username, password_hash, display_name, email, role, is_active) VALUES
('user-superadmin', 'admin', '$2a$10$superadmin', 'Super Admin', 'admin@cyberhub.local', 'superadmin', 1);

-- Créer les comptes éditeurs
INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-mehdi', 'mehdi.morhaoui', '$2a$10$hash', 'Mehdi MORHAOUI', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-imed', 'imed.benzemmouri', '$2a$10$hash', 'Imed BENZEMMOURI', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-imadeddine', 'imadeddine.tallah', '$2a$10$hash', 'Imadeddine TALLAH', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-yasmine', 'yasmine.regragui', '$2a$10$hash', 'Yasmine REGRAGUI', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-fawaz', 'fawaz.alsaad', '$2a$10$hash', 'Fawaz AL SAAD', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-ethan', 'ethan.adato', '$2a$10$hash', 'Ethan ADATO', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-elliot', 'elliot.cardon', '$2a$10$hash', 'Elliot CARDON', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-laid', 'laid.fodil', '$2a$10$hash', 'Laïd FODIL', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-jennie', 'jennie.nkwedjan', '$2a$10$hash', 'Jennie NKWEDJAN', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-salimata', 'salimata.fomba', '$2a$10$hash', 'Salimata FOMBA', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-fabrice', 'fabrice.matongo', '$2a$10$hash', 'Fabrice MATONGO', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-dorice', 'dorice.tchamda', '$2a$10$hash', 'Dorice Linda TCHAMDA', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-souleymane', 'souleymane.coulibaly', '$2a$10$hash', 'Souleymane COULIBALY', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-henri', 'henri.dabenor', '$2a$10$hash', 'Henri DA BENOR', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-abdulaziz', 'abdulaziz.ouedraogo', '$2a$10$hash', 'Abdul-Aziz OUEDRAOGO', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-bovalus', 'bovalus.nougbodohoue', '$2a$10$hash', 'Bovalus NOUGBODOHOUE', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-chedi', 'chedi.benkhaled', '$2a$10$hash', 'Chedi BENKHALED', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-titouan', 'titouan.cornelouz', '$2a$10$hash', 'Titouan CORNELOUZ', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-stanislas', 'stanislas.faure', '$2a$10$hash', 'Stanislas FAURE', 'editor', 1, 'user-superadmin');

INSERT OR REPLACE INTO users (id, username, password_hash, display_name, role, is_active, created_by) VALUES
('user-korentin', 'korentin.jaffredo', '$2a$10$hash', 'Korentin JAFFREDO', 'editor', 1, 'user-superadmin');
