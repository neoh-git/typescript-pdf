// Assuming these types are defined and exported from their respective files:
import { PdfDocument } from '../document';
import { PdfArray } from '../format/array';
import { PdfDict } from '../format/dict';
import { PdfName } from '../format/name';
import { PdfNum } from '../format/num';
import { PdfObject } from './object'; // Assuming PdfObject is directly in './object'

/**
 * Defines standard border styles for PDF annotations.
 */
export enum PdfBorderStyle {
    /** Solid border. The border is drawn as a solid line. */
    solid = 0, // Corresponds to 'S'
    /** The border is drawn with a dashed line. */
    dashed = 1, // Corresponds to 'D'
    /**
     * The border is drawn in a beveled style (faux three-dimensional) such
     * that it looks as if it is pushed out of the page (opposite of INSET)
     */
    beveled = 2, // Corresponds to 'B'
    /**
     * The border is drawn in an inset style (faux three-dimensional) such
     * that it looks as if it is inset into the page (opposite of BEVELED)
     */
    inset = 3, // Corresponds to 'I'
    /** The border is drawn as a line on the bottom of the annotation rectangle */
    underlined = 4, // Corresponds to 'U'
}

/**
 * Represents a PDF border object, used for annotations.
 */
export class PdfBorder extends PdfObject<PdfDict> {
    /**
     * The style of the border.
     */
    public readonly style: PdfBorderStyle;

    /**
     * The width of the border in points.
     */
    public readonly width: number;

    /**
     * An array defining a dashed line pattern for the border.
     * Each number represents a dash length or a gap length in alternating sequence.
     * `null` if the border is solid or not dashed.
     */
    public readonly dash?: number[]; // Dart's `List<double>?` translates to `number[] | undefined`

    /**
     * Creates a PdfBorder object using predefined styles.
     * @param pdfDocument The PDF document this object belongs to.
     * @param width The width of the border in points.
     * @param params.style The style of the border. Defaults to `PdfBorderStyle.solid`.
     * @param params.dash An optional array defining the dash pattern for dashed lines.
     */
    constructor(
        pdfDocument: PdfDocument,
        width: number,
        params: {
            style?: PdfBorderStyle;
            dash?: number[];
        } = {}
    ) {
        // Call the superclass constructor, initializing params as a new PdfDict.
        // Assuming PdfObject constructor takes options: { params: T; objser?: number; objgen?: number }
        super(pdfDocument, { params: new PdfDict() });

        this.width = width;
        this.style = params.style ?? PdfBorderStyle.solid;
        this.dash = params.dash;
    }

    /**
     * Prepares the border object for output to the PDF document.
     * This method populates the internal PdfDict (`this.params`) with
     * the PDF-specific keys and values for the border.
     */
    public prepare(): void {
        super.prepare(); // Call the prepare method of the superclass.

        // Map PdfBorderStyle enum to PDF style names (S, D, B, I, U)
        const styleChars = 'SDBIU';
        const pdfStyleChar = styleChars[this.style]; // `style.index` in Dart is just `this.style` in TS enum

        this.params.set('/S', new PdfName(`/${pdfStyleChar}`)); // Set border style
        this.params.set('/W', new PdfNum(this.width)); // Set border width

        // If a dash pattern is provided, add it to the dictionary.
        if (this.dash != null) {
            this.params.set('/D', PdfArray.fromNum(this.dash)); // Assumes PdfArray.fromNum takes number[]
        }
    }
}