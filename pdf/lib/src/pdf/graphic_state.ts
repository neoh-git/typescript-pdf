// Assuming these are defined in other TypeScript files:
import { PdfDocument } from './document';
import { PdfDict } from './format/dict';
import { PdfName } from './format/name';
import { PdfNum } from './format/num';
import { PdfFunction } from './obj/function';
import { PdfObject } from './obj/object';
import { PdfSoftMask } from './obj/smask';

/**
 * Blend modes for graphic states.
 */
export enum PdfBlendMode {
    /** Selects the source color, ignoring the backdrop */
    normal,

    /** Multiplies the backdrop and source color values */
    multiply,

    /** Multiplies the complements of the backdrop and source color values,
     * then complements the result */
    screen,

    /** Multiplies or screens the colors, depending on the backdrop color value */
    overlay,

    /** Selects the darker of the backdrop and source colors */
    darken,

    /** Selects the lighter of the backdrop and source colors */
    lighten,

    /** Brightens the backdrop color to reflect the source color.
     * Painting with black produces no changes. */
    colorDodge,

    /** Darkens the backdrop color to reflect the source color */
    colorBurn,

    /** Multiplies or screens the colors, depending on the source color value */
    hardLight,

    /** Darkens or lightens the colors, depending on the source color value */
    softLight,

    /** Subtracts the darker of the two constituent colors from the lighter color */
    difference,

    /** Produces an effect similar to that of the Difference mode but lower in contrast */
    exclusion,

    /** Creates a color with the hue of the source color and the saturation and
     * luminosity of the backdrop color */
    hue,

    /** Creates a color with the saturation of the source color and the hue and
     * luminosity of the backdrop color */
    saturation,

    /** Creates a color with the hue and saturation of the source color and the
     * luminosity of the backdrop color */
    color,

    /** Creates a color with the luminosity of the source color and the hue and
     * saturation of the backdrop color */
    luminosity,
}

/**
 * Graphic state
 * @immutable This is a Dart-specific annotation indicating immutability.
 *            In TypeScript, ensure objects are not modified after creation.
 */
export class PdfGraphicState {
    /**
     * Fill opacity to apply to this graphic state.
     */
    public readonly fillOpacity: number | null;

    /**
     * Stroke opacity to apply to this graphic state.
     */
    public readonly strokeOpacity: number | null;

    /**
     * The current blend mode to be used.
     */
    public readonly blendMode: PdfBlendMode | null;

    /**
     * Opacity mask.
     */
    public readonly softMask: PdfSoftMask | null;

    /**
     * Color transfer function.
     */
    public readonly transferFunction: PdfFunction | null;

    /**
     * Create a new graphic state.
     */
    constructor({
        opacity,
        strokeOpacity,
        fillOpacity,
        blendMode,
        softMask,
        transferFunction,
    }: {
        opacity?: number | null;
        strokeOpacity?: number | null;
        fillOpacity?: number | null;
        blendMode?: PdfBlendMode | null;
        softMask?: PdfSoftMask | null;
        transferFunction?: PdfFunction | null;
    }) {
        // Dart's `fillOpacity = fillOpacity ?? opacity` and `strokeOpacity = strokeOpacity ?? opacity`
        this.fillOpacity = fillOpacity ?? opacity ?? null;
        this.strokeOpacity = strokeOpacity ?? opacity ?? null;
        this.blendMode = blendMode ?? null;
        this.softMask = softMask ?? null;
        this.transferFunction = transferFunction ?? null;
    }

