// Assuming these are defined in other TypeScript files:
import { PathProxy, writeSvgPathDataToPath } from 'path-parsing'; // Assuming from the path-parsing library
import { Matrix4, Vector3 } from 'vector_math'; // Assuming from vector_math library

import { PdfColor, PdfColorCmyk } from './color';
import { PdfArray, PdfNumList } from './format/array';
import { PdfName } from './format/name';
import { PdfNum } from './format/num';
import { PdfStream } from './format/stream';
import { PdfGraphicState } from './graphic_state';
import { PdfFont } from './obj/font';
import { PdfGraphicStream } from './obj/graphic_stream';
import { PdfImageOrientation, PdfImage } from './obj/image';
import { PdfPattern } from './obj/pattern';
import { PdfShading } from './obj/shading';
import { PdfRect } from './rect';

/**
 * Shape to be used at the corners of paths that are stroked
 */
export enum PdfLineJoin {
    /** The outer edges of the strokes for the two segments shall be extended until they meet at an angle, as in a picture frame. If the segments meet at too sharp an angle (as defined by the miter limit parameter, a bevel join shall be used instead. */
    miter,

    /** An arc of a circle with a diameter equal to the line width shall be drawn around the point where the two segments meet, connecting the outer edges of the strokes for the two segments. This pie-slice-shaped figure shall be filled in, producing a rounded corner. */
    round,

    /** The two segments shall be finished with butt caps and the resulting notch beyond the ends of the segments shall be filled with a triangle. */
    bevel,
}

/**
 * Specify the shape that shall be used at the ends of open sub paths
 * and dashes, when they are stroked.
 */
export enum PdfLineCap {
    /** The stroke shall be squared off at the endpoint of the path. There shall be no projection beyond the end of the path. */
    butt,

    /** A semicircular arc with a diameter equal to the line width shall be drawn around the endpoint and shall be filled in. */
    round,

    /** The stroke shall continue beyond the endpoint of the path for a distance equal to half the line width and shall be squared off. */
    square,
}

/**
 * Text rendering mode
 */
export enum PdfTextRenderingMode {
    /** Fill text */
    fill,

    /** Stroke text */
    stroke,

    /** Fill, then stroke text */
    fillAndStroke,

    /** Neither fill nor stroke text (invisible) */
    invisible,

    /** Fill text and add to path for clipping */
    fillAndClip,

    /** Stroke text and add to path for clipping */
    strokeAndClip,

    /** Fill, then stroke text and add to path for clipping */
    fillStrokeAndClip,

    /** Add text to path for clipping */
    clip,
}

/**
 * Internal graphic context state.
 * @immutable This is a Dart-specific annotation; in TypeScript, ensure objects are not modified after creation.
 */
class _PdfGraphicsContext {
    readonly ctm: Matrix4;

    constructor({ ctm }: { ctm: Matrix4 }) {
        this.ctm = ctm;
    }

    copy(): _PdfGraphicsContext {
        return new _PdfGraphicsContext({
            ctm: this.ctm.clone(),
        });
    }
}

/**
 * Pdf drawing operations
 */
export class PdfGraphics {
    /** Ellipse 4-spline magic number */
    private static readonly _m4 = 0.551784;

    /** Graphic context */
    private _context: _PdfGraphicsContext;
    /** Stack-like queue for saving/restoring graphic contexts. */
    private readonly _contextQueue: _PdfGraphicsContext[] = [];

    private readonly _page: PdfGraphicStream;

    /** Buffer where to write the graphic operations */
    private readonly _buf: PdfStream;

    /**
     * Create a new graphic canvas
     * @param page The PdfGraphicStream (usually a PdfPage)
     * @param buf The PdfStream to write graphics operations to
     */
    constructor(page: PdfGraphicStream, buf: PdfStream) {
        this._page = page;
        this._buf = buf;
        this._context = new _PdfGraphicsContext({ ctm: Matrix4.identity() });
    }

    /** Default font if none selected */
    public get defaultFont(): PdfFont | null {
        return this._page.getDefaultFont();
    }

    public get altered(): boolean {
        return this._page.altered;
    }

    /**
     * Draw a surface on the previously defined shape.
     * @param options.evenOdd Set to false to use the nonzero winding number rule to determine the region to fill, and to true to use the even-odd rule to determine the region to fill.
     */
    public fillPath(options: { evenOdd?: boolean } = {}): void {
        const { evenOdd = false } = options;
        this._buf.putString(`f${evenOdd ? '*' : ''} `);
        this._page.altered = true;
    }

