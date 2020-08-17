const express = require("express");
const dotenv = require("dotenv");

const app = express();

const PORT = process.env.PORT || 5871;
app.listen(PORT, console.log("서버 가동"));
