const PORT = 3000;
const express = require('express');
const morgan = require('morgan');
const server = express();
const { db } = require('./db');

server.use(morgan('dev'));
server.use(express.json());

const apiRouter = require('./api');
server.use('/api', apiRouter);

db.connect();

server.listen(PORT, () => {
	console.log('The server is up on port', PORT);
});
