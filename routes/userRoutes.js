const express = require("express");
const router = express.Router();
const { getAllUsers, getSingleUser, updateUser, deleteUser, getMessagedUsers } = require("../controllers/userController");

router.get("/users", getAllUsers);
router.get("/user", getSingleUser);
router.get("/users/messaged", getMessagedUsers);
router.put("/user/:id", updateUser);
router.delete("/user/:id", deleteUser);

module.exports = router;
