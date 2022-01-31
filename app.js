// const express = require("express");
// const cookieParser = require("cookie-parser");
// const morgan = require("morgan");
// const path = require("path");
// const session = require("express-session");
// const nunjucks = require("nunjucks");
// const dotenv = require("dotenv");
// const fs = require("fs");
// const https = require("https");

// const helmet = require("helmet");
// const hpp = require("hpp");

// const redis = require("redis");
// const RedisStore = require("connect-redis")(session);

// const passport = require("passport");
// const logger = require("./logger");

// /**
//  * 페이지 들을 관리하는 라우터를 모듈화 함
//  */
// const pageRouter = require("./routes/page");
// const authRouter = require("./routes/auth");
// const postRouter = require("./routes/post");
// const userRouter = require("./routes/user");

// const { sequelize } = require("./models");
// const passportConfig = require("./passport");

// dotenv.config();

// const redisClient = redis.createClient({
//   url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
//   password: process.env.REDIS_PASSWORD,
// });

// // const credentials = {
// //   key: fs.readFileSync(path.join(__dirname, "localhost-key.pem")),
// //   cert: fs.readFileSync(path.join(__dirname, "localhost.pem")),
// // };

// const app = express();

// // const httpsServer = https.createServer(credentials, app);
// // httpsServer.listen(8443);

// passportConfig();
// /**
//  * 개발 모드로 일단 설정 => 추후에는 배포 모드
//  */
// app.set("env", "development");

// /**
//  * get으로 가져올 수 있는 값을 설정 한다.
//  */
// app.set("port", process.env.PORT || 8001);

// /**
//  * 뷰엔진으로 넌적스를 사용한다.
//  */
// app.set("view engine", "html");
// nunjucks.configure("views", {
//   express: app,
//   watch: true,
// });

// /**
//  * 데이터베이스의 테이블들을 생성한다.
//  * force: false로 한 이유는 테이블을 매번 삭제하지 않기 위해서 이다.
//  */
// sequelize
//   .sync({ force: false })
//   .then(() => {
//     console.log("데이터베이스 연결 성공");
//   })
//   .catch((err) => {
//     console.error(err);
//   });

// if (process.env.NODE_ENV === "production") {
//   app.use(morgan("combined"));
//   app.use(helmet());
//   app.use(hpp());
// } else {
//   app.use(morgan("dev"));
// }

// app.use(morgan("dev"));
// app.use(express.static(path.join(__dirname, "public")));
// app.use("/img", express.static(path.join(__dirname, "uploads")));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// /**
//  * cookie-parser iddleware no longer needs to be used for express-session middleware
//  */
// app.use(cookieParser(process.env.COOKIE_SECRET));
// /**
//  *  Session data is not saved in the cookie itself, just the session ID,
//  *  Session data is stored server-side
//  *
//  *  The default server-side session storage, MemoryStore, is purposely not designed for a production environment
//  *
//  *  < cookie >
//  *  The default value is { path: '/', httpOnly: true, secure: false, maxAge: null }
//  */

// const sess = {
//   resave: false,
//   saveUninitialized: false,
//   secret: process.env.COOKIE_SECRET,
//   cookie: {
//     httpOnly: true,
//     secure: false,
//   },
//   // store: new RedisStore({ client: redisClient }),
// };
// /**
//  * <포워드 프록시>
//  * 대개 캐슁 기능이 있으므로 자주 사용되는 컨텐츠라면 월등한 성능 향상을 가져올 수 있으며
//  * 정해진 사이트만 열결하게 설정하는 등 웹 사용 환경을 제한할 수 있으므로 보안이 매우 중요한 기업환경등에서 사용합니다,
//  *
//  * <리버스 프록시>
//  *
//  */

// if (process.env.NODE_ENV === "production") {
//   sess.proxy = true;
//   sess.cookie.secure = true;
// }

// app.use(session(sess));

// /* passport.initialize미들웨어는 req객체에 passport설정을 심는다 */
// app.use(passport.initialize());
// /* passport.session객체는 express-session에서 생성한 req.session에 passport 정보를 저장합니다 */
// app.use(passport.session());

// app.use("/", pageRouter);
// app.use("/auth", authRouter);
// app.use("/post", postRouter);
// app.use("/user", userRouter);

// app.use((req, res, next) => {
//   const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
//   error.status = 404;
//   logger.info("hello");
//   logger.error(error.message);
//   next(error);
// });

// app.use((err, req, res, next) => {
//   res.locals.message = err.message;
//   res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
//   res.status(err.status || 500);
//   res.render("error");
// });

// module.exports = app;

// book version

const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");
const passport = require("passport");
const helmet = require("helmet");
const hpp = require("hpp");
const redis = require("redis");
const RedisStore = require("connect-redis")(session);

dotenv.config();
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD,
});
const pageRouter = require("./routes/page");
const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const userRouter = require("./routes/user");
const { sequelize } = require("./models");
const passportConfig = require("./passport");
const logger = require("./logger");

const app = express();
passportConfig(); // 패스포트 설정
app.set("port", process.env.PORT || 8001);
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("데이터베이스 연결 성공");
  })
  .catch((err) => {
    console.error(err);
  });

if (process.env.NODE_ENV === "production") {
  app.enable("trust proxy");
  app.use(morgan("combined"));
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(hpp());
} else {
  app.use(morgan("dev"));
}
app.use(express.static(path.join(__dirname, "public")));
app.use("/img", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
const sessionOption = {
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
  store: new RedisStore({ client: redisClient }),
};
if (process.env.NODE_ENV === "production") {
  sessionOption.proxy = true;
  // sessionOption.cookie.secure = true;
}
app.use(session(sessionOption));
app.use(passport.initialize());
app.use(passport.session());

app.use("/", pageRouter);
app.use("/auth", authRouter);
app.use("/post", postRouter);
app.use("/user", userRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  logger.info("hello");
  logger.error(error.message);
  next(error);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
