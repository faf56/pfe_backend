const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")

// Fonction pour générer une facture PDF
exports.generateInvoice = async (order, user) => {
  return new Promise((resolve, reject) => {
    try {
      // Créer un dossier temporaire pour les factures si nécessaire
      const tempDir = path.join(__dirname, "../temp")
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      // Nom du fichier de facture
      const invoiceFileName = `facture-${order._id}.pdf`
      const invoicePath = path.join(tempDir, invoiceFileName)

      // Créer un nouveau document PDF
      const doc = new PDFDocument({ margin: 50 })

      // Pipe le PDF vers un fichier
      const stream = fs.createWriteStream(invoicePath)
      doc.pipe(stream)

      // Ajouter le logo et les informations d'en-tête
      doc.fontSize(20).text("Perla Coif", { align: "center" })
      doc.fontSize(10).text("Kassas Nº5 entre Rte Ain et Afrane", { align: "center" })
      doc.text("Sfax, Tunisia", { align: "center" })
      doc.text("steperlacoiff@gmail.com", { align: "center" })
      doc.text("+216 71 123 456", { align: "center" })

      doc.moveDown()
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown()

      // Informations de la facture
      doc.fontSize(16).text("FACTURE", { align: "left" })
      doc.moveDown()
      doc.fontSize(10).text(`N° Commande: ${order._id}`)
      doc.text(
        `Date: ${new Date(order.createdAt).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      )
      doc.moveDown()

      // Informations du client
      doc.fontSize(12).text("Informations du client", { underline: true })
      doc.fontSize(10).text(`Nom: ${user.firstname} ${user.lastname}`)
      doc.text(`Email: ${user.email}`)
      doc.text(`Téléphone: ${user.telephone || "Non spécifié"}`)
      doc.moveDown()

      // Informations de livraison
      if (order.adresseLivraison) {
        doc.fontSize(12).text("Adresse de livraison", { underline: true })
        doc.fontSize(10).text(`Adresse: ${order.adresseLivraison.rue}`)
        doc.text(`Ville: ${order.adresseLivraison.ville}, ${order.adresseLivraison.codePostal}`)
        doc.text(`Téléphone: ${order.adresseLivraison.telephone}`)
        doc.moveDown()
      }

      // Tableau des produits
      doc.fontSize(12).text("Détails de la commande", { underline: true })
      doc.moveDown()

      // En-têtes du tableau
      const tableTop = doc.y
      const tableHeaders = ["Produit", "Prix unitaire", "Quantité", "Total"]
      const columnWidths = [250, 100, 70, 80]

      let currentY = tableTop

      // Dessiner l'en-tête du tableau
      doc.fontSize(10).font("Helvetica-Bold")
      tableHeaders.forEach((header, i) => {
        const x = 50 + columnWidths.slice(0, i).reduce((sum, width) => sum + width, 0)
        doc.text(header, x, currentY, { width: columnWidths[i], align: i > 0 ? "right" : "left" })
      })

      currentY += 20
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke()
      currentY += 10

      // Dessiner les lignes du tableau
      doc.font("Helvetica")
      for (const item of order.produits) {
        const productName = item.produitID?.title || "Produit"
        const price = item.prix?.toFixed(3) || "0.000"
        const quantity = item.quantite
        const total = (item.prix * item.quantite).toFixed(3)

        doc.text(productName, 50, currentY, { width: columnWidths[0], align: "left" })
        doc.text(`${price} DT`, 50 + columnWidths[0], currentY, { width: columnWidths[1], align: "right" })
        doc.text(quantity.toString(), 50 + columnWidths[0] + columnWidths[1], currentY, {
          width: columnWidths[2],
          align: "right",
        })
        doc.text(`${total} DT`, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2], currentY, {
          width: columnWidths[3],
          align: "right",
        })

        currentY += 20

        // Vérifier si nous avons besoin d'une nouvelle page
        if (currentY > 700) {
          doc.addPage()
          currentY = 50
        }
      }

      doc.moveTo(50, currentY).lineTo(550, currentY).stroke()
      currentY += 10

      // Vérifier si la livraison est gratuite
      const isShippingFree = order.livraisonGratuite || order.sousTotal >= 99

      // Résumé des totaux
      doc.text("Sous-total:", 380, currentY, { width: 100, align: "right" })
      doc.text(`${order.sousTotal.toFixed(3)} DT`, 480, currentY, { width: 70, align: "right" })
      currentY += 20

      doc.text("Frais de livraison:", 380, currentY, { width: 100, align: "right" })
      if (isShippingFree) {
        doc.font("Helvetica-Bold").fillColor("#2e7d32").text("GRATUIT", 480, currentY, { width: 70, align: "right" })
        doc.font("Helvetica").fillColor("black")
        if (order.fraisLivraison > 0) {
          currentY += 15
          doc
            .fontSize(8)
            .fillColor("#999999")
            .text(`(au lieu de ${order.fraisLivraison.toFixed(3)} DT)`, 480, currentY, { width: 70, align: "right" })
          doc.fontSize(10).fillColor("black")
        }
      } else {
        doc.text(`${order.fraisLivraison.toFixed(3)} DT`, 480, currentY, { width: 70, align: "right" })
      }

      currentY += 25

      if (isShippingFree) {
        doc.rect(380, currentY, 170, 25).fill("#e8f5e9")
        doc
          .fillColor("#2e7d32")
          .text("Livraison gratuite à partir de 99 DT d'achat !", 380, currentY + 8, { width: 170, align: "center" })
        doc.fillColor("black")
        currentY += 35
      }

      doc.moveTo(380, currentY).lineTo(550, currentY).stroke()
      currentY += 10

      doc.font("Helvetica-Bold")
      doc.text("Total:", 380, currentY, { width: 100, align: "right" })
      doc.text(`${order.total.toFixed(3)} DT`, 480, currentY, { width: 70, align: "right" })
      doc.font("Helvetica")

      // Pied de page
      doc.fontSize(10).text("Merci pour votre commande!", 50, 700, { align: "center" })
      doc
        .fontSize(8)
        .text(
          `Pour toute question concernant cette facture, veuillez nous contacter à steperlacoiff@gmail.com`,
          50,
          720,
          { align: "center" },
        )
      doc.text(`© ${new Date().getFullYear()} Perla Coif. Tous droits réservés.`, 50, 735, { align: "center" })

      // Finaliser le document
      doc.end()

      // Attendre que le stream soit fermé
      stream.on("finish", () => {
        resolve({
          path: invoicePath,
          filename: invoiceFileName,
        })
      })

      stream.on("error", (err) => {
        reject(err)
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Fonction pour supprimer une facture après envoi
exports.deleteInvoice = (invoicePath) => {
  try {
    if (fs.existsSync(invoicePath)) {
      fs.unlinkSync(invoicePath)
    }
  } catch (error) {
    console.error("Erreur lors de la suppression de la facture:", error)
  }
}
