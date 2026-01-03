const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);
    console.log(`Forking ${numCPUs} workers...`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Handle worker exit
    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        // Optionally replace the dead worker
        console.log('Starting a new worker');
        cluster.fork();
    });
} else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server
    app.prepare().then(() => {
        createServer(async (req, res) => {
            try {
                const parsedUrl = parse(req.url, true);
                await handle(req, res, parsedUrl);
            } catch (err) {
                console.error('Error occurred handling', req.url, err);
                res.statusCode = 500;
                res.end('internal server error');
            }
        })
            .once('error', (err) => {
                console.error(err);
                process.exit(1);
            })
            .listen(port, () => {
                console.log(`> Ready on http://${hostname}:${port} (Worker ${process.pid})`);
            });
    });
}
