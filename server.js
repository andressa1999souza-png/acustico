const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const ngrok = require('@ngrok/ngrok'); // Nova biblioteca

const app = express();
app.use(express.json());
app.use(cors());

// Configuração do Banco de Dados
const db = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: 'admin',
    database: 'projeto_acustico_esp32',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erro no MySQL:', err);
        return;
    }
    console.log('✅ Pool de conexões MySQL pronto!');
    connection.release();
});

// Rotas da API
app.post('/api/leituras', (req, res) => {
    const { frequencia_hz, amplitude_db, detectou_ar } = req.body;
    const query = 'INSERT INTO leituras_acusticas (frequencia_hz, amplitude_db, detectou_ar, timestamp_leitura) VALUES (?, ?, ?, NOW())';
    db.query(query, [frequencia_hz, amplitude_db, detectou_ar], (err) => {
        if (err) return res.status(500).send('Erro ao salvar');
        res.status(200).send('Salvo!');
    });
});

app.get('/api/leituras', (req, res) => {
    const query = 'SELECT * FROM leituras_acusticas ORDER BY id DESC LIMIT 10';
    db.query(query, (err, results) => {
        if (err) return res.status(500).send('Erro ao buscar');
        res.json(results);
    });
});

// Iniciar Servidor e Ngrok JUNTOS
const PORT = 3000;
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Servidor local rodando na porta ${PORT}`);

    try {
        // Estabelece o túnel automaticamente ao iniciar
        const session = await ngrok.connect({
            addr: PORT,
            authtoken: '3DJYLAmiywVqBngIwrpraPa9Bmn_3d7osbswjdjUAgfQmF8ck' // Seu token
        });

        console.log(`\n🔗 LINK PARA O CELULAR/NETLIFY: ${session.url()}`);
        console.log(`⚠️ Copie o link acima e cole na NGROK_URL do seu index.html\n`);
    } catch (err) {
        console.error('❌ Erro ao iniciar o ngrok:', err);
    }
});