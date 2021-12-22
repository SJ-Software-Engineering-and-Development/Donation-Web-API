module.exports = (Sequelize, DataTypes) => {
  const Donation = Sequelize.define("donation", {
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "donated",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    details: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false, //money | items
      defaultValue: "money",
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    DonatedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  });

  return Donation;
};
