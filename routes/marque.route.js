var express = require('express');
var router = express.Router();
// Créer une instance de marque.
const Marque = require('../models/marque');
// afficher la liste des marque.
router.get('/',async(req,res,)=>{
    try {
        const mar = await Marque.find({}, null, {sort: {'_id': -1}})
        
        10
        res.status(200).json(mar);
        } catch (error) {
        res.status(404).json({ message: error.message });
        }
});
// ajouter une nouvelle marque
router.post('/', async (req, res) => {
    const { nommarque, imagemarque} = req.body;
    const newMarque = new Marque({nommarque:nommarque,imagemarque:imagemarque})
    try {
        await newMarque.save();
        res.status(200).json(newMarque);
    } catch (error) {
        res.status(404).json({message: error.message});
    }
    
});
// chercher une marque
router.get('/:marqueId',async(req, res)=>{
    try {
        const mar = await Marque.findById(req.params.MarqueId);
        
        res.status(200).json(mar);
        } catch (error) {
        res.status(404).json({ message: error.message });
        }
});
// modifier une marque
router.put('/:marqueId', async (req, res)=> {
    try {
        const mar1 = await Marque.findByIdAndUpdate(
            req.params.marqueIdId,
            {$set: req.body},
            {new: true}
        );
        res.status(200).json(mar1);
    } catch (error) {
        res.status(404).json({ message: error.message });
        }
});
// Supprimer une marque
router.delete('/:marqueId', async (req, res)=> {
    try{
    const id = req.params.marqueIdId;
    await Marque.findByIdAndDelete(id);
    res.json({ message: "marque deleted successfully." });
    }catch(error){
        res.status(404).json({ message: error.message });
    }
});
module.exports = router;