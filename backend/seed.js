const { getDb, initDatabase } = require('./database');

const prenomesMasculinos = [
    'Carlos', 'Jose', 'Pedro', 'Joao', 'Marcos', 'Antonio', 'Fernando', 'Ricardo', 'Paulo', 'Roberto',
    'Lucas', 'Rafael', 'Gabriel', 'Bruno', 'Diego', 'Thiago', 'Luciano', 'Eduardo', 'Felipe', 'Gustavo',
    'Alejandro', 'Miguel', 'Daniel', 'Andre', 'Vinicius', 'Matheus', 'Bernardo', 'Lauro', 'Murilo', 'Henrique'
];

const prenomesFemininos = [
    'Maria', 'Ana', 'Julia', 'Fernanda', 'Patricia', 'Carolina', 'Amanda', 'Beatriz', 'Camila', 'Larissa',
    'Gabriela', 'Rafaela', 'Bruna', 'Leticia', 'Vanessa', 'Tatiane', 'Priscila', 'Cristina', 'Claudia',
    'Isabella', 'Sofia', 'Valentina', 'Helena', 'Lara', 'Manuela', 'Luisa', 'Alice', 'Sara', 'Mariana'
];

const sobrenomes = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
    'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
    'Rodriguez', 'Nascimento', 'Andrade', 'Dias', 'Freitas', 'Arruda', 'Nunes', 'Marques', 'Machado', 'Rezende'
];

const cidades = [
    'Sao Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Fortaleza',
    'Brasilia', 'Manaus', 'Recife', 'Goiania', 'Campinas', 'Florianopolis', 'Vitoria', 'Guarulhos',
    'Sao Luis', 'Maceio', 'Campo Grande', 'Cuiaba', 'Palmas', 'Belem', 'Santos', 'Ribeirao Preto',
    'Uberlandia', 'Sao Jose dos Campos', 'Sorocaba', 'Aracaju', 'Sao Joao de Meriti'
];

const estados = ['SP', 'RJ', 'MG', 'PR', 'RS', 'BA', 'CE', 'DF', 'AM', 'PE', 'GO', 'SC', 'ES', 'MA', 'PA', 'SE', 'MS', 'MT', 'TO'];

const logradouros = ['Rua', 'Avenida', 'Av.', 'Travessa', 'Alameda', 'Praça', 'Rodovia', 'Estrada'];

const marcas = ['Toyota', 'Volkswagen', 'Ford', 'Chevrolet', 'Honda', 'Hyundai', 'Nissan', 'Jeep', 'Fiat', 'Renault',
    'BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Peugeot', 'Citroen', 'Mitsubishi', 'Kia', 'Ferrari', 'Porsche'];

const modelosPorMarca = {
    'Toyota': ['Corolla', 'Hilux', 'SW4', 'Yaris', 'RAV4', 'Etios', 'C-HR'],
    'Volkswagen': ['Gol', 'Polo', 'T-Cross', 'Nivus', 'Jetta', 'Tiguan', 'Amarok'],
    'Ford': ['Ka', 'Focus', 'Ranger', 'Ecosport', 'F-150', 'Bronco'],
    'Chevrolet': ['Onix', 'Tracker', 'Cruze', 'S10', 'Spin', 'Equinox'],
    'Honda': ['Civic', 'HR-V', 'CR-V', 'Fit', 'Accord', 'WRX'],
    'Hyundai': ['HB20', 'Creta', 'Tucson', 'Santa Fe', 'Azera'],
    'Nissan': ['Versa', 'Kicks', 'Sentra', 'X-Trail', 'Navara'],
    'Jeep': ['Compass', 'Cherokee', 'Renegade', 'Gladiator', 'Grand Cherokee'],
    'Fiat': ['Argo', 'Cronos', 'Toro', 'Mobi', 'Pulse', '500'],
    'Renault': ['Sandero', 'Duster', 'Kwid', 'Captur', 'Logan'],
    'BMW': ['320i', 'X1', 'X3', 'X5', 'Z4', 'M4'],
    'Mercedes-Benz': ['A180', 'GLA', 'GLC', 'GLE', 'C180'],
    'Audi': ['A3', 'Q3', 'Q5', 'Q7', 'A4'],
    'Volvo': ['XC40', 'XC60', 'XC90', 'S60'],
    'Peugeot': ['208', '2008', '308', '3008', '5008'],
    'Citroen': ['C3', 'C4', 'C5 Aircross'],
    'Mitsubishi': ['L200', 'Eclipse Cross', 'Outlander', 'Pajero'],
    'Kia': ['Picanto', 'Sportage', 'Seltos', 'Cerato'],
    'Ferrari': ['F8 Tributo', 'Roma', '296 GTB', 'SF90'],
    'Porsche': ['Cayenne', 'Macan', 'Panamera', '911']
};

