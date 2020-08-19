// next 파라미터 실습
// 5.5. 로그 찍는 로거 함수를 만든다. // 호출할 때마다 뭘 호출했는지 보여준다.
const logger = (req, res, next) => {
  console.log(
    `${req.method} ${req.protocol}://${req.get("host")}${req.originalUrl}`
  );
  next(); // ★ app.use(logger) (미들웨어) 밑에 있는 app.use()로 넘어가기 위해서는 next()를 적어야 한다. 적지 않으면 넘어가지 않는다.
};

module.exports = logger;
