import http from 'node:http';

const APP_PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
console.log({ APP_PORT: process.env.PORT });
const listener = http.createServer((req, res) => {
    console.log(JSON.stringify({ message: { url: req.url }}));
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ name : 'LWA response'}));
})

listener.listen(APP_PORT, 'localhost', () => {
    console.log(`Server is listening on port ${APP_PORT} ...`);
})