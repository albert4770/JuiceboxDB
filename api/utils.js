const requireUser = (req, res, next) => {
	if (!req.user) {
		next({ name: 'User error', message: 'You must be logged in' });
	}

	next();
};

module.exports = { requireUser };