    /**
     * Draw the contour of the previously defined shape.
     * @param options.close True to close the path before stroking.
     */
    public strokePath(options: { close?: boolean } = {}): void {
        const { close = false } = options;
        this._buf.putString(`${close ? 's' : 'S'} `);
        this._page.altered = true;
    }

    /** Close the path with a line. */
    public closePath(): void {
        this._buf.putString('h ');
        this._page.altered = true;
    }

    /**
     * Create a clipping surface from the previously defined shape,
     * to prevent any further drawing outside.
     * @param options.evenOdd True to use the even-odd rule.
     * @param options.end True to end the path after clipping (implicitly close and then clip).
     */
    public clipPath(options: { evenOdd?: boolean; end?: boolean } = {}): void {
        const { evenOdd = false, end = true } = options;
        this._buf.putString(`W${evenOdd ? '*' : ''}${end ? ' n' : ''} `);
    }

    /**
     * Draw a surface on the previously defined shape and then draw the contour.
     * @param options.evenOdd Set to false to use the nonzero winding number rule to determine the region to fill, and to true to use the even-odd rule to determine the region to fill.
     * @param options.close True to close the path before filling and stroking.
     */
    public fillAndStrokePath(
        options: { evenOdd?: boolean; close?: boolean } = {},
    ): void {
        const { evenOdd = false, close = false } = options;
        this._buf.putString(`${close ? 'b' : 'B'}${evenOdd ? '*' : ''} `);
        this._page.altered = true;
    }

    /**
     * Apply a shader.
     * @param shader The PdfShading object to apply.
     */
    public applyShader(shader: PdfShading): void {
        this._page.addShader(shader);
        this._buf.putString(`${shader.name} sh `);
        this._page.altered = true;
    }

    /**
     * This releases any resources used by this Graphics object. You must use
     * this method once finished with it.
     *
     * When using [PdfPage], you can create another fresh Graphics instance,
     * which will draw over this one.
     */
    public restoreContext(): void {
        if (this._contextQueue.length > 0) {
            this._buf.putString('Q ');
            this._context = this._contextQueue.pop()!; // `!` because `length > 0` ensures it's not undefined.
        }
    }

    /** Save the graphic context. */
    public saveContext(): void {
        this._buf.putString('q ');
        this._contextQueue.push(this._context.copy());
    }

    /**
     * Draws an image onto the page.
     * @param img The PdfImage to draw.
     * @param x The x-coordinate of the image's origin.
     * @param y The y-coordinate of the image's origin.
     * @param w Optional width. If not provided, calculated based on image aspect ratio.
     * @param h Optional height. If not provided, calculated based on image aspect ratio.
     */
    public drawImage(img: PdfImage, x: number, y: number, w?: number, h?: number): void {
        w ??= img.width;
        h ??= img.height * w / img.width;

        this._page.addXObject(img);

        this._buf.putString('q '); // Save current graphics state

        // The image transformation matrix depends on its orientation
        let matrixValues: number[];
        switch (img.orientation) {
            case PdfImageOrientation.topLeft:
                matrixValues = [w, 0, 0, h, x, y];
                break;
            case PdfImageOrientation.topRight:
                matrixValues = [-w, 0, 0, h, w + x, y];
                break;
            case PdfImageOrientation.bottomRight:
                matrixValues = [-w, 0, 0, -h, w + x, h + y];
                break;
            case PdfImageOrientation.bottomLeft:
                matrixValues = [w, 0, 0, -h, x, h + y];
                break;
            case PdfImageOrientation.leftTop:
                matrixValues = [0, -h, -w, 0, w + x, h + y];
                break;
            case PdfImageOrientation.rightTop:
                matrixValues = [0, -h, w, 0, x, h + y];
                break;
            case PdfImageOrientation.rightBottom:
                matrixValues = [0, h, w, 0, x, y];
                break;
            case PdfImageOrientation.leftBottom:
                matrixValues = [0, h, -w, 0, w + x, y];
                break;
            default:
                // Fallback for any unhandled or new orientations (though enums are usually exhaustive)
                matrixValues = [w, 0, 0, h, x, y];
                break;
        }

        new PdfNumList(matrixValues).output(this._page, this._buf);
        this._buf.putString(' cm '); // Apply transformation matrix
        this._buf.putString(`${img.name} Do Q `); // Draw image and restore graphics state
        this._page.altered = true;
    }

