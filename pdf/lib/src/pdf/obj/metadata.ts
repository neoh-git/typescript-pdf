// Assuming these are defined in their respective .ts files:
// For XmlDocument, you might use 'xml-js', 'libxmljs', or a similar XML parsing/building library.
// For example, if using 'xml' package for Node.js/browsers:
// import { XmlDocument } from 'xml'; // Assuming you have a type/interface for XmlDocument
// Or if the `xml` package provides its own types:
// import { Document as XmlDocument } from 'xml';

import { PdfDocument } from '../document';
import { PdfDictStream } from '../format/dict_stream';
import { PdfName } from '../format/name';
import { PdfObject } from './object';

// To handle `xml.XmlDocument`, we'll define a minimal interface or assume a specific library.
// Example for a simple interface based on common XML library patterns:
interface XmlDocument {
    // Assuming a method to get the XML string representation
    toString(): string;
    // Other potential methods like parsing, querying, etc.
}

// If using a specific XML library, you'd import its actual types:
// import { Document as XmlDocument } from 'your-xml-library';


/**
 * Pdf Metadata object (XMP stream)
 */
export class PdfMetadata extends PdfObject<PdfDictStream> {
    // Dart's `final XmlDocument metadata;` translates to `public readonly metadata: XmlDocument;`
    public readonly metadata: XmlDocument;

    /**
     * Store an Xml object as PDF metadata.
     * @param pdfDocument The PDF document to which this metadata belongs.
     * @param metadata The XML document to store.
     */
    constructor(pdfDocument: PdfDocument, metadata: XmlDocument) {
        // In Dart, `super(...)` with named parameters (like `params: PdfDictStream(...)`)
        // is translated to passing an options object to the super constructor in TypeScript.
        super(
            pdfDocument,
            {
                // Assuming PdfDictStream constructor takes an object for its parameters.
                params: new PdfDictStream({
                    compress: false,
                    encrypt: false,
                }),
            }
        );

        // Assign the metadata parameter to the readonly property.
        this.metadata = metadata;

        // Dart's `pdfDocument.catalog.metadata = this;`
        pdfDocument.catalog.metadata = this;
    }

    /**
     * Prepares the PDF metadata object by setting its type and subtype,
     * and encoding the XML content into its data stream.
     */
    override prepare(): void {
        super.prepare(); // Call the base class's prepare method first.

        // Set PDF parameters. Dart's `const PdfName(...)` becomes `new PdfName(...)` in TypeScript.
        this.params.set('/Type', new PdfName('/Metadata'));
        this.params.set('/Subtype', new PdfName('/XML'));

        // Dart's `Uint8List.fromList(utf8.encode(metadata.toString()))`
        // In TypeScript:
        // `metadata.toString()` gets the XML string.
        // `new TextEncoder().encode(xmlString)` is the standard way to get UTF-8 bytes (Uint8Array).
        // Node.js equivalent: `Buffer.from(xmlString, 'utf8')`.
        // The `params` object (an instance of `PdfDictStream`) is assumed to have a `data` property
        // that accepts `Uint8Array`.
        this.params.data = new TextEncoder().encode(this.metadata.toString());
    }
}