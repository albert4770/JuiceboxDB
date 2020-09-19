const { Client } = require('pg');

const db = new Client('postgres://localhost:5432/juicebox-dev');

const getAllUsers = async () => {
	const { rows } = await db.query(
		`SELECT id, username, name, location FROM users;`
	);

	return rows; };

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

const createPost = async ({ authorId, title, context }) => {
	try {
		const {
			rows
		} = await db.query(
			`INSERT INTO posts("authorId", title, context) VALUES($1, $2, $3) RETURNING *;`,
			[authorId, title, context]
		);
		return rows;
	} catch (err) {
		throw err;
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

const getAllPosts = async () => {
	try {
		const { rows } = await db.query(
			`SELECT id, "authorId", title, context FROM posts`
		);
		return rows;
	} catch (err) {
		throw err;
	}
};

const getPostsByUser = async userId => {
	try {
		const { rows } = await db.query(
			`SELECT * FROM posts WHERE authorId=${userId}`
		);
		return rows;
	} catch (err) {
		throw err;
	}
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

module.exports = {
	db,
	getAllUsers,
	createUser,
	updateUser,
	createPost,
	updatePost,
	getAllPosts,
	getPostsByUser,
	getUserById
};
