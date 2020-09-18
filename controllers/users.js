const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const ErrorResponse = require("../utils/errorResponse.js");
const chalk = require("chalk");
const sendEmail = require("../utils/sendemail.js");

const connection = require("../db/mysql_connection");

// @desc        회원가입 ------------------------------------------------------------------회원가입---------------------------------------
// @route       POST /api/v1/users
// @request     email, passwd,name,graduation
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

// @desc     로그인---------------------------------------------------------------------------------로그인-----------------------------------
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
// @desc        로그아웃 (기기1대 로그아웃)-----------------------------------------------------------로그아웃 1기기 ----------------------
// @route       DELETE /api/v1/users/logout
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

// @desc        전체 기기에서 모두 로그아웃 하기 --------------------------------------------------------모든 기기 로그아웃-----------------------------------
// @route       DELETE/api/v1/users/logoutAll
// @request     token(header), user_id(auth)
// @response    success
exports.logoutAll = async (req, res, next) => {
  let token = req.user.token;
  let user_id = req.user.id;

  let query = `delete from okchungo_token where user_id = ${user_id} and not token ="${token}" `;

  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true, result: result });
    return;
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};

// @desc  내 정보 가져오는 API -----------------------------------------------------------------------내정보 가져오기----------------------------------
// @url   GET /apt/v1/users/me
// @request
// @response  id, email, created_at
exports.myInfo = (req, res, next) => {
  // 인증 토큰 검증 통과해서 이 함수로 온다.
  let userInfo = req.user;

  res.status(200).json(userInfo);
};

// @desc  내 정보 (회원정보 )가져오는 API -----------------------------------------------------------------------회원 정보 가져오기----------------------------------
// @url   GET /apt/v1/users
// @request
// @response  id, email, created_at
exports.getMyInfo = (req, res, next) => {
  // 인증 토큰 검증 통과해서 이 함수로 온다.
  let getuserInfo = req.user;

  res.status(200).json(userInfo);
};

// @desc    유저의 프로필 사진 설정하는 API ------------------------------------------------------------프로필 사진 설정---------------------------------
// @route   PUT /api/v1/users/me/photo
// @request photo
// @response  success
// 클라이언트가 사진을 보낸다. => 서버가 이 사진을 받는다. = >
// 서버가 이사진을 디렉토리에 저장한다. => 이 사진의 파일명을 DB에 저장한다.

