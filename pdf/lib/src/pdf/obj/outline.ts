// Assume the following imports and types are already defined in your TypeScript project:
// import { PdfColor } from '../color';
// import { PdfDocument } from '../document';
// import { PdfArray } from '../format/array';
// import { PdfDict } from '../format/dict';
// import { PdfName } from '../format/name';
// import { PdfNull } from '../format/null_value';
// import { PdfNum } from '../format/num';
// import { PdfString } from '../format/string';
// import { PdfRect } from '../rect';
// import { PdfObject } from './object';
// import { PdfPage } from './page';

import { PdfColor } from '../color';
import { PdfDocument } from '../document';
import { PdfArray } from '../format/array';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfNull } from '../format/null_value';
import { PdfNum } from '../format/num';
import { PdfString } from '../format/string';
import { PdfRect } from '../rect';
import { PdfObject } from './object';
import { PdfPage } from './page';

/**
 * Outline mode
 */
export enum PdfOutlineMode {
    /** When jumping to the destination, display the whole page */
    fitPage,

    /** When jumping to the destination, display the specified region */
    fitRect,
}

/**
 * Outline style
 */
export enum PdfOutlineStyle {
    /** Normal */
    normal,

    /** Italic */
    italic,

    /** Bold */
    bold,

    /** Italic and Bold */
    italicBold,
}

/**
 * Pdf Outline object
 */
export class PdfOutline extends PdfObject<PdfDict> {
    /**
     * This holds any outlines below us
     */
    public outlines: PdfOutline[] = [];

    /**
     * For subentries, this points to it's parent outline
     */
    public parent?: PdfOutline;

    /**
     * This is this outlines Title
     */
    public readonly title?: string;

    /**
     * The destination page
     */
    public dest?: PdfPage;

    // Private field for the initial page reference
    private readonly _page?: PdfPage;

    /**
     * Page number, derived from `_page` or `dest`.
     * Returns a string representing the 1-based page number, or `undefined` if not found.
     */
    public get page(): string | undefined {
        let pageNum: number | undefined;

        if (this._page != null) {
            // Dart's `pdfDocument.pdfPageList.pages.indexOf(_page!)`
            // Assuming `pdfDocument.pdfPageList.pages` is an array or has `indexOf`.
            pageNum = this.pdfDocument.pdfPageList.pages.indexOf(this._page);
        } else if (this.dest != null) {
            pageNum = this.pdfDocument.pdfPageList.pages.indexOf(this.dest);
        } else {
            pageNum = undefined;
        }

        // Dart's `num == null ? null : (num + 1).toString()`
        return pageNum == null || pageNum === -1 ? undefined : (pageNum + 1).toString();
    }

    /**
     * The region on the destination page
     */
    public readonly rect?: PdfRect;

    /**
     * Named destination
     */
    public readonly anchor?: string;

    /**
     * Color of the outline text
     */
    public readonly color?: PdfColor;

    /**
     * How the destination is handled
     */
    public readonly destMode: PdfOutlineMode;

    /**
     * How to display the outline text
     */
    public readonly style: PdfOutlineStyle;

    /**
     * External level for this outline. Used during preparation of the outline tree.
     */
    public effectiveLevel?: number;

    /**
     * Constructs a Pdf Outline object.
     * When selected, the specified region is displayed.
     * @param pdfDocument The PDF document to which this outline belongs.
     * @param options.title The title of the outline entry.
     * @param options.dest The destination page object.
     * @param options.rect The region on the destination page.
     * @param options.anchor A named destination.
     * @param options.color The color of the outline text.
     * @param options.destMode How the destination is handled. Defaults to `PdfOutlineMode.fitPage`.
     * @param options.style How to display the outline text. Defaults to `PdfOutlineStyle.normal`.
     * @param options.page An explicit page object, alternative to `dest`.
     */
    constructor(
        pdfDocument: PdfDocument,
        options?: {
            title?: string;
            dest?: PdfPage;
            rect?: PdfRect;
            anchor?: string;
            color?: PdfColor;
            destMode?: PdfOutlineMode;
            style?: PdfOutlineStyle;
            page?: PdfPage;
        },
    ) {
        // Dart's `assert(anchor == null || (dest == null && rect == null))`
        // This assertion logic is moved to the constructor body.
        if (options?.anchor != null && (options?.dest != null || options?.rect != null)) {
            if (pdfDocument.isDebug) {
                console.assert(
                    false,
                    'An anchor cannot be specified with a destination page or rectangle.',
                );
            }
            throw new Error('An anchor cannot be specified with a destination page or rectangle.');
        }

        // Call the super constructor first.
        super(pdfDocument, { params: new PdfDict() });

        // Assign readonly properties from options or provide default values.
        this.title = options?.title;
        this.dest = options?.dest;
        this.rect = options?.rect;
        this.anchor = options?.anchor;
        this.color = options?.color;
        this.destMode = options?.destMode ?? PdfOutlineMode.fitPage;
        this.style = options?.style ?? PdfOutlineStyle.normal;
        this._page = options?.page;
    }

