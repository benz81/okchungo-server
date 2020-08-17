const jwt = require("jsonwebtoken");
const connection = require("../db/mysql_connection");

const auth = async (req, res, next) => {
  let token;
  try {
    token = req.header("Authorization");
    token = token.replace("Bearer ", "");
  } catch (e) {
    res.status(401).json();
    return;
  }

  let user_id;
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    user_id = decoded.user_id;
  } catch (e) {
    res.status(401).json();
    return;
  }

  let query =
    "select u.id, u.email, u.created_at, t.token \
                from okchungo_photo_token as t \
                join okchungo_photo_user as u \
                on t.user_id = u.id \
                where t.user_id = ? and t.token = ? ";
  let data = [user_id, token];

  try {
    [rows] = await connection.query(query, data);
    if (rows.length == 0) {
      res.status(401).json();
      return;
    } else {
      req.user = rows[0];
      next();
    }
  } catch (e) {
    res.status(500).json({ error: e });
    return;
  }
};

module.exports = auth;