exports.userPhotoUpload = async (req, res, next) => {
  let user_id = req.user.id;
  if (!user_id || !req.files) {
    res.status(400).json();
    return;
  }
  console.log(req.files);

  const photo = req.files.photo;
  // 지금 받은 파일이, 이미지 파일인지 체크.
  if (photo.mimetype.startsWith("image") == false) {
    res.status(400).json({ message: "이미지 파일이 아닙니다." });
    return;
  }

  if (photo.size > process.env.MAX_FILE_SIZE) {
    res.status(400).json({ message: "파일크기가 정해진것보다 큽니다." });
    return;
  }
  // fall.jpg  => photo_3.jpg
  // abc.png   => photo_3.png
  photo.name = `photo_${user_id}${path.parse(photo.name).ext}`;

  // 저장할 경로 셋팅 : ./public/upload/photo_3.jpg
  let fileUploadPath = `${process.env.FILE_UPLOAD_PATH}/${photo.name}`;

  // 파일을 우리가 지정한 경로에 저장.
  photo.mv(fileUploadPath, async (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  // db에 이 파일이름을 업데이트 한다.
  let query = "update okchungo_user set photo_url = ? where id = ? ";
  let data = [photo.name, user_id];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json();
  }
};

// {
//   photo: {
//     name: 'fall.jpg',
//     data: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 00 00 01 00 01 00 00 ff db 00 84 00 08 08 08 08 09 08 09 0a 0a 09 0d 0e 0c 0e 0d 13 12 10 10 12 13 1d 15 16 15 ... 1619565 more bytes>,
//     size: 1619615,
//     encoding: '7bit',
//     tempFilePath: '',
//     truncated: false,
//     mimetype: 'image/jpeg',
//     md5: '30fb7544a4c8400608908ec25fe666f3',
//     mv: [Function: mv]
//   }

// @desc    패스워드 변경 --------------------------------------------------------------------------패스워드 변경------------------------------------
// @route   POST /api/v1/users/change
// @parameters  email, passwd, new_passwd
exports.changePasswd = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;
  let new_passwd = req.body.new_passwd;

  // 이 유저가, 맞는 유저인지 체크
  let query = "select passwd from okchungo_user where email = ?";
  let data = [email];

  try {
    [rows] = await connection.query(query, data);
    let savedPasswd = rows[0].passwd;

    let isMatch = await bcrypt.compareSync(passwd, savedPasswd);
    // let isMatch = bcrypt.compareSync(passwd, savedPasswd);

    if (isMatch != true) {
      res.status(401).json({ success: false, result: isMatch });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }

  query = "update okchungo_user set passwd = ? where email = ? ";
  const hashedPasswd = await bcrypt.hash(new_passwd, 8);
  data = [hashedPasswd, email];

  try {
    [result] = await connection.query(query, data);
    if (result.affectedRows == 1) {
      res.status(200).json({ success: true });
    } else {
      res.status(200).json({ success: false });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};

// @desc    패스워드 분실/리셋 요청--------------------------------------------------------------------패스워드 분실------------------------------------------
// 1. 클라이언트가 패스워드 분실했다고 서버한테 요청
// 서버가 패스워드를 변경할 수 있는 url을 클라이언트한테 보내준다.
// (경로에 암호화된 문자열을 보내준다. 토큰 역할임.)
// @route   POST /api/v1/users/forgotpasswd
exports.forgotPasswd = async (req, res, next) => {
  let user = req.user;

  // 리셋 토큰 설정
  // 암호화된 문자열 만드는 방법
  // const resetToken = crypto.randomBytes(20).toString("hex");
  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetPasswdToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // DB에 리셋 패스워드 토큰 저장 : 유저 테이블에 reset_passwd_token 컬럼에 저장.
  let query = `update okchungo_user set reset_passwd_token = '${resetPasswdToken}' where id = ${user.id}`;

  try {
    [result] = await connection.query(query);
    user.reset_passwd_token = resetPasswdToken;
    res.status(200).json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};

// 2. 클라이언트는 해당 암호화된 주소를 받아서, 새로운 비밀번호를 함께 서버로 보낸다.
// 서버는 이 주소가 진짜 유효한지 확인해서, 새로운 비밀번호로 셋팅한다.

// @desc    비번 초기화(reset password) api : 리셋 패스워드 토큰을 경로로 만들어서 바꿀 비번과 함께 요청
// @route   POST /api/v1/users/resetpasswd/:resetPasswdToken
// @req     resetPasswdToken, passwd
exports.resetPasswd = async (req, res, next) => {
  const resetPasswdToken = req.params.resetPasswdToken;
  const user_id = req.user.id;

  let query = `select * from okchungo_user where id = ${user_id}`;

  try {
    [rows] = await connection.query(query);
    savedResetPasswdToken = rows[0].reset_passwd_token;

    if (savedResetPasswdToken !== resetPasswdToken) {
      res.status(400).json({ success: false });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }

  let passwd = req.body.passwd; // 유저에게 새 비밀번호를 입력받음
  const hashedPasswd = await bcrypt.hash(passwd, 8); // 비밀번호를 암호화

  // 기존 암호를 변경한 암호로 업데이트 & 리셋 패스워드 토큰 초기화(삭제)
  query = `update okchungo_user set passwd = '${hashedPasswd}', reset_passwd_token = '' where id = ${user_id}`;

  delete req.user.reset_passwd_token;

  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true, data: req.user });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};

// 회원탈퇴 : db에서 해당 회원의 유저 테이블 정보 삭제 ------------------------------------------------------회원탈퇴-----------------------------------------
// => 유저 정보가 있는 다른 테이블도 정보 삭제.
// @desc  회원탈퇴 :  유저 테이블에서 삭제, 토큰 테이블에서 삭제
// @route DELETE  /api/v1/users

exports.deleteUser = async (req, res, next) => {
  let user_id = req.user.id;
  let query = `delete from okchungo_user where id = ${user_id}`;
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();
    // 첫번째 테이블에서 정보 삭제
    [result] = await conn.query(query);
    // 두번째 테이블에서 정보 삭제
    query = `delete from okchungo_token where user_id = ${user_id}`;
    [result] = await conn.query(query);

    await conn.commit();
    res.status(200).json({ success: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ success: false, error: e });
  } finally {
    await conn.release();
  }
};
