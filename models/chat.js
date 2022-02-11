const Sequelize = require("sequelize");

module.exports = class Chat extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        // room에는 이제 room의 _id가 들어가면 된다 -> UUID
        // room: {
        //   type: Sequelize.UUID,
        //   defaultValue: Sequelize.UUIDV4,
        //   allowNull: false,
        // },
        // // userId와 같은 것이다.
        // user: {
        //   type: Sequelize.STRING,
        //   allowNull: false,
        // },
        chat: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        gif: {
          type: Sequelize.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Chat",
        tableName: "chats",
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }
  static associate(db) {
    // 유저는 여러개의 chat을 가질 수 있다
    db.Chat.belongsTo(db.User);
    // room또한 여러개의 chat을 가질 수 있다.
    db.Chat.belongsTo(db.Room);
  }
};

/*
    해시태그 모델은 태그 이름을 저장합니다.
    해시태그 모델을 따로 두는 것은 나중에 태그로 검색하기 위해서 이다.
*/
