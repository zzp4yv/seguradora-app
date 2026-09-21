// Popula o banco da seguradora com os clientes do CRM (crm-seguros).
// Roda DENTRO do container seguradora-app (tem better-sqlite3 + este arquivo):
//   CRM_DB_PATH=/tmp/crm-seguros.db FORCE=1 node backend/seed_from_crm.js
// Segurança: se já houver clientes e FORCE != 1, aborta sem alterar nada.
const Database = require('better-sqlite3');
const { getDb, initDatabase } = require('./database');

const CRM_DB_PATH = process.env.CRM_DB_PATH || '/tmp/crm-seguros.db';
const FORCE = process.env.FORCE === '1';

const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];

const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre',
  'Salvador', 'Fortaleza', 'Brasília', 'Recife', 'Goiânia', 'Campinas', 'Belém'];
const estados = ['SP', 'RJ', 'MG', 'PR', 'RS', 'BA', 'CE', 'DF', 'PE', 'GO', 'SC', 'PA'];
const bairros = ['Centro', 'Jardim Primavera', 'Vila Nova', 'Bela Vista', 'Santa Cruz', 'Alto da Serra'];
const estadosCiveis = ['Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'União Estável'];
const profissoes = ['Engenheiro', 'Médico', 'Advogado', 'Professor', 'Contador', 'Analista de Sistemas',
  'Designer', 'Arquiteto', 'Jornalista', 'Enfermeiro', 'Comerciante', 'Motorista', 'Gerente', 'Consultor'];
const classesBonus = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const marcasFallback = ['Toyota', 'Volkswagen', 'Chevrolet', 'Honda', 'Hyundai', 'Fiat'];
const modelosFallback = { Toyota: ['Corolla', 'Hilux'], Volkswagen: ['Gol', 'Polo'], Chevrolet: ['Onix', 'Tracker'], Honda: ['Civic', 'HR-V'], Hyundai: ['HB20', 'Creta'], Fiat: ['Argo', 'Mobi'] };

function gerarRG() {
  return (rand(90000000) + 10000000) + '-' + rand(10);
}

function gerarChassi() {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < 17; i++) s += chars[rand(chars.length)];
  return s;
}

function gerarPlaca() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return letras[rand(letras.length)] + letras[rand(letras.length)] + letras[rand(letras.length)] + '-' + String(rand(10000)).padStart(4, '0');
}

function gerarDataNasc() {
  const a = 1960 + rand(45), m = String(rand(12) + 1).padStart(2, '0'), d = String(rand(28) + 1).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

function main() {
  console.log('🌱 Seed da seguradora a partir do CRM...');
  console.log(`📂 CRM_DB_PATH=${CRM_DB_PATH} FORCE=${FORCE ? 1 : 0}`);
  initDatabase();
  const db = getDb();

  const existing = db.prepare('SELECT COUNT(*) AS c FROM clientes').get().c;
  console.log(`👥 clientes existentes na seguradora: ${existing}`);
  if (existing > 0 && !FORCE) {
    console.log('⛔ ABORTADO: banco já possui dados. Rode com FORCE=1 para limpar e repopular.');
    process.exit(1);
  }

  const crm = new Database(CRM_DB_PATH, { readonly: true });
  const total = crm.prepare('SELECT COUNT(*) AS c FROM clients').get().c;
  console.log(`👥 clientes no CRM: ${total}`);
  if (total === 0) {
    console.log('⛔ ABORTADO: banco do CRM vazio.');
    process.exit(1);
  }

  const rows = crm.prepare(`
    SELECT c.full_name, c.cpf, c.email, c.phone,
           p.policy_number, p.vehicle_brand, p.vehicle_model, p.vehicle_year,
           p.plate, p.start_date, p.end_date, p.premium_value, p.deductible_value
    FROM clients c LEFT JOIN policies p ON p.client_id = c.id
    GROUP BY c.id ORDER BY c.id
  `).all();
  crm.close();

  if (FORCE) {
    db.exec('DELETE FROM apolices');
    db.exec('DELETE FROM clientes');
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('clientes', 'apolices')");
    console.log('🧹 banco limpo (FORCE=1)');
  }

  const insertCliente = db.prepare(
    'INSERT INTO clientes (nome, cpf, rg, data_nascimento, genero, cep, logradouro, numero, bairro, cidade, estado, telefone, celular, email, estado_civil, profissao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertApolice = db.prepare(
    'INSERT INTO apolices (cliente_id, numero_apose, marca, modelo, ano_veiculo, placa, chassi, data_inicio, data_fim, valor_premio, valor_franquia, classe_bonus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  let nCli = 0, nApo = 0;
  const start = Date.now();
  const tx = db.transaction((list) => {
    for (const r of list) {
      const genero = Math.random() > 0.5 ? 'M' : 'F';
      const idxCid = rand(cidades.length);
      const res = insertCliente.run(
        r.full_name, String(r.cpf).replace(/\D/g, ''), gerarRG(), gerarDataNasc(), genero,
        String(rand(90000000) + 10000000), `${pick(['Rua', 'Avenida', 'Travessa', 'Alameda'])} das Flores ${rand(2000) + 1}`,
        String(rand(2000) + 1), pick(bairros), cidades[idxCid], estados[idxCid % estados.length],
        r.phone || '', r.phone || '', r.email || '', pick(estadosCiveis), pick(profissoes)
      );
      nCli++;
      const marca = r.vehicle_brand || pick(marcasFallback);
      insertApolice.run(
        res.lastInsertRowid,
        r.policy_number || ('APE-' + (10000000000 + rand(90000000000))),
        marca,
        r.vehicle_model || pick(modelosFallback[marca] || ['Modelo A']),
        r.vehicle_year || (2015 + rand(10)),
        r.plate || gerarPlaca(),
        gerarChassi(),
        (r.start_date || '2024-01-01').slice(0, 10),
        (r.end_date || '2025-01-01').slice(0, 10),
        r.premium_value || parseFloat((Math.random() * 4000 + 500).toFixed(2)),
        r.deductible_value || parseFloat((Math.random() * 3000 + 500).toFixed(2)),
        pick(classesBonus)
      );
      nApo++;
      if (nCli % 200 === 0) console.log(`   ✓ ${nCli}/${list.length}...`);
    }
  });
  tx(rows);

  console.log('\n✅ Seed do CRM concluído!');
  console.log(`   Clientes:  ${nCli}`);
  console.log(`   Apólices:  ${nApo}`);
  console.log(`   Tempo:     ${((Date.now() - start) / 1000).toFixed(2)}s`);
  db.close();
}

main();
