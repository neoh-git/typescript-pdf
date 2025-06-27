import { SvgPathSegType, AsciiConstants } from './path_segment_type';
import { mat4, vec3 } from 'gl-matrix';


/**
 * A receiver for normalized PathSegmentData.
 * The TypeScript equivalent of the `PathProxy` abstract class.
 */
export interface PathProxy {
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    cubicTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;
    close(): void;
}

/**
 * Provides a minimal, immutable implementation of a 2D offset or point.
 */
export class PathOffset {
    public readonly dx: number;
    public readonly dy: number;

    constructor(dx: number, dy: number) {
        this.dx = dx;
        this.dy = dy;
    }

    public static get zero(): PathOffset {
        return new PathOffset(0.0, 0.0);
    }

    public get direction(): number {
        return Math.atan2(this.dy, this.dx);
    }

    public translate(translateX: number, translateY: number): PathOffset {
        return new PathOffset(this.dx + translateX, this.dy + translateY);
    }

    public add(other: PathOffset): PathOffset {
        return new PathOffset(this.dx + other.dx, this.dy + other.dy);
    }

    public subtract(other: PathOffset): PathOffset {
        return new PathOffset(this.dx - other.dx, this.dy - other.dy);
    }

    public scale(operand: number): PathOffset {
        return new PathOffset(this.dx * operand, this.dy * operand);
    }

    public equals(other: unknown): boolean {
        return other instanceof PathOffset && other.dx === this.dx && other.dy === this.dy;
    }

    public toString(): string {
        return `PathOffset{${this.dx},${this.dy}}`;
    }
}

/**
 * A data container for a single segment of an SVG path.
 */
export class PathSegmentData {
    public command: SvgPathSegType = SvgPathSegType.unknown;
    public targetPoint: PathOffset = PathOffset.zero;
    public point1: PathOffset = PathOffset.zero;
    public point2: PathOffset = PathOffset.zero;
    public arcSweep: boolean = false;
    public arcLarge: boolean = false;

    get arcRadii(): PathOffset { return this.point1; }

    get arcAngle(): number { return this.point2.dx; }
    set arcAngle(angle: number) { this.point2 = new PathOffset(angle, this.point2.dy); }

    get r1(): number { return this.arcRadii.dx; }
    get r2(): number { return this.arcRadii.dy; }

    get largeArcFlag(): boolean { return this.arcLarge; }
    get sweepFlag(): boolean { return this.arcSweep; }

    get x(): number { return this.targetPoint.dx; }
    get y(): number { return this.targetPoint.dy; }

    get x1(): number { return this.point1.dx; }
    get y1(): number { return this.point1.dy; }

    get x2(): number { return this.point2.dx; }
    get y2(): number { return this.point2.dy; }

    public toString(): string {
        return `PathSegmentData{${this.command} ${this.targetPoint} ${this.point1} ${this.point2} ${this.arcSweep} ${this.arcLarge}}`;
    }
}

// --- Low-Level Parser (Source Reader) ---

class SvgPathStringSource {
    private readonly _string: string;
    private _previousCommand: SvgPathSegType;
    private _idx: number;
    private readonly _length: number;

    constructor(svgString: string) {
        this._string = svgString;
        this._previousCommand = SvgPathSegType.unknown;
        this._idx = 0;
        this._length = svgString.length;
        this._skipOptionalSvgSpaces();
    }

    public get hasMoreData(): boolean {
        return this._idx < this._length;
    }

    private _isHtmlSpace(character: number): boolean {
        return character <= AsciiConstants.space &&
            (character === AsciiConstants.space ||
                character === AsciiConstants.slashN ||
                character === AsciiConstants.slashT ||
                character === AsciiConstants.slashR ||
                character === AsciiConstants.slashF);
    }

    private _skipOptionalSvgSpaces(): number {
        while (this._idx < this._length) {
            const c = this._string.charCodeAt(this._idx);
            if (!this._isHtmlSpace(c)) {
                return c;
            }
            this._idx++;
        }
        return -1;
    }

    private _skipOptionalSvgSpacesOrDelimiter(delimiter: number = AsciiConstants.comma): void {
        const c = this._skipOptionalSvgSpaces();
        if (c === delimiter) {
            this._idx++;
            this._skipOptionalSvgSpaces();
        }
    }

    private static _isNumberStart(lookahead: number): boolean {
        return (lookahead >= AsciiConstants.number0 && lookahead <= 57 /* number9 */) ||
            lookahead === AsciiConstants.plus ||
            lookahead === AsciiConstants.minus ||
            lookahead === AsciiConstants.period;
    }

