const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const fileupload = require("express-fileupload");
const path = require("path");

// 미들 웨어 로드 찍어주는 로거 app.use에 추가 하는것
const morgan = require("morgan");

// 우리가 파ㅣㄹ로 만든것은 항상 npm  패키지 아래쪽에 만들어준다.
const users = require("./routes/users");

const app = express();

// Body parser 설정. 클라이언트에서 body로 데이터 보내는것 처리.
app.use(express.json());
// 먼저 로그 찍어주도록 미들웨어 설정
app.use(morgan("common"));
// app.use(express.static(path.join(__dirname, "public")));

// 경로 연결
app.use("/api/v1/users", users);

const PORT = process.env.PORT || 5871;
app.listen(PORT, console.log("서버 가동"));
