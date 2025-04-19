const express = require("express")
const router = express.Router()
const User = require("../models/user")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "farahathimen67@gmail.com",
    pass: "qrxr xakx bmog lwsv",
  },
  tls: {
    rejectUnauthorized: false,
  },
})

// créer un nouvel utilisateur
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstname, lastname, role, isActive, telephone, userVille, sexe } = req.body
    const user = await User.findOne({ email })
    if (user) return res.status(404).send({ success: false, message: "User already exists" })

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
    })

    const createdUser = await newUser.save()

    // Envoyer l'e-mail de confirmation de l'inscription si le compte n'est pas déjà actif
    if (!newUser.isActive) {
      var mailOption = {
        from: '"verify your email " <farahathimen67@gmail.com>',
        to: newUser.email,
        subject: "vérification your email ",
        html: `<h2>${newUser.firstname}! thank you for registrering on our website</h2>
        <h4>please verify your email to procced.. </h4>
        <a href="http://${req.headers.host}/api/users/status/edit?email=${newUser.email}">click here</a>`,
      }

      transporter.sendMail(mailOption, (error, info) => {
        if (error) {
          console.log(error)
        } else {
          console.log("verification email sent to your gmail account ")
        }
      })
    }

    return res.status(201).send({
      success: true,
      message: "Account created successfully",
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
    })
  } catch (err) {
    console.log(err)
    res.status(500).send({ success: false, message: err.message })
  }
})

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
