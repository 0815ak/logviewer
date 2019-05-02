use quicli::prelude::*;
use std::fs::File;
use std::io::BufRead;
use std::io::BufReader;
use structopt::StructOpt;
/// Get first n lines of a file
#[derive(Debug, StructOpt)]
struct Cli {
    // Add a CLI argument `--count`/-n` that defaults to 3, and has this help text:
    /// How many lines to get
    #[structopt(long = "count", short = "n", default_value = "3")]
    count: usize,
    // Add a positional argument that the user has to supply:
    /// The file to read
    file: String,
    source: String,
    // Quick and easy logging setup you get for free with quicli
    #[structopt(flatten)]
    verbosity: Verbosity,
}

fn main() -> CliResult {
    let args = Cli::from_args();

    let f = File::open(&args.file)?;
    let source = &args.source;
    let mut reader = BufReader::new(f);

    let mut line_nr = 1;
    loop {
        let mut line = String::new();
        let len = reader.read_line(&mut line)?;
        if len == 0 {
            break;
        };
        println!("{}{}{}", line.trim_end(), source, line_nr);
        line_nr += 1;
    }

    Ok(())
}
