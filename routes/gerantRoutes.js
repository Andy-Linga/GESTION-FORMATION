const express = require('express');
const router = express.Router();
const Gerant = require('../models/gerant');
const bcrypt = require('bcrypt');
const passport = require('passport');

// Inscription d'un utilisateur
router.post('/signin', async (req, res) => {
  try {
    console.log(req.body);
       // Vérifier si le username existe déjà
       const existingUser = await Gerant.findOne({ username: req.body.username });
       if (existingUser) {
         return res.status(400).json({ message: 'Nom d’utilisateur déjà pris' });
       }
   
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Créer un nouvel utilisateur
    const gerant = new Gerant({
      name: req.body.name,
      prenom: req.body.prenom,
      username: req.body.username,
      password: hashedPassword,
      email: req.body.email
    });

    // Sauvegarder l'utilisateur dans la base de données
    const savedGerant = await gerant.save();

    // Après inscription réussie, rediriger vers la page board
    res.redirect('/');
  } catch (err) {
    // En cas d'erreur, renvoyer un message JSON (ou afficher une page d'erreur)
    res.status(400).json({ message: err.message });
  }
});

// Middleware pour vérifier l'authentification
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

  
// Route de connexion
router.post('/login', passport.authenticate('local', {
  successRedirect: '/board',
  failureRedirect: '/login',
  failureFlash: true
}))

// Route pour l'interface d'accueil
router.get('/', (req, res) => {
  res.render('index'); // Charge le fichier index.ejs
});

router.get('/login', (req, res) => {
  const errorMessages = req.flash('error');
  res.render('login', { messages: errorMessages || null  }); // Charge le fichier login.ejs
});

// Route pour l'interface de sign in
router.get('/signin', (req, res) => {
  res.render('signin'); // Charge le fichier signin.ejs
});

// Autres routes d'authentification
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/board');
    }
    res.redirect('/login');
  });
});

// Route pour le tableau de bord
router.get('/board', (req, res) => {
  res.render('board'); // Charge le fichier board.ejs
});

module.exports = router;