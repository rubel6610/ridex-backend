const express = require('express');
require("dotenv").config();
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();


app.use(express.json())
app.use(cors())

app.get("/", (req,res)=>{
    console.log("server is running");
})

app.listen(port,()=>{
    console.log("server running on", port);
})