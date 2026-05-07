const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ==========================================
// 1. MIDDLEWARES
// ==========================================
app.use(cors({
    origin: '*', // Permitir qualquer origem para facilitar o teste inicial na AWS
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// ==========================================
// 2. CONFIGURAÇÃO DO BANCO DE DADOS (AJUSTADO PARA AWS)
// ==========================================
const db = mysql.createPool({
    host: 'localhost',
    user: 'andressa', 
    password: 'SuaSenhaForte123', // Senha que definimos no passo anterior
    database: 'projeto_acustico', // Nome do banco que criamos na AWS
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erro de conexão com o MySQL na AWS:', err);
        return;
    }
    console.log('✅ Conexão com MySQL (projeto_acustico) estabelecida!');
    
    // CRIAR A TABELA CASO ELA NÃO EXISTA
    const sqlTable = `
        CREATE TABLE IF NOT EXISTS leituras_acusticas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            frequencia_hz FLOAT,
            amplitude_db FLOAT,
            detectou_ar TINYINT(1),
            timestamp_leitura DATETIME
        );
    `;
    connection.query(sqlTable, (err) => {
        if (err) console.error('❌ Erro ao criar tabela:', err);
        else console.log('📊 Tabela verificada/criada com sucesso!');
        connection.release();
    });
});

// ==========================================
// 3. ROTAS DA API
// ==========================================

app.post('/api/leituras', (req, res) => {
    const { frequencia_hz, amplitude_db, detectou_ar } = req.body;
    const statusAr = detectou_ar ? 1 : 0;
    const query = 'INSERT INTO leituras_acusticas (frequencia_hz, amplitude_db, detectou_ar, timestamp_leitura) VALUES (?, ?, ?, NOW())';
    
    db.query(query, [frequencia_hz, amplitude_db, statusAr], (err, result) => {
        if (err) {
            console.error('❌ Erro ao inserir no banco:', err);
            return res.status(500).json({ erro: 'Erro ao salvar no banco' });
        }
        res.status(200).json({ mensagem: 'Salvo com sucesso!', id: result.insertId });
    });
});

app.get('/api/leituras', (req, res) => {
    const query = 'SELECT * FROM leituras_acusticas ORDER BY id DESC LIMIT 10';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Erro ao buscar no banco:', err);
            return res.status(500).json({ erro: 'Erro ao buscar dados' });
        }
        res.status(200).json(results);
    });
});

// ==========================================
// 4. INICIALIZAÇÃO
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 SERVIDOR ONLINE NA AWS`);
    console.log(`📡 Porta: ${PORT}`);
    console.log(`🔗 Endpoint: http://SEU-IP-DA-AWS:3000/api/leituras`);
});