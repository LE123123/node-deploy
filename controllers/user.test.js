jest.mock("../models/user");
const User = require("../models/user");
const { addFollowing } = require("./user");

/**
 * addFollowing 컨트롤러 안에는 User라는 모델이 들어가 있다.
 * 이 모델은 실제 데이터베이스와 연결되어 있으므로 테스트 환경에서는 사용할 수 없다.
 * 따라서 User모델도 모킹해야 한다.
 */

describe("addFollowing", () => {
  const req = {
    user: { id: 1 },
    params: { id: 2 },
  };
  const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
  };
  const next = jest.fn();

  test("사용자를 찾아 팔로잉을 추가하고 success를 응답해야 함", async () => {
    /**
     * mockReturnValue 메서드를 통해 User.findOne이 {addFollowing(id)} 객체를 반환하도록 해야 한다.
     * 그래야 사용자를 찾아서 팔로잉을 추가하는 상황을 테스트 하기 위함이다
     * await user.addFollowings메서드를 호출할 수 있어지기 때문이다.
     */
    User.findOne.mockReturnValue(
      Promise.resolve({
        addFollowing(id) {
          return Promise.resolve(true);
        },
      })
    );
    await addFollowing(req, res, next);
    expect(res.send).toBeCalledWith("success");
  });

  test("사용자를 못 찾으면 res.status(404).send(no user)를 호출함", async () => {
    User.findOne.mockReturnValue(null);
    await addFollowing(req, res, next);
    expect(res.status).toBeCalledWith(404);
    expect(res.send).toBeCalledWith("no user");
  });

  test("DB에서 에러가 발생하면 next(error)를 호출함", async () => {
    const error = "테스트용 에러";
    User.findOne.mockReturnValue(Promise.reject(error));
    /**
     * 유저를 찾는 과정에서 Promise.reject(error)를 반환하게 되는 경우를 생각하게 된다.
     */
    await addFollowing(req, res, next);
    expect(next).toBeCalledWith(error);
  });
});
