// Assuming PdfColor, PdfColorHsv, PdfColorCmyk, PdfColorHsl are defined in 'color.ts'
import { PdfColor, PdfColorHsv } from './color';

/**
 * Material design colors.
 * This class provides a collection of static, constant color definitions
 * mirroring Material Design color swatches.
 */
export class PdfColors {
    // Private constructor to prevent instantiation, as it's a utility class.
    private constructor() { }

    // Red
    // Dart's `static const PdfColor red = red500;` implies a static getter or assignment.
    // In TS, this means assigning the PdfColor.fromInt(value) directly.
    public static readonly red50: PdfColor = PdfColor.fromInt(0xffffebee);
    public static readonly red100: PdfColor = PdfColor.fromInt(0xffffcdd2);
    public static readonly red200: PdfColor = PdfColor.fromInt(0xffef9a9a);
    public static readonly red300: PdfColor = PdfColor.fromInt(0xffe57373);
    public static readonly red400: PdfColor = PdfColor.fromInt(0xffef5350);
    public static readonly red500: PdfColor = PdfColor.fromInt(0xfff44336);
    public static readonly red600: PdfColor = PdfColor.fromInt(0xffe53935);
    public static readonly red700: PdfColor = PdfColor.fromInt(0xffd32f2f);
    public static readonly red800: PdfColor = PdfColor.fromInt(0xffc62828);
    public static readonly red900: PdfColor = PdfColor.fromInt(0xffb71c1c);
    public static readonly red: PdfColor = PdfColors.red500;
    public static readonly redAccent100: PdfColor = PdfColor.fromInt(0xffff8a80);
    public static readonly redAccent200: PdfColor = PdfColor.fromInt(0xffff5252);
    public static readonly redAccent400: PdfColor = PdfColor.fromInt(0xffff1744);
    public static readonly redAccent700: PdfColor = PdfColor.fromInt(0xffd50000);
    public static readonly redAccent: PdfColor = PdfColors.redAccent200;

    // Pink
    public static readonly pink50: PdfColor = PdfColor.fromInt(0xfffce4ec);
    public static readonly pink100: PdfColor = PdfColor.fromInt(0xfff8bbd0);
    public static readonly pink200: PdfColor = PdfColor.fromInt(0xfff48fb1);
    public static readonly pink300: PdfColor = PdfColor.fromInt(0xfff06292);
    public static readonly pink400: PdfColor = PdfColor.fromInt(0xffec407a);
    public static readonly pink500: PdfColor = PdfColor.fromInt(0xffe91e63);
    public static readonly pink600: PdfColor = PdfColor.fromInt(0xffd81b60);
    public static readonly pink700: PdfColor = PdfColor.fromInt(0xffc2185b);
    public static readonly pink800: PdfColor = PdfColor.fromInt(0xffad1457);
    public static readonly pink900: PdfColor = PdfColor.fromInt(0xff880e4f);
    public static readonly pink: PdfColor = PdfColors.pink500;
    public static readonly pinkAccent100: PdfColor = PdfColor.fromInt(0xffff80ab);
    public static readonly pinkAccent200: PdfColor = PdfColor.fromInt(0xffff4081);
    public static readonly pinkAccent400: PdfColor = PdfColor.fromInt(0xfff50057);
    public static readonly pinkAccent700: PdfColor = PdfColor.fromInt(0xffc51162);
    public static readonly pinkAccent: PdfColor = PdfColors.pinkAccent200;

    // Purple
    public static readonly purple50: PdfColor = PdfColor.fromInt(0xfff3e5f5);
    public static readonly purple100: PdfColor = PdfColor.fromInt(0xffe1bee7);
    public static readonly purple200: PdfColor = PdfColor.fromInt(0xffce93d8);
    public static readonly purple300: PdfColor = PdfColor.fromInt(0xffba68c8);
    public static readonly purple400: PdfColor = PdfColor.fromInt(0xffab47bc);
    public static readonly purple500: PdfColor = PdfColor.fromInt(0xff9c27b0);
    public static readonly purple600: PdfColor = PdfColor.fromInt(0xff8e24aa);
    public static readonly purple700: PdfColor = PdfColor.fromInt(0xff7b1fa2);
    public static readonly purple800: PdfColor = PdfColor.fromInt(0xff6a1b9a);
    public static readonly purple900: PdfColor = PdfColor.fromInt(0xff4a148c);
    public static readonly purple: PdfColor = PdfColors.purple500;
    public static readonly purpleAccent100: PdfColor = PdfColor.fromInt(0xffea80fc);
    public static readonly purpleAccent200: PdfColor = PdfColor.fromInt(0xffe040fb);
    public static readonly purpleAccent400: PdfColor = PdfColor.fromInt(0xffd500f9);
    public static readonly purpleAccent700: PdfColor = PdfColor.fromInt(0xffaa00ff);
    public static readonly purpleAccent: PdfColor = PdfColors.purpleAccent200;

