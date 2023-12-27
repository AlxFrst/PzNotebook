const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

function listFilesRecursively(dir, baseDir, fileList = []) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
        const res = path.resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            listFilesRecursively(res, baseDir, fileList);
        } else if (dirent.isFile() && (res.endsWith('.lua') || res.endsWith('.txt'))) {
            const relativePath = path.relative(baseDir, res);
            fileList.push(relativePath);
        }
    });
    return fileList;
}


// Endpoint pour obtenir la liste des fichiers .lua et .txt dans un mod spécifique
app.get('/mod-files/:modID/:modName', (req, res) => {
    const modID = req.params.modID;
    const modName = req.params.modName;
    const modPath = path.join('D:\\Launchers\\Steam\\steamapps\\workshop\\content\\108600', modID, 'mods', modName);
    const basePath = modPath;

    if (!fs.existsSync(modPath)) {
        res.status(404).send('Dossier de mod introuvable');
        return;
    }

    try {
        let files = listFilesRecursively(modPath, basePath);
        res.json(files);
    } catch (err) {
        res.status(500).send('Erreur lors de la recherche des fichiers');
    }
});


// Endpoint modifié pour obtenir le contenu d'un fichier en utilisant un paramètre de requête
app.get('/file-content', (req, res) => {
    const { modID, modName, filePath } = req.query;

    if (!modID || !modName || !filePath) {
        res.status(400).send('Paramètres modID, modName et filePath sont requis');
        return;
    }

    const fullFilePath = path.join('D:\\Launchers\\Steam\\steamapps\\workshop\\content\\108600', modID, 'mods', modName, filePath);

    fs.readFile(fullFilePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.status(404).send('Fichier non trouvé');
            } else {
                res.status(500).send('Erreur lors de la lecture du fichier');
            }
            return;
        }
        res.send(data);
    });
});


// Lister tous les mods pour chaque ID de mod
app.get('/mods', (req, res) => {
    const modsBasePath = 'D:\\Launchers\\Steam\\steamapps\\workshop\\content\\108600';
    fs.readdir(modsBasePath, { withFileTypes: true }, (err, dirs) => {
        if (err) {
            res.status(500).send('Erreur lors de la lecture du dossier');
            return;
        }

        let modIDs = dirs.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
        let mods = {};

        modIDs.forEach(modID => {
            let modPath = path.join(modsBasePath, modID, 'mods');
            if (fs.existsSync(modPath)) {
                fs.readdir(modPath, { withFileTypes: true }, (err, files) => {
                    if (err) {
                        res.status(500).send('Erreur lors de la lecture des dossiers de mods');
                        return;
                    }

                    mods[modID] = files
                        .filter(dirent => dirent.isDirectory())
                        .map(dirent => dirent.name);

                    if (Object.keys(mods).length === modIDs.length) {
                        res.json(mods);
                    }
                });
            } else {
                mods[modID] = [];
                if (Object.keys(mods).length === modIDs.length) {
                    res.json(mods);
                }
            }
        });
    });
});

app.get('/build/:modID/:modName', (req, res) => {
    const modID = req.params.modID;
    const modName = req.params.modName;
    const targetDir = path.join('D:\\Launchers\\Steam\\steamapps\\workshop\\content\\108600', modID, 'mods', modName, 'media', 'scripts');

    if (!fs.existsSync(targetDir)) {
        res.status(404).send('Dossier spécifié introuvable');
        return;
    }

    try {
        let txtFiles = listFilesRecursively(targetDir, targetDir)
            .filter(file => file.endsWith('.txt'));
        res.json(txtFiles);
    } catch (err) {
        res.status(500).send('Erreur lors de la recherche des fichiers .txt');
    }
});


app.listen(port, () => {
    console.log(`Serveur lancé sur http://localhost:${port}`);
});
