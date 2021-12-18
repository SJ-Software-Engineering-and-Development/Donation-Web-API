const Joi = require("joi");
const validateWith = require("../middleware/validation");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const verifyToken = require("../middleware/verifyToken");
const nodemailer = require("nodemailer");
const querystring = require("querystring");
const multer = require("multer");
const fs = require("fs");

const imgHelper = require("../helpers/imageFilter");
const imgStorage = require("../storageConfig");

const db = require("../models");
const { join } = require("path");
const Category = db.category;

const categorySchema = Joi.object({
  id: Joi.number(),
  name: Joi.string().required().min(2),
  description: Joi.string().required(),
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

    if (req.fileValidationError) {
      return res.status(400).send({ error: req.fileValidationError });
    } else if (!req.file) {
      return res
        .status(400)
        .send({ error: "Please select an image to upload" });
    } else if (err instanceof multer.MulterError) {
      return res.status(400).send({ error: err });
    } else if (err) {
      return res.status(400).send({ error: err });
    }

    const { error, value } = categorySchema.validate({
      name: req.body.name,
      description: req.body.description,
      image: req.file.path,
    });
    if (error) return res.status(400).send({ error: error.details[0].message });

    const name = req.body.name;
    const description = req.body.description;
    const image = req.file.path;

    const oldCategory = await Category.findOne({
      where: { name: name },
    });
    if (oldCategory) {
      //Remove uploaded file from ./uploads folder
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error(err);
        }
        //(->)file removed success
      });
      return res
        .status(400)
        .send({ error: "A catagory with the given name already exists." });
    }

    //store in Db
    let cData = {
      category: {
        name: "",
        description: "",
        image: "",
      },
    };

    cData.category.name = name;
    cData.category.description = description;
    cData.category.image = image;

    const newCategory = await Category.create(cData.category);
    //status has default values no need to set here
    if (!newCategory)
      return res
        .status(400)
        .send({ error: "Error! Server having some trubles" });

    return res.status(200).send({
      data: `New category has been created as ${cData.category.name}`,
    });
  });
});

router.get("/:status", async (req, res) => {
  const status = req.params.status; //all | active | deactive
  let options = {};

  switch (status) {
    case "active":
      options = { where: { status: "active" } };
      break;
    case "deactive":
      options = { where: { status: "deactive" } };
      break;
  }

  const categories = await Category.findAll(options);

  if (!categories)
    return res.status(400).send({ error: "No categories found." });
  res.status(200).send(categories);
});

router.patch("/", async (req, res) => {
  const upload = multer({
    storage: imgStorage.storage,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: imgHelper.imageFilter,
  }).single("image");

  upload(req, res, async function (err) {
    // req.file contains information of uploaded file
    // req.body contains information of text fields, if there were any

    if (req.fileValidationError) {
      return res.status(400).send({ error: req.fileValidationError });
    } else if (!req.file) {
      return res
        .status(400)
        .send({ error: "Please select an image to upload" });
    } else if (err instanceof multer.MulterError) {
      return res.status(400).send({ error: err });
    } else if (err) {
      return res.status(400).send({ error: err });
    }

    const { error, value } = categorySchema.validate({
      id: req.body.id,
      name: req.body.name,
      description: req.body.description,
      image: req.file.path,
    });
    if (error) return res.status(400).send({ error: error.details[0].message });

    const name = req.body.name;
    const description = req.body.description;
    const image = req.file.path;

    const findCategory = await Category.findByPk(req.body.id);
    if (!findCategory)
      return res
        .status(400)
        .send({ error: "Category not found with given id" });

    //Remove existing image file
    fs.unlink(findCategory.image, (err) => {
      if (err) {
        console.error(err);
      }
      //file removed success
    });

    //store in Db
    let cData = {
      category: {
        name: "",
        description: "",
        image: "",
      },
    };

    cData.category.name = name;
    cData.category.description = description;
    cData.category.image = image;

    findCategory.set(cData.category);
    updateC = await findCategory.save();

    if (!updateC)
      return res
        .status(400)
        .send({ error: "Error! Server having some trubles" });

    return res.status(200).send({
      data: `Category has been updated successfuly`,
    });
  });
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  const category = await Category.findByPk(id);
  if (!category)
    return res.status(400).send({ error: "Category not found with given id" });

  //Remove relavent image file
  fs.unlink(category.image, (err) => {
    if (err) {
      console.error(err);
    }
    //file removed success
  });

  const del = await category.destroy();
  if (!del)
    return res
      .status(400)
      .send({ error: "Cannot Delete Category, Try again!" });

  return res.status(200).send({
    data: "Categoty deleted successfuly",
  });
});

module.exports = router;
