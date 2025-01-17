export interface IResults {
    regs: { [regIndex: number]: number[] }; // Indexes with matchs, like { 1: [2,3,4] } where 1 - index of reg; [2,3,4] - numbers of rows with match
    matches: number[];                      // All numbers of rows with match
    found: number;                          // Total count of matches
    str: string;                            // Rows with matches
    rows: number;                           // Count of rows with match
}

export interface IMatch {
    text: string;
    index: number;
}

export interface IRegDescription {
    reg: RegExp;
    groups: number;
}

const NUMBER_MARKER = '\u0002';

export class Fragment {

    private _fragment: string = '';
    private _lengthMax: number = 0;

    constructor(lengthMax: number, str: string = '') {
        this._lengthMax = lengthMax;
        this._fragment = str;
        /*
        Do not need it any more: indexes are already there
        this._fragment = this.convert(str);
        */
    }

    public isLocked(): boolean {
        return this._fragment.length >= this._lengthMax;
    }

    public append(str: string): void {
        if (typeof str !== 'string' || str === '') {
            throw new Error(`Can be added only string, but gotten type: ${typeof str}`);
        }
        this._fragment += str;
    }

    public find(regExp: RegExp | RegExp[]): IResults | Error {
        const searchRegExp: IRegDescription | Error = this._getRegExp(regExp);
        if (searchRegExp instanceof Error) {
            return searchRegExp;
        }
        const results: IResults = {
            found: 0,
            regs: {},
            matches: [],
            str: '',
            rows: 0,
        };
        this._fragment.replace(searchRegExp.reg, (...args: any[]) => {
            /*
            Arguments looks like:
            ( match, group1, group2,... groupN, offset, string )
            - We should ignore groupN because it's number of line
            - We should ignore group1, because this is common group in regexp
            That's why we started from index = 2 to detect regexp, which has a match
            args.slice(2, args.length - 3)
             */
            if (args.length < 6) {
                return '';
            }
            // Get whole row
            const subscring: string = args[0];
            // Get list of regs with match
            const regs: Array<string | undefined> = args.slice(2, args.length - 3);
            // Get row number
            const row: number = parseInt(args[args.length - 3], 10);
            // Confirm: row number is valid
            if (row < 0 || isNaN(row) || !isFinite(row)) {
                return '';
            }
            // Find index of reg, which has match
            const match: IMatch = this._getMatch(regs);
            if (match.index === -1) {
                return '';
            }
            // Store results
            if (results.regs[match.index] === undefined) {
                results.regs[match.index] = [];
            }
            results.regs[match.index].push(row);
            results.matches.push(row);
            results.found += 1;
            results.str += `${subscring}\n`;
            results.rows += 1;
            return '';
        });
        return results;
    }

    public getLength() {
        return this._fragment.length;
    }

    private _getMatch(array: Array<string | undefined>): IMatch {
        const result: IMatch = {
            text: '',
            index: -1,
        };
        array.forEach((item: string | undefined, i: number) => {
            if (item !== undefined) {
                result.index = i;
                result.text = item;
            }
        });
        return result;
    }

    private _getRegExp(regExp: RegExp | RegExp[]): IRegDescription | Error {
        try {
            if (regExp instanceof Array) {
                const regs: string[] = [];
                let flags: string = '';
                regExp.forEach((reg: RegExp, index: number) => {
                    regs.push(`(${reg.source})`);
                    for (let i = reg.flags.length - 1; i >= 0; i -= 1) {
                        if (flags.indexOf(reg.flags[i]) === -1) {
                            flags += reg.flags[i];
                        }
                    }
                });
                return {
                    reg: new RegExp(`^.*(${regs.join('|')}).*${NUMBER_MARKER}(\\d*)${NUMBER_MARKER}$`, flags),
                    groups: regs.length,
                };
            } else {
                return {
                    reg: new RegExp(`^.*((${regExp.source})).*${NUMBER_MARKER}(\\d*)${NUMBER_MARKER}$`, regExp.flags),
                    groups: 1,
                };
            }
        } catch (error) {
            return error;
        }
    }

}
