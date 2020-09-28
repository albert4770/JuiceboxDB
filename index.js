const express = require('express');
const morgan = require('morgan');
const server = express();
const { db } = require('./db');
require('dotenv').config();

const { PORT } = process.env;

server.use(morgan('dev'));
server.use(express.json());

const { apiRouter } = require('./api');
server.use('/api', apiRouter);

db.connect();

server.listen(PORT, () => {
	console.log('The server is up on port', PORT);
});
