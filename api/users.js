const express = require('express');
const jwt = require('jsonwebtoken');
const usersRouter = express.Router();
const { getAllUsers, getUserByUsername, createUser } = require('../db');
const { SECRET } = process.env;

usersRouter.use((req, res, next) => {
	console.log('Request being made to /users');
	// res.send({ message: 'hello from /users' });
	next();
});

usersRouter.get('/', async (req, res, next) => {
	const users = await getAllUsers();
	res.send({ users });
});

usersRouter.post('/login', async (req, res, next) => {
	const { username, password } = req.body;

	if (!username && !password) {
		next({
			name: 'Missing credentials',
			message: 'Please supply both usern and pass'
		});
	}

	try {
		const user = await getUserByUsername(username);

		if (user && user.password === password) {
			const token = jwt.sign(
				{ id: user.id, username: user.username },
				SECRET
			);

			res.send({ message: 'Youre logged in', token });
		} else {
			next({
				name: 'Incorrect Credentials',
				message: 'Username or password is incorrect'
			});
		}
	} catch (err) {
		next(err);
	}
});

usersRouter.post('/register', async (req, res, next) => {
	try {
		const { username, password, name, location } = req.body;

		const tryUser = await getUserByUsername(username);

		if (tryUser) {
			next({ name: 'Username error', message: 'User already exists' });
		}

		const user = await createUser({ username, password, name, location });

		const token = jwt.sign({ id: user.id, username }, SECRET, {
			expiresIn: '1w'
		});

		res.send({ message: 'Thank you for signing up', token });
	} catch ({ name, message }) {
		next({ name, message });
	}
});

module.exports = usersRouter;