    // Deep Purple
    public static readonly deepPurple50: PdfColor = PdfColor.fromInt(0xffede7f6);
    public static readonly deepPurple100: PdfColor = PdfColor.fromInt(0xffd1c4e9);
    public static readonly deepPurple200: PdfColor = PdfColor.fromInt(0xffb39ddb);
    public static readonly deepPurple300: PdfColor = PdfColor.fromInt(0xff9575cd);
    public static readonly deepPurple400: PdfColor = PdfColor.fromInt(0xff7e57c2);
    public static readonly deepPurple500: PdfColor = PdfColor.fromInt(0xff673ab7);
    public static readonly deepPurple600: PdfColor = PdfColor.fromInt(0xff5e35b1);
    public static readonly deepPurple700: PdfColor = PdfColor.fromInt(0xff512da8);
    public static readonly deepPurple800: PdfColor = PdfColor.fromInt(0xff4527a0);
    public static readonly deepPurple900: PdfColor = PdfColor.fromInt(0xff311b92);
    public static readonly deepPurple: PdfColor = PdfColors.deepPurple500;
    public static readonly deepPurpleAccent100: PdfColor = PdfColor.fromInt(0xffb388ff);
    public static readonly deepPurpleAccent200: PdfColor = PdfColor.fromInt(0xff7c4dff);
    public static readonly deepPurpleAccent400: PdfColor = PdfColor.fromInt(0xff651fff);
    public static readonly deepPurpleAccent700: PdfColor = PdfColor.fromInt(0xff6200ea);
    public static readonly deepPurpleAccent: PdfColor = PdfColors.deepPurpleAccent200;

    // Indigo
    public static readonly indigo50: PdfColor = PdfColor.fromInt(0xffe8eaf6);
    public static readonly indigo100: PdfColor = PdfColor.fromInt(0xffc5cae9);
    public static readonly indigo200: PdfColor = PdfColor.fromInt(0xff9fa8da);
    public static readonly indigo300: PdfColor = PdfColor.fromInt(0xff7986cb);
    public static readonly indigo400: PdfColor = PdfColor.fromInt(0xff5c6bc0);
    public static readonly indigo500: PdfColor = PdfColor.fromInt(0xff3f51b5);
    public static readonly indigo600: PdfColor = PdfColor.fromInt(0xff3949ab);
    public static readonly indigo700: PdfColor = PdfColor.fromInt(0xff303f9f);
    public static readonly indigo800: PdfColor = PdfColor.fromInt(0xff283593);
    public static readonly indigo900: PdfColor = PdfColor.fromInt(0xff1a237e);
    public static readonly indigo: PdfColor = PdfColors.indigo500;
    public static readonly indigoAccent100: PdfColor = PdfColor.fromInt(0xff8c9eff);
    public static readonly indigoAccent200: PdfColor = PdfColor.fromInt(0xff536dfe);
    public static readonly indigoAccent400: PdfColor = PdfColor.fromInt(0xff3d5afe);
    public static readonly indigoAccent700: PdfColor = PdfColor.fromInt(0xff304ffe);
    public static readonly indigoAccent: PdfColor = PdfColors.indigoAccent200;

