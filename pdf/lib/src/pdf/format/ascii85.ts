// No direct equivalent of dart:convert's Converter in standard TS.
// We'll define a simple interface to mimic its behavior.
interface Converter<S, T> {
    convert(input: S): T;
}

/**
 * Ascii 85 encoder
 */
export class Ascii85Encoder implements Converter<Uint8Array, Uint8Array> {
    /**
     * Converts a Uint8Array (byte array) into an Ascii85 encoded Uint8Array.
     * @param input The input Uint8Array to encode.
     * @returns A new Uint8Array containing the Ascii85 encoded bytes.
     */
    public convert(input: Uint8Array): Uint8Array {
        // Calculate the maximum possible encoded length.
        // It's (input.length + 3) ~/ 4 * 5 + 2 for the "~>" terminator.
        // The +2 is for the "~>" terminator.
        const output = new Uint8Array(this._maxEncodedLen(input.length) + 2);

        let outputOffset = 0;
        let inputOffset = 0;

        while (inputOffset < input.length) {
            // Initialize 5 bytes for potential output (or fewer if padding needed)
            // This initialization is implicit in JS/TS as new Uint8Array is zero-filled.
            // But explicitly setting them ensures the logic mirrors Dart's behavior for partial blocks.
            // For a new Uint8Array, this explicit setting isn't strictly necessary as they are 0 by default,
            // but it helps in understanding the original Dart logic.
            // The bytes will be overwritten anyway.

            // Unpack up to 4 bytes from input into a 32-bit integer.
            let value = 0;

            // Handle partial blocks at the end of the input
            const remainingInputBytes = input.length - inputOffset;

            switch (remainingInputBytes) {
                case 1:
                    value |= input[inputOffset + 0] << 24; // Only 1 byte, padded with zeros
                    break;
                case 2:
                    value |= input[inputOffset + 0] << 24;
                    value |= input[inputOffset + 1] << 16; // 2 bytes, padded
                    break;
                case 3:
                    value |= input[inputOffset + 0] << 24;
                    value |= input[inputOffset + 1] << 16;
                    value |= input[inputOffset + 2] << 8; // 3 bytes, padded
                    break;
                default: // 4 or more bytes (standard block)
                    value |= input[inputOffset + 0] << 24;
                    value |= input[inputOffset + 1] << 16;
                    value |= input[inputOffset + 2] << 8;
                    value |= input[inputOffset + 3];
                    break;
            }

            // Special case: zero block (all four bytes are 0) shortens to 'z'.
            // This only applies if we actually processed a full 4-byte block.
            if (value === 0 && remainingInputBytes >= 4) {
                output[outputOffset] = 122; // 'z' ASCII value
                outputOffset++;
                inputOffset += 4; // Consumed 4 input bytes
                continue; // Move to the next block
            }

            // Otherwise, convert the 32-bit integer into 5 base-85 digits.
            // Each digit corresponds to an ASCII character from '!' (33) to 'u' (117).
            // (85 characters, '!' to 'u' inclusive)
            for (let i = 4; i >= 0; i--) {
                output[outputOffset + i] = 33 + (value % 85);
                value = Math.trunc(value / 85); // Integer division
            }

            // If the last block of input was short (less than 4 bytes),
            // we output fewer than 5 characters. The number of output characters
            // is (remainingInputBytes + 1). This discard the extra padding bytes.
            if (remainingInputBytes < 4) {
                outputOffset += remainingInputBytes + 1; // +1 to account for the first actual char
                break; // End of input
            }

            inputOffset += 4; // Consumed 4 input bytes
            outputOffset += 5; // Produced 5 output bytes
        }

        // Add final "~>" terminator (ASCII values 126 and 62)
        output[outputOffset++] = 126; // '~'
        output[outputOffset++] = 62;  // '>'

        // Return a new Uint8Array with the actual length of the encoded data.
        return output.slice(0, outputOffset);
    }

    /**
     * Calculates the maximum possible length of the encoded output.
     * This is used to pre-allocate the output buffer.
     * Formula: ceil(length / 4) * 5
     * @param length The length of the input Uint8Array.
     * @returns The maximum encoded length without the final "~>".
     */
    private _maxEncodedLen(length: number): number {
        // (length + 3) / 4 is equivalent to ceil(length / 4) for positive integers
        return Math.trunc((length + 3) / 4) * 5;
    }
}