const sharp = require('sharp');
const fs = require("fs");
const path = require('path');

module.exports = async function compressImage(req, res, next) {
  try {
    // Si aucune image n'est téléchargée => message
    if (req.file === undefined) {
      return res.status(200).json("pas d'image");
    }

    // Importation dynamique de 'file-type' (opération asynchrone)
    // const { fileTypeFromBuffer } = await import('file-type');
    // Vérifier le type de fichier (opération asynchrone)
    // const type = await fileTypeFromBuffer(req.file.buffer);

    console.log("file:", req.file);
    
    const type = req.file.mimetype
    if (!type || !['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
      return res.status(400).json({ error: 'Le fichier n\'est pas une image valide' });
    }

    // Créer le dossier images s'il n'existe pas
    const imagesDir = path.join(__dirname, '../images');
    fs.access(imagesDir, (error) => {
      if (error) {
        fs.mkdirSync(imagesDir);
      }
    });

    // Générer un nom de fichier unique et définir l'URL du fichier
    const fileName = `${Date.now()}.webp`;
    const filePath = path.join(imagesDir, fileName);
    const fileUrl = `${req.protocol}://${req.get('host')}/images/${fileName}`;

    // Compresser l'image et sauvegarder (opération asynchrone)
    await sharp(req.file.buffer)
      .webp({ quality: 20 }) // Définit la qualité de compression
      .toFile(filePath);

    // Stocker l'URL dans req.file pour les prochains middlewares
    req.file.url = fileUrl;

    // Passer au middleware suivant
    next();
  } catch (error) {
    console.log("error:", error);
    res.status(400).json({ error: error.message });
  }
};