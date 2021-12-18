const dbConfig = require("../config/dbConfig");

const { Sequelize, DataTypes } = require("sequelize");

//object initilize. (pass parameter to constructor)
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false, //hide errors
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

sequelize
  .authenticate()
  .then(() => {
    console.log("DB connected!");
  })
  .catch((err) => {
    console.log("Error " + err);
  });

const db = {}; // Empty object

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.login = require("./login.js")(sequelize, DataTypes);
db.userProfile = require("./userProfile.js")(sequelize, DataTypes);

//relations

db.userProfile.login = db.userProfile.belongsTo(db.login, {
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

db.sequelize
  .sync({ force: false }) //force :true - drop all tables before start
  .then(() => {
    console.log("yes re-sync done!");
  });

module.exports = db;
