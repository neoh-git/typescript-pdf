import { Ascii85Encoder } from './ascii85'; // Assuming this is defined as translated previously
import { PdfDataType } from './base';
import { PdfDict } from './dict'; // Assuming PdfDict is defined as translated previously
import { PdfName } from './name';
import { PdfNum } from './num';
import { PdfObjectBase } from './object_base'; // Assuming PdfObjectBase has a .settings property
import { PdfStream } from './stream';

// Assuming the structure of PdfObjectBase.settings (PdfSettings type) looks something like this:
// This is a necessary "implied placeholder" as per the request to avoid explicit placeholders for *this* file's classes.
interface PdfSettings {
    deflate?: (data: Uint8Array) => Uint8Array;
    encryptCallback?: (data: Uint8Array, obj: PdfObjectBase<PdfDataType>) => Uint8Array;
}


/**
 * Represents a PDF dictionary that also contains a stream of data.
 * This class extends PdfDict and manages the stream's data,
 * compression, encryption, and encoding.
 */
export class PdfDictStream extends PdfDict<PdfDataType> {
    public data: Uint8Array;
    public readonly isBinary: boolean;
    public readonly encrypt: boolean;
    public readonly compress: boolean;

    /**
     * Creates a PdfDictStream instance.
     * @param params.values Initial dictionary key-value pairs.
     * @param params.data The raw byte data of the stream. Defaults to an empty Uint8Array.
     * @param params.isBinary If true, the data is treated as binary and may be Ascii85 encoded.
     * @param params.encrypt If true, the stream data will be encrypted.
     * @param params.compress If true, the stream data will be compressed (e.g., FlateDecode).
     */
    constructor(params: {
        values?: Map<string, PdfDataType>; // Using Map for direct translation of Dart Map
        data?: Uint8Array;
        isBinary?: boolean;
        encrypt?: boolean;
        compress?: boolean;
    }) {
        // Call the superclass constructor with the dictionary values.
        // Convert Map to plain object for PdfDict constructor if PdfDict expects plain object.
        // Assuming PdfDict constructor takes a plain object as its `values` argument.
        const initialValues = params.values ? Object.fromEntries(params.values.entries()) : {};
        super(initialValues);

        // Initialize properties
        this.data = params.data ?? new Uint8Array(0);
        this.isBinary = params.isBinary ?? false;
        this.encrypt = params.encrypt ?? true;
        this.compress = params.compress ?? true;
    }

    /**
     * @deprecated Use the main constructor `new PdfDictStream()` instead.
     * Creates a PdfDictStream instance with explicit values and data.
     * @param params.values Initial dictionary key-value pairs.
     * @param params.data The raw byte data of the stream.
     * @param params.isBinary If true, the data is treated as binary and may be Ascii85 encoded.
     * @param params.encrypt If true, the stream data will be encrypted.
     * @param params.compress If true, the stream data will be compressed (e.g., FlateDecode).
     */
    static fromValues(params: {
        values: Map<string, PdfDataType>;
        data: Uint8Array;
        isBinary?: boolean;
        encrypt?: boolean;
        compress?: boolean;
    }): PdfDictStream {
        // This static method acts as the deprecated named constructor.
        // It simply calls the main constructor with the provided parameters.
        return new PdfDictStream(params);
    }

    /**
     * Outputs the PDF dictionary and stream data to a stream.
     * This involves handling compression, encoding, and encryption.
     * @param o The PdfObjectBase associated with this output operation (context),
     *          providing access to settings like deflate and encryption callbacks.
     * @param s The PdfStream to write to.
     * @param indent Optional indentation level for pretty-printing.
     */
    public output(o: PdfObjectBase<PdfDataType>, s: PdfStream, indent?: number): void {
        // Create a mutable copy of the dictionary values to add stream-specific entries.
        // Assuming `this.values` in PdfDict is a plain object { [key: string]: PdfDataType }.
        const _values = new PdfDict({ ...this.values }); // Create a new PdfDict instance

        let _data: Uint8Array | null = null;

        // Check if a filter is already explicitly set (meaning data is already processed)
        if (_values.values.has('/Filter')) {
            _data = this.data;
        } else if (this.compress && o.settings.deflate != null) {
            // Attempt to compress data using the deflate callback from settings.
            const newData = o.settings.deflate(this.data);
            if (newData.length < this.data.length) {
                // Only use compression if it actually reduced size.
                _values.set('/Filter', new PdfName('/FlateDecode'));
                _data = newData;
            }
        }

        // If data hasn't been processed by compression or explicitly filtered
        if (_data == null) {
            if (this.isBinary) {
                // Apply Ascii85 encoding for binary streams if not compressed.
                const encoder = new Ascii85Encoder();
                _data = encoder.convert(this.data);
                _values.set('/Filter', new PdfName('/ASCII85Decode'));
            } else {
                // No compression or special encoding needed, use original data.
                _data = this.data;
            }
        }

        // Apply encryption if enabled and an encryption callback is available.
        if (this.encrypt && o.settings.encryptCallback != null) {
            _data = o.settings.encryptCallback(_data, o);
        }

        // Set the stream length in the dictionary.
        _values.set('/Length', new PdfNum(_data!.length));

        // Output the dictionary part of the stream object.
        _values.output(o, s, indent);

        if (indent != null) {
            s.putByte(0x0a); // Newline after dictionary
        }

        // Output the 'stream' keyword, data, and 'endstream' keyword.
        s.putString('stream\n');
        s.putBytes(_data);
        s.putString('\nendstream');
    }
}