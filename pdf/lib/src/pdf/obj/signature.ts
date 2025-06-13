// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfDict } from '../format/dict';
// import { PdfName } from '../format/name';
// import { PdfStream } from '../format/stream';
// import { PdfObject } from './object';
// import { PdfObjectStream } from './object_stream';

import { PdfDocument } from '../document';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfStream } from '../format/stream';
import { PdfObject } from './object';
import { PdfObjectStream } from './object_stream';

/**
 * Signature flags
 */
export enum PdfSigFlags {
    /** The document contains at least one signature field. */
    signaturesExist = 0, // Corresponds to 1 << 0

    /**
     * The document contains signatures that may be invalidated if the file is
     * saved (written) in a way that alters its previous contents, as opposed
     * to an incremental update.
     */
    appendOnly = 1, // Corresponds to 1 << 1
}

/**
 * Represents a PDF Signature dictionary.
 */
export class PdfSignature extends PdfObject<PdfDict> {
    // Dart's `final Set<PdfSigFlags> flags;` becomes `public readonly flags: Set<PdfSigFlags>;`
    public readonly flags: Set<PdfSigFlags>;

    // Dart's `final PdfSignatureBase value;` becomes `public readonly value: PdfSignatureBase;`
    public readonly value: PdfSignatureBase;

    // Dart's `final crl = <PdfObjectStream>[];` becomes `public readonly crl: PdfObjectStream[] = [];`
    public readonly crl: PdfObjectStream[] = [];
    public readonly cert: PdfObjectStream[] = [];
    public readonly ocsp: PdfObjectStream[] = [];

    // Private fields to store offsets for signature byte range.
    private _offsetStart?: number;
    private _offsetEnd?: number;

    /**
     * Constructs a PdfSignature object.
     * @param pdfDocument The PDF document.
     * @param options.value The concrete implementation of the signature (e.g., cryptographic details).
     * @param options.flags A set of signature flags.
     * @param options.crl Optional list of Certificate Revocation List data.
     * @param options.cert Optional list of certificate data.
     * @param options.ocsp Optional list of Online Certificate Status Protocol data.
     */
    constructor(
        pdfDocument: PdfDocument,
        options: {
            value: PdfSignatureBase;
            flags: Set<PdfSigFlags>;
            crl?: Uint8Array[]; // Dart's `Uint8List` is `Uint8Array` in TS
            cert?: Uint8Array[];
            ocsp?: Uint8Array[];
        },
    ) {
        // Call the super constructor. Dart's `params: PdfDict.values({...})` becomes an object literal.
        super(
            pdfDocument,
            {
                params: new PdfDict({
                    '/Type': new PdfName('/Sig'), // Dart's `const PdfName('/Sig')`
                }),
            }
        );

        // Assign readonly properties.
        this.value = options.value;
        this.flags = options.flags;

        // Process optional lists, creating PdfObjectStream for each.
        if (options.crl != null) {
            for (const o of options.crl) {
                // Dart's `..buf.putBytes(o)` is a cascade operator.
                // In TS, create the object, then call the method.
                const stream = new PdfObjectStream(pdfDocument);
                stream.buf.putBytes(o);
                this.crl.push(stream);
            }
        }
        if (options.cert != null) {
            for (const o of options.cert) {
                const stream = new PdfObjectStream(pdfDocument);
                stream.buf.putBytes(o);
                this.cert.push(stream);
            }
        }
        if (options.ocsp != null) {
            for (const o of options.ocsp) {
                const stream = new PdfObjectStream(pdfDocument);
                stream.buf.putBytes(o);
                this.ocsp.push(stream);
            }
        }
    }

    /**
     * Calculates the integer value of the signature flags.
     * Each flag corresponds to a bit in the integer.
     * @returns The combined integer value of the flags.
     */
    get flagsValue(): number {
        if (this.flags.size === 0) { // Dart's `flags.isEmpty`
            return 0;
        }
        // Map each flag enum member to its corresponding bit value (1 << enum_value)
        // and then reduce (OR) them together.
        return Array.from(this.flags.values())
            .map((e: PdfSigFlags) => 1 << e) // `e` is already the number (index) value of the enum
            .reduce((a: number, b: number) => a | b);
    }

    /**
     * Overrides the base `output` method to handle signature-specific processing.
     * This method calls `value.preSign` before writing the object.
     * It also records the byte range for the signature.
     * @param s The PdfStream to write to.
     * @returns The offset of the object in the stream.
     */
    override output(s: PdfStream): number {
        // Call the signature value's preSign method to prepare parameters.
        this.value.preSign(this, this.params);

        // Call the base PdfObject's output method to write the object.
        const offset = super.output(s);

        // Calculate and store the start and end offsets of the signature placeholder.
        // The length of the object definition line (e.g., "1 0 obj\n").
        // Dart's `'$objser $objgen obj\n'.length`
        const objDefLineLength = `${this.objser} ${this.objgen} obj\n`.length;
        this._offsetStart = offset + objDefLineLength;
        this._offsetEnd = s.offset; // Current stream offset after writing the object

        return offset;
    }

    /**
     * Asynchronously writes the actual cryptographic signature into the reserved byte range.
     * This method must be called after the document has been fully outputted (to get the `_offsetStart` and `_offsetEnd`).
     * @param os The PdfStream (output stream) to write the signature into.
     * @returns A Promise that resolves when the signature is written.
     * @throws Error if the object space was not reserved (i.e., `output` was not called previously).
     */
    async writeSignature(os: PdfStream): Promise<void> {
        // Dart's `assert` for debug builds. For production, throw an error.
        if (this._offsetStart == null || this._offsetEnd == null) {
            if (this.pdfDocument.isDebug) { // Assuming `isDebug` is available from `PdfObject`
                console.assert(false, 'Must reserve the object space before signing the document');
            }
            throw new Error('Must reserve the object space before signing the document');
        }

        // Call the concrete signature implementation to perform the signing.
        await this.value.sign(this, os, this.params, this._offsetStart, this._offsetEnd);
    }
}

/**
 * Abstract base class for PDF signature implementations.
 * Concrete classes will handle the cryptographic signing process.
 */
export abstract class PdfSignatureBase {
    /**
     * Indicates if the signature implements Modification Detection and Prevention (MDP).
     * @returns True if MDP is supported, false otherwise.
     */
    get hasMDP(): boolean {
        return false; // Default implementation
    }

    /**
     * Prepares the PdfObject and PdfDict parameters before the signature object is written.
     * This might involve setting up digest algorithms, certificate references, etc.
     * @param object The PdfSignature object itself.
     * @param params The dictionary of the PdfSignature object.
     */
    abstract preSign(object: PdfObject<PdfDict>, params: PdfDict): void;

    /**
     * Asynchronously performs the cryptographic signing operation and writes the signature
     * into the designated byte range within the PDF stream.
     * @param object The PdfSignature object itself.
     * @param os The PdfStream to write the signature into.
     * @param params The dictionary of the PdfSignature object.
     * @param offsetStart The starting offset of the signature placeholder in the stream.
     * @param offsetEnd The ending offset of the signature placeholder in the stream.
     * @returns A Promise that resolves when the signing is complete.
     */
    abstract sign(
        object: PdfObject<PdfDict>,
        os: PdfStream,
        params: PdfDict,
        offsetStart?: number,
        offsetEnd?: number,
    ): Promise<void>;
}