    // Blue
    public static readonly blue50: PdfColor = PdfColor.fromInt(0xffe3f2fd);
    public static readonly blue100: PdfColor = PdfColor.fromInt(0xffbbdefb);
    public static readonly blue200: PdfColor = PdfColor.fromInt(0xff90caf9);
    public static readonly blue300: PdfColor = PdfColor.fromInt(0xff64b5f6);
    public static readonly blue400: PdfColor = PdfColor.fromInt(0xff42a5f5);
    public static readonly blue500: PdfColor = PdfColor.fromInt(0xff2196f3);
    public static readonly blue600: PdfColor = PdfColor.fromInt(0xff1e88e5);
    public static readonly blue700: PdfColor = PdfColor.fromInt(0xff1976d2);
    public static readonly blue800: PdfColor = PdfColor.fromInt(0xff1565c0);
    public static readonly blue900: PdfColor = PdfColor.fromInt(0xff0d47a1);
    public static readonly blue: PdfColor = PdfColors.blue500;
    public static readonly blueAccent100: PdfColor = PdfColor.fromInt(0xff82b1ff);
    public static readonly blueAccent200: PdfColor = PdfColor.fromInt(0xff448aff);
    public static readonly blueAccent400: PdfColor = PdfColor.fromInt(0xff2979ff);
    public static readonly blueAccent700: PdfColor = PdfColor.fromInt(0xff2962ff);
    public static readonly blueAccent: PdfColor = PdfColors.blueAccent200;

    // Light Blue
    public static readonly lightBlue50: PdfColor = PdfColor.fromInt(0xffe1f5fe);
    public static readonly lightBlue100: PdfColor = PdfColor.fromInt(0xffb3e5fc);
    public static readonly lightBlue200: PdfColor = PdfColor.fromInt(0xff81d4fa);
    public static readonly lightBlue300: PdfColor = PdfColor.fromInt(0xff4fc3f7);
    public static readonly lightBlue400: PdfColor = PdfColor.fromInt(0xff29b6f6);
    public static readonly lightBlue500: PdfColor = PdfColor.fromInt(0xff03a9f4);
    public static readonly lightBlue600: PdfColor = PdfColor.fromInt(0xff039be5);
    public static readonly lightBlue700: PdfColor = PdfColor.fromInt(0xff0288d1);
    public static readonly lightBlue800: PdfColor = PdfColor.fromInt(0xff0277bd);
    public static readonly lightBlue900: PdfColor = PdfColor.fromInt(0xff01579b);
    public static readonly lightBlue: PdfColor = PdfColors.lightBlue500;
    public static readonly lightBlueAccent100: PdfColor = PdfColor.fromInt(0xff80d8ff);
    public static readonly lightBlueAccent200: PdfColor = PdfColor.fromInt(0xff40c4ff);
    public static readonly lightBlueAccent400: PdfColor = PdfColor.fromInt(0xff00b0ff);
    public static readonly lightBlueAccent700: PdfColor = PdfColor.fromInt(0xff0091ea);
    public static readonly lightBlueAccent: PdfColor = PdfColors.lightBlueAccent200;

    // Cyan
    public static readonly cyan50: PdfColor = PdfColor.fromInt(0xffe0f7fa);
    public static readonly cyan100: PdfColor = PdfColor.fromInt(0xffb2ebf2);
    public static readonly cyan200: PdfColor = PdfColor.fromInt(0xff80deea);
    public static readonly cyan300: PdfColor = PdfColor.fromInt(0xff4dd0e1);
    public static readonly cyan400: PdfColor = PdfColor.fromInt(0xff26c6da);
    public static readonly cyan500: PdfColor = PdfColor.fromInt(0xff00bcd4);
    public static readonly cyan600: PdfColor = PdfColor.fromInt(0xff00acc1);
    public static readonly cyan700: PdfColor = PdfColor.fromInt(0xff0097a7);
    public static readonly cyan800: PdfColor = PdfColor.fromInt(0xff00838f);
    public static readonly cyan900: PdfColor = PdfColor.fromInt(0xff006064);
    public static readonly cyan: PdfColor = PdfColors.cyan500;
    public static readonly cyanAccent100: PdfColor = PdfColor.fromInt(0xff84ffff);
    public static readonly cyanAccent200: PdfColor = PdfColor.fromInt(0xff18ffff);
    public static readonly cyanAccent400: PdfColor = PdfColor.fromInt(0xff00e5ff);
    public static readonly cyanAccent700: PdfColor = PdfColor.fromInt(0xff00b8d4);
    public static readonly cyanAccent: PdfColor = PdfColors.cyanAccent200;

