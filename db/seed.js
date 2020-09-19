const {
	db,
	getAllUsers,
	createUser,
	updateUser,
	createPost,
	getAllPosts
} = require('./index');

const createInitialUsers = async () => {
	try {
		console.log('Creating initial users');
		const users = await createUser({
			username: 'beto44',
			password: '1234',
			name: 'Albert',
			location: 'Honduras'
		});
		console.log('Users: ', users);

		console.log('Finished creating users');
	} catch (err) {
		throw err;
	}
};

const createInitialPosts = async () => {
	try {
		console.log('Creating initial posts');
		const { rows } = await createPost({
			authorId: 1,
			title: 'First post ever',
			context: 'Hello worldly beings'
		});
		return rows;
	} catch (err) {
		throw ('Error @createPosts', err);
	}
};

const dropTables = async () => {
	try {
		await db.query(`
			DROP TABLE IF EXISTS posts; 
			DROP TABLE IF EXISTS users;`);
	} catch (err) {
		throw err;
	}
};

const createTables = async () => {
	try {
		await db.query(`
			CREATE TABLE users(
			id SERIAL PRIMARY KEY,
			username varchar(255) UNIQUE NOT NULL, 
			password varchar(255) NOT NULL,
			name varchar(255) NOT NULL,
			location varchar(255) NOT NULL,
			active BOOLEAN DEFAULT TRUE);

			CREATE TABLE posts(
			id SERIAL PRIMARY KEY,
			"authorId" INTEGER REFERENCES users(id) NOT NULL,
			title varchar(255) NOT NULL,
			context TEXT NOT NULL,
			active BOOLEAN DEFAULT true);`);
	} catch (err) {
		throw err;
	}
};

const rebuildDB = async () => {
	try {
		db.connect();

		await dropTables();
		await createTables();
		await createInitialUsers();
		await createInitialPosts();
	} catch (err) {
		throw err;
	}
};

const testDB = async () => {
	try {
		console.log('Starting to test db!');
		const users = await getAllUsers();
		console.log('All users: ', users);

		console.log('Updating user[0]');
		const updatedUser = await updateUser(users[0].id, {
			name: 'Alberto Arriaga'
		});
		console.log(updatedUser);

		console.log('Getting all posts');
		const allPosts = await getAllPosts();
		console.log(allPosts);

		console.log('Finished testing db!');
	} catch (err) {
		console.log('Error bitch 2');
		throw err;
	}
};

rebuildDB()
	.then(testDB)
	.catch(console.error)
	.finally(() => db.end());
