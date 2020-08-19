const express = require("express");
const auth = require("../middleware/auth");
const {
  createUser,
  loginUser,
  logout,
  deleteUser,
  logoutAll,
  myInfo,
  getMyInfo,
  userPhotoUpload,
  changePasswd,
  forgotPasswd,
  resetPasswd,
} = require("../controllers/users");

const router = express.Router();

// api/v1/users
router
  .route("/")
  .post(createUser)
  .get(auth, getMyInfo)
  .delete(auth, deleteUser);
router.route("/login").post(loginUser);
router.route("/logout").delete(auth, logout);
router.route("/logout/all").post(auth, logoutAll);
router.route("/me").get(myInfo);
router.route("/me/photo").put(userPhotoUpload);
router.route("/change_passwd").put(changePasswd);
router.route("/forgotpasswd").post(auth, forgotPasswd);
router.route("/resetpasswd/:resetPasswdToken").post(auth, resetPasswd);

module.exports = router;
