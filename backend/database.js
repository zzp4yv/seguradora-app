const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../seguradora.db');
let db;

function getDb() {
    if (!db) {
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    }
    return db;
}

function initDatabase() {
    const database = getDb();
    
    database.exec(`
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            cpf TEXT UNIQUE NOT NULL,
            rg TEXT,
            data_nascimento TEXT,
            genero TEXT,
            cep TEXT,
            logradouro TEXT,
            numero TEXT,
            bairro TEXT,
            cidade TEXT,
            estado TEXT,
            telefone TEXT,
            celular TEXT,
            email TEXT,
            estado_civil TEXT,
            profissao TEXT,
            ativo INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS apolices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER NOT NULL,
            numero_apose TEXT UNIQUE NOT NULL,
            marca TEXT,
            modelo TEXT,
            ano_veiculo INTEGER,
            placa TEXT,
            chassi TEXT,
            data_inicio DATE,
            data_fim DATE,
            valor_premio REAL,
            valor_franquia REAL,
            classe_bonus TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
        CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
        CREATE INDEX IF NOT EXISTS idx_apolices_placa ON apolices(placa);
        CREATE INDEX IF NOT EXISTS idx_apolices_numero ON apolices(numero_apose);
    `);
}

module.exports = { getDb, initDatabase };
