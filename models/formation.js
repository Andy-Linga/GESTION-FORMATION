const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema({
    code_formation: {
        type: String,
        required: true,
        unique: true,
    },
    intitule: {
        type: String,
        required: true,
    },
    domaine: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Domaine',
        required: true,
    },
    nombre_jours: {
        type: Number,
        required: true,
    },
    annee: {
        type: Number,
        required: true,
    },
    mois: {
        type: String,
        required: true,
    },
    formateur: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Formateur',
        required: true,
    },
    // Modification ici : nombre_participants est maintenant un tableau d'ObjectId
    nombre_participants: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Users',
        required: true,
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Gerant',
        required: true,
    },
    created: {
        type: Date,
        required: true,
        default: Date.now
    },
});

// Validation avant l'enregistrement pour vérifier qu'il y a au moins 4 participants
formationSchema.pre('save', function(next) {
    if (this.nombre_participants.length < 4) {
        return next(new Error('Il faut au minimum 4 participants.'));
    }
    next();
});

module.exports = mongoose.model("Formation", formationSchema);
