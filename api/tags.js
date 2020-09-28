const express = require('express');
const tagsRouter = express.Router();
const { getAllTags, getPostsByTagName } = require('../db');
const { requireUser } = require('./utils');

tagsRouter.get('/', async (req, res, next) => {
	const tags = await getAllTags();
	res.send(tags);
});

tagsRouter.get('/:tagName/posts', requireUser, async (req, res, next) => {
	const tagName = req.params.tagName;

	try {
		const posts = await getPostsByTagName(tagName);

		const activePosts = posts.filter(post => {
			return post.active;
		});

		res.send(activePosts);
	} catch ({ name, message }) {
		next({ name, message });
	}
});

module.exports = tagsRouter;
