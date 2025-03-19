const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Gerant = require('./models/gerant'); // Votre modèle utilisateur

passport.use(new LocalStrategy(
  { usernameField: 'usernameOrEmail' }, // Utiliser le champ usernameOrEmail
  async function(usernameOrEmail, password, done) {
    try {
      const gerant = await Gerant.findOne({
        $or: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      });

      if (!gerant) {
        return done(null, false, { message: 'username ou email Incorrect !' });
      }

      if (!await gerant.validPassword(password)) {
        return done(null, false, { message: 'Mot de passe Incorrect !' });
      }

      return done(null, gerant);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser(function(gerant, done) {
  done(null, gerant.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const gerant = await Gerant.findById(id);
    done(null, gerant);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;