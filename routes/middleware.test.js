const { isLoggedIn, isNotLoggedIn } = require("./middlewares");

/**
 * 이렇게 작은 단위의 함수나 모듈이 의도된 대로 정확히 작동하는지 테스트하는 것을
 * 유닛 테스르(unit test)또는 단위 테스트라고 부릅니다.
 */
describe("isLoggedIn", () => {
  const res = {
    /**
     * res.status(*).~ 와 같이 메서드 체이닝이 가능하게 res.status()의 반환값을 res로 해준다.
     */
    status: jest.fn(() => res),
    send: jest.fn(),
  };
  const next = jest.fn();

  test("로그인되어 있으면 isLoggedIn이 next를 호출해야 함", () => {
    /**
     * 로그인 되어있는 상태를 테스트 해야 하므로
     * req.isAuthenticated()의 반환 값을 true로 해준다.
     */
    const req = {
      isAuthenticated: jest.fn(() => true),
    };
    isLoggedIn(req, res, next);
    /**
     * next가 정확히 1번 호출되었는지 확인하는 목함수를 작성해 준다.
     */
    expect(next).toBeCalledTimes(1);
  });
  test("로그인되어 있지 않으면 isLoggedIn이 에러를 응답해야 함", () => {
    const req = {
      isAuthenticated: jest.fn(() => false),
    };
    isLoggedIn(req, res, next);
    expect(res.status).toBeCalledWith(403);
    expect(res.send).toBeCalledWith("로그인 필요");
  });
});

describe("isNotLogedIn", () => {
  const res = {
    redirect: jest.fn(),
  };
  const next = jest.fn();

  test("로그인되어 있으면 isNotLoggedIn 에러를 응답해야 함", () => {
    const req = {
      isAuthenticated: jest.fn(() => true),
    };
    /**
     * 로그인되어 있으면 isNotLoggedIn은 오류를 띄워야 한다.
     */
    isNotLoggedIn(req, res, next);
    const message = encodeURIComponent("로그인한 상태입니다.");
    expect(res.redirect).toBeCalledWith(`/?error=${message}`);
  });
  test("로그인되어 있지 않으면 isNotLoggedIn이 next를 호출해야 함", () => {
    const req = {
      isAuthenticated: jest.fn(() => false),
    };
    isNotLoggedIn(req, res, next);
    expect(next).toBeCalledTimes(1);
  });
});
