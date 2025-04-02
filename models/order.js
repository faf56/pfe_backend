const mongoose = require('mongoose')
const User = require('./user')
const Produit = require('./produit')

// Schema for order items (products in the order)
const OrderItemSchema = new mongoose.Schema({
    produitID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'produit', 
        required: true 
    },
    quantite: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    prix: { 
        type: Number, 
        required: true 
    },
    total: { 
        type: Number, 
        required: true 
    }
})

// Schema for shipping address
const AdresseLivraisonSchema = new mongoose.Schema({
    ville: { 
        type: String, 
        required: true 
    },
    rue: { 
        type: String, 
        required: true 
    },
    codePostal: { 
        type: String, 
        required: true 
    },
    telephone: { 
        type: String, 
        required: true 
    }
})

const orderSchema = mongoose.Schema({
    // Client information
    userID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    // Order items
    produits: [OrderItemSchema],
    
    // Order totals
    sousTotal: { 
        type: Number, 
        required: true 
    },
    fraisLivraison: { 
        type: Number, 
        required: true, 
        default: 0 
    },
    total: { 
        type: Number, 
        required: true 
    },
    
    // Payment information
    methodePaiement: { 
        type: String, 
        enum: ['en_ligne', 'comptant_livraison'], 
        default: 'comptant_livraison', 
        required: true 
    },
    
    // Shipping information
    livraisonID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Livraison',
        required: true
    },
    adresseLivraison: {
        type: AdresseLivraisonSchema,
        required: function() {
            // L'adresse est requise sauf si c'est un retrait en magasin
            return this.livraisonID !== null;
        }
    },
    
    // Order status
    statut: { 
        type: String, 
        enum: ['en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee'], 
        default: 'en_attente', 
        required: true 
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Order', orderSchema)