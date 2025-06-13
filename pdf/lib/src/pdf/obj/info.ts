// Assuming these are defined in their respective .ts files:
// import { PdfDocument } from '../document';
// import { PdfDict } from '../format/dict';
// import { PdfString } from '../format/string';
// import { PdfXrefTable } from '../format/xref'; // Assuming PdfXrefTable.libraryName is a static property
// import { PdfObject } from './object';

import { PdfDocument } from '../document';
import { PdfDict } from '../format/dict';
import { PdfString } from '../format/string';
import { PdfXrefTable } from '../format/xref';
import { PdfObject } from './object';

/**
 * Information object
 */
export class PdfInfo extends PdfObject<PdfDict> {
    // Dart's `final String? author;` translates to `public readonly author?: string;`
    /**
     * Author of this document
     */
    public readonly author?: string;

    /**
     * Creator of this document
     */
    public readonly creator?: string;

    /**
     * Title of this document
     */
    public readonly title?: string;

    /**
     * Subject of this document
     */
    public readonly subject?: string;

    /**
     * Keywords of this document
     */
    public readonly keywords?: string;

    /**
     * Application that created this document
     */
    public readonly producer?: string;

    /**
     * Create an information object
     * @param pdfDocument The PDF document.
     * @param options.title Title of the document.
     * @param options.author Author of the document.
     * @param options.creator Creator of the document.
     * @param options.subject Subject of the document.
     * @param options.keywords Keywords for the document.
     * @param options.producer Application that created the document.
     */
    constructor(
        pdfDocument: PdfDocument,
        options?: {
            title?: string;
            author?: string;
            creator?: string;
            subject?: string;
            keywords?: string;
            producer?: string;
        },
    ) {
        // In Dart, the constructor uses an initializer list with `PdfDict.values`
        // and conditional map entries. In TypeScript, we construct the initial
        // parameters object explicitly and then pass it to the PdfDict constructor.
        const initialParams: Record<string, PdfString> = {}; // Using Record<string, PdfString> for type safety

        if (options?.author != null) {
            initialParams['/Author'] = PdfString.fromString(options.author);
        }
        if (options?.creator != null) {
            initialParams['/Creator'] = PdfString.fromString(options.creator);
        }
        if (options?.title != null) {
            initialParams['/Title'] = PdfString.fromString(options.title);
        }
        if (options?.subject != null) {
            initialParams['/Subject'] = PdfString.fromString(options.subject);
        }
        if (options?.keywords != null) {
            initialParams['/Keywords'] = PdfString.fromString(options.keywords);
        }

        // Handle the '/Producer' field:
        if (options?.producer != null) {
            initialParams['/Producer'] = PdfString.fromString(
                `${options.producer} (${PdfXrefTable.libraryName})`,
            );
        } else {
            initialParams['/Producer'] = PdfString.fromString(PdfXrefTable.libraryName);
        }

        // Dart's `DateTime.now()` is equivalent to `new Date()` in JavaScript/TypeScript.
        initialParams['/CreationDate'] = PdfString.fromDate(new Date());

        // Call the super constructor. The `params` argument is passed as an object literal.
        super(
            pdfDocument,
            {
                params: new PdfDict(initialParams),
            }
        );

        // Assign the constructor parameters to the class's readonly properties.
        // In Dart, `this.title` in the constructor parameter list does this automatically.
        this.title = options?.title;
        this.author = options?.author;
        this.creator = options?.creator;
        this.subject = options?.subject;
        this.keywords = options?.keywords;
        this.producer = options?.producer;
    }
}