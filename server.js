const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Configuração da conexão com o MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'admin', // ⚠️ COLOQUE AQUI SUA SENHA DO MYSQL WORKBENCH
    database: 'projeto_acustico_esp32'
});

// Testa a conexão
db.connect(err => {
    if (err) {
        console.error('Erro ao conectar no banco:', err);
        return;
    }
    console.log('✅ Conectado ao MySQL com sucesso!');
});

// Rota para o ESP32 salvar dados no banco
app.post('/api/leituras', (req, res) => {
    const { frequencia_hz, amplitude_db, detectou_ar } = req.body;
    
    // Inserindo dados na tabela que você criou
    const query = 'INSERT INTO leituras_acusticas (frequencia_hz, amplitude_db, detectou_ar, timestamp_leitura) VALUES (?, ?, ?, NOW())';
    
    db.query(query, [frequencia_hz, amplitude_db, detectou_ar], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao salvar no banco');
        }
        res.status(200).send('Leitura salva com sucesso!');
    });
});

// Rota para o seu HTML puxar os dados do banco
app.get('/api/leituras', (req, res) => {
    const query = 'SELECT * FROM leituras_acusticas ORDER BY timestamp_leitura DESC LIMIT 10';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao buscar dados');
        }
        res.json(results);
    });
});

// Liga o servidor
app.listen(3000, () => {
    console.log('🚀 Servidor rodando na porta 3000');
});