const express = require("express");
const mongoose = require("mongoose");
const app = express();
let cors = require("cors");
require("dotenv").config();
app.use(express.json());


const { adminRouter } = require("./routes/admin.route")
const { adminWork } = require("./routes/adminWork.route")
const { authentication } = require("./middleware/authentication")
const { studentRouter } = require("./routes/student.route")
const { applicationtRoute } = require("./routes/application.route")
const { studentWork } = require("./routes/StudentWork.route")







app.use(cors({ origin: "*" }));

let PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.send("welcome to home")
})

// ------admin----//
app.use("/employee", studentRouter)
app.use("/admin", adminRouter)
app.use(authentication)
app.use("/adminwork", adminWork)
app.use("/application", applicationtRoute)
app.use("/studentwork", studentWork)


// Establish database connection before starting the server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to the database successfully.");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error connecting to the database:", error.message);
  });