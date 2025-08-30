const { auth } = require('express-oauth2-jwt-bearer');

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  tokenSigningAlg: 'RS256',
});

function logAuth(req, res, next) {
  console.log('Authorization header:', req.headers.authorization);
  console.log('Parsed auth info (req.auth):', req.auth);
  next();
}

function checkRole(role) {
  return (req, res, next) => {
    const userRoles = req.auth?.['https://energy-api.local/roles'] || [];
    if (userRoles.includes(role)) {
      next();
    } else {
      res.status(403).json({ message: 'access denied' });
    }
  };
}

module.exports = { checkJwt, checkRole, logAuth };