    // Teal
    public static readonly teal50: PdfColor = PdfColor.fromInt(0xffe0f2f1);
    public static readonly teal100: PdfColor = PdfColor.fromInt(0xffb2dfdb);
    public static readonly teal200: PdfColor = PdfColor.fromInt(0xff80cbc4);
    public static readonly teal300: PdfColor = PdfColor.fromInt(0xff4db6ac);
    public static readonly teal400: PdfColor = PdfColor.fromInt(0xff26a69a);
    public static readonly teal500: PdfColor = PdfColor.fromInt(0xff009688);
    public static readonly teal600: PdfColor = PdfColor.fromInt(0xff00897b);
    public static readonly teal700: PdfColor = PdfColor.fromInt(0xff00796b);
    public static readonly teal800: PdfColor = PdfColor.fromInt(0xff00695c);
    public static readonly teal900: PdfColor = PdfColor.fromInt(0xff004d40);
    public static readonly teal: PdfColor = PdfColors.teal500;
    public static readonly tealAccent100: PdfColor = PdfColor.fromInt(0xffa7ffeb);
    public static readonly tealAccent200: PdfColor = PdfColor.fromInt(0xff64ffda);
    public static readonly tealAccent400: PdfColor = PdfColor.fromInt(0xff1de9b6);
    public static readonly tealAccent700: PdfColor = PdfColor.fromInt(0xff00bfa5);
    public static readonly tealAccent: PdfColor = PdfColors.tealAccent200;

    // Green
    public static readonly green50: PdfColor = PdfColor.fromInt(0xffe8f5e9);
    public static readonly green100: PdfColor = PdfColor.fromInt(0xffc8e6c9);
    public static readonly green200: PdfColor = PdfColor.fromInt(0xffa5d6a7);
    public static readonly green300: PdfColor = PdfColor.fromInt(0xff81c784);
    public static readonly green400: PdfColor = PdfColor.fromInt(0xff66bb6a);
    public static readonly green500: PdfColor = PdfColor.fromInt(0xff4caf50);
    public static readonly green600: PdfColor = PdfColor.fromInt(0xff43a047);
    public static readonly green700: PdfColor = PdfColor.fromInt(0xff388e3c);
    public static readonly green800: PdfColor = PdfColor.fromInt(0xff2e7d32);
    public static readonly green900: PdfColor = PdfColor.fromInt(0xff1b5e20);
    public static readonly green: PdfColor = PdfColors.green500;
    public static readonly greenAccent100: PdfColor = PdfColor.fromInt(0xffb9f6ca);
    public static readonly greenAccent200: PdfColor = PdfColor.fromInt(0xff69f0ae);
    public static readonly greenAccent400: PdfColor = PdfColor.fromInt(0xff00e676);
    public static readonly greenAccent700: PdfColor = PdfColor.fromInt(0xff00c853);
    public static readonly greenAccent: PdfColor = PdfColors.greenAccent200;

    // Light Green
    public static readonly lightGreen50: PdfColor = PdfColor.fromInt(0xfff1f8e9);
    public static readonly lightGreen100: PdfColor = PdfColor.fromInt(0xffdcedc8);
    public static readonly lightGreen200: PdfColor = PdfColor.fromInt(0xffc5e1a5);
    public static readonly lightGreen300: PdfColor = PdfColor.fromInt(0xffaed581);
    public static readonly lightGreen400: PdfColor = PdfColor.fromInt(0xff9ccc65);
    public static readonly lightGreen500: PdfColor = PdfColor.fromInt(0xff8bc34a);
    public static readonly lightGreen600: PdfColor = PdfColor.fromInt(0xff7cb342);
    public static readonly lightGreen700: PdfColor = PdfColor.fromInt(0xff689f38);
    public static readonly lightGreen800: PdfColor = PdfColor.fromInt(0xff558b2f);
    public static readonly lightGreen900: PdfColor = PdfColor.fromInt(0xff33691e);
    public static readonly lightGreen: PdfColor = PdfColors.lightGreen500;
    public static readonly lightGreenAccent100: PdfColor = PdfColor.fromInt(0xffccff90);
    public static readonly lightGreenAccent200: PdfColor = PdfColor.fromInt(0xffb2ff59);
    public static readonly lightGreenAccent400: PdfColor = PdfColor.fromInt(0xff76ff03);
    public static readonly lightGreenAccent700: PdfColor = PdfColor.fromInt(0xff64dd17);
    public static readonly lightGreenAccent: PdfColor = PdfColors.lightGreenAccent200;