    /**
     * Draws a line between two coordinates.
     * @param x1 Start x-coordinate.
     * @param y1 Start y-coordinate.
     * @param x2 End x-coordinate.
     * @param y2 End y-coordinate.
     */
    public drawLine(x1: number, y1: number, x2: number, y2: number): void {
        this.moveTo(x1, y1);
        this.lineTo(x2, y2);
    }

    /**
     * Draws an ellipse
     *
     * Use clockwise=false to draw the inside of a donut
     * @param x Center x-coordinate.
     * @param y Center y-coordinate.
     * @param r1 First radius.
     * @param r2 Second radius.
     * @param options.clockwise If true, draws clockwise.
     */
    public drawEllipse(
        x: number,
        y: number,
        r1: number,
        r2: number,
        options: { clockwise?: boolean } = {},
    ): void {
        const { clockwise = true } = options;
        this.moveTo(x, y - r2);
        if (clockwise) {
            this.curveTo(x + PdfGraphics._m4 * r1, y - r2, x + r1, y - PdfGraphics._m4 * r2, x + r1, y);
            this.curveTo(x + r1, y + PdfGraphics._m4 * r2, x + PdfGraphics._m4 * r1, y + r2, x, y + r2);
            this.curveTo(x - PdfGraphics._m4 * r1, y + r2, x - r1, y + PdfGraphics._m4 * r2, x - r1, y);
            this.curveTo(x - r1, y - PdfGraphics._m4 * r2, x - PdfGraphics._m4 * r1, y - r2, x, y - r2);
        } else {
            this.curveTo(x - PdfGraphics._m4 * r1, y - r2, x - r1, y - PdfGraphics._m4 * r2, x - r1, y);
            this.curveTo(x - r1, y + PdfGraphics._m4 * r2, x - PdfGraphics._m4 * r1, y + r2, x, y + r2);
            this.curveTo(x + PdfGraphics._m4 * r1, y + r2, x + r1, y + PdfGraphics._m4 * r2, x + r1, y);
            this.curveTo(x + r1, y - PdfGraphics._m4 * r2, x + PdfGraphics._m4 * r1, y - r2, x, y - r2);
        }
    }

    /**
     * Draws a Rectangle.
     * @param x The x-coordinate of the rectangle's bottom-left corner.
     * @param y The y-coordinate of the rectangle's bottom-left corner.
     * @param w The width of the rectangle.
     * @param h The height of the rectangle.
     */
    public drawRect(x: number, y: number, w: number, h: number): void {
        new PdfNumList([x, y, w, h]).output(this._page, this._buf);
        this._buf.putString(' re ');
    }

    /**
     * Draws a Rectangle using a PdfRect object.
     * @param box The PdfRect object defining the rectangle.
     */
    public drawBox(box: PdfRect): void {
        this.drawRect(box.x, box.y, box.width, box.height);
    }

    /**
     * Draws a Rounded Rectangle.
     * @param x The x-coordinate of the rectangle's bottom-left corner.
     * @param y The y-coordinate of the rectangle's bottom-left corner.
     * @param w The width of the rectangle.
     * @param h The height of the rectangle.
     * @param rv The vertical radius of the corners.
     * @param rh The horizontal radius of the corners.
     */
    public drawRRect(
        x: number,
        y: number,
        w: number,
        h: number,
        rv: number,
        rh: number,
    ): void {
        this.moveTo(x, y + rv);
        this.curveTo(x, y - PdfGraphics._m4 * rv + rv, x - PdfGraphics._m4 * rh + rh, y, x + rh, y);
        this.lineTo(x + w - rh, y);
        this.curveTo(x + PdfGraphics._m4 * rh + w - rh, y, x + w, y - PdfGraphics._m4 * rv + rv, x + w, y + rv);
        this.lineTo(x + w, y + h - rv);
        this.curveTo(x + w, y + PdfGraphics._m4 * rv + h - rv, x + PdfGraphics._m4 * rh + w - rh, y + h, x + w - rh, y + h);
        this.lineTo(x + rh, y + h);
        this.curveTo(x - PdfGraphics._m4 * rh + rh, y + h, x, y + PdfGraphics._m4 * rv + h - rv, x, y + h - rv);
        this.lineTo(x, y + rv);
    }

