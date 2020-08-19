const jwt = require("jsonwebtoken");
const connection = require("../db/mysql_connection");

const auth = async (req, res, next) => {
  let token;
  try {
    token = req.header("Authorization");
    token = token.replace("Bearer ", "");
  } catch (e) {
    console.log("errno : 1" + e);
    res.status(401).json({ errno: 1, error: e });
    return;
  }

  let user_id;
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    user_id = decoded.user_id;
  } catch (e) {
    console.log("errno : 2" + e);
    res.status(401).json({ errno: 2, error: e });
    return;
  }

  let query =
    "select u.id, u.email, u.created_at, t.token \
                from okchungo_token as t \
                join okchungo_user as u \
                on t.user_id = u.id \
                where t.user_id = ? and t.token = ? ";
  let data = [user_id, token];

  try {
    [rows] = await connection.query(query, data);
    if (rows.length == 0) {
      console.log("errno : 3" + e);
      res.status(401).json({ errno: 3, error: e });
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
