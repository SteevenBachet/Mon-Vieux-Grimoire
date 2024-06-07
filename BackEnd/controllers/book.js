const Book = require('../models/Book');
const fs = require('fs');

exports.getAllBooks = (req, res, next) => {
    Book.find().then(
        (books) => {
          res.status(200).json(books);
        }
      ).catch(
        (error) => {
          res.status(400).json({
            error: error
          });
        }
      );
}

exports.createBook = async (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    // Récupérer l'URL de l'image du fichier téléchargé
    const imageUrl = req.file.url;

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: imageUrl // Utiliser l'URL de l'image récupérée
    });

    await book.save();
    res.status(201).json({ message: 'Objet enregistré !' });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id
  }).then(
    (book) => {
      res.status(200).json(book);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifyBook = async (req, res, next) => {
  try {
    
    const bookId = req.params.id;

    let newImageUrl = null;
    if (req.file) {
      const existingBook = await Book.findById(bookId);
      if (existingBook.imageUrl) {
        const oldImageUrl = existingBook.imageUrl;
        const filename = oldImageUrl.split('/images/')[1];
        fs.unlinkSync(`images/${filename}`);
      }

      newImageUrl = req.file.url;
    }

    const bookData = req.body;

    if (newImageUrl) {
      bookData.imageUrl = newImageUrl;
    }
    
    await Book.findByIdAndUpdate(bookId, bookData);

    res.status(200).json({ message: 'Objet modifié!' });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id})
      .then(book => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
          } else {
              const filename = book.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Book.deleteOne({_id: req.params.id}) // supression de l'image dans le dossier
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

exports.postRating = async (req, res, next) => {
  try {
    const bookId = req.params.id;
    const { rating } = req.body;

    /* Contrôler si le rating est valide */ 
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'La note doit être un nombre entre 1 et 5' });
    }

    const book = await Book.findById(bookId);

     /*Pas sûr que ça sert à quelque chose dans le processus (à voir avec Patxi)  // Contrôler que l'utilisateur n'a pas déjà ajouter une note //*/
    const existingRating = book.ratings.find(r => r.userId.toString() === req.auth.userId);

    if (existingRating) {
      return res.status(400).json({ message: 'Vous avez déjà noté ce livre' });
    }

    console.log("book rating AVANT:", book.ratings);

    //Est ce que l'on doit pouvoir modifier la note aussi ?
  
    book.ratings.push({ userId: req.auth.userId, grade: rating });

    console.log("book rating APRES:", book.ratings);

    /* Calcul */
    const totalRatings = book.ratings.length;
    const sumRatings = book.ratings.reduce((acc, cur) => acc + cur.grade, 0);
    const averageRating = sumRatings / totalRatings;

    /* mise à jour de la moyenne  */
    book.averageRating = averageRating;

    console.log(book.averageRating)
    
    await book.save();

    res.status(201).json(book);
  } catch (error) {
    console.error(error); // débug
    res.status(500).json({ error: 'Une erreur est survenue' });
  }
};