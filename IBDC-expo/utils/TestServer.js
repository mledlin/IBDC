const http = require("node:http");

const PORT = 3000;

const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");

    if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200);
        res.end(JSON.stringify({
            ok: true,
            message: "test server running"
        }));
        return;
    }

    if (req.method === "POST" && req.url === "/upload") {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            try {
                const data = JSON.parse(body);

                console.log("Received Upload:");
                console.log(JSON.stringify(data, null, 2));

                res.writeHead(200);
                res.end(JSON.stringify({
                    ok: true,
                    message: "Session received",
                    sessionId: data.sessionId
                }));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({
                    ok: false,
                    message: "Invalid JSON"
                }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Test server running at http://localhost:${PORT}`);
});
