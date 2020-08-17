const express = require("express");
const auth = require("../middleware/auth");
const { createUser } = require("../controllers/users");

const router = express.Router();

// api/v1/users
router.route("/").post(createUser);

module.exports = router;
