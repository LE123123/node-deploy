const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const bctypt = require("bcrypt");

const User = require("../models/user");

module.exports = () => {
  passport.use(
    new localStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          // 사용자를 조회한다.
          const exUser = await User.findOne({ where: { email } });
          // 사용자가 있다면 암호를 조회한다
          if (exUser) {
            const result = await bctypt.compare(password, exUser.password);
            // 만약 비밀번호가 일치한다면 콜백 user객체를 done콜백함수로 보낸다.
            if (result) {
              const tokenUser = {
                user: exUser,
                accessToken: "",
              };
              done(null, tokenUser);
              // 유저는 있는데 비밀번호가 일치하지 않는 경우
            } else {
              done(null, false, { message: "비밀번호가 일치하지 않습니다." });
            }
          } else {
            // 아예 가입되지 않는 회원인 경우
            done(null, false, { message: "가입되지 않은 회원입니다." });
          }
        } catch (error) {
          console.error(error);
          done(error);
        }
      }
    )
  );
};
