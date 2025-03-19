const express = require("express");
const router = express.Router();
const User = require("../models/users");
const Profile = require("../models/profile");
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

// Ajouter un participant
router.post("/add", upload, async (req, res) => {
    try {
        // Vérifiez si le matricule existe déjà
        const existingUser = await User.findOne({ matricule: req.body.matricule });
        if (existingUser) {
            console.log(`Erreur MongoDB: Le matricule "${req.body.matricule}" est déjà utilisé.`);
            req.session.message = {
                type: "danger",
                message: `Le matricule "${req.body.matricule}" est déjà utilisé. Veuillez en choisir un autre.`,
            };
            return res.redirect("/participant"); // Redirection vers la page d'ajout
        }

        // Créez le nouvel utilisateur
        const user = new User({
            matricule: req.body.matricule,
            name: req.body.name,
            prenom: req.body.prenom,
            email: req.body.email,
            profile: req.body.profile,
            date: req.body.date,
            image: req.file ? req.file.filename : null,
            userId: req.user._id, // userId du gestionnaire
        });

        await user.save();

        req.session.message = {
            type: "success",
            message: "Participant ajouté avec succès !",
        };

        res.redirect("/participant");
    } catch (err) {
        console.error(err);


        // Gestion des autres erreurs
        req.session.message = {
            type: "danger",
            message: err.message || "Une erreur est survenue lors de l'ajout du participant.",
        };
        res.redirect("/participant");
    }
});

// Obtenir tous les participants
router.get("/participant", async (req, res) => {
    try {
        const users = await User.find({ userId: req.user._id }).populate("profile").exec();
        res.render("userInt", {
            title: "Gestion des participants",
            users: users,
            isEmpty: users.length === 0,
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});

// Afficher la page d'ajout de participant
router.get("/add", async (req, res) => {
    try {
        const profiles = await Profile.find(); // Récupère tous les profils
        res.render("add_users", { title: "Ajouter un participant", profiles });
    } catch (err) {
        console.error(err);
        res.redirect("/participant");
    }
});

// Afficher la page d'accueil
router.get("/", (req, res) => {
    res.render("index", { title: "Accueil" });
});

// Éditer un participant
router.get("/edit/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id).populate("profile");

        if (!user) {
            return res.redirect("/participant");
        }

        const profiles = await Profile.find(); // Récupère les profils pour l'édition
        res.render("edit_users", {
            title: "Modifier le participant",
            user: user,
            profiles: profiles,
        });
    } catch (err) {
        console.error(err);
        res.redirect("/participant");
    }
});

// Mettre à jour un participant
router.post("/update/:id", upload, async (req, res) => {
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

        // Vérifiez si un autre utilisateur a le même matricule
        const existingUser = await User.findOne({ matricule: req.body.matricule, _id: { $ne: id } });
        if (existingUser) {
            console.log(`Erreur MongoDB: Le matricule "${req.body.matricule}" est déjà utilisé par un autre participant.`);
            req.session.message = {
                type: "danger",
                message: `Le matricule "${req.body.matricule}" est déjà utilisé par un autre participant.`,
            };
            return res.redirect("/participant");// Redirection vers la liste des participants

        }

        // Mise à jour de l'utilisateur
        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                matricule: req.body.matricule,
                name: req.body.name,
                prenom: req.body.prenom,
                email: req.body.email,
                date: req.body.date,
                phone: req.body.phone,
                profile: req.body.profile,
                image: new_image,
            },
            { new: true }
        );

        if (!updatedUser) {
            req.session.message = {
                type: "danger",
                message: "Participant introuvable !",
            };
            return res.redirect("/participant");
        }

        req.session.message = {
            type: "success",
            message: "Participant modifié avec succès !",
        };
        res.redirect("/participant");
    } catch (err) {
        console.error("Erreur lors de la mise à jour du participant :", err);
        req.session.message = {
            type: "danger",
            message: "Une erreur est survenue pendant la mise à jour.",
        };
        res.redirect("/participant");
    }
});

// Supprimer un participant
router.get("/delete/:id", async (req, res) => {
    let id = req.params.id;

    try {
        const result = await User.findByIdAndDelete(id);

        if (result && result.image) {
            try {
                fs.unlinkSync("./uploads/" + result.image);
            } catch (err) {
                console.error("Erreur lors de la suppression du fichier :", err);
            }
        }

        req.session.message = {
            type: "info",
            message: "Participant supprimé avec succès !",
        };

        res.redirect("/participant");
    } catch (err) {
        console.error("Erreur lors de la suppression du participant :", err);
        res.json({ message: err.message });
    }
});

module.exports = router;
