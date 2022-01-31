const request = require("supertest");
const { sequelize } = require("../models");
const app = require("../app");

// /**
//  * sequelize.sync()는 데이터베이스를 사용하기 전에
//  * 필요한 테이블을 만드는 함수라고 할 수 있다.
//  */
beforeAll(async () => {
  await sequelize.sync();
});

// /**
//  * supertest 패키지로부터 request 함수를 불러와서 app객체를 인수로 넣습니다
//  * 여기에 get, post, put, patch, delete등의 메서드로 원하는 라우터에 요청을 보낼 수 있습니다.
//  * 데이터는 send에 담아서 보냅니다.
//  * 그 후 예상되는 응답의 결과를 expect메서드의 인수로 제공하면 그 값이 일치하는지 테스트 합니다.
//  *
//  * 현재 여기서는 Location 헤더가 /인지, 응답의 상태 코드가 302인지 테스트 하고 있습니다.
//  * 또한 done을 두 번째 인수로 넣어서 테스트가 마무리 되었음을 알려주어야 합니다.
//  */

describe("POST /join", () => {
  test("로그인 안 했으면 가입", (done) => {
    request(app)
      .post("/auth/join")
      .send({
        email: "zerohch0@gmail.com",
        nick: "zerocho",
        password: "nodejsbook",
      })
      .expect("Location", "/")
      .expect(302, done);
  });
});

describe("POST /login", () => {
  const agent = request.agent(app);
  beforeEach((done) => {
    agent
      .post("/auth/login")
      .send({
        email: "zerohch0@gmail.com",
        password: "nodejsbook",
      })
      .end(done);
  });

  test("이미 로그인했으면 redirect /", (done) => {
    const message = encodeURIComponent("로그인한 상태입니다.");
    agent
      .post("/auth/join")
      .send({
        email: "zerohch0@gmail.com",
        nick: "zerocho",
        password: "nodejsbook",
      })
      .expect("Location", `/?error=${message}`)
      .expect(302, done);
  });
});

describe("POST /login", () => {
  test("가입되지 않은 회원", (done) => {
    const message = encodeURIComponent("가입되지 않은 회원입니다.");
    request(app)
      .post("/auth/login")
      .send({
        email: "zerohch1@gmail.com",
        password: "nodejsbook",
      })
      .expect("Location", `/?loginError=${message}`)
      .expect(302, done);
  });

  test("로그인 수행", (done) => {
    request(app)
      .post("/auth/login")
      .send({
        email: "zerohch0@gmail.com",
        password: "nodejsbook",
      })
      .expect("Location", "/")
      .expect(302, done);
  });

  test("비밀번호 틀림", (done) => {
    const message = encodeURIComponent("비밀번호가 일치하지 않습니다.");
    request(app)
      .post("/auth/login")
      .send({
        email: "zerohch0@gmail.com",
        password: "wrong",
      })
      .expect("Location", `/?loginError=${message}`)
      .expect(302, done);
  });
});

describe("GET /logout", () => {
  test("로그인 되어있지 않으면 403", (done) => {
    request(app).get("/auth/logout").expect(403, done);
  });

  const agent = request.agent(app);
  beforeEach((done) => {
    agent
      .post("/auth/login")
      .send({
        email: "zerohch0@gmail.com",
        password: "nodejsbook",
      })
      .end(done);
  });

  test("로그아웃 수행", (done) => {
    agent.get("/auth/logout").expect("Location", `/`).expect(302, done);
  });
});

afterAll(async () => {
  await sequelize.sync({ force: true });
});