    /**
     * Set the current font and size.
     * @param font The PdfFont object to use.
     * @param size The font size.
     * @param options.charSpace Optional character spacing.
     * @param options.wordSpace Optional word spacing.
     * @param options.scale Optional horizontal scaling.
     * @param options.mode Optional text rendering mode.
     * @param options.rise Optional text rise.
     */
    public setFont(
        font: PdfFont,
        size: number,
        options: {
            charSpace?: number | null;
            wordSpace?: number | null;
            scale?: number | null;
            mode?: PdfTextRenderingMode;
            rise?: number | null;
        } = {},
    ): void {
        const {
            charSpace = null,
            wordSpace = null,
            scale = null,
            mode = PdfTextRenderingMode.fill,
            rise = null,
        } = options;

        this._page.addFont(font);

        this._buf.putString(`${font.name} `);
        new PdfNum(size).output(this._page, this._buf);
        this._buf.putString(' Tf '); // Set font and size

        if (charSpace != null) {
            new PdfNum(charSpace).output(this._page, this._buf);
            this._buf.putString(' Tc '); // Set character spacing
        }
        if (wordSpace != null) {
            new PdfNum(wordSpace).output(this._page, this._buf);
            this._buf.putString(' Tw '); // Set word spacing
        }
        if (scale != null) {
            new PdfNum(scale * 100).output(this._page, this._buf);
            this._buf.putString(' Tz '); // Set horizontal scaling
        }
        if (rise != null) {
            new PdfNum(rise).output(this._page, this._buf);
            this._buf.putString(' Ts '); // Set text rise
        }
        if (mode !== PdfTextRenderingMode.fill) {
            this._buf.putString(`${mode.valueOf()} Tr `); // Set text rendering mode (using valueOf for enum numeric value)
        }
    }

    /**
     * This draws a string.
     * @param font The PdfFont object to use.
     * @param size The font size.
     * @param s The string to draw.
     * @param x The x-coordinate to start drawing.
     * @param y The y-coordinate to start drawing.
     * @param options.charSpace Optional character spacing.
     * @param options.wordSpace Optional word spacing.
     * @param options.scale Optional horizontal scaling.
     * @param options.mode Optional text rendering mode.
     * @param options.rise Optional text rise.
     */
    public drawString(
        font: PdfFont,
        size: number,
        s: string,
        x: number,
        y: number,
        options: {
            charSpace?: number | null;
            wordSpace?: number | null;
            scale?: number | null;
            mode?: PdfTextRenderingMode;
            rise?: number | null;
        } = {},
    ): void {
        const {
            charSpace = null,
            wordSpace = null,
            scale = null,
            mode = PdfTextRenderingMode.fill,
            rise = null,
        } = options;

        this._buf.putString('BT '); // Begin Text object

        this.setFont(font, size, {
            charSpace,
            mode,
            rise,
            scale,
            wordSpace,
        });

        new PdfNumList([x, y]).output(this._page, this._buf);
        this._buf.putString(' Td '); // Move text position

        this._buf.putString('[');
        font.putText(this._buf, s); // Add text to the buffer
        this._buf.putString(']TJ '); // Show text

        this._buf.putString('ET '); // End Text object

        this._page.altered = true;
    }

    /** Resets text rendering mode to fill. */
    public reset(): void {
        this._buf.putString('0 Tr ');
    }

    /**
     * Sets the color for drawing (both fill and stroke).
     * @param color The PdfColor to set.
     */
    public setColor(color: PdfColor | null): void {
        this.setFillColor(color);
        this.setStrokeColor(color);
    }

    /**
     * Sets the fill color for drawing.
     * @param color The PdfColor to set.
     */
    public setFillColor(color: PdfColor | null): void {
        if (color instanceof PdfColorCmyk) {
            new PdfNumList([color.cyan, color.magenta, color.yellow, color.black]).output(this._page, this._buf);
            this._buf.putString(' k '); // Set fill color (CMYK)
        } else if (color != null) {
            new PdfNumList([color.red, color.green, color.blue]).output(this._page, this._buf);
            this._buf.putString(' rg '); // Set fill color (RGB)
        }
    }

