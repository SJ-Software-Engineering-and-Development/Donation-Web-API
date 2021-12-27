const Joi = require("joi");
const validateWith = require("../middleware/validation");
const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const querystring = require("querystring");
const multer = require("multer");
const fs = require("fs");
const { join } = require("path");

const db = require("../models");
const Fund = db.fund;
const Category = db.category;
const userProfile = db.userProfile;
const Donation = db.donation;

const fundSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  targetAmount: Joi.number().required(),
  targetDate: Joi.date().greater("now").iso(),
  userProfileId: Joi.number().required(),
  categoryId: Joi.number().required(),
});

router.post("/", validateWith(fundSchema), async (req, res) => {
  let fund = req.body;
  fund.createdDate = Date.now();

  const category = await Category.findByPk(fund.categoryId);
  if (!category) return res.status(400).send({ error: "Invalid Category" });
  const profile = await userProfile.findByPk(fund.userProfileId);
  if (!profile) return res.status(400).send({ error: "Invalid userId" });

  const newFund = await Fund.create(fund);
  if (!newFund)
    return res.status(400).send({ error: "Error! Server having some trubles" });

  return res.status(200).send({
    data: `New Fund has been created`,
  });
});

router.get("/getByid/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).send({ error: "Invalid id" });

  let fund = await Fund.findOne({
    where: { id: id },
    include: [Category, userProfile],
  });
  if (!fund) return res.status(400).send({ error: "Fund not found" });

  let totalDon = 0;
  let totalDonAmount = 0;

  //get no of donatations for given id
  Fund.count().then((c) => {
    totalDon = c;
  });

  //get summation of donations
  let sumDon = await Donation.findAll({
    where: { fundId: id },
    attributes: [
      [db.sequelize.fn("SUM", db.sequelize.col("amount")), "totalAmount"], // To add the aggregation...
    ],
  });

  totalDonAmount =
    sumDon[0].dataValues.totalAmount == null
      ? "0.00"
      : sumDon[0].dataValues.totalAmount;

  fund = {
    fund,
    ...{ totalDonations: totalDon },
    ...{ totalDonationsAmount: totalDonAmount },
  };

  return res.status(200).send({ data: fund });
});

router.get("/getMyFunds/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).send({ error: "Invalid id" });

  let fundList = await Fund.findAll({
    where: { userProfileId: id },
    include: [Category],
  });
  if (!fundList) return res.status(400).send({ error: "Fund not found" });

  myFunds = [];

  for (i = 0; i < fundList.length; i++) {
    var fund = {};
    fund = fundList[i].dataValues;

    //Get no of donations for each fund post
    Donation.count({ where: { fundId: fundList[i].id } }).then((c) => {
      fund.totalDonations = c;
    });

    //Get summations of donationsAmount for each fund post
    let sumDon = await Donation.findAll({
      where: { fundId: fundList[i].id },
      attributes: [
        [db.sequelize.fn("SUM", db.sequelize.col("amount")), "totalAmount"], // To add the aggregation...
      ],
    });

    fund.totalDonationAmount =
      sumDon[0].dataValues.totalAmount == null
        ? "0.00"
        : sumDon[0].dataValues.totalAmount;
    myFunds.push(fund);
  }

  return res.status(200).send({ data: myFunds });
});

router.get("/:status", async (req, res) => {
  const status = req.params.status; //all | active | deactive
  let options = {};

  switch (status) {
    case "active":
      options = {
        where: { status: "active" },
        include: [
          {
            model: Category,
            attributes: {
              exclude: ["createdAt", "updatedAt"],
            },
          },
        ],
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      };
      break;
    case "pending":
      options = {
        where: { status: "pending" },
        include: [
          {
            model: Category,
            attributes: {
              exclude: ["createdAt", "updatedAt"],
            },
          },
        ],
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      };
      break;
  }

  const funds = await Fund.findAll(options);

  if (!funds) return res.status(400).send({ error: "No funds found." });
  res.status(200).send(funds);
});

router.patch("/:id/:status", async (req, res) => {
  const status = req.params.status;
  const id = req.params.id;

  let updatedFund;
  let findFund = await Fund.findByPk(id);
  if (!findFund)
    return res.status(400).send({ error: "Category not found with given id" });

  updatedFund = findFund;
  updatedFund.status = status;

  findFund.set(updatedFund);
  updateF = await findFund.save();
  if (!updateF)
    return res.status(400).send({ error: "Error! Server having some trubles" });

  return res.status(200).send({
    data: `Fund status has been updated successfuly`,
  });
});

async function getSummation(id, callback) {
  //get summation of donations
  let sumDon = await Donation.findAll({
    where: { fundId: id },
    attributes: [
      [db.sequelize.fn("SUM", db.sequelize.col("amount")), "totalAmount"], // To add the aggregation...
    ],
  });

  totalDonAmount =
    sumDon[0].dataValues.totalAmount == null
      ? "0.00"
      : sumDon[0].dataValues.totalAmount;

  callback(totalDonAmount);
}

module.exports = router;
