require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir os arquivos estáticos do frontend (index.html, script.js, style.css)
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// CONEXÃO COM O MONGODB
// -------------------------------------------------------------
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ifap_refeicoes';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Conectado ao MongoDB com sucesso!'))
    .catch((erro) => console.error('❌ Erro ao conectar ao MongoDB:', erro));

// -------------------------------------------------------------
// MODELO DO BANCO DE DADOS (SCHEMA)
// -------------------------------------------------------------
// Armazena o estado global da aplicação (cardápios e agendamentos)
const SistemaSchema = new mongoose.Schema({
    chave: { type: String, default: 'dados_sistema', unique: true },
    cardapios: { type: Object, required: true },
    agendamentos: { type: Array, default: [] }
}, { timestamps: true });

const Sistema = mongoose.model('Sistema', SistemaSchema);

// -------------------------------------------------------------
// ROTAS DA API QUE O FRONTEND CONSOME
// -------------------------------------------------------------

// 1. GET /api/dados -> Carrega o estado salvo no banco
app.get('/api/dados', async (req, res) => {
    try {
        let registro = await Sistema.findOne({ chave: 'dados_sistema' });

        // Se o banco ainda estiver vazio, retorna estruturas padrão vazias
        if (!registro) {
            return res.json({ cardapios: {}, agendamentos: [] });
        }

        return res.json({
            cardapios: registro.cardapios,
            agendamentos: registro.agendamentos
        });
    } catch (erro) {
        console.error('Erro na rota GET /api/dados:', erro);
        return res.status(500).json({ erro: 'Erro ao buscar dados do servidor.' });
    }
});

// 2. POST /api/dados -> Atualiza ou salva o estado no banco
app.post('/api/dados', async (req, res) => {
    try {
        const { cardapios, agendamentos } = req.body;

        if (!cardapios) {
            return res.status(400).json({ erro: 'O payload de cardápios é obrigatório.' });
        }

        // Atualiza o documento existente ou cria um novo caso não exista
        const registroAtualizado = await Sistema.findOneAndUpdate(
            { chave: 'dados_sistema' },
            { cardapios, agendamentos: agendamentos || [] },
            { new: true, upsert: true }
        );

        return res.status(200).json({
            mensagem: 'Dados salvos com sucesso no MongoDB!',
            dados: registroAtualizado
        });
    } catch (erro) {
        console.error('Erro na rota POST /api/dados:', erro);
        return res.status(500).json({ erro: 'Erro ao salvar dados no servidor.' });
    }
});

// -------------------------------------------------------------
// INICIALIZAÇÃO DO SERVIDOR
// -------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Acesse no navegador: http://localhost:${PORT}`);
});