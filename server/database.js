const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const path     = require('path');
const fs       = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'engelinhas.db');

const db = new Database(DB_PATH);

// Performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ══════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    senha_hash TEXT    NOT NULL,
    perfil     TEXT    NOT NULL DEFAULT 'Fiscal',
    empresa    TEXT    NOT NULL DEFAULT 'Engelinhas',
    ativo      INTEGER NOT NULL DEFAULT 1,
    criado_em  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS obras (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT    NOT NULL,
    uf          TEXT,
    fase        TEXT,
    criticidade TEXT,
    fiscal      TEXT,
    prazo       TEXT,
    progresso   INTEGER DEFAULT 0,
    status      TEXT    DEFAULT 'Ativa',
    obs         TEXT,
    criado_em   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS funcionarios (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula      TEXT    NOT NULL UNIQUE,
    nome           TEXT    NOT NULL,
    cargo          TEXT,
    empresa        TEXT,
    obra_id        INTEGER REFERENCES obras(id) ON DELETE SET NULL,
    status         TEXT    DEFAULT 'Ativo',
    admissao       TEXT,
    telefone       TEXT,
    email          TEXT,
    nrs_exigidas   TEXT    DEFAULT '[]',
    nrs_detalhes   TEXT    DEFAULT '{}',
    criado_em      TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS asos (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    funcionario_id   INTEGER REFERENCES funcionarios(id) ON DELETE CASCADE,
    nome_funcionario TEXT,
    matricula        TEXT,
    tipo             TEXT,
    resultado        TEXT,
    medico           TEXT,
    crm              TEXT,
    data_emissao     TEXT,
    validade         TEXT,
    obs              TEXT,
    criado_em        TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS atas (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo        TEXT    NOT NULL,
    obra_id       INTEGER REFERENCES obras(id) ON DELETE SET NULL,
    obra_nome     TEXT,
    data          TEXT,
    participantes TEXT,
    pauta         TEXT,
    deliberacoes  TEXT,
    acoes         TEXT,
    status        TEXT    DEFAULT 'Rascunho',
    criado_em     TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS documentos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo         TEXT    NOT NULL,
    titulo       TEXT    NOT NULL,
    subtipo      TEXT,
    obra_id      INTEGER REFERENCES obras(id) ON DELETE SET NULL,
    obra_nome    TEXT,
    responsavel  TEXT,
    data         TEXT,
    status       TEXT    DEFAULT 'Vigente',
    obs          TEXT,
    matricula    TEXT,
    nome_func    TEXT,
    ca           TEXT,
    criado_em    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS arquivos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    entidade     TEXT    NOT NULL,
    entidade_id  INTEGER NOT NULL,
    nome_orig    TEXT    NOT NULL,
    nome_salvo   TEXT    NOT NULL,
    mime         TEXT,
    tamanho      INTEGER,
    criado_em    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );
`);

// ══════════════════════════════════════════════════
// SEED — usuário admin padrão
// ══════════════════════════════════════════════════
const adminEmail = 'guilherme@engelinhas.com.br';
const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(adminEmail);
if (!existe) {
  const hash = bcrypt.hashSync('Engelinhas2017*', 10);
  db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil, empresa)
    VALUES (?, ?, ?, 'Admin', 'Engelinhas')
  `).run('Guilherme Diniz', adminEmail, hash);
  console.log('[DB] Usuário admin criado:', adminEmail);
}

module.exports = db;
