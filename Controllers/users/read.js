const User = require("../../Schema/User.js.js.js.js");


const read = (req,res,next)=>{

     
    res.json(req.profile)

}

module.exports=read