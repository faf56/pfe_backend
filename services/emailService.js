const nodemailer = require("nodemailer")
const emailTemplates = require("../templates/emailTemplates")
const invoiceService = require("./invoiceService")

// Configurer le transporteur d'email
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

// Fonction pour envoyer un email d'activation de compte
exports.sendActivationEmail = async (user, host) => {
  try {
    const activationLink = `http://${host}/api/users/status/edit?email=${user.email}`
    const htmlContent = emailTemplates.getActivationEmailTemplate(user, activationLink)

    const mailOptions = {
      from: '"Perla Coif" <farahathimen67@gmail.com>',
      to: user.email,
      subject: "Activation de votre compte Perla Coif",
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email d'activation envoyé:", info.messageId)
    return info
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email d'activation:", error)
    throw error
  }
}

// Fonction pour envoyer un email de confirmation de commande avec facture
exports.sendOrderConfirmationEmail = async (order, user) => {
  try {
    // Générer la facture PDF
    const invoice = await invoiceService.generateInvoice(order, user)

    // Créer le contenu HTML de l'email
    const htmlContent = emailTemplates.getOrderConfirmationEmailTemplate(order, user)

    // Configurer les options d'email
    const mailOptions = {
      from: '"Perla Coif" <farahathimen67@gmail.com>',
      to: user.email,
      subject: `Confirmation de votre commande #${order._id}`,
      html: htmlContent,
      attachments: [
        {
          filename: invoice.filename,
          path: invoice.path,
          contentType: "application/pdf",
        },
      ],
    }

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions)
    console.log("Email de confirmation de commande envoyé:", info.messageId)

    // Supprimer le fichier de facture temporaire
    invoiceService.deleteInvoice(invoice.path)

    return info
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation de commande:", error)
    throw error
  }
}