    // Lime
    public static readonly lime50: PdfColor = PdfColor.fromInt(0xfff9fbe7);
    public static readonly lime100: PdfColor = PdfColor.fromInt(0xfff0f4c3);
    public static readonly lime200: PdfColor = PdfColor.fromInt(0xffe6ee9c);
    public static readonly lime300: PdfColor = PdfColor.fromInt(0xffdce775);
    public static readonly lime400: PdfColor = PdfColor.fromInt(0xffd4e157);
    public static readonly lime500: PdfColor = PdfColor.fromInt(0xffcddc39);
    public static readonly lime600: PdfColor = PdfColor.fromInt(0xffc0ca33);
    public static readonly lime700: PdfColor = PdfColor.fromInt(0xffafb42b);
    public static readonly lime800: PdfColor = PdfColor.fromInt(0xff9e9d24);
    public static readonly lime900: PdfColor = PdfColor.fromInt(0xff827717);
    public static readonly lime: PdfColor = PdfColors.lime500;
    public static readonly limeAccent100: PdfColor = PdfColor.fromInt(0xfff4ff81);
    public static readonly limeAccent200: PdfColor = PdfColor.fromInt(0xffeeff41);
    public static readonly limeAccent400: PdfColor = PdfColor.fromInt(0xffc6ff00);
    public static readonly limeAccent700: PdfColor = PdfColor.fromInt(0xffaeea00);
    public static readonly limeAccent: PdfColor = PdfColors.limeAccent200;

    // Yellow
    public static readonly yellow50: PdfColor = PdfColor.fromInt(0xfffffde7);
    public static readonly yellow100: PdfColor = PdfColor.fromInt(0xfffff9c4);
    public static readonly yellow200: PdfColor = PdfColor.fromInt(0xfffff59d);
    public static readonly yellow300: PdfColor = PdfColor.fromInt(0xfffff176);
    public static readonly yellow400: PdfColor = PdfColor.fromInt(0xffffee58);
    public static readonly yellow500: PdfColor = PdfColor.fromInt(0xffffeb3b);
    public static readonly yellow600: PdfColor = PdfColor.fromInt(0xfffdd835);
    public static readonly yellow700: PdfColor = PdfColor.fromInt(0xfffbc02d);
    public static readonly yellow800: PdfColor = PdfColor.fromInt(0xfff9a825);
    public static readonly yellow900: PdfColor = PdfColor.fromInt(0xfff57f17);
    public static readonly yellow: PdfColor = PdfColors.yellow500;
    public static readonly yellowAccent100: PdfColor = PdfColor.fromInt(0xffffff8d);
    public static readonly yellowAccent200: PdfColor = PdfColor.fromInt(0xffffff00);
    public static readonly yellowAccent400: PdfColor = PdfColor.fromInt(0xffffea00);
    public static readonly yellowAccent700: PdfColor = PdfColor.fromInt(0xffffd600);
    public static readonly yellowAccent: PdfColor = PdfColors.yellowAccent200;

    // Amber
    public static readonly amber50: PdfColor = PdfColor.fromInt(0xfffff8e1);
    public static readonly amber100: PdfColor = PdfColor.fromInt(0xffffecb3);
    public static readonly amber200: PdfColor = PdfColor.fromInt(0xffffe082);
    public static readonly amber300: PdfColor = PdfColor.fromInt(0xffffd54f);
    public static readonly amber400: PdfColor = PdfColor.fromInt(0xffffca28);
    public static readonly amber500: PdfColor = PdfColor.fromInt(0xffffc107);
    public static readonly amber600: PdfColor = PdfColor.fromInt(0xffffb300);
    public static readonly amber700: PdfColor = PdfColor.fromInt(0xffffa000);
    public static readonly amber800: PdfColor = PdfColor.fromInt(0xffff8f00);
    public static readonly amber900: PdfColor = PdfColor.fromInt(0xffff6f00);
    public static readonly amber: PdfColor = PdfColors.amber500;
    public static readonly amberAccent100: PdfColor = PdfColor.fromInt(0xffffe57f);
    public static readonly amberAccent200: PdfColor = PdfColor.fromInt(0xffffd740);
    public static readonly amberAccent400: PdfColor = PdfColor.fromInt(0xffffc400);
    public static readonly amberAccent700: PdfColor = PdfColor.fromInt(0xffffab00);
    public static readonly amberAccent: PdfColor = PdfColors.amberAccent200;

