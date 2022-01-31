/*
    라우터에는 접근 조건이 있다.
    로그인한 사용자는 회원가입과 로그인 라우터에 접근하면 안된다.
    마찬가지로 로그인하지 않은 사용자는 로그아웃 라우터에 접근하면 안된다.
*/

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(403).send("로그인 필요").redirect("/");
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    const message = encodeURIComponent("로그인한 상태입니다.");
    res.redirect(`/?error=${message}`);
  }
};
