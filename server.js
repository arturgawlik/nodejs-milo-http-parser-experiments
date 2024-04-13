import { createServer } from "node:net";
import { milo } from "@perseveranza-pets/milo";

const server = createServer((socket) => {
  socket.on("data", (dataBuf) => {
    // Allocate a memory in the WebAssembly space. This speeds up data copying to the WebAssembly layer.
    const ptr = milo.alloc(dataBuf.length);

    // Create a buffer we can use normally.
    const buffer = Buffer.from(milo.memory.buffer, ptr, dataBuf.length);

    // Create the parser
    const parser = milo.create();
    /*
    Milo works using callbacks.

    All callbacks have the same signature, which characterizes the payload:
    
        * The current parent
        * from: The payload offset.
        * size: The payload length.
        
    The payload parameters above are relative to the last data sent to the milo.parse method.

    If the current callback has no payload, both values are set to 0.
    */
    milo.setOnData(parser, (p, from, size) => {
      console.log(
        `Pos=${milo.getPosition(p)} Body: ${dataBuf
          .slice(from, from + size)
          .toString()}`
      );
    });

    // Now perform the main parsing using milo.parse. The method returns the number of consumed characters.
    buffer.set(dataBuf, 0);
    const consumed = milo.parse(parser, ptr, dataBuf.length);

    // Cleanup used resources.
    milo.destroy(parser);
    milo.dealloc(ptr, dataBuf.length);
  });
});

server.listen(8000, () =>
  console.log("server listening on http://localhost:8000")
);