    /**
     * Sets the stroke color for drawing.
     * @param color The PdfColor to set.
     */
    public setStrokeColor(color: PdfColor | null): void {
        if (color instanceof PdfColorCmyk) {
            new PdfNumList([color.cyan, color.magenta, color.yellow, color.black]).output(this._page, this._buf);
            this._buf.putString(' K '); // Set stroke color (CMYK)
        } else if (color != null) {
            new PdfNumList([color.red, color.green, color.blue]).output(this._page, this._buf);
            this._buf.putString(' RG '); // Set stroke color (RGB)
        }
    }

    /**
     * Sets the fill pattern for drawing.
     * @param pattern The PdfPattern to set.
     */
    public setFillPattern(pattern: PdfPattern): void {
        this._page.addPattern(pattern);
        this._buf.putString(`/Pattern cs${pattern.name} scn `); // Set fill pattern
    }

    /**
     * Sets the stroke pattern for drawing.
     * @param pattern The PdfPattern to set.
     */
    public setStrokePattern(pattern: PdfPattern): void {
        this._page.addPattern(pattern);
        this._buf.putString(`/Pattern CS${pattern.name} SCN `); // Set stroke pattern
    }

    /**
     * Set the graphic state for drawing.
     * @param state The PdfGraphicState to apply.
     */
    public setGraphicState(state: PdfGraphicState): void {
        const name = this._page.stateName(state);
        this._buf.putString(`${name} gs `); // Apply graphic state
    }

    /**
     * Set the transformation Matrix.
     * @param t The Matrix4 to set as the current transformation matrix.
     */
    public setTransform(t: Matrix4): void {
        const s = t.storage; // Assuming Matrix4.storage gives a flat array of 16 numbers
        new PdfNumList([s[0], s[1], s[4], s[5], s[12], s[13]]).output(this._page, this._buf);
        this._buf.putString(' cm '); // Concatenate matrix
        this._context.ctm.multiply(t); // Update internal CTM
    }

    /**
     * Get the current transformation Matrix.
     * @returns A clone of the current transformation matrix.
     */
    public getTransform(): Matrix4 {
        return this._context.ctm.clone();
    }

    /**
     * This adds a line segment to the current path.
     * @param x The x-coordinate of the end point.
     * @param y The y-coordinate of the end point.
     */
    public lineTo(x: number, y: number): void {
        new PdfNumList([x, y]).output(this._page, this._buf);
        this._buf.putString(' l '); // Line to
    }

    /**
     * This moves the current drawing point.
     * @param x The x-coordinate to move to.
     * @param y The y-coordinate to move to.
     */
    public moveTo(x: number, y: number): void {
        new PdfNumList([x, y]).output(this._page, this._buf);
        this._buf.putString(' m '); // Move to
    }

    /**
     * Draw a cubic bézier curve from the current point to (x3,y3)
     * using (x1,y1) as the control point at the beginning of the curve
     * and (x2,y2) as the control point at the end of the curve.
     */
    public curveTo(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
    ): void {
        new PdfNumList([x1, y1, x2, y2, x3, y3]).output(this._page, this._buf);
        this._buf.putString(' c '); // Curve to
    }

    // Internal helper for vector angle calculation
    private _vectorAngle(
        ux: number,
        uy: number,
        vx: number,
        vy: number,
    ): number {
        const d = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
        if (d === 0.0) {
            return 0;
        }
        let c = (ux * vx + uy * vy) / d;
        if (c < -1.0) {
            c = -1.0;
        } else if (c > 1.0) {
            c = 1.0;
        }
        const s = ux * vy - uy * vx;
        c = Math.acos(c);
        return Math.sign(c) === Math.sign(s) ? c : -c;
    }

