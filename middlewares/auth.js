const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    console.log(req.headers);

    const authHeader = req.headers.authorization;
    if (authHeader) {
        // Extract token from "Bearer <token>" format
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401); // Unauthorized
    }
};

module.exports = authenticate;
