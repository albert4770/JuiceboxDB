const {
	db,
	getAllUsers,
	createUser,
	updateUser,
	createPost,
	getAllPosts,
	createTags,
	getPostById,
	addTagsToPost,
	getPostsByUser
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
		await createPost({
			authorId: 1,
			title: 'First post ever',
			context: 'Hello worldly beings',
			tags: ['#sql', '#postgres']
		});

		await createPost({
			authorId: 1,
			title: 'Second post ever',
			context: 'Hello worldly beings',
			tags: ['#node', '#express']
		});

		await createPost({
			authorId: 1,
			title: 'Third post ever',
			context: 'Hello worldly beings',
			tags: ['#react', '#jquery', '#html']
		});
		// return rows;
	} catch (err) {
		throw ('Error @createPosts', err);
	}
};

async function createInitialTags() {
	try {
		console.log('Starting to create tags...');

		const [happy, sad, inspo, catman] = await createTags([
			'#happy',
			'#worst-day-ever',
			'#youcandoanything',
			'#catmandoeverything'
		]);

		const [postOne, postTwo, postThree] = await getAllPosts();
		// const posts = await getAllPosts();
		// console.log('Post one id: ', postOne.id);

		await addTagsToPost(postOne.id, [happy, inspo]);
		await addTagsToPost(postTwo.id, [sad, inspo]);
		await addTagsToPost(postThree.id, [happy, catman, inspo]);

		console.log('Finished creating tags!');
	} catch (error) {
		console.log('Error creating tags!');
		throw error;
	}
}

const dropTables = async () => {
	try {
		await db.query(`
			DROP TABLE IF EXISTS post_tags;
			DROP TABLE IF EXISTS tags; 
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
			active BOOLEAN DEFAULT true);
			
			CREATE TABLE tags(
			id SERIAL PRIMARY KEY,
			name varchar(255) UNIQUE NOT NULL);

			CREATE TABLE post_tags(
			"postId" INTEGER REFERENCES posts(id),
			"tagId" INTEGER REFERENCES tags(id),
			UNIQUE ("postId", "tagId")); 
			`);
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

		console.log('Getting posts by user');
		await getPostsByUser(1);

		// console.log('Getting post by id');
		// const post = getPostById(1);

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