    // Orange
    public static readonly orange50: PdfColor = PdfColor.fromInt(0xfffff3e0);
    public static readonly orange100: PdfColor = PdfColor.fromInt(0xffffe0b2);
    public static readonly orange200: PdfColor = PdfColor.fromInt(0xffffcc80);
    public static readonly orange300: PdfColor = PdfColor.fromInt(0xffffb74d);
    public static readonly orange400: PdfColor = PdfColor.fromInt(0xffffa726);
    public static readonly orange500: PdfColor = PdfColor.fromInt(0xffff9800);
    public static readonly orange600: PdfColor = PdfColor.fromInt(0xfffb8c00);
    public static readonly orange700: PdfColor = PdfColor.fromInt(0xfff57c00);
    public static readonly orange800: PdfColor = PdfColor.fromInt(0xffef6c00);
    public static readonly orange900: PdfColor = PdfColor.fromInt(0xffe65100);
    public static readonly orange: PdfColor = PdfColors.orange500;
    public static readonly orangeAccent100: PdfColor = PdfColor.fromInt(0xffffd180);
    public static readonly orangeAccent200: PdfColor = PdfColor.fromInt(0xffffab40);
    public static readonly orangeAccent400: PdfColor = PdfColor.fromInt(0xffff9100);
    public static readonly orangeAccent700: PdfColor = PdfColor.fromInt(0xffff6d00);
    public static readonly orangeAccent: PdfColor = PdfColors.orangeAccent200;

    // Deep Orange
    public static readonly deepOrange50: PdfColor = PdfColor.fromInt(0xfffbe9e7);
    public static readonly deepOrange100: PdfColor = PdfColor.fromInt(0xffffccbc);
    public static readonly deepOrange200: PdfColor = PdfColor.fromInt(0xffffab91);
    public static readonly deepOrange300: PdfColor = PdfColor.fromInt(0xffff8a65);
    public static readonly deepOrange400: PdfColor = PdfColor.fromInt(0xffff7043);
    public static readonly deepOrange500: PdfColor = PdfColor.fromInt(0xffff5722);
    public static readonly deepOrange600: PdfColor = PdfColor.fromInt(0xfff4511e);
    public static readonly deepOrange700: PdfColor = PdfColor.fromInt(0xffe64a19);
    public static readonly deepOrange800: PdfColor = PdfColor.fromInt(0xffd84315);
    public static readonly deepOrange900: PdfColor = PdfColor.fromInt(0xffbf360c);
    public static readonly deepOrange: PdfColor = PdfColors.deepOrange500;
    public static readonly deepOrangeAccent100: PdfColor = PdfColor.fromInt(0xffff9e80);
    public static readonly deepOrangeAccent200: PdfColor = PdfColor.fromInt(0xffff6e40);
    public static readonly deepOrangeAccent400: PdfColor = PdfColor.fromInt(0xffff3d00);
    public static readonly deepOrangeAccent700: PdfColor = PdfColor.fromInt(0xffdd2c00);
    public static readonly deepOrangeAccent: PdfColor = PdfColors.deepOrangeAccent200;


    // Brown
    public static readonly brown50: PdfColor = PdfColor.fromInt(0xffefebe9);
    public static readonly brown100: PdfColor = PdfColor.fromInt(0xffd7ccc8);
    public static readonly brown200: PdfColor = PdfColor.fromInt(0xffbcaaa4);
    public static readonly brown300: PdfColor = PdfColor.fromInt(0xffa1887f);
    public static readonly brown400: PdfColor = PdfColor.fromInt(0xff8d6e63);
    public static readonly brown500: PdfColor = PdfColor.fromInt(0xff795548);
    public static readonly brown600: PdfColor = PdfColor.fromInt(0xff6d4c41);
    public static readonly brown700: PdfColor = PdfColor.fromInt(0xff5d4037);
    public static readonly brown800: PdfColor = PdfColor.fromInt(0xff4e342e);
    public static readonly brown900: PdfColor = PdfColor.fromInt(0xff3e2723);
    public static readonly brown: PdfColor = PdfColors.brown500;

