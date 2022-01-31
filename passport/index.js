const passport = require("passport");
const local = require("./localStrategy");
const kakao = require("./kakaoStrategy");
const User = require("../models/user");

/**
 * In this code, only the user ID is serialized to the session
 * keeping the amount of data stored within the session small
 * When subsequent requests are received, this ID is used to find the user
 * which will be restored to < "req.user" >
 */

module.exports = () => {
  /*
        serializeUser는 로그인 시 실행되며, req.session(세션) 객체에 어떤 데이터를 저장할 지
        정하는 메서드입니다. 매개변수로 user를 받고 나서, done함수에 두번째 인수로 user.id를 넘기고 있습니다.
    */
  passport.serializeUser((data, done) => {
    console.log("serializeUser", data);
    done(null, { id: data.user.id, accessToken: data.accessToken });
  });

  /*
    serializeUser의 done의 두 번쨰 인수로 넣었던 데이터가 deseerializeUser의 매개변수가 된다.
    여기서는 사용자의 아이디이다. 조금 전에 serializeUser에서 세션에 저장했던 아이디를 받아 데이터베이스에서 
    사용자 정보를 조회힌다.
    저장한 정보는 req.user에 저장하므로 앞으로 req.user를 통해 로그인한 사용자의 정보를 가져올 수 있다.
  */
  /**
   * req.session이 있다면 이 session id를 바탕으로 유저를 찾아서 req.user에 넣어 준다.
   */
  passport.deserializeUser((transUser, done) => {
    console.log("deserializeUser", transUser);
    User.findOne({
      where: { id: transUser.id },
      include: [
        { model: User, attributes: ["id", "nick"], as: "Followers" },
        {
          model: User,
          attributes: ["id", "nick"],
          as: "Followings",
        },
      ],
    })
      .then((user) => {
        console.log("deserializeUser", user);
        // follower와 follwing의 정보가 다 들어온 user객체를 받아 들여온다.
        const tokenUser = {
          user: user.dataValues,
          accessToken: transUser.accessToken,
        };
        console.log("deserializeUser ( token )", tokenUser);
        return done(null, tokenUser);
      })
      .catch((err) => done(err));
  });
  /*
    처음 로그인 할때만 serializeUser가 실행된다.
    이는 req.session에 사용자 아이디를 저장한다.
  */

  local();
  kakao();
};
/*
                            < 로그인 전 >
    1. 라우터를 통해 로그인 요청이  ( GET /join /( req.body.email, req.body.nick, req.body.password ) 에 들어온다
    2. 라우터에서 passport.authenticate 메서드 호출
    3. 로그인 전략 수행 ( POST /auth/join ) 전략을 수행하고 passport.authenticate의 콜백함수를 실행하게 된다.
    4. 로그인 성공 시 사용자 정보 객체와 함꼐 req.login호출
    5. req.login 메서드가 passport.serializeUser호출
    6. req.session에 사용자 아이디만 저장
    7. 로그인 완료
*/

/*
                            < 로그인 후 >
    1. 요청이 들어옴
    2. 라우터에 요청이 도달하기 전에 passport.session 미들웨어가 passport.deserializeUser
    메서드 호출
    3. 조회된 사용자 정보를 req.user에 저장
    4. 라우터에서 req.user 객체 사용 가능
*/
