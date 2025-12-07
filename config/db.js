const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();


const dbUrl = process.env.MONGO_URI;


mongoose.connect(dbUrl , (err)=>{
if (err)
{
    console.log(err)
}
else
{
    console.log("connected Success")
}

} )
