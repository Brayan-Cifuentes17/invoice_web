const express = require('express');
const cors = require('cors');
const connection = require('./dataBase');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Obtener productos
app.get('/products', async (req, res) => {
    try {
        connection.query('SELECT P.NOMBRE, PL.* FROM PRODUCTO_LOTE PL JOIN PRODUCTO P ON PL.ID_PRODUCTO = P.ID_PRODUCTO;', (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// Obtener empleados
app.get('/employees', async (req, res) => {
    try {
        connection.query('SELECT U.TIPO,P.ID_PERSONA, P.NOMBRES, P.APELLIDOS FROM USUARIO U JOIN PERSONA P ON U.id_PERSONA = P.id_persona WHERE U.TIPO="EMP";', (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
    } catch (error) {
        console.error('Error al obtener empleados:', error);
        res.status(500).json({ error: 'Error al obtener empleados' });
    }
});

app.get('/customers', async (req, res) => {
    try {
        connection.query('SELECT U.TIPO,P.* FROM USUARIO U JOIN PERSONA P ON U.id_PERSONA = P.id_persona WHERE U.TIPO="CLI";', (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// Obtener facturas
app.get('/invoices', async (req, res) => {
    try {
        connection.query('SELECT * FROM FACTURA;', (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({ error: 'Error al obtener facturas' });
    }
});

app.post('/createInvoices', async (req, res) => {
    console.log('Datos recibidos:', req.body);
    const { invoiceNumber, id_customer, date, items, subtotal,paymentMethod, employee } = req.body;

    try {
        // Primero, inserta la factura
        connection.query('INSERT INTO FACTURA (ID_FACTURA, FECHA, ID_CLIENTE, ID_VENDEDOR) VALUES (?, ?, ?, ?)', 
        [invoiceNumber, date, id_customer, employee], (err, result) => { 
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            // Luego, inserta los detalles de la factura
            items.forEach(item => {
                // Inserta el detalle de la factura
                connection.query('INSERT INTO DETALLE_FACTURA (ID_FACTURA, ID_PRODUCTO, ID_LOTE, CANTIDAD, SUB_TOTAL, IVA, TOTAL_PAGAR, METODO_PAGO) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
                [invoiceNumber, item.id, item.lote, item.quantity, item.totalPrice, ((item.totalPrice*0.19)+item.totalPrice), ((subtotal*0.19)+subtotal), paymentMethod], (err) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    // Descontar la cantidad del producto en la base de datos
                    connection.query('UPDATE PRODUCTO_LOTE SET CANTIDAD = CANTIDAD - ? WHERE ID_PRODUCTO = ? AND ID_LOTE = ?', 
                    [item.quantity, item.id, item.lote], (err) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                    });
                });
            });

            res.status(201).json({ message: 'Factura creada con éxito' });
        });
    } catch (error) {
        console.error('Error al crear la factura:', error);
        res.status(500).json({ error: 'Error al crear la factura' });
    }
});
//ver factura
app.get('/viewInvoice/:id', async (req, res) => {
    const { id } = req.params;
    console.log(id)
    const query = `
  SELECT F.*, P.*,D.ID_PRODUCTO, PR.NOMBRE, D.CANTIDAD,D.SUB_TOTAL,D.IVA,D.TOTAL_PAGAR, D.METODO_PAGO 
        FROM FACTURA F JOIN PERSONA P ON F.ID_CLIENTE=P.ID_PERSONA JOIN DETALLE_FACTURA D ON F.ID_FACTURA= D.ID_FACTURA JOIN PRODUCTO PR ON PR.ID_PRODUCTO= D.ID_PRODUCTO 
        where d.id_factura=?
    `;
    
    try {
      connection.query(query, [id], (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(result);
        console.log(result)
      });
    } catch (error) {
      console.error('Error al obtener la factura:', error);
      res.status(500).send('Error al obtener la factura');
    }
});

// Actualizar factura
app.put('/update/:id', async (req, res) => {
    const invoiceId = req.params.id;
    const { invoiceNumber, customerName, date, items, paymentMethod } = req.body;

    try {
        // Actualiza la factura
        connection.query('UPDATE FACTURA SET ID_FACTURA = ?, FECHA = ? WHERE ID_FACTURA = ?', [invoiceNumber, date, invoiceId], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Aquí puedes manejar la actualización de los detalles de la factura
            // (esto depende de cómo quieras gestionar los cambios en los ítems)

            res.json({ message: 'Factura actualizada con éxito' });
        });
    } catch (error) {
        console.error('Error al actualizar la factura:', error);
        res.status(500).json({ error: 'Error al actualizar la factura' });
    }
});

// Eliminar factura
app.delete('/delete/:id', async (req, res) => {
    const invoiceId = req.params.id;

    try {
        // Primero elimina los detalles asociados
        await new Promise((resolve, reject) => {
            connection.query('DELETE FROM detalle_factura WHERE FACTURA = ?', [invoiceId], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        // Luego elimina la factura
        connection.query('DELETE FROM FACTURA WHERE ID_FACTURA = ?', [invoiceId], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Factura eliminada con éxito' });
        });
    } catch (error) {
        console.error('Error al eliminar la factura:', error);
        res.status(500).json({ error: 'Error al eliminar la factura' });
    }
});

app.get('/lastInvoiceNumber', async (req, res) => {
    try {
        connection.query('SELECT MAX(ID_FACTURA) AS lastInvoiceNumber FROM FACTURA;', (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ lastInvoiceNumber: results[0].lastInvoiceNumber || 0 });
        });
    } catch (error) {
        console.error('Error al obtener el último número de factura:', error);
        res.status(500).json({ error: 'Error al obtener el último número de factura' });
    }
});



app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
