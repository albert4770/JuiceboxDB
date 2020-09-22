const express = require('express');
const usersRouter = express.Router();
const { getAllUsers } = require('../db');

usersRouter.use((req, res, next) => {
	console.log('Request being made to /users');
	// res.send({ message: 'hello from /users' });
	next();
});

usersRouter.get('/', async (req, res, next) => {
	const users = await getAllUsers();
	res.send({ users });
});

module.exports = usersRouter;
