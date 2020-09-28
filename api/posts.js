const express = require('express');
const postsRouter = express.Router();
const { getAllPosts, getPostById, createPost, updatePost } = require('../db');
const { requireUser } = require('../api/utils');

postsRouter.get('/', async (req, res, next) => {
	const posts = await getAllPosts();

	const activePosts = posts.filter(post => {
		return post.active;
	});

	res.send({ activePosts });
});

postsRouter.post('/', requireUser, async (req, res, next) => {
	const { title, content, tags = '' } = req.body;

	const tagArray = tags.trim().split(/\s+/);

	console.log('Tag Array', tagArray);
	postData = {};

	if (tagArray.length) {
		postData.tags = tagArray;
	}

	try {
		postData.title = title;
		postData.content = content;
		postData.authorId = req.user.id;

		const post = await createPost(postData);

		if (post) {
			res.send({ message: 'Post created!', post });
		} else {
			next({
				name: 'Post error',
				message: 'Message could not be created'
			});
		}
	} catch ({ name, message }) {
		next({ name, message });
	}
});

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
	const { postId } = req.params;
	const { title, content, tags } = req.body;

	const updateFields = {};

	if (tags && tags.length > 0) {
		updateFields.tags = tags.trim().split(/\s+/);
	}

	if (title) {
		updateFields.title = title;
	}

	if (content) {
		updateFields.content = content;
	}

	try {
		const existingPost = await getPostById(postId);

		if (existingPost.author.id === req.user.id) {
			console.log('Ids match');
			const updatedPost = await updatePost(postId, updateFields);
			res.send({
				message: 'Post updated succesfully',
				post: updatedPost
			});
		} else {
			next({
				name: 'User error',
				message: 'Cannot update post not created by user'
			});
		}
	} catch ({ name, message }) {
		next({ name, message });
		throw { name, message };
	}
});

postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
	const postId = req.params.postId;

	try {
		const post = await getPostById(postId);

		if (!post) {
			throw {
				name: 'PostNotFoundError',
				message: 'Could not find a post with that postId'
			};
		}

		if (post.author.id === req.user.id) {
			const inactivePost = await updatePost(postId, { active: false });
			res.send({ post: inactivePost });
		} else {
			next(
				post
					? {
							name: 'Unauthorized',
							message: 'Cant delete post that isnt yours'
					  }
					: { name: 'Post not found', message: 'Post does not exist' }
			);
		}
	} catch ({ name, message }) {
		next({ name, message });
	}
});

module.exports = postsRouter;
