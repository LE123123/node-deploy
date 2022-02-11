const referer =
  "http://localhost:8001/room/b2220289-1540-4ca4-872b-752715957bc1?password=gustj486!!";

console.log(referer.split("/")[referer.split("/").length - 1].replace(/\?.+/, ""));

const re = /\?.+/;
const Arr = referer.split("/")[referer.split("/").length - 1].match(re);
console.log(Arr);

const name = "이현서";
console.log(name.charCodeAt(0));
