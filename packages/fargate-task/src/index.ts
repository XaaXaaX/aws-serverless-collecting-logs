import http from 'node:http';

const APP_PORT = process.env.PORT ? parseInt(process.env.PORT) : 80;
console.log({ APP_PORT: process.env.PORT });
const listener = http.createServer((req, res) => {
    console.log(JSON.stringify({ app_name: 'fargate-example-app', url: req.url }));
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ name : 'Fargate Task response'}));
})

listener.listen(APP_PORT, '0.0.0.0', () => {
    console.log(`Server is listening ${listener.address()?.toString()} on port ${APP_PORT} ...`);
})