const auth_config = require('./../configs/auth_config');
const jwt = require('jsonwebtoken');
function verifyToken(req, res, next) {
	if (!req.headers.authorization) {
		return res.status(401).send({ "error": "Unauthorized request" });
	}
	var access_token = req.headers.authorization.split(' ')[1];
	if (!access_token) {
		return res.status(401).send({ "error": "Access token is empty" });
	}
	else {
		jwt.verify(access_token, auth_config.secret, (err, token) => {
			if (err) {
				return res.status(401).send({
					"error": err.message
				});
			}
			else {
				res.locals.userId = token.data;
				next();
			}
		});
	}

}


module.exports = verifyToken;