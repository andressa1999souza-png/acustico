const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const ngrok = require('@ngrok/ngrok');

const app = express();
const PORT = 3000;

// ==========================================
// 1. MIDDLEWARES (Configurações de Segurança e JSON)
// ==========================================

// Configurado especificamente para permitir o seu frontend no Netlify
app.use(cors({
    origin: 'https://dashboard-acustico-andressa.netlify.app',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning'],
    credentials: true
}));

// Permite que o servidor entenda dados enviados no formato JSON
app.use(express.json());

// ==========================================
// 2. CONFIGURAÇÃO DO BANCO DE DADOS
// ==========================================
const db = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: 'admin',
    database: 'projeto_acustico_esp32',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Teste de conexão ao iniciar o servidor
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erro de conexão com o MySQL:', err);
        return;
    }
    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    connection.release(); // Libera a conexão de volta para o pool
});

// ==========================================
// 3. ROTAS DA API
// ==========================================

// Rota POST: Onde o ESP32 (ou site) manda os dados para salvar
app.post('/api/leituras', (req, res) => {
    const { frequencia_hz, amplitude_db, detectou_ar } = req.body;
    
    // Converte booleano (true/false) para 1 ou 0 pro MySQL (TinyInt)
    const statusAr = detectou_ar ? 1 : 0;

    const query = 'INSERT INTO leituras_acusticas (frequencia_hz, amplitude_db, detectou_ar, timestamp_leitura) VALUES (?, ?, ?, NOW())';
    
    db.query(query, [frequencia_hz, amplitude_db, statusAr], (err, result) => {
        if (err) {
            console.error('❌ Erro ao inserir no banco:', err);
            return res.status(500).json({ erro: 'Erro ao salvar no banco de dados' });
        }
        console.log(`💾 Dado gravado! Freq: ${frequencia_hz}Hz | Ar: ${detectou_ar}`);
        res.status(200).json({ mensagem: 'Salvo com sucesso!', id: result.insertId });
    });
});

// Rota GET: Onde o gráfico do site lê os dados para exibir
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
// 4. INICIALIZAÇÃO DO SERVIDOR E NGROK
// ==========================================
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`\n🚀 Servidor local rodando na porta ${PORT}`);

    try {
        // Inicia a sessão do ngrok
        const listener = await ngrok.forward({
            addr: PORT,
            authtoken: '3DJYLAmiywVqBngIwrpraPa9Bmn_3d7osbswjdjUAgfQmF8ck', 
            proto: 'http'
        });

        // Pega a URL pública gerada
        const urlPublica = listener.url();

        console.log(`\n======================================================`);
        console.log(`🔗 LINK PÚBLICO GERADO: ${urlPublica}`);
        console.log(`⚠️  Vá no seu arquivo HTML/JS do Netlify e use a URL assim:`);
        console.log(`   const API_URL = "${urlPublica}/api/leituras";`);
        console.log(`======================================================\n`);
        
    } catch (err) {
        console.error('❌ Erro crítico ao iniciar o ngrok:', err);
    }
});