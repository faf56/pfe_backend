const mongoose =require("mongoose")
const categorieSchema=mongoose.Schema({
nomcategorie:{ type: String, required: true,unique:true }
})
module.exports=mongoose.model('categorie',categorieSchema)