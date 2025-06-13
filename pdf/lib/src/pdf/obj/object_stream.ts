// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfDict } from '../format/dict';
// import { PdfDictStream } from '../format/dict_stream';
// import { PdfName } from '../format/name';
// import { PdfStream } from '../format/stream';
// import { PdfObject } from './object';

import { PdfDocument } from '../document';
import { PdfDict } from '../format/dict';
import { PdfDictStream } from '../format/dict_stream';
import { PdfName } from '../format/name';
import { PdfStream } from '../format/stream';
import { PdfObject } from './object';

/**
 * Stream Object
 */
export class PdfObjectStream extends PdfObject<PdfDict> {
    /**
     * This holds the stream's content.
     * Dart's `final PdfStream buf = PdfStream();` becomes `public readonly buf: PdfStream = new PdfStream();`
     */
    public readonly buf: PdfStream = new PdfStream();

    /**
     * Defines if the stream needs to be converted to ascii85.
     * Dart's `final bool isBinary;` becomes `public readonly isBinary: boolean;`
     */
    public readonly isBinary: boolean;

    /**
     * Constructs a stream object to store some data.
     * @param pdfDocument The PDF document.
     * @param options.type Optional type for the stream object.
     * @param options.isBinary Whether the stream content should be treated as binary (influences encoding). Defaults to false.
     */
    constructor(
        pdfDocument: PdfDocument,
        options?: {
            type?: string;
            isBinary?: boolean;
        },
    ) {
        // Prepare the initial parameters for the PdfDict.
        // Dart's `params: PdfDict.values({...})` translates to an object literal
        // for the `params` key in the options passed to the super constructor.
        const initialParams: { [key: string]: PdfName } = {}; // Using index signature for dictionary
        if (options?.type != null) {
            initialParams['/Type'] = new PdfName(options.type);
        }

        super(
            pdfDocument,
            {
                params: new PdfDict(initialParams), // Pass the prepared initial params
            }
        );

        // Assign `isBinary` from options or its default.
        this.isBinary = options?.isBinary ?? false;
    }

    /**
     * Writes the content of this stream object to the provided PdfStream.
     * This involves creating a PdfDictStream from the internal buffer and parameters.
     * @param s The PdfStream to write the content to.
     */
    override writeContent(s: PdfStream): void {
        // Dart's `PdfDictStream(...)` factory/constructor with named parameters
        // translates to `new PdfDictStream({...})` in TypeScript.
        new PdfDictStream(
            {
                isBinary: this.isBinary,
                // Dart's `params.values` is like `Array.from(this.params.entries())`
                // or a direct map of values if `PdfDictStream`'s constructor expects a `Map`
                // or a plain object. Assuming `params` has a method to get values suitable for `PdfDictStream`.
                // If `PdfDictStream` takes a `PdfDict` instance directly, it could be `values: this.params,`
                // Assuming `PdfDictStream`'s `values` parameter expects a plain object representing the dictionary entries.
                // If `PdfDict` itself can be serialized into a plain object, we'd do that here.
                // For simplicity, assuming `PdfDict` exposes `entries()` and `PdfDictStream` constructor
                // can take an object of key-value pairs or a PdfDict directly.
                // If `values` here refers to the actual dictionary parameters, then it's `this.params`.
                // Let's assume `values` parameter here is the actual `PdfDict` instance.
                values: this.params, // Assuming PdfDictStream can take the PdfDict object itself.
                data: this.buf.output(), // Assuming `buf.output()` returns Uint8Array or similar
            }
        ).output(this, s, this.settings.verbose ? 0 : undefined); // `null` becomes `undefined`

        s.putByte(0x0a); // Write a newline character after the stream content
    }
}