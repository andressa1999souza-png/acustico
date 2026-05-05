const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Configuração do Pool de conexões
const db = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: 'admin',
    database: 'projeto_acustico_esp32',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verificação simples para saber se o pool está acessível
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erro ao obter conexão do pool:', err);
        return;
    }
    console.log('✅ Pool de conexões MySQL pronto!');
    connection.release(); // Libera a conexão de teste de volta para o pool
});

// Rota para o ESP32 salvar dados
app.post('/api/leituras', (req, res) => {
    const { frequencia_hz, amplitude_db, detectou_ar } = req.body;
    
    const query = 'INSERT INTO leituras_acusticas (frequencia_hz, amplitude_db, detectou_ar, timestamp_leitura) VALUES (?, ?, ?, NOW())';
    
    // O pool.query gerencia a abertura e fechamento da conexão sozinho
    db.query(query, [frequencia_hz, amplitude_db, detectou_ar], (err, result) => {
        if (err) {
            console.error('Erro no INSERT:', err);
            return res.status(500).send('Erro ao salvar no banco');
        }
        res.status(200).send('Leitura salva com sucesso!');
    });
});

// Rota para o HTML puxar os dados
app.get('/api/leituras', (req, res) => {
    const query = 'SELECT * FROM leituras_acusticas ORDER BY id DESC LIMIT 10';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro no SELECT:', err);
            return res.status(500).send('Erro ao buscar dados');
        }
        res.json(results);
    });
});

app.listen(3000, '0.0.0.0', () => {
    console.log('🚀 Servidor rodando') ;
});