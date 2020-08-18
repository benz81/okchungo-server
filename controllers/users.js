const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const connection = require("../db/mysql_connection");
const { json } = require("express");

// @desc        회원가입 ------------------------------------------------------------------------
// @route       POST /api/v1/users
// @request     email, passwd
// @response    success, token
exports.createUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;
  let name = req.body.name;
  let graduation = req.body.graduation;

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
    "insert into okchungo_user (email, passwd, name, graduation) values(?,?,?,?)";
  let data = [email, hashedPasswd, name, graduation];

  let user_id;

  const conn = await connection.getConnection();
  await conn.beginTransaction(); // 트랜젝션 시작

  // 테이블에 인서트
  try {
    [result] = await conn.query(query, data);
    user_id = result.insertId;
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e });
    return;
  }

  const token = jwt.substring(
    { user_id: user_id },
    process.env.ACCESS_TOKEN_SECRET
  );
  query = "insert into okchungo_photo_token (user_id, token) values (?,?)";
  data = [user_id, token];
  console.log("토큰저장" + data);
  try {
    [result] = await conn.query(query, data);
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e });
    return;
  }
  await conn.commit(); // 트랜젝션 끝
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
  query = "insert into okchungo_photo_token (user_id, token) values (?,?)";
  data = [user_id, token];
  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true, token: token });
  } catch (e) {
    res.status(500).json();
  }
};
