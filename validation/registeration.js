const validator = require("validator");
const isEmpty = require("is-empty")

function validateRegisterInput(data)
{
   let errors={}
   console.log(data);
   data.name = !isEmpty(data.name) ? data.name : ""
   data.email = !isEmpty(data.email) ? data.email : "";
   data.password = !isEmpty(data.password) ? data.password : "";
   data.password2 = !isEmpty(data.password2) ? data.password2 : "";

    //name
   if(validator.isEmpty(data.name))
   {
       errors.name="Name field is required";
   }
   //email

   if(validator.isEmpty(data.email))
   {
       errors.email= "Email field is required";
   }
   else if(!validator.isEmail(data.email))
   {
    errors.email = "Email is invalid";
   }

   //password
   
   if(validator.isEmpty(data.password))
   {
       errors.password= "Password field is required";
   }
   if (validator.isEmpty(data.password2)) {
    errors.password2 = "Confirm password field is required";
   }

   if (!validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password = "Password must be at least 6 characters";
   }

   if (!validator.equals(data.password, data.password2)) {
    errors.password2 = "Passwords must match";
   }

   return {
    errors,
    isValid: isEmpty(errors)
  };

}

module.exports=validateRegisterInput;