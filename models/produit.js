const mongoose =require("mongoose")
const Scategorie =require("./scategorie.js");
const Marque =require("./marque.js");


const produitSchema=mongoose.Schema({
    title:{ type: String,required: true},
    description: { type : String, required: true},
    prix:{ type: Number, required: false },
    stock:{type: Number, required: false},
    marqueID:{type:mongoose.Schema.Types.ObjectId,ref:Marque},
    scategorieID: {type:mongoose.Schema.Types.ObjectId,ref:Scategorie},
    imagepro:{ type: String, required: false }
})
module.exports=mongoose.model('produit',produitSchema)