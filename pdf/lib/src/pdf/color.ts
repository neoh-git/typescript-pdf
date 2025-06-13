// No specific imports are needed for 'dart:math' as Math is global in JS/TS.
// Math module is aliased as 'math' in Dart for clarity, but in TS we use 'Math' directly.

// Helper function from Dart code
// Dart's `double.nan` is `Number.NaN` in TypeScript.
function _getHue(
    red: number,
    green: number,
    blue: number,
    max: number,
    delta: number,
): number {
    let hue = Number.NaN;
    if (max === 0.0) {
        hue = 0.0;
    } else if (max === red) {
        hue = 60.0 * (((green - blue) / delta) % 6);
    } else if (max === green) {
        hue = 60.0 * (((blue - red) / delta) + 2);
    } else if (max === blue) {
        hue = 60.0 * (((red - green) / delta) + 4);
    }

    /// Set hue to 0.0 when red == green == blue.
    hue = Number.isNaN(hue) ? 0.0 : hue;
    return hue;
}

/**
 * Represents an RGB color.
 */
export class PdfColor {
    public readonly red: number;
    public readonly green: number;
    public readonly blue: number;
    public readonly alpha: number;

    /**
     * Create a color with red, green, blue and alpha components.
     * Values between 0 and 1.
     * @param red Red component (0-1).
     * @param green Green component (0-1).
     * @param blue Blue component (0-1).
     * @param alpha Alpha (opacity) component (0-1). Defaults to 1.0.
     * @throws Error if any component is outside the 0-1 range.
     */
    constructor(red: number, green: number, blue: number, alpha: number = 1.0) {
        // Dart's `assert` statements are for debug mode. In TypeScript,
        // we can use runtime checks that throw errors, or `console.assert` for debug.
        if (red < 0 || red > 1 || green < 0 || green > 1 || blue < 0 || blue > 1 || alpha < 0 || alpha > 1) {
            throw new Error('Color components must be between 0 and 1.');
        }
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = alpha;
    }

    /**
     * Creates a PdfColor from a 32-bit integer (0xAARRGGBB).
     * @param color The 32-bit integer color value.
     * @returns A new PdfColor instance.
     */
    static fromInt(color: number): PdfColor {
        // Bitwise operations are direct in TypeScript.
        const red = ((color >> 16) & 0xff) / 255.0;
        const green = ((color >> 8) & 0xff) / 255.0;
        const blue = (color & 0xff) / 255.0;
        const alpha = ((color >> 24) & 0xff) / 255.0;
        // Call the primary constructor to ensure validations run.
        return new PdfColor(red, green, blue, alpha);
    }

    /**
     * Can parse colors in the form:
     * * #RRGGBBAA
     * * #RRGGBB
     * * #RGB
     * * RRGGBBAA
     * * RRGGBB
     * * RGB
     * @param color The hex string representation of the color.
     * @returns A new PdfColor instance.
     * @throws Error if the hex string format is invalid.
     */
    static fromHex(color: string): PdfColor {
        if (color.startsWith('#')) {
            color = color.substring(1);
        }

        let red: number;
        let green: number;
        let blue: number;
        let alpha = 1.0;

        if (color.length === 3) {
            // Dart's `* 2` for string repetition becomes `.repeat(2)` in TS.
            // `int.parse(..., radix: 16)` becomes `parseInt(..., 16)`.
            red = parseInt(color.substring(0, 1).repeat(2), 16) / 255;
            green = parseInt(color.substring(1, 2).repeat(2), 16) / 255;
            blue = parseInt(color.substring(2, 3).repeat(2), 16) / 255;
            return new PdfColor(red, green, blue, alpha);
        }

        if (!(color.length === 6 || color.length === 8)) {
            throw new Error('Hex color string must be 3, 6, or 8 characters long (excluding #).');
        }

        red = parseInt(color.substring(0, 2), 16) / 255;
        green = parseInt(color.substring(2, 4), 16) / 255;
        blue = parseInt(color.substring(4, 6), 16) / 255;

        if (color.length === 8) {
            alpha = parseInt(color.substring(6, 8), 16) / 255;
        }

        return new PdfColor(red, green, blue, alpha);
    }

