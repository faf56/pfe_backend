const express = require("express")
const router = express.Router()
const Produit = require("../models/produit")
const Marque = require("../models/marque")
const Scategorie = require("../models/scategorie")

// ✅ 1. Routes de recherche (DOIVENT ÊTRE EN PREMIER)
// Route de recherche améliorée
router.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.q

    // Validation du terme de recherche
    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Le terme de recherche est requis",
      })
    }

    // Recherche dans les collections liées
    const [scategories, marques] = await Promise.all([
      Scategorie.find({ nomscategorie: { $regex: searchTerm, $options: "i" } }),
      Marque.find({ nommarque: { $regex: searchTerm, $options: "i" } }),
    ])

    // Recherche principale
    const produits = await Produit.find({
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { scategorieID: { $in: scategories.map((sc) => sc._id) } },
        { marqueID: { $in: marques.map((m) => m._id) } },
      ],
    })
      .populate({
        path: "scategorieID",
        select: "nomscategorie",
      })
      .populate({
        path: "marqueID",
        select: "nommarque",
      })

    // Formatage de la réponse
    const response = {
      success: true,
      count: produits.length,
      results: produits,
    }

    if (produits.length === 0) {
      response.message = "Aucun résultat trouvé"
    }

    res.status(200).json(response)
  } catch (error) {
    console.error("Erreur recherche:", error)
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la recherche",
      error: error.message,
    })
  }
})

router.get("/scategorie/:id", async (req, res) => {
  try {
    const produits = await Produit.find({ scategorieID: req.params.id })
      .populate("scategorieID")
      .populate("marqueID")
      .exec()
    res.status(200).json(produits)
  } catch (error) {
    res
      .status(404)
      .json({ message: "Erreur lors de la recherche des produits par sous-catégorie", error: error.message })
  }
})

router.get("/marque/:id", async (req, res) => {
  try {
    const produits = await Produit.find({ marqueID: req.params.id })
      .populate("scategorieID")
      .populate("marqueID")
      .exec()
    res.status(200).json(produits)
  } catch (error) {
    res.status(404).json({ message: "Erreur lors de la recherche des produits par marque", error: error.message })
  }
})

// ✅ 2. Route pour récupérer les nouveaux produits
router.get("/new", async (req, res) => {
  try {
    const produits = await Produit.find({})
      .sort({ _id: -1 })
      .limit(15)
      .populate("scategorieID")
      .populate("marqueID")
      .exec()

    if (!produits || produits.length === 0) {
      return res.status(404).json({ message: "Aucun nouveau produit trouvé" })
    }

    res.status(200).json(produits)
  } catch (error) {
    console.error("Erreur lors de la récupération des nouveaux produits :", error)
    res.status(500).json({ message: "Erreur serveur", error: error.message })
  }
})

// ✅ 3. Routes CRUD
router.post("/", async (req, res) => {
  const nouvproduit = new Produit(req.body)
  try {
    const response = await nouvproduit.save()
    const produits = await Produit.findById(response._id).populate("scategorieID").populate("marqueID").exec()
    res.status(200).json(produits)
  } catch (error) {
    res.status(404).json({ message: "Impossible d'ajouter le produit", error: error.message })
  }
})

router.put("/:produitId", async (req, res) => {
  try {
    const art = await Produit.findByIdAndUpdate(req.params.produitId, { $set: req.body }, { new: true })
    const produits = await Produit.findById(art._id).populate("scategorieID").populate("marqueID").exec()
    res.status(200).json(produits)
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
})

router.delete("/:produitId", async (req, res) => {
  const id = req.params.produitId
  try {
    await Produit.findByIdAndDelete(id)
    res.status(200).json({ message: "Article supprimé avec succès." })
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
})

// ✅ 4. Chercher un article par ID (DOIT ÊTRE AVANT LA ROUTE GÉNÉRALE)
router.get("/:produitId", async (req, res) => {
  try {
    const art = await Produit.findById(req.params.produitId)
      .populate("marqueID", "nommarque")
      .populate("scategorieID", "nomscategorie")
    res.status(200).json(art)
  } catch (error) {
    res.status(404).json({ message: "Article non trouvé" })
  }
})

// ✅ 5. Afficher la liste des produits (DOIT ÊTRE EN DERNIER)
router.get("/", async (req, res) => {
  try {
    const produits = await Produit.find({}, null, { sort: { _id: -1 } })
      .populate("scategorieID")
      .populate("marqueID")
      .exec()
    res.status(200).json(produits)
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
})

module.exports = router

