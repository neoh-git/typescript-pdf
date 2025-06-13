// Assuming these are defined in other TypeScript files:
// For dart:math, using Math.random() as a placeholder for security-conscious random.
// For robust random bytes generation in Node.js, use `import { randomBytes } from 'node:crypto';`
// For robust random bytes generation in browsers, use `window.crypto.getRandomValues`.
// For sha256, a common library like 'crypto-js' or Node.js 'node:crypto' would be used.
// Example for crypto-js: `import { SHA256 } from 'crypto-js';`
// For simplicity in this translation, I'll assume a `sha256` function that takes Uint8Array and returns a hash object with a `bytes` property.

import { PdfDocumentParserBase } from './document_parser';
import { PdfArray } from './format/array';
import { PdfNum } from './format/num';
import { PdfVersion } from './format/object_base';
import { PdfStream } from './format/stream';
import { PdfString, PdfStringFormat } from './format/string';
import { PdfXrefTable } from './format/xref';
import { PdfGraphicStates } from './graphic_state';
// The Dart conditional import `io/na.dart if (dart.library.io) 'io/vm.dart' if (dart.library.js_interop) 'io/js.dart';`
// is specific to Dart's platform detection. In TypeScript, you would typically have a single
// abstraction layer (e.g., an 'io.ts' file) that re-exports the correct platform-specific
// implementation, or use a build tool (like Webpack/Rollup) to swap modules.
// For this translation, we'll assume `pdfCompute`, `DeflateCallback`, and `defaultDeflate`
// are imported from a unified 'io.ts' file.
import { pdfCompute, DeflateCallback, defaultDeflate } from './io';
import { PdfCatalog } from './obj/catalog';
import { PdfEncryption } from './obj/encryption';
import { PdfFont } from './obj/font';
import { PdfInfo } from './obj/info';
import { PdfNames } from './obj/names';
import { PdfObject } from './obj/object';
import { PdfOutline } from './obj/outline';
import { PdfPage } from './obj/page';
import { PdfPageLabels } from './obj/page_label';
import { PdfPageList } from './obj/page_list';
import { PdfSignature } from './obj/signature';

// Mock/placeholder for crypto and math functionalities
// In a real project, replace these with robust libraries like 'crypto-js' or Node's 'crypto' module.
const sha256 = (bytes: Uint8Array): { bytes: Uint8Array } => {
    // This is a placeholder. Implement actual SHA-256 logic here.
    // For example, using Node.js crypto:
    // import { createHash } from 'node:crypto';
    // const hash = createHash('sha256');
    // hash.update(bytes);
    // return { bytes: hash.digest() };
    // Or using Web Crypto API:
    // async function sha256Browser(bytes: Uint8Array): Promise<{ bytes: Uint8Array }> {
    //   const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    //   return { bytes: new Uint8Array(hashBuffer) };
    // }
    // For this example, returning a dummy hash
    const dummyHash = new Uint8Array(32).fill(0); // Replace with actual hash calculation
    for (let i = 0; i < bytes.length; i++) {
        dummyHash[i % 32] = (dummyHash[i % 32] + bytes[i]) & 0xFF;
    }
    return { bytes: dummyHash };
};

// Placeholder for secure random number generation.
// In a real project, use `crypto.getRandomValues` in browsers or `randomBytes` in Node.js.
const secureRandom = {
    nextInt: (max: number): number => Math.floor(Math.random() * max),
};

// Assuming PdfSettings is an interface or class defined elsewhere,
// or defined here if not intended to be a separate file.
interface PdfSettings {
    deflate: DeflateCallback | null;
    verbose: boolean;
    version: PdfVersion;
    encryptCallback: (input: Uint8Array, object: PdfObject) => Uint8Array;
}

/**
 * Display hint for the PDF viewer
 */
export enum PdfPageMode {
    /**
     * This page mode indicates that the document
     * should be opened just with the page visible.  This is the default
     */
    none,

    /**
     * This page mode indicates that the Outlines
     * should also be displayed when the document is opened.
     */
    outlines,

    /**
     * This page mode indicates that the Thumbnails should be visible when the
     * document first opens.
     */
    thumbs,

    /**
     * This page mode indicates that when the document is opened, it is displayed
     * in full-screen-mode. There is no menu bar, window controls nor any other
     * window present.
     */
    fullscreen,
}

/**
 * This class is the base of the Pdf generator. A [PdfDocument] class is
 * created for a document, and each page, object, annotation,
 * etc is added to the document.
 * Once complete, the document can be written to a Stream, and the Pdf
 * document's internal structures are kept in sync.
 */