const estadosCiveis = ['Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'União Estável'];

const profissoes = [
    'Engenheiro', 'Medico', 'Advogado', 'Professor', 'Contador', 'Administrador', 'Analista de Sistemas',
    'Designer', 'Arquiteto', 'Psicologo', 'Jornalista', 'Enfermeiro', 'Farmaceutico', 'Dentista', 'Veterinario',
    'Policia Federal', 'Bombeiro', 'Delegado', 'Juiz', 'Procurador', 'Servidor Publico',
    'Comerciario', 'Motorista', 'Eletricista', 'Encanador', 'Serralheiro', 'Mecanico', 'Pintor',
    'Costureiro', 'Cozinheiro', 'Barbeiro', 'Cabeleireiro', 'Tecnico em Informatica',
    'Desenvolvedor', 'Gerente', 'Diretor', 'Consultor', 'Assistente Administrativo'
];

const classesBonus = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Classe 1', 'Classe 2', 'Classe 3', 'Classe 4', 'Classe 5', 'Classe 6', 'Classe 7', 'Classe 8', 'Classe 9', 'Classe 10'];

const rand = (n) => Math.floor(Math.random() * n);

function gerarCPF() {
    const base = Array.from({length: 9}, () => rand(10));

    const calcDigito = (b, weights) => {
        const soma = b.reduce((acc, val, i) => acc + val * weights[i], 0);
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    const digito1 = calcDigito(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    const base10 = [...base, digito1];
    const digito2 = calcDigito(base10, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);

    return base10.concat(digito2).join('');
}

function gerarRG() {
    return (rand(90000000) + 10000000) + '-' + rand(10);
}

function gerarChassi() {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let chassi = '';
    for (let i = 0; i < 17; i++) {
        chassi += chars[rand(chars.length)];
    }
    return chassi;
}

function gerarNumeroApose() {
    return 'APE-' + (10000000000 + rand(90000000000));
}

function gerarPlaca() {
    const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    return letras[rand(letras.length)] + letras[rand(letras.length)] + letras[rand(letras.length)] + '-' + String(rand(10000)).padStart(4, '0');
}

function gerarCep() {
    return String(rand(90000000) + 10000000);
}

function gerarDataInicio() {
    const ano = 2024 + rand(2);
    const mes = rand(12) + 1;
    const dia = rand(28) + 1;
    return ano + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
}

function gerarDataFim(dataInicio) {
    const inicio = new Date(dataInicio);
    inicio.setFullYear(inicio.getFullYear() + 1);
    return inicio.toISOString().split('T')[0];
}

function gerarPremio() {
    return parseFloat((Math.random() * 4000 + 500).toFixed(2));
}

function gerarFranquia() {
    return parseFloat((Math.random() * 3000 + 500).toFixed(2));
}

function gerarAnoVeiculo() {
    return 2015 + rand(10);
}

function gerarTelefone() {
    const ddd = rand(60) + 11;
    return '(' + ddd + ') 9' + String(rand(90000000) + 10000000).slice(0, 8);
}

function gerarCidadeEstado() {
    const idx = rand(cidades.length);
    return { cidade: cidades[idx], estado: estados[idx] };
}

function gerarCliente() {
    const genero = Math.random() > 0.5 ? 'M' : 'F';
    const prenome = genero === 'M'
        ? prenomesMasculinos[rand(prenomesMasculinos.length)]
        : prenomesFemininos[rand(prenomesFemininos.length)];

    const sobrenome = sobrenomes[rand(sobrenomes.length)];

    const nome = prenome + ' ' + sobrenome;
    const cpf = gerarCPF();
    const { cidade, estado } = gerarCidadeEstado();
    const logradouroTipo = logradouros[rand(logradouros.length)];
    const logradouroNome = 'dos ' + (genero === 'M' ? 'Palmares' : 'Olivais') + ' ' + rand(1000);
    const anoNasc = 1960 + rand(50);
    const mesNasc = rand(12) + 1;
    const diaNasc = rand(28) + 1;

    const cliente = {
        nome: nome,
        cpf: cpf,
        rg: gerarRG(),
        data_nascimento: anoNasc + '-' + String(mesNasc).padStart(2, '0') + '-' + String(diaNasc).padStart(2, '0'),
        genero: genero,
        cep: gerarCep(),
        logradouro: logradouroTipo + ' ' + logradouroNome,
        numero: rand(2000) + 1,
        bairro: ['Centro', 'Jardim', 'Vila', 'Bairro Novo', 'Distrito', 'Regiao'][rand(6)],
        cidade: cidade,
        estado: estado,
        telefone: gerarTelefone(),
        celular: gerarTelefone(),
        email: prenome.toLowerCase() + '.' + sobrenome.toLowerCase() + rand(100) + '@email.com.br',
        estado_civil: estadosCiveis[rand(estadosCiveis.length)],
        profissao: profissoes[rand(profissoes.length)]
    };

    const marca = marcas[rand(marcas.length)];
    const modelos = modelosPorMarca[marca] || ['Modelo A', 'Modelo B'];
    const modelo = modelos[rand(modelos.length)];
    const anoVeiculo = gerarAnoVeiculo();
    const dataInicio = gerarDataInicio();

    const apose = {
        cliente_id: null,
        numero_apose: gerarNumeroApose(),
        marca: marca,
        modelo: modelo,
        ano_veiculo: anoVeiculo,
        placa: gerarPlaca(),
        chassi: gerarChassi(),
        data_inicio: dataInicio,
        data_fim: gerarDataFim(dataInicio),
        valor_premio: gerarPremio(),
        valor_franquia: gerarFranquia(),
        classe_bonus: classesBonus[rand(classesBonus.length)]
    };

    return { cliente, apose };
}

function seed() {
    console.log('Iniciando popolamento do banco de datos...');
    initDatabase();
    const db = getDb();

    const TOTAL_REGISTROS = 1000;

    db.transaction(() => {
        db.exec('DELETE FROM apolices');
        db.exec('DELETE FROM clientes');
        db.exec("DELETE FROM sqlite_sequence WHERE name IN ('clientes', 'apolices')");
    })();

    const insertCliente = db.prepare(
        'INSERT INTO clientes (nome, cpf, rg, data_nascimento, genero, cep, logradouro, numero, bairro, cidade, estado, telefone, celular, email, estado_civil, profissao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const batchSize = 100;
    let totalInsertados = 0;
    const start = Date.now();

    db.transaction(() => {
        for (let i = 0; i < TOTAL_REGISTROS; i++) {
            const { cliente, apose } = gerarCliente();

            const clienteResult = insertCliente.run(
                cliente.nome, cliente.cpf, cliente.rg, cliente.data_nascimento, cliente.genero,
                cliente.cep, cliente.logradouro, cliente.numero, cliente.bairro,
                cliente.cidade, cliente.estado, cliente.telefone, cliente.celular,
                cliente.email, cliente.estado_civil, cliente.profissao
            );

            db.prepare(
                'INSERT INTO apolices (cliente_id, numero_apose, marca, modelo, ano_veiculo, placa, chassi, data_inicio, data_fim, valor_premio, valor_franquia, classe_bonus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).run(
                clienteResult.lastInsertRowid,
                apose.numero_apose, apose.marca, apose.modelo, apose.ano_veiculo,
                apose.placa, apose.chassi, apose.data_inicio, apose.data_fim,
                apose.valor_premio, apose.valor_franquia, apose.classe_bonus
            );

            totalInsertados++;
            if (totalInsertados % 100 === 0) {
                console.log('  Processados ' + totalInsertados + ' de ' + TOTAL_REGISTROS + '...');
            }
        }
    })();

    console.log('\nPopulacion completa!');
    console.log('Total de clientes inseridos: ' + TOTAL_REGISTROS);
    console.log('Tempo total: ' + ((Date.now() - start) / 1000).toFixed(2) + 's');
}

seed();