    /**
     * This method creates an outline, and attaches it to this one.
     * When the outline is selected, the supplied region is displayed.
     * @param outline The PdfOutline to add as a child.
     */
    add(outline: PdfOutline): void {
        outline.parent = this;
        this.outlines.push(outline);
    }

    /**
     * Prepares the PDF outline object by setting its parameters for PDF output.
     */
    override prepare(): void {
        super.prepare(); // Call the base class's prepare method.

        // These are for kids only (sub-outlines)
        if (this.parent != null) {
            // Non-null assertion (`!`) is used assuming `title` is always set for child outlines
            // or that this is the desired runtime behavior if it's not.
            this.params.set('/Title', PdfString.fromString(this.title!));

            if (this.color != null) {
                this.params.set('/C', PdfArray.fromColor(this.color));
            }

            if (this.style !== PdfOutlineStyle.normal) {
                // Dart enum's `index` property corresponds to its numeric value in TS.
                this.params.set('/F', new PdfNum(this.style));
            }

            if (this.anchor != null) {
                this.params.set('/Dest', PdfString.fromString(this.anchor));
            } else {
                // Destination array construction
                const dests = new PdfArray();
                this.dest && dests.add(this.dest.ref()); // Add dest reference if it exists

                if (this.destMode === PdfOutlineMode.fitPage) {
                    dests.add(new PdfName('/Fit'));
                } else {
                    dests.add(new PdfName('/FitR'));
                    // Non-null assertions `rect!` mean we expect rect to be defined if mode is fitRect
                    this.rect && dests.add(new PdfNum(this.rect.left));
                    this.rect && dests.add(new PdfNum(this.rect.bottom));
                    this.rect && dests.add(new PdfNum(this.rect.right));
                    this.rect && dests.add(new PdfNum(this.rect.top));
                }
                this.params.set('/Dest', dests);
            }
            // Non-null assertion on `parent!`
            this.params.set('/Parent', this.parent!.ref());

            // Calculate descendants count for `/Count`
            const c = this.descendants();
            if (c > 0) {
                this.params.set('/Count', new PdfNum(-c)); // Negative count means outline is closed
            }

            const index = this.parent!.getIndex(this);
            if (index > 0) {
                this.params.set('/Prev', this.parent!.getNode(index - 1).ref());
            }

            if (index < this.parent!.getLast()) {
                this.params.set('/Next', this.parent!.getNode(index + 1).ref());
            }
        } else {
            // Top-level node: count is positive (open by default)
            this.params.set('/Count', new PdfNum(this.outlines.length));
        }

        // These parameters are only valid if this outline has children
        if (this.outlines.length > 0) {
            this.params.set('/First', this.outlines[0].ref()); // First child reference
            this.params.set('/Last', this.outlines[this.outlines.length - 1].ref()); // Last child reference
        }
    }

    /**
     * This is called by children to find their position in this outline's
     * tree.
     * @param outline The child outline to find.
     * @returns The index of the child outline.
     */
    getIndex(outline: PdfOutline): number {
        return this.outlines.indexOf(outline);
    }

    /**
     * Returns the last index in this outline's children list.
     * @returns The last index.
     */
    getLast(): number {
        return this.outlines.length - 1;
    }

    /**
     * Returns the outline at a specified position in its children list.
     * @param i The index.
     * @returns The PdfOutline at the given index.
     */
    getNode(i: number): PdfOutline {
        return this.outlines[i];
    }

    /**
     * Returns the total number of descendants (children, grandchildren, etc.) below this one.
     * @returns The total number of descendants.
     */
    descendants(): number {
        let c = this.outlines.length; // Initially the number of direct children

        // Recursively add descendants of each child
        for (const o of this.outlines) {
            c += o.descendants();
        }

        return c;
    }

    /**
     * Returns a string representation of the PdfOutline.
     */
    override toString(): string {
        // Dart's `$runtimeType $anchor $title` translates to `this.constructor.name`
        // and template literals.
        return `${this.constructor.name} ${this.anchor} ${this.title}`;
    }
}