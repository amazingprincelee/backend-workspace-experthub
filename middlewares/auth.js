const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    console.log("Auth middleware: Incoming headers:", req.headers);

    const authHeader = req.headers.authorization;
    console.log("Auth middleware: authHeader:", authHeader);

    if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        console.log("Auth middleware: Extracted token:", token);
        
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.log("Auth middleware: JWT verification error:", err);
                return res.sendStatus(403);
            }
            console.log("Auth middleware: Verified user:", user);
            req.user = user;
            next();
        });
    } else {
        console.log("Auth middleware: No auth header present");
        res.sendStatus(401);
    }
};

module.exports = authenticate;
