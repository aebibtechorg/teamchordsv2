# SignalR Hubs - Client Contract

This document describes the SignalR hubs exposed by the API, event names, payload types, and example client usage (JavaScript and .NET).

Base hub URLs

- `POST` server events are broadcast to connected clients via these hubs (server -> client):
  - `/hubs/chordsheets` - ChordSheet events
  - `/hubs/setlists` - SetList events
  - `/hubs/outputs` - Output events

Event names and payloads

- ChordSheet hub (`IChordSheetClient`)
  - `ChordSheetCreated` payload: `ChordSheet` (object)
  - `ChordSheetUpdated` payload: `ChordSheet` (object)
  - `ChordSheetDeleted` payload: `Guid` (id)

- SetList hub (`ISetListClient`)
  - `SetListCreated` payload: `SetList` (object)
  - `SetListUpdated` payload: `SetList` (object)
  - `SetListDeleted` payload: `Guid` (id)

- Output hub (`IOutputClient`)
  - `OutputCreated` payload: `Output` (object)
  - `OutputUpdated` payload: `Output` (object)
  - `OutputDeleted` payload: `Guid` (id)

Example JavaScript client (browser/node):

```javascript
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const conn = new HubConnectionBuilder()
  .withUrl('/hubs/chordsheets')
  .configureLogging(LogLevel.Information)
  .build();

conn.on('ChordSheetCreated', (payload) => {
  console.log('created', payload);
});

conn.on('ChordSheetUpdated', (payload) => {
  console.log('updated', payload);
});

conn.on('ChordSheetDeleted', (id) => {
  console.log('deleted', id);
});

await conn.start();
```

Example .NET client (console):

```csharp
using Microsoft.AspNetCore.SignalR.Client;

var conn = new HubConnectionBuilder()
    .WithUrl("http://localhost:5234/hubs/chordsheets")
    .Build();

conn.On<ChordSheet>("ChordSheetCreated", cs => Console.WriteLine($"Created: {cs.Id}"));
conn.On<ChordSheet>("ChordSheetUpdated", cs => Console.WriteLine($"Updated: {cs.Id}"));
conn.On<Guid>("ChordSheetDeleted", id => Console.WriteLine($"Deleted: {id}"));

await conn.StartAsync();
```

Notes

- The client method names match the typed interface method names (PascalCase). The raw SignalR event names are the method names used by server calls.
- Payload shapes correspond to the EF entities in `tcv2.Api.Data.Entities`.
- When running locally without Redis, the server uses the in-memory hub lifetime manager; to use Redis scale-out, configure `TCRedis` connection string in configuration and a proper Redis instance.
