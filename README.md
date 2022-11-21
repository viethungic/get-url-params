# get-url-params
Parse routes dynamically and extract path params into a key/value mapping
**Usage**: parse routes dynamically and extract path params into a key/value mapping

**Context**: This function is used on our frontend to extract id, tab name etc, from the url path 

**Goal**

Design a **Typescript** function taking 2 arguments:

- `path` (string) extracted from a URL in the form `staticOne/one/staticTwo/staticThree/two`
- `pattern` (string) with **static portions** and **params** (starting with `:`) in the form `staticOne/:paramOne/staticTwo/staticThree/:paramTwo`

The function should return:

- A object with the param name as key (ex `paramTwo`) and its corresponding value (ex `two`)
- empty record `{}` if no parameters are found

The parameters are extracted from left to right and the function stops if 

- A static parts between `path` and `pattern` differ
- The `path` shape is shorter than the `pattern`'s

**Example**
```typescript
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
```
