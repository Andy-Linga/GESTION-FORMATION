const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const passport = require('./passport-config');
const gerantRoutes = require('./routes/gerantRoutes'); 
const session = require('express-session');
const path = require('path');
const flash = require('connect-flash');

const app = express();
dotenv.config();

const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL;

// Connection to the database
mongoose.connect(MONGOURL)
  .then(() => {
    console.log("Connected to the database!");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.log(error));

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); // Pour traiter les données des formulaires HTML
app.use(bodyParser.json()); // Pour traiter les requêtes JSON

app.use(session({
  secret: 'your secret key',
  resave: false,
  saveUninitialized: true,
}));

//passport
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});

// Utiliser connect-flash
app.use(flash());

// Middleware pour rendre les messages flash disponibles dans les vues
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

app.use(express.static("uploads")); // En utilisant cette ligne, vous permettez à vos fichiers dans le dossier uploads d'être accessibles directement depuis votre application via une URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Configure le dossier "uploads" comme dossier statique

// Set template engine
app.set("view engine", "ejs");

// Routes prefix
app.use("", require("./routes/routes"));
app.use("", require("./routes/formateurRoutes"));
app.use("", require("./routes/profilRoutes"));
app.use("", require("./routes/domaineRoutes"));
app.use("", require("./routes/formationRoutes"));
app.use("", gerantRoutes); // Utiliser les routes d'authentification sans préfixe

// CSS
app.use(express.static('public'));