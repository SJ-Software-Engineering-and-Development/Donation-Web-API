const Joi = require("joi");
const validateWith = require("../middleware/validation");
const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const querystring = require("querystring");
const multer = require("multer");
const fs = require("fs");

const db = require("../models");
const { join } = require("path");
const fund = require("../models/fund");
const Fund = db.fund;
const Category = db.category;
const userProfile = db.userProfile;

const fundSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  targetAmount: Joi.number().required(),
  targetDate: Joi.date().greater("now"),
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
      options = { where: { status: "pending" } };
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

module.exports = router;
