const connection = require("../db/mysql_connection");

// @desc        회비납부 ------------------------------------------------------------------회비납부---------------------------------------
// @route       POST /api/v1/users/membership
// @request     user_name, email, user_collect_dues
// @response    success, user_neme, user_collect_dues
// 로그인이 되어있으니 로그인 토큰을 가져온다app.path();
// 회비를 낸 사람이 누구인지, 그사람이 맞는지 확인, 회비 납부 금액, 회비 납부 년/월/일
exports.collectUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;

  console.log("email" + email);
  console.log("passwd" + passwd);

  if (!email || !passwd) {
    res.status(400).json();
    return;
  }
  if (!validator.isEmail(email)) {
    res.status(400).json();
    return;
  }

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



};
