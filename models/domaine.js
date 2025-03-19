const mongoose = require('mongoose');
const domaine = require('./domaine');

const domaineSchema = new mongoose.Schema({
    code_domaine: {
        type: String,
        required: [true, "Le code domaine est requis"],
        unique: true, // Garantit que le code domaine est unique
    },
    libelle: {
        type: String,
        required: [true, "Le libellé est requis"],
        minlength: [3, "Le libellé doit comporter au moins 3 caractères"],
    },
     userId: {
                type: mongoose.Schema.Types.ObjectId, ref: 'Gerant',
                required: true,
            },
}, { timestamps: true });

module.exports = mongoose.model('Domaine', domaineSchema);
