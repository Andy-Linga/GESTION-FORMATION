const mongoose = require('mongoose');

const formateurSchema = new mongoose.Schema({
    matricule: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    prenom: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    domaine: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Domaine',
        required: true,
    },
   
    phone: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
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

module.exports = mongoose.model("Formateur", formateurSchema);