    /**
     * Generates the PDF dictionary representation of this graphic state.
     * @returns A PdfDict representing the graphic state.
     */
    public output(): PdfDict {
        const params = new PdfDict();

        if (this.strokeOpacity != null) {
            params.set('/CA', new PdfNum(this.strokeOpacity));
        }

        if (this.fillOpacity != null) {
            params.set('/ca', new PdfNum(this.fillOpacity));
        }

        if (this.blendMode != null) {
            // Dart's `blendMode.toString()` on an enum value might be `PdfBlendMode.normal`.
            // `substring(13, 14)` and `substring(14)` suggest extracting 'normal' from that.
            // In TypeScript, `PdfBlendMode[this.blendMode]` gives the string name.
            const bmString = PdfBlendMode[this.blendMode];
            // Convert 'normal' to 'Normal'
            const capitalizedBm = `${bmString.substring(0, 1).toUpperCase()}${bmString.substring(1)}`;
            params.set('/BM', new PdfName(`/${capitalizedBm}`));
        }

        if (this.softMask != null) {
            params.set('/SMask', this.softMask.output());
        }

        if (this.transferFunction != null) {
            params.set('/TR', this.transferFunction.ref());
        }

        return params;
    }

    /**
     * Compares this graphic state to another object for value equality.
     * TypeScript does not support operator overloading, so a method is used instead.
     */
    public equals(other: any): boolean {
        if (!(other instanceof PdfGraphicState)) {
            return false;
        }
        return (
            other.fillOpacity === this.fillOpacity &&
            other.strokeOpacity === this.strokeOpacity &&
            other.blendMode === this.blendMode &&
            other.softMask === this.softMask && // Note: This compares references for PdfSoftMask/PdfFunction
            other.transferFunction === this.transferFunction
        );
    }

    /**
     * Computes a hash code for this graphic state.
     * Note: In JavaScript/TypeScript, this method alone does not enable
     * value-based equality for built-in `Map` or `Set` collections.
     * These collections use reference equality by default.
     */
    public get hashCode(): number {
        let hash = 0;
        if (this.fillOpacity != null) hash = (hash * 31) + this.fillOpacity;
        if (this.strokeOpacity != null) hash = (hash * 31) + this.strokeOpacity;
        if (this.blendMode != null) hash = (hash * 31) + this.blendMode;
        // For object references, you might use a unique ID or their hash if they implement one.
        // For simplicity, just using an arbitrary number if present.
        if (this.softMask != null) hash = (hash * 31) + (this.softMask as any).hashCode;
        if (this.transferFunction != null) hash = (hash * 31) + (this.transferFunction as any).hashCode;
        return hash | 0; // Ensure it's a 32-bit integer
    }

    /** @override */
    public override toString(): string {
        return `${this.constructor.name} fillOpacity:${this.fillOpacity} strokeOpacity:${this.strokeOpacity} blendMode:${PdfBlendMode[this.blendMode as PdfBlendMode]} softMask:${this.softMask} transferFunction:${this.transferFunction}`;
    }
}

/**
 * Stores all the graphic states used in the document.
 */
export class PdfGraphicStates extends PdfObject<PdfDict> {
    private readonly _states: PdfGraphicState[] = [];

    private static readonly _prefix = '/a';

    /**
     * Create a new Graphic States object.
     */
    constructor(pdfDocument: PdfDocument) {
        super(pdfDocument, { params: new PdfDict() });
    }

    /**
     * Generate a name for a state object.
     * If the state already exists (by value equality), its existing name is returned.
     * Otherwise, the state is added, and a new name is generated.
     */
    public stateName(state: PdfGraphicState): string {
        // In Dart, `_states.indexOf(state)` would use `PdfGraphicState`'s `operator ==`.
        // In TypeScript, `indexOf` uses reference equality (`===`).
        // To match Dart's behavior, we need to iterate and use the custom `equals` method.
        let index = -1;
        for (let i = 0; i < this._states.length; i++) {
            if (this._states[i].equals(state)) {
                index = i;
                break;
            }
        }

        if (index < 0) {
            index = this._states.length;
            this._states.push(state);
        }
        return `${PdfGraphicStates._prefix}${index}`;
    }

    /** @override */
    public override prepare(): void {
        super.prepare();

        for (let index = 0; index < this._states.length; index++) {
            this.params.set(
                `${PdfGraphicStates._prefix}${index}`,
                this._states[index].output(),
            );
        }
    }
}