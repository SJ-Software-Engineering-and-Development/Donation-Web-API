const express = require("express"); //require("express") return an method. we assign as express
const cors = require("cors");

const auth = require("./controllers/authController");
const user = require("./controllers/usersController");
const category = require("./controllers/categotyController");

const app = express(); // express() return object. we assign it as app

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const PORT = process.env.PORT || 8081;
var corOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  exposedHeaders:
    "Content-Type, Content-Length, Authorization, Accept, X-Requested-With",
};

// midlewares...........
app.use(cors(corOptions));

//This belogns to requesat posessing pipe line. so we handling req and res by JSON format.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads")); //make uploads folder public & static to route that has url/uploads
const swaggerDocument = require("./swagger.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/auth", auth);
app.use("/api/users", user);
app.use("/api/categories", category);
// .................

//Testing api
app.get("/", (req, res) => {
  res.json({ messagge: "Hello from Donation API" });
});

//server . this start listing on the given port
app.listen(PORT, () => {
  console.log(`Server is runing on port ${PORT}`);
});
