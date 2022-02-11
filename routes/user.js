const express = require("express");

const { isLoggedIn } = require("./middlewares");
const { addFollowing, editProfile } = require("../controllers/user");

const router = express.Router();

router.post("/:id/follow", isLoggedIn, addFollowing);
router.post("/editProfile", isLoggedIn, editProfile);

module.exports = router;
