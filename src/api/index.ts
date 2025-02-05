import { routes } from "./routes";

export const main = async () => {
    const server = Bun.serve({
        port: process.env.API_PORT ? parseInt(process.env.API_PORT) : 8081,
        async fetch(req) {
            const url = new URL(req.url);
            let res: Response;

            if (req.method === "GET" && url.pathname === "/contracts") {
                res = await routes.getContracts(req);
            } else if (req.method === "POST" && url.pathname === "/add-contract") {
                res = await routes.addContract(req);
            } else if (req.method === "GET" && url.pathname === "/borrowers") {
                res = await routes.getBorrowers(req, url);
            } else if (req.method === "POST" && url.pathname === "/set-contract-value") {
                res = await routes.setContractValue(req);
            } else {
                res = new Response("Not found", { status: 404 });
            }

            res.headers.set('Access-Control-Allow-Origin', '*');
            res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

            return res;
        },
    });

    console.log(`Server running on http://${server.hostname}:${server.port}`);

}