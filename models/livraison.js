const mongoose = require('mongoose')

const livraisonSchema = mongoose.Schema({
    titre: { 
        type: String, 
        required: true,
        unique: true
    },
    telephone: { 
        type: String, 
        required: true 
    },
    frais: { 
        type: Number, 
        required: true 
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Livraison', livraisonSchema)