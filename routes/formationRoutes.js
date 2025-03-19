const express = require("express");
const router = express.Router();
const Formation = require('../models/formation');
const Formateur = require("../models/formateurs");
const Domaine = require("../models/domaine");
const User = require("../models/users");  // Assurez-vous d'importer le modèle User
const multer = require('multer');
const fs = require('fs');

// Configuration de l'upload d'image
var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads');
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage: storage }).single('image');

// Route pour ajouter une formation
router.post('/addFormation', upload, async (req, res) => {
    try {
        console.log("Données reçues : ", req.body);

        // Vérifie si le code_formation existe déjà dans la base de données
        const existingFormation = await Formation.findOne({ code_formation: req.body.code_formation });
        console.log("Formation existante : ", existingFormation);

        if (existingFormation) {
            req.session.message = {
                type: 'danger',
                message: `Le code formation ${req.body.code_formation} existe déjà.`,
            };
            return res.redirect('/formation');  // Redirige vers la page d'ajout avec un message d'erreur
        }

        // Vérifiez qu'il y a au moins 4 participants
        const participants = req.body.nombre_participants || [];
        if (participants.length < 4) {
            req.session.message = {
                type: 'danger',
                message: 'Il faut au minimum 4 participants pour ajouter une formation.',
            };
            return res.redirect('/addFormation');
        }

        const formation = new Formation({
            code_formation: req.body.code_formation,
            intitule: req.body.intitule,
            domaine: req.body.domaine,
            nombre_jours: req.body.nombre_jours,
            annee: req.body.annee,
            mois: req.body.mois,
            formateur: req.body.formateur,
            nombre_participants: participants, // On suppose que les participants sont envoyés en tant que tableau d'ObjectId
            userId: req.user ? req.user._id : null, // Assurez-vous que req.user est défini
        });

        await formation.save();
        console.log("Formation ajoutée avec succès");

        req.session.message = {
            type: 'success',
            message: 'Formation ajoutée avec succès !',
        };

        res.redirect('/formation'); // Redirige vers la liste des formations
    } catch (err) {
        console.error("Erreur lors de l'ajout de la formation :", err);

        req.session.message = {
            type: 'danger',
            message: err.message || 'Une erreur est survenue lors de l\'ajout de la formation.',
        };

        res.redirect('/addFormation');
    }
});

// Route pour obtenir toutes les formations
router.get("/formation", async (req, res) => {
    try {
        const formations = await Formation.find({ userId: req.user._id })
            .populate('formateur')
            .populate('nombre_participants')
            .populate('domaine') // Ajout du populate pour le domaine
            .exec(); // Ajout de exec() pour une meilleure gestion des promesses

        res.render('formationInt', {
            title: 'Gestion des Formations',
            isEmpty: formations.length === 0,
            formations: formations,
        });
    } catch (err) {
        console.error(err);
        req.session.message = {
            type: 'danger',
            message: err.message || 'Une erreur est survenue lors de la récupération des formations.',
        };
        res.redirect('/formation');
    }
});
// Route pour afficher la page d'ajout de formation
router.get("/addFormation", async (req, res) => {
    try {
        // Récupérer les domaines, formateurs et utilisateurs depuis la base de données
        const domaines = await Domaine.find();
        const formateurs = await Formateur.find();
        const users = await User.find();  // Récupérer tous les utilisateurs disponibles

        // Passer les domaines, formateurs et utilisateurs à la vue 'add_formations'
        res.render("add_formations", {
            title: "Ajouter une Formation",
            domaines: domaines,    // Passer la liste des domaines
            formateurs: formateurs, // Passer la liste des formateurs
            users: users, // Passer la liste des utilisateurs pour les participants
        });
    } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
        req.session.message = {
            type: "danger",
            message: "Erreur lors de la récupération des données.",
        };
        res.redirect("/formation");
    }
});

// Route pour éditer une formation
router.get("/edit_formations/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const formation = await Formation.findById(id)  // Récupère la formation par ID
            .populate('formateur') // Populer le formateur
            .populate('nombre_participants'); // Populer les participants

        const domaines = await Domaine.find();  // Récupère tous les domaines
        const formateurs = await Formateur.find();  // Récupère tous les formateurs
        const users = await User.find();  // Récupère tous les utilisateurs

        if (!formation) {
            req.session.message = {
                type: "danger",
                message: "Formation non trouvée.",
            };
            return res.redirect("/formation");
        }

        res.render("edit_formations", {
            title: "Modifier une Formation",
            formation: formation,
            domaines: domaines,  // Passe les domaines à la vue
            formateurs: formateurs,  // Passe les formateurs à la vue
            users: users, // Passe les utilisateurs pour les participants
        });
    } catch (err) {
        console.error(err);
        req.session.message = {
            type: "danger",
            message: "Erreur lors de la récupération de la formation.",
        };
        res.redirect("/formation");
    }
});

// Route pour mettre à jour une formation
router.post("/update_formations/:id", upload, async (req, res) => {
    const id = req.params.id;

    try {
        // Vérifiez si une autre formation a le même code_formation
        const existingFormation = await Formation.findOne({ code_formation: req.body.code_formation, _id: { $ne: id } });
        if (existingFormation) {
            console.log(`Erreur MongoDB: Le code de formation "${req.body.code_formation}" est déjà utilisé par une autre formation.`);
            req.session.message = {
                type: "danger",
                message: `Le code de formation "${req.body.code_formation}" est déjà utilisé par une autre formation.`,
            };
            return res.redirect("/formation"); // Redirection vers la liste des formations
        }

        // Vérifiez qu'il y a au moins 4 participants
        const participants = req.body.nombre_participants || [];
        if (participants.length < 4) {
            req.session.message = {
                type: 'danger',
                message: 'Il faut au minimum 4 participants pour mettre à jour la formation.',
            };
            return res.redirect(`/edit_formations/${id}`);
        }

        // Mettre à jour les informations de la formation
        const updatedFormation = await Formation.findByIdAndUpdate(
            id,
            {
                code_formation: req.body.code_formation,
                intitule: req.body.intitule,
                domaine: req.body.domaine,
                nombre_jours: req.body.nombre_jours,
                annee: req.body.annee,
                mois: req.body.mois,
                formateur: req.body.formateur,
                nombre_participants: participants, // On met à jour les participants
            },
            { new: true }
        );

        if (!updatedFormation) {
            req.session.message = {
                type: "danger",
                message: "Formation non trouvée.",
            };
            return res.redirect("/formation");
        }

        req.session.message = {
            type: "success",
            message: "Formation mise à jour avec succès !",
        };
        res.redirect("/formation");

    } catch (err) {
        console.error("Erreur lors de la mise à jour de la formation:", err);
        req.session.message = {
            type: "danger",
            message: "Une erreur est survenue pendant la mise à jour de la formation.",
        };
        res.redirect("/formation");
    }
});

// Route pour supprimer une formation
router.get('/delete_formations/:id', async (req, res) => {
    let id = req.params.id;

    try {
        const result = await Formation.findByIdAndDelete(id);

        req.session.message = {
            type: "info",
            message: "Formation supprimée avec succès !",
        };

        res.redirect("/formation");
    } catch (err) {
        console.error("Erreur lors de la suppression de la formation :", err);
        req.session.message = {
            type: "danger",
            message: err.message || "Erreur lors de la suppression de la formation.",
        };
        res.redirect("/formation");
    }
});

module.exports = router;
