const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const productosPath = path.join(__dirname, 'assets', 'productos.xml');

app.get('/productos', (req, res) => {
  fs.readFile(productosPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo XML:', err);
      return res.status(500).json({ error: 'Error al leer el archivo XML' });
    }
    const parser = new xml2js.Parser();
    parser.parseString(data, (err, result) => {
      if (err) {
        console.error('Error al parsear el XML:', err);
        return res.status(500).json({ error: 'Error al parsear el XML' });
      }
      res.json(result);
    });
  });
});

app.post('/productos', (req, res) => {
  const xmlContent = req.body.xmlContent;
  fs.writeFile(productosPath, xmlContent, 'utf8', (err) => {
    if (err) {
      console.error('Error al guardar el archivo XML:', err);
      return res.status(500).json({ error: 'Error al guardar el archivo XML' });
    }
    res.json({ message: 'Archivo XML actualizado correctamente' });
  });
});

app.listen(3000, () => {
  console.log('Servidor backend corriendo en http://localhost:3000');
});