var express = require('express');
var router = express.Router();
const Marque = require('../models/marque');

// Afficher la liste des marques
router.get('/', async (req, res) => {
    try {
        const mar = await Marque.find({}, null, { sort: { '_id': -1 } });
        res.status(200).json(mar);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// Ajouter une nouvelle marque
router.post('/', async (req, res) => {
    const { nommarque, imagemarque } = req.body;
    const newMarque = new Marque({ 
        nommarque: nommarque,
        imagemarque: imagemarque 
    });
    
    try {
        await newMarque.save();
        res.status(200).json(newMarque);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Chercher une marque
router.get('/:marqueId', async (req, res) => {
    try {
        const mar = await Marque.findById(req.params.marqueId);
        if (!mar) {
            return res.status(404).json({ message: "Marque non trouvée" });
        }
        res.status(200).json(mar);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Modifier une marque
router.put('/:marqueId', async (req, res) => {
    try {
        const updatedMarque = await Marque.findByIdAndUpdate(
            req.params.marqueId, // Correction ici (supprimé le Id en trop)
            { $set: req.body },
            { new: true, runValidators: true } // Ajout de runValidators
        );
        
        if (!updatedMarque) {
            return res.status(404).json({ message: "Marque non trouvée" });
        }
        
        res.status(200).json(updatedMarque);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Supprimer une marque
router.delete('/:marqueId', async (req, res) => {
    try {
        const id = req.params.marqueId; // Correction ici (supprimé le Id en trop)
        const deletedMarque = await Marque.findByIdAndDelete(id);
        
        if (!deletedMarque) {
            return res.status(404).json({ message: "Marque non trouvée" });
        }
        
        res.json({ message: "Marque supprimée avec succès", deletedMarque });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;