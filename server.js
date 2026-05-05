const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const ngrok = require('@ngrok/ngrok');

const app = express();

// Middlewares - IMPORTANTE: O CORS deve vir antes das rotas!
app.use(cors()); 
app.use(express.json());

// Configuração do Banco de Dados (Ajustado para o seu banco)
const db = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: 'admin',
    database: 'projeto_acustico_esp32',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Teste de conexão
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erro no MySQL:', err);
        return;
    }
    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    connection.release();
});

// --- Rotas da API ---

// Rota para SALVAR (Onde o botão do site clica)
app.post('/api/leituras', (req, res) => {
    const { frequencia_hz, amplitude_db, detectou_ar } = req.body;
    
    // Convertendo detectou_ar para 1 ou 0 para o MySQL (TinyInt)
    const statusAr = detectou_ar ? 1 : 0;

    const query = 'INSERT INTO leituras_acusticas (frequencia_hz, amplitude_db, detectou_ar, timestamp_leitura) VALUES (?, ?, ?, NOW())';
    
    db.query(query, [frequencia_hz, amplitude_db, statusAr], (err, result) => {
        if (err) {
            console.error('❌ Erro ao inserir:', err);
            return res.status(500).send('Erro ao salvar no banco');
        }
        console.log('💾 Dado gravado no banco!');
        res.status(200).json({ mensagem: 'Salvo com sucesso!', id: result.insertId });
    });
});

// Rota para BUSCAR (Onde o gráfico do site lê)
app.get('/api/leituras', (req, res) => {
    const query = 'SELECT * FROM leituras_acusticas ORDER BY id DESC LIMIT 10';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Erro ao buscar:', err);
            return res.status(500).send('Erro ao buscar dados');
        }
        res.json(results);
    });
});

// --- Iniciar Servidor e Ngrok ---
const PORT = 3000;

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Servidor local rodando na porta ${PORT}`);

    try {
        // Inicia a sessão do ngrok
        const listener = await ngrok.forward({
            addr: PORT,
            authtoken: '3DJYLAmiywVqBngIwrpraPa9Bmn_3d7osbswjdjUAgfQmF8ck',
            proto: 'http'
        });

        // Pega a URL pública gerada
        const urlPublica = listener.url();

        console.log(`\n🔗 LINK PÚBLICO: ${urlPublica}`);
        console.log(`⚠️  COPIE O LINK ACIMA E COLE NO SEU HTML EM: const API_URL = "${urlPublica}"\n`);
        
    } catch (err) {
        console.error('❌ Erro crítico ao iniciar o ngrok:', err);
    }
});