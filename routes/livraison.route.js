const express = require('express');
const router = express.Router();
const Livraison = require('../models/livraison');

// Afficher toutes les méthodes de livraison
router.get('/', async (req, res) => {
    try {
        const livraisons = await Livraison.find({}, null, { sort: { '_id': -1 } });
        res.status(200).json(livraisons);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// Ajouter une nouvelle méthode de livraison
router.post('/', async (req, res) => {
    try {
        const { titre, telephone, frais } = req.body;
        
        // Vérifier si une méthode avec ce titre existe déjà
        const existingLivraison = await Livraison.findOne({ titre });
        if (existingLivraison) {
            return res.status(400).json({ message: 'Une méthode de livraison avec ce titre existe déjà' });
        }
        
        const newLivraison = new Livraison({ 
            titre, 
            telephone, 
            frais: Number(frais) 
        });
        
        await newLivraison.save();
        res.status(201).json(newLivraison);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Rechercher une méthode de livraison par ID
router.get('/:livraisonId', async (req, res) => {
    try {
        const livraison = await Livraison.findById(req.params.livraisonId);
        
        if (!livraison) {
            return res.status(404).json({ message: 'Méthode de livraison non trouvée' });
        }
        
        res.status(200).json(livraison);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// Modifier une méthode de livraison
router.put('/:livraisonId', async (req, res) => {
    try {
        const { titre, telephone, frais } = req.body;
        
        // Vérifier si le titre est déjà utilisé par une autre méthode
        if (titre) {
            const existingLivraison = await Livraison.findOne({ 
                titre, 
                _id: { $ne: req.params.livraisonId } 
            });
            
            if (existingLivraison) {
                return res.status(400).json({ 
                    message: 'Une autre méthode de livraison avec ce titre existe déjà' 
                });
            }
        }
        
        const updatedLivraison = await Livraison.findByIdAndUpdate(
            req.params.livraisonId,
            { 
                titre, 
                telephone, 
                frais: frais ? Number(frais) : undefined 
            },
            { new: true, runValidators: true }
        );
        
        if (!updatedLivraison) {
            return res.status(404).json({ message: 'Méthode de livraison non trouvée' });
        }
        
        res.status(200).json(updatedLivraison);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Supprimer une méthode de livraison
router.delete('/:livraisonId', async (req, res) => {
    try {
        const livraison = await Livraison.findById(req.params.livraisonId);
        
        if (!livraison) {
            return res.status(404).json({ message: 'Méthode de livraison non trouvée' });
        }
        
        await Livraison.findByIdAndDelete(req.params.livraisonId);
        res.status(200).json({ message: 'Méthode de livraison supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Rechercher des méthodes de livraison par titre
router.get('/search/titre', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ message: 'Paramètre de recherche requis' });
        }
        
        const livraisons = await Livraison.find({
            titre: { $regex: q, $options: 'i' }
        });
        
        res.status(200).json({
            count: livraisons.length,
            results: livraisons
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Rechercher des méthodes de livraison par plage de frais
router.get('/search/frais', async (req, res) => {
    try {
        const { min, max } = req.query;
        
        if (!min && !max) {
            return res.status(400).json({ message: 'Au moins un paramètre de plage (min ou max) est requis' });
        }
        
        const query = {};
        
        if (min) {
            query.frais = { ...query.frais, $gte: Number(min) };
        }
        
        if (max) {
            query.frais = { ...query.frais, $lte: Number(max) };
        }
        
        const livraisons = await Livraison.find(query).sort({ frais: 1 });
        
        res.status(200).json({
            count: livraisons.length,
            results: livraisons
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;