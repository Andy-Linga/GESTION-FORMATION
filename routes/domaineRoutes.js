const express = require("express");
const router = express.Router();
const Domaine = require('../models/domaine');
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

// Route pour ajouter un domaine
router.post('/addDomaine', upload, async (req, res) => {
    try {
        console.log("Données reçues : ", req.body);

        // Vérifie si le code_domaine existe déjà dans la base de données
        const existingDomaine = await Domaine.findOne({ code_domaine: req.body.code_domaine });
        console.log("Domaine existant : ", existingDomaine);

        if (existingDomaine) {
            req.session.message = {
                type: 'danger',
                message: `Le code domaine ${req.body.code_domaine} existe déjà.`,
            };
            return res.redirect('/addDomaine');  // Redirige vers la page d'ajout avec un message d'erreur
        }

        const domaine = new Domaine({
            code_domaine: req.body.code_domaine,
            libelle: req.body.libelle,
            userId: req.user ? req.user._id : null, // Assurez-vous que req.user est défini
        });

        await domaine.save();
        console.log("Domaine ajouté avec succès");

        req.session.message = {
            type: 'success',
            message: 'Domaine ajouté avec succès !',
        };

        res.redirect('/domaine'); // Redirige vers la liste des domaines
    } catch (err) {
        console.error("Erreur lors de l'ajout du domaine :", err);

        req.session.message = {
            type: 'danger',
            message: err.message || 'Une erreur est survenue lors de l\'ajout du domaine.',
        };

        res.redirect('/addDomaine');
    }
});
// Route pour obtenir tous les domaines
router.get("/domaine", async (req, res) => {
    try {
        const domaines = await Domaine.find({ userId: req.user._id });
        res.render('domaineInt', {
            title: 'Gestion des Domaines',
            isEmpty: domaines.length === 0,
            domaines: domaines,
        });
    } catch (err) {
        console.error(err);
        req.session.message = {
            type: 'danger',
            message: err.message || 'Une erreur est survenue lors de la récupération des domaines.',
        };
        res.redirect('/domaine');
    }
});

// Route pour afficher la page d'ajout de domaine
router.get("/addDomaine", (req, res) => {
    res.render("add_domaines", { title: "Ajouter un Domaine", domaine: {} });
});

// Route pour éditer un domaine
router.get("/edit_domaines/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const domaine = await Domaine.findById(id);

        if (!domaine) {
            req.session.message = {
                type: "danger",
                message: "Domaine non trouvé.",
            };
            return res.redirect("/domaine");
        }

        res.render("edit_domaines", {
            title: "Modifier un Domaine",
            domaine: domaine,
        });
    } catch (err) {
        console.error(err);
        req.session.message = {
            type: "danger",
            message: "Erreur lors de la récupération du domaine.",
        };
        res.redirect("/domaine");
    }
});

// Route pour mettre à jour un domaine
router.post("/update_domaines/:id", upload, async (req, res) => {
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

        // Mettre à jour les informations du domaine
        const updatedDomaine = await Domaine.findByIdAndUpdate(
            id,
            {
                code_domaine: req.body.code_domaine,
                libelle: req.body.libelle,
                image: new_image,
            },
            { new: true }
        );

        if (!updatedDomaine) {
            req.session.message = {
                type: "danger",
                message: "Domaine non trouvé.",
            };
            return res.redirect("/domaine");
        }

        req.session.message = {
            type: "success",
            message: "Domaine mis à jour avec succès !",
        };
        res.redirect("/domaine");

    } catch (err) {
        console.error("Erreur lors de la mise à jour du domaine:", err);
        req.session.message = {
            type: "danger",
            message: "Une erreur est survenue pendant la mise à jour du domaine.",
        };
        res.redirect("/domaine");
    }
});

// Route pour supprimer un domaine
router.get('/delete_domaines/:id', async (req, res) => {
    let id = req.params.id;

    try {
        const result = await Domaine.findByIdAndDelete(id);

        if (result && result.image) {
            try {
                fs.unlinkSync('./uploads/' + result.image);
            } catch (err) {
                console.log("Erreur lors de la suppression du fichier : ", err);
            }
        }

        req.session.message = {
            type: "info",
            message: "Domaine supprimé avec succès !",
        };

        res.redirect("/domaine");
    } catch (err) {
        console.error("Erreur lors de la suppression du domaine :", err);
        req.session.message = {
            type: "danger",
            message: err.message || "Erreur lors de la suppression du domaine.",
        };
        res.redirect("/domaine");
    }
});

module.exports = router;
