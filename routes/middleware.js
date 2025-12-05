const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

function authAdmin(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try{
    const data = jwt.verify(token, JWT_SECRET);
    if(data.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.admin = data;
    next();
  }catch(e){
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authAdmin };