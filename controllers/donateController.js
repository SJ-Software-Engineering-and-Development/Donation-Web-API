const Joi = require("joi");
const validateWith = require("../middleware/validation");
const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const querystring = require("querystring");
const multer = require("multer");
const fs = require("fs");
const { join } = require("path");

const imgHelper = require("../helpers/imageFilter");
const imgStorage = require("../storageConfig");
const db = require("../models");

const Fund = db.fund;
const Category = db.category;
const userProfile = db.userProfile;
const Donate = db.donation;

const donateSchema = Joi.object({
  amount: Joi.number().required(),
  details: Joi.string().required(),
  type: Joi.string().required(),
  isPublic: Joi.boolean().required(),
  donatorId: Joi.number().required(),
  fundId: Joi.number().required(),
});

router.post("/", async (req, res) => {
  const upload = multer({
    storage: imgStorage.storage,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: imgHelper.imageFilter,
  }).single("image");

  upload(req, res, async function (err) {
    // req.file contains information of uploaded file
    // req.body contains information of text fields, if there were any

    let imageFile = ""; //req.file.path;

    if (req.fileValidationError) {
      //  return res.status(400).send({ error: req.fileValidationError });
    } else if (!req.file) {
      //   return res
      //     .status(400)
      //     .send({ error: "Please select an image to upload" });
    } else if (err instanceof multer.MulterError) {
      //  return res.status(400).send({ error: err });
    } else if (err) {
      //  return res.status(400).send({ error: err });
    } else {
      imageFile = req.file.path;
    }

    const { error, value } = donateSchema.validate({
      amount: req.body.amount,
      details: req.body.details,
      type: req.body.type,
      isPublic: req.body.isPublic,
      donatorId: req.body.donatorId,
      fundId: req.body.fundId,
    });
    if (error) return res.status(400).send({ error: error.details[0].message });
    const amount = req.body.amount;
    const details = req.body.details;
    const type = req.body.type;
    const isPublic = req.body.isPublic;
    const donatorId = req.body.donatorId;
    const fundId = req.body.fundId;

    const validDonator = await userProfile.findByPk(donatorId);
    if (!validDonator)
      return res.status(400).send({ error: "Invalid donator id." });

    const validFund = await Fund.findByPk(fundId);
    if (!validFund) return res.status(400).send({ error: "Invalid fund id." });

    //store in Db
    let cData = {
      donation: {
        amount: amount,
        details: details,
        type: type,
        isPublic: isPublic,
        DonatedDate: Date.now(),
        donatorId: donatorId,
        fundId: fundId,
        image: imageFile,
      },
    };

    const donate = await Donate.create(cData.donation);
    //status has default values no need to set here
    if (!donate)
      return res
        .status(400)
        .send({ error: "Error! Server having some trubles" });

    return res.status(200).send({
      data: `${donate.amount} has been donated successfuly`,
    });
  });
});

module.exports = router;
