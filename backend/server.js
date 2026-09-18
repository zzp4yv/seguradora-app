const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { getDb, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX = 100;

function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now - record.start > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { start: now, count: 1 });
        return next();
    }

    record.count++;
    if (record.count > RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta de novo máis tarde.' });
    }
    next();
}

app.use(rateLimiter);
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; img-src 'self' data:;");
    next();
});

// ============== HELPER FUNCTIONS ==============

function sanitizeInput(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>&'"]/g, (char) => {
        const escape = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' };
        return escape[char];
    });
}

function validateCPF(cpf) {
    if (!cpf || typeof cpf !== 'string') return false;
    const cleaned = cpf.replace(/[^\d]/g, '');
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(cleaned[9]) !== digit1) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(cleaned[10]) !== digit2) return false;

    return true;
}

function validateEmail(email) {
    if (!email || typeof email !== 'string') return true;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateField(name, value, required) {
    if (required && (!value || (typeof value === 'string' && !value.trim()))) {
        return `O campo "${name}" é obrigatorio.`;
    }
    if (name === 'cpf' && value) {
        if (!validateCPF(value)) return `Formato de CPF incorrecto para o campo "${name}".`;
    }
    if (name === 'email' && value && !validateEmail(value)) return `Formato de email incorrecto para o campo "${name}".`;
    return null;
}

// ============== CLIENT ROUTES ==============

// List clients (with pagination and search)
app.get('/api/clientes', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.pageSize) || parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    const validLimit = Math.min(Math.max(limit, 1), 100);
    const validPage = Math.max(page, 1);
    const searchParam = `%${search}%`;
    const db = getDb();

    try {
        const clientes = db.prepare(`
            SELECT c.*, a.numero_apose AS numero_apose, a.marca, a.modelo, a.ano_veiculo, 
                   a.placa, a.chassi, a.data_inicio, a.data_fim, a.valor_premio, 
                   a.valor_franquia, a.classe_bonus
            FROM clientes c
            LEFT JOIN apolices a ON c.id = a.cliente_id
            WHERE c.nome LIKE ? OR c.cpf LIKE ? OR a.placa LIKE ?
            LIMIT ? OFFSET ?
        `).all(searchParam, searchParam, searchParam, validLimit, offset);

        const totalResult = db.prepare(`
            SELECT COUNT(DISTINCT c.id) as total FROM clientes c
            LEFT JOIN apolices a ON c.id = a.cliente_id
            WHERE c.nome LIKE ? OR c.cpf LIKE ? OR a.placa LIKE ?
        `).get(searchParam, searchParam, searchParam);
        const total = totalResult.total;

        res.json({
            data: clientes,
            pagination: {
                page: validPage,
                limit: validLimit,
                total,
                totalPages: Math.ceil(total / validLimit)
            }
        });
    } catch (err) {
        console.error('List clients error:', err);
        res.status(500).json({ error: 'Erro ao listar clientes' });
    }
});

