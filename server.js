const http = require('http');
const url = require('url');
const db = require('./db_connection');
const path = require('path');
const fs = require('fs');

const PORT = 8888;

const endpointRoot = "/API/v1/";


const server = http.createServer((req, res) => {

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");


    console.log(req.headers);

    // Serves the index.html file at the root endpoint
    if (req.method == 'GET' && req.url == endpointRoot) {
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                return res.end("Error loading index.html");
            }
            res.end(data);
        });
        return;
    }

    // Handles POST request to automatically insert rows into the patient table
    if (req.method === 'POST' && req.url == endpointRoot + 'patients/') {
        let body = '';

        req.on('data', function (chunk) {
            if (chunk != null) {
                body += chunk;
            }
        });

        req.on('end', function () {
            db.query(body, (err, result) => {
                if (err) throw err;
                console.log(result);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                return res.end("Insert Successful!");
            });
        });
        return;
    }

    // Handles GET request to read from the patient table
    if (req.method === 'GET' && req.url.startsWith(endpointRoot + 'read/')) {
    let q = url.parse(req.url, true);
    let sql = q.query.sql;
    
    if (!sql || !sql.trim().toLowerCase().startsWith('select')) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        return res.end("Error: Only SELECT queries are allowed");
    }
    
    db.query(sql, (err, result) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            return res.end("Database Error: " + err.message);
        }
        
        // Following code was created with the help of Claude Sonnet 4.5
        // Format results as HTML table
        let html = '<table border="1"><tr>';
        
        // Add headers
        if (result.length > 0) {
            Object.keys(result[0]).forEach(key => {
                html += `<th>${key}</th>`;
            });
            html += '</tr>';
            
            // Add data rows
            result.forEach(row => {
                html += '<tr>';
                Object.values(row).forEach(value => {
                    html += `<td>${value}</td>`;
                });
                html += '</tr>';
            });
        } else {
            html += '<th>No Results</th></tr>';
        }
        
        html += '</table>';
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
    });
    return;
}


if (req.method === 'POST' && req.url === endpointRoot + 'write/') {
    let body = '';

    req.on('data', function (chunk) {
        if (chunk != null) {
            body += chunk;
        }
    });

    req.on('end', function() {
        db.query(body, (err, result) => {
            if (err) throw err;
            console.log(result);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end("Write Successful!");
        });
    });
    return;
}   


    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("404 Not Found");
});

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT + endpointRoot}`);
});