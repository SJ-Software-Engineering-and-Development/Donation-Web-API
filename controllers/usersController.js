const Joi = require("joi");
const validateWith = require("../middleware/validation");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const verifyToken = require("../middleware/verifyToken");
const nodemailer = require("nodemailer");
const passwordGenerator = require("generate-password");
const querystring = require("querystring");

const db = require("../models");
const Login = db.login;
const UserProfile = db.userProfile;
const Farmer = db.farmer;
const Coordinator = db.coordinator;
const collectingAgent = db.collectingAgent;

const ROLE = require("../config/roleEnum");
const { date } = require("joi");
const userProfile = require("../models/userProfile");

const schema = Joi.object({
  name: Joi.string().required().min(2),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(5),
  role: Joi.valid(...[ROLE.Admin, ROLE.Client, ROLE.Moderator]),
  collectingRegionId: Joi.number(),
  collectingAgentId: Joi.number(),
  coordinatorId: Joi.number(),
});

const signOutSchema = Joi.object({
  email: Joi.string().email().required(),
});

router.post("/signup", validateWith(schema), async (req, res) => {
  const { name, email, password, role } = req.body;
  const oldUser = await Login.findOne({ where: { email: email } });
  if (oldUser)
    return res
      .status(400)
      .send({ error: "A user with the given email already exists." });

  encryptedPassword = await bcrypt.hash(password, 10);

  const user = await Login.create({
    name: name,
    email: email,
    password: encryptedPassword,
    role: role,
    status: "offline",
  });
  res.status(200).send(user);
});

router.post(
  "/signout",
  verifyToken,
  validateWith(signOutSchema),
  async (req, res) => {
    const { email } = req.body;
    const user = await Login.findOne({ where: { email: email } });
    if (user) {
      //Update status,lastLogin
      user.set({
        lastLogin: Date.now(),
        status: "offline",
      });
      await user.save();
      return res.status(200).send({ data: `${email} Signed out` });
    }
    /*
    cannot manually expire a token after it has been created.
    Thus, you cannot log out with JWT on the server-side as you do with sessions.
    JWT is stateless, meaning that you should store everything you need in the payload
    and skip performing a DB query on every request.
    */
    return res
      .status(400)
      .send({ error: "A user with the given email not exists." });
  }
);

router.get("/", verifyToken, async (req, res) => {
  const users = await Login.findAll({
    attributes: ["id", "name", "email", "role", "status"],
  });
  if (!users) return res.status(400).send({ error: "No users found." });

  //Simulate slow N/W
  setTimeout(() => {
    res.status(200).send(users);
  }, 2000);
});

router.get("/getProfiles", async (req, res) => {
  const users = await Farmer.findAll({
    include: [
      {
        association: Farmer.userProfile,
        include: [Login],
      },
    ],
  });
  if (!users) return res.status(400).send({ error: "No users found." });

  res.status(200).send(users);
});

//Test
// router.get("/getProfiles", async (req, res) => {
//   const users = await UserProfile.findAll();
//   if (!users) return res.status(400).send({ error: "No users found." });

//   res.status(200).send(users);
// });

router.post("/signup/:role", async (req, res) => {
  const { userProfile } = req.body;
  const role = req.params.role;
  let newUser = {};

  const oldUser = await Login.findOne({
    where: { email: userProfile.login.email },
  });
  if (oldUser)
    return res
      .status(400)
      .send({ error: "A user with the given email already exists." });

  encryptedPassword = await bcrypt.hash(userProfile.login.password, 5);
  userProfile.login.password = encryptedPassword;

  switch (role) {
    case ROLE.Client:
      userProfile.login.role = ROLE.Client;
      newUser = await UserProfile.create(userProfile, {
        include: [Login],
      });
      break;
  }
  //status , lastLogin has default values no need to set here
  if (!newUser)
    return res.status(400).send({ error: "Error! Server having some trubles" });
  //Simulate slow N/W
  setTimeout(() => {
    return res.status(200).send({
      data: `${userProfile.login.email} has been registered as a ${role}`,
    });
  }, 1000);
});

router.get("/get", async (req, res) => {
  const users = await UserProfile.findAll({
    include: {
      model: Login,
      attributes: { exclude: ["password", "createdAt", "updatedAt"] },
    },
  });

  if (users) res.status(200).send(users);
});

router.get("/get/:id", async (req, res) => {
  const loginId = req.params.id;

  const users = await UserProfile.findOne({
    where: {
      loginId: loginId,
    },
    include: {
      model: Login,
      attributes: { exclude: ["password", "createdAt", "updatedAt"] },
    },
  });
  if (!users) return res.status(400).send({ error: "No any user found." });

  res.status(200).send(users);
});

router.post("/sendmail", (req, res) => {
  console.log("request came");
  let user = req.body;
  sendMail(user, (info) => {
    console.log(`The mail has beed send 😃 and the id is ${info.messageId}`);
    res.send(info);
  });
});

async function sendMail(user, userPassword, callback) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", //host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for 587, false for other ports
    auth: {
      user: "evergreen.group.lanka@gmail.com", //user: "evergreen.group.srilanaka@gmail.com",
      pass: "", //pass: "evergreen@123",
    },
  });
  //"cshop3493@gmail.com","Coffee#123*"
  let mailOptions = {
    from: "evergreen.group.lanka@gmail.com", // sender address
    to: user.email, // list of receivers
    subject: "New Account has been created for your 👻", // Subject line
    html: `<h1>Hi ${user.name}</h1><br>
    <h2>New Account has been created for your 👻<h2>
    <h2>User name will be ${user.email}<h2>
    <h2>Your password: ${userPassword}<h2>
    <h5>Please change your password right after your First login<h5>
    <h4 style="color:Green">Thanks for joining with us</h4>`,
  };

  // send mail with defined transport object
  let info = await transporter.sendMail(mailOptions);

  callback(info);
}

module.exports = router;
