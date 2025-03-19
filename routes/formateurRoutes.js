const express = require("express");
const router = express.Router();
const Formateur = require("../models/formateurs");
const Domaine = require("../models/domaine");
const multer = require("multer");
const fs = require("fs");

// Configuration de l'upload d'image
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = "./uploads";
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage: storage }).single("image");

// Ajouter un formateur
router.post("/addFormateur", upload, async (req, res) => {
    try {
        // Vérifiez si le matricule existe déjà
        const existingFormateur = await Formateur.findOne({ matricule: req.body.matricule });
        if (existingFormateur) {
            console.log(`Erreur MongoDB: Le matricule "${req.body.matricule}" est déjà utilisé.`);
            req.session.message = {
                type: "danger",
                message: `Le matricule "${req.body.matricule}" est déjà utilisé. Veuillez en choisir un autre.`,
            };
            return res.redirect("/formateur"); // Redirection vers la page d'ajout
        }

        // Créez le nouveau formateur
        const formateur = new Formateur({
            matricule: req.body.matricule,
            name: req.body.name,
            prenom: req.body.prenom,
            email: req.body.email,
            domaine: req.body.domaine,
            phone: req.body.phone,
            date: req.body.date,
            image: req.file ? req.file.filename : null,
            userId: req.user._id, // userId du gestionnaire
        });

        await formateur.save();

        req.session.message = {
            type: "success",
            message: "Formateur ajouté avec succès !",
        };

        res.redirect("/formateur");
    } catch (err) {
        console.error(err);

        // Gestion des autres erreurs
        req.session.message = {
            type: "danger",
            message: err.message || "Une erreur est survenue lors de l'ajout du formateur.",
        };
        res.redirect("/formateur");
    }
});

// Obtenir tous les formateurs
router.get("/formateur", async (req, res) => {
    try {
        const formateurs = await Formateur.find({ userId: req.user._id }).populate("domaine").exec();
        res.render("formateurInt", {
            title: "Gestion des formateurs",
            formateurs: formateurs,
            isEmpty: formateurs.length === 0,
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});

// Afficher la page d'ajout de formateur
router.get("/addFormateur", async (req, res) => {
    try {
        const domaines = await Domaine.find(); // Récupère tous les domaines
        res.render("add_formateurs", { title: "Ajouter un formateur", domaines });
    } catch (err) {
        console.error(err);
        res.redirect("/formateur");
    }
});

// Afficher la page d'accueil
router.get("/", (req, res) => {
    res.render("index", { title: "Accueil" });
});

// Éditer un formateur
router.get("/edit_formateurs/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const formateur = await Formateur.findById(id).populate("domaine");

        if (!formateur) {
            return res.redirect("/formateur");
        }

        const domaines = await Domaine.find(); // Récupère les domaines pour l'édition
        res.render("edit_formateurs", {
            title: "Modifier le formateur",
            formateur: formateur,
            domaines: domaines,
        });
    } catch (err) {
        console.error(err);
        res.redirect("/formateur");
    }
});

// Mettre à jour un formateur
router.post("/update_formateurs/:id", upload, async (req, res) => {
    const id = req.params.id;
    let new_image = "";

    try {
        // Gestion de l'image
        if (req.file) {
            new_image = req.file.filename;
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

        // Vérifiez si un autre formateur a le même matricule
        const existingFormateur = await Formateur.findOne({ matricule: req.body.matricule, _id: { $ne: id } });
        if (existingFormateur) {
            console.log(`Erreur MongoDB: Le matricule "${req.body.matricule}" est déjà utilisé par un autre formateur.`);
            req.session.message = {
                type: "danger",
                message: `Le matricule "${req.body.matricule}" est déjà utilisé par un autre formateur.`,
            };
            return res.redirect("/formateur");// Redirection vers la liste des formateurs

        }

        // Mise à jour du formateur
        const updatedFormateur = await Formateur.findByIdAndUpdate(
            id,
            {
                matricule: req.body.matricule,
                name: req.body.name,
                prenom: req.body.prenom,
                email: req.body.email,
                date: req.body.date,
                phone: req.body.phone,
                domaine: req.body.domaine,
                image: new_image,
            },
            { new: true }
        );

        if (!updatedFormateur) {
            req.session.message = {
                type: "danger",
                message: "Formateur introuvable !",
            };
            return res.redirect("/formateur");
        }

        req.session.message = {
            type: "success",
            message: "Formateur modifié avec succès !",
        };
        res.redirect("/formateur");
    } catch (err) {
        console.error("Erreur lors de la mise à jour du formateur :", err);
        req.session.message = {
            type: "danger",
            message: "Une erreur est survenue pendant la mise à jour.",
        };
        res.redirect("/formateur");
    }
});

// Supprimer un formateur
router.get("/delete_formateurs/:id", async (req, res) => {
    let id = req.params.id;

    try {
        const result = await Formateur.findByIdAndDelete(id);

        if (result && result.image) {
            try {
                fs.unlinkSync("./uploads/" + result.image);
            } catch (err) {
                console.error("Erreur lors de la suppression du fichier :", err);
            }
        }

        req.session.message = {
            type: "info",
            message: "Formateur supprimé avec succès !",
        };

        res.redirect("/formateur");
    } catch (err) {
        console.error("Erreur lors de la suppression du formateur :", err);
        res.json({ message: err.message });
    }
});

module.exports = router;
