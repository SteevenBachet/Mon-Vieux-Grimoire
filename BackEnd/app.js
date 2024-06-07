const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const userRoutes = require('./routes/user');
const bookRoutes = require('./routes/book');
const path = require("path")
require('dotenv').config()

const app = express();

mongoose.connect(process.env.MONGODB_URL,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use(express.json());

app.use((req, res, next) => {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
   next();
});

app.use(bodyParser.json())

app.use((req, res, next) => {
  console.log('Requête reçue !');
  next();
});

// Idée d'amélioration ==> côté front attendre la reponsepoour renvoyer une nouvelle requête de création ( possibilité de créer plusieurs book en spammant bouton )

// créer fichier .env pour stocker les données sensibles (non versionner)

app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;