const addA = require("./a");
addA();
addA();

const arr = [];
console.log(arr[0]);
arr[1] = "asdf";
if (arr[1]) {
  console.log("asdf");
}
