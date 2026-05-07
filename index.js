require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const {Pool} = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME,
	port:5432,
});

function auth(req, res, next) {
	const header = req.headers['authorization'];
	if (!header) return res.status(401).json({ error: 'Token ausente' });
	const token = header.split(' ')[1];
	try {
		req.user = jwt.verify(token, process.env.JWT_SECRET);
		next();
	} catch {
		return res.status(401).json({ error: 'Token invalido' });
	}
}

app.post('/api/v1/auth/login', function(req, res) {
	const { username, password } = req.body;
	if (username === 'api_user' && password === 'senha123') {
		const token = jwt.sign ({ user: username}, process.env.JWT_SECRET, { expiresIn: '2h'});
		return res.json({ token });
	}
	return res.status(401).json({ error: 'Credenciais invalidas' });
});

app.get('/api/v1/clients', auth, async function(req, res) {
	const limit = req.query.limit || 10;
	const page = req.query.page || 1;
	const offset = (page - 1) * limit;
	try {
		const result = await pool.query(
			'SELECT * FROM clients LIMIT $1 OFFSET $2',
			[limit, offset]
		);

		console.log(new Date().toISOString() + ' GET /client ip=' + req.ip + ' returned=' + result.rows.length);

		res.json({
		clients: result.rows,
		page: Number(page),
		limit: Number(limit)
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Erro interno' });
	}
});

app.listen(3000, function() {
	console.log('Servidor rodando');
});
