const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const gerantSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  prenom: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});

// Méthode pour vérifier le mot de passe
gerantSchema.methods.validPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Gerant', gerantSchema);