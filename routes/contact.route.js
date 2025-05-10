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
    const uploadDir = path.join(__dirname, "../Uploads/contacts")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + "-" + file.originalname)
  },
})

// Filtrer les types de fichiers autorisés
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "image/gif",
    "application/vnd.drawio",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non pris en charge. Seuls les fichiers JPEG, PNG, PDF, GIF et Draw.io sont autorisés."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})

// Configuration du transporteur Nodemailer
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
    const { subject, email, orderRef, message } = req.body
    const attachment = req.file

    if (!email || !message) {
      return res.status(400).json({ success: false, message: "Email et message sont requis" })
    }

    // Ajouter des logs pour déboguer le fichier téléversé
    console.log("Fichier téléversé:", attachment);
    if (attachment) {
      console.log("Taille du fichier:", attachment.size);
      console.log("Type MIME:", attachment.mimetype);
      console.log("Chemin du fichier:", attachment.path);
      // Vérifier si le fichier existe et a une taille non nulle
      const stats = fs.statSync(attachment.path);
      console.log("Taille réelle sur disque:", stats.size);
      if (stats.size === 0) {
        throw new Error("Le fichier téléversé est vide");
      }
    }

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

    const savedContact = await newContact.save()

    const emailAttachments = []
    if (attachment) {
      emailAttachments.push({
        filename: attachment.originalname,
        path: attachment.path,
      })
    }

    const emailContent = `
      Nouveau message de contact:
      
      De: ${email}
      Sujet: ${subject}
      ${orderRef ? `Référence de commande: ${orderRef}` : ""}
      
      Message:
      ${message}
    `

    const mailOptions = {
      from: '"Formulaire de contact Perlacoif" <farahathimen67@gmail.com>',
      to: "info@beautystore.tn",
      replyTo: email,
      subject: `[Contact Perlacoif] ${subject}`,
      text: emailContent,
      attachments: emailAttachments,
    }

    await transporter.sendMail(mailOptions)

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

// Récupérer tous les messages de contact
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

// Télécharger les pièces jointes
router.get("/attachment/:id", async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
    if (!contact || !contact.attachment) {
      return res.status(404).json({ success: false, message: "Pièce jointe non trouvée" })
    }

    const filePath = contact.attachment.path
    const fileName = contact.attachment.filename
    let contentType = contact.attachment.contentType

    // Gestion spéciale pour les fichiers Draw.io
    if (fileName.endsWith(".drawio")) {
      contentType = "application/vnd.drawio";
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Fichier non trouvé sur le serveur" })
    }

    // Ajouter des logs pour déboguer le téléchargement
    console.log("Téléchargement du fichier:", filePath);
    console.log("Content-Type:", contentType);
    console.log("Nom du fichier:", fileName);
    const stats = fs.statSync(filePath);
    console.log("Taille du fichier sur disque:", stats.size);
    if (stats.size === 0) {
      return res.status(500).json({ success: false, message: "Le fichier est vide" });
    }

    res.setHeader("Content-Type", contentType)
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)

    const fileStream = fs.createReadStream(filePath)
    fileStream.on("error", (err) => {
      console.error("Erreur lors de la lecture du fichier:", err);
      res.status(500).json({ success: false, message: "Erreur lors de la lecture du fichier" });
    });
    fileStream.pipe(res)
  } catch (error) {
    console.error("Erreur lors du téléchargement de la pièce jointe:", error)
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router