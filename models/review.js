module.exports = (Sequelize, DataTypes) => {
  const Review = Sequelize.define("review", {
    review: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  });

  return Review;
};