    private _maybeImplicitCommand(lookahead: number, nextCommand: SvgPathSegType): SvgPathSegType {
        if (!SvgPathStringSource._isNumberStart(lookahead) || this._previousCommand === SvgPathSegType.close) {
            return nextCommand;
        }
        if (this._previousCommand === SvgPathSegType.moveToAbs) return SvgPathSegType.lineToAbs;
        if (this._previousCommand === SvgPathSegType.moveToRel) return SvgPathSegType.lineToRel;
        return this._previousCommand;
    }

    private _readCodeUnit(): number {
        if (this._idx >= this._length) return -1;
        return this._string.charCodeAt(this._idx++);
    }

    private _parseNumber(): number {
        this._skipOptionalSvgSpaces();
        let sign = 1;
        let c = this._readCodeUnit();
        if (c === AsciiConstants.plus) {
            c = this._readCodeUnit();
        } else if (c === AsciiConstants.minus) {
            sign = -1;
            c = this._readCodeUnit();
        }

        if ((c < AsciiConstants.number0 || c > 57) && c !== AsciiConstants.period) {
            throw new Error('First character of a number must be one of [0-9+-.].');
        }

        let integer = 0.0;
        while (c >= AsciiConstants.number0 && c <= 57) {
            integer = integer * 10 + (c - AsciiConstants.number0);
            c = this._readCodeUnit();
        }

        if (!Number.isFinite(integer)) throw new Error('Numeric overflow');

        let decimal = 0.0;
        if (c === AsciiConstants.period) {
            c = this._readCodeUnit();
            if (c < AsciiConstants.number0 || c > 57) {
                throw new Error('There must be at least one digit following the .');
            }
            let frac = 1.0;
            while (c >= AsciiConstants.number0 && c <= 57) {
                frac *= 0.1;
                decimal += (c - AsciiConstants.number0) * frac;
                c = this._readCodeUnit();
            }
        }

        let number = (integer + decimal) * sign;

        if (this._idx < this._length && (c === AsciiConstants.lowerE || c === AsciiConstants.upperE)) {
            const lookahead = this._string.charCodeAt(this._idx);
            if (lookahead !== AsciiConstants.lowerX && lookahead !== AsciiConstants.lowerM) {
                c = this._readCodeUnit();
                let exponentIsNegative = false;
                if (c === AsciiConstants.plus) c = this._readCodeUnit();
                else if (c === AsciiConstants.minus) {
                    c = this._readCodeUnit();
                    exponentIsNegative = true;
                }
                if (c < AsciiConstants.number0 || c > 57) throw new Error('Missing exponent');
                let exponent = 0.0;
                while (c >= AsciiConstants.number0 && c <= 57) {
                    exponent = exponent * 10.0 + (c - AsciiConstants.number0);
                    c = this._readCodeUnit();
                }
                if (exponentIsNegative) exponent = -exponent;
                if (!(-37 <= exponent && exponent <= 38)) throw new Error(`Invalid exponent ${exponent}`);
                if (exponent !== 0) number *= Math.pow(10.0, exponent);
            }
        }

        if (!Number.isFinite(number)) throw new Error('Numeric overflow');
        if (c !== -1) this._idx--;

        this._skipOptionalSvgSpacesOrDelimiter();
        return number;
    }

    private _parseArcFlag(): boolean {
        if (!this.hasMoreData) throw new Error('Expected more data');
        const flagChar = this._string.charCodeAt(this._idx++);
        this._skipOptionalSvgSpacesOrDelimiter();
        if (flagChar === AsciiConstants.number0) return false;
        if (flagChar === 49 /* number1 */) return true;
        throw new Error('Invalid flag value');
    }

    public *parseSegments(): Generator<PathSegmentData> {
        while (this.hasMoreData) {
            yield this.parseSegment();
        }
    }

