const express = require('express');
const apiRouter = express.Router();
const jwt = require('jsonwebtoken');
const { SECRET } = process.env;
const { getUserById } = require('../db');

const usersRouter = require('./users');
const postsRouter = require('./posts');
const tagsRouter = require('./tags');

apiRouter.use('/', async (req, res, next) => {
	const auth = req.header('authorization');

	if (!auth) {
		next();
	} else if (auth.startsWith('Bearer ')) {
		const token = auth.slice('Bearer '.length);

		try {
			const { id } = jwt.verify(token, SECRET);

			if (id) {
				req.user = await getUserById(id);
				next();
			}
		} catch ({ name, message }) {
			next({ name, message });
		}
	} else {
		next({
			name: 'Authorization Error',
			message: `Must contain 'Bearer '`
		});
	}
});

apiRouter.use((req, res, next) => {
	if (req.user) {
		console.log('User is set: ', req.user.id);
	}

	next();
});

apiRouter.use('/users', usersRouter);
apiRouter.use('/posts', postsRouter);
apiRouter.use('/tags', tagsRouter);

apiRouter.use((error, req, res, next) => {
	res.send(error);
});

module.exports = { apiRouter };