    // Grey
    public static readonly grey50: PdfColor = PdfColor.fromInt(0xfffafafa);
    public static readonly grey100: PdfColor = PdfColor.fromInt(0xfff5f5f5);
    public static readonly grey200: PdfColor = PdfColor.fromInt(0xffeeeeee);
    public static readonly grey300: PdfColor = PdfColor.fromInt(0xffe0e0e0);
    public static readonly grey400: PdfColor = PdfColor.fromInt(0xffbdbdbd);
    public static readonly grey500: PdfColor = PdfColor.fromInt(0xff9e9e9e);
    public static readonly grey600: PdfColor = PdfColor.fromInt(0xff757575);
    public static readonly grey700: PdfColor = PdfColor.fromInt(0xff616161);
    public static readonly grey800: PdfColor = PdfColor.fromInt(0xff424242);
    public static readonly grey900: PdfColor = PdfColor.fromInt(0xff212121);
    public static readonly grey: PdfColor = PdfColors.grey500;

    // Blue Grey
    public static readonly blueGrey50: PdfColor = PdfColor.fromInt(0xffeceff1);
    public static readonly blueGrey100: PdfColor = PdfColor.fromInt(0xffcfd8dc);
    public static readonly blueGrey200: PdfColor = PdfColor.fromInt(0xffb0bec5);
    public static readonly blueGrey300: PdfColor = PdfColor.fromInt(0xff90a4ae);
    public static readonly blueGrey400: PdfColor = PdfColor.fromInt(0xff78909c);
    public static readonly blueGrey500: PdfColor = PdfColor.fromInt(0xff607d8b);
    public static readonly blueGrey600: PdfColor = PdfColor.fromInt(0xff546e7a);
    public static readonly blueGrey700: PdfColor = PdfColor.fromInt(0xff455a64);
    public static readonly blueGrey800: PdfColor = PdfColor.fromInt(0xff37474f);
    public static readonly blueGrey900: PdfColor = PdfColor.fromInt(0xff263238);
    public static readonly blueGrey: PdfColor = PdfColors.blueGrey500;

    // White / Black
    public static readonly white: PdfColor = PdfColor.fromInt(0xffffffff);
    public static readonly black: PdfColor = PdfColor.fromInt(0xff000000);

    /**
     * The material design primary color swatches, excluding grey.
     */
    public static readonly primaries: PdfColor[] = [
        PdfColors.red,
        PdfColors.pink,
        PdfColors.purple,
        PdfColors.deepPurple,
        PdfColors.indigo,
        PdfColors.blue,
        PdfColors.lightBlue,
        PdfColors.cyan,
        PdfColors.teal,
        PdfColors.green,
        PdfColors.lightGreen,
        PdfColors.lime,
        PdfColors.yellow,
        PdfColors.amber,
        PdfColors.orange,
        PdfColors.deepOrange,
        PdfColors.brown,
        PdfColors.grey,
        PdfColors.blueGrey,
    ];

    /**
     * The material design accent color swatches.
     */
    public static readonly accents: PdfColor[] = [
        PdfColors.redAccent,
        PdfColors.pinkAccent,
        PdfColors.purpleAccent,
        PdfColors.deepPurpleAccent,
        PdfColors.indigoAccent,
        PdfColors.blueAccent,
        PdfColors.lightBlueAccent,
        PdfColors.cyanAccent,
        PdfColors.tealAccent,
        PdfColors.greenAccent,
        PdfColors.lightGreenAccent,
        PdfColors.limeAccent,
        PdfColors.yellowAccent,
        PdfColors.amberAccent,
        PdfColors.orangeAccent,
        PdfColors.deepOrangeAccent,
    ];

    /**
     * Get a pseudo-random color based on an index.
     * This is likely for generating distinct colors for various elements.
     * @param index The index to base the color generation on.
     * @returns A PdfColor instance.
     */
    public static getColor(index: number): PdfColor {
        const hue = index * 137.508; // Golden angle approximation
        const colorHsv: PdfColorHsv = PdfColorHsv.fromHsv(hue % 360, 1, 1); // Full saturation and value

        // Dart's `(index / 3) % 2 == 0` means even-numbered thirds of the index.
        // In TS, integer division is `Math.floor(index / 3)`.
        if (Math.floor(index / 3) % 2 === 0) {
            // Convert HSV back to RGB, then use fromRYB which converts RGB to RYB and then back to RGB
            // This is a re-conversion that applies a "RYB-like" aesthetic shift.
            return PdfColor.fromRYB(colorHsv.red, colorHsv.green, colorHsv.blue);
        }
        // Otherwise, return the original HSV converted to RGB
        return new PdfColor(colorHsv.red, colorHsv.green, colorHsv.blue, colorHsv.alpha);
    }
}