const mongoose = require("mongoose");
const produit = require ('./produit.js')
const User = require ('./user.js');

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: ObjectId,
            ref: "User",
            required: true,
            },
            allProduct: [
                {
                id: { type: ObjectId, ref: "produit" },
                quantitiy: Number,
                price:Number
                },
                ],
        priceTotal: { // Prix sans livraison
            type: Number,
            required: true,
            default: 0,
        },
        deliveryFres: { // Frais de livraison
            type: Number,
            required: true,
            default: 0,
        },
        totalAmount: { // Prix total (produits + livraison)
            type: Number,
            required: true,
            default: 0,
        },
        status: {
            type: String,
            enum: ["En attente", "Confirmée", "Expédiée", "Livrée", "Annulée"],
            default: "En attente",
          },
          paymentMethod: {
            type: String,
            enum: ["Paiement en ligne", "Paiement à la livraison"],
            default: "Paiement à la livraison",
            required: true,
          },
          deliveryMode: {
            type: String,
            enum: ["Retrait en magasin", "Livraison à domicile à Sfax", "Livraison à domicile hors Sfax"],
            required: true,
          },
          shippingAddress: {
            adresse: { type: String, required: true },
            ville: { type: String, required: true },
            codepostal: { type: String, required: true },
            pays: { type: String, required: true, default: "Tunisie" },
            phone: {type: Number,required: true,},
          },
},
{ timestamps: true }
);
module.exports = mongoose.model("Order",orderSchema);