import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  console.log('→ authRequired: cookies:', req.cookies);

  const token = req.cookies.token;
  if (!token) {
    console.warn('→ authRequired: no token cookie, 401');
    return res.sendStatus(401);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log('→ authRequired: payload:', payload);
    req.user = { sub: payload.sub, role: payload.role };
    next();
  } catch (e) {
    console.error('→ authRequired: token invalid:', e.message);
    res.clearCookie('token');
    return res.sendStatus(401);
  }
}
