/*
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",

"\x1b[NUMEROm"
FG  BG

30	40	Black
31	41	Red
32	42	Green
33	43	Yellow
34	44	Blue
35	45	Magenta
36	46	Cyan
37	47	White
90	100	Bright Black (Gray)
91	101	Bright Red
92	102	Bright Green
93	103	Bright Yellow
94	104	Bright Blue
95	105	Bright Magenta
96	106	Bright Cyan
97	107	Bright White
*/

const COLORS = {
    Reset: "\x1b[0m",       // Reset coloured text

    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",
}

export class Logger {
    static debug = (text: string): void => this.print("DEBUG", COLORS.FgWhite, text);

    static log = (text: string): void => this.print("LOG", COLORS.FgCyan, text);

    static info = (text: string): void => this.print("INFO", COLORS.FgGreen, text);

    static warn = (text: string): void => this.print("WARN", COLORS.FgYellow, text);

    static error = (text: string): void => this.print("ERROR", COLORS.FgRed, text);

    private static print = (level: string, color: string, text: string): void =>
        console.log(`[${new Date().toLocaleString()}] [${color}${level}${COLORS.Reset}] ${text}`);
}