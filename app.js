const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');

// start the api.js
const api = require('./api');

// Initialiser Express
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Use public folder for static files
app.use(express.static('public'));

// Connexion à la base de données SQLite
const db = new sqlite3.Database('pznotebook.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connecté à la base de données SQLite.');
});

// Créer la table des catégories si elle n'existe pas
const initDb = () => {
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        description TEXT,
        objets TEXT
    )`);
};

initDb();

// Middleware pour parser le corps des requêtes
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Servir des fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route pour la page d'accueil
app.get('/custom', (req, res) => {
    res.render('all');
});

// Route pour ajouter une catégorie
app.post('/add-category', (req, res) => {
    const { nomCategorie, description, objets } = req.body;
    const sql = `INSERT INTO categories (nom, description, objets) VALUES (?, ?, ?)`;
    db.run(sql, [nomCategorie, description, JSON.stringify(objets)], (err) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'Catégorie ajoutée avec succès' });
    });
});

// Route pour lister toutes les catégories
app.get('/categories', (req, res) => {
    const sql = `SELECT * FROM categories`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ categories: rows });
    });
});

app.post('/update-category', (req, res) => {
    const { id, description, objets } = req.body;

    // Préparation de la requête SQL pour la mise à jour
    const sql = `UPDATE categories SET description = ?, objets = ? WHERE id = ?`;

    // Exécution de la requête SQL avec les valeurs fournies
    db.run(sql, [description, objets, id], function (err) {
        if (err) {
            // En cas d'erreur, envoyer une réponse d'erreur au client
            res.status(400).json({ error: err.message });
            return;
        }

        // Envoie d'une réponse de succès si la mise à jour a réussi
        res.json({ message: `Catégorie avec l'ID ${id} mise à jour avec succès` });
    });
});

app.delete('/delete-category/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM categories WHERE id = ?';
    db.run(sql, id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: `Catégorie avec l'ID ${id} supprimée avec succès` });
    });
});

// Route pour envoyer la page HTML avec les données intégrées
app.get('/', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:3001/allitems');
        res.render('index', { items: response.data });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
