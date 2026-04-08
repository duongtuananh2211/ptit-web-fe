# NSwag

We're using [NSwag](https://github.com/RicoSuter/NSwag) to generate C# and TypeScript clients from Swagger.

## Updating

1. Install NSwag globally via npm:
   ```bash
   npm install -g nswag
   ```
   Alternatively, download [the latest version](https://github.com/RicoSuter/NSwag/releases).
   You may need to skip a version without binary assets since that means it's not fully published yet.
1. Go to the folder with [the `*.nswag` file](/frontend/shared/HorusVisWeb):
   ```bash
   cd frontend/shared/HorusVisWeb
   ```
1. Ensure that HorusVis.Web is running locally.
1. Run `nswag run /runtime:Net80` and verify with the change from backend.
    - If using mac, run `dotnet exec "<pathToNSwag>/Net80/dotnet-nswag.dll" run`
