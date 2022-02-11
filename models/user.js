const Sequelize = require("sequelize");

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        email: {
          type: Sequelize.STRING(40),
          allowNull: true,
          unique: true,
        },
        nick: {
          type: Sequelize.STRING(15),
          allowNull: false,
        },
        password: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        provider: {
          type: Sequelize.STRING(10),
          allowNull: false,
          defaultValue: "local",
        },
        snsId: {
          type: Sequelize.STRING(30),
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "User",
        tableName: "users",
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }
  static associate(db) {
    db.User.hasMany(db.Post);
    db.User.belongsToMany(db.User, {
      foreignKey: "followingId",
      as: "Followers",
      through: "Follow",
    });
    db.User.belongsToMany(db.User, {
      foreignKey: "followerId",
      as: "Followings",
      through: "Follow",
    });
    /**
     * postId라는 외래키값을 이용해서 받아올 것은
     */
    db.User.belongsToMany(db.Post, {
      through: "PostLoveUser",
      foreignKey: "userId",
      as: "LovedPostList",
    });

    db.User.hasMany(db.Room);

    db.User.hasMany(db.Chat);
  }
};

/*
    사용자 정보를 저장하는 모델
    이메일, 닉네임, 비밀번호를 저장하고
    SNS로그인을 했을 경우에는 provider와 snsId를 저장한다,
    provider가 local이면 로컬 로그인을 한 것이고,
    kakao면 카카오 로그인을 한 것이다.
    기본적으로 로컬 로그인이라 가정해서 defaultValue를 local로 주었다.
*/
