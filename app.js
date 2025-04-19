const express=require('express')
const mongoose=require('mongoose')
const app=express()
const path = require('path');
const CategorieRouter=require("./routes/categorie.route")
const scategorieRouter = require("./routes/scategorie.route")
const MarqueRouter = require("./routes/marque.route")
const ProduitRouter = require("./routes/produit.route")
const userRouter =require("./routes/user.route")
const contactRoutes = require("./routes/contact.route")
const livraisonRoutes = require('./routes/livraison.route');
const orderRoutes = require('./routes/order.route');
const dotenv=require("dotenv")
const cors=require("cors")
app.use(express.json())
app.use(cors())
dotenv.config()

app.get('/',(req,res)=>{
    res.send("bienvenue dans notre site")
})
//connection base de donnée
mongoose.connect(process.env.DATABASECLOUD)
.then(()=>{console.log("connection a la base de données reussie")})
.catch((Error)=>{console.log("impossible de se connecter al la base de données",Error)
    process.exit()
})
app.use("/api/categories",CategorieRouter)
app.use('/api/scategories', scategorieRouter)
app.use("/api/marques",MarqueRouter)
app.use("/api/produits", ProduitRouter)
app.use('/api/users', userRouter);
app.use('/api/livraisons', livraisonRoutes);
app.use('/api/orders', orderRoutes);
app.use("/api/contact", contactRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.listen(process.env.PORT,function(){
    console.log("serveur is listen on port 2000")
})
module.exports=app;
