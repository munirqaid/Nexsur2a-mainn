const User = require("../../Schema/User.js");


const read = (req,res,next)=>{

     
    res.json(req.profile)

}

module.exports=read