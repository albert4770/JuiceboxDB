const { Client } = require('pg');

const db = new Client('postgres://localhost:5432/juicebox-dev');

// User functions
const createUser = async ({ username, password, name, location }) => {
	try {
		const {
			rows
		} = await db.query(
			`INSERT INTO users(username, password, name, location) VALUES($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING RETURNING *;`,
			[username, password, name, location]
		);
		return rows;
	} catch (err) {
		throw err;
	}
};

const getAllUsers = async () => {
	const { rows } = await db.query(
		`SELECT id, username, name, location FROM users;`
	);

	return rows;
};

const getUserById = async userId => {
	try {
		const { rows } = await db.query(
			`SELECT * FROM users WHERE id=${userId}`
		);

		if (!rows) {
			return null;
		}

		delete rows.password;
		rows.posts = getPostsByUser(userId);
		return rows;
	} catch (err) {
		throw err;
	}
};

const updateUser = async (id, fields = {}) => {
	const setString = Object.keys(fields)
		.map((key, index) => {
			return `"${key}"=$${index + 1}`;
		})
		.join(', ');

	if (setString.length === 0) {
		return;
	}

	try {
		const {
			rows: [user]
		} = await db.query(
			`UPDATE users SET ${setString} WHERE id=${id} RETURNING *;`,
			Object.values(fields)
		);
		return user;
	} catch (err) {
		throw err + 'Error Bitch 1';
	}
};

// Post functions
const createPost = async ({ authorId, title, context, tags = [] }) => {
	try {
		const {
			rows: [post]
		} = await db.query(
			`INSERT INTO posts("authorId", title, context) VALUES($1, $2, $3) RETURNING *;`,
			[authorId, title, context]
		);

		const tagList = await createTags(tags);

		return await addTagsToPost(post.id, tagList);
	} catch (err) {
		throw err;
	}
};

const getAllPosts = async () => {
	try {
		const { rows: postIds } = await db.query(`
		  SELECT id
		  FROM posts;
		`);

		const posts = await Promise.all(
			postIds.map(post => getPostById(post.id))
		);

		return posts;
	} catch (error) {
		throw error;
	}
};

const updatePost = async (id, { title, context, active }) => {
	try {
		const setString = Object.keys({ title, context, active })
			.map((key, index) => {
				return `"${key}=$${index + 1}"`;
			})
			.join(', ');

		if (setString === 0) {
			return;
		}

		const { rows } = await db.query(
			`UPDATE posts SET ${setString} WHERE id=${id} RETURNING *`
		);
		return rows;
	} catch (err) {
		throw err;
	}
};

const getPostById = async postId => {
	try {
		const {
			rows: [post]
		} = await db.query(
			`
		  SELECT *
		  FROM posts
		  WHERE id=$1;
		`,
			[postId]
		);
		const { rows: tags } = await db.query(
			`
		  SELECT tags.*
		  FROM tags
		  JOIN post_tags ON tags.id=post_tags."tagId"
		  WHERE post_tags."postId"=$1;
		`,
			[postId]
		);
		const {
			rows: [author]
		} = await db.query(
			`
		  SELECT id, username, name, location
		  FROM users
		  WHERE id=$1;
		`,
			[post.authorId]
		);
		post.tags = tags;
		post.author = author;
		delete post.authorId;
		return post;
	} catch (error) {
		throw error;
	}
};

const getPostsByUser = async userId => {
	try {
		const { rows: postIds } = await db.query(
			`SELECT id FROM posts WHERE "authorId"=${userId};`
		);

		const posts = await Promise.all(
			postIds.map(post => getPostById(post.id))
		);

		return posts;
	} catch (error) {
		throw error;
	}
};

// Tag functions
const createTags = async tagList => {
	if (tagList.length === 0) {
		return;
	}

	const insertQueryString = tagList
		.map((tag, index) => `($${index + 1})`)
		.join(', ');

	const queryString = tagList.map((tag, index) => `$${index + 1}`).join(', ');

	try {
		await db.query(
			`INSERT INTO tags(name) VALUES ${insertQueryString} ON CONFLICT (name) DO NOTHING;`,
			tagList
		);

		const { rows } = await db.query(
			`SELECT * FROM tags WHERE name IN (${queryString});`,
			tagList
		);

		// console.log(rows);
		return rows;
	} catch (err) {
		throw err;
	}
};

const createPostTag = async (postId, tagId) => {
	try {
		await db.query(
			`INSERT INTO post_tags("postId", "tagId") VALUES ($1, $2);`,
			[postId, tagId]
		);
	} catch (err) {
		throw err;
	}
};

const addTagsToPost = async (postId, tagList) => {
	try {
		const tagPromises = tagList.map(tag => createPostTag(postId, tag.id));

		await Promise.all(tagPromises);

		return await getPostById(postId);
	} catch (err) {
		throw err;
	}
};

module.exports = {
	db,
	getAllUsers,
	createUser,
	updateUser,
	createPost,
	updatePost,
	getAllPosts,
	getPostsByUser,
	getUserById,
	createTags,
	getPostById,
	addTagsToPost
};
