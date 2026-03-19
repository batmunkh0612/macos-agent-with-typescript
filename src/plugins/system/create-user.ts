import type { SystemArgs } from './types';
import { execPromise, isValidUsername, rootCmd, shQuote } from './utils';

type ExecPromiseResult = Awaited<ReturnType<typeof execPromise>>;
type CreateUserResult = ExecPromiseResult | { error: string };
type RequiredCreds = Omit<SystemArgs, 'username' | 'password'> & {
  username: string;
  password: string;
};
type Validator = (_args: SystemArgs) => string | undefined;

const validators: Validator[] = [
  (_args) => {
    if (_args.username == null) return 'Username and password required';
    if (_args.username === '') return 'Username and password required';
    return undefined;
  },
  (_args) => {
    if (_args.password == null) return 'Username and password required';
    if (_args.password === '') return 'Username and password required';
    return undefined;
  },
  (_args) => {
    if (_args.username == null) return undefined; 
    if (!isValidUsername(_args.username)) return 'Invalid username format';
    return undefined;
  },
];

function getValidationError(args: SystemArgs): string | undefined {
  for (const validate of validators) {
    const err = validate(args);
    if (err) return err;
  }
  return undefined;
}

function getDisplayName(username: string, fullname?: string): string {
  if (typeof fullname === 'string' && fullname.length > 0) {
    return fullname;
  }
  return username;
}

function buildDarwinCreateUserCmd(args: RequiredCreds): string {
  const { username, password, fullname, admin } = args;
  const displayName = shQuote(getDisplayName(username, fullname as string));
  const safePassword = shQuote(password);
  const adminFlag = admin ? ' -admin' : '';
  
  return rootCmd(
    `sysadminctl -addUser ${username} -fullName ${displayName} -password ${safePassword}${adminFlag}`
  );
}

function buildLinuxCreateUserCmd(args: RequiredCreds): string {
  const { username, password } = args;
  const creds = shQuote(`${username}:${password}`);
  return rootCmd(`useradd -m -s /bin/bash ${username} && echo ${creds} | chpasswd`);
}

function buildCreateUserCmd(args: RequiredCreds): string {
  if (process.platform === 'darwin') return buildDarwinCreateUserCmd(args);
  return buildLinuxCreateUserCmd(args);
}

export async function createUser(args: SystemArgs): Promise<CreateUserResult> {
  const err = getValidationError(args);
  if (err) return { error: err };
  const safeArgs = args as RequiredCreds;
  const cmd = buildCreateUserCmd(safeArgs);
  return execPromise(cmd);
}