export class PdfDocument {
    // Dart's `final PdfDocumentParserBase? prev;` becomes `public readonly prev: PdfDocumentParserBase | null;`
    public readonly prev: PdfDocumentParserBase | null;

    /**
     * This is used to allocate objects a unique serial number in the document.
     */
    private _objser: number;

    public get objser(): number {
        return this._objser;
    }

    /**
     * This vector contains each indirect object within the document.
     */
    public readonly objects: Set<PdfObject> = new Set<PdfObject>();

    /**
     * This is the Catalog object, which is required by each Pdf Document
     */
    // Dart's `late final PdfCatalog catalog;` becomes `public catalog!: PdfCatalog;` (definite assignment assertion)
    public catalog!: PdfCatalog;

    /**
     * PDF generation settings
     */
    // Dart's `late final PdfSettings settings;` becomes `public settings!: PdfSettings;`
    public settings!: PdfSettings;

    /**
     * PDF version to generate
     */
    /** @deprecated Use settings.version */
    public get version(): PdfVersion {
        return this.settings.version;
    }

    /**
     * This is the info object. Although this is an optional object, we
     * include it.
     */
    /** @deprecated This can safely be removed. */
    public info: PdfInfo | null = null; // Dart's `PdfInfo? info;`

    /**
     * This is the Pages object, which is required by each Pdf Document
     */
    public get pdfPageList(): PdfPageList {
        return this.catalog.pdfPageList;
    }

    /**
     * The anchor names dictionary
     */
    public get pdfNames(): PdfNames {
        // Dart's `??=` operator is directly supported in TypeScript from version 4.0
        this.catalog.names ??= new PdfNames(this);
        return this.catalog.names;
    }

    /**
     * This holds a [PdfObject] describing the default border for annotations.
     * It's only used when the document is being written.
     */
    public defaultOutlineBorder: PdfObject | null = null;

    /**
     * Callback to compress the stream in the pdf file.
     * Use `deflate: zlib.encode` if using dart:io
     * No compression by default
     */
    /** @deprecated Use settings.deflate */
    public get deflate(): DeflateCallback | null {
        return this.settings.deflate;
    }

    /**
     * Object used to encrypt the document
     */
    public encryption: PdfEncryption | null = null;

    /**
     * Object used to sign the document
     */
    public sign: PdfSignature | null = null;

    /**
     * Graphics state, representing only opacity.
     */
    private _graphicStates: PdfGraphicStates | null = null;

    /**
     * The PDF specification version
     */
    public readonly versionString: string = '1.7';

    /**
     * This holds the current fonts
     */
    public readonly fonts: Set<PdfFont> = new Set<PdfFont>();

    private _documentID: Uint8Array | null = null;

    /** @deprecated Use settings.compress */
    public get compress(): boolean {
        return this.settings.deflate != null;
    }

    /**
     * Output a PDF document with comments and formatted data
     */
    /** @deprecated Use settings.verbose */
    public get verbose(): boolean {
        return this.settings.verbose;
    }

    /**
     * Generates the document ID
     */
    public get documentID(): Uint8Array {
        if (this._documentID === null) {
            // Dart's `DateTime.now().toIso8601String().codeUnits`
            const dateTimeBytes = new TextEncoder().encode(new Date().toISOString());

            // Dart's `List<int>.generate(32, (_) => rnd.nextInt(256))`
            const randomBytes = Uint8Array.from({ length: 32 }, () =>
                secureRandom.nextInt(256),
            );

            // Concatenate byte arrays
            const combinedBytes = new Uint8Array(
                dateTimeBytes.length + randomBytes.length,
            );
            combinedBytes.set(dateTimeBytes, 0);
            combinedBytes.set(randomBytes, dateTimeBytes.length);

            // Dart's `sha256.convert(...).bytes`
            this._documentID = sha256(combinedBytes).bytes;
        }
        return this._documentID;
    }

    // Dart's named constructors like `PdfDocument.load` are typically
    // translated to overloaded constructors or static factory methods in TypeScript.
    // Overloaded constructors are used here.

    /**
     * Creates a new Pdf document.
     * @param options Options for the new document.
     */
    constructor(options?: {
        pageMode?: PdfPageMode;
        deflate?: DeflateCallback | null;
        compress?: boolean;
        verbose?: boolean;
        version?: PdfVersion;
    });

    /**
     * Loads an existing Pdf document.
     * @param prev The existing document parser base.
     * @param options Options for loading the document.
     */
    constructor(
        prev: PdfDocumentParserBase,
        options?: {
            deflate?: DeflateCallback | null;
            compress?: boolean;
            verbose?: boolean;
        },
    );

