const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ==========================================
// 1. MIDDLEWARES
// ==========================================
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// ==========================================
// 2. CONFIGURAÇÃO DO BANCO DE DADOS
// ==========================================
const db = mysql.createPool({
    host: 'localhost',
    user: 'andressa', 
    password: 'SuaSenhaForte123', // Mantenha a senha que você configurou no MySQL
    database: 'projeto_acustico_esp32', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Testar conexão e criar tabela inicial
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erro de conexão com o MySQL:', err.message);
        return;
    }
    console.log('✅ Conexão com MySQL estabelecida!');
    
    const sqlTable = `
        CREATE TABLE IF NOT EXISTS leituras_acusticas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            frequencia_hz FLOAT,
            amplitude_db FLOAT,
            detectou_ar TINYINT(1),
            timestamp_leitura DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    connection.query(sqlTable, (err) => {
        connection.release(); // Sempre solte a conexão após o uso
        if (err) console.error('❌ Erro ao verificar/criar tabela:', err);
        else console.log('📊 Tabela de monitoramento acústico pronta!');
    });
});

// ==========================================
// 3. ROTAS DA API
// ==========================================

// Rota para o ESP32 enviar dados
app.post('/api/leituras', (req, res) => {
    const { frequencia_hz, amplitude_db, detectou_ar } = req.body;
    
    // Garante que o valor seja 0 ou 1 para o MySQL
    const statusAr = (detectou_ar === true || detectou_ar === 1) ? 1 : 0;
    
    const query = 'INSERT INTO leituras_acusticas (frequencia_hz, amplitude_db, detectou_ar, timestamp_leitura) VALUES (?, ?, ?, NOW())';
    
    db.query(query, [frequencia_hz, amplitude_db, statusAr], (err, result) => {
        if (err) {
            console.error('❌ Erve ao inserir dados:', err);
            return res.status(500).json({ erro: 'Erro interno ao salvar' });
        }
        res.status(200).json({ mensagem: 'Dados recebidos!', id: result.insertId });
    });
});

// Rota para o Front-end buscar os últimos dados
app.get('/api/leituras', (req, res) => {
    const query = 'SELECT * FROM leituras_acusticas ORDER BY id DESC LIMIT 20';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Erro ao buscar dados:', err);
            return res.status(500).json({ erro: 'Erro ao buscar no banco' });
        }
        res.status(200).json(results);
    });
});

// ==========================================
// 4. INICIALIZAÇÃO
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 API ACÚSTICA ONLINE`);
    console.log(`📡 Porta: ${PORT}`);
    console.log(`🔗 Endpoint para o ESP32: http://seu-ip-da-aws:3000/api/leituras`);
});