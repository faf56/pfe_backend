const express = require('express');
const router = express.Router();
const Produit = require("../models/produit");

// ✅ 1. Afficher la liste des produits (DOIT ÊTRE EN DERNIER)
router.get('/', async (req, res) => {
    try {
        const produits = await Produit.find({}, null, { sort: { '_id': -1 } })
            .populate("scategorieID")
            .populate("marqueID")
            .exec();
        res.status(200).json(produits);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// ✅ 2. Routes de recherche (AVANT `/produitId`)
router.get('/scategorie/:id', async (req, res) => {
    try {
        const produits = await Produit.find({ scategorieID: req.params.id })
            .populate("scategorieID")
            .populate("marqueID")
            .exec();
        res.status(200).json(produits);
    } catch (error) {
        res.status(404).json({ message: "Erreur lors de la recherche des produits par sous-catégorie", error: error.message });
    }
});

router.get('/marque/:id', async (req, res) => {
    try {
        const produits = await Produit.find({ marqueID: req.params.id })
            .populate("scategorieID")
            .populate("marqueID")
            .exec();
        res.status(200).json(produits);
    } catch (error) {
        res.status(404).json({ message: "Erreur lors de la recherche des produits par marque", error: error.message });
    }
});

// ✅ 3. Route pour récupérer les nouveaux produits
router.get('/new', async (req, res) => {
    try {
        const produits = await Produit.find({})
            .sort({ _id: -1 })
            .limit(10)
            .populate("scategorieID")
            .populate("marqueID")
            .exec();

        if (!produits || produits.length === 0) {
            return res.status(404).json({ message: "Aucun nouveau produit trouvé" });
        }

        res.status(200).json(produits);
    } catch (error) {
        console.error("Erreur lors de la récupération des nouveaux produits :", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// ✅ 4. Routes CRUD (APRÈS LES ROUTES SPÉCIFIQUES)
router.post('/', async (req, res) => {
    const nouvproduit = new Produit(req.body);
    try {
        const response = await nouvproduit.save();
        const produits = await Produit.findById(response._id).populate("scategorieID").populate("marqueID").exec();
        res.status(200).json(produits);
    } catch (error) {
        res.status(404).json({ message: "Impossible d'ajouter le produit", error: error.message });
    }
});

router.put('/:produitId', async (req, res) => {
    try {
        const art = await Produit.findByIdAndUpdate(
            req.params.produitId,
            { $set: req.body },
            { new: true }
        );
        const produits = await Produit.findById(art._id).populate("scategorieID").populate("marqueID").exec();
        res.status(200).json(produits);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

router.delete('/:produitId', async (req, res) => {
    const id = req.params.produitId;
    try {
        await Produit.findByIdAndDelete(id);
        res.status(200).json({ message: "Article supprimé avec succès." });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// ✅ 5. Dernièrement, chercher un article par ID (DOIT ÊTRE À LA FIN)
router.get('/:produitId', async (req, res) => {
    try {
        const art = await Produit.findById(req.params.produitId);
        res.status(200).json(art);
    } catch (error) {
        res.status(404).json({ message: "Article non trouvé" });
    }
});

module.exports = router;