    /**
     * Load an RGB color from a RYB color (Red, Yellow, Blue).
     * @param red RYB Red component (0-1).
     * @param yellow RYB Yellow component (0-1).
     * @param blue RYB Blue component (0-1).
     * @param alpha Alpha component (0-1). Defaults to 1.0.
     * @returns A new PdfColor instance (in RGB).
     * @throws Error if any RYB component is outside the 0-1 range.
     */
    static fromRYB(red: number, yellow: number, blue: number, alpha: number = 1.0): PdfColor {
        if (red < 0 || red > 1 || yellow < 0 || yellow > 1 || blue < 0 || blue > 1 || alpha < 0 || alpha > 1) {
            throw new Error('RYB color components must be between 0 and 1.');
        }

        // `const magic` in Dart is `static readonly` or just `const` array in TS.
        // Given its scope, it can be a local constant array.
        const magic: number[][] = [
            [1, 1, 1],
            [1, 1, 0],
            [1, 0, 0],
            [1, 0.5, 0],
            [0.163, 0.373, 0.6],
            [0.0, 0.66, 0.2],
            [0.5, 0.0, 0.5],
            [0.2, 0.094, 0.0],
        ];

        const cubicInt = (t: number, A: number, B: number): number => {
            const weight = t * t * (3 - 2 * t);
            return A + weight * (B - A);
        };

        const getRed = (iR: number, iY: number, iB: number): number => {
            const x0 = cubicInt(iB, magic[0][0], magic[4][0]);
            const x1 = cubicInt(iB, magic[1][0], magic[5][0]);
            const x2 = cubicInt(iB, magic[2][0], magic[6][0]);
            const x3 = cubicInt(iB, magic[3][0], magic[7][0]);
            const y0 = cubicInt(iY, x0, x1);
            const y1 = cubicInt(iY, x2, x3);
            return cubicInt(iR, y0, y1);
        };

        const getGreen = (iR: number, iY: number, iB: number): number => {
            const x0 = cubicInt(iB, magic[0][1], magic[4][1]);
            const x1 = cubicInt(iB, magic[1][1], magic[5][1]);
            const x2 = cubicInt(iB, magic[2][1], magic[6][1]);
            const x3 = cubicInt(iB, magic[3][1], magic[7][1]);
            const y0 = cubicInt(iY, x0, x1);
            const y1 = cubicInt(iY, x2, x3);
            return cubicInt(iR, y0, y1);
        };

        const getBlue = (iR: number, iY: number, iB: number): number => {
            const x0 = cubicInt(iB, magic[0][2], magic[4][2]);
            const x1 = cubicInt(iB, magic[1][2], magic[5][2]);
            const x2 = cubicInt(iB, magic[2][2], magic[6][2]);
            const x3 = cubicInt(iB, magic[3][2], magic[7][2]);
            const y0 = cubicInt(iY, x0, x1);
            const y1 = cubicInt(iY, x2, x3);
            return cubicInt(iR, y0, y1);
        };

        const redValue = getRed(red, yellow, blue);
        const greenValue = getGreen(red, yellow, blue);
        const blueValue = getBlue(red, yellow, blue);
        return new PdfColor(redValue, greenValue, blueValue, alpha);
    }

    /**
     * Get the 32-bit integer representation of this color (0xAARRGGBB).
     * @returns The 32-bit integer color value.
     */
    toInt(): number {
        // Dart's `.round() & 0xff` ensures integer and byte range (0-255).
        // `& 0xFFFFFFFF` ensures a 32-bit unsigned integer, though JS numbers are Float64.
        return (
            ((Math.round(this.alpha * 255.0) & 0xff) << 24) |
            ((Math.round(this.red * 255.0) & 0xff) << 16) |
            ((Math.round(this.green * 255.0) & 0xff) << 8) |
            ((Math.round(this.blue * 255.0) & 0xff) << 0)
        ) >>> 0; // Use >>> 0 for unsigned 32-bit conversion in JS
    }

