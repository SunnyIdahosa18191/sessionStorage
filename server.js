require('dotenv').config();

const express = require('express');
const { Pool } = require('pg'); 
const app = express();
const port = process.env.PORT;

// PostgreSQL connection settings
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Static file
app.use(express.static(__dirname)); 


// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

app.get('/api/shops', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM Shops');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/drugs', async (req, res) => {
    const shopId = req.query.shopId;

    try {
        let query = 'SELECT * FROM Drugs';
        let params = [];

        if (shopId && Number.isInteger(parseInt(shopId))) {
            query += ' WHERE ShopId = $1';
            params.push(shopId);
        }

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/drugs/:id', async (req, res) => {
    const drugId = req.params.id;

    if (!Number.isInteger(parseInt(drugId))) {
        return res.status(400).json({ error: 'Invalid drug ID' });
    }

    try {
        const { rows } = await pool.query('SELECT * FROM Drugs WHERE Id = $1', [drugId]);

        // Check if drug was found
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Drug not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

app.use(express.json()); 

app.post('/api/orders', async (req, res) => {
    const { name, email, phone, address, orderDetails } = req.body;

    try {
        await pool.query('BEGIN'); // Start transaction

        const orderResult = await pool.query(
            'INSERT INTO Orders(Name, Email, Phone, Address) VALUES($1, $2, $3, $4) RETURNING Id',
            [name, email, phone, address]
        );

        const orderId = orderResult.rows[0].id;

        for (const detail of orderDetails) {
            await pool.query(
                'INSERT INTO OrderDetails(OrderId, DrugId, Quantity) VALUES($1, $2, $3)',
                [orderId, detail.drugId, detail.quantity]
            );
        }

        await pool.query('COMMIT'); // Commit transaction

        res.json({ success: true, message: 'Order placed successfully', orderId });
    } catch (err) {
        await pool.query('ROLLBACK'); // Rollback transaction on error
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