    public parseSegment(): PathSegmentData {
        const segment = new PathSegmentData();
        const lookahead = this._string.charCodeAt(this._idx);
        let command = AsciiConstants.mapLetterToSegmentType(lookahead);

        if (this._previousCommand === SvgPathSegType.unknown) {
            if (command !== SvgPathSegType.moveToRel && command !== SvgPathSegType.moveToAbs) {
                throw new Error('Expected to find moveTo command');
            }
            this._idx++;
        } else if (command === SvgPathSegType.unknown) {
            command = this._maybeImplicitCommand(lookahead, command);
            if (command === SvgPathSegType.unknown) {
                throw new Error('Expected a path command');
            }
        } else {
            this._idx++;
        }

        segment.command = this._previousCommand = command;

        switch (segment.command) {
            case SvgPathSegType.cubicToRel:
            case SvgPathSegType.cubicToAbs:
                segment.point1 = new PathOffset(this._parseNumber(), this._parseNumber());
            case SvgPathSegType.smoothCubicToRel:
            case SvgPathSegType.smoothCubicToAbs:
                if (
                    segment.command === SvgPathSegType.smoothCubicToRel ||
                    segment.command === SvgPathSegType.smoothCubicToAbs
                ) {
                    segment.point2 = new PathOffset(this._parseNumber(), this._parseNumber());
                    // fall through to moveTo/lineTo/smoothQuadTo
                }
                // For cubicTo* and smoothCubicTo*, after parsing control points, parse target point
                segment.targetPoint = new PathOffset(this._parseNumber(), this._parseNumber());
                break;
            case SvgPathSegType.moveToRel:
            case SvgPathSegType.moveToAbs:
            case SvgPathSegType.lineToRel:
            case SvgPathSegType.lineToAbs:
            case SvgPathSegType.smoothQuadToRel:
            case SvgPathSegType.smoothQuadToAbs:
                segment.targetPoint = new PathOffset(this._parseNumber(), this._parseNumber());
                break;
            case SvgPathSegType.lineToHorizontalRel:
            case SvgPathSegType.lineToHorizontalAbs:
                segment.targetPoint = new PathOffset(this._parseNumber(), segment.targetPoint.dy);
                break;
            case SvgPathSegType.lineToVerticalRel:
            case SvgPathSegType.lineToVerticalAbs:
                segment.targetPoint = new PathOffset(segment.targetPoint.dx, this._parseNumber());
                break;
            case SvgPathSegType.close:
                this._skipOptionalSvgSpaces();
                break;
            case SvgPathSegType.quadToRel:
            case SvgPathSegType.quadToAbs:
                segment.point1 = new PathOffset(this._parseNumber(), this._parseNumber());
                segment.targetPoint = new PathOffset(this._parseNumber(), this._parseNumber());
                break;
            case SvgPathSegType.arcToRel:
            case SvgPathSegType.arcToAbs:
                segment.point1 = new PathOffset(this._parseNumber(), this._parseNumber()); // rx, ry
                segment.arcAngle = this._parseNumber();
                segment.arcLarge = this._parseArcFlag();
                segment.arcSweep = this._parseArcFlag();
                segment.targetPoint = new PathOffset(this._parseNumber(), this._parseNumber());
                break;
            default:
                throw new Error('Unknown segment command');
        }
        return segment;
    }
}


// --- Path Normalizer ---

function isCubicCommand(command: SvgPathSegType): boolean {
    return command === SvgPathSegType.cubicToAbs || command === SvgPathSegType.cubicToRel ||
        command === SvgPathSegType.smoothCubicToAbs || command === SvgPathSegType.smoothCubicToRel;
}

function isQuadraticCommand(command: SvgPathSegType): boolean {
    return command === SvgPathSegType.quadToAbs || command === SvgPathSegType.quadToRel ||
        command === SvgPathSegType.smoothQuadToAbs || command === SvgPathSegType.smoothQuadToRel;
}

function reflectedPoint(reflectedIn: PathOffset, pointToReflect: PathOffset): PathOffset {
    return new PathOffset(2 * reflectedIn.dx - pointToReflect.dx, 2 * reflectedIn.dy - pointToReflect.dy);
}

function blendPoints(p1: PathOffset, p2: PathOffset): PathOffset {
    const kOneOverThree = 1.0 / 3.0;
    return new PathOffset((p1.dx + 2 * p2.dx) * kOneOverThree, (p1.dy + 2 * p2.dy) * kOneOverThree);
}

class SvgPathNormalizer {
    private _currentPoint: PathOffset = PathOffset.zero;
    private _subPathPoint: PathOffset = PathOffset.zero;
    private _controlPoint: PathOffset = PathOffset.zero;
    private _lastCommand: SvgPathSegType = SvgPathSegType.unknown;