    /**
     * Get an Hexadecimal representation of this color (#RRGGBBAA).
     * @returns The hex string representation.
     */
    toHex(): string {
        const i = this.toInt();
        // Dart's `.toRadixString(16).padLeft(6, '0')` becomes `.toString(16).padStart(6, '0')`.
        const rgb = (i & 0xffffff).toString(16).padStart(6, '0');
        const a = ((i & 0xff000000) >>> 24).toString(16).padStart(2, '0'); // Use >>> 24 for unsigned right shift
        return `#${rgb}${a}`;
    }

    /**
     * Convert this color to CMYK.
     * @returns A PdfColorCmyk instance.
     */
    toCmyk(): PdfColorCmyk {
        return PdfColorCmyk.fromRgb(this.red, this.green, this.blue, this.alpha);
    }

    /**
     * Convert this color to HSV.
     * @returns A PdfColorHsv instance.
     */
    toHsv(): PdfColorHsv {
        return PdfColorHsv.fromRgb(this.red, this.green, this.blue, this.alpha);
    }

    /**
     * Convert this color to HSL.
     * @returns A PdfColorHsl instance.
     */
    toHsl(): PdfColorHsl {
        return PdfColorHsl.fromRgb(this.red, this.green, this.blue, this.alpha);
    }

    // Private static helper for luminance calculation
    private static _linearizeColorComponent(component: number): number {
        if (component <= 0.03928) {
            return component / 12.92;
        }
        // Dart's `math.pow(base, exponent).toDouble()` is `Math.pow(base, exponent)`.
        return Math.pow((component + 0.055) / 1.055, 2.4);
    }

    /**
     * Determines whether the given color is light.
     * @returns True if the color is light, false otherwise.
     */
    get isLight(): boolean {
        return !this.isDark;
    }

    /**
     * Determines whether the given color is dark.
     * @returns True if the color is dark, false otherwise.
     */
    get isDark(): boolean {
        const relativeLuminance = this.luminance;
        const kThreshold = 0.15;
        return (relativeLuminance + 0.05) * (relativeLuminance + 0.05) > kThreshold;
    }

    /**
     * Get the luminance of the color.
     * @returns The luminance value.
     */
    get luminance(): number {
        const R = PdfColor._linearizeColorComponent(this.red);
        const G = PdfColor._linearizeColorComponent(this.green);
        const B = PdfColor._linearizeColorComponent(this.blue);
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }

    /**
     * Build a Material Color shade using the given [strength].
     *
     * To lighten a color, set the [strength] value to < .5
     * To darken a color, set the [strength] value to > .5
     * @param strength The shading strength (0-1).
     * @returns A new PdfColor instance with the applied shade.
     */
    shade(strength: number): PdfColor {
        const ds = 1.5 - strength;
        const hsl = this.toHsl();

        // Dart's `.clamp(0.0, 1.0)` is `Math.max(0.0, Math.min(value, 1.0))` in TS.
        const newLightness = Math.max(0.0, Math.min(hsl.lightness * ds, 1.0));
        const shaded = PdfColorHsl.fromHsl(hsl.hue, hsl.saturation, newLightness, hsl.alpha);
        return new PdfColorHsl(
            shaded.hue,
            shaded.saturation,
            shaded.lightness,
            shaded.alpha,
            shaded.red,
            shaded.green,
            shaded.blue,
        );
    }

    /**
     * Get a complementary color with hue shifted by -120°.
     * @returns A new PdfColorHsv instance representing the complementary color.
     */
    get complementary(): PdfColorHsv {
        return this.toHsv().complementary;
    }

    /**
     * Get some similar colors (monochromatic variations).
     * @returns An array of PdfColorHsv instances.
     */
    get monochromatic(): PdfColorHsv[] {
        return this.toHsv().monochromatic;
    }

    /**
     * Returns a list of split complementary colors.
     * @returns An array of PdfColorHsv instances.
     */
    get splitcomplementary(): PdfColorHsv[] {
        return this.toHsv().splitcomplementary;
    }

