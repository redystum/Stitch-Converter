import { file } from "bun";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3003;

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;
    if (pathname === "/" || pathname === "") {
      pathname = "/index.html";
    }

    const filePath = `.${pathname}`;
    const f = file(filePath);
    return new Response(f);
  },
});

console.log(`Server running at http://localhost:${server.port}`);