    public emitSegment(segment: PathSegmentData, path: PathProxy): void {
        // Since PathSegmentData and PathOffset are immutable, we create a new one.
        const normSeg = new PathSegmentData();
        Object.assign(normSeg, segment);

        switch (normSeg.command) {
            case SvgPathSegType.quadToRel:
                normSeg.point1 = normSeg.point1.add(this._currentPoint);
                normSeg.targetPoint = normSeg.targetPoint.add(this._currentPoint);
                break;
            case SvgPathSegType.cubicToRel:
                normSeg.point1 = normSeg.point1.add(this._currentPoint);
            // fall through
            case SvgPathSegType.smoothCubicToRel:
                if (normSeg.command === SvgPathSegType.smoothCubicToRel) {
                    normSeg.point2 = normSeg.point2.add(this._currentPoint);
                }
            // fall through
            case SvgPathSegType.moveToRel:
            case SvgPathSegType.lineToRel:
            case SvgPathSegType.lineToHorizontalRel:
            case SvgPathSegType.lineToVerticalRel:
            case SvgPathSegType.smoothQuadToRel:
            case SvgPathSegType.arcToRel:
                normSeg.targetPoint = normSeg.targetPoint.add(this._currentPoint);
                break;
            case SvgPathSegType.lineToHorizontalAbs:
                normSeg.targetPoint = new PathOffset(normSeg.targetPoint.dx, this._currentPoint.dy);
                break;
            case SvgPathSegType.lineToVerticalAbs:
                normSeg.targetPoint = new PathOffset(this._currentPoint.dx, normSeg.targetPoint.dy);
                break;
            case SvgPathSegType.close:
                normSeg.targetPoint = this._subPathPoint;
                break;
            default: break;
        }

        switch (normSeg.command) {
            case SvgPathSegType.moveToRel:
            case SvgPathSegType.moveToAbs:
                this._subPathPoint = normSeg.targetPoint;
                path.moveTo(normSeg.targetPoint.dx, normSeg.targetPoint.dy);
                break;
            case SvgPathSegType.lineToRel:
            case SvgPathSegType.lineToAbs:
            case SvgPathSegType.lineToHorizontalRel:
            case SvgPathSegType.lineToHorizontalAbs:
            case SvgPathSegType.lineToVerticalRel:
            case SvgPathSegType.lineToVerticalAbs:
                path.lineTo(normSeg.targetPoint.dx, normSeg.targetPoint.dy);
                break;
            case SvgPathSegType.close:
                path.close();
                break;
            case SvgPathSegType.smoothCubicToRel:
            case SvgPathSegType.smoothCubicToAbs: {
                normSeg.point1 = !isCubicCommand(this._lastCommand)
                    ? this._currentPoint
                    : reflectedPoint(this._currentPoint, this._controlPoint);
                // fall through to cubicToAbs/cubicToRel logic
                this._controlPoint = normSeg.point2;
                path.cubicTo(normSeg.x1, normSeg.y1, normSeg.x2, normSeg.y2, normSeg.x, normSeg.y);
                break;
            }
            case SvgPathSegType.cubicToRel:
            case SvgPathSegType.cubicToAbs:
                this._controlPoint = normSeg.point2;
                path.cubicTo(normSeg.x1, normSeg.y1, normSeg.x2, normSeg.y2, normSeg.x, normSeg.y);
                break;
            case SvgPathSegType.smoothQuadToRel:
            case SvgPathSegType.smoothQuadToAbs: {
                normSeg.point1 = !isQuadraticCommand(this._lastCommand)
                    ? this._currentPoint
                    : reflectedPoint(this._currentPoint, this._controlPoint);
                // fall through to quadToAbs/quadToRel logic
                this._controlPoint = normSeg.point1;
                const p1 = blendPoints(this._currentPoint, this._controlPoint);
                const p2 = blendPoints(normSeg.targetPoint, this._controlPoint);
                path.cubicTo(p1.dx, p1.dy, p2.dx, p2.dy, normSeg.x, normSeg.y);
                break;
            }
            case SvgPathSegType.quadToRel:
            case SvgPathSegType.quadToAbs:
                this._controlPoint = normSeg.point1;
                {
                    const p1 = blendPoints(this._currentPoint, this._controlPoint);
                    const p2 = blendPoints(normSeg.targetPoint, this._controlPoint);
                    path.cubicTo(p1.dx, p1.dy, p2.dx, p2.dy, normSeg.x, normSeg.y);
                }
                break;
            case SvgPathSegType.arcToRel:
            case SvgPathSegType.arcToAbs:
                if (!this._decomposeArcToCubic(this._currentPoint, normSeg, path)) {
                    path.lineTo(normSeg.x, normSeg.y);
                }
                break;
            default:
                throw new Error('Invalid command type in path');
        }

        this._currentPoint = normSeg.targetPoint;
        if (!isCubicCommand(normSeg.command) && !isQuadraticCommand(normSeg.command)) {
            this._controlPoint = this._currentPoint;
        }
        this._lastCommand = normSeg.command;
    }

    private _mapPoint(transform: mat4, point: PathOffset): PathOffset {
        const vec = vec3.fromValues(point.dx, point.dy, 0);
        vec3.transformMat4(vec, vec, transform);
        return new PathOffset(vec[0], vec[1]);
    }

