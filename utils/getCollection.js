const { getDb } = require("../config/db")

const getCollection = (name)=>{
    const db = getDb();
    return db.collection(name)
}

module.exports = {getCollection}