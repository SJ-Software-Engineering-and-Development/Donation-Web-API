const Joi = require("joi");
const validateWith = require("../middleware/validation");
const router = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const querystring = require("querystring");
const multer = require("multer");
const fs = require("fs");

const imgHelper = require("../helpers/imageFilter");
const imgStorage = require("../storageConfig");

const db = require("../models");
const { join } = require("path");
const Review = db.review;

const reviewSchema = Joi.object({
  review: Joi.string().required().min(1),
  date: Joi.date().iso(),
  donorId: Joi.string().required(),
  image: Joi.any(),
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
    //Image is optional for this endpoint
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

    const { error, value } = reviewSchema.validate({
      review: req.body.review,
      donorId: req.body.donorId,
    });
    if (error) return res.status(400).send({ error: error.details[0].message });

    const review = req.body.review;
    const date = req.body.date;
    const donorId = req.body.donorId;
    const image = req.file.path;

    //store in Db
    let cData = {
      review: {
        review: review,
        date: Date.now(),
        donorId: donorId,
        image: image,
      },
    };

    const reivew = await Review.create(cData.review);
    //status has default values no need to set here
    if (!reivew)
      return res
        .status(400)
        .send({ error: "Error! Server having some trubles" });

    return res.status(200).send({
      data: `Review has been sent successfully`,
    });
  });
});

router.get("/", async (req, res) => {
  const reviews = await Review.findAll({
    attributes: { exclude: ["createdAt", "updatedAt"] },
  });

  if (!reviews) return res.status(400).send({ error: "No reviews found." });
  res.status(200).send(reviews);
});

module.exports = router;
