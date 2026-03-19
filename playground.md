import Runloop from "@runloop/api-client";

const PORT = 3000;

async function main() {
  const client = new Runloop({
    bearerToken: process.env.RUNLOOP_API_KEY,
  });

  console.log("Creating devbox and waiting for it to be running...");
  const devbox = await client.devboxes.createAndAwaitRunning({
    launch_parameters: {
      available_ports: [PORT],
    },
    entrypoint: `python3 -m http.server ${PORT}`,
  });

  console.log(`Devbox created: ${devbox.id} (status: ${devbox.status})`);

  console.log("Enabling tunnel...");
  const tunnel = await client.devboxes.enableTunnel(devbox.id, {
    auth_mode: "open",
    http_keep_alive: true,
  });

  const tunnelUrl = `https://${PORT}-${tunnel.tunnel_key}.tunnel.runloop.ai`;

  console.log("\n========================================");
  console.log(`Tunnel URL: ${tunnelUrl}`);
  console.log("========================================\n");
  console.log("Open this URL in your browser to see the page served from the devbox.");
  console.log("Press Ctrl+C to exit (the devbox will keep running).");

  // Keep the process alive so the user can browse
  await new Promise(() => {});
}

main().catch(console.error);