// Get client by ID
app.get('/api/clientes/:id', (req, res) => {
    const db = getDb();
    try {
        const cliente = db.prepare(`
            SELECT c.*, a.numero_apose AS numero_apose, a.marca, a.modelo, a.ano_veiculo, 
                   a.placa, a.chassi, a.data_inicio, a.data_fim, a.valor_premio, 
                   a.valor_franquia, a.classe_bonus
            FROM clientes c
            LEFT JOIN apolices a ON c.id = a.cliente_id
            WHERE c.id = ?
        `).get(req.params.id);

        if (!cliente) {
            return res.status(404).json({ error: 'Cliente non atopado' });
        }
        res.json(cliente);
    } catch (err) {
        console.error('Get client error:', err);
        res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
});

// Create client with policy
app.post('/api/clientes', (req, res) => {
    const { nome, cpf, rg, data_nascimento, genero, cep, logradouro, numero, bairro, cidade, estado,
            telefone, celular, email, estado_civil, profissao,
            numero_apose, marca, modelo, ano_veiculo, placa, chassi,
            data_inicio, data_fim, valor_premio, valor_franquia, classe_bonus } = req.body;

    const errors = [];
    errors.push(validateField('nome', nome, true));
    errors.push(validateField('cpf', cpf, true));
    errors.push(validateField('email', email, false));
    if (cpf) errors.push(validateCPF(cpf) ? null : 'Formato de CPF incorrecto');
    if (email && email.trim()) errors.push(validateEmail(email) ? null : 'Formato de email incorrecto');

    const filteredErrors = errors.filter(Boolean);
    if (filteredErrors.length > 0) {
        return res.status(400).json({ error: filteredErrors[0] });
    }

    const db = getDb();
    try {
        const clientResult = db.transaction(() => {
            const clienteId = db.prepare(`
                INSERT INTO clientes (nome, cpf, rg, data_nascimento, genero, cep, logradouro, numero, bairro, cidade, estado,
                                     telefone, celular, email, estado_civil, profissao)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                sanitizeInput(nome), sanitizeInput(cpf), sanitizeInput(rg),
                data_nascimento, genero, sanitizeInput(cep), sanitizeInput(logradouro),
                sanitizeInput(numero), sanitizeInput(bairro), sanitizeInput(cidade),
                sanitizeInput(estado), telefone, celular, sanitizeInput(email),
                sanitizeInput(estado_civil), sanitizeInput(profissao)
            );

            if (numero_apose) {
                db.prepare(`
                    INSERT INTO apolices (cliente_id, numero_apose, marca, modelo, ano_veiculo, placa, chassi,
                                         data_inicio, data_fim, valor_premio, valor_franquia, classe_bonus)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    clienteId.lastInsertRowid,
                    sanitizeInput(numero_apose), sanitizeInput(marca), sanitizeInput(modelo),
                    ano_veiculo ? parseInt(ano_veiculo) : null, sanitizeInput(placa),
                    sanitizeInput(chassi), data_inicio, data_fim,
                    valor_premio ? parseFloat(valor_premio) : null,
                    valor_franquia ? parseFloat(valor_franquia) : null,
                    sanitizeInput(classe_bonus)
                );
            }

            return clienteId.lastInsertRowid;
        })();

        res.status(201).json({ id: clientResult, message: 'Cliente cadastrado con éxito' });
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'O CPF ou número de póliza xa existe' });
        }
        console.error('Create client error:', err);
        res.status(500).json({ error: 'Erro ao crear cliente' });
    }
});

