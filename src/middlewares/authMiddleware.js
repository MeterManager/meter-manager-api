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

function checkRole(requiredRole) {
  return (req, res, next) => {
    console.log('=== Role Check Debug ===');
    console.log('Required role:', requiredRole);
    console.log('req.auth:', req.auth);
    
    const userRoles = req.auth?.payload?.['https://energy-api.local/roles'] || [];
    console.log('User roles found:', userRoles);
    console.log('Includes required role?', userRoles.includes(requiredRole));
    
    if (userRoles.includes(requiredRole)) {
      console.log('Access granted');
      return next();
    }
    
    console.log('Access denied');
    return res.status(403).json({ 
      message: 'Access denied. Missing role: ' + requiredRole,
      debug: { userRoles, requiredRole }
    });
  };
}

module.exports = { checkJwt, checkRole, logAuth };
