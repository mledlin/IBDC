const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const Busboy = require("busboy");
const PORT = 3000;
const uploads = [];

const uploadDirectory = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDirectory, {recursive: true});

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
    if(req.method === "GET" && req.url === "/api/uploads"){
        res.writeHead(200);
        res.end(JSON.stringify(uploads));
        return;
    }
if (req.method === "POST" && req.url === "/upload") {

    const contentType = req.headers["content-type"] || "";

    // Preserve JSON uploads for sessions without images.
    if (contentType.includes("application/json")) {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            try {
                const data = JSON.parse(body);
                uploads.push(data);

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

    // Handle metadata and actual image files.
    if (contentType.includes("multipart/form-data")) {
        const busboy = Busboy({
            headers: req.headers,
            limits: {
                fileSize: 15 * 1024 * 1024,
                files: 20
            }
        });

        let metadata = null;
        const images = [];
        const pendingWrites = [];
        let uploadError = null;

        busboy.on("field", (name, value) => {
            if (name === "metadata") {
                try {
                    metadata = JSON.parse(value);
                } catch (error) {
                    uploadError = error;
                }
            }
        });

        busboy.on("file", (fieldName, file, info) => {
            const filename = `${require("node:crypto").randomUUID()}.jpg`;
            const destination = path.join(uploadDirectory, filename);

            const output = fs.createWriteStream(destination);

            file.on("limit", () => {
                uploadError = new Error("Image exceeds size limit");
            });

            file.on("error", error => {
                uploadError = error;
                output.destroy(error);
            });

            const completed = new Promise((resolve, reject) => {
                output.on("finish", resolve);
                output.on("error", reject);
            });

            pendingWrites.push(completed);
            file.pipe(output);

            images.push({
                fieldName,
                filename,
                mimeType: info.mimeType
            });
        });

        busboy.on("error", error => {
            uploadError = error;
        });

        busboy.on("filesLimit", () => {
            uploadError = new Error("Too many images");
        });

        busboy.on("close", async () => {
            try {
                await Promise.all(pendingWrites);

                if (uploadError) {
                    throw uploadError;
                }

                if (!metadata || !metadata.sessionId) {
                    throw new Error("Missing session metadata");
                }

                const upload = {
                    ...metadata,
                    images
                };

                uploads.push(upload);

                console.log("Received Upload:", upload);

                res.writeHead(200);
                res.end(JSON.stringify({
                    ok: true,
                    message: "Session and images received",
                    sessionId: metadata.sessionId,
                    imageCount: images.length
                }));

            } catch (error) {
                console.error("Upload failed:", error);

                res.writeHead(400);
                res.end(JSON.stringify({
                    ok: false,
                    message: "Image upload failed"
                }));
            }
        });

        req.pipe(busboy);
        return;
    }

    res.writeHead(415);
    res.end(JSON.stringify({
        ok: false,
        message: "Unsupported content type"
    }));

    return;
}

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Test server running at http://localhost:${PORT}`);
});
