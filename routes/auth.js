const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const User = require("../models/user");
const axios = require("axios");

const router = express.Router();

/*
    기존에 같은 이메일로 가입한 사용자가 있는지 데이터베이스에서 조회한 후,
    있다면 회원가입 페이지로 되돌려보냅니다.

    단 주소 뒤에 에러를 쿼리스트링으로 표현합니다.

    같은 이메일로 가입한 사용자가 없다면 비밀번호를 암호화하고, 사용자 정보를 생성합니다.
*/

router.post("/join", isNotLoggedIn, async (req, res, next) => {
  // TODO: req.body나중에 값 어떻게 전달되는지 확인하기
  const { email, nick, password } = req.body;
  try {
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      return res.redirect("/join?error=exit");
    }

    const hash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      nick,
      password: hash,
    });
    return res.status(302).redirect("/");
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post("/login", isNotLoggedIn, (req, res, next) => {
  /**
   * local-strategy를 진행한 결우를 코딩한 것이다.
   */
  passport.authenticate("local", (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }

    // 유저에 false ( 비밀번호가 일치x, 등록되지 않는 유저인 경우 )
    // 에러창을 띄운다.
    if (!user) {
      // 쿼리 스트링으로 메세지를 보낸다.
      return res.redirect(`/?loginError=${info.message}`);
    }

    // serialize로 넘어가서 세션에 user를 등록한다.
    return req.login(user, (loginError) => {
      // serialize과정에서 오류가 발생하면 이를 처리한다.
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.status(302).redirect("/");
    });
  })(req, res, next);
});

// 로그아웃 과정
router.get("/logout", isLoggedIn, (req, res) => {
  // passport에서 추가한 logout메서드를 실행
  req.logout();
  // 세션을 없애야 하니까 session객체를 destroy를 통해서 없애기
  req.session.destroy();
  // 기본 홈페이지로 리다이렉트
  res.redirect("/");
});

/*
    GET /auth/kakao로 접근하면 카카오 로그인 과정이 시작됩니다.
    GET /auth/kakao에서 로그인 전략을 수행하는데, 처음에는 카카오 로그인 창으로 리다이렉트 합니다.
    그 창에서 로그인 후 성공 여부 결과를 GET /auth/kakao/callback으로 받습니다.
    이 라우터에서는 카카오 로그인 전략을 다시 수행합니다.
*/

router.get("/kakao", passport.authenticate("kakao"));

/*
    로컬 로그인과 다른 점은 passport.authenticate메서드에 콜백 함수를 제공하지 않는다는 점이다.
    카카오 로그인은 로그인 성공 시 내부적으로 req.login을 호출하므로 우리가 직접 호출할 필요가 없다.
*/

router.get(
  "/kakao/callback",
  passport.authenticate("kakao", {
    failureRedirect: "/",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

// kakao logout
// auth/kakao/logout

router.get("/kakao/logout", async (req, res) => {
  try {
    const ACCESS_TOKEN = res.locals.accessToken;
    await axios.post(
      "https://kapi.kakao.com/v1/user/unlink",
      {},
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );
  } catch (error) {
    console.error(error);
    res.json(error);
  }

  req.logout();
  req.session.destroy();
  res.redirect("/");
});

router.get("/test", async (req, res) => {
  try {
    // console.log("req.user", req.user);
    // console.log("doing");
    res.status(302).redirect("/");
  } catch (error) {
    console.error(error);
    res.json(error);
  }
});

module.exports = router;
