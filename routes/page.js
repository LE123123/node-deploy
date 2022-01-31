const express = require("express");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const { Post, User, Hashtag } = require("../models");

const router = express.Router();
const accessToken = null;

/*
                                템플릿 엔진에서 사용할
    user, followerCount, followingCount, followerIdList 변수를 res.locals로 설정
    이를 이렇게 설정한 이유는 모두 user, followerCount, followingCount, followerIdList 변수를 모든
    템플릿 엔진에서 공통으로 사용하기 때문입니다.
*/
router.use((req, res, next) => {
  console.log("req.session", req.session.id);
  console.log("req.sessionID", req.sessionID);
  // req에 user가 있다면 이를 집어 넣는다.
  if (req.user) {
    /**
     * 1) res.locals.user에 유저 정보를 저장해 놓음
     * 2) res.locals.accessToken에 유저 accessToken을 저장해 놓음
     *  < 전역으로 저장해서 어디든 접근 가능하게끔 설정해 놓음 >
     */
    res.locals.user = req.user.user;
    res.locals.accessToken = req.user.accessToken;
    console.log(
      "page router res.locals.user",
      JSON.stringify(res.locals.user, null, 2)
    );
  }

  res.locals.followerCount = res.locals.user ? res.locals.user.Followers.length : 0;
  // prettier-ignore
  res.locals.followingCount = res.locals.user ? res.locals.user.Followings.length : 0;
  // prettier-ignore
  res.locals.followerIdList = res.locals.user ? res.locals.user.Followings.map((f) => f.id) : [];
  next();
});

router.get("/profile", isLoggedIn, (req, res) => {
  console.log("Profile ROuter에서 session확인", req.session);
  console.log("Profile Router에서 session에 저장되어있는 id확인", req.session.id);
  res.render("profile", { title: "내 정보 - NodeBird" });
});

router.get("/join", isNotLoggedIn, (req, res) => {
  res.render("join", { title: "회원가입 - NodeBird" });
});

router.get("/", async (req, res, next) => {
  try {
    // 모든 포스트를 다 찾는다 => 찾아서 메인 페이지에 다 띄우기 위해 post와 user ( id와 nick만 )를 join시켜서 배열로 받아 넘긴다.
    const posts = await Post.findAll({
      include: {
        model: User,
        attributes: ["id", "nick"],
      },
      order: [["createdAt", "DESC"]],
    });
    console.log("posts check >> ", JSON.stringify(posts, null, 2));
    res.render("main", {
      title: "NodeBird",
      twits: posts,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/hashtag", async (req, res, next) => {
  const query = req.query.hashtag;
  console.log("query => ", req.body.hashtag);
  if (!query) {
    return res.redirect("/");
  }
  try {
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    let posts = [];
    if (hashtag) {
      posts = await hashtag.getPosts({ include: [{ model: User }] });
    }
    return res.render("main", {
      title: `${query} | NodeBird`,
      twits: posts,
    });
  } catch (error) {
    console.error(err);
    return next(error);
  }
  // res.send("asd");
});
module.exports = router;