    // Internal helper for arc parameters conversion (SVG arc to bezier)
    private _endToCenterParameters(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        large: boolean,
        sweep: boolean,
        rx: number,
        ry: number,
    ): void {
        // See http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes F.6.5

        rx = Math.abs(rx);
        ry = Math.abs(ry);

        const x1d = 0.5 * (x1 - x2);
        const y1d = 0.5 * (y1 - y2);

        let r = x1d * x1d / (rx * rx) + y1d * y1d / (ry * ry);
        if (r > 1.0) {
            const rr = Math.sqrt(r);
            rx *= rr;
            ry *= rr;
            r = x1d * x1d / (rx * rx) + y1d * y1d / (ry * ry);
        } else if (r !== 0.0) {
            r = 1.0 / r - 1.0;
        }

        if (-1e-10 < r && r < 0.0) { // Handle floating point precision near zero
            r = 0.0;
        }

        r = Math.sqrt(r);
        if (large === sweep) {
            r = -r;
        }

        const cxd = (r * rx * y1d) / ry;
        const cyd = -(r * ry * x1d) / rx;

        const cx = cxd + 0.5 * (x1 + x2);
        const cy = cyd + 0.5 * (y1 + y2);

        const theta = this._vectorAngle(1, 0, (x1d - cxd) / rx, (y1d - cyd) / ry);
        let dTheta = (this._vectorAngle((x1d - cxd) / rx, (y1d - cyd) / ry,
            (-x1d - cxd) / rx, (-y1d - cyd) / ry)) %
            (Math.PI * 2.0);
        if (!sweep && dTheta > 0.0) {
            dTheta -= Math.PI * 2.0;
        } else if (sweep && dTheta < 0.0) {
            dTheta += Math.PI * 2.0;
        }
        this._bezierArcFromCentre(cx, cy, rx, ry, -theta, -dTheta);
    }

    // Internal helper for drawing bezier arc segments from center parameters
    private _bezierArcFromCentre(
        cx: number,
        cy: number,
        rx: number,
        ry: number,
        startAngle: number,
        extent: number,
    ): void {
        let fragmentsCount: number;
        let fragmentsAngle: number;

        if (Math.abs(extent) <= Math.PI / 2.0) {
            fragmentsCount = 1;
            fragmentsAngle = extent;
        } else {
            fragmentsCount = Math.ceil(Math.abs(extent) / (Math.PI / 2.0));
            fragmentsAngle = extent / fragmentsCount;
        }
        if (fragmentsAngle === 0.0) {
            return;
        }

        const halfFragment = fragmentsAngle * 0.5;
        let kappa = Math.abs(
            (4.0 / 3.0) *
            (1.0 - Math.cos(halfFragment)) /
            Math.sin(halfFragment),
        );

        if (fragmentsAngle < 0.0) {
            kappa = -kappa;
        }

        let theta = startAngle;
        const endFragment = theta + fragmentsAngle; // Corrected from `startFragment` to `endFragment`

        let c1 = Math.cos(theta);
        let s1 = Math.sin(theta);
        for (let i = 0; i < fragmentsCount; i++) {
            const c0 = c1;
            const s0 = s1;
            theta = endFragment + i * fragmentsAngle; // This calculation needs to be fixed to correctly iterate fragments
            // It should be `startAngle + (i+1) * fragmentsAngle`
            // Corrected logic:
            // Current fragment start angle: startAngle + i * fragmentsAngle
            // Current fragment end angle: startAngle + (i+1) * fragmentsAngle
            const currentStartAngle = startAngle + i * fragmentsAngle;
            const currentEndAngle = startAngle + (i + 1) * fragmentsAngle;

            const c0_actual = Math.cos(currentStartAngle);
            const s0_actual = Math.sin(currentStartAngle);
            const c1_actual = Math.cos(currentEndAngle);
            const s1_actual = Math.sin(currentEndAngle);

            this.curveTo(
                cx + rx * (c0_actual - kappa * s0_actual),
                cy - ry * (s0_actual + kappa * c0_actual),
                cx + rx * (c1_actual + kappa * s1_actual),
                cy - ry * (s1_actual - kappa * c1_actual),
                cx + rx * c1_actual,
                cy - ry * s1_actual,
            );
            // Update c1, s1 for the next iteration (if needed, but not directly used in the loop header)
            c1 = c1_actual;
            s1 = s1_actual;
        }
    }

