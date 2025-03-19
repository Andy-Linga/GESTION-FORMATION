const express = require("express");
const router = express.Router();
const Profil = require('../models/profile');
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

// Route pour ajouter un profil
router.post('/addProfil', upload, async (req, res) => {
    try {
        console.log("Données reçues : ", req.body);

        // Vérifie si le code_profil existe déjà dans la base de données
        const existingProfil = await Profil.findOne({ code_profil: req.body.code_profil });
        console.log("Profil existant : ", existingProfil);

        if (existingProfil) {
            req.session.message = {
                type: 'danger',
                message: `Le code profil ${req.body.code_profil} existe déjà.`,
            };
            return res.redirect('/addProfil');  // Redirige vers la page d'ajout avec un message d'erreur
        }

        const profil = new Profil({
            code_profil: req.body.code_profil,
            libelle: req.body.libelle,
            userId: req.user ? req.user._id : null, // Assurez-vous que req.user est défini
        });

        await profil.save();
        console.log("Profil ajouté avec succès");

        req.session.message = {
            type: 'success',
            message: 'Profil ajouté avec succès !',
        };

        res.redirect('/profil'); // Redirige vers la liste des profils
    } catch (err) {
        console.error("Erreur lors de l'ajout du profil :", err);

        req.session.message = {
            type: 'danger',
            message: err.message || 'Une erreur est survenue lors de l\'ajout du profil.',
        };

        res.redirect('/addProfil');
    }
});
// Route pour obtenir tous les profils
router.get("/profil", async (req, res) => {
    try {
        const profils = await Profil.find({ userId: req.user._id  });
        res.render('profilInt', {
            title: 'Gestion des Profils',
            isEmpty: profils.length === 0,
            profils: profils,
        });
    } catch (err) {
        console.error(err);
        req.session.message = {
            type: 'danger',
            message: err.message || 'Une erreur est survenue lors de la récupération des profils.',
        };
        res.redirect('/profil');
    }
});

// Route pour afficher la page d'ajout de profil
router.get("/addProfil", (req, res) => {
    res.render("add_profils", { title: "Ajouter un Profil", profil: {} });
});

// Route pour éditer un profil
router.get("/edit_profils/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const profil = await Profil.findById(id);

        if (!profil) {
            req.session.message = {
                type: "danger",
                message: "Profil non trouvé.",
            };
            return res.redirect("/profil");
        }

        res.render("edit_profils", {
            title: "Modifier un Profil",
            profil: profil,
        });
    } catch (err) {
        console.error(err);
        req.session.message = {
            type: "danger",
            message: "Erreur lors de la récupération du profil.",
        };
        res.redirect("/profil");
    }
});

// Route pour mettre à jour un profil
router.post("/update_profils/:id", upload, async (req, res) => {
    const id = req.params.id;
    let new_image = "";

    try {
        // Si une nouvelle image est téléchargée, gérer le fichier
        if (req.file) {
            new_image = req.file.filename;

            // Supprimer l'ancienne image si elle existe
            if (req.body.old_image) {
                try {
                    fs.unlinkSync("./uploads/" + req.body.old_image);
                } catch (err) {
                    console.error("Erreur lors de la suppression de l'ancienne image:", err);
                }
            }
        } else {
            new_image = req.body.old_image;
        }

        // Mettre à jour les informations du profil
        const updatedProfil = await Profil.findByIdAndUpdate(
            id,
            {
                code_profil: req.body.code_profil,
                libelle: req.body.libelle,
                image: new_image,
            },
            { new: true }
        );

        if (!updatedProfil) {
            req.session.message = {
                type: "danger",
                message: "Profil non trouvé.",
            };
            return res.redirect("/profil");
        }

        req.session.message = {
            type: "success",
            message: "Profil mis à jour avec succès !",
        };
        res.redirect("/profil");

    } catch (err) {
        console.error("Erreur lors de la mise à jour du profil:", err);
        req.session.message = {
            type: "danger",
            message: "Une erreur est survenue pendant la mise à jour du profil.",
        };
        res.redirect("/profil");
    }
});

// Route pour supprimer un profil
router.get('/delete_profils/:id', async (req, res) => {
    let id = req.params.id;

    try {
        const result = await Profil.findByIdAndDelete(id);

        if (result && result.image) {
            try {
                fs.unlinkSync('./uploads/' + result.image);
            } catch (err) {
                console.log("Erreur lors de la suppression du fichier : ", err);
            }
        }

        req.session.message = {
            type: "info",
            message: "Profil supprimé avec succès !",
        };

        res.redirect("/profil");
    } catch (err) {
        console.error("Erreur lors de la suppression du profil :", err);
        req.session.message = {
            type: "danger",
            message: err.message || "Erreur lors de la suppression du profil.",
        };
        res.redirect("/profil");
    }
});

module.exports = router;