    /**
     * Returns a list of tetradic colors.
     * @returns An array of PdfColorHsv instances.
     */
    get tetradic(): PdfColorHsv[] {
        return this.toHsv().tetradic;
    }

    /**
     * Returns a list of triadic colors.
     * @returns An array of PdfColorHsv instances.
     */
    get triadic(): PdfColorHsv[] {
        return this.toHsv().triadic;
    }

    /**
     * Returns a list of analagous colors.
     * @returns An array of PdfColorHsv instances.
     */
    get analagous(): PdfColorHsv[] {
        return this.toHsv().analagous;
    }

    /**
     * Apply the color transparency by updating the color values according to a
     * background color.
     * @param background The background color. Defaults to white.
     * @returns A new PdfColor instance after flattening the transparency.
     */
    flatten(background: PdfColor = new PdfColor(1, 1, 1)): PdfColor {
        return new PdfColor(
            this.alpha * this.red + (1 - this.alpha) * background.red,
            this.alpha * this.green + (1 - this.alpha) * background.green,
            this.alpha * this.blue + (1 - this.alpha) * background.blue,
            background.alpha,
        );
    }

    /**
     * Returns a string representation of the color.
     * @returns A string like `PdfColor(red, green, blue, alpha)`.
     */
    toString(): string {
        // Dart's `runtimeType` is `this.constructor.name` in TypeScript.
        return `${this.constructor.name}(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
    }

    /**
     * Custom equality operator for PdfColor.
     * @param other The object to compare with.
     * @returns True if the colors are identical, false otherwise.
     */
    // In TypeScript, `operator ==` cannot be directly overridden for `==`.
    // Instead, it's common to implement an `equals` method.
    // The provided Dart `operator ==` would check for reference equality first,
    // then runtime type, then component equality.
    equals(other: any): boolean {
        if (this === other) {
            return true;
        }
        // Check if `other` is an instance of `PdfColor` and has the same component values.
        return other instanceof PdfColor &&
            other.red === this.red &&
            other.green === this.green &&
            other.blue === this.blue &&
            other.alpha === this.alpha;
    }

    /**
     * Custom hash code for PdfColor, based on its integer representation.
     * @returns The integer hash code.
     */
    get hashCode(): number {
        return this.toInt();
    }
}

/**
 * Represents a grayscale color.
 */
export class PdfColorGrey extends PdfColor {
    /**
     * Create a grey color.
     * @param color The grayscale value (0-1).
     * @param alpha Alpha (opacity) component (0-1). Defaults to 1.0.
     */
    constructor(color: number, alpha: number = 1.0) {
        super(color, color, color, alpha);
    }
}

/**
 * Represents a CMYK color.
 * Note: RGB values are derived from CMYK in the constructor, but the CMYK components are stored.
 */
export class PdfColorCmyk extends PdfColor {
    public readonly cyan: number;
    public readonly magenta: number;
    public readonly yellow: number;
    public readonly black: number;

    /**
     * Creates a CMYK color from C, M, Y, K components.
     * @param cyan Cyan component (0-1).
     * @param magenta Magenta component (0-1).
     * @param yellow Yellow component (0-1).
     * @param black Black component (0-1).
     * @param alpha Alpha component (0-1). Defaults to 1.0.
     */
    constructor(cyan: number, magenta: number, yellow: number, black: number, alpha: number = 1.0) {
        // CMYK to RGB conversion done in super constructor call.
        // Dart's `super(...)` in initializer list.
        super(
            (1.0 - cyan) * (1.0 - black),
            (1.0 - magenta) * (1.0 - black),
            (1.0 - yellow) * (1.0 - black),
            alpha,
        );
        this.cyan = cyan;
        this.magenta = magenta;
        this.yellow = yellow;
        this.black = black;
    }

    /**
     * Create a CMYK color from red, green, and blue components.
     * @param r Red component (0-1).
     * @param g Green component (0-1).
     * @param b Blue component (0-1).
     * @param a Alpha component (0-1). Defaults to 1.0.
     * @returns A new PdfColorCmyk instance.
     */
    static fromRgb(r: number, g: number, b: number, a: number = 1.0): PdfColorCmyk {
        // This is a direct port of the Dart `fromRgb` named constructor's
        // complex CMYK conversion logic within its initializer list.
        const k = 1.0 - Math.max(r, g, b); // Black component
        // The divisor `(1.0 - k)` must be checked to prevent division by zero.
        // If k is 1.0, it means the color is black, so C, M, Y are 0.
        const divisor = (1.0 - k);

        const c = divisor === 0 ? 0 : (1.0 - r - k) / divisor;
        const m = divisor === 0 ? 0 : (1.0 - g - k) / divisor;
        const y = divisor === 0 ? 0 : (1.0 - b - k) / divisor;

        // Call the primary constructor of PdfColorCmyk.
        return new PdfColorCmyk(c, m, y, k, a);
    }

    override toCmyk(): PdfColorCmyk {
        return this;
    }

    /**
     * Returns a string representation of the CMYK color.
     * @returns A string like `PdfColorCmyk(cyan, magenta, yellow, black, alpha)`.
     */
    override toString(): string {
        return `${this.constructor.name}(${this.cyan}, ${this.magenta}, ${this.yellow}, ${this.black}, ${this.alpha})`;
    }
}

/**
 * Same as HSB, Cylindrical geometries with hue, their angular dimension,
 * starting at the red primary at 0°, passing through the green primary
 * at 120° and the blue primary at 240°, and then wrapping back to red at 360°.
 */
export class PdfColorHsv extends PdfColor {
    public readonly hue: number;
    public readonly saturation: number;
    public readonly value: number;

    /**
     * Private constructor used by factories to create PdfColorHsv instances,
     * ensuring hue, saturation, and value ranges.
     */
    private constructor(
        hue: number,
        saturation: number,
        value: number,
        red: number,
        green: number,
        blue: number,
        alpha: number,
    ) {
        if (hue < 0 || hue >= 360 || saturation < 0 || saturation > 1 || value < 0 || value > 1) {
            throw new Error('HSV components out of valid range.');
        }
        super(red, green, blue, alpha);
        this.hue = hue;
        this.saturation = saturation;
        this.value = value;
    }

    /**
     * Creates an HSV color from H, S, V components.
     * @param hue Hue (0-360 degrees).
     * @param saturation Saturation (0-1).
     * @param value Value (0-1).
     * @param alpha Alpha (opacity) (0-1). Defaults to 1.0.
     * @returns A new PdfColorHsv instance.
     */
    static fromHsv(hue: number, saturation: number, value: number, alpha: number = 1.0): PdfColorHsv {
        const chroma = saturation * value;
        // Dart's `((hue / 60.0) % 2.0) - 1.0).abs()`
        const secondary = chroma * (1.0 - (Math.abs((hue / 60.0) % 2.0 - 1.0)));
        const match = value - chroma;

        let red: number;
        let green: number;
        let blue: number;

        if (hue < 60.0) {
            red = chroma;
            green = secondary;
            blue = 0.0;
        } else if (hue < 120.0) {
            red = secondary;
            green = chroma;
            blue = 0.0;
        } else if (hue < 180.0) {
            red = 0.0;
            green = chroma;
            blue = secondary;
        } else if (hue < 240.0) {
            red = 0.0;
            green = secondary;
            blue = chroma;
        } else if (hue < 300.0) {
            red = secondary;
            green = 0.0;
            blue = chroma;
        } else {
            red = chroma;
            green = 0.0;
            blue = secondary;
        }

        // Dart's `.clamp(0.0, 1.0)`
        return new PdfColorHsv(
            hue,
            saturation,
            value,
            Math.max(0.0, Math.min(red + match, 1.0)),
            Math.max(0.0, Math.min(green + match, 1.0)),
            Math.max(0.0, Math.min(blue + match, 1.0)),
            alpha,
        );
    }

    /**
     * Creates an HSV color from red, green, blue components.
     * @param red Red component (0-1).
     * @param green Green component (0-1).
     * @param blue Blue component (0-1).
     * @param alpha Alpha component (0-1). Defaults to 1.0.
     * @returns A new PdfColorHsv instance.
     */
    static fromRgb(red: number, green: number, blue: number, alpha: number = 1.0): PdfColorHsv {
        const max = Math.max(red, Math.max(green, blue));
        const min = Math.min(red, Math.min(green, blue));
        const delta = max - min;

        const hue = _getHue(red, green, blue, max, delta);
        const saturation = max === 0.0 ? 0.0 : delta / max;

        return new PdfColorHsv(hue, saturation, max, red, green, blue, alpha);
    }

    override toHsv(): PdfColorHsv {
        return this;
    }

    override get complementary(): PdfColorHsv {
        // Modulo 360 for hue ensures it wraps around correctly.
        // Dart's `%` operator handles negative numbers differently for modulo.
        // In JS, `((x % m) + m) % m` is a common pattern for true mathematical modulo.
        const complementaryHue = (((this.hue - 120) % 360) + 360) % 360;
        return PdfColorHsv.fromHsv(complementaryHue, this.saturation, this.value, this.alpha);
    }

    override get monochromatic(): PdfColorHsv[] {
        return [
            PdfColorHsv.fromHsv(
                this.hue,
                Math.max(0, Math.min(this.saturation > 0.5 ? this.saturation - 0.2 : this.saturation + 0.2, 1)),
                Math.max(0, Math.min(this.value > 0.5 ? this.value - 0.1 : this.value + 0.1, 1)),
                this.alpha
            ),
            PdfColorHsv.fromHsv(
                this.hue,
                Math.max(0, Math.min(this.saturation > 0.5 ? this.saturation - 0.4 : this.saturation + 0.4, 1)),
                Math.max(0, Math.min(this.value > 0.5 ? this.value - 0.2 : this.value + 0.2, 1)),
                this.alpha
            ),
            PdfColorHsv.fromHsv(
                this.hue,
                Math.max(0, Math.min(this.saturation > 0.5 ? this.saturation - 0.15 : this.saturation + 0.15, 1)),
                Math.max(0, Math.min(this.value > 0.5 ? this.value - 0.05 : this.value + 0.05, 1)),
                this.alpha
            ),
        ];
    }

    override get splitcomplementary(): PdfColorHsv[] {
        const hue1 = (((this.hue - 150) % 360) + 360) % 360;
        const hue2 = (((this.hue - 180) % 360) + 360) % 360;
        return [
            PdfColorHsv.fromHsv(hue1, this.saturation, this.value, this.alpha),
            PdfColorHsv.fromHsv(hue2, this.saturation, this.value, this.alpha),
        ];
    }

    override get triadic(): PdfColorHsv[] {
        const hue1 = ((this.hue + 80) % 360 + 360) % 360;
        const hue2 = (((this.hue - 120) % 360) + 360) % 360;
        return [
            PdfColorHsv.fromHsv(hue1, this.saturation, this.value, this.alpha),
            PdfColorHsv.fromHsv(hue2, this.saturation, this.value, this.alpha),
        ];
    }

    override get tetradic(): PdfColorHsv[] {
        const hue1 = ((this.hue + 120) % 360 + 360) % 360;
        const hue2 = (((this.hue - 150) % 360) + 360) % 360;
        const hue3 = ((this.hue + 60) % 360 + 360) % 360;
        return [
            PdfColorHsv.fromHsv(hue1, this.saturation, this.value, this.alpha),
            PdfColorHsv.fromHsv(hue2, this.saturation, this.value, this.alpha),
            PdfColorHsv.fromHsv(hue3, this.saturation, this.value, this.alpha),
        ];
    }

    override get analagous(): PdfColorHsv[] {
        const hue1 = ((this.hue + 30) % 360 + 360) % 360;
        const hue2 = (((this.hue - 20) % 360) + 360) % 360;
        return [
            PdfColorHsv.fromHsv(hue1, this.saturation, this.value, this.alpha),
            PdfColorHsv.fromHsv(hue2, this.saturation, this.value, this.alpha),
        ];
    }

    /**
     * Returns a string representation of the HSV color.
     * @returns A string like `PdfColorHsv(hue, saturation, value, alpha)`.
     */
    override toString(): string {
        return `${this.constructor.name}(${this.hue}, ${this.saturation}, ${this.value}, ${this.alpha})`;
    }
}

/**
 * Represents an HSL color.
 */
export class PdfColorHsl extends PdfColor {
    public readonly hue: number;
    public readonly saturation: number;
    public readonly lightness: number;

    /**
     * Public constructor used by factories to create PdfColorHsl instances,
     * ensuring hue, saturation, and lightness ranges.
     */
    public constructor(
        hue: number,
        saturation: number,
        lightness: number,
        alpha: number,
        red: number,
        green: number,
        blue: number,
    ) {
        if (hue < 0 || hue >= 360 || saturation < 0 || saturation > 1 || lightness < 0 || lightness > 1) {
            throw new Error('HSL components out of valid range.');
        }
        super(red, green, blue, alpha);
        this.hue = hue;
        this.saturation = saturation;
        this.lightness = lightness;
    }

    /**
     * Creates an HSL color from H, S, L components.
     * @param hue Hue (0-360 degrees).
     * @param saturation Saturation (0-1).
     * @param lightness Lightness (0-1).
     * @param alpha Alpha (opacity) (0-1). Defaults to 1.0.
     * @returns A new PdfColorHsl instance.
     */
    static fromHsl(hue: number, saturation: number, lightness: number, alpha: number = 1.0): PdfColorHsl {
        const chroma = (1.0 - Math.abs(2.0 * lightness - 1.0)) * saturation;
        const secondary = chroma * (1.0 - Math.abs((hue / 60.0) % 2.0 - 1.0));
        const match = lightness - chroma / 2.0;

        let red: number;
        let green: number;
        let blue: number;

        if (hue < 60.0) {
            red = chroma;
            green = secondary;
            blue = 0.0;
        } else if (hue < 120.0) {
            red = secondary;
            green = chroma;
            blue = 0.0;
        } else if (hue < 180.0) {
            red = 0.0;
            green = chroma;
            blue = secondary;
        } else if (hue < 240.0) {
            red = 0.0;
            green = secondary;
            blue = chroma;
        } else if (hue < 300.0) {
            red = secondary;
            green = 0.0;
            blue = chroma;
        } else {
            red = chroma;
            green = 0.0;
            blue = secondary;
        }

        return new PdfColorHsl(
            hue,
            saturation,
            lightness,
            alpha,
            Math.max(0.0, Math.min(red + match, 1.0)),
            Math.max(0.0, Math.min(green + match, 1.0)),
            Math.max(0.0, Math.min(blue + match, 1.0)),
        );
    }

    /**
     * Creates an HSL color from red, green, and blue components.
     * @param red Red component (0-1).
     * @param green Green component (0-1).
     * @param blue Blue component (0-1).
     * @param alpha Alpha component (0-1). Defaults to 1.0.
     * @returns A new PdfColorHsl instance.
     */
    static fromRgb(red: number, green: number, blue: number, alpha: number = 1.0): PdfColorHsl {
        const max = Math.max(red, Math.max(green, blue));
        const min = Math.min(red, Math.min(green, blue));
        const delta = max - min;

        const hue = _getHue(red, green, blue, max, delta);
        const lightness = (max + min) / 2.0;
        // Saturation can exceed 1.0 with rounding errors, so clamp it.
        const saturation = lightness === 1.0
            ? 0.0
            : Math.max(0.0, Math.min(delta / (1.0 - Math.abs(2.0 * lightness - 1.0)), 1.0));

        return new PdfColorHsl(hue, saturation, lightness, alpha, red, green, blue);
    }

    override toHsl(): PdfColorHsl {
        return this;
    }

    /**
     * Returns a string representation of the HSL color.
     * @returns A string like `PdfColorHsl(hue, saturation, lightness, alpha)`.
     */
    override toString(): string {
        return `${this.constructor.name}(${this.hue}, ${this.saturation}, ${this.lightness}, ${this.alpha})`;
    }
}