const object = {
  printName() {
    console.log("hyunseo");
  },
  name: "hyunseo",
};

// exports.hyunseoObject = object;
/**
 * {
 *  hyunseoObject: { printName: [Function: printName], name: 'hyunseo }
 * }
 */
// module.exports = object;
/**
 * {printName: [Function: printName], name: 'hyunseo}
 */

const a = {
  name: "hyunseo",
};

const name2 = "hyunseo2";
const b = { ...a, ...{ name2 } };
console.log(JSON.stringify(b, null, 2));
