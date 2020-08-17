const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const connection = require("../db/mysql_connection");

// @desc        회원가입 ------------------------------------------------------------------------
// @route       POST /api/v1/users
// @request     email, passwd
// @response    success, token
exports.createUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;

  if (!email || !passwd) {
    res.status(400).json();
    return;
  }
  if (!validator.isEmail(email)) {
    res.status(400).json();
    return;
  }

  const hashedPasswd = await bcrypt.hash(passwd, 8);

  let query = "insert into okchungo_user (email, passwd) values(?,?)";
  let data = [email, hashedPasswd];

  let user_id;
  // 테이블에 인서트
  try {
    [result] = await connection.query(query, data);
    user_id = result.insertId;
  } catch (e) {
    res.status(500).json({ error: e });
    return;
  }

  const token = jwt.sign({ user_id: user_id }, process.env.ACCESS_TOKEN_SECRET);

  query = "insert into okchungo_photo_token (user_id, token) values (?,?)";
  data = [user_id, token];

  try {
    [result] = await connection.query(query, data);
  } catch (e) {
    res.status(500).json({ errpr: e });
    return;
  }

  res.status(200).json({ success: true, token: token });
};
