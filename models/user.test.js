const Sequelize = require("sequelize");
const User = require("./user");
const config = require("../config/config")["test"];
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

describe("User 모델", () => {
  test("static init 메서드 호출", () => {
    expect(User.init(sequelize)).toBe(User);
  });
  test("static associate 메서드 호출", () => {
    const db = {
      User: {
        hasMany: jest.fn(),
        belongsToMany: jest.fn(),
      },
      Post: {},
    };
    /**
     * 우리가 확인하고 싶은 것은 User.associate(db) 정적 메서드가 잘 호출되는 지이다
     * 우리는 hasMany와 belongsToMany 함수를 테스팅 함수에 적용하기 힘드므로
     * mock함수를 이용해서 간단히 표현할 수 밖에 없다
     */
    User.associate(db);
    expect(db.User.hasMany).toHaveBeenCalledWith(db.Post);
    expect(db.User.belongsToMany).toHaveBeenCalledTimes(2);
  });
});
