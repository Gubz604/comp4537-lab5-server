const http = require('http');
const url = require('url');
const db = require('./db_connection');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 8888;
const endpointRoot = "/API/v1/";

function isPath(reqUrl, pathStr) {
    // accept with or without trailing slash
    const a = reqUrl.endsWith('/') ? reqUrl.slice(0, -1) : reqUrl;
    const b = pathStr.endsWith('/') ? pathStr.slice(0, -1) : pathStr;
    return a === b;
}

const server = http.createServer((req, res) => {
    // CORS and preflight
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    // Default content type; override per route if needed
    res.setHeader("Content-Type", "text/html");

    // Optional: serve a local index.html if you curl the API root
    if (req.method === 'GET' && isPath(req.url, endpointRoot)) {
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                return res.end("API is running.");
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end(data);
        });
        return;
    }

    // POST /API/v1/patients/  -> runs INSERT body as-is
    if (req.method === 'POST' && isPath(req.url, endpointRoot + 'patients/')) {
        let body = '';
        req.on('data', chunk => { if (chunk) body += chunk; });
        req.on('end', () => {
            db.query(body, (err, result) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    return res.end("Database Error: " + err.message);
                }
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                return res.end("Insert Successful!");
            });
        });
        return;
    }

    // GET /API/v1/read/?sql=SELECT...
    if (req.method === 'GET' && req.url.startsWith(endpointRoot + 'read/')) {
        const q = url.parse(req.url, true);
        const sql = (q.query.sql || "").toString();

        if (!sql || !sql.trim().toLowerCase().startsWith('select')) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            return res.end("Error: Only SELECT queries are allowed");
        }

        db.query(sql, (err, result) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end("Database Error: " + err.message);
            }

            // Render results as HTML table
            let html = '<table border="1"><tr>';
            if (Array.isArray(result) && result.length > 0) {
                Object.keys(result[0]).forEach(k => { html += `<th>${k}</th>`; });
                html += '</tr>';
                result.forEach(row => {
                    html += '<tr>';
                    Object.values(row).forEach(v => { html += `<td>${v === null ? '' : v}</td>`; });
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

    // POST /API/v1/write/  -> runs INSERT body as-is
    if (req.method === 'POST' && isPath(req.url, endpointRoot + 'write/')) {
        let body = '';
        req.on('data', chunk => { if (chunk) body += chunk; });
        req.on('end', () => {
            db.query(body, (err, result) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    return res.end("Database Error: " + err.message);
                }
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                return res.end("Write Successful!");
            });
        });
        return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on ${PORT}`);
});
