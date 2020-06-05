"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
If 'side-band' or 'side-band-64k' capabilities have been specified by
the client, the server will send the packfile data multiplexed.

Each packet starting with the packet-line length of the amount of data
that follows, followed by a single byte specifying the sideband the
following data is coming in on.

In 'side-band' mode, it will send up to 999 data bytes plus 1 control
code, for a total of up to 1000 bytes in a pkt-line.  In 'side-band-64k'
mode it will send up to 65519 data bytes plus 1 control code, for a
total of up to 65520 bytes in a pkt-line.

The sideband byte will be a '1', '2' or a '3'. Sideband '1' will contain
packfile data, sideband '2' will be used for progress information that the
client will generally print to stderr and sideband '3' is used for error
information.

If no 'side-band' capability was specified, the server will stream the
entire packfile without multiplexing.
*/
const buffer_1 = require("buffer");
const readable_stream_1 = require("readable-stream");
const GitPktLine_1 = __importDefault(require("../upload-pack/GitPktLine"));
function splitBuffer(buffer, maxBytes) {
    const result = [];
    let index = 0;
    while (index < buffer.length) {
        const buf = buffer.slice(index, index + maxBytes);
        result.push(buf);
        index += buf.length;
    }
    result.push(buffer.slice(index));
    return result;
}
class GitSideBand {
    static demux(input) {
        let read = GitPktLine_1.default.streamReader(input);
        // And now for the ridiculous side-band or side-band-64k protocol
        let packetlines = new readable_stream_1.PassThrough();
        let packfile = new readable_stream_1.PassThrough();
        let progress = new readable_stream_1.PassThrough();
        // TODO: Use a proper through stream?
        const nextBit = async function () {
            let line = await read();
            // Skip over flush packets
            if (line === null)
                return nextBit();
            // A made up convention to signal there's no more to read.
            if (line === true) {
                packetlines.end();
                progress.end();
                packfile.end();
                return;
            }
            // Examine first byte to determine which output "stream" to use
            switch (line[0]) {
                case 1: // pack data
                    packfile.write(line.slice(1));
                    break;
                case 2: // progress message
                    progress.write(line.slice(1));
                    break;
                case 3: // fatal error message just before stream aborts
                    let error = line.slice(1);
                    progress.write(error);
                    packfile.destroy(new Error(error.toString('utf8')));
                    return;
                default:
                    // Not part of the side-band-64k protocol
                    packetlines.write(line.slice(0));
            }
            // Careful not to blow up the stack.
            // I think Promises in a tail-call position should be OK.
            nextBit();
        };
        nextBit();
        return {
            packetlines,
            packfile,
            progress
        };
    }
    static mux(protocol, // 'side-band' or 'side-band-64k'
    packetlines, packfile, progress, error) {
        const MAX_PACKET_LENGTH = protocol === 'side-band-64k' ? 999 : 65519;
        let output = new readable_stream_1.PassThrough();
        packetlines.on('data', data => {
            if (data === null) {
                output.write(GitPktLine_1.default.flush());
            }
            else {
                output.write(GitPktLine_1.default.encode(data));
            }
        });
        let packfileWasEmpty = true;
        let packfileEnded = false;
        let progressEnded = false;
        let errorEnded = true;
        let goodbye = buffer_1.Buffer.concat([
            GitPktLine_1.default.encode(buffer_1.Buffer.from('010A', 'hex')),
            GitPktLine_1.default.flush()
        ]);
        packfile
            .on('data', data => {
            packfileWasEmpty = false;
            const buffers = splitBuffer(data, MAX_PACKET_LENGTH);
            for (const buffer of buffers) {
                output.write(GitPktLine_1.default.encode(buffer_1.Buffer.concat([buffer_1.Buffer.from('01', 'hex'), buffer])));
            }
        })
            .on('end', () => {
            packfileEnded = true;
            if (!packfileWasEmpty)
                output.write(goodbye);
            if (progressEnded && errorEnded)
                output.end();
        });
        progress
            .on('data', data => {
            const buffers = splitBuffer(data, MAX_PACKET_LENGTH);
            for (const buffer of buffers) {
                output.write(GitPktLine_1.default.encode(buffer_1.Buffer.concat([buffer_1.Buffer.from('02', 'hex'), buffer])));
            }
        })
            .on('end', () => {
            progressEnded = true;
            if (packfileEnded && errorEnded)
                output.end();
        });
        // error
        //   .on('data', data => {
        //     const buffers = splitBuffer(data, MAX_PACKET_LENGTH)
        //     for (const buffer of buffers) {
        //       output.write(
        //         GitPktLine.encode(Buffer.concat([Buffer.from('03', 'hex'), buffer]))
        //       )
        //     }
        //   })
        //   .on('end', () => {
        //     errorEnded = true
        //     if (progressEnded && packfileEnded) output.end()
        //   })
        return output;
    }
}
exports.default = GitSideBand;
//# sourceMappingURL=GitSideBand.js.map