const { Client } = require('pg');

const db = new Client(
	process.env.DATABASE_URL || 'postgres://localhost:5432/juicebox-dev'
);

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

const getUserByUsername = async username => {
	try {
		const {
			rows: [user]
		} = await db.query(`SELECT * from users WHERE username = $1`, [
			username
		]);
		return user;
	} catch (err) {
		err;
	}
};

const getUserById = async userId => {
	try {
		const {
			rows: [user]
		} = await db.query(`SELECT * FROM users WHERE id=${userId}`);

		if (!user) {
			return null;
		}

		user.posts = await getPostsByUser(userId);
		return user;
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
const createPost = async postData => {
	const { authorId, title, content, tags } = postData;

	try {
		const {
			rows: [post]
		} = await db.query(
			`INSERT INTO posts("authorId", title, content) VALUES($1, $2, $3) RETURNING *;`,
			[authorId, title, content]
		);
		const createdTags = await createTags(tags);

		return await addTagsToPost(post.id, createdTags);
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

const updatePost = async (postId, fields = {}) => {
	// read off the tags & remove that field
	const { tags } = fields; // might be undefined
	delete fields.tags;

	// build the set string
	const setString = Object.keys(fields)
		.map((key, index) => `"${key}"=$${index + 1}`)
		.join(', ');

	try {
		// update any fields that need to be updated
		if (setString.length > 0) {
			await db.query(
				`UPDATE posts SET ${setString} WHERE id=${postId} RETURNING *;`,
				Object.values(fields)
			);
		}

		// return early if there's no tags to update
		if (tags === undefined) {
			return await getPostById(postId);
		}

		// make any new tags that need to be made
		const tagList = await createTags(tags);
		const tagListIdString = tagList.map(tag => `${tag.id}`).join(', ');

		// delete any post_tags from the database which aren't in that tagList
		await db.query(
			`DELETE FROM post_tags WHERE "tagId" NOT IN (${tagListIdString}) AND "postId"=$1;`,
			[postId]
		);

		// and create post_tags as necessary
		await addTagsToPost(postId, tagList);

		return await getPostById(postId);
	} catch (error) {
		throw error;
	}
};

const getPostById = async postId => {
	try {
		const {
			rows: [post]
		} = await db.query(
			`SELECT *
		FROM posts
		WHERE id=$1;`,
			[postId]
		);

		if (!post) {
			return;
		}

		const { rows: tags } = await db.query(
			`SELECT tags.*
		FROM tags
		JOIN post_tags ON tags.id=post_tags."tagId"
		WHERE post_tags."postId"=$1;`,
			[postId]
		);
		const {
			rows: [author]
		} = await db.query(
			`SELECT id, username, name, location
		FROM users
		WHERE id=$1;`,
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

const getPostsByTagName = async tagName => {
	try {
		const { rows: postIds } = await db.query(
			`
      SELECT posts.id
      FROM posts
      JOIN post_tags ON posts.id=post_tags."postId"
      JOIN tags ON tags.id=post_tags."tagId"
      WHERE tags.name=$1;
    `,
			[tagName]
		);

		return await Promise.all(postIds.map(post => getPostById(post.id)));
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

const getAllTags = async () => {
	try {
		const { rows } = await db.query(`SELECT * FROM tags`);
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
	getUserByUsername,
	createUser,
	updateUser,
	createPost,
	updatePost,
	getAllPosts,
	getPostsByUser,
	getPostsByTagName,
	getUserById,
	createTags,
	getPostById,
	addTagsToPost,
	getAllTags
};
