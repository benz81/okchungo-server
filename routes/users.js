const express = require("express");
const auth = require("../middleware/auth");
const { createUser, loginUser } = require("../controllers/users");

const router = express.Router();

// api/v1/users
router.route("/").post(createUser);
router.route("/lohin").post(loginUser);

module.exports = router;