    constructor(
        arg1?:
            | PdfDocumentParserBase
            | {
                pageMode?: PdfPageMode;
                deflate?: DeflateCallback | null;
                compress?: boolean;
                verbose?: boolean;
                version?: PdfVersion;
            },
        arg2?: {
            deflate?: DeflateCallback | null;
            compress?: boolean;
            verbose?: boolean;
        },
    ) {
        if (arg1 instanceof PdfDocumentParserBase) {
            // Corresponds to PdfDocument.load(this.prev, ...)
            this.prev = arg1;
            const options = arg2 || {};
            this._objser = this.prev.size;
            this.settings = {
                deflate: options.compress ? (options.deflate ?? defaultDeflate) : null,
                verbose: options.verbose ?? false,
                version: this.prev.version,
                encryptCallback: (input: Uint8Array, object: PdfObject) =>
                    this.encryption?.encrypt(input, object) ?? input,
            };

            // Import the existing document
            this.prev.mergeDocument(this);
        } else {
            // Corresponds to PdfDocument({ ... })
            this.prev = null;
            this._objser = 1;
            const options = arg1 || {};
            this.settings = {
                deflate: options.compress ? (options.deflate ?? defaultDeflate) : null,
                verbose: options.verbose ?? false,
                version: options.version ?? PdfVersion.pdf_1_5,
                encryptCallback: (input: Uint8Array, object: PdfObject) =>
                    this.encryption?.encrypt(input, object) ?? input,
            };

            // create the catalog
            this.catalog = new PdfCatalog(this, new PdfPageList(this), {
                pageMode: options.pageMode ?? PdfPageMode.none,
            });
        }
    }

    /**
     * Creates a new serial number
     */
    public genSerial(): number {
        return this._objser++;
    }

    /**
     * This returns a specific page. It's used mainly when using a
     * Serialized template file.
     */
    public page(pageIndex: number): PdfPage | null {
        // Dart array access `pages[page]` would return null if out of bounds.
        // JS array access `pages[pageIndex]` returns `undefined`. Explicitly convert to `null`.
        return this.pdfPageList.pages[pageIndex] || null;
    }

    /**
     * The root outline
     */
    public get outline(): PdfOutline {
        this.catalog.outlines ??= new PdfOutline(this);
        return this.catalog.outlines;
    }

    /**
     * The root page labels
     */
    public get pageLabels(): PdfPageLabels {
        this.catalog.pageLabels ??= new PdfPageLabels(this);
        return this.catalog.pageLabels;
    }

    /**
     * Graphic states for opacity and transfer modes
     */
    public get graphicStates(): PdfGraphicStates {
        this._graphicStates ??= new PdfGraphicStates(this);
        return this._graphicStates;
    }

    /**
     * This document has at least one graphic state
     */
    public get hasGraphicStates(): boolean {
        return this._graphicStates != null;
    }

    /**
     * This writes the document to an OutputStream.
     */
    private async _write(os: PdfStream): Promise<void> {
        let signature: PdfSignature | null = null;

        const xref = new PdfXrefTable({ lastObjectId: this._objser });

        // Dart's `objects.where((e) => e.inUse)` can be a filter on `Set.values()` or an `if` condition in the loop.
        for (const ob of this.objects) {
            if (!ob.inUse) {
                continue;
            }

            ob.prepare();
            if (ob instanceof PdfInfo) {
                xref.params['/Info'] = ob.ref();
            } else if (ob instanceof PdfEncryption) {
                xref.params['/Encrypt'] = ob.ref();
            } else if (ob instanceof PdfSignature) {
                // Dart's `assert` becomes an explicit `if` and `throw` in production code.
                if (signature != null) {
                    throw new Error('Only one document signature is allowed');
                }
                signature = ob;
            }
            xref.objects.add(ob);
        }

        const id = new PdfString(this.documentID, {
            format: PdfStringFormat.binary,
            encrypted: false,
        });
        xref.params['/ID'] = new PdfArray([id, id]);

        if (this.prev != null) {
            xref.params['/Prev'] = new PdfNum(this.prev.xrefOffset);
        }

        xref.output(this.catalog, os);

        if (signature != null) {
            await signature.writeSignature(os);
        }
    }

    /**
     * Generate the PDF document as a memory file
     */
    public async save(): Promise<Uint8Array> {
        // `pdfCompute` is assumed to be an imported async utility function.
        return pdfCompute(async () => {
            const os = new PdfStream();
            if (this.prev != null) {
                os.putBytes(this.prev.bytes);
            }
            await this._write(os);
            return os.output();
        });
    }
}