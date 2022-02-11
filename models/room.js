const Sequelize = require("sequelize");

module.exports = class Room extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        _id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        max: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        password: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "Room",
        tableName: "rooms",
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }
  static associate(db) {
    db.Room.belongsTo(db.User);

    db.Room.hasMany(db.Chat);
  }
};
