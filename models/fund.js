module.exports = (Sequelize, DataTypes) => {
  const Fund = Sequelize.define("fund", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    targetAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    targetDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    createdDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
  });

  return Fund;
};
