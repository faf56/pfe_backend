const mongoose =require("mongoose")
const marqueSchema=mongoose.Schema({
nommarque:{ type: String, required: true,unique:true },
imagemarque :{ type: String, required: false }
})
module.exports=mongoose.model('marque',marqueSchema)