    /**
     * Draws an elliptical arc from (x1, y1) to (x2, y2).
     * The size and orientation of the ellipse are defined by two radii (rx, ry)
     * The center (cx, cy) of the ellipse is calculated automatically to satisfy
     * the constraints imposed by the other parameters. large and sweep flags
     * contribute to the automatic calculations and help determine how the arc is drawn.
     * @param x1 Start x-coordinate.
     * @param y1 Start y-coordinate.
     * @param rx X-radius.
     * @param ry Y-radius.
     * @param x2 End x-coordinate.
     * @param y2 End y-coordinate.
     * @param options.large Flag for large arc.
     * @param options.sweep Flag for sweep direction.
     * @param options.phi Rotation angle of the ellipse's x-axis in degrees.
     */
    public bezierArc(
        x1: number,
        y1: number,
        rx: number,
        ry: number,
        x2: number,
        y2: number,
        options: { large?: boolean; sweep?: boolean; phi?: number } = {},
    ): void {
        const { large = false, sweep = false, phi = 0.0 } = options;

        if (x1 === x2 && y1 === y2) {
            // From https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes:
            // If the endpoints (x1, y1) and (x2, y2) are identical, then this is
            // equivalent to omitting the elliptical arc segment entirely.
            return;
        }

        if (Math.abs(rx) <= 1e-10 || Math.abs(ry) <= 1e-10) {
            this.lineTo(x2, y2);
            return;
        }

        if (phi !== 0.0) {
            // Our box bézier arcs can't handle rotations directly
            // move to a well known point, eliminate phi and transform the other point
            const mat = Matrix4.identity();
            mat.translate(-x1, -y1, 0); // Assuming translate takes z, or a 2D equivalent
            mat.rotateZ(-phi);
            // Assuming Matrix4.transform3 takes a Vector3 and returns one.
            const tr = mat.transform3(new Vector3(x2, y2, 0));
            this._endToCenterParameters(0, 0, tr.x, tr.y, large, sweep, rx, ry);
        } else {
            this._endToCenterParameters(x1, y1, x2, y2, large, sweep, rx, ry);
        }
    }

    /**
     * Draw an SVG path.
     * @param d The SVG path data string.
     */
    public drawShape(d: string): void {
        const proxy = new _PathProxy(this);
        writeSvgPathDataToPath(d, proxy);
    }

    /**
     * Calculates the bounding box of an SVG path.
     * @param d The SVG path data string.
     * @returns A PdfRect representing the bounding box.
     */
    public static shapeBoundingBox(d: string): PdfRect {
        const proxy = new _PathBBProxy();
        writeSvgPathDataToPath(d, proxy);
        return proxy.box;
    }

    /**
     * Set line starting and ending cap type.
     * @param cap The PdfLineCap type.
     */
    public setLineCap(cap: PdfLineCap): void {
        this._buf.putString(`${cap.valueOf()} J `); // Use valueOf() to get the numeric enum value
    }

    /**
     * Set line join type.
     * @param join The PdfLineJoin type.
     */
    public setLineJoin(join: PdfLineJoin): void {
        this._buf.putString(`${join.valueOf()} j `); // Use valueOf() to get the numeric enum value
    }

    /**
     * Set line width.
     * @param width The line width.
     */
    public setLineWidth(width: number): void {
        new PdfNum(width).output(this._page, this._buf);
        this._buf.putString(' w '); // Set line width
    }

    /**
     * Set line joint miter limit.
     * @param limit The miter limit (must be >= 1.0).
     */
    public setMiterLimit(limit: number): void {
        // In production code, Dart's assert would be compiled away.
        // In TypeScript, if this needs to be enforced at runtime, use an `if` and `throw`.
        if (limit < 1.0) {
            throw new Error('Miter limit must be >= 1.0');
        }
        new PdfNum(limit).output(this._page, this._buf);
        this._buf.putString(' M '); // Set miter limit
    }

    /**
     * The dash array shall be cycled through, adding up the lengths of dashes and gaps.
     * When the accumulated length equals the value specified by the dash phase.
     *
     * Example: [2 1] will create a dash pattern with 2 on, 1 off, 2 on, 1 off, ...
     * @param array The dash array.
     * @param phase The dash phase.
     */
    public setLineDashPattern(array: number[] = [], phase: number = 0): void {
        PdfArray.fromNum(array).output(this._page, this._buf);
        this._buf.putString(` ${phase} d `); // Set dash pattern
    }

    /**
     * Mark content begin with a tag.
     * @param tag The PdfName tag.
     */
    public markContentBegin(tag: PdfName): void {
        tag.output(this._page, this._buf);
        this._buf.putString(' BMC '); // Begin marked content
    }

    /** Mark content end. */
    public markContentEnd(): void {
        this._buf.putString('EMC '); // End marked content
    }
}

/**
 * Internal class to proxy graphics operations for SVG path parsing.
 */
