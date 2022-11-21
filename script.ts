const MATCHING_GROUP_REGEXP = /\((?!\?)/g;
function convertPathToRegex(path: string, keys: any[]) {
  keys = keys || [];
  let extraOffset = 0;
  const keysOffset = keys.length;
  let i = 0;
  let name = 0;
  let m;
a
  path = ('^' + path + (path[path.length - 1] === '/' ? '?' : '/?'))
    .replace(/\/\(/g, '/(?:')
    .replace(/([\/\.])/g, '\\$1')
    .replace(/(\\\/)?(\\\.)?:(\w+)(\(.*?\))?(\*)?(\?)?/g, function (match, slash, format, key, capture, star, optional, offset) {
      slash = slash || '';
      format = format || '';
      capture = capture || '([^\\/' + format + ']+?)';
      optional = optional || '';

      keys.push({
        name: key,
        optional: !!optional,
        offset: offset + extraOffset
      });

      const result = ''
        + (optional ? '' : slash)
        + '(?:'
        + format + (optional ? slash : '') + capture
        + (star ? '((?:[\\/' + format + '].+?)?)' : '')
        + ')'
        + optional;

      extraOffset += result.length - match.length;

      return result;
    })
    .replace(/\*/g, function (star, index) {
      let len = keys.length;

      while (len-- > keysOffset && keys[len].offset > index) {
        keys[len].offset += 3; // Replacement length minus asterisk length.
      }

      return '(.*)';
    });

  while (m = MATCHING_GROUP_REGEXP.exec(path)) {
    let escapeCount = 0;
    let index = m.index;

    while (path.charAt(--index) === '\\') {
      escapeCount++;
    }

    if (escapeCount % 2 === 1) {
      continue;
    }

    if (keysOffset + i === keys.length || keys[keysOffset + i].offset > m.index) {
      keys.splice(keysOffset + i, 0, {
        name: name++,
        optional: false,
        offset: m.index
      });
    }

    i++;
  }

  path += '$';

  return new RegExp(path, 'i');
}

class UrlUtils {
  private _regexExp;
  private readonly _regexStr;
  private _keys: any[];
  private _params: any = {};
  private path: any;
  constructor(path: string) {
    this._regexExp = convertPathToRegex(path, this._keys = []);
    this._regexStr = this._regexExp.toString();
  }

  public get keys(): any[] {
    return this._keys;
  }

  public set keys(value: any[]) {
    this._keys = value;
  }

  public get params(): any {
    return this._params;
  }

  public get regexStr() {
    return this._regexStr;
  }

  public set regexExp(value) {
    this._regexExp = value;
  }

  match(path) {
    let match;

    if (path != null) {
      // match the path
      match = this._regexExp.exec(path)
    }

    if (!match) {
      this._params = undefined;
      this.path = undefined;
      return false;
    }
    this._params = {};
    this.path = match[0]

    const keys = this._keys;
    const params = this._params;

    for (let i = 1; i < match.length; i++) {
      const key = keys[i - 1];
      const prop = key.name;
      const val = this.decodeParam(match[i]);

      if (val !== undefined || this._params[prop] === undefined) {
        params[prop] = val;
      }
    }

    return true;
  };

  decodeParam(val) {
    if (typeof val !== 'string' || val.length === 0) {
      return val;
    }

    return decodeURIComponent(val);
  }
}

const addLeadingSlash = (path?: string): string =>
  path && typeof path === 'string'
    ? path.charAt(0) !== '/'
      ? '/' + path
      : path
    : '';

const addSuffixSlash = (path?: string): string =>
  path && typeof path === 'string'
    ? path.charAt(path.length-1) !== '/'
      ? path + '/'
      : path
    : '';

function getUrlParams(path: string, pattern: string) {
  console.log('path:', path);
  const newP = addLeadingSlash(pattern);
  const newPath = addSuffixSlash(addLeadingSlash(path));
  const urlUtils = new UrlUtils(newP);

  if (urlUtils.match(newPath)) {
    return urlUtils.params;
  }

  const regexArr = urlUtils.regexStr.substring(1).split('(?:([^\\/]+?))');
  const patterns = [];
  let newPattern = '';
  for (let i=0; i < regexArr.length-1; i++) {
    newPattern = newPattern+regexArr[i];
    patterns.push(newPattern+'(?:([^\\/]+?))\\/');
  }

  for (let i=0; i < patterns.length; i++) {
    const regex = new RegExp(patterns[i]);
    const urlUtils2 = new UrlUtils('');
    urlUtils2.regexExp = regex;
    urlUtils2.keys = urlUtils.keys;
    if (urlUtils2.match(newPath)) {
      return urlUtils2.params;
    }
  }

  return {};
}

const pattern = 'staticOne/:paramOne/staticTwo/staticThree/:paramTwo'

// does not match the first static part: staticOne <> staticZero, returns {}
console.log(getUrlParams('staticZero/one', pattern))

// matched the first static and param part, returns {paramOne: 'one'}
console.log(getUrlParams('staticOne/one', pattern))

// matched the first static and param part with extra, returns {paramOne: 'one'}
console.log(getUrlParams('staticOne/one/staticThree/three', pattern))

// matched the first, second and third static + param parts
// returns {paramOne: 'one', paramTwo: 'two'}
console.log(getUrlParams('staticOne/one/staticTwo/staticThree/two', pattern))
