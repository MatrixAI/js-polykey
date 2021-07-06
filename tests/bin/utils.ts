import path from 'path';
import { exec, ExecException } from 'child_process';
import main from '../../src/bin/polykey';
import * as mockedProcess from 'jest-mock-process';

type CliRes = {
  code: number;
  error: ExecException | null;
  stdout: string;
  stderr: string;
};

/**
 * Creates a new process and executes './src/bin/polykey' with the args provided
 * Gives stdout, stderr and exitcode
 * @param args List of args
 * @param cwd current working directory, usually '.'
 * @returns { code, error, stdout, stderr }
 */
function cli(args: Array<string>, cwd: string): Promise<CliRes> {
  return new Promise<CliRes>((resolve) => {
    exec(
      `ts-node -r tsconfig-paths/register ${path.resolve(
        './src/bin/polykey',
      )} ${args.join(' ')}`,
      { cwd },
      (error, stdout, stderr) => {
        resolve({
          code: error && error.code ? error.code : 0,
          error,
          stdout,
          stderr,
        });
      },
    );
  });
}

async function pk(args: Array<string>): Promise<any> {
  return main(['', '', ...args]);
}

type PkResult = {
  code: number;
  stdout: string;
  stderr: string;
  consoleLog: string;
};

async function pkWithStdio(args: Array<string>): Promise<PkResult> {
  const mockedStdout = mockedProcess.mockProcessStdout();
  const mockedStderr = mockedProcess.mockProcessStderr();
  const mockedConsoleLog = mockedProcess.mockConsoleLog();

  //Running the command.
  const code = await pk(args);

  const stdoutLog = mockedStdout.mock.calls;
  const stderrLog = mockedStderr.mock.calls;
  const consoleLog = mockedConsoleLog.mock.calls;
  mockedStdout.mockRestore();
  mockedStderr.mockRestore();
  mockedConsoleLog.mockRestore();
  return {
    code: code,
    stdout: stdoutLog.flat().join(),
    stderr: stderrLog.flat().join(),
    consoleLog: consoleLog.flat().join(),
  };
}

export { cli, pk, pkWithStdio, PkResult };