    private _decomposeArcToCubic(currentPoint: PathOffset, arcSegment: PathSegmentData, path: PathProxy): boolean {
        let rx = Math.abs(arcSegment.r1);
        let ry = Math.abs(arcSegment.r2);
        if (rx === 0 || ry === 0 || arcSegment.targetPoint.equals(currentPoint)) {
            return false;
        }

        const angle = (arcSegment.arcAngle * Math.PI) / 180.0;
        const midPointDistance = currentPoint.subtract(arcSegment.targetPoint).scale(0.5);

        const pointTransform = mat4.create();
        mat4.rotateZ(pointTransform, pointTransform, -angle);
        const transformedMidPoint = this._mapPoint(pointTransform, midPointDistance);

        const squareRx = rx * rx;
        const squareRy = ry * ry;
        const squareX = transformedMidPoint.dx * transformedMidPoint.dx;
        const squareY = transformedMidPoint.dy * transformedMidPoint.dy;

        const radiiScale = squareX / squareRx + squareY / squareRy;
        if (radiiScale > 1.0) {
            rx *= Math.sqrt(radiiScale);
            ry *= Math.sqrt(radiiScale);
        }

        mat4.identity(pointTransform);
        mat4.scale(pointTransform, pointTransform, [1.0 / rx, 1.0 / ry, 1.0]);
        mat4.rotateZ(pointTransform, pointTransform, -angle);

        let point1 = this._mapPoint(pointTransform, currentPoint);
        let point2 = this._mapPoint(pointTransform, arcSegment.targetPoint);
        let delta = point2.subtract(point1);

        const d = delta.dx * delta.dx + delta.dy * delta.dy;
        const scaleFactorSquared = Math.max(1.0 / d - 0.25, 0.0);
        let scaleFactor = Math.sqrt(scaleFactorSquared);

        if (arcSegment.arcSweep === arcSegment.arcLarge) {
            scaleFactor = -scaleFactor;
        }

        delta = delta.scale(scaleFactor);
        const centerPoint = point1.add(point2).scale(0.5).translate(-delta.dy, delta.dx);

        const theta1 = point1.subtract(centerPoint).direction;
        const theta2 = point2.subtract(centerPoint).direction;
        let thetaArc = theta2 - theta1;

        if (thetaArc < 0.0 && arcSegment.arcSweep) {
            thetaArc += 2 * Math.PI;
        } else if (thetaArc > 0.0 && !arcSegment.arcSweep) {
            thetaArc -= 2 * Math.PI;
        }

        mat4.identity(pointTransform);
        mat4.rotateZ(pointTransform, pointTransform, angle);
        mat4.scale(pointTransform, pointTransform, [rx, ry, 1.0]);

        const segments = Math.ceil(Math.abs(thetaArc / (Math.PI / 2.0 + 0.001)));
        for (let i = 0; i < segments; ++i) {
            const startTheta = theta1 + i * thetaArc / segments;
            const endTheta = theta1 + (i + 1) * thetaArc / segments;
            const t = (8.0 / 6.0) * Math.tan(0.25 * (endTheta - startTheta));

            if (!Number.isFinite(t)) return false;

            const sinStartTheta = Math.sin(startTheta);
            const cosStartTheta = Math.cos(startTheta);
            const sinEndTheta = Math.sin(endTheta);
            const cosEndTheta = Math.cos(endTheta);

            point1 = new PathOffset(cosStartTheta - t * sinStartTheta, sinStartTheta + t * cosStartTheta).add(centerPoint);
            const targetPoint = new PathOffset(cosEndTheta, sinEndTheta).add(centerPoint);
            point2 = targetPoint.translate(t * sinEndTheta, -t * cosEndTheta);

            const p1Final = this._mapPoint(pointTransform, point1);
            const p2Final = this._mapPoint(pointTransform, point2);
            const targetFinal = this._mapPoint(pointTransform, targetPoint);

            path.cubicTo(p1Final.dx, p1Final.dy, p2Final.dx, p2Final.dy, targetFinal.dx, targetFinal.dy);
        }
        return true;
    }
}

// --- Main Entry Point ---

/**
 * Parse an SVG path data string, emitting the segment data to a PathProxy.
 * @param svg The SVG path data string.
 * @param path A PathProxy object to receive the drawing commands.
 */
export function writeSvgPathDataToPath(svg: string | null | undefined, path: PathProxy): void {
    if (!svg) {
        return;
    }

    const parser = new SvgPathStringSource(svg);
    const normalizer = new SvgPathNormalizer();
    for (const seg of parser.parseSegments()) {
        normalizer.emitSegment(seg, path);
    }
}