const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Middleware para loguear todas las solicitudes entrantes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Cuerpo de la solicitud:', req.body);
    next();
});

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tienda_deportiva'
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a MySQL:', err);
        return;
    }
    console.log('Conectado a MySQL');
});

app.get('/api/productos', (req, res) => {
    const query = 'SELECT * FROM productos';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener productos:', err);
            res.status(500).json({ error: 'Error al obtener productos' });
            return;
        }
        res.json(results);
    });
});

app.post('/api/productos', (req, res) => {
    const { nombre, descripcion, precio, stock, imagen_url, categoria } = req.body;
    if (!nombre || !precio || !stock || !categoria) {
        console.log('Faltan campos obligatorios:', { nombre, precio, stock, categoria });
        res.status(400).json({ error: 'Faltan campos obligatorios (nombre, precio, stock, categoria)' });
        return;
    }
    const query = 'INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, categoria) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [nombre, descripcion, precio, stock, imagen_url, categoria];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al insertar producto:', err);
            res.status(500).json({ error: 'Error al insertar producto' });
            return;
        }
        res.status(201).json({ id: result.insertId, nombre, descripcion, precio, stock, imagen_url, categoria });
    });
});

app.put('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, imagen_url, categoria } = req.body;
    if (!nombre || !precio || !stock || !categoria) {
        console.log('Faltan campos obligatorios:', { nombre, precio, stock, categoria });
        res.status(400).json({ error: 'Faltan campos obligatorios (nombre, precio, stock, categoria)' });
        return;
    }
    const query = 'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen_url = ?, categoria = ? WHERE id = ?';
    const values = [nombre, descripcion, precio, stock, imagen_url, categoria, id];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al actualizar producto:', err);
            res.status(500).json({ error: 'Error al actualizar producto' });
            return;
        }
        if (result.affectedRows === 0) {
            console.log(`Producto con ID ${id} no encontrado`);
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }
        res.json({ id, nombre, descripcion, precio, stock, imagen_url, categoria });
    });
});

app.delete('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM productos WHERE id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar producto:', err);
            res.status(500).json({ error: 'Error al eliminar producto' });
            return;
        }
        if (result.affectedRows === 0) {
            console.log(`Producto con ID ${id} no encontrado`);
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }
        res.status(200).json({ message: 'Producto eliminado correctamente' });
    });
});

app.post('/api/comprar', (req, res) => {
    const items = req.body.items;
    if (!items || !Array.isArray(items) || items.length === 0) {
        console.log('Solicitud inválida: items no proporcionados o no es un arreglo', req.body);
        return res.status(400).json({ error: 'Se requieren items válidos' });
    }

    db.beginTransaction((err) => {
        if (err) {
            console.error('Error al iniciar transacción:', err);
            return res.status(500).json({ error: 'Error al procesar la compra' });
        }

        const errors = [];
        const promises = items.map(item => {
            return new Promise((resolve, reject) => {
                if (!item.id || !item.cantidad || item.cantidad <= 0) {
                    errors.push(`Datos inválidos para el producto con ID ${item.id}`);
                    return resolve();
                }

                // Verificar stock
                db.query('SELECT stock FROM productos WHERE id = ?', [item.id], (err, results) => {
                    if (err) {
                        return reject(err);
                    }
                    if (results.length === 0) {
                        errors.push(`Producto con ID ${item.id} no encontrado`);
                        return resolve();
                    }
                    const stock = results[0].stock;
                    if (stock < item.cantidad) {
                        errors.push(`Stock insuficiente para producto con ID ${item.id}. Disponible: ${stock}`);
                        return resolve();
                    }

                    // Actualizar stock
                    db.query(
                        'UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?',
                        [item.cantidad, item.id, item.cantidad],
                        (err, result) => {
                            if (err) {
                                return reject(err);
                            }
                            if (result.affectedRows === 0) {
                                errors.push(`No se pudo actualizar el stock para producto con ID ${item.id}`);
                            }
                            resolve();
                        }
                    );
                });
            });
        });

        Promise.all(promises)
            .then(() => {
                if (errors.length > 0) {
                    db.rollback(() => {
                        console.log('Transacción revertida debido a errores:', errors);
                        res.status(400).json({ error: 'Errores durante la compra', details: errors });
                    });
                } else {
                    db.commit((err) => {
                        if (err) {
                            db.rollback(() => {
                                console.error('Error al confirmar transacción:', err);
                                res.status(500).json({ error: 'Error al procesar la compra' });
                            });
                            return;
                        }
                        console.log('Compra procesada exitosamente:', items);
                        res.status(200).json({ message: 'Compra realizada exitosamente' });
                    });
                }
            })
            .catch((err) => {
                db.rollback(() => {
                    console.error('Error durante la transacción:', err);
                    res.status(500).json({ error: 'Error al procesar la compra' });
                });
            });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});