const express = require("express");
const { getAllUsers, getSingleUser, updateUser, deleteUser } = require("../controllers/userController");
const router = express.Router();

router.get("/users", getAllUsers);
router.get("/user", getSingleUser);
router.patch("/user/:email", updateUser);
router.delete("/user/:email", deleteUser);

module.exports = router;