class _PathProxy extends PathProxy {
    constructor(private readonly canvas: PdfGraphics) {
        super();
    }

    public close(): void {
        this.canvas.closePath();
    }

    public cubicTo(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
    ): void {
        this.canvas.curveTo(x1, y1, x2, y2, x3, y3);
    }

    public lineTo(x: number, y: number): void {
        this.canvas.lineTo(x, y);
    }

    public moveTo(x: number, y: number): void {
        this.canvas.moveTo(x, y);
    }
}

/**
 * Internal class to calculate bounding box of SVG paths.
 */
class _PathBBProxy extends PathProxy {
    private _xMin = Number.POSITIVE_INFINITY;
    private _yMin = Number.POSITIVE_INFINITY;
    private _xMax = Number.NEGATIVE_INFINITY;
    private _yMax = Number.NEGATIVE_INFINITY;

    private _pX = 0.0;
    private _pY = 0.0;

    constructor() {
        super();
    }

    public get box(): PdfRect {
        if (this._xMin > this._xMax || this._yMin > this._yMax) {
            return PdfRect.zero; // Assuming PdfRect has a static `zero` property
        }
        return PdfRect.fromLTRB(this._xMin, this._yMin, this._xMax, this._yMax);
    }

    public close(): void {
        // No-op for bounding box calculation
    }

    public cubicTo(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
    ): void {
        const tValues: number[] = [];
        let a, b, c, t, t1, t2, b2ac, sqrtB2ac;

        for (let i = 0; i < 2; ++i) {
            if (i === 0) {
                // X-coordinates
                b = 6 * this._pX - 12 * x1 + 6 * x2;
                a = -3 * this._pX + 9 * x1 - 9 * x2 + 3 * x3;
                c = 3 * x1 - 3 * this._pX;
            } else {
                // Y-coordinates
                b = 6 * this._pY - 12 * y1 + 6 * y2;
                a = -3 * this._pY + 9 * y1 - 9 * y2 + 3 * y3;
                c = 3 * y1 - 3 * this._pY;
            }

            if (Math.abs(a) < 1e-12) {
                // If a is effectively zero (linear or quadratic curve)
                if (Math.abs(b) < 1e-12) {
                    // If b is also zero, it's a point or horizontal/vertical line segment
                    continue;
                }
                t = -c / b;
                if (t > 0 && t < 1) {
                    // Check if extremum is within the curve segment
                    tValues.push(t);
                }
                continue;
            }

            b2ac = b * b - 4 * c * a;
            if (b2ac < 0) {
                if (Math.abs(b2ac) < 1e-12) {
                    // Numerically zero, single root
                    t = -b / (2 * a);
                    if (t > 0 && t < 1) {
                        tValues.push(t);
                    }
                }
                continue; // No real roots, no extrema within the curve
            }

            sqrtB2ac = Math.sqrt(b2ac);
            t1 = (-b + sqrtB2ac) / (2 * a);
            if (t1 > 0 && t1 < 1) {
                tValues.push(t1);
            }
            t2 = (-b - sqrtB2ac) / (2 * a);
            if (t2 > 0 && t2 < 1) {
                tValues.push(t2);
            }
        }

        // Evaluate curve at all t-values for extrema and include endpoints
        for (const t of tValues) {
            const mt = 1 - t;
            const x =
                mt * mt * mt * this._pX +
                3 * mt * mt * t * x1 +
                3 * mt * t * t * x2 +
                t * t * t * x3;
            const y =
                mt * mt * mt * this._pY +
                3 * mt * mt * t * y1 +
                3 * mt * t * t * y2 +
                t * t * t * y3;
            this._updateMinMax(x, y);
        }
        this._updateMinMax(this._pX, this._pY); // Include start point
        this._updateMinMax(x3, y3); // Include end point

        this._pX = x3;
        this._pY = y3;
    }

    public lineTo(x: number, y: number): void {
        this._pX = x;
        this._pY = y;
        this._updateMinMax(x, y);
    }

    public moveTo(x: number, y: number): void {
        this._pX = x;
        this._pY = y;
        this._updateMinMax(x, y);
    }

    private _updateMinMax(x: number, y: number): void {
        this._xMin = Math.min(this._xMin, x);
        this._yMin = Math.min(this._yMin, y);
        this._xMax = Math.max(this._xMax, x);
        this._yMax = Math.max(this._yMax, y);
    }
}