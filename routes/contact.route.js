const express = require("express")
const router = express.Router()
const Contact = require("../models/contact")
const nodemailer = require("nodemailer")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Configuration de multer pour gérer les fichiers uploadés
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/contacts")
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + "-" + file.originalname)
  },
})

const upload = multer({ storage: storage })

// Configuration du transporteur Nodemailer avec les mêmes paramètres que votre backend
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "farahathimen67@gmail.com",
    pass: "qrxr xakx bmog lwsv",
  },
  tls: {
    rejectUnauthorized: false,
  },
})

// Envoyer un message de contact
router.post("/send", upload.single("attachment"), async (req, res) => {
  try {
    const { subject, email, orderRef, message, captcha } = req.body
    const attachment = req.file

    // Vérifier les données requises
    if (!email || !message) {
      return res.status(400).json({ success: false, message: "Email et message sont requis" })
    }

    // Vérifier le captcha (dans un environnement réel, vous devriez vérifier avec l'API Google)
    if (!captcha) {
      return res.status(400).json({ success: false, message: "Captcha non validé" })
    }

    // Créer un nouvel objet contact
    const newContact = new Contact({
      subject,
      email,
      orderRef,
      message,
      attachment: attachment
        ? {
            filename: attachment.originalname,
            path: attachment.path,
            contentType: attachment.mimetype,
          }
        : undefined,
    })

    // Sauvegarder le contact dans la base de données
    const savedContact = await newContact.save()

    // Préparer les pièces jointes pour l'email
    const emailAttachments = []
    if (attachment) {
      emailAttachments.push({
        filename: attachment.originalname,
        path: attachment.path,
      })
    }

    // Construire le contenu de l'email
    const emailContent = `
      Nouveau message de contact:
      
      De: ${email}
      Sujet: ${subject}
      ${orderRef ? `Référence de commande: ${orderRef}` : ""}
      
      Message:
      ${message}
    `

    // Préparer les options d'email
    const mailOptions = {
      from: '"Formulaire de contact Perlacoif" <farahathimen67@gmail.com>',
      to: "info@beautystore.tn", // Remplacez par l'adresse email où vous souhaitez recevoir les messages
      replyTo: email,
      subject: `[Contact Perlacoif] ${subject}`,
      text: emailContent,
      attachments: emailAttachments,
    }

    // Envoyer l'email
    await transporter.sendMail(mailOptions)

    // Envoyer un email de confirmation à l'utilisateur
    const confirmationMailOptions = {
      from: '"Perlacoif" <farahathimen67@gmail.com>',
      to: email,
      subject: "Confirmation de votre message",
      text: `
        Bonjour,
        
        Nous avons bien reçu votre message concernant "${subject}".
        
        Notre équipe va l'examiner et vous répondra dans les plus brefs délais.
        
        Merci de nous avoir contactés.
        
        L'équipe Perlacoif
      `,
    }

    await transporter.sendMail(confirmationMailOptions)

    return res.status(200).json({
      success: true,
      message: "Message envoyé avec succès",
      contact: savedContact,
    })
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error)
    return res.status(500).json({
      success: false,
      message: error.message || "Une erreur est survenue lors de l'envoi du message",
    })
  }
})

// Récupérer tous les messages de contact (pour l'admin)
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 })
    res.status(200).json({ success: true, contacts })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Récupérer un message de contact par ID
router.get("/:id", async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
    if (!contact) {
      return res.status(404).json({ success: false, message: "Message non trouvé" })
    }
    res.status(200).json({ success: true, contact })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Mettre à jour le statut d'un message
router.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body
    if (!status || !["new", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({ success: false, message: "Statut invalide" })
    }

    const updatedContact = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true })

    if (!updatedContact) {
      return res.status(404).json({ success: false, message: "Message non trouvé" })
    }

    res.status(200).json({ success: true, contact: updatedContact })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Supprimer un message
router.delete("/:id", async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)

    if (!contact) {
      return res.status(404).json({ success: false, message: "Message non trouvé" })
    }

    // Supprimer le fichier joint s'il existe
    if (contact.attachment && contact.attachment.path) {
      try {
        fs.unlinkSync(contact.attachment.path)
      } catch (err) {
        console.error("Erreur lors de la suppression du fichier:", err)
      }
    }

    await Contact.findByIdAndDelete(req.params.id)
    res.status(200).json({ success: true, message: "Message supprimé avec succès" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
