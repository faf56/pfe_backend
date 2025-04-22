const express = require("express")
const router = express.Router()
const User = require("../models/user")
const Produit = require("../models/produit")

const {verifyToken} =require("../middleware/verifytoken")

// Middleware pour vérifier le token JWT


// Récupérer tous les favoris d'un utilisateur
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.iduser
    const user = await User.findById(userId).populate({
      path: "favorites",
      populate: [
        { path: "marqueID", select: "nommarque" },
        { path: "scategorieID", select: "nomscategorie" },
      ],
    })

    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" })
    }

    res.status(200).json({
      success: true,
      favorites: user.favorites || [],
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des favoris:", error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Ajouter un produit aux favoris
router.post("/add/:productId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.iduser
    const productId = req.params.productId

    // Vérifier si le produit existe
    const product = await Produit.findById(productId)
    if (!product) {
      return res.status(404).json({ success: false, message: "Produit non trouvé" })
    }

    // Ajouter le produit aux favoris s'il n'y est pas déjà
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" })
    }

    // Vérifier si le produit est déjà dans les favoris
    if (user.favorites && user.favorites.includes(productId)) {
      return res.status(400).json({ success: false, message: "Ce produit est déjà dans vos favoris" })
    }

    // Ajouter le produit aux favoris
    user.favorites = user.favorites || []
    user.favorites.push(productId)
    await user.save()

    res.status(200).json({
      success: true,
      message: "Produit ajouté aux favoris avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de l'ajout aux favoris:", error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Supprimer un produit des favoris
router.delete("/remove/:productId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.iduser
    const productId = req.params.productId

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" })
    }

    // Vérifier si le produit est dans les favoris
    if (!user.favorites || !user.favorites.includes(productId)) {
      return res.status(400).json({ success: false, message: "Ce produit n'est pas dans vos favoris" })
    }

    // Supprimer le produit des favoris
    user.favorites = user.favorites.filter((id) => id.toString() !== productId)
    await user.save()

    res.status(200).json({
      success: true,
      message: "Produit supprimé des favoris avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de la suppression des favoris:", error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Vérifier si un produit est dans les favoris
router.get("/check/:productId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.iduser
    const productId = req.params.productId

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" })
    }

    const isFavorite = user.favorites && user.favorites.some((id) => id.toString() === productId)

    res.status(200).json({
      success: true,
      isFavorite,
    })
  } catch (error) {
    console.error("Erreur lors de la vérification des favoris:", error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Supprimer tous les favoris
router.delete("/clear", verifyToken, async (req, res) => {
  try {
    const userId = req.user.iduser

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" })
    }

    // Vider la liste des favoris
    user.favorites = []
    await user.save()

    res.status(200).json({
      success: true,
      message: "Tous les favoris ont été supprimés avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de la suppression de tous les favoris:", error)
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
