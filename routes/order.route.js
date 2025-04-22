const express = require("express")
const router = express.Router()
const Order = require("../models/order")
const Produit = require("../models/produit")
const Livraison = require("../models/livraison")
const User = require("../models/user")
const emailService = require("../services/emailService")

// Get all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find({}, null, { sort: { _id: -1 } })
      .populate("userID", "firstname lastname email telephone")
      .populate("livraisonID")
      .populate({
        path: "produits.produitID",
        select: "title imagepro prix prixPromo",
      })
      .exec()
    res.status(200).json(orders)
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
})

// Create a new order
router.post("/", async (req, res) => {
  try {
    const { userID, produits, sousTotal, methodePaiement, livraisonID, adresseLivraison } = req.body

    // Validate products and calculate totals
    const orderItems = []
    let calculatedSubtotal = 0

    for (const item of produits) {
      const produit = await Produit.findById(item.produitID)
      if (!produit) {
        return res.status(404).json({ message: `Produit avec ID ${item.produitID} non trouvé` })
      }

      // Check stock availability
      if (produit.stock < item.quantite) {
        return res.status(400).json({
          message: `Stock insuffisant pour ${produit.title}. Disponible: ${produit.stock}`,
        })
      }

      // Determine which price to use (promotional or regular)
      const hasPromo =
        produit.prixPromo !== null &&
        produit.prixPromo !== undefined &&
        produit.prixPromo > 0 &&
        produit.prixPromo < produit.prix
      const finalPrice = hasPromo ? produit.prixPromo : produit.prix

      const itemTotal = finalPrice * item.quantite
      calculatedSubtotal += itemTotal

      orderItems.push({
        produitID: item.produitID,
        quantite: item.quantite,
        prix: finalPrice, // Use the promotional price if available
        total: itemTotal,
      })

      // Update product stock
      await Produit.findByIdAndUpdate(item.produitID, { $inc: { stock: -item.quantite } })
    }

    // Get shipping fee from the selected shipping method
    const livraison = await Livraison.findById(livraisonID)
    if (!livraison) {
      return res.status(404).json({ message: "Méthode de livraison non trouvée" })
    }
    const fraisLivraison = livraison.frais

    // Vérifier si la livraison est gratuite (sousTotal >= 99)
    const livraisonGratuite = sousTotal >= 99

    // Calculate total (si livraison gratuite, on n'ajoute pas les frais)
    const total = livraisonGratuite ? calculatedSubtotal : calculatedSubtotal + fraisLivraison

    // Create order
    const newOrder = new Order({
      userID,
      produits: orderItems,
      sousTotal: calculatedSubtotal,
      fraisLivraison,
      total,
      methodePaiement,
      livraisonID,
      adresseLivraison: livraison.titre !== "Retrait en magasin" ? adresseLivraison : null,
      livraisonGratuite,
    })

    await newOrder.save()

    // Return the populated order
    const populatedOrder = await Order.findById(newOrder._id)
      .populate("userID", "firstname lastname email telephone")
      .populate("livraisonID")
      .populate({
        path: "produits.produitID",
        select: "title imagepro prix prixPromo",
      })
      .exec()

    // Envoyer un email de confirmation avec la facture
    try {
      const user = await User.findById(userID)
      if (user) {
        await emailService.sendOrderConfirmationEmail(populatedOrder, user)
        console.log("Email de confirmation de commande envoyé avec succès")
      }
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email de confirmation:", emailError)
      // On continue malgré l'erreur d'envoi d'email
    }

    res.status(201).json(populatedOrder)
  } catch (error) {
    console.error("Erreur lors de la création de la commande:", error)
    res.status(500).json({ message: error.message })
  }
})

// Get orders by user
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userID: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("userID", "firstname lastname email telephone")
      .populate("livraisonID")
      .populate({
        path: "produits.produitID",
        select: "title imagepro prix prixPromo",
      })
      .exec()
    res.status(200).json(orders)
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
})

// Get a specific order
router.get("/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("userID", "firstname lastname email telephone")
      .populate("livraisonID")
      .populate({
        path: "produits.produitID",
        select: "title imagepro prix prixPromo",
      })
      .exec()

    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée" })
    }

    res.status(200).json(order)
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
})

// Update order status
router.put("/:orderId/status", async (req, res) => {
  try {
    const { statut } = req.body

    if (!["en_attente", "confirmee", "en_preparation", "expediee", "livree", "annulee"].includes(statut)) {
      return res.status(400).json({ message: "Statut de commande invalide" })
    }

    const order = await Order.findByIdAndUpdate(req.params.orderId, { statut }, { new: true })
      .populate("userID", "firstname lastname email telephone")
      .populate("livraisonID")
      .populate({
        path: "produits.produitID",
        select: "title imagepro prix prixPromo",
      })
      .exec()

    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée" })
    }

    res.status(200).json(order)
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
})

// Cancel an order (with stock restoration)
router.put("/:orderId/cancel", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)

    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée" })
    }

    if (order.statut === "livree") {
      return res.status(400).json({ message: "Impossible d'annuler une commande déjà livrée" })
    }

    // Restore product stock
    for (const item of order.produits) {
      await Produit.findByIdAndUpdate(item.produitID, { $inc: { stock: item.quantite } })
    }

    // Update order status
    order.statut = "annulee"
    await order.save()

    const updatedOrder = await Order.findById(order._id)
      .populate("userID", "firstname lastname email telephone")
      .populate("livraisonID")
      .populate({
        path: "produits.produitID",
        select: "title imagepro prix prixPromo",
      })
      .exec()

    res.status(200).json(updatedOrder)
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
})

module.exports = router
