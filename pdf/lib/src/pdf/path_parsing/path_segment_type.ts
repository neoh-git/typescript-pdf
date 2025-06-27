/**
 * Enumerates the various SVG path segment commands.
 */
export enum SvgPathSegType {
    /// Indicates initial state or error
    unknown,
    /// Z or z
    close,
    /// M
    moveToAbs,
    /// m
    moveToRel,
    /// L
    lineToAbs,
    /// l
    lineToRel,
    /// C
    cubicToAbs,
    /// c
    cubicToRel,
    /// Q
    quadToAbs,
    /// q
    quadToRel,
    /// A
    arcToAbs,
    /// a
    arcToRel,
    /// H
    lineToHorizontalAbs,
    /// h
    lineToHorizontalRel,
    /// V
    lineToVerticalAbs,
    /// v
    lineToVerticalRel,
    /// S
    smoothCubicToAbs,
    /// s
    smoothCubicToRel,
    /// T
    smoothQuadToAbs,
    /// t
    smoothQuadToRel,
}

/**
 * Character constants used internally for parsing SVG path data.
 * A namespace is used here as the TypeScript equivalent of a non-instantiable
 * class that serves as a container for constants and utility functions.
 */
export namespace AsciiConstants {
    // --- Whitespace and Delimiters ---
    /** `\t` (horizontal tab). */
    export const slashT = 9;
    /** `\n` (newline). */
    export const slashN = 10;
    /** `\f` (form feed). */
    export const slashF = 12;
    /** `\r` (carriage return). */
    export const slashR = 13;
    /** ` ` (space). */
    export const space = 32;
    /** `,` (comma). */
    export const comma = 44;

    // --- Numeric Characters and Signs ---
    /** `+` (plus). */
    export const plus = 43;
    /** `-` (minus). */
    export const minus = 45;
    /** `.` (period). */
    export const period = 46;
    /** 0 (the number zero). */
    export const number0 = 48;
    /** 1 (the number one). */
    export const number1 = 49;
    // ... (other numbers can be added if needed, but not required by the map)

    // --- Uppercase Path Command Characters ---
    /** A */
    export const upperA = 65;
    /** C */
    export const upperC = 67;
    /** E */
    export const upperE = 69;
    /** H */
    export const upperH = 72;
    /** L */
    export const upperL = 76;
    /** M */
    export const upperM = 77;
    /** Q */
    export const upperQ = 81;
    /** S */
    export const upperS = 83;
    /** T */
    export const upperT = 84;
    /** V */
    export const upperV = 86;
    /** Z */
    export const upperZ = 90;

    // --- Lowercase Path Command Characters ---
    /** a */
    export const lowerA = 97;
    /** c */
    export const lowerC = 99;
    /** e */
    export const lowerE = 101;
    /** h */
    export const lowerH = 104;
    /** l */
    export const lowerL = 108;
    /** m */
    export const lowerM = 109;
    /** q */
    export const lowerQ = 113;
    /** s */
    export const lowerS = 115;
    /** t */
    export const lowerT = 116;
    /** v */
    export const lowerV = 118;
    /** x */
    export const lowerX = 120;
    /** z */
    export const lowerZ = 122;

    /**
     * Map to go from an ASCII character code to an SvgPathSegType.
     * Using an object with a numeric index signature is the direct equivalent of `Map<int, enum>`.
     */
    export const letterToSegmentType: { [key: number]: SvgPathSegType } = {
        [upperZ]: SvgPathSegType.close,
        [lowerZ]: SvgPathSegType.close,
        [upperM]: SvgPathSegType.moveToAbs,
        [lowerM]: SvgPathSegType.moveToRel,
        [upperL]: SvgPathSegType.lineToAbs,
        [lowerL]: SvgPathSegType.lineToRel,
        [upperC]: SvgPathSegType.cubicToAbs,
        [lowerC]: SvgPathSegType.cubicToRel,
        [upperQ]: SvgPathSegType.quadToAbs,
        [lowerQ]: SvgPathSegType.quadToRel,
        [upperA]: SvgPathSegType.arcToAbs,
        [lowerA]: SvgPathSegType.arcToRel,
        [upperH]: SvgPathSegType.lineToHorizontalAbs,
        [lowerH]: SvgPathSegType.lineToHorizontalRel,
        [upperV]: SvgPathSegType.lineToVerticalAbs,
        [lowerV]: SvgPathSegType.lineToVerticalRel,
        [upperS]: SvgPathSegType.smoothCubicToAbs,
        [lowerS]: SvgPathSegType.smoothCubicToRel,
        [upperT]: SvgPathSegType.smoothQuadToAbs,
        [lowerT]: SvgPathSegType.smoothQuadToRel,
    };

    /**
     * Maps a character code to its corresponding SvgPathSegType.
     * @param lookahead The ASCII character code to look up.
     * @returns The matching SvgPathSegType, or SvgPathSegType.unknown if not found.
     */
    export function mapLetterToSegmentType(lookahead: number): SvgPathSegType {
        // The nullish coalescing operator '??' is a direct equivalent to Dart's '??'.
        return letterToSegmentType[lookahead] ?? SvgPathSegType.unknown;
    }
}