// Update client
app.put('/api/clientes/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { nome, cpf, rg, data_nascimento, genero, cep, logradouro, numero, bairro, cidade, estado,
            telefone, celular, email, estado_civil, profissao,
            numero_apose, marca, modelo, ano_veiculo, placa, chassi,
            data_inicio, data_fim, valor_premio, valor_franquia, classe_bonus } = req.body;

    const errors = [];
    errors.push(validateField('nome', nome, true));
    errors.push(validateField('cpf', cpf, true));
    errors.push(validateField('email', email, false));
    if (cpf) errors.push(validateCPF(cpf) ? null : 'Formato de CPF incorrecto');
    if (email && email.trim()) errors.push(validateEmail(email) ? null : 'Formato de email incorrecto');

    const filteredErrors = errors.filter(Boolean);
    if (filteredErrors.length > 0) {
        return res.status(400).json({ error: filteredErrors[0] });
    }

    try {
        const exists = db.prepare('SELECT id FROM clientes WHERE id = ?').get(id);
        if (!exists) {
            return res.status(404).json({ error: 'Cliente non atopado' });
        }

        db.prepare(`
            UPDATE clientes SET nome=?, cpf=?, rg=?, data_nascimento=?, genero=?, cep=?, logradouro=?,
                               numero=?, bairro=?, cidade=?, estado=?, telefone=?, celular=?,
                               email=?, estado_civil=?, profissao=?
            WHERE id=?
        `).run(
            sanitizeInput(nome), sanitizeInput(cpf), sanitizeInput(rg),
            data_nascimento, genero, sanitizeInput(cep), sanitizeInput(logradouro),
            sanitizeInput(numero), sanitizeInput(bairro), sanitizeInput(cidade),
            sanitizeInput(estado), telefone, celular, sanitizeInput(email),
            sanitizeInput(estado_civil), sanitizeInput(profissao), id
        );

        if (numero_apose) {
            const existsApose = db.prepare('SELECT id FROM apolices WHERE cliente_id = ?').get(id);
            if (existsApose) {
                db.prepare(`
                    UPDATE apolices SET numero_apose=?, marca=?, modelo=?, ano_veiculo=?, placa=?, chassi=?,
                                       data_inicio=?, data_fim=?, valor_premio=?, valor_franquia=?, classe_bonus=?
                    WHERE cliente_id=?
                `).run(
                    sanitizeInput(numero_apose), sanitizeInput(marca), sanitizeInput(modelo),
                    ano_veiculo ? parseInt(ano_veiculo) : null, sanitizeInput(placa),
                    sanitizeInput(chassi), data_inicio, data_fim,
                    valor_premio ? parseFloat(valor_premio) : null,
                    valor_franquia ? parseFloat(valor_franquia) : null,
                    sanitizeInput(classe_bonus), id
                );
            } else {
                db.prepare(`
                    INSERT INTO apolices (cliente_id, numero_apose, marca, modelo, ano_veiculo, placa, chassi,
                                         data_inicio, data_fim, valor_premio, valor_franquia, classe_bonus)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    id, sanitizeInput(numero_apose), sanitizeInput(marca), sanitizeInput(modelo),
                    ano_veiculo ? parseInt(ano_veiculo) : null, sanitizeInput(placa),
                    sanitizeInput(chassi), data_inicio, data_fim,
                    valor_premio ? parseFloat(valor_premio) : null,
                    valor_franquia ? parseFloat(valor_franquia) : null,
                    sanitizeInput(classe_bonus)
                );
            }
        }

        res.json({ message: 'Cliente actualizado con éxito' });
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'O CPF ou número de póliza xa existe' });
        }
        console.error('Update client error:', err);
        res.status(500).json({ error: 'Erro ao actualizar cliente' });
    }
});

// Soft delete client
app.delete('/api/clientes/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;

    try {
        const exists = db.prepare('SELECT id FROM clientes WHERE id = ?').get(id);
        if (!exists) {
            return res.status(404).json({ error: 'Cliente non atopado' });
        }

        db.prepare('UPDATE clientes SET ativo = 0 WHERE id = ?').run(id);
        res.json({ message: 'Cliente eliminado con éxito' });
    } catch (err) {
        console.error('Delete client error:', err);
        res.status(500).json({ error: 'Erro ao eliminar cliente' });
    }
});

// Statistics
app.get('/api/stats', (req, res) => {
    const db = getDb();
    try {
        const totalClientes = db.prepare('SELECT COUNT(*) as total FROM clientes WHERE ativo = 1').get();
        const totalApos = db.prepare('SELECT COUNT(*) as total FROM apolices').get();
        const premioMedio = db.prepare('SELECT AVG(valor_premio) as media FROM apolices').get();
        const totalPremios = db.prepare('SELECT SUM(valor_premio) as total FROM apolices').get();

        res.json({
            totalClientes: totalClientes.total,
            totalApos: totalApos.total,
            premioMedio: parseFloat((premioMedio.media || 0).toFixed(2)),
            totalPremios: parseFloat((totalPremios.total || 0).toFixed(2))
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
});

// Initialize database and start server
initDatabase();

app.listen(PORT, () => {
    console.log(`Servidor executándose en http://localhost:${PORT}`);
});
