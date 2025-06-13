// Assuming these are defined in other TypeScript files:
import { PdfDocument } from './document'; // Maps to 'document.dart'
import { PdfVersion } from './format/object_base'; // Maps to 'format/object_base.dart'

/**
 * Base class for loading an existing PDF document.
 */
export abstract class PdfDocumentParserBase {
    /**
     * Create a Document loader instance
     *
     * @param bytes The existing PDF document content.
     */
    constructor(public readonly bytes: Uint8Array) { } // Dart's `final Uint8List bytes;` becomes `public readonly bytes: Uint8Array;`

    /**
     * The objects size of the existing PDF document
     */
    abstract get size(): number; // Dart's `int` becomes TypeScript's `number`

    /**
     * The offset of the previous cross reference table
     */
    abstract get xrefOffset(): number; // Dart's `int` becomes TypeScript's `number`

    get version(): PdfVersion {
        return PdfVersion.pdf_1_4;
    }

    /**
     * Import the existing objects into the new PDF document
     */
    abstract mergeDocument(pdfDocument: PdfDocument): void; // Dart's `void` is `void` in TS
}