const Post = require('../../Schema/Post.js.js.js.js')



const remove = async (req, res) => {
  let post = req.post
  try{
    let deletedPost = await post.remove()
    res.json(deletedPost)
  }catch(err){
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

module.exports=remove