// Templates d'emails stylisés pour l'application

// Template pour l'email d'activation de compte
exports.getActivationEmailTemplate = (user, activationLink) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Activation de votre compte</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #f0f0f0;
        }
        .logo {
          max-width: 150px;
          height: auto;
        }
        .content {
          padding: 30px 20px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #999999;
          border-top: 1px solid #f0f0f0;
        }
        h1 {
          color: #d2aaff;
          margin-top: 0;
          font-size: 24px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #d2aaff;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 30px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
          box-shadow: 0 4px 8px rgba(210, 170, 255, 0.3);
        }
        .button:hover {
          background-color: #c090ff;
        }
        .social-links {
          margin-top: 20px;
          text-align: center;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #d2aaff;
          text-decoration: none;
        }
        .highlight {
          color: #d2aaff;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Perla Coif</h1>
        </div>
        <div class="content">
          <h2>Bonjour ${user.firstname} !</h2>
          <p>Merci de vous être inscrit(e) sur notre site. Nous sommes ravis de vous compter parmi nos clients.</p>
          <p>Pour activer votre compte et commencer à profiter de nos services, veuillez cliquer sur le bouton ci-dessous :</p>
          
          <div style="text-align: center;">
            <a href="${activationLink}" class="button">Activer mon compte</a>
          </div>
          
          
          
          <p>À très bientôt sur <span class="highlight">Perla Coif</span> !</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé à ${user.email}. Si vous n'êtes pas à l'origine de cette inscription, veuillez ignorer cet email.</p>
          <p>&copy; ${new Date().getFullYear()} Perla Coif. Tous droits réservés.</p>
          <div class="social-links">
            <a href="https://www.facebook.com/profile.php?id=100094074991303">Facebook</a> | <a href="https://www.instagram.com/perlacoiff/?hl=fr">Instagram</a> | <a href="#">Twitter</a>
          </div>
        </div>
      </div>
    </body>
    </html>
    `
  }
  
  // Template pour l'email de confirmation de commande
  exports.getOrderConfirmationEmailTemplate = (order, user) => {
    // Formater la date
    const orderDate = new Date(order.createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  
    // Générer les lignes de produits
    let productsHtml = ""
    order.produits.forEach((item) => {
      const productName = item.produitID?.title || "Produit"
      const productImage = item.produitID?.imagepro || ""
      const price = item.prix?.toFixed(3) || "0.000"
      const quantity = item.quantite
      const total = (item.prix * item.quantite).toFixed(3)
  
      productsHtml += `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
          <div style="display: flex; align-items: center;">
            ${productImage ? `<img src="${productImage}" alt="${productName}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; border-radius: 4px;">` : ""}
            <div>
              <div style="font-weight: 500;">${productName}</div>
              ${item.produitID?.marqueID?.nommarque ? `<div style="font-size: 12px; color: #999;">${item.produitID.marqueID.nommarque}</div>` : ""}
            </div>
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align: center;">${price} DT</td>
        <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align: center;">${quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 500;">${total} DT</td>
      </tr>
      `
    })
  
    // Vérifier si la livraison est gratuite
    const isShippingFree = order.livraisonGratuite || order.sousTotal >= 99
    const shippingFeeHtml = isShippingFree
      ? `<span style="color: #2e7d32; font-weight: bold; margin-right: 5px;">GRATUIT</span>
       ${order.fraisLivraison > 0 ? `<span style="text-decoration: line-through; color: #999; font-size: 12px;">${order.fraisLivraison.toFixed(3)} DT</span>` : ""}`
      : `${order.fraisLivraison.toFixed(3)} DT`
  
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation de commande</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #f0f0f0;
        }
        .logo {
          max-width: 150px;
          height: auto;
        }
        .content {
          padding: 30px 20px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #999999;
          border-top: 1px solid #f0f0f0;
        }
        h1 {
          color: #d2aaff;
          margin-top: 0;
          font-size: 24px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #d2aaff;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 30px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
          box-shadow: 0 4px 8px rgba(210, 170, 255, 0.3);
        }
        .button:hover {
          background-color: #c090ff;
        }
        .social-links {
          margin-top: 20px;
          text-align: center;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #d2aaff;
          text-decoration: none;
        }
        .highlight {
          color: #d2aaff;
          font-weight: bold;
        }
        .order-info {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }
        .order-info p {
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background-color: #f5f5f5;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #555;
          font-size: 14px;
        }
        .free-shipping-box {
          background-color: rgba(76, 175, 80, 0.1);
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
          text-align: center;
          color: #2e7d32;
          font-size: 14px;
        }
        .order-total {
          margin-top: 20px;
          text-align: right;
        }
        .order-total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .order-total-box {
          width: 250px;
          margin-left: auto;
        }
        .divider {
          height: 1px;
          background-color: #f0f0f0;
          margin: 10px 0;
        }
        .status-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          background-color: #e3f2fd;
          color: #1976d2;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Perla Coif</h1>
        </div>
        <div class="content">
          <h2>Merci pour votre commande !</h2>
          <p>Bonjour ${user.firstname},</p>
          <p>Nous avons bien reçu votre commande et nous vous en remercions. Voici un récapitulatif de votre achat :</p>
          
          <div class="order-info">
            <p><strong>Numéro de commande :</strong> #${order._id}</p>
            <p><strong>Date :</strong> ${orderDate}</p>
            <p><strong>Statut :</strong> <span class="status-badge">Confirmée</span></p>
            <p><strong>Méthode de paiement :</strong> ${order.methodePaiement === "comptant_livraison" ? "Paiement à la livraison" : "Paiement en ligne"}</p>
          </div>
          
          <h3>Détails de la commande</h3>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Produit</th>
                <th style="text-align: center;">Prix</th>
                <th style="text-align: center;">Qté</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${productsHtml}
            </tbody>
          </table>
          
          <div class="order-total">
            <div class="order-total-box">
              <div class="order-total-row">
                <span>Sous-total:</span>
                <span>${order.sousTotal.toFixed(3)} DT</span>
              </div>
              <div class="order-total-row">
                <span>Frais de livraison:</span>
                <span>${shippingFeeHtml}</span>
              </div>
              
              ${
                isShippingFree
                  ? `
              <div class="free-shipping-box">
                Livraison gratuite à partir de 99 DT d'achat !
              </div>
              `
                  : ""
              }
              
              <div class="divider"></div>
              <div class="order-total-row" style="font-weight: bold; font-size: 16px;">
                <span>Total:</span>
                <span>${order.total.toFixed(3)} DT</span>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 30px;">
            <p>Vous pouvez suivre l'état de votre commande en vous connectant à votre compte sur notre site.</p>
            <div style="text-align: center;">
              <a href="http://localhost:1500/mon-compte" class="button">Suivre ma commande</a>
            </div>
          </div>
        </div>
        <div class="footer">
          <p>Pour toute question concernant votre commande, n'hésitez pas à nous contacter à <a href="mailto:steperlacoiff@gmail.com">steperlacoiff@gmail.com</a>.</p>
          <p>&copy; ${new Date().getFullYear()} Perla Coif. Tous droits réservés.</p>
          <div class="social-links">
            <a href="#">Facebook</a> | <a href="#">Instagram</a> | <a href="#">Twitter</a>
          </div>
        </div>
      </div>
    </body>
    </html>
    `
  }
  