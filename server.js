const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const fileupload = require("express-fileupload");
const path = require("path");

// 미들 웨어 로드 찍어주는 로거 추가 하는것
const morgan = require("morgan");

const users = require("./routes/users");

const app = express();

app.use(express.json());
app.use(morgan("common"));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1/users", users);

const PORT = process.env.PORT || 5871;
app.listen(PORT, console.log("서버 가동"));
