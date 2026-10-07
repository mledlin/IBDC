const http = require("node:http");

const PORT = 3000;
const uploads = [];
//Simple dashboard for viewing sent data.
const dashboard = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Server</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f6fa;
            padding: 30px;
            color: #1e293b;
        }

        h1 {
            color: #1e40af;
        }

        .session {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #e2e8f0;
        }

        pre {
            background-color: #f1f5f9;
            padding: 12px;
            overflow-wrap: anywhere;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <h1>Test Server</h1>
    <p>Received Session Uploads</p>

    <div id="uploads">No uploads received.</div>

    <script>
        async function loadUploads() {
            const response = await fetch("/api/uploads");
            const uploads = await response.json();
            const container = document.getElementById("uploads");

            container.innerHTML = "";

            if (uploads.length === 0) {
                container.textContent = "No uploads received.";
                return;
            }

            uploads.slice().reverse().forEach(upload => {
                const session = document.createElement("div");
                session.className = "session";

                const title = document.createElement("h2");
                title.textContent = "Session: " + upload.sessionId;

                const count = document.createElement("p");
                count.textContent =
                    "Incidents: " + (upload.data.incidents || []).length;

                const details = document.createElement("details");
                const summary = document.createElement("summary");
                summary.textContent = "View Session Data";

                const json = document.createElement("pre");
                json.textContent = JSON.stringify(upload, null, 2);

                details.append(summary, json);
                session.append(title, count, details);
                container.appendChild(session);
            });
        }

        loadUploads();
        setInterval(loadUploads, 3000);
    </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");

    //Displaying the data sent from app
    if (req.method === "GET" && req.url === "/") {
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.end(dashboard);
        return;
    }
    if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200);
        res.end(JSON.stringify({
            ok: true,
            message: "test server running"
        }));
        return;
    }
    //Returns received uploads.
    if(req.mnethod === "GET" && req.url === "/api/uploads"){
        res.writeHead(200);
        res.end(JSON.stringify(uploads));
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
