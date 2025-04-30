const express = require("express")
const router = express.Router()
const User = require("../models/user")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const emailService = require("../services/emailService")

// créer un nouvel utilisateur
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstname, lastname, role, isActive, telephone, userVille, sexe } = req.body;

    // Validation des champs obligatoires
    if (!email || !password || !firstname || !lastname) {
      return res.status(400).send({ 
        success: false, 
        message: "Tous les champs obligatoires doivent être remplis" 
      });
    }

    // Vérification de l'existence de l'utilisateur
    const user = await User.findOne({ email });
    if (user) {
      return res.status(409).send({  // 409 Conflict est plus approprié que 404
        success: false, 
        message: "Cet email est déjà utilisé. Veuillez utiliser un autre email ou vous connecter."
      });
    }

    // Création du nouvel utilisateur
    const newUser = new User({
      email,
      password,
      firstname,
      lastname,
      role: role || "user",
      isActive: isActive !== undefined ? isActive : false,
      telephone,
      userVille,
      sexe,
    });

    const createdUser = await newUser.save();

    // Envoi de l'email d'activation
    let emailSent = false;
    if (!newUser.isActive) {
      try {
        await emailService.sendActivationEmail(newUser, req.headers.host);
        emailSent = true;
        console.log("Email d'activation envoyé avec succès");
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email d'activation:", emailError);
        // On continue malgré l'erreur d'envoi d'email
      }
    }

    return res.status(201).send({
      success: true,
      message: emailSent 
        ? "Inscription réussie! Un email d'activation a été envoyé à votre adresse email." 
        : "Inscription réussie! Veuillez contacter l'administrateur pour activer votre compte.",
      user: {
        _id: createdUser._id,
        email: createdUser.email,
        firstname: createdUser.firstname,
        lastname: createdUser.lastname,
        role: createdUser.role,
        isActive: createdUser.isActive,
        telephone: createdUser.telephone,
        userVille: createdUser.userVille,
        sexe: createdUser.sexe,
      },
      emailSent // Ajout d'un flag pour indiquer si l'email a été envoyé
    });

  } catch (err) {
    console.error("Erreur lors de l'inscription:", err);
    
    // Gestion spécifique des erreurs de validation Mongoose
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(el => el.message);
      return res.status(400).send({ 
        success: false, 
        message: "Erreur de validation",
        errors: errors 
      });
    }

    res.status(500).send({ 
      success: false, 
      message: "Une erreur est survenue lors de l'inscription. Veuillez réessayer plus tard." 
    });
  }
});

// afficher la liste des utilisateurs.
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.status(200).json(users)
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
})

// Obtenir un utilisateur par ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password")
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" })
    }
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Mettre à jour un utilisateur
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { password, ...userData } = req.body

    // Si un nouveau mot de passe est fourni, le hacher
    if (password) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)
      userData.password = hashedPassword
    }

    const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true }).select("-password")

    if (!updatedUser) {
      return res.status(404).send({ success: false, message: "User not found" })
    }

    return res.status(200).send({ success: true, user: updatedUser })
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message })
  }
})

// Supprimer un utilisateur
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const deletedUser = await User.findByIdAndDelete(id)

    if (!deletedUser) {
      return res.status(404).send({ success: false, message: "User not found" })
    }

    return res.status(200).send({ success: true, message: "User deleted successfully" })
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message })
  }
})

/**
 * as an admin i can disable or enable an account
 */
router.get("/status/edit/", async (req, res) => {
  try {
    const email = req.query.email
    console.log(email)
    const user = await User.findOne({ email })
    user.isActive = !user.isActive
    await user.save()
    res.status(200).send({ success: true, user })
  } catch (err) {
    return res.status(404).send({ success: false, message: err })
  }
})

// Update user role
router.put("/role/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!role || !["admin", "user"].includes(role)) {
      return res.status(400).send({ success: false, message: "Invalid role" })
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password")

    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" })
    }

    return res.status(200).send({ success: true, user })
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message })
  }
})

// se connecter
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(404).send({ success: false, message: "All fields are required" })
    }

    const user = await User.findOne({ email }).select("+password").select("+isActive")

    if (!user) {
      return res.status(404).send({ success: false, message: "Account doesn't exists" })
    } else {
      const isCorrectPassword = await bcrypt.compare(password, user.password)
      if (isCorrectPassword) {
        delete user._doc.password
        if (!user.isActive)
          return res
            .status(200)
            .send({ success: false, message: "Your account is inactive, Please contact your administrator" })

        const token = jwt.sign({ iduser: user._id, name: user.firstname, role: user.role }, process.env.SECRET, {
          expiresIn: "1h",
        })

        return res.status(200).send({ success: true, user, token })
      } else {
        return res.status(404).send({ success: false, message: "Please verify your credentials" })
      }
    }
  } catch (err) {
    return res.status(404).send({ success: false, message: err.message })
  }
})

module.exports = router
