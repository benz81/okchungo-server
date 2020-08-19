const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const connection = require("../db/mysql_connection");

// @desc        회원가입 ------------------------------------------------------------------------
// @route       POST /api/v1/users
// @request     email, passwd
// @response    success, token
exports.createUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;
  let name = req.body.name;
  let graduation = req.body.graduation;
  console.log("email" + email);
  console.log("passwd" + passwd);
  console.log("name" + name);
  console.log("graduation" + graduation);

  if (!email || !passwd || !name || !graduation) {
    res.status(400).json();
    return;
  }
  if (!validator.isEmail(email)) {
    res.status(400).json();
    return;
  }

  const hashedPasswd = await bcrypt.hash(passwd, 8);

  let query =
    "insert into okchungo_user (email, passwd, name, graduation) values (?,?,?,?)";
  let data = [email, hashedPasswd, name, graduation];
  console.log("data" + data);
  let user_id;

  const conn = await connection.getConnection();
  await conn.beginTransaction();

  // okchungo_user 테이블에 인서트.
  try {
    [result] = await conn.query(query, data);
    user_id = result.insertId;
    console.log("테이블에 result 인서트" + result);
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ errer: e });
    return;
  }

  const token = jwt.sign({ user_id: user_id }, process.env.ACCESS_TOKEN_SECRET);
  console.log("암호외 토큰 가져온다 " + token);
  query = "insert into okchungo_token (user_id, token) values (?,?)";
  data = [user_id, token];
  console.log(
    "암호와 토큰을 받아서" + "유저 아이디" + user_id + "암호 토큰" + data
  );

  try {
    [result] = await conn.query(query, data);
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ errer: e });
    return;
  }

  await conn.commit();
  await conn.release();
  res.status(200).json({ success: true, token: token });
};

// @desc     로그인------------------------------------------------------------------------------------------
// @route    POST /api/v1/users/login
// @request  email, passwd
// @response success, token
exports.loginUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;

  let query = "select * from okchungo_user where email = ? ";
  let data = [email];

  let user_id;

  try {
    [rows] = await connection.query(query, data);
    let hashedPasswd = rows[0].passwd;
    user_id = rows[0].id;
    const isMatch = await bcrypt.compare(passwd, hashedPasswd);
    if (isMatch == false) {
      res.status(401).json();
      return;
    }
  } catch (e) {
    res.status(500).json();
    return;
  }
  const token = jwt.sign({ user_id: user_id }, process.env.ACCESS_TOKEN_SECRET);
  query = "insert into okchungo_token (user_id, token) values (?,?)";
  data = [user_id, token];
  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true, token: token });
  } catch (e) {
    res.status(500).json();
  }
};
// @desc        로그아웃 (기기1대 로그아웃)--------------------------------------------------------------
// @route       POST /api/v1/users/logout
// @request     token(header), user_id(auth)
// @response    success

exports.logout = async (req, res, next) => {
  let user_id = req.user.id;
  let token = req.user.token;

  let query = "delete from okchungo_token where user_id = ? and token = ?";
  let data = [user_id, token];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json();
  }
};
